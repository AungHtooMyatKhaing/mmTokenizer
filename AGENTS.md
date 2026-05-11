# AGENTS.md
## Project
Python library for Myanmar text syllable/word segmentation. Python 3.7+, no external dependencies.

## Setup
```bash
python3 -m pip install -e .
```

## Testing
```bash
pytest tests/
```
Test framework: pytest. Test file: `tests/test_mmtokenizer.py`

## Lint & Typecheck
No lint/typecheck configs found. Common Python commands (not configured):
- `flake8 mmTokenizer/ tests/`
- `pylint mmTokenizer/ tests/`
- `mypy mmTokenizer/`

## Key Files
| Path | Purpose |
|------|---------|
| `mmTokenizer.py` | Main implementation: `syllableSegment`, `wordSegment` |
| `myanmar_text_data/mmLexicon.tsv` | Lexicon for word segmentation |
| `tests/test_mmtokenizer.py` | Unit tests |
| `setup.py` | Package installation config |

## Code Conventions
- Do not add comments unless explicitly requested
- Public API: `syllableSegment(text: str) -> str`, `wordSegment(text: str, lexicon_path: str = None) -> str`
- Global state in `mmTokenizer.py` is reset at the start of each `syllableSegment` call
- Both `syllableSegment` and `wordSegment` functions now handle mixed text by processing only Myanmar text runs and leaving other scripts (e.g., Latin, Arabic) unchanged
- Both functions also remove timestamp patterns like [00:08.11] before processing
