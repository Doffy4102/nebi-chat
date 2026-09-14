import { Component, MarkdownRenderer } from "obsidian";
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

export class ChatMessage {
  private containerEl: HTMLElement;
  private component: Component;

  constructor(parentEl: HTMLElement, component: Component) {
    this.containerEl = parentEl.createDiv({ cls: "nebi-chat-msg" });
    this.component = component;
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

    const copyBtn = headerRow.createDiv({ cls: "nebi-chat-copy-btn", attr: { "aria-label": "Copy message" } });
    const copySvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    const checkSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    setSvgContent(copyBtn, copySvg);
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(message.content);
        copyBtn.addClass("nebi-chat-copy-btn-copied");
        setSvgContent(copyBtn, checkSvg);
        window.setTimeout(() => {
          copyBtn.removeClass("nebi-chat-copy-btn-copied");
          setSvgContent(copyBtn, copySvg);
        }, 1500);
      } catch {
        // Clipboard API may be blocked
      }
    });

    const contentEl = wrapper.createDiv({ cls: "nebi-chat-bubble-content" });

    if (message.role === "assistant") {
      void MarkdownRenderer.render(this.component, message.content, contentEl, "");
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
    void MarkdownRenderer.render(this.component, text, contentEl, "");
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
