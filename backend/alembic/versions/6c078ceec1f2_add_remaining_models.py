"""Generic Alembic revision script."""

from alembic import op
import sqlalchemy as sa

revision = '6c078ceec1f2'
down_revision = 'be1015accae9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

