const { execSync } = require('child_process');
const https = require('https');
const dns = require('dns');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Zero-dependency function to load environment variables from .env files
function loadEnvFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const parts = trimmed.split('=');
          if (parts.length >= 2) {
            const key = parts[0].trim();
            let val = parts.slice(1).join('=').trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.substring(1, val.length - 1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  } catch (e) {}
}

// Automatically load environment variables from current directory .env and user home directory .env
loadEnvFile(path.join(process.cwd(), '.env'));
loadEnvFile(path.join(os.homedir(), '.env'));

// ANSI escape codes for coloring console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m'
};

function printHeader(title) {
  console.log(`\n${colors.cyan}${colors.bold}=== ${title} ===${colors.reset}`);
}

function printStatus(name, success, info = '') {
  if (success) {
    console.log(`  [${colors.green}OK${colors.reset}] ${colors.bold}${name}${colors.reset}${info ? ` (${info})` : ''}`);
  } else {
    console.log(`  [${colors.red}FAIL${colors.reset}] ${colors.bold}${name}${colors.reset}${info ? ` - ${info}` : ''}`);
  }
}

function runCommand(cmd) {
  try {
    return execSync(cmd, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
  } catch (e) {
    return null;
  }
}

// 1. Check Local Command Dependencies
printHeader('Checking Prerequisites & Dependencies');

const nodeVersion = runCommand('node -v');
printStatus('Node.js', !!nodeVersion, nodeVersion || 'Not found (Please install Node.js >= 18)');

const npmVersion = runCommand('npm -v');
printStatus('NPM', !!npmVersion, npmVersion || 'Not found');

const geminiCliVersion = runCommand('gemini --version');
const isGeminiCliInstalled = !!geminiCliVersion;
printStatus('Gemini CLI (@google/gemini-cli)', isGeminiCliInstalled, geminiCliVersion || 'Not installed globally. Run: npm install -g @google/gemini-cli');

const gcloudVersion = runCommand('gcloud --version');
const isGcloudInstalled = !!gcloudVersion;
let gcloudInfo = 'Not found (Required for Google Cloud / Vertex AI)';
if (isGcloudInstalled) {
  const lines = gcloudVersion.split('\n');
  gcloudInfo = lines.length > 0 ? lines[0] : 'Installed';
}
printStatus('Google Cloud SDK (gcloud)', isGcloudInstalled, gcloudInfo);


// 2. Check Environment Variables
printHeader('Checking Environment Variables');

const geminiApiKey = process.env.GEMINI_API_KEY;
printStatus('GEMINI_API_KEY (AI Studio)', !!geminiApiKey, geminiApiKey ? 'Set' : 'Missing (Required for Google AI Studio API)');

const gcpProject = process.env.GOOGLE_CLOUD_PROJECT || runCommand('gcloud config get-value project');
printStatus('GCP Active Project (Vertex AI)', !!gcpProject, gcpProject ? `Active Project: ${gcpProject}` : 'No active GCP project configured');

const adcCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
printStatus('Application Default Credentials (ADC)', !!adcCredentials, adcCredentials ? `Credentials Path: ${adcCredentials}` : 'Using default/gcloud login');


// 3. Test Connectivity
async function dnsCheck(hostname) {
  return new Promise((resolve) => {
    dns.resolve(hostname, (err) => {
      resolve(!err);
    });
  });
}

function makePostRequest(url, headers, body) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      method: 'POST',
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000 // 10s timeout
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        body: err.message
      });
    });

    req.write(JSON.stringify(body));
    req.end();
  });
}

async function testApis() {
  printHeader('Testing API Connectivity & Authentication');

  // Test AI Studio API Key
  if (geminiApiKey) {
    console.log(`\nTesting Google AI Studio (Gemini API)...`);
    const isDnsOk = await dnsCheck('generativelanguage.googleapis.com');
    if (!isDnsOk) {
      printStatus('AI Studio Endpoint Connection', false, 'DNS lookup failed. Please check your internet connection.');
    } else {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
      const payload = {
        contents: [{ parts: [{ text: 'Ping' }] }]
      };
      
      const response = await makePostRequest(url, {}, payload);
      if (response.statusCode === 200) {
        printStatus('Google AI Studio Access', true, 'Successfully generated content with Gemini 2.5 Flash');
      } else {
        let errorMsg = 'Failed to connect';
        try {
          const parsed = JSON.parse(response.body);
          errorMsg = parsed.error ? parsed.error.message : response.body;
        } catch(e) {}
        printStatus('Google AI Studio Access', false, `Status ${response.statusCode}: ${errorMsg}`);
        console.log(`${colors.yellow}Tip: Verify your API key is correct and not restricted. Check https://aistudio.google.com/${colors.reset}`);
      }
    }
  } else {
    console.log(`\nSkipping Google AI Studio connection test (GEMINI_API_KEY is not set).`);
  }

  // Test GCP Vertex AI
  if (isGcloudInstalled && gcpProject) {
    console.log(`\nTesting Google Cloud Vertex AI API...`);
    
    // Check if gcloud can print access token
    let accessToken = runCommand('gcloud auth print-access-token');
    if (!accessToken) {
      printStatus('Google Cloud Credentials', false, 'Could not retrieve access token. Run: gcloud auth application-default login');
    } else {
      const isDnsOk = await dnsCheck('us-central1-aiplatform.googleapis.com');
      if (!isDnsOk) {
        printStatus('Vertex AI Endpoint Connection', false, 'DNS lookup failed for Vertex AI endpoint.');
      } else {
        // Vertex AI endpoint - using us-central1 as a baseline
        const region = 'us-central1';
        const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${gcpProject}/locations/${region}/publishers/google/models/gemini-2.5-flash:generateContent`;
        const headers = {
          'Authorization': `Bearer ${accessToken}`
        };
        const payload = {
          contents: [{ role: 'user', parts: [{ text: 'Ping' }] }]
        };

        const response = await makePostRequest(url, headers, payload);
        if (response.statusCode === 200) {
          printStatus('Vertex AI Access', true, `Successfully authenticated and contacted Vertex AI Gemini in ${region}`);
        } else {
          let errorMsg = 'Failed to connect';
          try {
            const parsed = JSON.parse(response.body);
            errorMsg = parsed.error ? parsed.error.message : response.body;
          } catch(e) {}
          printStatus('Vertex AI Access', false, `Status ${response.statusCode}: ${errorMsg}`);
          
          if (errorMsg.includes('billing') || errorMsg.includes('Billing')) {
            console.log(`\n${colors.red}${colors.bold}[BILLING ERROR DETECTED]${colors.reset}`);
            console.log(`${colors.yellow}Your GCP project [${gcpProject}] needs a linked, active billing account. Or the billing account lacks funds/credits.`);
            console.log(`Check: https://console.cloud.google.com/billing?project=${gcpProject}${colors.reset}`);
          } else if (errorMsg.includes('API has not been used') || errorMsg.includes('aiplatform.googleapis.com')) {
            console.log(`\n${colors.red}${colors.bold}[API NOT ENABLED DETECTED]${colors.reset}`);
            console.log(`${colors.yellow}Enable Vertex AI API in project [${gcpProject}]:`);
            console.log(`gcloud services enable aiplatform.googleapis.com --project=${gcpProject}`);
            console.log(`Or visit: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=${gcpProject}${colors.reset}`);
          }
        }
      }
    }
  } else {
    console.log(`\nSkipping Google Cloud Vertex AI connection test (gcloud not installed or no active GCP project).`);
  }
}

testApis().then(() => {
  console.log(`\n${colors.cyan}--- Diagnostics Complete ---${colors.reset}\n`);
});
