// scripts/setup-env.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// First, load existing variables from .env if it exists
let existingEnv = {};
try {
  if (fs.existsSync('.env')) {
    existingEnv = dotenv.parse(fs.readFileSync('.env'));
    console.log('Loaded existing variables from .env file');
  }
} catch (error) {
  console.warn('Failed to read .env file:', error.message);
}

// Set constants if they don't already exist in the environment
process.env.PACTICIPANT = process.env.PACTICIPANT || existingEnv.PACTICIPANT || "pactflow-example-provider";
process.env.GITHUB_REPO = process.env.GITHUB_REPO || existingEnv.GITHUB_REPO || "pactflow/example-provider";
process.env.PACT_CHANGED_WEBHOOK_UUID = process.env.PACT_CHANGED_WEBHOOK_UUID || existingEnv.PACT_CHANGED_WEBHOOK_UUID || "c76b601e-d66a-4eb1-88a4-6ebc50c0df8b";
process.env.CONTRACT_REQUIRING_VERIFICATION_PUBLISHED_WEBHOOK_UUID = process.env.CONTRACT_REQUIRING_VERIFICATION_PUBLISHED_WEBHOOK_UUID || existingEnv.CONTRACT_REQUIRING_VERIFICATION_PUBLISHED_WEBHOOK_UUID || "8ce63439-6b70-4e9b-8891-703d5ea2953c";

// Get Git information - with better error handling
try {
  if (!process.env.GIT_COMMIT && !existingEnv.GIT_COMMIT) {
    process.env.GIT_COMMIT = execSync('git rev-parse HEAD').toString().trim();
    console.log(`Set GIT_COMMIT to: ${process.env.GIT_COMMIT}`);
  } else if (existingEnv.GIT_COMMIT && !process.env.GIT_COMMIT) {
    process.env.GIT_COMMIT = existingEnv.GIT_COMMIT;
  }
  
  if (!process.env.GIT_BRANCH && !existingEnv.GIT_BRANCH) {
    process.env.GIT_BRANCH = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    console.log(`Set GIT_BRANCH to: ${process.env.GIT_BRANCH}`);
  } else if (existingEnv.GIT_BRANCH && !process.env.GIT_BRANCH) {
    process.env.GIT_BRANCH = existingEnv.GIT_BRANCH;
  }
} catch (error) {
  console.warn('Git commands failed. Using fallback values for Git information.');
  // Use existing env values or fallbacks
  process.env.GIT_COMMIT = process.env.GIT_COMMIT || existingEnv.GIT_COMMIT || 'unknown-commit-' + Date.now();
  process.env.GIT_BRANCH = process.env.GIT_BRANCH || existingEnv.GIT_BRANCH || 'unknown-branch';
}

// Ensure GIT_COMMIT is never empty or undefined
if (!process.env.GIT_COMMIT || process.env.GIT_COMMIT.trim() === '') {
  process.env.GIT_COMMIT = 'unknown-commit-' + Date.now();
  console.log(`Using fallback value for GIT_COMMIT: ${process.env.GIT_COMMIT}`);
}

// Set environment based on branch if not already set
if (!process.env.ENVIRONMENT && !existingEnv.ENVIRONMENT) {
  if (process.env.GIT_BRANCH === 'master') {
    process.env.ENVIRONMENT = 'production';
    process.env.DEPLOY_TARGET = process.env.DEPLOY_TARGET || 'deploy';
  } else if (process.env.GIT_BRANCH === 'test') {
    process.env.ENVIRONMENT = 'test';
    process.env.DEPLOY_TARGET = process.env.DEPLOY_TARGET || 'deploy';
  } else {
    process.env.ENVIRONMENT = 'production'; // Default
    process.env.DEPLOY_TARGET = process.env.DEPLOY_TARGET || 'no_deploy';
  }
} else if (existingEnv.ENVIRONMENT && !process.env.ENVIRONMENT) {
  process.env.ENVIRONMENT = existingEnv.ENVIRONMENT;
  process.env.DEPLOY_TARGET = process.env.DEPLOY_TARGET || existingEnv.DEPLOY_TARGET;
}

// Handle the Docker PACT_CLI command
process.env.PACT_CLI_AVAILABLE = process.env.PACT_CLI_AVAILABLE || existingEnv.PACT_CLI_AVAILABLE || 'true';
process.env.PWD = process.env.PWD || existingEnv.PWD || process.cwd();

// Copy over any other variables from the original .env file
for (const [key, value] of Object.entries(existingEnv)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

console.log(`Environment set up successfully:`);
console.log(`GIT_COMMIT: ${process.env.GIT_COMMIT}`);
console.log(`GIT_BRANCH: ${process.env.GIT_BRANCH}`);
console.log(`Environment: ${process.env.ENVIRONMENT}`);
console.log(`Deploy target: ${process.env.DEPLOY_TARGET || 'not set'}`);

// Create a combined .env.pact file with all variables
try {
  let envContent = '';
  
  // First, add all variables from the original .env
  for (const [key, value] of Object.entries(existingEnv)) {
    envContent += `${key}=${value}\n`;
  }
  
  // Then add or override with current process.env values for our specific variables
  const keysToInclude = [
    'PACTICIPANT', 'GITHUB_REPO', 'PACT_CHANGED_WEBHOOK_UUID', 
    'CONTRACT_REQUIRING_VERIFICATION_PUBLISHED_WEBHOOK_UUID',
    'GIT_COMMIT', 'GIT_BRANCH', 'ENVIRONMENT', 'DEPLOY_TARGET',
    'PACT_BROKER_BASE_URL', 'PACT_BROKER_TOKEN', 'PACT_CLI_AVAILABLE'
  ];
  
  for (const key of keysToInclude) {
    if (process.env[key]) {
      // Check if the key already exists in the content and replace it
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${process.env[key]}`);
      } else {
        envContent += `${key}=${process.env[key]}\n`;
      }
    }
  }
  
  fs.writeFileSync('.env.pact', envContent);
  console.log('Wrote combined environment variables to .env.pact file');
} catch (error) {
  console.warn('Failed to write .env.pact file:', error);
}