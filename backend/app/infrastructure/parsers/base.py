from typing import Protocol

from app.domain.models.raw_transaction import RawTransaction


class FileParser(Protocol):
    def parse(self, content: bytes, filename: str) -> list[RawTransaction]: ...
