import express from "express";
import { OpenAI } from "openai";

const app = express();
const port = 3456;

app.use(express.json());

const chatClient = new OpenAI({
  apiKey: "",
  baseURL: "",
});

// Define POST /v1/messages interface
app.post("/v1/messages", async (req, res) => {
  try {
    let {
      model,
      max_tokens,
      messages,
      system = [],
      temperature,
      metadata,
      tools,
    } = req.body;
    messages = messages.map((item) => {
      if (item.content instanceof Array) {
        return {
          role: item.role,
          content: item.content.map((it) => {
            return {
              type: ["tool_result", "tool_use"].includes(it?.type)
                ? "text"
                : it?.type,
              text: it?.content || it?.text || "",
            };
          }),
        };
      }
      return {
        role: item.role,
        content: item.content,
      };
    });
    const data = {
      model: "qwen-max-2025-01-25",
      messages: [
        ...system.map((item) => ({
          role: "system",
          content: item.text,
        })),
        ...messages,
      ],
      temperature,
      stream: true,
    };
    if (tools) {
      data.tools = tools.map((item) => ({
        type: "function",
        function: {
          name: item.name,
          description: item.description,
          parameters: item.input_schema,
        },
      }));
    }
    const completion = await chatClient.chat.completions.create(data);

    // Set SSE response headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const messageId = "msg_" + Date.now();
    let contentBlockIndex = 0;
    let currentContentBlocks = [];

    // Send message_start event
    const messageStart = {
      type: "message_start",
      message: {
        id: messageId,
        type: "message",
        role: "assistant",
        content: [],
        model,
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 1, output_tokens: 1 },
      },
    };
    res.write(
      `event: message_start\ndata: ${JSON.stringify(messageStart)}\n\n`
    );

    let isToolUse = false;
    let toolUseJson = "";
    let currentToolCall = null;
    let hasStartedTextBlock = false;

    for await (const chunk of completion) {
      const delta = chunk.choices[0].delta;

      // Handle tool call response
      if (delta.tool_calls && delta.tool_calls.length > 0) {
        const toolCall = delta.tool_calls[0];

        if (!isToolUse) {
          // Start new tool call block
          isToolUse = true;
          currentToolCall = toolCall;

          const toolBlockStart = {
            type: "content_block_start",
            index: contentBlockIndex,
            content_block: {
              type: "tool_use",
              id: `toolu_${Date.now()}`,
              name: toolCall.function.name,
              input: {},
            },
          };

          // Add to content blocks list
          currentContentBlocks.push({
            type: "tool_use",
            id: toolBlockStart.content_block.id,
            name: toolCall.function.name,
            input: {},
          });

          res.write(
            `event: content_block_start\ndata: ${JSON.stringify(
              toolBlockStart
            )}\n\n`
          );
          toolUseJson = "";
        }

        // Stream tool call JSON
        if (toolCall.function.arguments) {
          const jsonDelta = {
            type: "content_block_delta",
            index: contentBlockIndex,
            delta: {
              type: "input_json_delta",
              partial_json: toolCall.function.arguments,
            },
          };

          toolUseJson += toolCall.function.arguments;

          // Try to parse complete JSON and update content block
          try {
            const parsedJson = JSON.parse(toolUseJson);
            currentContentBlocks[contentBlockIndex].input = parsedJson;
          } catch (e) {
            // JSON not yet complete, continue accumulating
          }

          res.write(
            `event: content_block_delta\ndata: ${JSON.stringify(jsonDelta)}\n\n`
          );
        }
      } else if (delta.content) {
        // Handle regular text content
        if (isToolUse) {
          // End previous tool call block
          const contentBlockStop = {
            type: "content_block_stop",
            index: contentBlockIndex,
          };

          res.write(
            `event: content_block_stop\ndata: ${JSON.stringify(
              contentBlockStop
            )}\n\n`
          );
          contentBlockIndex++;
          isToolUse = false;
        }

        if (!delta.content) continue;

        // If text block not yet started, send content_block_start
        if (!hasStartedTextBlock) {
          const textBlockStart = {
            type: "content_block_start",
            index: contentBlockIndex,
            content_block: {
              type: "text",
              text: "",
            },
          };

          // Add to content blocks list
          currentContentBlocks.push({
            type: "text",
            text: "",
          });

          res.write(
            `event: content_block_start\ndata: ${JSON.stringify(
              textBlockStart
            )}\n\n`
          );
          hasStartedTextBlock = true;
        }

        // Send regular text content
        const contentDelta = {
          type: "content_block_delta",
          index: contentBlockIndex,
          delta: {
            type: "text_delta",
            text: delta.content,
          },
        };

        // Update content block text
        if (currentContentBlocks[contentBlockIndex]) {
          currentContentBlocks[contentBlockIndex].text += delta.content;
        }

        res.write(
          `event: content_block_delta\ndata: ${JSON.stringify(
            contentDelta
          )}\n\n`
        );
      }
    }

    // Close last content block
    const contentBlockStop = {
      type: "content_block_stop",
      index: contentBlockIndex,
    };

    res.write(
      `event: content_block_stop\ndata: ${JSON.stringify(
        contentBlockStop
      )}\n\n`
    );

    // Send message_delta event with appropriate stop_reason
    const messageDelta = {
      type: "message_delta",
      delta: {
        stop_reason: isToolUse ? "tool_use" : "end_turn",
        stop_sequence: null,
        content: currentContentBlocks,
      },
      usage: { input_tokens: 100, output_tokens: 150 },
    };

    res.write(
      `event: message_delta\ndata: ${JSON.stringify(
        messageDelta
      )}\n\n`
    );

    // Send message_stop event
    const messageStop = {
      type: "message_stop",
    };

    res.write(
      `event: message_stop\ndata: ${JSON.stringify(
        messageStop
      )}\n\n`
    );
    res.end();
  } catch (error) {
    console.error("Error in streaming response:", error);
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});