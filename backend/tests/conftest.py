import os

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key")
os.environ.setdefault("ALLOWED_HOSTS", '["localhost", "127.0.0.1", "testserver"]')

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def _override_redis():
    class DummyRedis:
        async def ping(self):
            return True

        async def aclose(self):
            # Match the Redis.asyncio interface used in app.shutdown.
            return None

    return DummyRedis()


# Access .state on the inner FastAPI app (since outer app is CORSMiddleware)
app.app.state.redis = _override_redis()


def pytest_sessionstart(session):
    # in tests we don't run Alembic; health endpoint uses engine to SELECT 1
    pass


import pytest  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c

