import { Notice, Plugin } from "obsidian";
import { ChatView, VIEW_TYPE_NEBI_CHAT } from "./views/ChatView";
import { PluginSettings } from "./settings/PluginSettings";
import { AIChatSettingTab } from "./settings/AIChatSettingTab";
import { ProviderManager } from "./services/ProviderManager";

export default class AIChatPlugin extends Plugin {
  settings!: PluginSettings;
  providerManager!: ProviderManager;

  async onload(): Promise<void> {
    this.settings = new PluginSettings(this);
    await this.settings.load();

    this.providerManager = new ProviderManager(this.settings);

    this.registerView(
      VIEW_TYPE_NEBI_CHAT,
      (leaf) => new ChatView(leaf, this.providerManager, this.settings)
    );

    this.addRibbonIcon("message-square", "Nebi Chat", () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open",
      name: "Open chat",
      callback: () => {
        void this.activateView();
      },
    });

    this.addCommand({
      id: "clear",
      name: "Clear history",
      callback: () => {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_NEBI_CHAT);
        if (leaves.length > 0 && leaves[0].view instanceof ChatView) {
          void leaves[0].view.clearChat();
        }
      },
    });

    this.addCommand({
      id: "reload",
      name: "Reload settings",
      callback: () => {
        this.providerManager.applySettings();
        new Notice("Nebi Chat settings reloaded");
      },
    });

    this.addSettingTab(new AIChatSettingTab(this.app, this));
  }

  onunload(): void {
    // Intentionally empty — do not detach leaves
  }

  async activateView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_NEBI_CHAT);

    if (existing.length > 0) {
      await this.app.workspace.revealLeaf(existing[0]);
      return;
    }

    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({
        type: VIEW_TYPE_NEBI_CHAT,
        active: true,
      });
      await this.app.workspace.revealLeaf(leaf);
    }
  }
}
