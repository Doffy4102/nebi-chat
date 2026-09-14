import { Notice, Plugin } from "obsidian";
import { ChatView, VIEW_TYPE_NEBI_CHAT } from "./views/ChatView";
import { PluginSettings } from "./settings/PluginSettings";
import { AIChatSettingTab } from "./settings/AIChatSettingTab";
import { ProviderManager } from "./services/ProviderManager";

export default class AIChatPlugin extends Plugin {
  settings!: PluginSettings;
  providerManager!: ProviderManager;

  async onload(): Promise<void> {
    // Load settings
    this.settings = new PluginSettings(this);
    await this.settings.load();

    // Initialize provider manager
    this.providerManager = new ProviderManager(this.settings);

    // Register chat view
    this.registerView(
      VIEW_TYPE_NEBI_CHAT,
      (leaf) => new ChatView(leaf, this.providerManager, this.settings)
    );

    // Add ribbon icon to open chat
    this.addRibbonIcon("message-square", "Nebi Chat", () => this.activateView());

    // Add command to open chat
    this.addCommand({
      id: "open",
      name: "Open Nebi Chat",
      callback: () => this.activateView(),
    });

    // Add command to clear chat
    this.addCommand({
      id: "clear",
      name: "Clear Nebi Chat History",
      callback: () => {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_NEBI_CHAT);
        if (leaves.length > 0 && leaves[0].view instanceof ChatView) {
          (leaves[0].view as ChatView).clearChat();
        }
      },
    });

    // Add command to reload plugin (applies settings changes)
    this.addCommand({
      id: "reload",
      name: "Reload Nebi Chat (apply settings)",
      callback: async () => {
        this.providerManager.applySettings();
        new Notice("Nebi Chat settings reloaded");
      },
    });

    // Register settings tab
    this.addSettingTab(new AIChatSettingTab(this.app, this));
  }

  async onunload(): Promise<void> {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_NEBI_CHAT);
  }

  async activateView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_NEBI_CHAT);

    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]);
      return;
    }

    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({
        type: VIEW_TYPE_NEBI_CHAT,
        active: true,
      });
      this.app.workspace.revealLeaf(leaf);
    }
  }
}
