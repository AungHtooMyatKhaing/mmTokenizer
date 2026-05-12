# mmTokenizer.py
# ---------------------------------------------------------
# This script performs syllable and word segmentation
# for Myanmar (Burmese) text. It has 3 main stages:
#   1. Character classification & tokenization (syllableSegment)
#   2. Rule-based sequence checking using lookup tables
#   3. Lexicon-based word segmentation (wordSegment)
# ---------------------------------------------------------

import os
import io
import re

def remove_timestamps(text: str) -> str:
    """
    Remove timestamp patterns like [00:08.11] from text.
    Removes all text enclosed in square brackets including the brackets.
    Also cleans up extra spaces that may result from removal.
    """
    # Pattern to match text in square brackets like [00:08.11]
    result = re.sub(r'\[[^\]]*\]', '', text)
    # Clean up extra spaces: replace multiple spaces with single space
    # but preserve single spaces that were originally there
    result = re.sub(r'\s+', ' ', result)
    # Remove leading/trailing spaces that might have been added
    return result.strip()

#region Global state variables (used across lookup tables)

segSeq = ""
resultText = ""
letterSeq = ""
letterSeq1 = ""
letterSeq2 = ""
letterSeq3 = ""
input1 = ""
input2 = ""
input3 = ""

#endregion

#region Myanmar character categories (Unicode blocks)

C = "ကခဂဃငစဆဇဈဉညဋဌဍဎဏတထဒဓနပဖဗဘမယရလဝသဟဠအ"  # Consonants
M = "ျြွှ"     # Medials
V = "ါာိီုူေဲ"   # Vowels
S = "္"         # Subscript
A = "်"         # Asat
F = "့းံ"      # Final marks
I = "ဤဧဪ၌၍၏"  # Independent vowels
E = "ဣဥဦဩ၎"   # Other vowels
G = "ဿ"         # Special
D = "၀၁၂၃၄၅၆၇၈၉" # Digits
P = "၊။"       # Punctuation
W = " "         # Whitespace	

#endregion

#region Syllable segmentation

def syllableSegment(textInput: str) -> str:
    """
    Segment Myanmar text into syllables using lookup tables.
    Processes only Myanmar text runs; leaves other scripts (e.g., Latin) unchanged.
    Removes timestamp patterns like [00:08.11].
    Returns a string with tokens separated by "|".
    Preserves original line-by-line format.
    """
    # Split input into lines to preserve line-by-line format
    lines = textInput.splitlines(keepends=True)
    processed_lines = []
    
    for line in lines:
        # Remove timestamp patterns first (but keep line ending)
        line_content = line.rstrip('\n\r')
        line_ending = line[len(line_content):]  # Preserve original line ending
        
        # Process the line content
        line_content = remove_timestamps(line_content)
        
        # Helper function to segment a Myanmar-only string
        def segment_myanmar(text: str) -> str:
            global segSeq, resultText, letterSeq, letterSeq1, letterSeq2, letterSeq3, input1, input2, input3

            # Reset globals before each call
            segSeq = resultText = letterSeq = letterSeq1 = letterSeq2 = letterSeq3 = ""
            input1 = input2 = input3 = ""

            # Transition rules: [current type][next type] → action
            # Values: 0=end token, 1=continue with '|', 2=keep, 9=check deeper, -1=invalid
            twoConsecutive = [
                [-1, 9, 1, 1, 0, -1, 1, 0, 1, 0, 0, 1, 1],
                [0, 9, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1],
                [-1, 1, 0, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1],
                [-1, 9, 1, 1, 2, 0, 1, -1, 1, -1, 0, 1, 1],
                [-1, 9, 1, 1, 0, -1, 1, -1, 1, -1, -1, 1, 1],
                [-1, 1, 1, 1, 0, -1, 1, -1, 1, -1, 0, 1, 1],
                [-1, 1, 1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1],
                [2, 9, 1, 1, 0, 0, 1, 0, 1, -1, 0, 1, 1],
                [-1, 1, 1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1],
                [-1, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1],
                [2, 9, 1, 1, 0, 0, 1, -1, 1, -1, 0, 1, 1],
                [-1, 1, 1, 1, -1, -1, 1, -1, 1, -1, -1, 0, 1],
            ]

            # Map characters → categories
            for ch in text:
                if ch in C: letterSeq += "C"
                elif ch in M: letterSeq += "M"
                elif ch in V: letterSeq += "V"
                elif ch in S: letterSeq += "S"
                elif ch in A: letterSeq += "A"
                elif ch in I: letterSeq += "I"
                elif ch in F: letterSeq += "F"
                elif ch in E: letterSeq += "E"
                elif ch in G: letterSeq += "G"
                elif ch in D: letterSeq += "D"
                elif ch in P: letterSeq += "P"
                elif ch in W: letterSeq += "W"
            letterSeq += "#"  # End marker

            # Map symbol → lookup index
            mapping = {"A": 0, "C": 1, "D": 2, "E": 3, "F": 4,
                       "G": 5, "I": 6, "M": 7, "P": 8, "S": 9,
                       "V": 10, "W": 11, "#": 12}
            convert = [mapping[c] for c in letterSeq]

            # Apply rules
            for i in range(len(convert) - 1):
                row, col = convert[i], convert[i + 1]
                case = twoConsecutive[row][col]

                if case == 0:  # End of token
                    segSeq += letterSeq[i]
                    resultText += text[i]
                    letterSeq1 = letterSeq[i + 1:]
                    input1 = text[i + 1:]

                elif case == 1:  # Continue with separation
                    segSeq += letterSeq[i] + "|"
                    resultText += text[i] if text[i] in P else text[i] + "|"

                elif case == 2:  # Keep without separation
                    segSeq += letterSeq[i]
                    resultText += text[i]

                elif case == 9:  # Escalate to deeper lookup
                    letterSeq1 = letterSeq[i:]
                    input1 = text[i:]
                    twoChar = letterSeq[i] + letterSeq[i + 1]
                    secondTable(convert[i + 2], twoChar, i, convert)

            return resultText.rstrip("|")

        # Split text into runs of Myanmar and non-Myanmar characters
        # Pattern captures either Myanmar chars or non-Myanmar chars
        myanmar_re = re.compile(r"[\u1000-\u109F\uAA60-\uAA7F]")
        runs = re.findall(r'([\u1000-\u109F\uAA60-\uAA7F]+|[^\u1000-\u109F\uAA60-\uAA7F]+)', line_content)
        # Process each run
        processed = []
        for run in runs:
            if myanmar_re.search(run):
                # Myanmar run: apply segmentation
                processed.append(segment_myanmar(run))
            else:
                # Non-Myanmar run: split word by word
                words = run.split()
                processed.append("|".join(words))
        processed_line = "|".join(processed)
        
        # Add back the line ending
        processed_lines.append(processed_line + line_ending)
    
    return "".join(processed_lines)

