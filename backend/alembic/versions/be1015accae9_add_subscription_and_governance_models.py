"""Generic Alembic revision script."""

from alembic import op
import sqlalchemy as sa

revision = 'be1015accae9'
down_revision = '008308170480'
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

