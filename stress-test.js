#!/usr/bin/env node

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  endpoint: '/pi',
  concurrentRequests: parseInt(process.env.CONCURRENT_REQUESTS) || 10,
  totalRequests: parseInt(process.env.TOTAL_REQUESTS) || 100,
  delayBetweenBatches: parseInt(process.env.DELAY_BETWEEN_BATCHES) || 1000,
  timeout: parseInt(process.env.TIMEOUT) || 5000,
  verbose: process.env.VERBOSE === 'true'
};

// Statistics tracking
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  responseTimes: [],
  startTime: 0,
  endTime: 0,
  errors: []
};

// Create axios instance with timeout
const api = axios.create({
  baseURL: CONFIG.baseURL,
  timeout: CONFIG.timeout,
  headers: {
    'User-Agent': 'Stress-Test-Script/1.0'
  }
});

// Utility functions
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

function calculatePercentile(values, percentile) {
  const sorted = values.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
}

// Make a single request
async function makeRequest(requestId) {
  const startTime = performance.now();
  
  try {
    const response = await api.get(CONFIG.endpoint);
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // Update statistics
    stats.successfulRequests++;
    stats.totalResponseTime += responseTime;
    stats.minResponseTime = Math.min(stats.minResponseTime, responseTime);
    stats.maxResponseTime = Math.max(stats.maxResponseTime, responseTime);
    stats.responseTimes.push(responseTime);
    
    if (CONFIG.verbose) {
      log(`Request ${requestId}: SUCCESS - ${responseTime.toFixed(2)}ms - Status: ${response.status}`);
    }
    
    return { success: true, responseTime, status: response.status };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // Update statistics
    stats.failedRequests++;
    stats.errors.push({
      requestId,
      error: error.message,
      responseTime
    });
    
    if (CONFIG.verbose) {
      log(`Request ${requestId}: FAILED - ${responseTime.toFixed(2)}ms - ${error.message}`, 'ERROR');
    }
    
    return { success: false, responseTime, error: error.message };
  } finally {
    stats.totalRequests++;
  }
}

// Execute concurrent requests
async function executeConcurrentRequests(batchNumber, batchSize) {
  const promises = [];
  
  for (let i = 0; i < batchSize; i++) {
    const requestId = batchNumber * batchSize + i + 1;
    promises.push(makeRequest(requestId));
  }
  
  return Promise.all(promises);
}

// Print final statistics
function printStatistics() {
  const duration = stats.endTime - stats.startTime;
  const avgResponseTime = stats.successfulRequests > 0 ? stats.totalResponseTime / stats.successfulRequests : 0;
  const successRate = (stats.successfulRequests / stats.totalRequests) * 100;
  const requestsPerSecond = (stats.totalRequests / (duration / 1000));
  
  console.log('\n' + '='.repeat(60));
  console.log('STRESS TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Base URL: ${CONFIG.baseURL}`);
  console.log(`Endpoint: ${CONFIG.endpoint}`);
  console.log(`Total Duration: ${formatDuration(duration)}`);
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Successful: ${stats.successfulRequests}`);
  console.log(`Failed: ${stats.failedRequests}`);
  console.log(`Success Rate: ${successRate.toFixed(2)}%`);
  console.log(`Requests/Second: ${requestsPerSecond.toFixed(2)}`);
  console.log('');
  
  if (stats.successfulRequests > 0) {
    console.log('RESPONSE TIME STATISTICS:');
    console.log(`  Average: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`  Minimum: ${stats.minResponseTime.toFixed(2)}ms`);
    console.log(`  Maximum: ${stats.maxResponseTime.toFixed(2)}ms`);
    console.log(`  50th Percentile: ${calculatePercentile(stats.responseTimes, 50).toFixed(2)}ms`);
    console.log(`  90th Percentile: ${calculatePercentile(stats.responseTimes, 90).toFixed(2)}ms`);
    console.log(`  95th Percentile: ${calculatePercentile(stats.responseTimes, 95).toFixed(2)}ms`);
    console.log(`  99th Percentile: ${calculatePercentile(stats.responseTimes, 99).toFixed(2)}ms`);
  }
  
  if (stats.errors.length > 0) {
    console.log('\nERROR SUMMARY:');
    const errorTypes = {};
    stats.errors.forEach(error => {
      const errorKey = error.error.split(':')[0] || error.error;
      errorTypes[errorKey] = (errorTypes[errorKey] || 0) + 1;
    });
    
    Object.entries(errorTypes).forEach(([errorType, count]) => {
      console.log(`  ${errorType}: ${count} occurrences`);
    });
  }
  
  console.log('='.repeat(60));
}

