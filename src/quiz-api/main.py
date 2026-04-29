from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NewGenLearning - Quiz API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/quizzes")
async def list_quizzes():
    """List all quizzes."""
    pass


@app.post("/api/quizzes")
async def create_quiz():
    """Create a new quiz (instructor)."""
    pass


@app.get("/api/quizzes/{quiz_id}")
async def get_quiz(quiz_id: str):
    """Get quiz with all questions."""
    pass


@app.post("/api/quizzes/{quiz_id}/questions")
async def add_question(quiz_id: str):
    """Add a question to a quiz."""
    pass


@app.put("/api/questions/{question_id}")
async def update_question(question_id: str):
    """Update a question."""
    pass
