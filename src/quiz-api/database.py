"""asyncpg connection pool, loaded from DATABASE_URL in repo-root .env."""

import os
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

# Repo root is 3 levels up: src/quiz-api/database.py -> src/quiz-api -> src -> repo
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

DATABASE_URL = os.environ["DATABASE_URL"]

_pool: asyncpg.Pool | None = None


async def open_pool() -> asyncpg.Pool:
    global _pool
    _pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("DB pool not initialized — call open_pool() in lifespan")
    return _pool
