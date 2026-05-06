from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.domain.models.tag_rule import TagRule
from app.domain.repositories.tag_rule_repository import TagRuleRepository
from app.infrastructure.database.connection import get_db
from app.infrastructure.persistence.tag_rule_repository_impl import TagRuleRepositoryImpl

router = APIRouter(prefix="/tag-rules", tags=["tag-rules"])


class TagRuleResponse(BaseModel):
    id: str
    keyword: str
    category: str
    priority: int
    is_active: bool


class CreateTagRuleRequest(BaseModel):
    keyword: str
    category: str
    priority: int = 5


def get_repo(db: Session = Depends(get_db)) -> TagRuleRepository:
    return TagRuleRepositoryImpl(db)


def _to_response(rule: TagRule) -> TagRuleResponse:
    return TagRuleResponse(
        id=rule.id,
        keyword=rule.keyword,
        category=rule.category,
        priority=rule.priority,
        is_active=rule.is_active,
    )


@router.get("/", response_model=List[TagRuleResponse])
def list_tag_rules(repo: TagRuleRepository = Depends(get_repo)):
    return [_to_response(r) for r in repo.get_all()]


@router.post("/", response_model=TagRuleResponse, status_code=201)
def create_tag_rule(
    body: CreateTagRuleRequest,
    repo: TagRuleRepository = Depends(get_repo),
):
    rule = repo.create(TagRule(keyword=body.keyword, category=body.category, priority=body.priority))
    return _to_response(rule)


@router.delete("/{rule_id}", status_code=204)
def delete_tag_rule(rule_id: str, repo: TagRuleRepository = Depends(get_repo)):
    if not repo.delete(rule_id):
        raise HTTPException(status_code=404, detail="Tag rule not found")
