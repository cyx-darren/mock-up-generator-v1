/**
 * Comprehensive Constraint Validation Test Script
 * Tests green detection accuracy, area calculations, and position validation
 */

// Since we can't directly import TS modules in Node.js without compilation,
// we'll test the constraint validation logic by simulating the detection algorithms

// Mock ImageData for testing
function createMockImageData(width, height, greenPixels) {
  const data = new Uint8ClampedArray(width * height * 4);

  // Fill with white background
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255; // R
    data[i + 1] = 255; // G
    data[i + 2] = 255; // B
    data[i + 3] = 255; // A
  }

  // Add green pixels at specified locations
  greenPixels.forEach(({ x, y, r = 0, g = 255, b = 0 }) => {
    const index = (y * width + x) * 4;
    if (index >= 0 && index < data.length - 3) {
      data[index] = r; // R
      data[index + 1] = g; // G
      data[index + 2] = b; // B
      data[index + 3] = 255; // A
    }
  });

  return { data, width, height };
}

// Test cases for different constraint scenarios
const testCases = [
  {
    name: 'Horizontal Constraint - Center Rectangle',
    width: 400,
    height: 300,
    greenPixels: [
      // Create a 100x50 green rectangle in center
      ...Array.from({ length: 100 }, (_, x) =>
        Array.from({ length: 50 }, (_, y) => ({
          x: 150 + x,
          y: 125 + y,
        }))
      ).flat(),
    ],
    expectedArea: 5000,
    expectedPercentage: 4.17, // 5000/(400*300)*100
    placementType: 'horizontal',
  },
  {
    name: 'Vertical Constraint - Tall Rectangle',
    width: 300,
    height: 500,
    greenPixels: [
      // Create a 60x200 green rectangle
      ...Array.from({ length: 60 }, (_, x) =>
        Array.from({ length: 200 }, (_, y) => ({
          x: 120 + x,
          y: 150 + y,
        }))
      ).flat(),
    ],
    expectedArea: 12000,
    expectedPercentage: 8.0, // 12000/(300*500)*100
    placementType: 'vertical',
  },
  {
    name: 'All-Over Pattern - Multiple Scattered Areas',
    width: 500,
    height: 400,
    greenPixels: [
      // Create multiple small green areas
      ...Array.from({ length: 30 }, (_, x) =>
        Array.from({ length: 30 }, (_, y) => ({
          x: 50 + x,
          y: 50 + y,
        }))
      ).flat(),
      ...Array.from({ length: 30 }, (_, x) =>
        Array.from({ length: 30 }, (_, y) => ({
          x: 200 + x,
          y: 150 + y,
        }))
      ).flat(),
      ...Array.from({ length: 30 }, (_, x) =>
        Array.from({ length: 30 }, (_, y) => ({
          x: 350 + x,
          y: 250 + y,
        }))
      ).flat(),
    ],
    expectedArea: 2700,
    expectedPercentage: 1.35, // 2700/(500*400)*100
    placementType: 'all_over',
  },
  {
    name: 'Edge Case - Very Small Green Area',
    width: 200,
    height: 200,
    greenPixels: [
      { x: 100, y: 100 },
      { x: 101, y: 100 },
      { x: 100, y: 101 },
      { x: 101, y: 101 },
    ],
    expectedArea: 4,
    expectedPercentage: 0.01,
    placementType: 'horizontal',
  },
  {
    name: 'Edge Case - No Green Areas',
    width: 100,
    height: 100,
    greenPixels: [],
    expectedArea: 0,
    expectedPercentage: 0,
    placementType: 'horizontal',
  },
];

