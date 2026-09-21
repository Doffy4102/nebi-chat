import { setIcon } from "obsidian";

export class ChatInput {
  private containerEl: HTMLElement;
  private inputWrapper: HTMLElement;
  private textArea: HTMLTextAreaElement;
  private sendBtnEl: HTMLButtonElement;
  private stopBtnEl: HTMLButtonElement;
  private hintEl: HTMLElement;
  private onSubmit: (text: string) => void;
  private onStop: () => void;
  private isGenerating: boolean = false;

  constructor(
    parentEl: HTMLElement,
    onSubmit: (text: string) => void,
    onStop: () => void
  ) {
    this.onSubmit = onSubmit;
    this.onStop = onStop;
    this.containerEl = parentEl.createDiv({ cls: "nebi-chat-input-area" });

    this.inputWrapper = this.containerEl.createDiv({ cls: "nebi-chat-input-wrapper" });

    this.textArea = this.inputWrapper.createEl("textarea", {
      cls: "nebi-chat-textarea",
      attr: {
        placeholder: "Ask Nebi anything...",
        rows: "1",
      },
    });

    const btnGroup = this.inputWrapper.createDiv({ cls: "nebi-chat-input-btns" });

    this.sendBtnEl = btnGroup.createEl("button", {
      cls: "nebi-chat-send-btn",
      attr: { "aria-label": "Send message" },
    });
    setIcon(this.sendBtnEl, "send");

    this.stopBtnEl = btnGroup.createEl("button", {
      cls: "nebi-chat-stop-btn nebi-chat-hidden",
      attr: { "aria-label": "Stop generation" },
    });
    setIcon(this.stopBtnEl, "square");

    this.hintEl = this.containerEl.createDiv({ cls: "nebi-chat-hint" });
    this.hintEl.setText("Enter to send \u00B7 Shift+Enter for new line");

    this.sendBtnEl.addEventListener("click", () => this.handleSend());
    this.stopBtnEl.addEventListener("click", () => {
      this.onStop();
    });

    this.textArea.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    this.textArea.addEventListener("input", () => {
      this.resizeTextarea();
    });
  }

  private resizeTextarea(): void {
    this.textArea.setCssProps({ "--nebi-chat-textarea-height": "auto" });
    const newHeight = Math.min(this.textArea.scrollHeight, 120);
    this.textArea.setCssProps({ "--nebi-chat-textarea-height": `${newHeight}px` });
  }

  private handleSend(): void {
    const text = this.textArea.value.trim();
    if (!text || this.isGenerating) return;

    this.textArea.value = "";
    this.resizeTextarea();
    this.onSubmit(text);
  }

  setGenerating(generating: boolean): void {
    this.isGenerating = generating;
    if (generating) {
      this.sendBtnEl.addClass("nebi-chat-hidden");
      this.stopBtnEl.removeClass("nebi-chat-hidden");
    } else {
      this.sendBtnEl.removeClass("nebi-chat-hidden");
      this.stopBtnEl.addClass("nebi-chat-hidden");
    }
    this.textArea.disabled = generating;
    this.textArea.placeholder = generating ? "Generating..." : "Ask Nebi anything...";
    if (!generating) {
      this.textArea.focus();
    }
  }

  focus(): void {
    this.textArea.focus();
  }

  getElement(): HTMLElement {
    return this.containerEl;
  }
}
