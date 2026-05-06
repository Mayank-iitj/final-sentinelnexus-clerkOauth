"""Generic Alembic revision script."""

from alembic import op
import sqlalchemy as sa

revision = '008308170480'
down_revision = '0003_user_oauth_extensions'
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

