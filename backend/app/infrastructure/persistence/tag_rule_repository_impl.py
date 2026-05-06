import uuid
from typing import List, Optional

from sqlalchemy.orm import Session

from app.domain.models.tag_rule import TagRule
from app.domain.repositories.tag_rule_repository import TagRuleRepository
from app.infrastructure.database.models import TagRuleORM


def _to_domain(orm: TagRuleORM) -> TagRule:
    return TagRule(
        id=orm.id,
        keyword=orm.keyword,
        category=orm.category,
        priority=orm.priority,
        is_active=orm.is_active,
    )


class TagRuleRepositoryImpl(TagRuleRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_active_rules(self) -> List[TagRule]:
        rows = (
            self.db.query(TagRuleORM)
            .filter(TagRuleORM.is_active.is_(True))
            .order_by(TagRuleORM.priority.desc())
            .all()
        )
        return [_to_domain(r) for r in rows]

    def get_all(self) -> List[TagRule]:
        rows = self.db.query(TagRuleORM).order_by(TagRuleORM.priority.desc()).all()
        return [_to_domain(r) for r in rows]

    def get_by_id(self, rule_id: str) -> Optional[TagRule]:
        row = self.db.query(TagRuleORM).filter(TagRuleORM.id == rule_id).first()
        return _to_domain(row) if row else None

    def create(self, rule: TagRule) -> TagRule:
        orm = TagRuleORM(
            id=rule.id or str(uuid.uuid4()),
            keyword=rule.keyword,
            category=rule.category,
            priority=rule.priority,
            is_active=rule.is_active,
        )
        self.db.add(orm)
        self.db.commit()
        self.db.refresh(orm)
        return _to_domain(orm)

    def delete(self, rule_id: str) -> bool:
        row = self.db.query(TagRuleORM).filter(TagRuleORM.id == rule_id).first()
        if not row:
            return False
        self.db.delete(row)
        self.db.commit()
        return True
