"""Pydantic DTOs — schemas in src/quiz-api/CONTRACT.md."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class Quiz(BaseModel):
    id: UUID
    title: str
    course: str
    created_by: str
    created_at: datetime


class Solution(BaseModel):
    id: UUID
    label: str
    code: str
    language: str
    hint: Optional[str] = None
    is_correct: bool
    why_wrong: Optional[str] = None


class SolutionStudentView(BaseModel):
    id: UUID
    label: str
    code: str
    language: str
    hint: Optional[str] = None


class Question(BaseModel):
    id: UUID
    quiz_id: UUID
    scenario: str
    eval_criteria: Optional[str] = None
    solutions: list[Solution] = []


class QuestionStudentView(BaseModel):
    id: UUID
    quiz_id: UUID
    scenario: str
    eval_criteria: Optional[str] = None
    solutions: list[SolutionStudentView] = []


class QuizDetail(BaseModel):
    id: UUID
    title: str
    course: str
    created_by: str
    questions: list[Question] = []


class QuizDetailStudentView(BaseModel):
    id: UUID
    title: str
    course: str
    created_by: str
    questions: list[QuestionStudentView] = []


class CreateQuizDto(BaseModel):
    title: str
    course: str
    created_by: str


class CorrectSolutionInput(BaseModel):
    code: str
    language: str
    hint: Optional[str] = None


class CreateQuestionDto(BaseModel):
    scenario: str
    eval_criteria: Optional[str] = None
    correct_solution: CorrectSolutionInput


class UpdateQuestionDto(BaseModel):
    scenario: str
    eval_criteria: Optional[str] = None


class GenerateDto(BaseModel):
    count: int


class CreateSolutionDto(BaseModel):
    code: str
    language: str
    hint: Optional[str] = None
    why_wrong: Optional[str] = None


class GeneratedOption(BaseModel):
    code: str
    language: str
    hint: Optional[str] = None
    why_wrong: Optional[str] = None
