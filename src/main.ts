import dotenv from 'dotenv';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources';

// load value from .env
dotenv.config();

const client = new OpenAI({
    baseURL: process.env.MODEL_BASE_URL,
    apiKey: process.env.MODEL_API_KEY,
});


const SYSTEM_PROMPT = "You are a helpful assistant.";

const messages: ChatCompletionMessageParam[] = [
  { role: "system", content: SYSTEM_PROMPT },
];

let userInput = "一句话简单介绍一下你自己"
messages.push({ role: "user", content: userInput });


async function main() {
    const completion = await client.chat.completions.create({
        messages,
        model: "deepseek-flash",
        // @ts-expect-error DeepSeek 扩展参数，openai-node 类型未收录
        thinking: {"type": "enabled"},
        reasoning_effort: "high",
        stream: false,
    });

    const choice = completion.choices[0]
    if (choice) {
        console.log(choice.message.content);
    } else {
        console.log(`模型未返回候选回答`);
    }

}

main();