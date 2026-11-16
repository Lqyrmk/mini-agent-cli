import { createAgent } from './agent.js'
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from 'node:process'

const agent = createAgent();
console.log("Mini-Agent 已启动。输入 /exit 退出。");

async function main() {
    const rl = createInterface({ input: stdin, output: stdout });
    try {
        // 多轮对话
        while (true) {
            const userInput = (await rl.question("> User: ")).trim();
            if (userInput === "exit" || userInput === "/exit" || userInput === "exit()") break;
            if (!userInput) continue;

            console.log("> Agent: ");

            const agentReply = await agent.chat(userInput);

            if (agentReply.ok) {
                const answer = agentReply.value;
                console.log(answer.reasoning_content);
                console.log(">>> 回答：\n", answer.content);
            } else {
                console.log(agentReply.error);
            }

        }
    } catch (err: unknown) {
        console.error("出错:", err instanceof Error ? err.message : err);
    } finally {
        rl.close();
    }
}

main()