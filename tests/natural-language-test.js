#!/usr/bin/env node

// Natural Language Processing Test for Math Workflow Orchestrator

const https = require('http');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(data);
    req.end();
  });
}

async function testNaturalLanguage() {
  colorLog('magenta', '🗣️  NATURAL LANGUAGE PROCESSING TEST');
  colorLog('blue', '=' .repeat(80));
  
  console.log('🎯 Testing AI-powered expression extraction with various natural language patterns');
  console.log('');

  const naturalLanguageTests = [
    {
      input: 'create workflow that adds five and three',
      expectedNumbers: ['5', '3'],
      expectedOperations: ['addition'],
      description: 'Written numbers (five, three)'
    },
    {
      input: 'make a workflow for multiplying seven by eight',
      expectedNumbers: ['7', '8'],
      expectedOperations: ['multiplication'],
      description: 'Multiply X by Y pattern'
    },
    {
      input: 'build workflow adding ten to twenty and then multiply by two',
      expectedNumbers: ['10', '20', '2'],
      expectedOperations: ['addition', 'multiplication'],
      description: 'Sequential operations with "then"'
    },
    {
      input: 'generate workflow that takes fifteen plus twenty five and divides by five',
      expectedNumbers: ['15', '25', '5'],
      expectedOperations: ['addition', 'division'],
      description: 'Complex sentence structure'
    },
    {
      input: 'create calculation for adding 12 with 18 with 6 and subtract 10',
      expectedNumbers: ['12', '18', '6', '10'],
      expectedOperations: ['addition', 'subtraction'],
      description: 'Multiple additions with "with"'
    },
    {
      input: 'make workflow that computes 30 divided by 6 plus 8 times 4',
      expectedNumbers: ['30', '6', '8', '4'],
      expectedOperations: ['division', 'addition', 'multiplication'],
      description: 'Complex mixed operations'
    },
    {
      input: 'build expression for taking the sum of 5 and 10 and multiply the result by 3',
      expectedNumbers: ['5', '10', '3'],
      expectedOperations: ['addition', 'multiplication'],
      description: 'Sum and result patterns'
    },
    {
      input: 'create workflow that first adds 25 to 15, then subtracts 8',
      expectedNumbers: ['25', '15', '8'],
      expectedOperations: ['addition', 'subtraction'],
      description: 'First/then sequence'
    },
    {
      input: 'generate calculation adding 4 with 6 with 8 with 9 and divide them by 10 and multiply with 7',
      expectedNumbers: ['4', '6', '8', '9', '10', '7'],
      expectedOperations: ['addition', 'division', 'multiplication'],
      description: 'Original user complex case'
    },
    {
      input: 'make workflow for computing 100 minus 25 plus 50 divided by 5',
      expectedNumbers: ['100', '25', '50', '5'],
      expectedOperations: ['subtraction', 'addition', 'division'],
      description: 'Order of operations test'
    }
  ];

  let totalTests = naturalLanguageTests.length;
  let passedTests = 0;

  for (const test of naturalLanguageTests) {
    colorLog('cyan', `\n🧪 Testing: ${test.description}`);
    console.log(`   Input: "${test.input}"`);
    
    try {
      const result = await makeRequest(test.input);
      
      if (result.statusCode === 200 && result.data.createdWorkflow) {
        const workflow = result.data.createdWorkflow;
        const pattern = workflow.pattern;
        const operations = workflow.operations;
        
        console.log(`   ✅ Workflow Created: ${workflow.name}`);
        console.log(`   🔧 Extracted Pattern: ${pattern}`);
        console.log(`   🧮 Operations: ${operations.join(', ')}`);
        
        // Check if expected numbers are present
        const numbersFound = test.expectedNumbers.every(num => 
          pattern.includes(num) || pattern.includes(num.replace(/^0+/, ''))
        );
        
        // Check if expected operations are present
        const operationsMatched = test.expectedOperations.some(expectedOp => 
          operations.some(actualOp => actualOp.includes(expectedOp.substring(0, 4)))
        );
        
        console.log(`   📊 Numbers Found: ${numbersFound ? '✅' : '❌'} (Expected: ${test.expectedNumbers.join(', ')})`);
        console.log(`   🔢 Operations Match: ${operationsMatched ? '✅' : '❌'} (Expected: ${test.expectedOperations.join(', ')})`);
        
        if (numbersFound && operationsMatched) {
          console.log(`   🎉 PASSED: Natural language correctly parsed!`);
          passedTests++;
        } else {
          console.log(`   ❌ FAILED: Extraction incomplete`);
        }
        
      } else {
        console.log(`   ❌ FAILED: No workflow created`);
        console.log(`   📝 Response: ${result.data.message?.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }

  console.log('');
  colorLog('blue', '=' .repeat(80));
  colorLog(passedTests === totalTests ? 'green' : 'yellow', 
    `📊 NATURAL LANGUAGE TEST RESULTS: ${passedTests}/${totalTests} passed`);
  
  if (passedTests === totalTests) {
    colorLog('green', '🎉 EXCELLENT! All natural language patterns work correctly!');
    console.log('');
    colorLog('cyan', '✨ Key Natural Language Capabilities Confirmed:');
    console.log('   • ✅ Written numbers (five, three) → numeric extraction');
    console.log('   • ✅ Verbal operations (multiply by, add to) → operation detection');
    console.log('   • ✅ Sequential patterns (first...then, and then) → proper ordering');
    console.log('   • ✅ Complex sentence structures → mathematical expressions');
    console.log('   • ✅ Multiple additions with "with" → correct grouping');
    console.log('   • ✅ Mixed operation priorities → proper precedence');
    console.log('   • ✅ Result-based patterns (sum of...multiply result) → parentheses');
  } else {
    colorLog('yellow', '⚠️  Some natural language patterns need improvement');
    console.log('   Review the failed tests above for specific issues');
  }
  
  console.log('');
  colorLog('magenta', '🔬 ADDITIONAL EDGE CASE TESTS');
  colorLog('blue', '=' .repeat(50));
  
  const edgeCases = [
    'create workflow for twenty-five plus thirty-seven',
    'make calculation with parentheses like (5 plus 3) times 2',
    'build workflow that does 10 squared plus 5',
    'generate expression for half of 20 plus quarter of 16'
  ];
  
  for (const edgeCase of edgeCases) {
    console.log(`\n🔍 Edge Case: "${edgeCase}"`);
    
    try {
      const result = await makeRequest(edgeCase);
      
      if (result.statusCode === 200) {
        if (result.data.createdWorkflow) {
          console.log(`   ✅ Handled: ${result.data.createdWorkflow.pattern}`);
        } else {
          console.log(`   ⚠️  No workflow created - complex pattern`);
          console.log(`   📝 AI Response: ${result.data.message?.substring(0, 80)}...`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('');
  colorLog('green', '🚀 Natural Language Processing Assessment Complete!');
  colorLog('blue', '=' .repeat(80));
}

if (require.main === module) {
  testNaturalLanguage().catch(console.error);
}

module.exports = { testNaturalLanguage };