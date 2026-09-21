import { Notice, PluginSettingTab, requestUrl, SettingDefinitionItem, SettingGroupItem } from "obsidian";
import { DEFAULT_SETTINGS, ProviderSettings } from "../types";
import type AIChatPlugin from "../main";
import { ConfirmModal } from "../ui/ConfirmModal";

const PROVIDERS = [
  { id: "gemini", name: "Google Gemini", help: "Get your API key at ai.google.dev. Free tier: ~1,500 req/day." },
  { id: "groq", name: "Groq", help: "Get your API key at console.groq.com. Free tier: 30 RPM, 1,000 req/day." },
  { id: "cerebras", name: "Cerebras", help: "Get your API key at cloud.cerebras.ai. Free tier: 1M tokens/day." },
  { id: "openrouter", name: "OpenRouter", help: "Get your API key at openrouter.ai. Free tier: 20+ models, 50 req/day." },
  { id: "ollama", name: "Ollama (Local)", help: "Run Ollama locally on port 11434. No API key needed." },
];

export class AIChatSettingTab extends PluginSettingTab {
  plugin: AIChatPlugin;

  constructor(app: AIChatPlugin["app"], plugin: AIChatPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  getControlValue(key: string): unknown {
    if (key === "activeProvider") return this.plugin.settings.activeProvider;
    if (key === "systemPrompt") return this.plugin.settings.systemPrompt;
    if (key === "maxTokens") return this.plugin.settings.maxTokens;
    if (key === "temperature") return this.plugin.settings.temperature;
    if (key.startsWith("provider_")) {
      const id = key.split("_")[1];
      return this.plugin.settings.getProvider(id)?.apiKey || "";
    }
    return "";
  }

  setControlValue(key: string, value: unknown): void {
    if (key === "activeProvider") {
      this.plugin.settings.activeProvider = value as string;
      this.plugin.settings.save();
    } else if (key === "systemPrompt") {
      this.plugin.settings.systemPrompt = value as string;
      this.plugin.settings.save();
    } else if (key === "maxTokens") {
      this.plugin.settings.maxTokens = value as number;
      this.plugin.settings.save();
    } else if (key === "temperature") {
      this.plugin.settings.temperature = value as number;
      this.plugin.settings.save();
    } else if (key.startsWith("provider_")) {
      const id = key.split("_")[1];
      this.plugin.settings.setProvider(id, { apiKey: value as string });
      this.plugin.settings.save();
      this.plugin.providerManager.applySettings();
    }
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    const providerItems: SettingGroupItem[] = PROVIDERS.map((p) => ({
      name: p.name,
      desc: p.help,
      control: {
        type: "text" as const,
        key: `provider_${p.id}_apiKey`,
        placeholder: p.id === "ollama" ? "Not required" : "API Key",
      },
    }));

    return [
      {
        type: "group",
        heading: "Providers",
        items: providerItems,
      },
      {
        type: "group",
        heading: "Chat Configuration",
        items: [
          {
            name: "Default Provider",
            desc: "Which AI provider to use by default",
            control: {
              type: "dropdown" as const,
              key: "activeProvider",
              options: Object.fromEntries(PROVIDERS.map((p) => [p.id, p.name])),
            },
          },
          {
            name: "System Prompt",
            desc: "Instructions for the AI assistant",
            control: {
              type: "textarea" as const,
              key: "systemPrompt",
              placeholder: "You are a helpful AI assistant...",
              rows: 3,
            },
          },
          {
            name: "Max Tokens",
            desc: "Maximum tokens per response",
            control: {
              type: "slider" as const,
              key: "maxTokens",
              min: 256,
              max: 32768,
              step: 256,
            },
          },
          {
            name: "Temperature",
            desc: "Randomness of responses (0 = deterministic, 2 = creative)",
            control: {
              type: "slider" as const,
              key: "temperature",
              min: 0,
              max: 2,
              step: 0.1,
            },
          },
          {
            name: "Reset to Defaults",
            desc: "Restore all settings to their defaults (API keys are preserved)",
            action: (_el: HTMLElement) => {
              void this.handleReset();
            },
          },
        ],
      },
    ];
  }

  async handleReset(): Promise<void> {
    const confirmed = await new ConfirmModal(
      this.app,
      "Reset Settings",
      "Reset all settings to defaults? API keys will be preserved."
    ).openAndWait();
    if (!confirmed) return;
    const apiKeys: Record<string, string> = {};
    const providerEntries = Object.entries(this.plugin.settings.data_.providers) as [string, ProviderSettings][];
    for (const [id, config] of providerEntries) {
      apiKeys[id] = config.apiKey;
    }
    Object.assign(this.plugin.settings.data_, DEFAULT_SETTINGS);
    const keyEntries = Object.entries(apiKeys) as [string, string][];
    for (const [id, key] of keyEntries) {
      this.plugin.settings.setProvider(id, { apiKey: key });
    }
    await this.plugin.settings.save();
    this.plugin.providerManager.applySettings();
    this.update();
    new Notice("Settings reset to defaults");
  }
}
