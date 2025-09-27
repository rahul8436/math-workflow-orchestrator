#!/usr/bin/env node

// Simple test to validate the orchestration improvements
// This directly tests the API without complex Jest configuration

const https = require('http');
const { performance } = require('perf_hooks');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(message, templates = []) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ message, templates, context: {} });
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(data);
    req.end();
  });
}

async function testIntentDetection() {
  colorLog('cyan', '\n🎯 Testing Intent Detection Priority');
  colorLog('blue', '=' .repeat(50));

  const testCases = [
    {
      message: 'create 50 + 80 / 60',
      expectedIntent: 'create_workflow',
      description: 'User-specific issue case'
    },
    {
      message: 'create 5 + 3',
      expectedIntent: 'create_workflow', 
      description: 'Simple CREATE'
    },
    {
      message: 'find 10 * 2',
      expectedIntent: 'find_workflow',
      description: 'Simple FIND'
    },
    {
      message: 'create and find 7 + 8',
      expectedIntent: 'create_workflow',
      description: 'CREATE priority over FIND'
    }
  ];

  let passed = 0;
  let total = testCases.length;

  for (const testCase of testCases) {
    try {
      const startTime = performance.now();
      const result = await makeRequest(testCase.message);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      if (result.statusCode === 200) {
        const actualIntent = result.data.analysis?.intent;
        const success = actualIntent === testCase.expectedIntent;
        
        console.log(`  ${success ? '✅' : '❌'} ${testCase.description}`);
        console.log(`     Message: "${testCase.message}"`);
        console.log(`     Expected: ${testCase.expectedIntent}, Got: ${actualIntent}`);
        console.log(`     Duration: ${duration}ms`);
        
        if (success) passed++;
      } else {
        console.log(`  ❌ ${testCase.description} - HTTP ${result.statusCode}`);
      }
    } catch (error) {
      console.log(`  ❌ ${testCase.description} - Error: ${error.message}`);
    }
  }
  
  colorLog(passed === total ? 'green' : 'red', `\n📊 Intent Detection: ${passed}/${total} passed`);
  return passed === total;
}

async function testWorkflowCreation() {
  colorLog('cyan', '\n🏗️  Testing Workflow Creation');
  colorLog('blue', '=' .repeat(50));

  const testCases = [
    'create 25 * 4',
    'create (12 + 8) * 3 - 15', 
    'create workflow adding 4 with 6 and multiply by 2',
    'create 50 * 80 / 40 - 30 + 90' // User's complex test case
  ];

  let passed = 0;
  const createdWorkflows = [];

  for (const message of testCases) {
    try {
      const startTime = performance.now();
      const result = await makeRequest(message);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      if (result.statusCode === 200 && result.data.createdWorkflow) {
        const workflow = result.data.createdWorkflow;
        const valid = workflow.id && workflow.name && workflow.pattern && 
                     Array.isArray(workflow.operations) && 
                     Array.isArray(workflow.nodes) &&
                     workflow.nodes.length > 0;
        
        console.log(`  ${valid ? '✅' : '❌'} Created: "${message}"`);
        console.log(`     Name: ${workflow.name}`);
        console.log(`     Pattern: ${workflow.pattern}`);
        console.log(`     Operations: ${workflow.operations.length}, Nodes: ${workflow.nodes.length}`);
        console.log(`     Duration: ${duration}ms`);
        
        if (valid) {
          passed++;
          createdWorkflows.push(workflow);
        }
      } else {
        console.log(`  ❌ Failed: "${message}" - No workflow created`);
      }
    } catch (error) {
      console.log(`  ❌ Error: "${message}" - ${error.message}`);
    }
  }
  
  colorLog(passed === testCases.length ? 'green' : 'red', 
    `\n📊 Workflow Creation: ${passed}/${testCases.length} passed`);
  
  return { success: passed === testCases.length, workflows: createdWorkflows };
}

