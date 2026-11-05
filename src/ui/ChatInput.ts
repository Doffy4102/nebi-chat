import { setIcon } from "obsidian";

export interface NoteContextProfile {
  path: string;
  baseName: string;
}

export class ChatInput {
  private containerEl: HTMLElement;
  private inputWrapper: HTMLElement;
  private textArea: HTMLTextAreaElement;
  private sendBtnEl: HTMLButtonElement;
  private stopBtnEl: HTMLButtonElement;
  private hintEl: HTMLElement;
  private contextDockEl: HTMLElement;
  private contextChipEl: HTMLButtonElement;
  private contextChipLabelEl: HTMLElement;
  private contextProfile: NoteContextProfile | null = null;
  private contextAttached: boolean = true;
  private onSubmit: (text: string) => void;
  private onStop: () => void;
  private onToggleContext: () => void;
  private isGenerating: boolean = false;

  constructor(
    parentEl: HTMLElement,
    onSubmit: (text: string) => void,
    onStop: () => void,
    onToggleContext: () => void
  ) {
    this.onSubmit = onSubmit;
    this.onStop = onStop;
    this.onToggleContext = onToggleContext;
    this.containerEl = parentEl.createDiv({ cls: "nebi-chat-input-area" });

    this.contextDockEl = this.containerEl.createDiv({
      cls: "nebi-chat-context-dock nebi-chat-hidden",
    });
    this.contextChipEl = this.contextDockEl.createEl("button", {
      cls: "nebi-chat-context-chip",
      attr: { type: "button" },
    });
    const chipIcon = this.contextChipEl.createSpan({ cls: "nebi-chat-context-chip-icon" });
    setIcon(chipIcon, "file-text");
    this.contextChipLabelEl = this.contextChipEl.createSpan({
      cls: "nebi-chat-context-chip-label",
    });
    this.contextChipEl.addEventListener("click", () => {
      this.onToggleContext();
    });

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

  setNoteContext(profile: NoteContextProfile | null, attached: boolean): void {
    this.contextProfile = profile;
    this.contextAttached = attached;
    this.updateContextChip();
  }

  private updateContextChip(): void {
    if (!this.contextProfile) {
      this.contextDockEl.addClass("nebi-chat-hidden");
      return;
    }

    this.contextDockEl.removeClass("nebi-chat-hidden");
    this.contextChipEl.toggleClass("nebi-chat-context-chip-off", !this.contextAttached);
    const label = this.contextAttached
      ? this.contextProfile.baseName
      : `${this.contextProfile.baseName} · context off`;
    this.contextChipLabelEl.setText(label);
    const title = this.contextAttached
      ? `${this.contextProfile.path} — attached to next message. Click to detach`
      : `${this.contextProfile.path} — not attaching to next message. Click to attach`;
    this.contextChipEl.setAttribute("title", title);
    this.contextChipEl.setAttribute("aria-label", title);
  }

  focus(): void {
    this.textArea.focus();
  }

  getElement(): HTMLElement {
    return this.containerEl;
  }
}
