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

            const answer = await agent.chat(userInput);
            console.log("> Agent: ", answer);
        }
    } catch (err: unknown) {
        console.error("出错:", err instanceof Error ? err.message : err);
    } finally {
        rl.close();
    }
}

main()