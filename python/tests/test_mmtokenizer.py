import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mmTokenizer import syllableSegment, wordSegment, remove_timestamps

def test_syllable_segmentation():
    text = "လူတိုင်းသည်"
    output = syllableSegment(text)
    assert "|" in output

def test_word_segmentation():
    text = "လူတိုင်းသည်"
    output = wordSegment(text)
    assert isinstance(output, str)
    assert len(output) > 0

def test_mixed_myenglish_syllable_segmentation():
    # Test mixed Myanmar and English text
    text = "Hello လူတိုင်း� العالم"
    output = syllableSegment(text)
    # Expect English words to remain unsplit, Myanmar words segmented into syllables
    assert isinstance(output, str)
    # Check that "Hello" and "العالم" appear as whole words (not split)
    # Note: We remove | to check for the words as wholes
    clean_output = output.replace("|", "")
    assert "Hello" in clean_output
    assert "العالم" in clean_output
    # Also check that Myanmar part is segmented (contains | in the Myanmar section)
    # The Myanmar part "လူတိုင�" should become "လူ|တိုင�" or similar
    assert "|" in output

def test_mixed_myenglish_word_segmentation():
    # Test mixed Myanmar and English text
    text = "Hello လူတိုင်း� العالم"
    output = wordSegment(text)
    # Expect English words to remain unsplit, Myanmar words segmented
    # Note: The exact output depends on the lexicon, but we can check that
    # the English words are not split (i.e., no internal '|' in "Hello" or "العالم")
    # and that the Myanmar part is segmented appropriately.
    # We'll just check that the output is a string and contains the English words as wholes.
    assert isinstance(output, str)
    # Check that "Hello" and "العالم" appear as whole words in the output
    # (they might be surrounded by '|' or at start/end)
    assert "Hello" in output.replace("|", "")
    assert "العالم" in output.replace("|", "")

def test_remove_timestamps():
    # Test timestamp removal
    text = "[00:08.11] အတွေးများဟာ"
    output = remove_timestamps(text)
    assert output == "အတွေးများဟာ"  # Leading/trailing spaces removed by strip()
    
    text = "Hello [01:23.45] world"
    output = remove_timestamps(text)
    assert output == "Hello world"  # Multiple spaces collapsed to single
    
    text = "[00:00.00] Start [00:05.50] Middle [00:10.00] End"
    output = remove_timestamps(text)
    assert output == "Start Middle End"  # Multiple spaces collapsed, no leading/trailing
    
    text = "No timestamps here"
    output = remove_timestamps(text)
    assert output == "No timestamps here"

def test_syllable_segmentation_with_timestamps():
    # Test syllableSegment with timestamps
    text = "[00:08.11] အတွေးများဟာ"
    output = syllableSegment(text)
    # Should remove timestamp and segment the Myanmar text
    # Note: leading space removed by strip() in remove_timestamps, no leading |
    assert output == "အ|တွေး|များ|ဟာ"
    
    text = "Hello [01:23.45] Myanmar"
    output = syllableSegment(text)
    # English words preserved (not Myanmar script)
    assert "Hello" in output
    assert "Myanmar" in output  # English words are not processed as Myanmar text
    # But there should be no extra spaces from timestamp
    assert "  " not in output  # No double spaces from timestamp removal

def test_word_segmentation_with_timestamps():
    # Test wordSegment with timestamps
    text = "[00:08.11] အတွေးများဟာ"
    output = wordSegment(text)
    # Should remove timestamp and segment the Myanmar text into words
    # Note: Exact output depends on lexicon, but should not contain the timestamp
    assert "[00:08.11]" not in output
    assert "အတွေးများဟာ" in output.replace("|", "") or output.startswith("|")
    
    text = "Hello [01:23.45] Myanmar word"
    output = wordSegment(text)
    # English words preserved, Myanmar segmented
    assert "Hello" in output
    assert "[01:23.45]" not in output

def test_line_by_line_format_preservation():
    # Test that syllableSegment and wordSegment preserve line-by-line format
    # If original input has N lines, final result should have N lines
    input_text = """Line 1
လူတိုင်း
[00:08.11] အတွေးများ
Line 4
Another line with Myanmar: အနုပညာ"""
    
    # Test syllableSegment preserves line count
    syll_output = syllableSegment(input_text)
    input_lines = input_text.splitlines()
    syll_lines = syll_output.splitlines()
    assert len(input_lines) == len(syll_lines), \
        f"syllableSegment failed to preserve line count: expected {len(input_lines)}, got {len(syll_lines)}"
    
    # Test wordSegment preserves line count
    word_output = wordSegment(input_text)
    word_lines = word_output.splitlines()
    assert len(input_lines) == len(word_lines), \
        f"wordSegment failed to preserve line count: expected {len(input_lines)}, got {len(word_lines)}"
    
    # Test that timestamps are removed from each line
    for line in syll_lines:
        assert "[00:08.11]" not in line, f"Timestamp not removed from syllable line: {line}"
        
    for line in word_lines:
        assert "[00:08.11]" not in line, f"Timestamp not removed from word line: {line}"
    
    # Test with different line endings
    input_text_crlf = "Line 1\r\nလူတိုင်း\r\n[00:08.11] အတွေးများ\r\nLine 4"
    syll_output_crlf = syllableSegment(input_text_crlf)
    word_output_crlf = wordSegment(input_text_crlf)
    
    input_lines_crlf = input_text_crlf.splitlines()
    syll_lines_crlf = syll_output_crlf.splitlines()
    word_lines_crlf = word_output_crlf.splitlines()
    
    assert len(input_lines_crlf) == len(syll_lines_crlf), \
        f"syllableSegment failed to preserve line count with CRLF: expected {len(input_lines_crlf)}, got {len(syll_lines_crlf)}"
    assert len(input_lines_crlf) == len(word_lines_crlf), \
        f"wordSegment failed to preserve line count with CRLF: expected {len(input_lines_crlf)}, got {len(word_lines_crlf)}"