# Mini Agent CLI

## 0. 介绍

这是一个自用的学习项目，使用 TypeScript 编写了一个极其简单的 Agent CLI，用于巩固 TypeScript 语法并学习 Agent 相关知识。

## 1. 前置条件

- Node.js 18+
- DeepSeek API Key（环境变量 `MODEL_API_KEY`）
- 依赖：

使用 `npm`：

```bash
npm install openai zod
npm install -D typescript tsx @types/node
```

使用 `pnpm`：

```bash
pnpm add openai zod
pnpm add -D typescript tsx @types/node
```

## 2. 运行

使用 `npx`

```bash
npx tsx src/index.ts
```


## 3. 对话效果

```markdown
Mini-Agent 已启动。输入 /exit 退出。

> User: 看今天几点？我在海口，天气咋样，想去旅行
> Agent:
>>> 思考过程：
The user asks: what time is it now? I'm in Haikou, how's the weather, want to travel. I should call get_current_time and get_weather for Haikou in parallel.
- 模型调用了工具： get_current_time ，参数： {}
- 工具调用结果:  { ok: true, value: '2026-11-16T16:17:51.396Z' }
- 模型调用了工具： get_weather ，参数： { city: '海口' }
- 工具调用结果:  { ok: true, value: { city: '海口', temperature: 25, unit: '°C' } }
The current time is 2026-11-16T16:17:51Z — UTC. Haikou is UTC+8, so local time is 2026-11-17 00:17. Wait, that seems odd. Let me compute: UTC 16:17 + 8 hours = 24:17 = next day 00:17. So local time would be 2026-11-17 00:17. Hmm, that's just past midnight.

I should mention that the time returned is UTC, and convert to Haikou time (China Standard Time, UTC+8). Let me present it clearly.

Weather: 25°C in Haikou, no precipitation info.

Let me give a helpful answer with travel suggestion.
>>> 回答：
 现在为你查到啦：

🕐 **时间**：系统返回的时间是 UTC 时间 `2026-11-16 16:17`，换算成海口所在的北京时间（UTC+8）大约是 **2026年11月17日 凌晨 0:17 左右**。已经是深夜啦，早点休息~

🌤️ **海口天气**：当前气温约 **25°C**，比较温暖舒适，适合出行。

🚗 **旅行小建议**：
- 现在凌晨气温 25°C，体感偏暖，夜间出行记得带件薄外套或注意防蚊。
- 海口这个季节温暖宜人，白天可以考虑去**骑楼老街**、**假日海滩**、**万绿园**这些地方，吹吹海风很舒服。
- 白天紫外线可能较强，记得防晒、多补水；海边注意安全。

需要我帮你查别的城市天气，或者规划一下具体行程吗？😊
```