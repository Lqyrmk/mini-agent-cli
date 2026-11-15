import { callLLM } from "./llm.js"
import type { ChatCompletionMessageParam } from 'openai/resources';


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
            messages.push(reply);

            if (reply.role !== 'assistant') {
                throw new Error("LLM 返回非 assistant 消息");
            }

            const toolCalls = reply.tool_calls ?? [];
            if (toolCalls.length === 0) {
                return reply.content ?? "";
            }

            // tool call
            // for call in toolCalls

        }

        return `达到最大轮数 ${MAX_ROUNDS} 轮，Agent 停止。`;
    }

    return {
        chat,
        history
    };

}