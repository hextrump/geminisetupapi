---
name: gemini_setup
description: "Guides the user to set up Google AI Studio, Google Cloud, Vertex AI, and install/configure `@google/gemini-cli`. Also helps troubleshoot common issues like billing, API keys, and credits."
---

# Gemini Setup Skill

You are now running the **Gemini Setup Skill**. Your job is to fully automate the setup of Google AI Studio and `@google/gemini-cli` with zero manual steps from the user — except for the one human action Google bot-protection requires (generating the API key in the browser).

Execute the following phases in order, immediately and automatically. Do not ask for permission at each step — just run.

---

## Phase 1: Run Diagnostics (Automatic)

Run the diagnostic script immediately:

```bash
node .agents/skills/gemini_setup/scripts/check_env.js
```

Summarize the output for the user:
- Which prerequisites are installed (Node.js, NPM, gcloud, gemini-cli)
- Whether `GEMINI_API_KEY` is already set
- Whether Vertex AI / GCP is configured
- Whether the AI Studio API test passed or failed

If `GEMINI_API_KEY` is already set AND the API test passed — skip directly to Phase 5 (verification). Otherwise continue.

---

## Phase 2: Install Missing Prerequisites (Automatic)

### Node.js
If Node.js is missing, tell the user to install it from https://nodejs.org and pause.

### Gemini CLI
If `@google/gemini-cli` is not installed globally, install it automatically without asking:
```bash
npm install -g @google/gemini-cli
```

---

## Phase 3: Get API Key (Co-pilot — One Manual Step)

Explain to the user:
> "Google AI Studio has bot-protection that prevents automated key generation. I'll open the browser directly to the right page. You just need to click **Create API Key**, copy the key, and paste it back here. I'll handle everything else automatically."

Open the browser to:
```
https://aistudio.google.com/api-keys
```

Wait for the user to paste their API key.

---

## Phase 4: Configure Everything (Automatic)

Once the user pastes the API key, automatically execute ALL of the following steps without asking:

### 4a. Save API key to project .env
Write to `.env` in the current working directory:
```
GEMINI_API_KEY=<pasted_key>
```

### 4b. Save API key to home directory .env (global fallback)
Write to `~/.env` (resolving `~` to the home directory: e.g. `C:\Users\<username>\.env` on Windows, or `/home/<username>/.env` / `/Users/<username>/.env` on macOS/Linux):
```
GEMINI_API_KEY=<pasted_key>
```

### 4c. Set as persistent environment variable (Cross-Platform)
Set the environment variable persistently on the user's OS, **and immediately inject it into the current shell process session** so that subsequent verification steps work instantly without requiring a terminal restart:

- **Windows (PowerShell)**:
  Run this command to persist to Registry and set in current process environment:
  ```powershell
  [System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', '<pasted_key>', 'User'); $env:GEMINI_API_KEY = '<pasted_key>'
  ```
- **macOS / Linux**:
  Append the export statement to shell RC files and set in the current process:
  ```bash
  echo 'export GEMINI_API_KEY="<pasted_key>"' >> ~/.bashrc
  echo 'export GEMINI_API_KEY="<pasted_key>"' >> ~/.zshrc
  export GEMINI_API_KEY="<pasted_key>"
  ```

### 4d. Update `~/.gemini/settings.json` to use API key auth
Read the current `~/.gemini/settings.json` (resolving `~` to the user's home directory) and set `selectedType` to `"gemini-api-key"`:
```json
{
  "mcpServers": {},
  "security": {
    "auth": {
      "selectedType": "gemini-api-key"
    }
  }
}
```
Preserve any other existing keys already in the file.

---

## Phase 5: Verify (Automatic)

Run the diagnostic script again to confirm everything is working:
```bash
node .agents/skills/gemini_setup/scripts/check_env.js
```

If all checks pass, run a final live CLI test:
```powershell
$env:GEMINI_API_KEY = [System.Environment]::GetEnvironmentVariable('GEMINI_API_KEY', 'User'); gemini --skip-trust --prompt "Hello! Are you configured correctly? Reply in one sentence."
```

If the CLI responds successfully, report success to the user:
> ✅ **Setup complete!** You can now open any terminal and run `gemini` — the API key is configured globally. No extra setup needed.

---

## Phase 6: Troubleshooting (If Errors Occur)

If any step fails, read the error message and consult:
- `references/troubleshooting.md` in this skill directory for known issues and solutions
- Key error patterns to auto-detect:
  - `404 model not found` → Update model name in check_env.js to the latest available model (e.g. `gemini-2.5-flash`)
  - `BILLING` in error → Open `https://console.cloud.google.com/billing` and guide user
  - `API has not been used` → Run `gcloud services enable aiplatform.googleapis.com`
  - `Permission Denied` / no access token → Run `gcloud auth application-default login`

Apply the fix automatically where possible. Then re-run diagnostics.
