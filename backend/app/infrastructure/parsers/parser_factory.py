from app.infrastructure.parsers.base import FileParser
from app.infrastructure.parsers.csv_parser import CSVParser
from app.infrastructure.parsers.kicb_excel_parser import KICBExcelParser


class UnsupportedFormatError(ValueError):
    pass


def get_parser(filename: str) -> FileParser:
    name = filename.lower()
    if name.endswith(".xlsx"):
        return KICBExcelParser()
    if name.endswith(".csv"):
        return CSVParser()
    raise UnsupportedFormatError(f"Unsupported file format: {filename!r}. Accepted: .csv, .xlsx")
