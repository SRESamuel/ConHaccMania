"""Generate plausible wrong code solutions using Gemini API."""

import json
import os

import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))


async def generate_wrong_options(
    scenario: str,
    correct_code: str,
    language: str,
    count: int = 2,
) -> list[dict]:
    prompt = f"""You are helping an instructor create a code assessment.

SCENARIO (given to students):
{scenario}

CORRECT SOLUTION ({language}):
{correct_code}

Generate exactly {count} WRONG but plausible solutions in {language}.
Each wrong solution should look reasonable but have a specific flaw.
Make them different types of mistakes (e.g., wrong pattern, wrong architecture, missing validation).
Do NOT include any comments in the code. Pure code only, no inline comments, no block comments.

Return ONLY a JSON array. Each element must have:
- "code": the wrong implementation (string)
- "hint": a short 3-5 word label describing the approach (string)
- "why_wrong": explanation of why this solution is incorrect (string)

Return valid JSON only, no markdown, no explanation outside the array."""

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)

    text = response.text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0]

    return json.loads(text)
