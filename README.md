# 🚀 Gemini Setup API & Agent Skill

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![Gemini CLI](https://img.shields.io/badge/@google/gemini--cli-0.49.0-orange.svg)](https://www.npmjs.com/package/@google/gemini-cli)

一个高度完善、全自动化且支持跨平台的 **Google AI Studio 和 `@google/gemini-cli` 一键式配置与环境诊断 Agent 技能（Agent Skill）**。

本仓库实现了环境的全自动分析、本地与全局变量的多层级持久化注入、API 连通性校验，以及针对常见收费/限流报错（如 Prepay 429、GCP Billing 等）的保姆级排查手册，旨在帮助开发者以零配置成本瞬间接入 Gemini API 宇宙。

---

## 🌟 核心特性 (Key Features)

本技能在运行过程中将自动编排并执行以下 6 个生命周期阶段：

| 阶段 | 任务名称 | 自动化行为 |
| :--- | :--- | :--- |
| **Phase 1** | **全自动环境诊断** | 运行诊断脚本检测 Node.js, NPM, Gemini CLI, gcloud 的安装情况，并校验 API Key 的物理连通性。 |
| **Phase 2** | **自动补全依赖** | 自动检测并全局安装缺失的 `@google/gemini-cli`，提示升级 Node.js 环境。 |
| **Phase 3** | **Copilot 网页导流** | 自动调起本地 Chrome 浏览器直达 AI Studio 密钥页，避开高强度机器人防护验证。 |
| **Phase 4** | **多层级持久化配置** | 自动更新项目 `.env`、用户家目录 `.env`、永久写入系统注册表环境变量（Windows/macOS/Linux），并修改 `settings.json`。 |
| **Phase 5** | **终极连通性测试** | 无需重启终端，即时注入当前会话变量，调用 `@google/gemini-cli` 发起 Live Chat 联调验证。 |
| **Phase 6** | **自愈式故障排查** | 主动匹配 429 Quota Exceeded（Prepay）、Billing 未激活、404 模型不存在等边界异常，自动给出解决指引。 |

---

## 📦 如何在您的 Agent 中安装此技能？

本技能完全兼容 `npx skills` 开放 Agent 技能标准（Open Agent Skills Ecosystem）。

要将此配置技能全局安装到您的 AI 编码助手（如 Cursor、Claude Code、Antigravity）中，只需在终端中运行：

```bash
npx skills add hextrump/geminisetupapi@gemini_setup -g -y
```

---

## 🛠️ 本地运行与开发指南

### 1. 运行本地环境诊断
本仓库附带一个轻量级、**零依赖**的环境诊断脚本。它不仅能检验系统环境，还能自动解析您本地的 `.env` 文件和家目录环境变量：

```bash
node .agents/skills/gemini_setup/scripts/check_env.js
```

### 2. 目录结构
```text
googlesetapi/
├── .agents/
│   └── skills/
│       └── gemini_setup/
│           ├── SKILL.md                 # 核心技能逻辑及执行指令
│           ├── scripts/
│           │   └── check_env.js         # 零依赖高表现力诊断脚本
│           └── references/
│               └── troubleshooting.md   # 精准故障排查与账单充值指南
├── .gitignore                           # 安全策略，防止泄露私钥
└── README.md                            # 本文档
```

---

## 🚨 常见问题与排查 (Troubleshooting)

### 1. 报错：`Your prepayment credits are depleted` (RESOURCE_EXHAUSTED / 429)
* **原因**：这是 Google AI Studio 最新的账户预付费策略。如果项目被切入付费版且 Prepay 账户余额为 0，会触发该强限流拦截。
* **解决办法**：
  1. 登录 [Google AI Studio Projects](https://aistudio.google.com/projects)。
  2. 在 Billing 页面选择充值（例如充值 $5 激活 API）；或创建一个全新的项目，并为其生成 **Free Tier（免费层）** 的 API Key。

### 2. Windows 环境变量未即时生效？
* **解决办法**：Windows 用户环境变量写入注册表后，当前活跃的控制台进程可能存在缓存。本 Skill 已在 Phase 4 实现了会话级注入，如果您在外部终端遇到此问题，只需运行一次：
  ```powershell
  $env:GEMINI_API_KEY = [System.Environment]::GetEnvironmentVariable('GEMINI_API_KEY', 'User')
  ```

---

## 📄 开源许可证

本项目基于 **MIT License** 开源。欢迎共享与贡献！
