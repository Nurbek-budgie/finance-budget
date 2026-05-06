from io import BytesIO

import openpyxl

from app.domain.models.raw_transaction import RawTransaction

# KICB statement layout (confirmed from statement.xlsx):
# Rows 1-11: metadata + bilingual headers  → skip
# Row 12+:   transaction data
# Col A: Operation #  (external_id)
# Col B: Value date   (DD.MM.YYYY)
# Col C: Sender/Beneficiary
# Col D: Description
# Col E: Amount       (signed float)
# Col F: Balance      (ignored)
_DATA_START_ROW = 12


class KICBExcelParser:
    def parse(self, content: bytes, filename: str) -> list[RawTransaction]:
        wb = openpyxl.load_workbook(BytesIO(content), data_only=True)
        ws = wb.active

        results: list[RawTransaction] = []

        for row in ws.iter_rows(min_row=_DATA_START_ROW, values_only=True):
            op_id, date_val, sender, description, amount, *_ = (*row, None, None, None, None, None, None)

            # Skip summary/footer rows: no numeric amount or no date or no op_id
            if not isinstance(amount, (int, float)):
                continue
            if not date_val or not op_id:
                continue

            results.append(
                RawTransaction(
                    external_id=str(op_id).strip() if op_id else "",
                    date_str=str(date_val).strip() if date_val else "",
                    sender=str(sender).strip() if sender else "",
                    description=str(description).strip() if description else "",
                    amount=float(amount),
                    source="kicb_excel",
                )
            )

        return results
