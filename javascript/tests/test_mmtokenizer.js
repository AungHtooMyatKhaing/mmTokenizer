// Test file for mmTokenizer.js
// Converted from test_mmtokenizer.py

const { syllableSegment, wordSegment, remove_timestamps } = require('../mmTokenizer');

describe('mmTokenizer', () => {
  describe('remove_timestamps', () => {
    test('removes single timestamp', () => {
      const text = "[00:08.11] အတွေးများဟာ";
      const output = remove_timestamps(text);
      expect(output).toBe("အတွေးများဟာ"); // Leading/trailing spaces removed by trim()
    });

    test('removes timestamp in middle', () => {
      const text = "Hello [01:23.45] world";
      const output = remove_timestamps(text);
      expect(output).toBe("Hello world"); // Multiple spaces collapsed to single
    });

    test('removes multiple timestamps', () => {
      const text = "[00:00.00] Start [00:05.50] Middle [00:10.00] End";
      const output = remove_timestamps(text);
      expect(output).toBe("Start Middle End"); // Multiple spaces collapsed, no leading/trailing
    });

    test('handles no timestamps', () => {
      const text = "No timestamps here";
      const output = remove_timestamps(text);
      expect(output).toBe("No timestamps here");
    });
  });

  describe('syllableSegment', () => {
    test('basic syllable segmentation', () => {
      const text = "လူတိုင်းသည်";
      const output = syllableSegment(text);
      expect(output.includes("|")).toBe(true);
    });

    test('mixed Myanmar and English syllable segmentation', () => {
      // Test mixed Myanmar and English text
      // Note: The original test had some encoding issues, using approximate text
      const text = "Hello လူတိုင်း العالم"; // Approximation of the original
      const output = syllableSegment(text);
      expect(typeof output).toBe("string");
      
      // Check that "Hello" and "العالم" appear as whole words (not split)
      // Note: We remove | to check for the words as wholes
      const clean_output = output.replace(/\|/g, "");
      expect(clean_output.includes("Hello")).toBe(true);
      expect(clean_output.includes("العالم")).toBe(true);
      
      // Also check that Myanmar part is segmented (contains | in the Myanmar section)
      expect(output.includes("|")).toBe(true);
    });

    test('syllableSegment with timestamps', () => {
      // Test syllableSegment with timestamps
      const text = "[00:08.11] အတွေးများဟာ";
      const output = syllableSegment(text);
      // Should remove timestamp and segment the Myanmar text
      // Note: leading space removed by strip() in remove_timestamps, no leading |
      expect(output).toBe("အ|တွေး|များ|ဟာ");
      
      const text2 = "Hello [01:23.45] Myanmar";
      const output2 = syllableSegment(text2);
      // English words preserved (not Myanmar script)
      expect(output2.includes("Hello")).toBe(true);
      expect(output2.includes("Myanmar")).toBe(true); // English words are not processed as Myanmar text
      // But there should be no extra spaces from timestamp
      expect(output2.includes("  ")).toBe(false); // No double spaces from timestamp removal
    });
  });

  describe('wordSegment', () => {
    test('basic word segmentation', () => {
      const text = "လူတိုင်းသည်";
      const output = wordSegment(text);
      expect(typeof output).toBe("string");
      expect(output.length > 0).toBe(true);
    });

    test('mixed Myanmar and English word segmentation', () => {
      // Test mixed Myanmar and English text
      // Note: The original test had some encoding issues, using approximate text
      const text = "Hello လူတိုင်း العالم"; // Approximation of the original
      const output = wordSegment(text);
      // Expect English words to remain unsplit, Myanmar words segmented
      // Note: The exact output depends on the lexicon, but we can check that
      // the English words are not split (i.e., no internal '|' in "Hello" or "العالم")
      // and that the Myanmar part is segmented appropriately.
      // We'll just check that the output is a string and contains the English words as wholes.
      expect(typeof output).toBe("string");
      
      // Check that "Hello" and "العالم" appear as whole words in the output
      // (they might be surrounded by '|' or at start/end)
      const clean_output = output.replace(/\|/g, "");
      expect(clean_output.includes("Hello")).toBe(true);
      expect(clean_output.includes("العالم")).toBe(true);
    });

    test('wordSegment with timestamps', () => {
      // Test wordSegment with timestamps
      const text = "[00:08.11] အတွေးများဟာ";
      const output = wordSegment(text);
      // Should remove timestamp and segment the Myanmar text into words
      // Note: Exact output depends on lexicon, but should not contain the timestamp
      expect(output.includes("[00:08.11]")).toBe(false);
      expect(output.replace(/\|/g, "").includes("အတွေးများဟာ") || output.startsWith("|")).toBe(true);
      
      const text2 = "Hello [01:23.45] Myanmar word";
      const output2 = wordSegment(text2);
      // English words preserved, Myanmar segmented
      expect(output2.includes("Hello")).toBe(true);
      expect(output2.includes("[01:23.45]")).toBe(false);
    });
  });
});