"""
╔══════════════════════════════════════════════════════════════════╗
║  Throughput (RPS) Load Test - Spring Boot Orchestrator          ║
║  For IEEE Paper: Smart Agriculture Monitoring System            ║
║                                                                 ║
║  Target:  http://localhost:8080 (Spring Boot)                   ║
║  Method:  Locust load test with 50-100 concurrent users         ║
╚══════════════════════════════════════════════════════════════════╝

Prerequisites:
  - Spring Boot running:  cd backend/agro && mvn spring-boot:run
  - FastAPI ML service running:  cd backend/python-ml-service && uvicorn main:app --port 8001
  - MySQL running with configured credentials
  - pip install locust

Usage (headless CLI mode for reproducible results):
  locust -f locustfile.py --headless -u 100 -r 10 --run-time 2m --host http://localhost:8080

  -u 100       = 100 concurrent users
  -r 10        = spawn 10 users/second
  --run-time   = stop after 2 minutes

Usage (Web UI mode):
  locust -f locustfile.py
  Then open http://localhost:8089 and configure users + ramp-up.

The "Requests/s" column in the output = Maximum Throughput for the IEEE paper.
"""

from locust import HttpUser, task, between, events
import time


class AgroSystemUser(HttpUser):
    """Simulates a frontend user polling the Spring Boot orchestrator."""

    # Realistic wait between actions: dashboard polls every 5 seconds
    wait_time = between(1, 3)

    # ─── Authentication ─────────────────────────────────────────
    def on_start(self):
        """Login to get JWT token (if auth is required)."""
        try:
            resp = self.client.post("/api/auth/login", json={
                "username": "admin",
                "password": "password123"
            }, catch_response=True)
            if resp.status_code == 200:
                data = resp.json()
                self.token = data.get("token", "")
                self.headers = {"Authorization": f"Bearer {self.token}"}
                resp.success()
            else:
                # If auth fails, proceed without token (some endpoints may be open)
                self.token = ""
                self.headers = {}
                resp.success()  # Don't count auth failure as test failure
        except Exception:
            self.token = ""
            self.headers = {}

    # ─── Primary task: Field data polling (mirrors frontend) ────
    @task(5)
    def get_field_analytics(self):
        """
        GET /api/v1/analytics/fields
        This is the most frequent operation: the dashboard polls every 5s.
        Weight=5 to make this the dominant request.
        """
        self.client.get("/api/v1/analytics/fields", headers=self.headers)

    # ─── Secondary task: Trigger simulation step ────────────────
    @task(2)
    def trigger_simulation(self):
        """
        GET /api/v1/analytics/start
        Triggers a simulation cycle (Spring Boot -> Python ML -> MySQL).
        """
        self.client.get("/api/v1/analytics/start", headers=self.headers)

    # ─── Tertiary task: Disease prediction via Spring Boot proxy ─
    @task(1)
    def predict_disease(self):
        """
        POST /api/v1/predict/disease
        Disease prediction routed through Spring Boot to FastAPI.
        """
        payload = {
            "ndvi": 0.72,
            "temperature": 28.5,
            "moisture": 55.0,
            "n": 65.0,
            "p": 42.0,
            "k": 48.0,
            "rainfall": 35.0,
            "ph": 6.5
        }
        self.client.post("/api/v1/predict/disease",
                         json=payload, headers=self.headers)

    # ─── Field detail view ──────────────────────────────────────
    @task(1)
    def get_single_field(self):
        """
        GET /api/v1/analytics/fields/{id}
        Simulates a user clicking on a specific field.
        """
        import random
        field_id = random.randint(1, 5)
        self.client.get(f"/api/v1/analytics/fields/{field_id}",
                        headers=self.headers)
