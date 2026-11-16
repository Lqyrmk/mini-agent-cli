import dotenv from 'dotenv';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources';
import { openaiTools } from './tools.js';
import type { Message, ToolCall } from './types.js';

// load value from .env
dotenv.config();

const client = new OpenAI({
    baseURL: process.env.MODEL_BASE_URL,
    apiKey: process.env.MODEL_API_KEY,
});

const MODEL = "deepseek-flash";

export async function callLLM(
    messages: Message[]
): Promise<Message> {

    // 业务封装的 Message 类型，需要转换为 SDK 接受的 ChatCompletionMessageParam
    const openaiMessages: ChatCompletionMessageParam[] = messages.map(
        (m) => {
            if (m.role === "tool") {
                return {
                    role: "tool",
                    tool_call_id: m.toolCallId,
                    content: m.content,
                };
            }

            if (m.role == "assistant" && m.toolCalls && m.toolCalls.length > 0) {
                return {
                    role: "assistant",
                    content: m.content,
                    tool_calls: m.toolCalls.map(
                        (call) => ({
                            id: call.id,
                            type: "function",
                            function: {
                                name: call.name,
                                arguments: call.arguments,  // JSON string
                            },
                        })
                    ),
                };
            }

            // no tool calls
            return { role: m.role, content: m.content };

        }
    );

    // 发送请求
    const completion = await client.chat.completions.create({
        messages: openaiMessages,
        model: MODEL,
        tools: openaiTools,
        tool_choice: "auto",
        thinking: {type: "enabled"},
        reasoning_effort: "low",
        stream: false,
    });

    const choice = completion.choices[0];
    if (!choice) {
        throw new Error("模型未返回内容");
    }

    const reply = choice.message;

    // SDK 返回的工具调用列表，需要转换为业务封装的工具调用类型

    if (!reply.tool_calls || reply.tool_calls?.length === 0) {
        return { role: "assistant", content: reply.content ?? "" };
    }

    const toolCalls: ToolCall[] = reply.tool_calls.map(
        (call) => {
            if (call.type === "function") {
                return {
                    id: call.id,
                    name: call.function.name,
                    arguments: call.function.arguments,  // string
                }
            } else {
                throw new Error(`当前不支持 ChatCompletionMessageCustomToolCall 类型的工具调用`)
            }
        }
    );

    return {
        role: "assistant",
        content: reply.content ?? "",
        toolCalls,
    };

}
