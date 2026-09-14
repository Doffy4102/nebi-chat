import { App, Modal, Setting } from "obsidian";

export class ConfirmModal extends Modal {
  private title: string;
  private message: string;
  private resolve!: (value: boolean) => void;

  constructor(app: App, title: string, message: string) {
    super(app);
    this.title = title;
    this.message = message;
  }

  openAndWait(): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.open();
    });
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: this.title });
    contentEl.createEl("p", { text: this.message });

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Cancel")
          .setCta()
          .onClick(() => {
            this.resolve(false);
            this.close();
          })
      )
      .addButton((btn) =>
        btn
          .setButtonText("Confirm")
          .setDestructive()
          .setCta()
          .onClick(() => {
            this.resolve(true);
            this.close();
          })
      );
  }

  onClose(): void {
    this.contentEl.empty();
    this.resolve(false);
  }
}
