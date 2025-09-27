// Global test setup
import 'jest';

// Global test configuration
declare global {
  var TEST_CONFIG: {
    API_URL: string;
    TIMEOUT: number;
    RETRY_COUNT: number;
  };
}

global.TEST_CONFIG = {
  API_URL: process.env.TEST_API_URL || 'http://localhost:3001/api/chat',
  TIMEOUT: 10000,
  RETRY_COUNT: 3
};