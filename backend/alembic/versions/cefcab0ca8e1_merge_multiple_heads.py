"""Generic Alembic revision script."""

from alembic import op
import sqlalchemy as sa

revision = 'cefcab0ca8e1'
down_revision = ('0007_add_subscription_tier', '6c078ceec1f2')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

