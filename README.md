# 🚀 Gemini Setup API & Agent Skill

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![Gemini CLI](https://img.shields.io/badge/@google/gemini--cli-0.49.0-orange.svg)](https://www.npmjs.com/package/@google/gemini-cli)

A highly optimized, fully automated, and cross-platform **agent skill** for Google AI Studio and `@google/gemini-cli` one-click environment setup and diagnostics.

This repository provides full-cycle automated environment analysis, multi-level local and global variable injection, API connectivity validation, and comprehensive troubleshooting guides for common billing/quota errors (such as Prepay 429 and GCP Billing). It aims to help developers connect to the Gemini API ecosystem with zero manual configuration cost.

---

## 🌟 Key Features

This skill automatically orchestrates and executes the following 6 life-cycle phases:

| Phase | Phase Name | Automated Behaviors |
| :--- | :--- | :--- |
| **Phase 1** | **Automated Diagnostics** | Runs a zero-dependency diagnostics script to verify Node.js, NPM, Gemini CLI, and gcloud installations, and tests direct API connectivity. |
| **Phase 2** | **Prerequisites Setup** | Auto-detects and installs the `@google/gemini-cli` globally, and prompts to upgrade Node.js if needed. |
| **Phase 3** | **Copilot Browser Flow** | Launches your local Chrome browser with CDP debugging enabled, navigating straight to the AI Studio API Keys page to bypass bot-protection. |
| **Phase 4** | **Multi-Level Persistence** | Automatically writes the API key to the project `.env`, user home directory `.env`, persistent OS registry environment variables (Windows/macOS/Linux), and updates `settings.json`. |
| **Phase 5** | **Live Connection Test** | Injects the active session variables immediately so you can test and chat with `@google/gemini-cli` in real-time without restarting your terminal. |
| **Phase 6** | **Self-Healing Troubleshooting** | Intercepts common errors like 429 Quota Exceeded (Prepay), GCP Billing not linked, and 404 Model Not Found, offering immediate step-by-step solutions. |

---

## 📦 Installation

This skill is fully compliant with the `npx skills` open agent skills ecosystem standard.

To install this setup skill globally into your AI coding assistant (such as Cursor, Claude Code, or Antigravity), simply run the following command in your terminal:

```bash
npx skills add hextrump/geminisetupapi@gemini_setup -g -y
```

---

## 🛠️ Local Running & Development Guide

### 1. Run Local Environment Diagnostics
This repository includes a lightweight, **zero-dependency** environment diagnostics script. It automatically detects your system setup and parses your local `.env` files and user-level home directories:

```bash
node .agents/skills/gemini_setup/scripts/check_env.js
```

### 2. Directory Structure
```text
googlesetapi/
├── .agents/
│   └── skills/
│       └── gemini_setup/
│           ├── SKILL.md                 # Core skill logic and execution steps
│           ├── scripts/
│           │   └── check_env.js         # Zero-dependency diagnostics script
│           └── references/
│               └── troubleshooting.md   # Comprehensive billing and quota troubleshooting guide
├── .gitignore                           # Security policy preventing private key leaks
└── README.md                            # This documentation (English)
```

---

## 🚨 Troubleshooting & FAQ

### 1. Error: `Your prepayment credits are depleted` (RESOURCE_EXHAUSTED / 429)
* **Cause**: This is Google AI Studio's newest billing policy. If your developer project is associated with a paid account but your prepay credit balance drops to zero, the API blocks calls with a 429 rate limit error.
* **Solution**:
  1. Open [Google AI Studio Projects](https://aistudio.google.com/projects).
  2. Go to the Billing / Settings tab of your active project.
  3. Either add a small prepay balance (e.g., $5) via credit card to reactivate the Pay-as-you-go quota, or create/switch to a **Free Tier** project and generate a new API key.

### 2. Windows Environment Variables Do Not Take Effect Instantly?
* **Solution**: When user-level environment variables are written to the Windows Registry, active console sessions may not see the changes immediately. While our Skill handles session-level injection during Phase 4, if you encounter this in an external terminal, simply run the following command to refresh it:
  ```powershell
  $env:GEMINI_API_KEY = [System.Environment]::GetEnvironmentVariable('GEMINI_API_KEY', 'User')
  ```

---

## 📄 License

This project is open-source and licensed under the **MIT License**. Contributions are always welcome!
