from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NewGenLearning - Submission API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/submissions")
async def submit_answers():
    """Submit quiz answers + reasoning."""
    pass


@app.get("/api/submissions")
async def list_submissions(quiz_id: str = None):
    """List submissions, optionally filtered by quiz_id (instructor)."""
    pass


@app.get("/api/submissions/{submission_id}")
async def get_submission(submission_id: str):
    """Get a single submission."""
    pass
