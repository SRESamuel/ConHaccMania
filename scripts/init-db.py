"""Run init-db.sql against Neon. Usage: py scripts/init-db.py"""

import asyncio
import os
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


async def main():
    url = os.environ["DATABASE_URL"]
    sql = (Path(__file__).parent / "init-db.sql").read_text()

    conn = await asyncpg.connect(url)
    try:
        await conn.execute(sql)
        print("Tables created successfully.")

        # Verify
        rows = await conn.fetch(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' ORDER BY table_name"
        )
        print(f"Tables: {[r['table_name'] for r in rows]}")
    finally:
        await conn.close()


asyncio.run(main())
