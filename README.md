# Claude Code Router

> This is a repository for testing routing Claude Code requests to different models.

![demo.png](https://github.com/musistudio/claude-code-router/blob/main/screenshoots/demo.png)

## Implemented

- [x] Support writing custom plugins for rewriting prompts.

- [x] Support writing custom plugins for implementing routers.

## Usage

0. Install Claude Code

```shell
npm install -g @anthropic-ai/claude-code
```

1. Clone this repo and install dependencies

```shell
git clone https://github.com/musistudio/claude-code-router
cd claude-code-router && pnpm i
npm run build
```

2. Start claude-code-router server

```shell
node dist/cli.js
```

3. Set environment variable to start claude code

```shell
export DISABLE_PROMPT_CACHING=1
export ANTHROPIC_BASE_URL="http://127.0.0.1:3456"
export API_TIMEOUT_MS=600000
claude
```

## Plugin

The plugin allows users to rewrite Claude Code prompt and custom router. The plugin path is in `$HOME/.claude-code-router/plugins`. Currently, there are two demos available: 
1. [custom router](https://github.com/musistudio/claude-code-router/blob/dev/custom-prompt/plugins/deepseek.js)
2. [rewrite prompt](https://github.com/musistudio/claude-code-router/blob/dev/custom-prompt/plugins/gemini.js)

You need to move them to the `$HOME/.claude-code-router/plugins` directory and configure 'usePlugin' in `$HOME/.claude-code-router/config.json`，like this:

```json
{
    "usePlugin": "gemini",
    "LOG": true,
    "OPENAI_API_KEY": "",
    "OPENAI_BASE_URL": "",
    "OPENAI_MODEL": ""
}
```
