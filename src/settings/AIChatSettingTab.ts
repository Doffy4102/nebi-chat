import { Notice, PluginSettingTab, Setting, requestUrl } from "obsidian";
import { DEFAULT_SETTINGS } from "../types";
import type AIChatPlugin from "../main";
import { ConfirmModal } from "../ui/ConfirmModal";

export class AIChatSettingTab extends PluginSettingTab {
  plugin: AIChatPlugin;

  constructor(app: AIChatPlugin["app"], plugin: AIChatPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName("Providers").setHeading();

    const providers = [
      {
        id: "gemini",
        name: "Google Gemini",
        help: "Get your API key at ai.google.dev. Free tier: ~1,500 req/day.",
      },
      {
        id: "groq",
        name: "Groq",
        help: "Get your API key at console.groq.com. Free tier: 30 RPM, 1,000 req/day.",
      },
      {
        id: "cerebras",
        name: "Cerebras",
        help: "Get your API key at cloud.cerebras.ai. Free tier: 1M tokens/day.",
      },
      {
        id: "openrouter",
        name: "OpenRouter",
        help: "Get your API key at openrouter.ai. Free tier: 20+ models, 50 req/day.",
      },
      {
        id: "ollama",
        name: "Ollama (Local)",
        help: "Run Ollama locally on port 11434. No API key needed.",
      },
    ];

    for (const provider of providers) {
      new Setting(containerEl)
        .setName(provider.name)
        .setDesc(provider.help)
        .addText((text) => {
          text
            .setPlaceholder("API Key")
            .setValue(this.plugin.settings.getProvider(provider.id)?.apiKey || "")
            .onChange(async (value) => {
              this.plugin.settings.setProvider(provider.id, { apiKey: value });
              await this.plugin.settings.save();
              this.plugin.providerManager.applySettings();
            });
          text.inputEl.type = "password";
        })
        .addButton((btn) => {
          btn.setButtonText("Test").onClick(async () => {
            const config = this.plugin.settings.getProvider(provider.id);
            const apiKey = config?.apiKey || "";
            const providerInstance = this.plugin.providerManager.getProvider(provider.id);
            const model = config?.selectedModel || providerInstance?.models[0]?.id || "";

            if (!apiKey && provider.id !== "ollama") {
              new Notice("Enter an API key first");
              return;
            }
            if (!model) {
              new Notice("No model available for this provider");
              return;
            }

            btn.setButtonText("Testing...");
            btn.setDisabled(true);

            try {
              const baseUrl = config?.baseUrl || "";
              const headers: Record<string, string> = {
                "Content-Type": "application/json",
              };
              if (apiKey) {
                headers["Authorization"] = `Bearer ${apiKey}`;
              }

              const res = await requestUrl({
                url: `${baseUrl}/chat/completions`,
                method: "POST",
                headers,
                body: JSON.stringify({
                  model,
                  messages: [{ role: "user", content: "hi" }],
                  max_tokens: 5,
                }),
              });

              if (res.status >= 200 && res.status < 300) {
                new Notice(`✓ ${provider.name} connected successfully`);
              } else {
                const err = res.text || "Unknown error";
                new Notice(`✗ ${provider.name}: HTTP ${res.status}`);
                console.error(`[Nebi Chat] Test failed for ${provider.name}:`, err);
              }
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : "Connection failed";
              new Notice(`✗ ${provider.name}: ${msg}`);
            } finally {
              btn.setButtonText("Test");
              btn.setDisabled(false);
            }
          });
        });
    }

    new Setting(containerEl).setName("Chat Configuration").setHeading();

    new Setting(containerEl)
      .setName("Default Provider")
      .setDesc("Which AI provider to use by default")
      .addDropdown((dropdown) => {
        for (const p of providers) {
          dropdown.addOption(p.id, p.name);
        }
        dropdown.setValue(this.plugin.settings.activeProvider);
        dropdown.onChange(async (value) => {
          this.plugin.settings.activeProvider = value;
          await this.plugin.settings.save();
        });
      });

    new Setting(containerEl)
      .setName("System Prompt")
      .setDesc("Instructions for the AI assistant")
      .addTextArea((text) =>
        text
          .setPlaceholder("You are a helpful AI assistant...")
          .setValue(this.plugin.settings.systemPrompt)
          .onChange(async (value) => {
            this.plugin.settings.systemPrompt = value;
            await this.plugin.settings.save();
          })
      );

    new Setting(containerEl)
      .setName("Max Tokens")
      .setDesc("Maximum tokens per response")
      .addSlider((slider) =>
        slider
          .setLimits(256, 32768, 256)
          .setValue(this.plugin.settings.maxTokens)
          .onChange(async (value) => {
            this.plugin.settings.maxTokens = value;
            await this.plugin.settings.save();
          })
      );

    new Setting(containerEl)
      .setName("Temperature")
      .setDesc("Randomness of responses (0 = deterministic, 2 = creative)")
      .addSlider((slider) =>
        slider
          .setLimits(0, 2, 0.1)
          .setValue(this.plugin.settings.temperature)
          .onChange(async (value) => {
            this.plugin.settings.temperature = value;
            await this.plugin.settings.save();
          })
      );

    new Setting(containerEl)
      .setName("Reset to Defaults")
      .setDesc("Restore all settings to their defaults (API keys are preserved)")
      .addButton((btn) =>
        btn.setButtonText("Reset").onClick(async () => {
          const confirmed = await new ConfirmModal(
            this.app,
            "Reset Settings",
            "Reset all settings to defaults? API keys will be preserved."
          ).openAndWait();
          if (!confirmed) return;
          const apiKeys: Record<string, string> = {};
          for (const [id, config] of Object.entries(this.plugin.settings.data_.providers)) {
            apiKeys[id] = config.apiKey;
          }
          Object.assign(this.plugin.settings.data_, DEFAULT_SETTINGS);
          for (const [id, key] of Object.entries(apiKeys)) {
            this.plugin.settings.setProvider(id, { apiKey: key });
          }
          await this.plugin.settings.save();
          this.plugin.providerManager.applySettings();
          this.display();
          new Notice("Settings reset to defaults");
        })
      );
  }
}
