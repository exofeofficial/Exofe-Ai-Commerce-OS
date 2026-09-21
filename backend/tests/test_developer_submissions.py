"""Isolated API checks; never connects to the configured Supabase database."""
import unittest
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.api.v1.developer_submissions import router
from app.core.dependencies import CurrentUser, get_current_user
from app.core.exceptions import register_exception_handlers
from app.core.rate_limit import limiter
from app.database.session import get_db


class SubmissionTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        sql = (Path(__file__).resolve().parents[1] / "app/database/developer_submissions.sql").read_text().replace("UUID", "TEXT").replace("TIMESTAMPTZ", "TEXT").replace("NOW()", "CURRENT_TIMESTAMP")
        with self.engine.begin() as connection:
            for statement in sql.split(";"):
                if statement.strip():
                    connection.execute(text(statement))
        self.app = FastAPI()
        self.app.state.limiter = limiter
        self.old_limiter = limiter.enabled
        limiter.enabled = False
        register_exception_handlers(self.app)
        self.app.include_router(router)
        def database():
            with Session(self.engine) as session:
                yield session
        self.app.dependency_overrides[get_db] = database
        self.owner = CurrentUser(str(uuid4()), None, "owner")
        self.app.dependency_overrides[get_current_user] = lambda: self.owner
        self.client = TestClient(self.app)
        self.payload = dict(kind="app", name="Inventory Sync", summary="Keep inventory in sync.", description="Synchronize inventory between stores and warehouses.", version="1.0.0", category="Productivity", demoUrl="https://example.com/demo", packageUrl="https://example.com/package.zip", supportEmail="support@example.com", notes="")

    def tearDown(self):
        self.client.close()
        limiter.enabled = self.old_limiter
        self.engine.dispose()

    def create(self, **changes):
        result = self.client.post("/developers/submissions", json=self.payload | changes)
        self.assertEqual(result.status_code, 201, result.text)
        return result.json()

    def test_draft_edit_submit_and_lock(self):
        item = self.create()
        self.assertEqual(item["status"], "draft")
        path = "/developers/submissions/" + item["id"]
        edited = self.client.put(path, json=self.payload | {"name": "Updated app"})
        self.assertEqual(edited.status_code, 200)
        self.assertEqual(edited.json()["name"], "Updated app")
        submitted = self.client.post(path + "/submit")
        self.assertEqual(submitted.status_code, 200)
        self.assertEqual(submitted.json()["status"], "submitted")
        self.assertIsNotNone(submitted.json()["submittedAt"])
        self.assertEqual(self.client.put(path, json=self.payload).status_code, 404)
        self.assertEqual(self.client.post(path + "/submit").status_code, 404)
        self.assertEqual(len(self.client.get("/developers/submissions").json()["submissions"]), 1)

    def test_other_account_cannot_read_edit_or_submit(self):
        item = self.create(kind="theme", category="Store design")
        self.owner = CurrentUser(str(uuid4()), None, "owner")
        self.assertEqual(self.client.get("/developers/submissions").json()["submissions"], [])
        path = "/developers/submissions/" + item["id"]
        self.assertEqual(self.client.put(path, json=self.payload).status_code, 404)
        self.assertEqual(self.client.post(path + "/submit").status_code, 404)

    def test_validates_urls_and_rejects_client_status_or_owner(self):
        for changes in [{"demoUrl": "javascript:alert(1)"}, {"packageUrl": "http://example.com/file"}, {"demoUrl": "https://user:password@example.com"}, {"supportEmail": "bad"}, {"name": "   "}, {"status": "approved"}, {"userId": str(uuid4())}]:
            with self.subTest(changes=changes):
                self.assertEqual(self.client.post("/developers/submissions", json=self.payload | changes).status_code, 422)

    def test_anonymous_requests_are_rejected(self):
        self.app.dependency_overrides.pop(get_current_user)
        self.assertEqual(self.client.get("/developers/submissions").status_code, 401)
        self.assertEqual(self.client.post("/developers/submissions", json=self.payload).status_code, 401)


if __name__ == "__main__":
    unittest.main()
