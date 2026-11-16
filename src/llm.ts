import dotenv from 'dotenv';
import OpenAI from 'openai';
import type { ChatCompletionMessage, ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources';
import { openaiTools } from './tools.js';

// load value from .env
dotenv.config();

const client = new OpenAI({
    baseURL: process.env.MODEL_BASE_URL,
    apiKey: process.env.MODEL_API_KEY,
});

const MODEL = "deepseek-flash";

export async function callLLM(
    messages: ChatCompletionMessageParam[]
): Promise<ChatCompletionMessage> {
    const completion = await client.chat.completions.create({
        messages,
        model: MODEL,
        tools: openaiTools,
        tool_choice: "auto",
        thinking: {type: "enabled"},
        reasoning_effort: "low",
        stream: false,
    });

    const choice = completion.choices[0];
    if (choice) {
        return choice.message;
    } else {
        throw new Error("模型未返回内容");
    }
}
