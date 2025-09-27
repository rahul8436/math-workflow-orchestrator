#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runTests() {
  colorLog('cyan', '🧪 Starting Comprehensive Test Suite for Math Workflow Orchestration');
  colorLog('blue', '=' .repeat(80));
  
  console.log('📋 Test Plan:');
  console.log('  1. Intent Detection & Classification');
  console.log('  2. Expression Extraction & Validation');
  console.log('  3. Workflow Lifecycle (Create → Find)');
  console.log('  4. Performance & Load Testing');
  console.log('  5. Error Handling & Edge Cases');
  console.log('');
  
  // Import fetch for Node.js
  const fetch = require('node-fetch');
  
  // Check if server is running
  colorLog('yellow', '🔍 Checking if development server is running...');
  
  try {
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test connection' })
    });
    
    if (response.ok) {
      colorLog('green', '✅ Server is running on port 3001');
    } else {
      throw new Error('Server responded with error');
    }
  } catch (error) {
    colorLog('red', '❌ Server is not running on port 3001');
    colorLog('yellow', '📝 Please start the server with: npm run dev');
    colorLog('yellow', '⏳ Waiting for you to start the server...');
    
    // Wait for server to be available
    let serverReady = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes
    
    while (!serverReady && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;
      
      try {
        const testResponse = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'test connection' })
        });
        
        if (testResponse.ok) {
          serverReady = true;
          colorLog('green', '✅ Server is now running!');
        }
      } catch {
        colorLog('yellow', `⏳ Attempt ${attempts}/${maxAttempts} - Server not ready yet...`);
      }
    }
    
    if (!serverReady) {
      colorLog('red', '❌ Server did not start within 5 minutes. Exiting.');
      process.exit(1);
    }
  }
  
  colorLog('blue', '=' .repeat(80));
  colorLog('green', '🚀 Running Jest Tests...');
  
  return new Promise((resolve, reject) => {
    const jestProcess = spawn('npx', ['jest', '--config=package.test.json', '--verbose', '--coverage'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    jestProcess.on('close', (code) => {
      colorLog('blue', '=' .repeat(80));
      
      if (code === 0) {
        colorLog('green', '✅ All tests passed successfully!');
        colorLog('cyan', '📊 Test coverage report generated in coverage/ directory');
        colorLog('yellow', '💡 Key improvements validated:');
        console.log('   • ✅ Priority-based intent detection (CREATE > FIND)');
        console.log('   • ✅ AI-powered expression extraction');
        console.log('   • ✅ Workflow lifecycle management');
        console.log('   • ✅ Verbose response filtering');
        console.log('   • ✅ Error handling and edge cases');
        resolve(code);
      } else {
        colorLog('red', '❌ Some tests failed');
        colorLog('yellow', '📋 Check the output above for details');
        resolve(code);
      }
    });
    
    jestProcess.on('error', (err) => {
      colorLog('red', `❌ Failed to run tests: ${err.message}`);
      reject(err);
    });
  });
}

// Global fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };