// Global test setup
import 'jest';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local file
const envLocalPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      const value = valueParts.join('=').trim();
      process.env[key.trim()] = value;
    }
  });
  console.log('✅ Loaded .env.local - GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'SET' : 'NOT SET');
}

// Global test configuration
declare global {
  var TEST_CONFIG: {
    API_URL: string;
    TIMEOUT: number;
    RETRY_COUNT: number;
  };
}

global.TEST_CONFIG = {
  API_URL: process.env.TEST_API_URL || 'http://localhost:3000/api/chat',
  TIMEOUT: 10000,
  RETRY_COUNT: 3
};