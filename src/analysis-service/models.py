"""Pydantic DTOs — schemas in src/analysis-service/CONTRACT.md."""

from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ValidateDto(BaseModel):
    quiz_id: UUID


class ValidateResponse(BaseModel):
    analyzed: int


class PerAnswerAnalysis(BaseModel):
    answer_id: UUID
    score: Optional[int] = None
    strengths: list[str] = []
    gaps: list[str] = []
    is_ai_generated: bool = False
    confidence: Optional[float] = None


class OverallAnalysis(BaseModel):
    strengths: list[str] = []
    areas_for_improvement: list[str] = []
    recommended_topics: list[str] = []


class AnalysisDetail(BaseModel):
    id: UUID
    submission_id: UUID
    status: str
    overall_score: Optional[float] = None
    overall: Optional[OverallAnalysis] = None
    per_answer: list[PerAnswerAnalysis] = []


class CommonGap(BaseModel):
    gap: str
    count: int


class DashboardData(BaseModel):
    total_submissions: int
    analyzed_count: int
    average_score: Optional[float] = None
    common_gaps: list[CommonGap] = []
    ai_flag_count: int
