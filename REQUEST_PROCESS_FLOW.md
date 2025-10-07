# Claude Code Router 请求处理流程

## 1. 用户发起请求
```
用户执行: ccr code "Write a Hello World"
```

## 2. CLI 处理 (src/cli.ts)
```javascript
// 检查服务是否运行
const isRunning = await isServiceRunning()

// 如果未运行，启动服务
if (!isRunning) {
  const startProcess = spawn("node", [cliPath, "start"], {
    detached: true,
    stdio: "ignore",
  });
}

// 等待服务启动后执行代码命令
executeCodeCommand(codeArgs);
```

## 3. 代码命令执行 (src/utils/codeCommand.ts)
```javascript
// 设置环境变量，将请求指向本地路由器
const env = {
  ANTHROPIC_BASE_URL: `http://127.0.0.1:${port}`,
  ANTHROPIC_AUTH_TOKEN: config?.APIKEY || "test",
};

// 执行 Claude 命令
const claudeProcess = spawn(claudePath, argsArr, {
  env: process.env,
  stdio: "inherit",
  shell: true,
});
```

## 4. 路由器服务启动 (src/index.ts)
```javascript
// 创建服务器实例
const server = createServer(config);

// 添加认证钩子
server.addHook("preHandler", async (req, reply) => {
  return new Promise((resolve, reject) => {
    apiKeyAuth(config)(req, reply, done).catch(reject);
  });
});

// 添加路由钩子
server.addHook("preHandler", async (req, reply) => {
  if (req.url.startsWith("/v1/messages")) {
    // 处理 agents
    // 调用路由逻辑
    await router(req, reply, { config, event });
  }
});

// 添加响应处理钩子
server.addHook("onSend", (req, reply, payload, done) => {
  // 处理流式响应和工具调用
  // 缓存会话使用情况
});

// 启动服务器
server.start();
```

## 5. 路由逻辑处理 (src/utils/router.ts)
```javascript
// 计算 token 数量
const tokenCount = calculateTokenCount(messages, system, tools);

// 决定使用哪个模型
let model;
if (config.CUSTOM_ROUTER_PATH) {
  // 使用自定义路由
  model = await customRouter(req, config, { event });
}
if (!model) {
  // 使用默认路由逻辑
  model = await getUseModel(req, tokenCount, config, lastMessageUsage);
}

// 设置最终模型
req.body.model = model;
```

## 6. LLM 服务处理 (@musistudio/llms)
```javascript
// 服务器启动 (src/server.ts)
this.app.addHook("preHandler", async (req, reply) => {
  // 解析提供商和模型
  const [provider, model] = body.model.split(",");
  req.provider = provider;
});

// 注册路由 (src/api/routes.ts)
fastify.post(transformer.endPoint, async (req, reply) => {
  return handleTransformerEndpoint(req, reply, fastify, transformer);
});

// 处理转换器端点 (src/api/routes.ts)
async function handleTransformerEndpoint(req, reply, fastify, transformer) {
  // 1. 验证提供者
  const provider = fastify._server!.providerService.getProvider(providerName);

  // 2. 处理请求转换器链
  const { requestBody, config, bypass } = await processRequestTransformers(
    body, provider, transformer, req.headers, { req }
  );

  // 3. 发送请求到 LLM 提供者
  const response = await sendRequestToProvider(
    requestBody, config, provider, fastify, bypass, transformer, { req }
  );

  // 4. 处理响应转换器链
  const finalResponse = await processResponseTransformers(
    requestBody, response, provider, transformer, bypass, { req }
  );

  // 5. 格式化并返回响应
  return formatResponse(finalResponse, reply, body);
}
```

## 7. 实际 HTTP 请求发送 (@musistudio/llms/src/utils/request.ts)
```javascript
export function sendUnifiedRequest(url, request, config, logger, context) {
  // 构建请求头
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  // 添加认证头
  headers.set("Authorization", `Bearer ${provider.apiKey}`);

  // 构建请求选项
  const fetchOptions = {
    method: "POST",
    headers: headers,
    body: JSON.stringify(request),
    signal: combinedSignal,
  };

  // 发送实际的 HTTP 请求
  return fetch(url.toString(), fetchOptions);
}
```

## 8. 响应处理流程
```
1. LLM 返回响应
2. @musistudio/llms 处理响应转换器链
3. 响应返回到 Claude Code Router
4. Claude Code Router 的 onSend 钩子处理流式响应
5. 工具调用被检测和处理
6. 最终响应返回给 Claude 客户端
```

## 调试关键点

1. **CLI 启动**: 检查 `src/cli.ts` 中的服务启动逻辑
2. **路由决策**: 检查 `src/utils/router.ts` 中的 `getUseModel` 函数
3. **请求转换**: 检查 `@musistudio/llms/src/api/routes.ts` 中的 `processRequestTransformers`
4. **实际请求**: 检查 `@musistudio/llms/src/utils/request.ts` 中的 `sendUnifiedRequest`
5. **响应处理**: 检查 `src/index.ts` 中的 `onSend` 钩子