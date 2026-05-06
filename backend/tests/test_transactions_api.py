"""Integration tests for /api/v1/transactions endpoints."""
import pytest

from tests.conftest import VALID_CSV


def upload(client, csv_content: str, filename: str = "data.csv"):
    return client.post(
        "/api/v1/transactions/upload",
        files={"file": (filename, csv_content.encode(), "text/csv")},
    )


class TestUpload:
    def test_valid_csv_creates_all_rows(self, client):
        resp = upload(client, VALID_CSV)
        assert resp.status_code == 200
        body = resp.json()
        assert body["created"] == 3
        assert body["errors"] == []
        assert body["total_processed"] == 3

    def test_rejects_non_csv_filename(self, client):
        resp = upload(client, VALID_CSV, filename="data.txt")
        assert resp.status_code == 400
        assert "csv" in resp.json()["detail"].lower()

    def test_bad_rows_are_reported_not_raised(self, client):
        csv = (
            "date,description,amount,type\n"
            "2024-01-01,Good,100.00,income\n"
            "not-a-date,Bad date,50.00,expense\n"
            "2024-01-03,Bad amount,abc,income\n"
            "2024-01-04,Bad type,99.00,unknown\n"
            "2024-01-05,Also Good,200.00,expense\n"
        )
        resp = upload(client, csv)
        assert resp.status_code == 200
        body = resp.json()
        assert body["created"] == 2
        assert len(body["errors"]) == 3
        assert body["total_processed"] == 5

    def test_all_bad_rows_returns_zero_created(self, client):
        csv = "date,description,amount,type\nnope,nope,nope,nope\n"
        resp = upload(client, csv)
        assert resp.status_code == 200
        assert resp.json()["created"] == 0

    def test_empty_csv_returns_zero(self, client):
        resp = upload(client, "date,description,amount,type\n")
        assert resp.status_code == 200
        assert resp.json()["created"] == 0

    def test_type_is_case_insensitive(self, client):
        csv = "date,description,amount,type\n2024-01-01,Salary,1000.00,INCOME\n"
        resp = upload(client, csv)
        assert resp.status_code == 200
        assert resp.json()["created"] == 1


class TestListTransactions:
    def test_empty_db_returns_empty_list(self, client):
        resp = client.get("/api/v1/transactions/")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_returns_uploaded_transactions(self, client):
        upload(client, VALID_CSV)
        resp = client.get("/api/v1/transactions/")
        assert resp.status_code == 200
        assert len(resp.json()) == 3

    def test_response_shape(self, client):
        upload(client, VALID_CSV)
        item = client.get("/api/v1/transactions/").json()[0]
        assert set(item.keys()) == {"id", "date", "description", "amount", "transaction_type"}

    def test_sorted_by_date_descending(self, client):
        upload(client, VALID_CSV)
        dates = [t["date"] for t in client.get("/api/v1/transactions/").json()]
        assert dates == sorted(dates, reverse=True)

    def test_limit_and_offset(self, client):
        upload(client, VALID_CSV)
        resp = client.get("/api/v1/transactions/?limit=2&offset=0")
        assert len(resp.json()) == 2

        resp2 = client.get("/api/v1/transactions/?limit=2&offset=2")
        assert len(resp2.json()) == 1

    def test_transaction_types_are_strings(self, client):
        upload(client, VALID_CSV)
        types = {t["transaction_type"] for t in client.get("/api/v1/transactions/").json()}
        assert types == {"income", "expense"}


class TestDeleteTransaction:
    def test_delete_existing_returns_deleted_true(self, client):
        upload(client, VALID_CSV)
        transaction_id = client.get("/api/v1/transactions/").json()[0]["id"]
        resp = client.delete(f"/api/v1/transactions/{transaction_id}")
        assert resp.status_code == 200
        assert resp.json() == {"deleted": True}

    def test_delete_removes_from_list(self, client):
        upload(client, VALID_CSV)
        transaction_id = client.get("/api/v1/transactions/").json()[0]["id"]
        client.delete(f"/api/v1/transactions/{transaction_id}")
        remaining_ids = [t["id"] for t in client.get("/api/v1/transactions/").json()]
        assert transaction_id not in remaining_ids

    def test_delete_nonexistent_returns_404(self, client):
        resp = client.delete("/api/v1/transactions/does-not-exist")
        assert resp.status_code == 404

    def test_delete_same_id_twice_returns_404(self, client):
        upload(client, VALID_CSV)
        transaction_id = client.get("/api/v1/transactions/").json()[0]["id"]
        client.delete(f"/api/v1/transactions/{transaction_id}")
        resp = client.delete(f"/api/v1/transactions/{transaction_id}")
        assert resp.status_code == 404
