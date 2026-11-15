import "openai/resources/chat/completions/completions";

declare module "openai/resources/chat/completions/completions" {
    interface ChatCompletionCreateParamsBase {
        thinking?: { type: "enabled" | "disabled" };
    }
}