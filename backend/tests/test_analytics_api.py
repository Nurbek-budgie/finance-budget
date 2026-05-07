"""Integration tests for /api/v1/analytics endpoints."""
import pytest

from tests.conftest import VALID_CSV


def upload(client, csv_content: str = VALID_CSV):
    client.post(
        "/api/v1/transactions/upload",
        files={"file": ("data.csv", csv_content.encode(), "text/csv")},
    )


class TestSummary:
    def test_empty_db_returns_zeros(self, client):
        resp = client.get("/api/v1/analytics/summary")
        assert resp.status_code == 200
        assert resp.json() == {
            "total_income": 0,
            "total_expenses": 0,
            "balance": 0,
            "transaction_count": 0,
        }

    def test_summary_shape(self, client):
        upload(client)
        body = resp = client.get("/api/v1/analytics/summary").json()
        assert set(body.keys()) == {"total_income", "total_expenses", "balance", "transaction_count"}

    def test_income_and_expense_totals(self, client):
        # VALID_CSV: income 5000 + 1200 = 6200, expense 85.50
        upload(client)
        body = client.get("/api/v1/analytics/summary").json()
        assert body["total_income"] == pytest.approx(6200.0)
        assert body["total_expenses"] == pytest.approx(85.50)

    def test_balance_is_income_minus_expenses(self, client):
        upload(client)
        body = client.get("/api/v1/analytics/summary").json()
        assert body["balance"] == pytest.approx(body["total_income"] - body["total_expenses"])

    def test_transaction_count(self, client):
        upload(client)
        body = client.get("/api/v1/analytics/summary").json()
        assert body["transaction_count"] == 3

    def test_summary_updates_after_second_upload(self, client):
        upload(client)
        extra = "date,description,amount,type\n2024-03-01,Bonus,500.00,income\n"
        upload(client, extra)
        body = client.get("/api/v1/analytics/summary").json()
        assert body["transaction_count"] == 4
        assert body["total_income"] == pytest.approx(6700.0)

    def test_summary_updates_after_delete(self, client):
        upload(client)
        transactions = client.get("/api/v1/transactions/").json()["items"]
        income_id = next(t["id"] for t in transactions if t["transaction_type"] == "income")
        income_amount = next(t["amount"] for t in transactions if t["id"] == income_id)

        client.delete(f"/api/v1/transactions/{income_id}")

        body = client.get("/api/v1/analytics/summary").json()
        assert body["transaction_count"] == 2
        assert body["total_income"] == pytest.approx(6200.0 - income_amount)


class TestBalance:
    def test_empty_db_returns_zero(self, client):
        resp = client.get("/api/v1/analytics/balance")
        assert resp.status_code == 200
        assert resp.json() == {"balance": 0}

    def test_balance_matches_summary(self, client):
        upload(client)
        balance = client.get("/api/v1/analytics/balance").json()["balance"]
        summary_balance = client.get("/api/v1/analytics/summary").json()["balance"]
        assert balance == pytest.approx(summary_balance)

    def test_balance_can_be_negative(self, client):
        csv = "date,description,amount,type\n2024-01-01,Bills,9999.00,expense\n"
        upload(client, csv)
        balance = client.get("/api/v1/analytics/balance").json()["balance"]
        assert balance == pytest.approx(-9999.0)
