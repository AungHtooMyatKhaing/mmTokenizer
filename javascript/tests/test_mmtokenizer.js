// Test file for mmTokenizer.js

// Test timestamp removal
function testRemoveTimestamps() {
    let result = mmTokenizer.remove_timestamps("[00:08.11] အတွေးများဟာ");
    if (result !== "အတွေးများဟာ") {
        throw new Error(`Expected "အတွေး� maioriaဟာ", got "${result}"`);
    }
    
    result = mmTokenizer.remove_timestamps("Hello [01:23.45] world");
    if (result !== "Hello world") {
        throw new Error(`Expected "Hello world", got "${result}"`);
    }
    
    result = mmTokenizer.remove_timestamps("[00:00.00] Start [00:05.50] Middle [00:10.00] End");
    if (result !== "Start Middle End") {
        throw new Error(`Expected "Start Middle End", got "${result}"`);
    }
    
    result = mmTokenizer.remove_timestamps("No timestamps here");
    if (result !== "No timestamps here") {
        throw new Error(`Expected "No timestamps here", got "${result}"`);
    }
    
    console.log("✓ remove_timestamps tests passed");
}

// Test basic syllable segmentation
function testSyllableSegmentation() {
    let result = mmTokenizer.syllableSegment("လူတ_align");
    if (!result.includes("|")) {
        throw new Error(`Expected syllable segmentation to contain "|", got "${result}"`);
    }
    
    console.log("✓ syllableSegment tests passed");
}

// Test basic word segmentation
function testWordSegmentation() {
    let result = mmTokenizer.wordSegment("လူတ_align");
    if (typeof result !== "string") {
        throw new Error(`Expected string result, got "${typeof result}"`);
    }
    if (result.length === 0) {
        throw new Error(`Expected non-empty result, got "${result}"`);
    }
    
    console.log("✓ wordSegment tests passed");
}

// Test mixed Myanmar and English text
function testMixedText() {
    // Test syllableSegment
    let result = mmTokenizer.syllableSegment("Hello လူတ_align� العالم");
    if (typeof result !== "string") {
        throw new Error(`Expected string result, got "${typeof result}"`);
    }
    // Check that "Hello" and "العالم" appear as whole words (not split)
    let cleanOutput = result.replace(/\|/g, "");
    if (!cleanOutput.includes("Hello")) {
        throw new Error(`Expected "Hello" to be preserved in "${result}"`);
    }
    if (!cleanOutput.includes("العالم")) {
        throw new Error(`Expected "العالم" to be preserved in "${result}"`);
    }
    // Also check that Myanmar part is segmented (contains | in the Myanmar section)
    if (!result.includes("|")) {
        throw new Error(`Expected Myanmar text to be segmented in "${result}"`);
    }
    
    // Test wordSegment
    result = mmTokenizer.wordSegment("Hello လူတ_align� العالم");
    if (typeof result !== "string") {
        throw new Error(`Expected string result, got "${typeof result}"`);
    }
    // Check that "Hello" and "العالم" appear as whole words in the output
    // (they might be surrounded by '|' or at start/end)
    if (!result.replace(/\|/g, "").includes("Hello")) {
        throw new Error(`Expected "Hello" to be preserved in "${result}"`);
    }
    if (!result.replace(/\|/g, "").includes("العالم")) {
        throw new Error(`Expected "العالم" to be preserved in "${result}"`);
    }
    
    console.log("✓ mixed text tests passed");
}

// Test syllable segmentation with timestamps
function testSyllableSegmentationWithTimestamps() {
    let result = mmTokenizer.syllableSegment("[00:08.11] အတွေးများဟာ");
    if (result !== "အ|တwey|များ|ဟာ") {
        throw new Error(`Expected "အ|တwey|များ|ဟာ", got "${result}"`);
    }
    
    result = mmTokenizer.syllableSegment("Hello [01:23.45] Myanmar");
    if (!result.includes("Hello")) {
        throw new Error(`Expected "Hello" to be preserved in "${result}"`);
    }
    if (!result.includes("Myanmar")) {
        throw new Error(`Expected "Myanmar" to be preserved in "${result}"`);
    }
    // But there should be no extra spaces from timestamp
    if (result.includes("  ")) {
        throw new Error(`Expected no double spaces from timestamp removal in "${result}"`);
    }
    
    console.log("✓ syllableSegment with timestamps tests passed");
}

