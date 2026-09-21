import { AIProvider, ChatRequest } from "../types";
import { GeminiProvider } from "./providers/GeminiProvider";
import { GroqProvider } from "./providers/GroqProvider";
import { CerebrasProvider } from "./providers/CerebrasProvider";
import { OpenRouterProvider } from "./providers/OpenRouterProvider";
import { OllamaProvider } from "./providers/OllamaProvider";
import { PluginSettings } from "../settings/PluginSettings";

export class ProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private settings: PluginSettings;

  constructor(settings: PluginSettings) {
    this.settings = settings;

    // Register all providers
    const allProviders: AIProvider[] = [
      new GeminiProvider(),
      new GroqProvider(),
      new CerebrasProvider(),
      new OpenRouterProvider(),
      new OllamaProvider(),
    ];

    for (const provider of allProviders) {
      this.providers.set(provider.id, provider);
    }

    this.applySettings();
  }

  applySettings(): void {
    const settingsData = this.settings.data_;

    for (const [id, provider] of this.providers) {
      const config = settingsData.providers[id];
      if (config) {
        provider.setApiKey(config.apiKey);
        provider.setBaseUrl(config.baseUrl);
        provider.setTemperature(settingsData.temperature);
        provider.setMaxTokens(settingsData.maxTokens);
      }
    }
  }

  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  getActiveProvider(): AIProvider | undefined {
    return this.providers.get(this.settings.activeProvider);
  }

  async *chat(request: ChatRequest): AsyncGenerator<string> {
    const provider = this.getActiveProvider();
    if (!provider) {
      throw new Error("No active provider selected. Choose one from the dropdown above.");
    }

    const settingsProvider = this.settings.getProvider(provider.id);
    const apiKey = settingsProvider?.apiKey || "";
    const model = settingsProvider?.selectedModel || provider.models[0]?.id;

    if (provider.id !== "ollama" && !apiKey) {
      throw new Error(
        `No API key for ${provider.name}. Go to Settings > Nebi Chat and add your API key.`
      );
    }

    if (!model) {
      throw new Error("No model selected");
    }

    const gen = provider.chat({
      messages: request.messages,
      model,
      systemPrompt: settingsProvider?.systemPrompt || request.systemPrompt || this.settings.systemPrompt,
      signal: request.signal,
    }) as AsyncGenerator<string>;

    for await (const value of gen) {
      yield value;
    }
  }
}
