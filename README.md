# Claude Code Router

> This is a repository for testing routing Claude Code requests to different models.

![demo.png](https://github.com/musistudio/claude-code-reverse/blob/main/screenshoots/demo.png)

## Warning! This project is for testing purposes and may consume a lot of tokens! It may also fail to complete tasks!

## Implemented

- [x] Using the qwen2.5-coder-3b-instruct model as the routing dispatcher (since it’s currently free on Alibaba Cloud’s official website)

- [x] Using the qwen-max-0125 model as the tool invoker

- [x] Using deepseek-v3 as the encoding model

- [x] Using deepseek-r1 as the reasoning model

Thanks to the free qwen2.5-coder-3b-instruct model from Alibaba and deepseek’s KV-Cache, we can significantly reduce the cost of using Claude Code. Make sure to set appropriate ignorePatterns for the project. See: https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview

## Usage

0. Install Claude Code

```shell
npm install -g @anthropic-ai/claude-code
```

1. Clone this repo

```shell
git clone https://github.com/musistudio/claude-code-reverse.git
```

2. Install dependencies

```shell
npm i
```

3. Start server

```shell
# Alternatively, you can create an. env file in the repo directory

## disable router
ENABLE_ROUTER=false
OPENAI_API_KEY=""
OPENAI_BASE_URL=""
OPENAI_MODEL=""

## enable router
ENABLE_ROUTER=true
export TOOL_AGENT_API_KEY=""
export TOOL_AGENT_BASE_URL=""
export TOOL_AGENT_MODEL="qwen-max-2025-01-25"

export CODER_AGENT_API_KEY=""
export CODER_AGENT_BASE_URL="https://api.deepseek.com"
export CODER_AGENT_MODEL="deepseek-chat"

export THINK_AGENT_API_KEY=""
export THINK_AGENT_BASE_URL="https://api.deepseek.com"
export THINK_AGENT_MODEL="deepseek-reasoner"

export ROUTER_AGENT_API_KEY=""
export ROUTER_AGENT_BASE_URL=""
export ROUTER_AGENT_MODEL="qwen2.5-coder-3b-instruct"

node index.mjs
```

4. Set environment variable to start claude code

```shell
export DISABLE_PROMPT_CACHING=1
export ANTHROPIC_AUTH_TOKEN="test"
export ANTHROPIC_BASE_URL="http://127.0.0.1:3456"
export API_TIMEOUT_MS=600000
claude
```
