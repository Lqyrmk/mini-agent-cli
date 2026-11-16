import { callLLM } from "./llm.js"
import type { ChatCompletionMessageParam, ChatCompletionMessageToolCall } from 'openai/resources';
import type { ToolResult } from "./types.js";
import { toolMap } from "./tools.js"


const SYSTEM_PROMPT = "You are a helpful assistant.";
const MAX_ROUNDS = 8;


export type Agent = {
    chat: (userText: string) => Promise<string>;
    history: () => readonly ChatCompletionMessageParam[];
}

export function createAgent(): Agent {

    // Agent 对话历史
    const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
    ];

    const history = () => messages;

    async function chat(userText: string): Promise<string>  {

        messages.push({ role: "user", content: userText });

        // Agent Loop
        for (let i = 0; i < MAX_ROUNDS; i++) {

            const reply = await callLLM(messages);

            if (reply.role !== 'assistant') {
                throw new Error("LLM 返回非 assistant 消息");
            }

            messages.push(reply);  // { role: "assistant", ... }

            const toolCalls = reply.tool_calls ?? [];
            if (toolCalls.length === 0) {
                return reply.content ?? "";
            }

            // tool call
            for (const call of toolCalls) {
                const result = await executeTool(call);
                console.log("- 工具调用结果: ", result)
                messages.push({
                    role: "tool",
                    tool_call_id: call.id,
                    content: JSON.stringify(result),
                });
            }

        }

        return `达到最大轮数 ${MAX_ROUNDS} 轮，Agent 停止。`;
    }

    return {
        chat,
        history
    };

}

async function executeTool(call: ChatCompletionMessageToolCall): Promise<ToolResult> {
    if (call.type === "function") {
        const toolName = call.function.name;
        const handler = toolMap[toolName];
        if (!handler) {
            return { ok: false, error: `未知的工具: ${toolName}` }
        }
        console.log(`- 模型调用了工具：${toolName}，参数：${typeof call.function.arguments}`)
        const args = JSON.parse(call.function.arguments)
        return await handler(args)

    } else {  // type: custom
        return { ok: false, error: "当前不支持 ChatCompletionMessageCustomToolCall 类型的工具调用：" }
    }

}