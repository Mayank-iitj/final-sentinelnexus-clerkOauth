"""Add projects, reports tables; update scans and alerts with new columns."""

from alembic import op
import sqlalchemy as sa


revision = "0002_add_projects_reports_notifications"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── projects table ─────────────────────────────────────────────────────
    op.create_table(
        "projects",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("owner_id", sa.String(length=36), nullable=False),
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("risk_level", sa.String(length=16), nullable=False, server_default="'low'"),
        sa.Column("scan_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("open_finding_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("metadata", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_projects_owner_id", "projects", ["owner_id"])

    # ── Update scans table (SQLite batch mode) ─────────────────────────────
    with op.batch_alter_table("scans") as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column("project_id", sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column("scan_type", sa.String(length=16), nullable=False, server_default="'code'"))
        batch_op.add_column(sa.Column("cvss_max_score", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("finding_count", sa.Integer(), nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("duration_ms", sa.Integer(), nullable=True))
    op.create_index("ix_scans_user_id", "scans", ["user_id"])
    op.create_index("ix_scans_project_id", "scans", ["project_id"])

    # ── Update alerts table (SQLite batch mode) ─────────────────────────────
    with op.batch_alter_table("alerts") as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column("scan_id", sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column("alert_type", sa.String(length=32), nullable=False, server_default="'code_finding'"))
        batch_op.add_column(sa.Column("cvss_score", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("link", sa.String(length=1024), nullable=True))
        batch_op.add_column(sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("0")))
    op.create_index("ix_alerts_user_id", "alerts", ["user_id"])
    op.create_index("ix_alerts_scan_id", "alerts", ["scan_id"])

    # ── reports table ──────────────────────────────────────────────────────
    op.create_table(
        "reports",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("scan_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("format", sa.String(length=8), nullable=False, server_default="'pdf'"),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="'generating'"),
        sa.Column("file_path", sa.String(length=1024), nullable=True),
        sa.Column("file_size_bytes", sa.Integer(), nullable=True),
        sa.Column("finding_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_cvss", sa.Float(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.ForeignKeyConstraint(["scan_id"], ["scans.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_reports_scan_id", "reports", ["scan_id"])
    op.create_index("ix_reports_user_id", "reports", ["user_id"])


def downgrade() -> None:
    op.drop_table("reports")
    op.drop_index("ix_alerts_scan_id", table_name="alerts")
    op.drop_index("ix_alerts_user_id", table_name="alerts")
    with op.batch_alter_table("alerts") as batch_op:
        batch_op.drop_column("is_read")
        batch_op.drop_column("link")
        batch_op.drop_column("cvss_score")
        batch_op.drop_column("alert_type")
        batch_op.drop_column("scan_id")
        batch_op.drop_column("user_id")
    op.drop_index("ix_scans_project_id", table_name="scans")
    op.drop_index("ix_scans_user_id", table_name="scans")
    with op.batch_alter_table("scans") as batch_op:
        batch_op.drop_column("duration_ms")
        batch_op.drop_column("finding_count")
        batch_op.drop_column("cvss_max_score")
        batch_op.drop_column("scan_type")
        batch_op.drop_column("project_id")
        batch_op.drop_column("user_id")
    op.drop_index("ix_projects_owner_id", table_name="projects")
    op.drop_table("projects")
