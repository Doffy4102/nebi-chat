import { App, Component, MarkdownRenderer } from "obsidian";
import { Message } from "../types";
import { NEBI_ICON_SVG } from "../icon-svg";

function createSvgIcon(parent: HTMLElement, svgContent: string): HTMLElement {
  const wrapper = parent.createDiv({ cls: "nebi-chat-icon-wrapper" });
  setSvgContent(wrapper, svgContent);
  return wrapper;
}

function setSvgContent(parent: HTMLElement, svgContent: string): void {
  parent.empty();
  const doc = new DOMParser().parseFromString(svgContent, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (svg) parent.appendChild(document.importNode(svg, true));
}

function addCodeBlockCopyButtons(container: HTMLElement): void {
  const pres = container.querySelectorAll("pre");
  for (const pre of Array.from(pres)) {
    if (pre.querySelector(".nebi-chat-code-copy-btn")) continue;
    const btn = pre.createEl("button", {
      cls: "nebi-chat-code-copy-btn",
      attr: { "aria-label": "Copy code" },
    });
    const copyIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    const checkIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    setSvgContent(btn, copyIcon);
    btn.addEventListener("click", async () => {
      const code = pre.querySelector("code");
      const text = code ? code.textContent || "" : pre.textContent || "";
      try {
        await navigator.clipboard.writeText(text);
        btn.addClass("nebi-chat-code-copy-btn-copied");
        setSvgContent(btn, checkIcon);
        window.setTimeout(() => {
          btn.removeClass("nebi-chat-code-copy-btn-copied");
          setSvgContent(btn, copyIcon);
        }, 1500);
      } catch {
        // Clipboard API may be blocked
      }
    });
  }
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export type InsertMode = "cursor" | "append";

export class ChatMessage {
  private containerEl: HTMLElement;
  private app: App;
  private component: Component;
  private onInsert?: (content: string, mode: InsertMode) => void;

  constructor(
    parentEl: HTMLElement,
    app: App,
    component: Component,
    onInsert?: (content: string, mode: InsertMode) => void
  ) {
    this.containerEl = parentEl.createDiv({ cls: "nebi-chat-msg" });
    this.app = app;
    this.component = component;
    this.onInsert = onInsert;
  }

  render(messageOrContent: Message | string, role?: string): void {
    this.containerEl.empty();

    let message: Message;
    if (typeof messageOrContent === "string") {
      message = { role: (role as "user" | "assistant" | "system") || "assistant", content: messageOrContent, timestamp: Date.now() };
    } else {
      message = messageOrContent;
    }

    const wrapper = this.containerEl.createDiv({
      cls: `nebi-chat-bubble nebi-chat-bubble-${message.role}`,
    });

    const headerRow = wrapper.createDiv({ cls: "nebi-chat-bubble-header" });

    const avatar = headerRow.createDiv({ cls: "nebi-chat-avatar" });
    if (message.role === "user") {
      avatar.setText("U");
      avatar.addClass("nebi-chat-avatar-user");
    } else {
      createSvgIcon(avatar, NEBI_ICON_SVG);
      avatar.addClass("nebi-chat-avatar-ai");
    }

    const meta = headerRow.createDiv({ cls: "nebi-chat-meta" });
    const roleName = message.role === "user" ? "You" : message.role === "assistant" ? "Nebi" : "System";
    meta.createSpan({ cls: "nebi-chat-role-name", text: roleName });
    meta.createSpan({ cls: "nebi-chat-timestamp", text: formatRelativeTime(message.timestamp) });

    if (message.role === "assistant" && this.onInsert) {
      const insertBtn = headerRow.createEl("button", {
        cls: "nebi-chat-insert-btn",
        attr: { "aria-label": "Insert at cursor", title: "Insert at cursor" },
      });
      insertBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
      insertBtn.addEventListener("click", () => {
        this.onInsert?.(message.content, "cursor");
      });

      const appendBtn = headerRow.createEl("button", {
        cls: "nebi-chat-append-btn",
        attr: { "aria-label": "Append to end of note", title: "Append to end of note" },
      });
      appendBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17V3"></path><path d="m6 11 6 6 6-6"></path><path d="M19 21H5"></path></svg>`;
      appendBtn.addEventListener("click", () => {
        this.onInsert?.(message.content, "append");
      });
    }

    const copyBtn = headerRow.createEl("button", { cls: "nebi-chat-copy-btn", attr: { "aria-label": "Copy message" } });
    const copySvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    const checkSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    copyBtn.innerHTML = copySvg;
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(message.content);
        copyBtn.addClass("nebi-chat-copy-btn-copied");
        copyBtn.innerHTML = checkSvg;
        window.setTimeout(() => {
          copyBtn.removeClass("nebi-chat-copy-btn-copied");
          copyBtn.innerHTML = copySvg;
        }, 1500);
      } catch {
        // Clipboard API may be blocked
      }
    });

    const contentEl = wrapper.createDiv({ cls: "nebi-chat-bubble-content" });

    if (message.role === "assistant") {
      void MarkdownRenderer.render(this.app, message.content, contentEl, "", this.component);
      addCodeBlockCopyButtons(contentEl);
    } else {
      contentEl.setText(message.content);
    }
  }

  renderStreaming(text: string): void {
    this.containerEl.empty();

    const wrapper = this.containerEl.createDiv({
      cls: "nebi-chat-bubble nebi-chat-bubble-assistant nebi-chat-bubble-streaming",
    });

    const headerRow = wrapper.createDiv({ cls: "nebi-chat-bubble-header" });
    const avatar = headerRow.createDiv({ cls: "nebi-chat-avatar nebi-chat-avatar-ai" });
    createSvgIcon(avatar, NEBI_ICON_SVG);

    const meta = headerRow.createDiv({ cls: "nebi-chat-meta" });
    meta.createSpan({ cls: "nebi-chat-role-name", text: "Nebi" });
    meta.createSpan({ cls: "nebi-chat-timestamp", text: "typing..." });

    const contentEl = wrapper.createDiv({ cls: "nebi-chat-bubble-content" });
    void MarkdownRenderer.render(this.app, text, contentEl, "", this.component);
    addCodeBlockCopyButtons(contentEl);
  }

  renderTypingIndicator(): void {
    this.containerEl.empty();

    const wrapper = this.containerEl.createDiv({
      cls: "nebi-chat-bubble nebi-chat-bubble-assistant nebi-chat-bubble-typing",
    });

    const headerRow = wrapper.createDiv({ cls: "nebi-chat-bubble-header" });
    const avatar = headerRow.createDiv({ cls: "nebi-chat-avatar nebi-chat-avatar-ai" });
    createSvgIcon(avatar, NEBI_ICON_SVG);

    const meta = headerRow.createDiv({ cls: "nebi-chat-meta" });
    meta.createSpan({ cls: "nebi-chat-role-name", text: "Nebi" });
    meta.createSpan({ cls: "nebi-chat-timestamp", text: "thinking..." });

    const dotsEl = wrapper.createDiv({ cls: "nebi-chat-dots" });
    dotsEl.createDiv({ cls: "nebi-chat-dot" });
    dotsEl.createDiv({ cls: "nebi-chat-dot" });
    dotsEl.createDiv({ cls: "nebi-chat-dot" });
  }

  renderError(error: string): void {
    this.containerEl.empty();

    const wrapper = this.containerEl.createDiv({
      cls: "nebi-chat-bubble nebi-chat-bubble-error",
    });

    const headerRow = wrapper.createDiv({ cls: "nebi-chat-bubble-header" });
    const avatar = headerRow.createDiv({ cls: "nebi-chat-avatar nebi-chat-avatar-error" });
    avatar.setText("!");

    const meta = headerRow.createDiv({ cls: "nebi-chat-meta" });
    meta.createSpan({ cls: "nebi-chat-role-name", text: "Error" });

    const contentEl = wrapper.createDiv({ cls: "nebi-chat-bubble-content" });
    contentEl.setText(error);
  }

  getElement(): HTMLElement {
    return this.containerEl;
  }

  clear(): void {
    this.containerEl.empty();
  }
}