// Test word segmentation with timestamps
function testWordSegmentationWithTimestamps() {
    let result = mmTokenizer.wordSegment("[00:08.11] အတွေးများဟာ");
    if (result.includes("[00:08.11]")) {
        throw new Error(`Expected timestamp to be removed from "${result}"`);
    }
    if (!result.replace(/\|/g, "").includes("အတွေး� majoritéဟာ")) {
        throw new Error(`Expected "အတွေး� majoritéဟာ" to be preserved in "${result}"`);
    }
    
    result = mmTokenizer.wordSegment("Hello [01:23.45] Myanmar word");
    if (!result.includes("Hello")) {
        throw new Error(`Expected "Hello" to be preserved in "${result}"`);
    }
    if (result.includes("[01:23.45]")) {
        throw new Error(`Expected timestamp to be removed from "${result}"`);
    }
    
    console.log("✓ wordSegment with timestamps tests passed");
}

// Test line-by-line format preservation
function testLineByLineFormatPreservation() {
    // Test that syllableSegment and wordSegment preserve line-by-line format
    // If original input has N lines, final result should have N lines
    let inputText = `Line 1
လူတ_align
[00:08.11] အတွေးများ
Line 4
Another line with Myanmar: အနုပညာ`;
    
    // Test syllableSegment preserves line count
    let syllOutput = mmTokenizer.syllableSegment(inputText);
    let inputLines = inputText.split(/\r\n|\r|\n/);
    let syllLines = syllOutput.split(/\r\n|\r|\n/);
    if (inputLines.length !== syllLines.length) {
        throw new Error(`syllableSegment failed to preserve line count: expected ${inputLines.length}, got ${syllLines.length}`);
    }
    
    // Test wordSegment preserves line count
    let wordOutput = mmTokenizer.wordSegment(inputText);
    let wordLines = wordOutput.split(/\r\n|\r|\n/);
    if (inputLines.length !== wordLines.length) {
        throw new Error(`wordSegment failed to preserve line count: expected ${inputLines.length}, got ${wordLines.length}`);
    }
    
    // Test that timestamps are removed from each line
    for (let i = 0; i < syllLines.length; i++) {
        if (syllLines[i].includes("[00:08.11]")) {
            throw new Error(`Timestamp not removed from syllable line ${i}: "${syllLines[i]}"`);
        }
    }
    
    for (let i = 0; i < wordLines.length; i++) {
        if (wordLines[i].includes("[00:08.11]")) {
            throw new Error(`Timestamp not removed from word line ${i}: "${wordLines[i]}"`);
        }
    }
    
    // Test with different line endings
    let inputTextCrlf = "Line 1\r\nလူတ_align\r\n[00:08.11] အတွေးများ\r\nLine 4";
    let syllOutputCrlf = mmTokenizer.syllableSegment(inputTextCrlf);
    let wordOutputCrlf = mmTokenizer.wordSegment(inputTextCrlf);
    
    let inputLinesCrlf = inputTextCrlf.split(/\r\n|\r|\n/);
    let syllLinesCrlf = syllOutputCrlf.split(/\r\n|\r|\n/);
    let wordLinesCrlf = wordOutputCrlf.split(/\r\n|\r|\n/);
    
    if (inputLinesCrlf.length !== syllLinesCrlf.length) {
        throw new Error(`syllableSegment failed to preserve line count with CRLF: expected ${inputLinesCrlf.length}, got ${syllLinesCrlf.length}`);
    }
    if (inputLinesCrlf.length !== wordLinesCrlf.length) {
        throw new Error(`wordSegment failed to preserve line count with CRLF: expected ${inputLinesCrlf.length}, got ${wordLinesCrlf.length}`);
    }
    
    console.log("✓ line-by-line format preservation tests passed");
}

// Run all tests
function runTests() {
    try {
        testRemoveTimestamps();
        testSyllableSegmentation();
        testWordSegmentation();
        testMixedText();
        testSyllableSegmentationWithTimestamps();
        testWordSegmentationWithTimestamps();
        testLineByLineFormatPreservation();
        console.log("\n✅ All tests passed!");
    } catch (error) {
        console.error("\n❌ Test failed:", error.message);
        process.exit(1);
    }
}

runTests();