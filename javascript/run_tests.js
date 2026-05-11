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
  
  output = syllableSegment("လူတိုင်း");
  assertTrue(output.includes("|"), "Basic segmentation contains |");
  
  // Mixed text test
  output = syllableSegment("Hello လူတိုင်း világ"); // Using Latin chars for world
  const cleanOutput = output.replace(/\|/g, "");
  assertTrue(cleanOutput.includes("Hello"), "Mixed text - Hello preserved");
  assertTrue(cleanOutput.includes("világ"), "Mixed text - world preserved");
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
  output = wordSegment("လူတိုင်း");
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
  
  console.log('\n=== All Tests Passed! ===');
} catch (error) {
  console.error(`Test failed: ${error.message}`);
  process.exit(1);
}