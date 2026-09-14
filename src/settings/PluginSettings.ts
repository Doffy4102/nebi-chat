import { Plugin } from "obsidian";
import { PluginSettingsData, DEFAULT_SETTINGS } from "../types";

export class PluginSettings {
  private data: PluginSettingsData = DEFAULT_SETTINGS;
  private plugin: Plugin;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  async load(): Promise<void> {
    this.data = Object.assign({}, DEFAULT_SETTINGS, await this.plugin.loadData());
  }

  async save(): Promise<void> {
    await this.plugin.saveData(this.data);
  }

  get data_(): PluginSettingsData {
    return this.data;
  }

  set data_(value: PluginSettingsData) {
    this.data = value;
  }

  get activeProvider(): string {
    return this.data.activeProvider;
  }

  set activeProvider(value: string) {
    this.data.activeProvider = value;
  }

  get systemPrompt(): string {
    return this.data.systemPrompt;
  }

  set systemPrompt(value: string) {
    this.data.systemPrompt = value;
  }

  get maxTokens(): number {
    return this.data.maxTokens;
  }

  set maxTokens(value: number) {
    this.data.maxTokens = value;
  }

  get temperature(): number {
    return this.data.temperature;
  }

  set temperature(value: number) {
    this.data.temperature = value;
  }

  getProvider(providerId: string) {
    return this.data.providers[providerId];
  }

  setProvider(providerId: string, config: Partial<typeof this.data.providers[string]>) {
    if (!this.data.providers[providerId]) {
      this.data.providers[providerId] = {
        apiKey: "",
        baseUrl: "",
        selectedModel: "",
        enabled: true,
        systemPrompt: "",
      };
    }
    Object.assign(this.data.providers[providerId], config);
  }

  async setApiKey(providerId: string, key: string): Promise<void> {
    this.setProvider(providerId, { apiKey: key });
    await this.save();
  }
}