#endregion

#region Secondary & third-level lookup tables

def secondTable(c: int, s: str, i: int, convert: list):
    """Handles 3-character Myanmar sequences when flagged."""
    global segSeq, resultText, letterSeq1, input1, letterSeq2, input2

    threeConsecutive = [
        [3, 1, 1, 1, 1, 1, 1, 9, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
        [3, 1, 1, 1, 1, 1, 1, 9, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 9, 1, 0, 1, 1, 1],
    ]

    a = {"AC": 0, "CC": 1, "EC": 2, "FC": 3, "MC": 4, "VC": 5}.get(s, -1)
    if a == -1: return

    case = threeConsecutive[a][c]
    if case == 0:
        segSeq += letterSeq1[0]
        resultText += input1[0]
    elif case == 1:
        segSeq += letterSeq1[0] + "|"
        resultText += input1[0] + "|"
    elif case == 9:
        letterSeq2, input2 = letterSeq1, input1
        threeChars = s + letterSeq2[2]
        thirdTable(convert[i + 3], threeChars, i, convert)

def thirdTable(c: int, s1: str, i: int, convert: list):
    """Handles 4-character Myanmar clusters when flagged."""
    global segSeq, resultText, letterSeq1, input1

    fourConsecutive = [
        [4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]

    a = {"ACM": 0, "FCM": 1, "VCM": 2}.get(s1, -1)
    if a == -1: return

    case = fourConsecutive[a][c]
    if case == 0:
        segSeq += letterSeq1[0]
        resultText += input1[0]
    elif case == 1:
        segSeq += letterSeq1[0] + "|"
        resultText += input1[0] + "|"

#endregion

#region Word segmentation

# ---------- Trie (syllable-keyed) ----------
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_word = False

def build_trie_syllables(lexicon, syllableSegment):
    """
    Build a trie where each edge key is a syllable (not a character).
    syllableSegment(word) must return 'syll1|syll2|...' for the given word.
    """
    root = TrieNode()
    for word in lexicon:
        # get syllables for the lexicon entry
        sylls = syllableSegment(word).split("|")
        node = root
        for syll in sylls:
            if syll not in node.children:
                node.children[syll] = TrieNode()
            node = node.children[syll]
        node.is_word = True
    return root

# ---------- Robust loader + segmentation ----------
def wordSegment(text: str, lexicon_path=None) -> str:
    """
    Syllable-first, longest-match word segmentation using a syllable-trie.
    - Processes only Myanmar text runs; leaves other scripts (e.g., Latin) unchanged.
    - Detects Myanmar word column robustly using Unicode-range test.
    - Builds trie keyed by syllables (so tokens are combined by syllable).
    - Requires `syllableSegment(text)` to segment the syllable of the input text.
    - Removes timestamp patterns like [00:08.11].
    Preserves original line-by-line format.
    """
    # change this if you want an explicit path
    if lexicon_path is None:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        base_dir = os.path.abspath(os.path.join(current_dir, ".."))
        lexicon_path = os.path.join(base_dir, "myanmar_text_data", "mmLexicon.tsv")

    # regex to detect Myanmar script characters
    myanmar_re = re.compile(r"[\u1000-\u109F\uAA60-\uAA7F]")

    lexicon = set()

    try:
        with io.open(lexicon_path, "r", encoding="utf-8") as f:
            for lineno, line in enumerate(f, start=1):
                raw = line.rstrip("\n\r")
                # split on tabs — keep empty fields so we know positions,
                # but strip whitespace from each
                parts = [p.strip() for p in raw.split("\t")]
                # remove fields that are completely empty strings
                fields = [p for p in parts if p != ""]

                if not fields:
                    continue

                # Prefer the first field that contains Myanmar characters
                word = None
                for fld in fields:
                    # remove zero-width spaces and BOMs
                    fld_clean = fld.replace("\u200b", "").replace("\ufeff", "").strip()
                    if myanmar_re.search(fld_clean):
                        word = fld_clean
                        break

                # Fallback heuristics if no Myanmar script was found:
                if word is None:
                    # if fields look like [id, word, ...] and first is numeric, choose second
                    if len(fields) >= 2 and fields[0].isdigit():
                        word = fields[1].replace("\u200b", "").replace("\ufeff", "").strip()
                    else:
                        # fallback to second field if exists, else first
                        word = (fields[1] if len(fields) >= 2 else fields[0]).replace("\u200b", "").replace("\ufeff", "").strip()

                if word:
                    lexicon.add(word)

        # build syllable trie (requires syllableSegment function)
        trie_root = build_trie_syllables(lexicon, syllableSegment)

    except Exception as e:
        print("Error loading lexicon or during segmentation:", e)
        return None

    # Helper to segment a Myanmar-only string using the trie
    def segment_myanmar(myanmar_text: str) -> str:
        # segment into syllables
        tokens = syllableSegment(myanmar_text).split("|")
        out = []
        i = 0
        while i < len(tokens):
            node = trie_root
            longest_match = None
            longest_k = 0

            # walk syllable by syllable
            for k in range(len(tokens) - i):
                syll = tokens[i + k]
                if syll not in node.children:
                    break
                node = node.children[syll]
                if node.is_word:
                    longest_match = "".join(tokens[i:i + k + 1])
                    longest_k = k + 1

            if longest_match:
                out.append(longest_match)
                i += longest_k
            else:
                out.append(tokens[i])
                i += 1
        return "|".join(out)

    # Split input into lines to preserve line-by-line format
    lines = text.splitlines(keepends=True)
    processed_lines = []
    
    for line in lines:
        # Remove timestamp patterns first (but keep line ending)
        line_content = line.rstrip('\n\r')
        line_ending = line[len(line_content):]  # Preserve original line ending
        
        # Process the line content
        line_content = remove_timestamps(line_content)
        
        # Split text into runs of Myanmar and non-Myanmar characters
        # Pattern captures either Myanmar chars or non-Myanmar chars
        runs = re.findall(r'([\u1000-\u109F\uAA60-\uAA7F]+|[^\u1000-\u109F\uAA60-\uAA7F]+)', line_content)
        # Process each run
        processed = []
        for run in runs:
            if myanmar_re.search(run):
                # Myanmar run: apply segmentation
                processed.append(segment_myanmar(run))
            else:
                # Non-Myanmar run: split word by word
                words = run.split()
                processed.append("|".join(words))
        processed_line = "|".join(processed)
        
        # Add back the line ending
        processed_lines.append(processed_line + line_ending)
    
    return "".join(processed_lines)

#endregion

#region Test/demo

if __name__ == "__main__":
    sample = "လူတိုင်းသည် တူညီလွတ်လပ်သော ဂုဏ်သိက္ခာဖြင့်လည်းကောင်း၊ တူညီလွတ်လပ်သော အခွင့်အရေးများဖြင့်လည်းကောင်း၊ မွေးဖွားလာသူများဖြစ်သည်။"
    print("Input:", sample, "\n")
    print("Syllables:", syllableSegment(sample), "\n")
    print("Words:", wordSegment(sample))

#endregion
