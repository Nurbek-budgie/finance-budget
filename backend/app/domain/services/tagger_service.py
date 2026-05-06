from typing import Optional

from app.domain.models.raw_transaction import RawTransaction
from app.domain.models.tag_rule import TagRule


class TaggerService:
    """
    Rule-based tagger. Rules are matched against the concatenation of
    sender + description (case-insensitive substring match).
    Returns (category, confidence) where confidence is 1.0 on match, 0.0 on miss.
    """

    def tag(
        self, raw: RawTransaction, rules: list[TagRule]
    ) -> tuple[Optional[str], float]:
        haystack = f"{raw.sender} {raw.description}".lower()

        # Rules are expected pre-sorted by priority descending by the caller
        for rule in rules:
            if rule.keyword.lower() in haystack:
                return rule.category, 1.0

        return None, 0.0
