import { AIProvider } from "../types";

export class ProviderSelector {
  private containerEl: HTMLElement;
  private providerSelect: HTMLSelectElement;
  private modelSelect: HTMLSelectElement;
  private providers: AIProvider[] = [];
  private activeProviderId: string = "";
  private onProviderChange: (providerId: string) => void;
  private onModelChange: (modelId: string) => void;

  constructor(
    parentEl: HTMLElement,
    onProviderChange: (providerId: string) => void,
    onModelChange: (modelId: string) => void
  ) {
    this.onProviderChange = onProviderChange;
    this.onModelChange = onModelChange;
    this.containerEl = parentEl.createDiv({ cls: "nebi-chat-selector" });

    this.providerSelect = this.containerEl.createEl("select", {
      cls: "nebi-chat-select",
    });

    this.modelSelect = this.containerEl.createEl("select", {
      cls: "nebi-chat-select",
    });

    this.providerSelect.addEventListener("change", () => {
      const selectedId = this.providerSelect.value;
      this.activeProviderId = selectedId;
      this.updateModels(selectedId);
      this.onProviderChange(selectedId);
    });

    this.modelSelect.addEventListener("change", () => {
      this.onModelChange(this.modelSelect.value);
    });
  }

  setProviders(providers: AIProvider[]): void {
    this.providers = providers;
    this.providerSelect.empty();

    for (const provider of providers) {
      const option = this.providerSelect.createEl("option", {
        value: provider.id,
        text: provider.name,
      });
      if (!provider.isConfigured()) {
        option.setText(`${provider.name} \u2022 no key`);
      }
    }
  }

  setActiveProvider(providerId: string): void {
    this.activeProviderId = providerId;
    this.providerSelect.value = providerId;
    this.updateModels(providerId);
  }

  private updateModels(providerId: string): void {
    const provider = this.providers.find((p) => p.id === providerId);
    if (!provider) return;

    this.modelSelect.empty();

    for (const model of provider.models) {
      this.modelSelect.createEl("option", {
        value: model.id,
        text: model.name,
      });
    }
  }

  setActiveModel(modelId: string): void {
    this.modelSelect.value = modelId;
  }

  refreshProviderList(): void {
    const currentProvider = this.providerSelect.value;
    this.providerSelect.empty();

    for (const provider of this.providers) {
      const option = this.providerSelect.createEl("option", {
        value: provider.id,
        text: provider.name,
      });
      if (!provider.isConfigured()) {
        option.setText(`${provider.name} \u2022 no key`);
      }
    }

    this.providerSelect.value = currentProvider;
  }

  getElement(): HTMLElement {
    return this.containerEl;
  }
}
