import { BaseProvider } from "./BaseProvider";
import { ModelInfo } from "../../types";

export class OpenRouterProvider extends BaseProvider {
  readonly id = "openrouter";
  readonly name = "OpenRouter";
  readonly models: ModelInfo[] = [
    {
      id: "nvidia/nemotron-3.5-lightning:free",
      name: "NVIDIA Nemotron 3.5 Lightning",
      maxTokens: 65536,
      contextWindow: 1000000,
    },
    {
      id: "nvidia/nemotron-3-super-120b-a12b:free",
      name: "NVIDIA Nemotron 3 Super",
      maxTokens: 235929,
      contextWindow: 262144,
    },
    {
      id: "nvidia/nemotron-3-ultra-550b-a55b:free",
      name: "NVIDIA Nemotron 3 Ultra",
      maxTokens: 65536,
      contextWindow: 1000000,
    },
    {
      id: "nvidia/nemotron-3.5-super-vl:free",
      name: "NVIDIA Nemotron 3.5 Super VL",
      maxTokens: 131072,
      contextWindow: 1000000,
    },
    {
      id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      name: "NVIDIA Nemotron 3 Nano Omni",
      maxTokens: 65536,
      contextWindow: 256000,
    },
    {
      id: "google/gemma-4-26b-a4b-it:free",
      name: "Google Gemma 4 26B",
      maxTokens: 32768,
      contextWindow: 262144,
    },
    {
      id: "google/gemma-4-31b-it:free",
      name: "Google Gemma 4 31B",
      maxTokens: 32768,
      contextWindow: 262144,
    },
    {
      id: "thinkingmachines/inkling:free",
      name: "Thinking Machines Inkling",
      maxTokens: 262144,
      contextWindow: 1048576,
    },
    {
      id: "thinkingmachines/inkling-small:free",
      name: "Thinking Machines Inkling Small",
      maxTokens: 262144,
      contextWindow: 1048576,
    },
    {
      id: "dots-studio/dots-3-note-preview:free",
      name: "Dots Studio Dots 3 Note",
      maxTokens: 460800,
      contextWindow: 512000,
    },
    {
      id: "poolside/laguna-s-2.1:free",
      name: "Poolside Laguna S 2.1",
      maxTokens: 32768,
      contextWindow: 262144,
    },
    {
      id: "poolside/laguna-xs-2.1:free",
      name: "Poolside Laguna XS 2.1",
      maxTokens: 32768,
      contextWindow: 262144,
    },
    {
      id: "cohere/north-mini-code:free",
      name: "Cohere North Mini Code",
      maxTokens: 64000,
      contextWindow: 256000,
    },
    {
      id: "liquid/lfm-2.5-2.6b:free",
      name: "LiquidAI LFM 2.5 2.6B",
      maxTokens: 8192,
      contextWindow: 65536,
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
