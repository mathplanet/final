from django.db import migrations


CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS pending_users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL DEFAULT 'Designer',
    email VARCHAR(254),
    role VARCHAR(50) NOT NULL DEFAULT 'DESIGNER',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMPTZ,
    approved_by VARCHAR(50),
    rejected_reason VARCHAR(255)
);
"""

DROP_TABLE_SQL = """
DROP TABLE IF EXISTS pending_users;
"""


class Migration(migrations.Migration):

    dependencies = [
        ("project_app", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(CREATE_TABLE_SQL, DROP_TABLE_SQL),
    ]
