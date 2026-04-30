"""Claude CLI subprocess wrapper.

Spawns `claude -p <prompt> --output-format json` with stdin=DEVNULL (avoids the
3s stdin wait), parses the two-layer JSON wrapper, and returns the per-answer
validation dict.

Uses the user's Claude subscription via the CLI — no API key, no cost.
"""

import json
import subprocess
import tempfile
from pathlib import Path

PROMPT_TEMPLATE_PATH = Path(__file__).resolve().parent.parent / "prompts" / "validation_prompt.txt"
CLAUDE_TIMEOUT_SECONDS = 60


class ValidatorError(RuntimeError):
    pass


def _load_template() -> str:
    return PROMPT_TEMPLATE_PATH.read_text(encoding="utf-8")


def build_prompt(
    *,
    scenario: str,
    solutions: list[dict],
    correct_label: str,
    selected_label: str,
    reasoning: str,
    eval_criteria: str | None,
) -> str:
    """Render the validation prompt with the given context."""
    solutions_block = "\n\n".join(
        f"Option {s['label']} ({s['language']}):\n{s['code']}"
        for s in solutions
    )
    return _load_template().format(
        scenario=scenario,
        solutions_block=solutions_block,
        correct_label=correct_label,
        selected_label=selected_label,
        reasoning=reasoning,
        eval_criteria=(eval_criteria or "(no specific criteria provided — use general reasoning quality)"),
    )


def validate(prompt: str) -> dict:
    """Run the Claude CLI on the prompt; return the parsed validation JSON.

    Returns a dict with keys: score (int), strengths (list[str]), gaps (list[str]),
    is_ai_generated (bool), confidence (float).
    """
    claude_bin = str(Path(__file__).resolve().parent.parent / "node_modules" / ".bin" / "claude.cmd")

    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False, encoding="utf-8") as f:
        f.write(prompt)
        prompt_file = f.name

    try:
        proc = subprocess.run(
            f'type "{prompt_file}" | "{claude_bin}" -p - --output-format json',
            capture_output=True,
            text=True,
            timeout=CLAUDE_TIMEOUT_SECONDS,
            shell=True,
        )
    finally:
        Path(prompt_file).unlink(missing_ok=True)
    if proc.returncode != 0:
        raise ValidatorError(f"claude CLI exited {proc.returncode}: {proc.stderr.strip()}")

    try:
        wrapper = json.loads(proc.stdout)
    except json.JSONDecodeError as e:
        raise ValidatorError(f"could not parse CLI wrapper JSON: {e}\nstdout: {proc.stdout[:500]}")

    if wrapper.get("is_error"):
        raise ValidatorError(f"claude returned error: {wrapper.get('result')}")

    raw = wrapper.get("result", "").strip()
    # Defensive: strip ```json fences if Claude added them despite instructions.
    if raw.startswith("```"):
        raw = raw.strip("`").lstrip("json").strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValidatorError(f"could not parse claude result as JSON: {e}\nresult: {raw[:500]}")