async function runConstraintValidationTests() {
  console.log('\n=== CONSTRAINT VALIDATION TEST SUITE ===\n');

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    console.log(
      `   Image: ${testCase.width}x${testCase.height}, Expected: ${testCase.expectedArea} pixels (${testCase.expectedPercentage}%)`
    );

    try {
      // Create mock image data
      const imageData = createMockImageData(testCase.width, testCase.height, testCase.greenPixels);

      // Initialize detector with standard config
      const detector = new GreenColorDetector({
        hueRange: [80, 140],
        saturationThreshold: 30,
        valueThreshold: 20,
        tolerance: 0.1,
      });

      // Detect green areas
      const detectedArea = detector.detectGreenAreas(imageData, testCase.width, testCase.height);

      // Validate detection results
      const pixelTolerance = Math.max(10, testCase.expectedArea * 0.05); // 5% tolerance or 10 pixels
      const percentageTolerance = 0.1;

      const pixelMatch = Math.abs(detectedArea.pixels - testCase.expectedArea) <= pixelTolerance;
      const percentageMatch =
        Math.abs(detectedArea.percentage - testCase.expectedPercentage) <= percentageTolerance;

      console.log(`   ✓ Detected: ${detectedArea.pixels} pixels (${detectedArea.percentage}%)`);
      console.log(
        `   ✓ Bounds: ${detectedArea.bounds.width}x${detectedArea.bounds.height} at (${detectedArea.bounds.x}, ${detectedArea.bounds.y})`
      );
      console.log(
        `   ✓ Quality: ${detectedArea.quality}, Aspect Ratio: ${detectedArea.aspectRatio}`
      );
      console.log(`   ✓ Contours: ${detectedArea.contours.length} areas detected`);

      // Test constraint validation
      const dimensions = {
        minWidth: 50,
        minHeight: 50,
        maxWidth: 300,
        maxHeight: 300,
        defaultX: 100,
        defaultY: 100,
      };

      const validation = ConstraintCalculator.validateConstraint(
        detectedArea,
        dimensions,
        testCase.width,
        testCase.height,
        testCase.placementType
      );

      console.log(`   ✓ Validation Score: ${validation.score.toFixed(2)}`);
      console.log(`   ✓ Is Valid: ${validation.isValid}`);
      console.log(`   ✓ Warnings: ${validation.warnings.length}`);
      console.log(
        `   ✓ Usable Area: ${validation.usableArea.pixels} pixels (${validation.usableArea.percentage}%)`
      );

      // Test metrics calculation
      const metrics = ConstraintCalculator.calculateMetrics(
        detectedArea,
        testCase.width,
        testCase.height
      );

      console.log(`   ✓ Metrics - Total: ${metrics.totalArea}, Usable: ${metrics.usableArea}`);
      console.log(
        `   ✓ Center Offset: (${metrics.centerOffset.x.toFixed(1)}, ${metrics.centerOffset.y.toFixed(1)})`
      );
      console.log(
        `   ✓ Edge Distances: T:${metrics.edgeDistances.top} R:${metrics.edgeDistances.right} B:${metrics.edgeDistances.bottom} L:${metrics.edgeDistances.left}`
      );
      console.log(
        `   ✓ Compactness: ${metrics.compactness.toFixed(3)}, Fragments: ${metrics.fragmentCount}`
      );

      // Determine test result
      if (pixelMatch && percentageMatch && detectedArea.quality >= 0) {
        console.log(`   ✅ PASS - Detection accurate within tolerance\n`);
        passedTests++;
      } else {
        console.log(
          `   ❌ FAIL - Detection outside tolerance (pixels: ${pixelMatch}, %: ${percentageMatch})\n`
        );
      }
    } catch (error) {
      console.log(`   ❌ FAIL - Error: ${error.message}\n`);
    }
  }

  console.log('=== TEST SUMMARY ===');
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('✅ ALL CONSTRAINT VALIDATION TESTS PASSED!');
    console.log('✅ Task 3.3.1 Constraint Validation: VERIFIED');
    return true;
  } else {
    console.log(
      `❌ ${totalTests - passedTests} tests failed. Review constraint detection algorithms.`
    );
    return false;
  }
}

// Run the tests
runConstraintValidationTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
