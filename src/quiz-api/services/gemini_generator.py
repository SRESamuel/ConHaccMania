"""Gemini API wrapper for generating plausible wrong options.

Uses google-generativeai with response_mime_type=application/json so the model
returns parseable JSON directly. Sponsor-prize integration (Gemini track).
"""

import json
import os
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[3] / ".env")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set in .env")

genai.configure(api_key=GEMINI_API_KEY)

PROMPT_TEMPLATE_PATH = (
    Path(__file__).resolve().parent.parent / "prompts" / "distractor_prompt.txt"
)
GEMINI_MODEL = "gemini-2.0-flash"


class GeneratorError(RuntimeError):
    pass


def _load_template() -> str:
    return PROMPT_TEMPLATE_PATH.read_text(encoding="utf-8")


def generate(
    *,
    scenario: str,
    correct_code: str,
    language: str,
    count: int = 3,
) -> list[dict]:
    """Ask Gemini for `count` plausible wrong solutions.

    Returns a list of dicts with keys: code, language, hint, why_wrong.
    Raises GeneratorError on parsing or API failure.
    """
    prompt = _load_template().format(
        scenario=scenario,
        correct_code=correct_code,
        language=language,
        count=count,
    )

    model = genai.GenerativeModel(GEMINI_MODEL)
    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.7,
            },
        )
    except Exception as e:
        raise GeneratorError(f"Gemini API call failed: {e}")

    text = (response.text or "").strip()
    if text.startswith("```"):
        text = text.strip("`").lstrip("json").strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise GeneratorError(f"could not parse Gemini JSON: {e}\nresponse: {text[:500]}")

    if isinstance(data, dict) and "options" in data:
        options = data["options"]
    elif isinstance(data, list):
        options = data
    else:
        raise GeneratorError(f"unexpected Gemini response shape: {text[:300]}")

    cleaned: list[dict] = []
    for o in options:
        if not isinstance(o, dict):
            continue
        cleaned.append({
            "code": str(o.get("code", "")),
            "language": str(o.get("language", language)),
            "hint": (str(o["hint"]) if o.get("hint") else None),
            "why_wrong": (str(o["why_wrong"]) if o.get("why_wrong") else None),
        })
    return cleaned
