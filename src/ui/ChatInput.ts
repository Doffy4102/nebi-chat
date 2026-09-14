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
    this.sendBtnEl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;

    this.stopBtnEl = btnGroup.createEl("button", {
      cls: "nebi-chat-stop-btn nebi-chat-hidden",
      attr: { "aria-label": "Stop generation" },
    });
    this.stopBtnEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg>`;

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
      this.textArea.style.height = "auto";
      this.textArea.style.height = Math.min(this.textArea.scrollHeight, 120) + "px";
    });
  }

  private handleSend(): void {
    const text = this.textArea.value.trim();
    if (!text || this.isGenerating) return;

    this.textArea.value = "";
    this.textArea.style.height = "auto";
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
