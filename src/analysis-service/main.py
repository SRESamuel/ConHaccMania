from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NewGenLearning - Analysis Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/analysis/validate")
async def validate_reasoning():
    """Validate a submission's reasoning using Claude CLI."""
    pass


@app.get("/api/analysis/{submission_id}")
async def get_analysis(submission_id: str):
    """Get analysis results for a submission."""
    pass


@app.post("/api/analysis/generate-distractors")
async def generate_distractors():
    """Generate plausible wrong answers from correct solution using Gemini."""
    pass


@app.get("/api/analysis/dashboard")
async def get_dashboard(quiz_id: str = None):
    """Aggregated analysis results for instructor dashboard."""
    pass
