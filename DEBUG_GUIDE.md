# Claude Code Router 详细调试指南

## 请求处理全流程跟踪

### 1. 入口点: CLI 命令处理 (src/cli.ts)
**关键函数**: `executeCodeCommand`
**调试重点**:
- 检查服务是否正在运行 (`isServiceRunning()`)
- 环境变量设置 (`ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`)
- Claude 进程的启动参数

### 2. 路由器服务启动 (src/index.ts)
**关键函数**: `run()`
**调试重点**:
- 服务器配置初始化
- 认证钩子注册 (`apiKeyAuth`)
- 路由钩子注册 (`router`)
- 响应处理钩子注册 (`onSend`)

### 3. 路由决策 (src/utils/router.ts)
**关键函数**: `router()`, `getUseModel()`
**调试重点**:
- Token 计算 (`calculateTokenCount`)
- 模型选择逻辑
- 自定义路由处理

### 4. LLM 请求处理 (@musistudio/llms)
**关键文件**: `@musistudio/llms/src/api/routes.ts`
**关键函数**: `handleTransformerEndpoint()`
**调试重点**:
- 提供商验证
- 请求转换器链处理
- 实际 HTTP 请求发送

### 5. 实际 HTTP 请求 (@musistudio/llms/src/utils/request.ts)
**关键函数**: `sendUnifiedRequest()`
**调试重点**:
- 请求头构建
- 认证信息添加
- HTTP 请求发送

### 6. 响应处理 (src/index.ts)
**关键函数**: `onSend` 钩子
**调试重点**:
- 流式响应处理
- 工具调用检测和处理
- 会话使用情况缓存

## 关键调试断点

### CLI 层调试
1. **src/cli.ts:113** - `executeCodeCommand` 函数入口
2. **src/utils/codeCommand.ts:60** - 环境变量设置
3. **src/utils/codeCommand.ts:76** - Claude 进程启动

### 路由器服务层调试
1. **src/index.ts:52** - `run` 函数入口
2. **src/index.ts:155** - 认证钩子注册
3. **src/index.ts:166** - 路由钩子注册
4. **src/index.ts:206** - 响应处理钩子注册
5. **src/utils/router.ts:140** - 路由函数入口
6. **src/utils/router.ts:66** - `getUseModel` 函数

### LLM 服务层调试
1. **@musistudio/llms/src/server.ts:138** - 模型提供商解析
2. **@musistudio/llms/src/api/routes.ts:16** - `handleTransformerEndpoint` 函数
3. **@musistudio/llms/src/api/routes.ts:179** - `sendRequestToProvider` 函数
4. **@musistudio/llms/src/utils/request.ts:4** - `sendUnifiedRequest` 函数

## 调试技巧

### 1. 日志输出增强
在关键位置添加日志输出:
```javascript
// 在 router 函数中添加
req.log.info(`Routing decision: ${model}`);

// 在 sendUnifiedRequest 中添加
logger?.debug({
  reqId: context.req.id,
  url: url.toString(),
  requestBody: request
}, "Sending request to LLM provider");
```

### 2. 环境变量调试
设置调试环境变量:
```bash
DEBUG=* ccr code "your test prompt"
```

### 3. 配置文件检查
检查 `~/.claude-code-router/config.json`:
```json
{
  "PORT": 3456,
  "APIKEY": "your-api-key",
  "Providers": [...],
  "Router": {
    "default": "provider,model",
    "longContext": "provider,model",
    "think": "provider,model"
  }
}
```

## 常见问题排查

### 1. 请求未到达预期模型
- 检查路由配置是否正确
- 在 `getUseModel` 函数中添加日志，查看实际选择的模型
- 验证 token 计算是否正确

### 2. 认证失败
- 检查 API 密钥是否正确配置
- 验证 `ANTHROPIC_BASE_URL` 是否指向正确的本地服务
- 检查认证钩子中的逻辑

### 3. 响应处理异常
- 检查 `onSend` 钩子中的流处理逻辑
- 验证工具调用的检测和处理
- 确认会话使用情况的缓存机制

### 4. 网络请求问题
- 在 `sendUnifiedRequest` 中添加详细的请求日志
- 检查代理设置
- 验证目标 URL 和请求头









  现在我来回答你的问题：handleTransformerEndpoint 是在哪里被调用的。

  调用关系总结：

  1. 调用位置

  handleTransformerEndpoint 在 @musistudio/llms/src/api/routes.ts 文件中的 registerApiRoutes 函数内被调用：

  fastify.post(
    transformer.endPoint,  // 对于 AnthropicTransformer，这是 "/v1/messages"
    async (req: FastifyRequest, reply: FastifyReply) => {
      // 这里就是 handleTransformerEndpoint 被调用的地方
      return handleTransformerEndpoint(req, reply, fastify, transformer);
    }
  );

  2. 调用链路

  1. 服务器启动时调用 registerApiRoutes (在 @musistudio/llms/src/server.ts 的 start() 方法中)
  2. registerApiRoutes 获取所有带端点的 transformer (包括 AnthropicTransformer)
  3. 为每个 transformer 的 endPoint 注册 POST 路由处理函数
  4. 当用户请求 POST /v1/messages 时，Fastify 调用注册的处理函数
  5. 处理函数调用 handleTransformerEndpoint

  3. 具体路径

  - AnthropicTransformer 定义了 endPoint = "/v1/messages"
  - 当请求到达 POST /v1/messages 时，就会调用 handleTransformerEndpoint

  所以，handleTransformerEndpoint 是在 Fastify 的路由处理机制中被调用的，当你向 /v1/messages 发送 POST
  请求时就会触发这个函数。