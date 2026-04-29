"""Pydantic DTOs — schemas in src/submission-api/CONTRACT.md."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class Submission(BaseModel):
    id: UUID
    quiz_id: UUID
    student_name: str
    submitted_at: datetime


class Answer(BaseModel):
    id: UUID
    question_id: UUID
    selected_solution_id: UUID
    reasoning: str


class SubmissionDetail(BaseModel):
    id: UUID
    quiz_id: UUID
    student_name: str
    submitted_at: datetime
    answers: list[Answer] = []


class AnswerInput(BaseModel):
    question_id: UUID
    selected_solution_id: UUID
    reasoning: str


class CreateSubmissionDto(BaseModel):
    quiz_id: UUID
    student_name: str
    answers: list[AnswerInput]
