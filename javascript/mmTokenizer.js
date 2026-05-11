// mmTokenizer.js
// ---------------------------------------------------------
// This script performs syllable and word segmentation
// for Myanmar (Burmese) text. It has 3 main stages:
//   1. Character classification & tokenization (syllableSegment)
//   2. Rule-based sequence checking using lookup tables
//   3. Lexicon-based word segmentation (wordSegment)
// ---------------------------------------------------------

const path = require('path');

// Global state variables (used across lookup tables)
let segSeq = "";
let resultText = "";
let letterSeq = "";
let letterSeq1 = "";
let letterSeq2 = "";
let letterSeq3 = "";
let input1 = "";
let input2 = "";
let input3 = "";

// Myanmar character categories (Unicode blocks)
const C = "ကခဂဃငစဆဇဈဉညဋဌဍဎဏတထဒဓနပဖဗဘမယရလဝသဟဠအ";  // Consonants
const M = "ျြွှ";     // Medials
const V = "ါာိီုူေဲ";   // Vowels
const S = "္";         // Subscript
const A = "်";         // Asat
const F = "့းံ";      // Final marks
const I = "ဤဧဪ၌၍၏";  // Independent vowels
const E = "ဣဥဦဩ၎";   // Other vowels
const G = "ဿ";         // Special
const D = "၀၁၂၃၄၅၆၇၈၉"; // Digits
const P = "၊။";       // Punctuation
const W = " ";         // Whitespace	

/**
 * Remove timestamp patterns like [00:08.11] from text.
 * Removes all text enclosed in square brackets including the brackets.
 * Also cleans up extra spaces that may result from removal.
 * @param {string} text - Input text
 * @returns {string} Text with timestamps removed
 */
function remove_timestamps(text) {
    // Pattern to match text in square brackets like [00:08.11]
    let result = text.replace(/\[[^\]]*\]/g, '');
    // Clean up extra spaces: replace multiple spaces with single space
    // but preserve single spaces that were originally there
    result = result.replace(/\s+/g, ' ');
    // Remove leading/trailing spaces that might have been added
    return result.trim();
}

/**
 * Segment Myanmar text into syllables using lookup tables.
 * Processes only Myanmar text runs; leaves other scripts (e.g., Latin) unchanged.
 * Removes timestamp patterns like [00:08.11].
 * Returns a string with tokens separated by "|".
 * @param {string} textInput - Input text
 * @returns {string} Syllable-segmented text
 */
function syllableSegment(textInput) {
    // Remove timestamp patterns first
    textInput = remove_timestamps(textInput);
    
    // Helper function to segment a Myanmar-only string
    function segment_myanmar(text) {
        // Reset globals before each call
        segSeq = "";
        resultText = "";
        letterSeq = "";
        letterSeq1 = "";
        letterSeq2 = "";
        letterSeq3 = "";
        input1 = "";
        input2 = "";
        input3 = "";

        // Transition rules: [current type][next type] → action
        // Values: 0=end token, 1=continue with '|', 2=keep, 9=check deeper, -1=invalid
        const twoConsecutive = [
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
        ];

        // Map characters → categories
        for (const ch of text) {
            if (C.includes(ch)) letterSeq += "C";
            else if (M.includes(ch)) letterSeq += "M";
            else if (V.includes(ch)) letterSeq += "V";
            else if (S.includes(ch)) letterSeq += "S";
            else if (A.includes(ch)) letterSeq += "A";
            else if (I.includes(ch)) letterSeq += "I";
            else if (F.includes(ch)) letterSeq += "F";
            else if (E.includes(ch)) letterSeq += "E";
            else if (G.includes(ch)) letterSeq += "G";
            else if (D.includes(ch)) letterSeq += "D";
            else if (P.includes(ch)) letterSeq += "P";
            else if (W.includes(ch)) letterSeq += "W";
        }
        letterSeq += "#";  // End marker

        // Map symbol → lookup index
        const mapping = {"A": 0, "C": 1, "D": 2, "E": 3, "F": 4,
                        "G": 5, "I": 6, "M": 7, "P": 8, "S": 9,
                        "V": 10, "W": 11, "#": 12};
        const convert = letterSeq.split('').map(c => mapping[c]);

        // Apply rules
        for (let i = 0; i < convert.length - 1; i++) {
            const row = convert[i];
            const col = convert[i + 1];
            const caseVal = twoConsecutive[row][col];

            if (caseVal === 0) {  // End of token
                segSeq += letterSeq[i];
                resultText += text[i];
                letterSeq1 = letterSeq.substring(i + 1);
                input1 = text.substring(i + 1);
            } else if (caseVal === 1) {  // Continue with separation
                segSeq += letterSeq[i] + "|";
                resultText += (P.includes(text[i]) ? text[i] : text[i] + "|");
            } else if (caseVal === 2) {  // Keep without separation
                segSeq += letterSeq[i];
                resultText += text[i];
            } else if (caseVal === 9) {  // Escalate to deeper lookup
                letterSeq1 = letterSeq.substring(i);
                input1 = text.substring(i);
                const twoChar = letterSeq[i] + letterSeq[i + 1];
                secondTable(convert[i + 2], twoChar, i, convert);
            }
        }

        return resultText.replace(/\|$/g, '');  // rstrip equivalent
    }

    // Split text into runs of Myanmar and non-Myanmar characters
    // Pattern captures either Myanmar chars or non-Myanmar chars
    const myanmar_re = /[\u1000-\u109F\uAA60-\uAA7F]/;
    const runs = textInput.match(/([\u1000-\u109F\uAA60-\uAA7F]+|[^\u1000-\u109F\uAA60-\uAA7F]+)/g) || [];
    // Process each run
    const processed = [];
    for (const run of runs) {
        if (myanmar_re.test(run)) {
            // Myanmar run: apply segmentation
            processed.push(segment_myanmar(run));
        } else {
            // Non-Myanmar run: keep as is (do not split further)
            processed.push(run);
        }
    }
    return processed.join("|");
}

