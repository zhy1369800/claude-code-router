# Transformer 调用流程详解

## 调用链路

### 1. 服务器启动和路由注册
```javascript
// @musistudio/llms/src/server.ts
async start() {
  // 注册 API 路由
  this.app.register(registerApiRoutes); // 这里注册了所有路由
}

// @musistudio/llms/src/api/routes.ts
export const registerApiRoutes: FastifyPluginAsync = async (fastify) => {
  // 获取所有带端点的 transformer
  const transformersWithEndpoint = fastify._server!.transformerService.getTransformersWithEndpoint();

  // 为每个 transformer 注册 POST 路由
  for (const { transformer } of transformersWithEndpoint) {
    if (transformer.endPoint) {
      // 为每个 transformer 的 endPoint 注册路由处理函数
      fastify.post(
        transformer.endPoint, // 例如: "/v1/messages"
        async (req: FastifyRequest, reply: FastifyReply) => {
          // 这里调用了 handleTransformerEndpoint
          return handleTransformerEndpoint(req, reply, fastify, transformer);
        }
      );
    }
  }
}
```

### 2. Transformer 端点定义
```javascript
// @musistudio/llms/src/transformer/anthropic.transformer.ts
export class AnthropicTransformer implements Transformer {
  name = "Anthropic";
  endPoint = "/v1/messages"; // 这是路由路径
  // ...
}
```

### 3. Transformer 注册过程
```javascript
// @musistudio/llms/src/services/transformer.ts
class TransformerService {
  // 初始化时注册默认 transformer
  private async registerDefaultTransformersInternal(): Promise<void> {
    Object.values(Transformers).forEach((TransformerStatic: TransformerConstructor) => {
      // 注册 transformer 实例
      this.registerTransformer(transformerInstance.name!, transformerInstance);
    });
  }

  // 获取带端点的 transformer
  getTransformersWithEndpoint(): { name: string; transformer: Transformer }[] {
    const result: { name: string; transformer: Transformer }[] = [];
    this.transformers.forEach((transformer, name) => {
      if (transformer.endPoint) {
        result.push({ name, transformer }); // AnthropicTransformer 会被包含在这里
      }
    });
    return result;
  }
}
```

### 4. 路由处理函数调用
```javascript
// @musistudio/llms/src/api/routes.ts
async function handleTransformerEndpoint(
  req: FastifyRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
  transformer: any
) {
  // 这个函数处理实际的请求
  // 1. 验证提供者
  // 2. 处理请求转换器链
  // 3. 发送请求到 LLM 提供者
  // 4. 处理响应转换器链
  // 5. 格式化并返回响应
}
```

## 完整调用流程

1. **服务器启动**
   - `Server.start()` → `this.app.register(registerApiRoutes)`

2. **路由注册**
   - `registerApiRoutes()` → `transformerService.getTransformersWithEndpoint()` → 获取 AnthropicTransformer
   - 为每个 transformer 注册 POST 路由:
     ```javascript
     fastify.post("/v1/messages", async (req, reply) => {
       return handleTransformerEndpoint(req, reply, fastify, transformer);
     });
     ```

3. **请求到达**
   - 用户请求 `POST /v1/messages` 到路由器
   - Fastify 匹配到路由并调用处理函数
   - 调用 `handleTransformerEndpoint(req, reply, fastify, transformer)`

4. **请求处理**
   - `handleTransformerEndpoint` 执行完整的请求处理流程
   - 包括验证、转换、发送请求、处理响应等步骤

## 关键调试点

1. **transformerService.getTransformersWithEndpoint()** - 确认 AnthropicTransformer 被正确注册
2. **fastify.post()** 调用 - 确认路由被正确注册
3. **handleTransformerEndpoint** 函数入口 - 实际的请求处理开始点

## 调试建议

在以下位置添加日志来跟踪调用:

```javascript
// 在 registerApiRoutes 中添加日志
console.log("Registering transformers with endpoints:", transformersWithEndpoint);

// 在 handleTransformerEndpoint 开始处添加日志
console.log("Handling transformer endpoint for:", transformer.name, transformer.endPoint);
```