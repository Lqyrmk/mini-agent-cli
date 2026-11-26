import dotenv from 'dotenv';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionChunk } from 'openai/resources';
import { openaiTools } from './tools.js';
import type { Message, ToolCall } from './types.js';
import stream from 'stream';

// load value from .env
dotenv.config();

const client = new OpenAI({
    baseURL: process.env.MODEL_BASE_URL,
    apiKey: process.env.MODEL_API_KEY,
});

const MODEL = "deepseek-flash";

// 定义扩展类型：标准 ChatCompletionMessage 加上可能存在的 reasoning_content
type ChatCompletionDeltaWithReasoning  = ChatCompletionChunk.Choice.Delta & {
    reasoning_content?: string;  // 可能为 undefined
};

export type StreamCallbacks = {
    onReasoningStart?: () => void,
    onReasoningResult?: (result: string) => void,
    onContentStart?: () => void,
    onContentResult?: (result: string) => void,
};


export async function callLLM(
    messages: Message[],
    events: StreamCallbacks
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
    const stream = await client.chat.completions.create({
        messages: openaiMessages,
        model: MODEL,
        tools: openaiTools,
        tool_choice: "auto",
        thinking: {type: "enabled"},
        reasoning_effort: "low",
        stream: true,
    });

    let reasoning = "";
    let content = "";
    let reasoningStarted = false;
    let contentStarted = false;

    // Map: index -> tool delta
    const pending = new Map<number, {id: string, name: string, args: string}>();

    // 流式输出
    for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta as ChatCompletionDeltaWithReasoning;
        if (!delta) {
            continue;
        }

        if (delta.reasoning_content) {
            if (!reasoningStarted) {
                reasoningStarted = true;
                events.onReasoningStart?.();
            }
            reasoning += delta.reasoning_content;
            events.onReasoningResult?.(delta.reasoning_content);
        }

        if (delta.content) {
            if (!contentStarted) {
                contentStarted = true;
                events.onContentStart?.();
            }
            content += delta.content;
            events.onContentResult?.(delta.content);
        }

        const DeltaToolCalls = delta.tool_calls ?? [];
        for (const tc of DeltaToolCalls) {
            const slot = pending.get(tc.index) ?? {id: "", name: "", args: ""};
            if (tc.id) slot.id = tc.id;
            if (tc.function?.name) slot.name += tc.function.name;
            if (tc.function?.arguments) slot.args += tc.function.arguments;
            pending.set(tc.index, slot);
        }

    }

    if (pending.size === 0) {  // 没有调用任何工具
        return { role: "assistant", content, reasoning_content: reasoning };
    }

    const toolCalls: ToolCall[] = [...pending.entries()]
                                .sort( ([a], [b]) => a - b )
                                .map( ([, slot]) => ({ id: slot.id, name: slot.name, arguments: slot.args }))

    return { role: "assistant", content, reasoning_content: reasoning, toolCalls, };

}
