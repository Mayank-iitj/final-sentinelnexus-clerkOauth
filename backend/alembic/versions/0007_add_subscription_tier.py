"""Add subscription_tier column to users table."""

from alembic import op
import sqlalchemy as sa


revision = "0007_add_subscription_tier"
down_revision = "be1015accae9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "subscription_tier",
            sa.String(length=50),
            nullable=False,
            server_default="free",
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "subscription_tier")
