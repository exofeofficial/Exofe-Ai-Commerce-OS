"""Run with python -m app.scripts.migrate_developer_submissions before serving the portal."""
from pathlib import Path
from sqlalchemy import text
from app.database.session import engine


def main():
    sql = (Path(__file__).resolve().parents[1] / "database" / "developer_submissions.sql").read_text(encoding="utf-8")
    with engine.begin() as connection:
        connection.execute(text(sql))
    print("Developer submissions schema ready.")


if __name__ == "__main__":
    main()
