import { callLLM } from "./llm.js"
import type { StreamCallbacks } from "./llm.js"
import type { Message, AgentReply, ToolCall, ToolResult } from "./types.js";
import { toolMap } from "./tools.js"
import ar from "zod/v4/locales/ar.cjs";


const SYSTEM_PROMPT = "You are a helpful assistant.";
const MAX_ROUNDS = 8;

export type AgentEvents = StreamCallbacks & {
    onToolCall?: (call: ToolCall, args: unknown) => void,
    onToolResult?: (call: ToolCall, result: ToolResult) => void,
}

export type Agent = {
    chat: (userText: string, events: AgentEvents) => Promise<AgentReply>;
    history: () => readonly Message[];
}

export function createAgent(): Agent {

    // Agent 对话历史
    const messages: Message[] = [
        { role: "system", content: SYSTEM_PROMPT },
    ];

    const history = () => messages;

    async function chat(userText: string, events: AgentEvents): Promise<AgentReply>  {

        messages.push({ role: "user", content: userText });

        // Agent Loop
        for (let i = 0; i < MAX_ROUNDS; i++) {

            const reply = await callLLM(messages, events);

            if (reply.role !== 'assistant') {
                throw new Error("LLM 返回非 assistant 消息");
            }

            messages.push(reply);  // { role: "assistant", ... }

            const toolCalls = reply.toolCalls ?? [];
            if (toolCalls.length === 0) {
                return {  // AgentReply
                    ok: true,
                    value: {
                        content: reply.content,
                        reasoning_content: reply.reasoning_content,
                    },
                };
            }

            // tool call
            for (const call of toolCalls) {
                const result = await executeTool(call, events);
                messages.push({
                    role: "tool",
                    toolCallId: call.id,
                    content: JSON.stringify(result),
                });
            }

        }

        return { ok: false, error: `达到最大轮数 ${MAX_ROUNDS} 轮，Agent 停止。` };
    }

    return { chat, history };

}

async function executeTool(call: ToolCall, events: AgentEvents): Promise<ToolResult> {
    const toolName = call.name;
    const handler = toolMap[toolName];
    if (!handler) {
        return { ok: false, error: `未知的工具: ${toolName}` }
    }

    let args;
    try {
        args = JSON.parse(call.arguments)
    } catch {
        return { ok: false, error: `工具参数不是合法 JSON: ${call.arguments}` }
    }

    events.onToolCall?.(call, args)
    const toolResult = await handler(args)
    events.onToolResult?.(call, toolResult)
    return toolResult
}