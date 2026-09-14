import { BaseProvider } from "./BaseProvider";
import { ModelInfo } from "../../types";

export class CerebrasProvider extends BaseProvider {
  readonly id = "cerebras";
  readonly name = "Cerebras";
  readonly models: ModelInfo[] = [
    {
      id: "llama-3.3-70b",
      name: "Llama 3.3 70B",
      maxTokens: 8192,
      contextWindow: 1000000,
    },
    {
      id: "llama-3.1-8b",
      name: "Llama 3.1 8B",
      maxTokens: 8192,
      contextWindow: 1000000,
    },
  ];

  protected getBaseUrl(): string {
    return "https://api.cerebras.ai/v1";
  }
}
