import { object, properties, z } from "zod";
import type { ToolDefinition, ToolHandler } from "./types.js"

// zod 校验 JSON Schema

const AddSchema = z.object({
    a: z.number().describe('第一个数字'),
    b: z.number().describe('第二个数字')
});

const WeatherSchema = z.object({
    city: z.string().describe('城市名'),
});

// 工具实现

const add: ToolHandler = (input) => {
    const parsedResult = AddSchema.safeParse(input);
    if (!parsedResult.success) {
        return { ok: false, error: parsedResult.error.message}
    }
    const a = parsedResult.data.a
    const b = parsedResult.data.b
    return { ok: true, value: a + b };
};

const getCurrentTime: ToolHandler = () => {
    return { ok: true, value: new Date().toISOString() };
};

const getWeather: ToolHandler = (input) => {

    const parsedResult = WeatherSchema.safeParse(input);
    if (!parsedResult.success) {
        return { ok: false, error: parsedResult.error.message}
    }
    const city = parsedResult.data.city;
    const fakeTemperature = 25;
    return {
        ok: true,
        value: {
            city: city,
            temperature: fakeTemperature,
            unit: "°C",
        }
    }
}


// 工具定义
export const tools: ToolDefinition[] = [
    {
        name: "add",
        description: "用于计算两个数字的和。",
        parameters: {
            type: "object",
            properties: {
                a: { type: "number", description: "第一个数字" },
                b: { type: "number", description: "第二个数字" },
            },
            required: ["a", "b"],
        },
        handler: add,
    },
    {
        name: "get_current_time",
        description: "用于查询当前时间，ISO 8601 格式。",
        parameters: {
            type: "object",
            properties: {},
            required: [],
        },
        handler: getCurrentTime,
    },
    {
        name: "get_weather",
        description: "用于查询某个城市的天气。",
        parameters: {
            type: "object",
            properties: {
                city: { type: "string", description: "城市名" },
            },
            required: ["city"],
        },
        handler: getWeather,
    },
]

// 工具 handler 映射
export const toolMap: Record<string, ToolHandler> = Object.fromEntries(
    tools.map( (t) => [t.name, t.handler] ),
);