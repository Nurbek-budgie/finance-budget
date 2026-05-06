"""add_ingestion_pipeline_tables

Revision ID: edb560944815
Revises: af4286d16fc6
Create Date: 2026-05-06 20:05:31.378623

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'edb560944815'
down_revision: Union[str, None] = 'af4286d16fc6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # stagedstatus enum is new; transactiontype already exists — skip it
    conn.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE stagedstatus AS ENUM ('pending', 'approved', 'rejected');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
    """))

    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS staged_transactions (
            id VARCHAR PRIMARY KEY,
            date TIMESTAMP NOT NULL,
            description VARCHAR NOT NULL,
            amount FLOAT NOT NULL,
            transaction_type transactiontype NOT NULL,
            external_id VARCHAR,
            source_file VARCHAR,
            suggested_category VARCHAR,
            confidence_score FLOAT NOT NULL DEFAULT 0.0,
            status stagedstatus NOT NULL DEFAULT 'pending',
            staged_at TIMESTAMP
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_staged_transactions_id ON staged_transactions (id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_staged_transactions_date ON staged_transactions (date)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_staged_transactions_external_id ON staged_transactions (external_id)"))

    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS tag_rules (
            id VARCHAR PRIMARY KEY,
            keyword VARCHAR NOT NULL,
            category VARCHAR NOT NULL,
            priority INTEGER NOT NULL DEFAULT 5,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP
        )
    """))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_tag_rules_id ON tag_rules (id)"))

    op.add_column('transactions', sa.Column('external_id', sa.String(), nullable=True))
    conn.execute(sa.text("CREATE UNIQUE INDEX IF NOT EXISTS ix_transactions_external_id ON transactions (external_id) WHERE external_id IS NOT NULL"))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_transactions_external_id"))
    op.drop_column('transactions', 'external_id')
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_tag_rules_id"))
    conn.execute(sa.text("DROP TABLE IF EXISTS tag_rules"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_staged_transactions_id"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_staged_transactions_external_id"))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_staged_transactions_date"))
    conn.execute(sa.text("DROP TABLE IF EXISTS staged_transactions"))
    conn.execute(sa.text("DROP TYPE IF EXISTS stagedstatus"))