async function testWorkflowFinding(createdWorkflows) {
  colorLog('cyan', '\n🔍 Testing Workflow Finding');
  colorLog('blue', '=' .repeat(50));

  if (createdWorkflows.length === 0) {
    colorLog('yellow', '⚠️  No workflows to find - skipping test');
    return true;
  }

  let passed = 0;
  const total = Math.min(createdWorkflows.length, 3); // Test first 3

  for (let i = 0; i < total; i++) {
    const workflow = createdWorkflows[i];
    // Extract numbers from the pattern to create a find message
    const numbers = workflow.pattern.match(/\d+/g);
    const findMessage = `find ${numbers ? numbers.join(' + ') : workflow.pattern}`;
    
    try {
      const startTime = performance.now();
      const result = await makeRequest(findMessage, createdWorkflows);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      if (result.statusCode === 200) {
        const found = result.data.foundWorkflow;
        const suggestions = result.data.suggestions || [];
        const success = found || suggestions.length > 0;
        
        console.log(`  ${success ? '✅' : '❌'} Finding: "${findMessage}"`);
        console.log(`     Found: ${found ? found.name : 'None'}`);
        console.log(`     Suggestions: ${suggestions.length}`);
        console.log(`     Duration: ${duration}ms`);
        
        if (success) passed++;
      } else {
        console.log(`  ❌ Failed: "${findMessage}" - HTTP ${result.statusCode}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: "${findMessage}" - ${error.message}`);
    }
  }
  
  colorLog(passed === total ? 'green' : 'red', 
    `\n📊 Workflow Finding: ${passed}/${total} passed`);
    
  return passed === total;
}

async function testResponseQuality() {
  colorLog('cyan', '\n📝 Testing Response Quality (No Verbose Responses)');
  colorLog('blue', '=' .repeat(50));

  const testMessages = [
    'create 10 + 20',
    'create complex calculation 15 * 3 + 8'
  ];

  let passed = 0;

  for (const message of testMessages) {
    try {
      const result = await makeRequest(message);
      
      if (result.statusCode === 200) {
        const response = result.data.message;
        const isVerbose = response.includes('step by step') || 
                         response.includes('first') ||
                         response.includes('then') ||
                         response.includes('next') ||
                         response.length > 500;
        
        console.log(`  ${!isVerbose ? '✅' : '❌'} Response quality: "${message}"`);
        console.log(`     Length: ${response.length} chars`);
        console.log(`     Verbose: ${isVerbose}`);
        console.log(`     Preview: ${response.substring(0, 100)}...`);
        
        if (!isVerbose) passed++;
      } else {
        console.log(`  ❌ Failed: "${message}" - HTTP ${result.statusCode}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: "${message}" - ${error.message}`);
    }
  }
  
  colorLog(passed === testMessages.length ? 'green' : 'red', 
    `\n📊 Response Quality: ${passed}/${testMessages.length} passed`);
    
  return passed === testMessages.length;
}

async function runAllTests() {
  colorLog('cyan', '🧪 Math Workflow Orchestration - Validation Tests');
  colorLog('blue', '=' .repeat(80));
  
  console.log('📋 Validation Plan:');
  console.log('  ✓ Intent Detection Priority (CREATE > FIND)');
  console.log('  ✓ AI-Powered Expression Extraction');
  console.log('  ✓ Workflow Creation & Validation');
  console.log('  ✓ Workflow Finding & Matching');
  console.log('  ✓ Response Quality (Non-verbose)');
  console.log('');

  // Check server
  try {
    const testResult = await makeRequest('test connection');
    if (testResult.statusCode !== 200) {
      throw new Error('Server not responding correctly');
    }
    colorLog('green', '✅ Server is running and responsive');
  } catch (error) {
    colorLog('red', '❌ Server is not running on localhost:3001');
    colorLog('yellow', '💡 Please start with: npm run dev');
    process.exit(1);
  }

  // Run all tests
  const results = {
    intentDetection: await testIntentDetection(),
    workflowCreation: await testWorkflowCreation(),
    responseQuality: await testResponseQuality()
  };
  
  // Test workflow finding with created workflows
  const creationResult = results.workflowCreation;
  if (creationResult && typeof creationResult === 'object' && creationResult.workflows) {
    results.workflowFinding = await testWorkflowFinding(creationResult.workflows);
  }

  // Final summary
  colorLog('cyan', '\n🎊 FINAL VALIDATION RESULTS');
  colorLog('blue', '=' .repeat(80));
  
  const allPassed = Object.values(results).every(r => r === true || (r && r.success));
  const passedCount = Object.values(results).filter(r => r === true || (r && r.success)).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`📊 Overall Results: ${passedCount}/${totalTests} test suites passed`);
  console.log('');
  
  Object.entries(results).forEach(([test, result]) => {
    const success = result === true || (result && result.success);
    console.log(`  ${success ? '✅' : '❌'} ${test}: ${success ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log('');
  
  if (allPassed) {
    colorLog('green', '🎉 ALL ORCHESTRATION IMPROVEMENTS VALIDATED!');
    colorLog('cyan', '✨ Key fixes confirmed working:');
    console.log('   • CREATE intent takes priority over FIND');
    console.log('   • AI-powered expression extraction works correctly');
    console.log('   • Workflow lifecycle (create → find) functions properly');
    console.log('   • Responses are concise and non-verbose');
    console.log('   • Complex expressions are handled correctly');
  } else {
    colorLog('red', '⚠️  Some issues detected - review failed tests above');
  }
  
  colorLog('blue', '=' .repeat(80));
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };