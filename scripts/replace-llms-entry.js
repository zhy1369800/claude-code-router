const fs = require("fs");
const path = require("path");

// 定义要修改的文件
const llmsCjsEntryPath = path.join(
  __dirname,
  "../node_modules/@musistudio/llms/dist/cjs/server.cjs"
);
const llmsMjsEntryPath = path.join(
  __dirname,
  "../node_modules/@musistudio/llms/dist/esm/server.mjs"
);

// 定义本地 llms 项目的路径
const absoluteLlmsCjsPath = path.resolve(
  __dirname,
  "../../llms/dist/cjs/server.cjs"
);
const absoluteLlmsMjsPath = path.resolve(
  __dirname,
  "../../llms/dist/esm/server.mjs"
);

console.log(`llmsCjsEntryPath: ${llmsCjsEntryPath}`);
console.log(`absoluteLlmsCjsPath: ${absoluteLlmsCjsPath}`);

const localLlmsCjsPath = path
  .relative(path.dirname(llmsCjsEntryPath), absoluteLlmsCjsPath)
  .replace(/\\/g, "/");
const localLlmsMjsPath = path
  .relative(path.dirname(llmsMjsEntryPath), absoluteLlmsMjsPath)
  .replace(/\\/g, "/");

// 创建 CommonJS 替换内容
const cjsEntryContent = `module.exports = require('${localLlmsCjsPath}');`;

// 创建 ES Module 替换内容
const mjsEntryContent = `export * from '${localLlmsMjsPath}';`;

try {
  // 替换 CommonJS 入口文件
  fs.writeFileSync(llmsCjsEntryPath, cjsEntryContent);
  console.log(
    `@musistudio/llms CJS entry point replaced with ${localLlmsCjsPath}`
  );

  // 替换 ES Module 入口文件
  fs.writeFileSync(llmsMjsEntryPath, mjsEntryContent);
  console.log(
    `@musistudio/llms ESM entry point replaced with ${localLlmsMjsPath}`
  );
} catch (error) {
  console.error("Error replacing @musistudio/llms entry points:", error);
}
