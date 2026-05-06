import os
from dataclasses import dataclass, field
from datetime import datetime

from app.domain.models.raw_transaction import RawTransaction
from app.domain.models.staged_transaction import StagedTransaction
from app.domain.models.transaction import Transaction, TransactionType
from app.domain.repositories.staged_transaction_repository import StagedTransactionRepository
from app.domain.repositories.tag_rule_repository import TagRuleRepository
from app.domain.repositories.transaction_repository import TransactionRepository
from app.domain.services.tagger_service import TaggerService
from app.infrastructure.parsers.base import FileParser

_CONFIDENCE_THRESHOLD = float(os.getenv("TAGGER_CONFIDENCE_THRESHOLD", "0.5"))

# KICB dates arrive as "DD.MM.YYYY"; CSV dates as ISO "YYYY-MM-DD[THH:MM:SS]"
_DATE_FORMATS = ["%d.%m.%Y", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S"]


def _parse_date(date_str: str) -> datetime:
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    # Last-resort: fromisoformat handles many variants
    return datetime.fromisoformat(date_str)


@dataclass
class IngestionResult:
    committed: int = 0
    staged: int = 0
    skipped_duplicates: int = 0
    errors: list[str] = field(default_factory=list)


class IngestionService:
    def __init__(
        self,
        parser: FileParser,
        transaction_repo: TransactionRepository,
        staged_repo: StagedTransactionRepository,
        tag_rule_repo: TagRuleRepository,
        tagger: TaggerService,
    ):
        self.parser = parser
        self.transaction_repo = transaction_repo
        self.staged_repo = staged_repo
        self.tag_rule_repo = tag_rule_repo
        self.tagger = tagger

    def ingest(self, content: bytes, filename: str) -> IngestionResult:
        result = IngestionResult()
        raw_rows = self.parser.parse(content, filename)
        rules = self.tag_rule_repo.get_active_rules()

        to_commit: list[Transaction] = []
        to_stage: list[StagedTransaction] = []

        for i, raw in enumerate(raw_rows):
            try:
                # Deduplication: skip if already committed or already waiting in staging
                if raw.external_id and (
                    self.transaction_repo.exists_by_external_id(raw.external_id)
                    or self.staged_repo.exists_by_external_id(raw.external_id)
                ):
                    result.skipped_duplicates += 1
                    continue

                date = _parse_date(raw.date_str)
                tx_type = TransactionType.INCOME if raw.amount >= 0 else TransactionType.EXPENSE
                amount = abs(raw.amount)

                category, confidence = self.tagger.tag(raw, rules)

                if confidence >= _CONFIDENCE_THRESHOLD:
                    to_commit.append(
                        Transaction(
                            date=date,
                            description=raw.description,
                            amount=amount,
                            transaction_type=tx_type,
                            category=category,
                        )
                    )
                    # Store external_id for future dedup — set it via attribute after construction
                    to_commit[-1]._external_id = raw.external_id
                else:
                    to_stage.append(
                        StagedTransaction(
                            date=date,
                            description=raw.description,
                            amount=amount,
                            transaction_type=tx_type,
                            external_id=raw.external_id,
                            source_file=filename,
                            suggested_category=category,
                            confidence_score=confidence,
                        )
                    )

            except Exception as e:
                result.errors.append(f"Row {i + 1}: {e}")

        if to_commit:
            self.transaction_repo.create_many_with_external_ids(to_commit)
            result.committed = len(to_commit)

        if to_stage:
            self.staged_repo.create_many(to_stage)
            result.staged = len(to_stage)

        return result
