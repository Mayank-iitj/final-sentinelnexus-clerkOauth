"""Add avatar_url, oauth_provider2, oauth_provider_id2 columns to users table."""

from alembic import op
import sqlalchemy as sa


revision = "0003_user_oauth_extensions"
down_revision = "0002_add_projects_reports_notifs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_url", sa.String(length=2048), nullable=True))
    op.add_column("users", sa.Column("oauth_provider2", sa.String(length=32), nullable=True))
    op.add_column("users", sa.Column("oauth_provider_id2", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "oauth_provider_id2")
    op.drop_column("users", "oauth_provider2")
    op.drop_column("users", "avatar_url")
