import { BaseProvider } from "./BaseProvider";
import { ModelInfo } from "../../types";

export class OpenRouterProvider extends BaseProvider {
  readonly id = "openrouter";
  readonly name = "OpenRouter";
  readonly models: ModelInfo[] = [
    {
      id: "nvidia/nemotron-3.5-lightning:free",
      name: "NVIDIA Nemotron 3.5 Lightning",
      maxTokens: 16384,
      contextWindow: 131072,
    },
    {
      id: "google/gemma-4-26b-a4b-it:free",
      name: "Google Gemma 4 26B",
      maxTokens: 8192,
      contextWindow: 131072,
    },
    {
      id: "google/gemma-4-31b-it:free",
      name: "Google Gemma 4 31B",
      maxTokens: 8192,
      contextWindow: 131072,
    },
    {
      id: "inclusionai/ling-3.0-flash-fin:free",
      name: "Ling 3.0 Flash Fin",
      maxTokens: 8192,
      contextWindow: 131072,
    },
    {
      id: "inclusionai/ling-3.0-flash-sante:free",
      name: "Ling 3.0 Flash Sante",
      maxTokens: 8192,
      contextWindow: 131072,
    },
    {
      id: "inclusionai/ling-3.0-flash-vl:free",
      name: "Ling 3.0 Flash VL",
      maxTokens: 8192,
      contextWindow: 131072,
    },
    {
      id: "dots-studio/dots-3-note-preview:free",
      name: "Dots Studio Dots 3 Note",
      maxTokens: 8192,
      contextWindow: 131072,
    },
    {
      id: "nex-agi/nex-n2.5-pro:free",
      name: "NEX AGI N2.5 Pro",
      maxTokens: 16384,
      contextWindow: 131072,
    },
    {
      id: "nex-agi/nex-n2.5-mini:free",
      name: "NEX AGI N2.5 Mini",
      maxTokens: 16384,
      contextWindow: 131072,
    },
  ];

  protected getBaseUrl(): string {
    return "https://openrouter.ai/api/v1";
  }

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "HTTP-Referer": "https://obsidian.nebi-chat-plugin",
      "X-Title": "Nebi Chat",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }
}
