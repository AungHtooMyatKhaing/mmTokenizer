# AGENTS.md
## Project
Myanmar text syllable/word segmentation library available in both Python and JavaScript. Python 3.7+ and Node.js versions available, no external dependencies.

## Setup

### Python
```bash
python3 -m pip install -e python/
```

### JavaScript (Node.js)
```bash
cd javascript/
npm install
```

## Testing

### Python
```bash
python3 -m pytest python/tests/
```
Test framework: pytest. Test file: `python/tests/test_mmtokenizer.py`

### JavaScript
```bash
cd javascript/
node run_tests.js
```
Test runner: Custom Node.js script. Test file: `javascript/tests/test_mmtokenizer.js`

## Key Files

### Python Implementation
| Path | Purpose |
|------|---------|
| `python/mmTokenizer.py` | Main implementation: `syllableSegment`, `wordSegment` |
| `myanmar_text_data/mmLexicon.tsv` | Lexicon for word segmentation |
| `python/tests/test_mmtokenizer.py` | Unit tests |
| `python/setup.py` | Package installation config |

### JavaScript Implementation
| Path | Purpose |
|------|---------|
| `javascript/mmTokenizer.js` | Main implementation: `syllableSegment`, `wordSegment`, `remove_timestamps` |
| `myanmar_text_data/mmLexicon.tsv` | Lexicon for word segmentation (shared with Python) |
| `javascript/tests/test_mmtokenizer.js` | Unit tests |
| `javascript/package.json` | npm configuration and dependencies |
| `javascript/run_tests.js` | Test runner script |

## Code Conventions
- Do not add comments unless explicitly requested
- Public API: 
  - Python: `syllableSegment(text: str) -> str`, `wordSegment(text: str, lexicon_path: str = None) -> str`
  - JavaScript: `syllableSegment(text)`, `wordSegment(text, lexicon_path = null)`
- Global state in `mmTokenizer.py`/`mmTokenizer.js` is reset at the start of each `syllableSegment` call
- Both `syllableSegment` and `wordSegment` functions now handle mixed text by processing only Myanmar text runs and leaving other scripts (e.g., Latin, Arabic) unchanged
- Both functions also remove timestamp patterns like [00:08.11] before processing