// Main execution function
async function runStressTest() {
  console.log('🚀 Starting Stress Test');
  console.log('='.repeat(60));
  console.log(`Target: ${CONFIG.baseURL}${CONFIG.endpoint}`);
  console.log(`Concurrent Requests: ${CONFIG.concurrentRequests}`);
  console.log(`Total Requests: ${CONFIG.totalRequests}`);
  console.log(`Batch Delay: ${CONFIG.delayBetweenBatches}ms`);
  console.log(`Timeout: ${CONFIG.timeout}ms`);
  console.log('='.repeat(60));
  
  stats.startTime = performance.now();
  
  try {
    // Calculate batches
    const numBatches = Math.ceil(CONFIG.totalRequests / CONFIG.concurrentRequests);
    const requestsPerBatch = Math.ceil(CONFIG.totalRequests / numBatches);
    
    log(`Executing ${numBatches} batches with ~${requestsPerBatch} requests per batch`);
    
    for (let batch = 0; batch < numBatches; batch++) {
      const remainingRequests = CONFIG.totalRequests - (batch * requestsPerBatch);
      const currentBatchSize = Math.min(requestsPerBatch, remainingRequests);
      
      if (currentBatchSize <= 0) break;
      
      log(`Starting batch ${batch + 1}/${numBatches} with ${currentBatchSize} requests`);
      
      const batchStart = performance.now();
      await executeConcurrentRequests(batch, currentBatchSize);
      const batchEnd = performance.now();
      
      log(`Batch ${batch + 1} completed in ${formatDuration(batchEnd - batchStart)}`);
      
      // Add delay between batches (except for the last batch)
      if (batch < numBatches - 1 && CONFIG.delayBetweenBatches > 0) {
        log(`Waiting ${CONFIG.delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
      }
    }
    
    stats.endTime = performance.now();
    printStatistics();
    
  } catch (error) {
    log(`Stress test failed: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// Handle command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
      case '-h':
        console.log(`
Stress Test Script for /pi endpoint

Usage: node stress-test.js [options]

Options:
  --concurrent <number>    Number of concurrent requests (default: 10)
  --total <number>         Total number of requests (default: 100)
  --delay <number>         Delay between batches in ms (default: 1000)
  --timeout <number>       Request timeout in ms (default: 5000)
  --base-url <url>         Base URL (default: http://localhost:3000)
  --verbose                Enable verbose logging
  --help, -h              Show this help message

Environment Variables:
  CONCURRENT_REQUESTS      Number of concurrent requests
  TOTAL_REQUESTS           Total number of requests
  DELAY_BETWEEN_BATCHES    Delay between batches in ms
  TIMEOUT                  Request timeout in ms
  BASE_URL                 Base URL
  VERBOSE                  Enable verbose logging (true/false)

Examples:
  node stress-test.js --concurrent 20 --total 500
  node stress-test.js --base-url http://localhost:8080 --verbose
  CONCURRENT_REQUESTS=50 TOTAL_REQUESTS=1000 node stress-test.js
        `);
        process.exit(0);
        break;
        
      case '--concurrent':
        CONFIG.concurrentRequests = parseInt(args[++i]);
        break;
        
      case '--total':
        CONFIG.totalRequests = parseInt(args[++i]);
        break;
        
      case '--delay':
        CONFIG.delayBetweenBatches = parseInt(args[++i]);
        break;
        
      case '--timeout':
        CONFIG.timeout = parseInt(args[++i]);
        break;
        
      case '--base-url':
        CONFIG.baseURL = args[++i];
        break;
        
      case '--verbose':
        CONFIG.verbose = true;
        break;
        
      default:
        if (arg.startsWith('--')) {
          log(`Unknown option: ${arg}`, 'WARN');
        }
    }
  }
}

// Check if axios is installed
try {
  require('axios');
} catch (error) {
  console.error('❌ Error: axios is not installed. Please install it first:');
  console.error('   npm install axios');
  process.exit(1);
}

// Run the stress test
if (require.main === module) {
  parseArgs();
  runStressTest().catch(error => {
    log(`Fatal error: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = { runStressTest, CONFIG };
