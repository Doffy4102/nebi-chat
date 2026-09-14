import { BaseProvider } from "./BaseProvider";
import { ModelInfo } from "../../types";

export class GroqProvider extends BaseProvider {
  readonly id = "groq";
  readonly name = "Groq";
  readonly models: ModelInfo[] = [
    {
      id: "groq/compound",
      name: "Groq Compound",
      maxTokens: 8192,
      contextWindow: 131072,
    },
    {
      id: "groq/compound-mini",
      name: "Groq Compound Mini",
      maxTokens: 8192,
      contextWindow: 131072,
    },
   
  ];

  protected getBaseUrl(): string {
    return "https://api.groq.com/openai/v1";
  }
}
