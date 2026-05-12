// Test runner for mmTokenizer.js
const { syllableSegment, wordSegment, remove_timestamps } = require('./mmTokenizer');

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`FAIL: ${message}\nExpected: "${expected}"\nActual: "${actual}"`);
  }
  console.log(`PASS: ${message}`);
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

function assertFalse(condition, message) {
  if (condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

function assertIncludes(actual, expected, message) {
  if (!actual.includes(expected)) {
    throw new Error(`FAIL: ${message}\nExpected to include: "${expected}"\nActual: "${actual}"`);
  }
  console.log(`PASS: ${message}`);
}

console.log('=== Starting Tests ===\n');

try {
  // Test remove_timestamps
  console.log('--- Testing remove_timestamps ---');
  
  let output = remove_timestamps("[00:08.11] အတွေးများဟာ");
  assertEquals(output, "အတွေးများဟာ", "Basic timestamp removal");
  
  output = remove_timestamps("Hello [01:23.45] world");
  assertEquals(output, "Hello world", "Timestamp in middle");
  
  output = remove_timestamps("[00:00.00] Start [00:05.50] Middle [00:10.00] End");
  assertEquals(output, "Start Middle End", "Multiple timestamps");
  
  output = remove_timestamps("No timestamps here");
  assertEquals(output, "No timestamps here", "No timestamps");
  
  // Test syllableSegment
  console.log('\n--- Testing syllableSegment ---');
  
  output = syllableSegment("လူတ_align");
  assertTrue(output.includes("|"), "Basic segmentation contains |");
  
  // Mixed text test
  output = syllableSegment("Hello လူတ_align� world"); // Using Latin chars for world
  const cleanOutput = output.replace(/\|/g, "");
  assertTrue(cleanOutput.includes("Hello"), "Mixed text - Hello preserved");
  assertTrue(cleanOutput.includes("world"), "Mixed text - world preserved");
  assertTrue(output.includes("|"), "Mixed text - contains separator");
  
  // With timestamps
  output = syllableSegment("[00:08.11] အတွေးများဟာ");
  assertEquals(output, "အ|တွေး|များ|ဟာ", "Syllable segmentation with timestamp");
  
  output = syllableSegment("Hello [01:23.45] Myanmar");
  assertTrue(output.includes("Hello"), "With timestamp - Hello preserved");
  assertTrue(output.includes("Myanmar"), "With timestamp - Myanmar preserved");
  assertFalse(output.includes("  "), "With timestamp - no double spaces");
  
  // Test wordSegment
  console.log('\n--- Testing wordSegment ---');
  
  // Basic test
  output = wordSegment("လူတ_align");
  assertTrue(typeof output === 'string', "Word segmentation returns string");
  assertTrue(output.length > 0, "Word segmentation output not empty");
  
  // With timestamps
  output = wordSegment("[00:08.11] အတွေးများဟာ");
  assertFalse(output.includes("[00:08.11]"), "Word segmentation removes timestamp");
  
  const cleanWordOutput = output.replace(/\|/g, "");
  assertTrue(cleanWordOutput.includes("အတွေးများ") || output.startsWith("|"), "Word segmentation preserves Myanmar text");
  
  output = wordSegment("Hello [01:23.45] Myanmar word");
  assertTrue(output.includes("Hello"), "With timestamp - Hello preserved");
  assertFalse(output.includes("[01:23.45]"), "With timestamp - no timestamp in output");

  // Test line-by-line format preservation
  console.log('\n--- Testing line-by-line format preservation ---');
  
  // Test that syllableSegment and wordSegment preserve line-by-line format
  // If original input has N lines, final result should have N lines
  let inputText = `Line 1
လူတ_align
[00:08.11] အတွေးများ
Line 4
Another line with Myanmar: အနုပညာ`;
  
  // Test syllableSegment preserves line count
  let syllOutput = syllableSegment(inputText);
  let inputLines = inputText.split(/\r\n|\r|\n/);
  let syllLines = syllOutput.split(/\r\n|\r|\n/);
  assertEquals(inputLines.length, syllLines.length, "syllableSegment preserves line count");
  
  // Test wordSegment preserves line count
  let wordOutput = wordSegment(inputText);
  let wordLines = wordOutput.split(/\r\n|\r|\n/);
  assertEquals(inputLines.length, wordLines.length, "wordSegment preserves line count");
  
  // Test that timestamps are removed from each line
  for (let i = 0; i < syllLines.length; i++) {
    assertFalse(syllLines[i].includes("[00:08.11]"), `Timestamp not removed from syllable line ${i}`);
  }
  
  for (let i = 0; i < wordLines.length; i++) {
    assertFalse(wordLines[i].includes("[00:08.11]"), `Timestamp not removed from word line ${i}`);
  }
  
  // Test with different line endings
  let inputTextCrlf = "Line 1\r\nလူတ_align\r\n[00:08.11] အတွေးများ\r\nLine 4";
  let syllOutputCrlf = syllableSegment(inputTextCrlf);
  let wordOutputCrlf = wordSegment(inputTextCrlf);
  
  let inputLinesCrlf = inputTextCrlf.split(/\r\n|\r|\n/);
  let syllLinesCrlf = syllOutputCrlf.split(/\r\n|\r|\n/);
  let wordLinesCrlf = wordOutputCrlf.split(/\r\n|\r|\n/);
  
  assertEquals(inputLinesCrlf.length, syllLinesCrlf.length, "syllableSegment preserves line count with CRLF");
  assertEquals(inputLinesCrlf.length, wordLinesCrlf.length, "wordSegment preserves line count with CRLF");

  console.log('\n=== All Tests Passed! ===');
} catch (error) {
  console.error(`Test failed: ${error.message}`);
  process.exit(1);
}