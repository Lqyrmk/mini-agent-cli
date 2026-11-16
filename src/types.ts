export type ToolCall = {
    id: string;
    name: string;
    arguments: string;
}

export type Message =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; toolCalls?: ToolCall[] }
  | { role: "tool"; toolCallId: string; content: string };

export type ToolResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

export type ToolHandler = (input: unknown) => ToolResult | Promise<ToolResult>

export type ToolDefinition = {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    handler: ToolHandler;
}