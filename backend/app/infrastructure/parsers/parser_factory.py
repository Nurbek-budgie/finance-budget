from io import BytesIO

import openpyxl

from app.infrastructure.parsers.base import FileParser
from app.infrastructure.parsers.csv_parser import CSVParser
from app.infrastructure.parsers.generic_excel_parser import GenericExcelParser
from app.infrastructure.parsers.kicb_excel_parser import KICBExcelParser


class UnsupportedFormatError(ValueError):
    pass


def _is_generic_excel(content: bytes) -> bool:
    """Return True if the first row contains a 'date' header → generic format."""
    try:
        wb = openpyxl.load_workbook(BytesIO(content), data_only=True, read_only=True)
        ws = wb.active
        first_row = next(ws.iter_rows(max_row=1, values_only=True), ())
        wb.close()
        return any(str(v).strip().lower() == "date" for v in first_row if v is not None)
    except Exception:
        return False


def get_parser(filename: str, content: bytes | None = None) -> FileParser:
    name = filename.lower()
    if name.endswith(".xlsx"):
        if content and _is_generic_excel(content):
            return GenericExcelParser()
        return KICBExcelParser()
    if name.endswith(".csv"):
        return CSVParser()
    raise UnsupportedFormatError(
        f"Unsupported file format: {filename!r}. Accepted: .csv, .xlsx"
    )
