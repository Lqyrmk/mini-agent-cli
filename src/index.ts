import type { AgentEvents } from './agent.js'
import { createAgent } from './agent.js'
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from 'node:process'

const agent = createAgent();
console.log("Mini-Agent 已启动。输入 /exit 退出。");

const events: AgentEvents = {
    onReasoningStart: () => stdout.write("\n>>> 思考：\n"),
    onReasoningResult: (result) => stdout.write(result),
    onContentStart: () => stdout.write("\n>>> 回答：\n"),
    onContentResult: (result) => stdout.write(result),
    onToolCall: (call, args) => stdout.write(`\n\n- 模型调用了工具：${call.name}，参数：${JSON.stringify(args)}\n`),
    onToolResult: (call, result) => stdout.write(`\n- ${call.name} 工具调用结果: ${JSON.stringify(result)}\n`),
}

async function main() {
    const rl = createInterface({ input: stdin, output: stdout });
    try {
        // 多轮对话
        while (true) {
            const userInput = (await rl.question("> User: ")).trim();
            if (userInput === "exit" || userInput === "/exit" || userInput === "exit()") break;
            if (!userInput) continue;

            console.log("> Agent: ");

            const agentReply = await agent.chat(userInput, events);

            if (!agentReply.ok) {
                console.log("\n" + agentReply.error);
            }
            console.log();

        }
    } catch (err: unknown) {
        console.error("出错:", err instanceof Error ? err.message : err);
    } finally {
        rl.close();
    }
}

main()