/**
 * Handles 3-character Myanmar sequences when flagged.
 * @param {number} c - Converted value
 * @param {string} s - Two-character string
 * @param {number} i - Index
 * @param {Array} convert - Converted array
 */
function secondTable(c, s, i, convert) {
    // Note: Using variables from outer scope (segSeq, resultText, etc.)
    
    const threeConsecutive = [
        [3, 1, 1, 1, 1, 1, 1, 9, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
        [3, 1, 1, 1, 1, 1, 1, 9, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 9, 1, 0, 1, 1, 1],
    ];

    const aMap = {"AC": 0, "CC": 1, "EC": 2, "FC": 3, "MC": 4, "VC": 5};
    const a = aMap[s] !== undefined ? aMap[s] : -1;
    if (a === -1) return;

    const caseVal = threeConsecutive[a][c];
    if (caseVal === 0) {
        segSeq += letterSeq1[0];
        resultText += input1[0];
    } else if (caseVal === 1) {
        segSeq += letterSeq1[0] + "|";
        resultText += input1[0] + "|";
    } else if (caseVal === 9) {
        letterSeq2 = letterSeq1;
        input2 = input1;
        const threeChars = s + letterSeq2[2];
        thirdTable(convert[i + 3], threeChars, i, convert);
    }
}

/**
 * Handles 4-character Myanmar clusters when flagged.
 * @param {number} c - Converted value
 * @param {string} s1 - Three-character string
 * @param {number} i - Index
 * @param {Array} convert - Converted array
 */
function thirdTable(c, s1, i, convert) {
    // Note: Using variables from outer scope (segSeq, resultText, etc.)
    
    const fourConsecutive = [
        [4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    const aMap = {"ACM": 0, "FCM": 1, "VCM": 2};
    const a = aMap[s1] !== undefined ? aMap[s1] : -1;
    if (a === -1) return;

    const caseVal = fourConsecutive[a][c];
    if (caseVal === 0) {
        segSeq += letterSeq1[0];
        resultText += input1[0];
    } else if (caseVal === 1) {
        segSeq += letterSeq1[0] + "|";
        resultText += input1[0] + "|";
    }
}

// ---------- Trie (syllable-keyed) ----------
class TrieNode {
    constructor() {
        this.children = {};
        this.is_word = false;
    }
}

/**
 * Build a trie where each edge key is a syllable (not a character).
 * syllableSegment(word) must return 'syll1|syll2|...' for the given word.
 * @param {Set} lexicon - Set of words
 * @param {Function} syllableSegmentFn - Function to segment syllables
 * @returns {TrieNode} Root of the trie
 */
function build_trie_syllables(lexicon, syllableSegmentFn) {
    const root = new TrieNode();
    for (const word of lexicon) {
        // get syllables for the lexicon entry
        const sylls = syllableSegmentFn(word).split("|");
        let node = root;
        for (const syll of sylls) {
            if (!node.children[syll]) {
                node.children[syll] = new TrieNode();
            }
            node = node.children[syll];
        }
        node.is_word = true;
    }
    return root;
}

/**
 * Syllable-first, longest-match word segmentation using a syllable-trie.
 * - Processes only Myanmar text runs; leaves other scripts (e.g., Latin) unchanged.
 * - Detects Myanmar word column robustly using Unicode-range test.
 * - Builds trie keyed by syllables (so tokens are combined by syllable).
 * - Requires `syllableSegment(text)` to segment the syllable of the input text.
 * - Removes timestamp patterns like [00:08.11].
 * @param {string} text - Input text
 * @param {string} lexicon_path - Path to lexicon file (optional)
 * @returns {string|null} Word-segmented text or null if error
 */
function wordSegment(text, lexicon_path = null) {
    // Remove timestamp patterns first
    text = remove_timestamps(text);
    
    // change this if you want an explicit path
    if (lexicon_path === null) {
        const current_dir = __dirname; // In Node.js, __dirname is the directory of the current module
        const base_dir = path.join(current_dir, ".."); // Go up one directory to project root
        lexicon_path = path.join(base_dir, "myanmar_text_data", "mmLexicon.tsv");
    }

    // regex to detect Myanmar script characters
    const myanmar_re = /[\u1000-\u109F\uAA60-\uAA7F]/;

    const lexicon = new Set();

    try {
        // Read the lexicon file using fs module (Node.js)
        const fs = require('fs');
        const lexiconData = fs.readFileSync(lexicon_path, 'utf8');
        
        // Parse the lexicon file (tab-separated values)
        const lines = lexiconData.trim().split('\n');
        for (const line of lines) {
            const fields = line.split('\t').map(field => field.trim()).filter(field => field !== "");
            if (fields.length === 0) continue;
            
            // Prefer the first field that contains Myanmar characters
            let word = null;
            for (const fld of fields) {
                // remove zero-width spaces and BOMs
                const fld_clean = fld.replace("\u200b", "").replace("\ufeff", "").trim();
                if (myanmar_re.test(fld_clean)) {
                    word = fld_clean;
                    break;
                }
            }
            
            // Fallback heuristics if no Myanmar script was found:
            if (word === null) {
                // if fields look like [id, word, ...] and first is numeric, choose second
                if (fields.length >= 2 && !isNaN(fields[0])) {
                    word = fields[1].replace("\u200b", "").replace("\ufeff", "").trim();
                } else {
                    // fallback to second field if exists, else first
                    word = (fields.length >= 2 ? fields[1] : fields[0]).replace("\u200b", "").replace("\ufeff", "").trim();
                }
            }
            
            if (word) {
                lexicon.add(word);
            }
        }
        
        // build syllable trie (requires syllableSegment function)
        const trie_root = build_trie_syllables(lexicon, syllableSegment);

        // Helper to segment a Myanmar-only string using the trie
        function segment_myanmar(myanmar_text) {
            // segment into syllables
            const tokens = syllableSegment(myanmar_text).split("|");
            const out = [];
            let i = 0;
            while (i < tokens.length) {
                let node = trie_root;
                let longest_match = null;
                let longest_k = 0;

                // walk syllable by syllable
                for (let k = 0; k < tokens.length - i; k++) {
                    const syll = tokens[i + k];
                    if (!node.children[syll]) {
                        break;
                    }
                    node = node.children[syll];
                    if (node.is_word) {
                        longest_match = tokens.slice(i, i + k + 1).join("");
                        longest_k = k + 1;
                    }
                }

                if (longest_match) {
                    out.push(longest_match);
                    i += longest_k;
                } else {
                    out.push(tokens[i]);
                    i += 1;
                }
            }
            return out.join("|");
        }

        // Split text into runs of Myanmar and non-Myanmar characters
        // Pattern captures either Myanmar chars or non-Myanmar chars
        const runs = text.match(/([\u1000-\u109F\uAA60-\uAA7F]+|[^\u1000-\u109F\uAA60-\uAA7F]+)/g) || [];
        // Process each run
        const processed = [];
        for (const run of runs) {
            if (myanmar_re.test(run)) {
                // Myanmar run: apply segmentation
                processed.push(segment_myanmar(run));
            } else {
                // Non-Myanmar run: keep as is (do not split further)
                processed.push(run);
            }
        }
        return processed.join("|");

    } catch (e) {
        console.error("Error loading lexicon or during segmentation:", e);
        return null;
    }
}

// Export functions for use in other modules (Node.js)
// In a browser environment, these would be attached to window or exported via a module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        remove_timestamps,
        syllableSegment,
        wordSegment,
        TrieNode,
        build_trie_syllables
    };
}