import { ItemView, WorkspaceLeaf, Notice, MarkdownRenderer } from "obsidian";
import { Message, Conversation } from "../types";
import { ProviderManager } from "../services/ProviderManager";
import { PluginSettings } from "../settings/PluginSettings";
import { ChatMessage } from "../ui/ChatMessage";
import { ChatInput } from "../ui/ChatInput";
import { ProviderSelector } from "../ui/ProviderSelector";
import { ConfirmModal } from "../ui/ConfirmModal";
import { NEBI_ICON_SVG } from "../icon-svg";

export const VIEW_TYPE_NEBI_CHAT = "nebi-chat-view";

const MAX_HISTORY = 200;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function createSvgIcon(parent: HTMLElement, svgContent: string): HTMLElement {
  const wrapper = parent.createDiv({ cls: "nebi-chat-icon-wrapper" });
  wrapper.innerHTML = svgContent;
  return wrapper;
}

export class ChatView extends ItemView {
  private providerManager: ProviderManager;
  private settings: PluginSettings;
  private messages: Message[] = [];
  private chatContainerEl: HTMLElement | null = null;
  private inputArea: ChatInput | null = null;
  private selector: ProviderSelector | null = null;
  private abortController: AbortController | null = null;
  private typingIndicator: ChatMessage | null = null;
  private refreshBtnEl: HTMLButtonElement | null = null;
  private clearBtnEl: HTMLButtonElement | null = null;
  private exportBtnEl: HTMLButtonElement | null = null;
  private newChatBtnEl: HTMLButtonElement | null = null;
  private conversationSelect: HTMLSelectElement | null = null;
  private streamingDebounceTimer: ReturnType<typeof window.setTimeout> | null = null;
  private lastSaveTimer: ReturnType<typeof window.setTimeout> | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    providerManager: ProviderManager,
    settings: PluginSettings
  ) {
    super(leaf);
    this.providerManager = providerManager;
    this.settings = settings;
  }

  getViewType(): string {
    return VIEW_TYPE_NEBI_CHAT;
  }

  getDisplayText(): string {
    return "Nebi Chat";
  }

  getIcon(): string {
    return "message-square";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("nebi-chat-view");

    this.ensureCurrentConversation();

    const headerEl = container.createDiv({ cls: "nebi-chat-header" });

    const titleRow = headerEl.createDiv({ cls: "nebi-chat-title-row" });
    titleRow.createDiv({ cls: "nebi-chat-title" }).setText("Nebi Chat");

    const headerBtns = titleRow.createDiv({ cls: "nebi-chat-header-btns" });

    this.newChatBtnEl = headerBtns.createEl("button", {
      cls: "nebi-chat-icon-btn",
      attr: { "aria-label": "New chat", title: "New chat" },
    });
    this.newChatBtnEl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
    this.newChatBtnEl.addEventListener("click", () => this.createNewChat());

    this.exportBtnEl = headerBtns.createEl("button", {
      cls: "nebi-chat-icon-btn",
      attr: { "aria-label": "Export chat", title: "Export to markdown" },
    });
    this.exportBtnEl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
    this.exportBtnEl.addEventListener("click", () => this.exportChat());

    this.refreshBtnEl = headerBtns.createEl("button", {
      cls: "nebi-chat-icon-btn",
      attr: { "aria-label": "Refresh settings", title: "Refresh settings" },
    });
    this.refreshBtnEl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`;
    this.refreshBtnEl.addEventListener("click", () => {
      void this.reloadPlugin();
    });

    this.clearBtnEl = headerBtns.createEl("button", {
      cls: "nebi-chat-icon-btn",
      attr: { "aria-label": "Clear chat", title: "Clear chat" },
    });
    this.clearBtnEl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
    this.clearBtnEl.addEventListener("click", () => {
      void this.clearChat();
    });

    const convRow = headerEl.createDiv({ cls: "nebi-chat-conv-row" });
    this.conversationSelect = convRow.createEl("select", { cls: "nebi-chat-select nebi-chat-conv-select" });
    this.populateConversationSelect();
    this.conversationSelect.addEventListener("change", () => {
      this.switchConversation(this.conversationSelect!.value);
    });

    const deleteConvBtn = convRow.createEl("button", {
      cls: "nebi-chat-icon-btn nebi-chat-conv-delete-btn",
      attr: { "aria-label": "Delete conversation", title: "Delete conversation" },
    });
    deleteConvBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
    deleteConvBtn.addEventListener("click", () => {
      void this.deleteCurrentConversation();
    });

    this.selector = new ProviderSelector(
      headerEl,
      (providerId) => this.handleProviderChange(providerId),
      (modelId) => this.handleModelChange(modelId)
    );
    this.selector.setProviders(this.providerManager.getAllProviders());
    this.selector.setActiveProvider(this.settings.activeProvider);

    const settingsProvider = this.settings.getProvider(this.settings.activeProvider);
    if (settingsProvider) {
      this.selector.setActiveModel(settingsProvider.selectedModel);
    }

    this.chatContainerEl = container.createDiv({ cls: "nebi-chat-messages" });

    this.inputArea = new ChatInput(
      container,
      (text) => {
        void this.handleSendMessage(text);
      },
      () => this.handleStopGeneration()
    );

    if (this.messages.length === 0) {
      this.renderEmptyState();
    } else {
      this.renderMessages();
    }
    this.inputArea.focus();
  }

  async onClose(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.streamingDebounceTimer) {
      window.clearTimeout(this.streamingDebounceTimer);
      this.streamingDebounceTimer = null;
    }
    if (this.lastSaveTimer) {
      window.clearTimeout(this.lastSaveTimer);
      this.lastSaveTimer = null;
    }
  }

  private handleProviderChange(providerId: string): void {
    this.settings.activeProvider = providerId;
    void this.settings.save();
    this.providerManager.applySettings();

    const config = this.settings.getProvider(providerId);
    if (config && this.selector) {
      this.selector.setActiveModel(config.selectedModel);
    }
  }

  private handleModelChange(modelId: string): void {
    this.settings.setProvider(this.settings.activeProvider, { selectedModel: modelId });
    void this.settings.save();
  }

  private async handleSendMessage(text: string): Promise<void> {
    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    this.messages.push(userMessage);
    this.debouncedSave();
    this.renderMessages();

    this.typingIndicator = new ChatMessage(this.chatContainerEl!);
    this.typingIndicator.renderTypingIndicator();
    this.scrollToBottom();

    this.abortController = new AbortController();
    this.inputArea?.setGenerating(true);

    let fullResponse = "";
    let streamingMsg: ChatMessage | null = null;

    const flushStreaming = () => {
      if (streamingMsg && fullResponse) {
        streamingMsg.renderStreaming(fullResponse);
        this.scrollToBottom();
      }
    };

    try {
      for await (const chunk of this.providerManager.chat({
        messages: this.messages,
        systemPrompt: this.settings.systemPrompt,
        signal: this.abortController.signal,
      })) {
        if (this.typingIndicator) {
          this.typingIndicator.getElement().remove();
          this.typingIndicator = null;
        }

        fullResponse += chunk;

        if (!streamingMsg) {
          streamingMsg = new ChatMessage(this.chatContainerEl!);
          streamingMsg.renderStreaming(fullResponse);
          this.scrollToBottom();
        } else {
          if (this.streamingDebounceTimer) {
            window.clearTimeout(this.streamingDebounceTimer);
          }
          this.streamingDebounceTimer = window.setTimeout(flushStreaming, 150);
        }
      }

      if (this.streamingDebounceTimer) {
        window.clearTimeout(this.streamingDebounceTimer);
        this.streamingDebounceTimer = null;
      }

      if (fullResponse && streamingMsg) {
        this.messages.push({
          role: "assistant",
          content: fullResponse,
          timestamp: Date.now(),
        });
        streamingMsg.render(fullResponse, "assistant");
        this.scrollToBottom();
        this.debouncedSave();
      }
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      if (err.name === "AbortError") {
        if (fullResponse && streamingMsg) {
          this.messages.push({
            role: "assistant",
            content: fullResponse,
            timestamp: Date.now(),
          });
          streamingMsg.render(fullResponse, "assistant");
          this.debouncedSave();
        }
      } else {
        const errMsg = err.message || String(error);
        console.error("[Nebi Chat] Error:", error);
        new Notice(`AI Error: ${errMsg}`);

        if (this.typingIndicator) {
          this.typingIndicator.getElement().remove();
          this.typingIndicator = null;
        }

        const errorComp = new ChatMessage(this.chatContainerEl!);
        errorComp.renderError(errMsg);
        this.scrollToBottom();
      }
    } finally {
      this.inputArea?.setGenerating(false);
      this.abortController = null;
      this.typingIndicator = null;
    }
  }

  private handleStopGeneration(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  async clearChat(): Promise<void> {
    const confirmed = await new ConfirmModal(
      this.app,
      "Clear Chat",
      "Clear all messages? This cannot be undone."
    ).openAndWait();
    if (!confirmed) return;
    this.messages = [];
    this.saveHistory();
    this.renderEmptyState();
    this.inputArea?.focus();
  }

  private async reloadPlugin(): Promise<void> {
    new Notice("Reloading Nebi Chat...");
    await this.settings.load();
    this.providerManager.applySettings();
    this.selector?.setProviders(this.providerManager.getAllProviders());
    this.selector?.setActiveProvider(this.settings.activeProvider);
    new Notice("Nebi Chat settings reloaded");
  }

  private renderEmptyState(): void {
    if (!this.chatContainerEl) return;
    this.chatContainerEl.empty();

    const emptyState = this.chatContainerEl.createDiv({ cls: "nebi-chat-empty" });

    const logo = emptyState.createDiv({ cls: "nebi-chat-empty-logo" });
    createSvgIcon(logo, NEBI_ICON_SVG);

    emptyState.createDiv({ cls: "nebi-chat-empty-title" }).setText("Nebi Chat");

    emptyState.createDiv({ cls: "nebi-chat-empty-desc" }).setText(
      "Your AI assistant inside Obsidian. Ask anything about your notes, ideas, or the world."
    );

    const prompts = [
      "Summarize my recent notes",
      "Help me brainstorm ideas",
      "Explain a concept",
      "Draft a quick outline",
    ];

    const promptsEl = emptyState.createDiv({ cls: "nebi-chat-empty-prompts" });
    for (const prompt of prompts) {
      const promptBtn = promptsEl.createEl("button", {
        cls: "nebi-chat-empty-prompt",
        text: prompt,
      });
      promptBtn.addEventListener("click", () => {
        void this.handleSendMessage(prompt);
      });
    }
  }

  private renderMessages(): void {
    if (!this.chatContainerEl) return;
    this.chatContainerEl.empty();

    if (this.messages.length === 0) {
      this.renderEmptyState();
      return;
    }

    for (const message of this.messages) {
      const msgComponent = new ChatMessage(this.chatContainerEl);
      msgComponent.render(message);
    }

    this.scrollToBottom();
  }

  private debouncedSave(): void {
    if (this.lastSaveTimer) {
      window.clearTimeout(this.lastSaveTimer);
    }
    this.lastSaveTimer = window.setTimeout(() => this.saveHistory(), 1000);
  }

  private saveHistory(): void {
    const convId = this.settings.data_.currentConversationId;
    if (convId) {
      const conv = this.settings.data_.conversations.find((c) => c.id === convId);
      if (conv) {
        conv.messages = this.messages.slice(-MAX_HISTORY);
        conv.updatedAt = Date.now();
        if (conv.title === "New Chat") {
          const firstUser = conv.messages.find((m) => m.role === "user");
          if (firstUser) {
            conv.title = firstUser.content.substring(0, 50) + (firstUser.content.length > 50 ? "..." : "");
          }
        }
      }
    }
    this.settings.data_.chatHistory = this.messages.slice(-MAX_HISTORY);
    this.settings.save().catch((err: unknown) => {
      console.error("[Nebi Chat] Failed to save history:", err);
    });
  }

  private scrollToBottom(): void {
    if (this.chatContainerEl) {
      window.requestAnimationFrame(() => {
        this.chatContainerEl!.scrollTop = this.chatContainerEl!.scrollHeight;
      });
    }
  }

  private ensureCurrentConversation(): void {
    if (!this.settings.data_.currentConversationId || !this.settings.data_.conversations.find((c) => c.id === this.settings.data_.currentConversationId)) {
      if (this.settings.data_.conversations.length === 0) {
        this.createNewChat();
      } else {
        this.settings.data_.currentConversationId = this.settings.data_.conversations[0].id;
      }
    }
    const conv = this.settings.data_.conversations.find((c) => c.id === this.settings.data_.currentConversationId);
    if (conv) {
      this.messages = [...conv.messages];
    } else {
      this.messages = [...(this.settings.data_.chatHistory || [])];
      if (this.messages.length > 0) {
        const convId = generateId();
        this.settings.data_.conversations.push({
          id: convId,
          title: "Migrated Chat",
          messages: [...this.messages],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        this.settings.data_.currentConversationId = convId;
      }
    }
  }

  private createNewChat(): void {
    const convId = generateId();
    const conv: Conversation = {
      id: convId,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.settings.data_.conversations.unshift(conv);
    this.settings.data_.currentConversationId = convId;
    this.messages = [];
    void this.settings.save();
    this.populateConversationSelect();
    this.renderEmptyState();
    this.inputArea?.focus();
  }

  private switchConversation(convId: string): void {
    this.settings.data_.currentConversationId = convId;
    const conv = this.settings.data_.conversations.find((c) => c.id === convId);
    if (conv) {
      this.messages = [...conv.messages];
    } else {
      this.messages = [];
    }
    void this.settings.save();
    this.renderMessages();
  }

  private populateConversationSelect(): void {
    if (!this.conversationSelect) return;
    this.conversationSelect.empty();
    for (const conv of this.settings.data_.conversations) {
      const option = this.conversationSelect.createEl("option", {
        value: conv.id,
        text: conv.title || "New Chat",
      });
      if (conv.id === this.settings.data_.currentConversationId) {
        option.selected = true;
      }
    }
  }

  private exportChat(): void {
    if (this.messages.length === 0) {
      new Notice("No messages to export");
      return;
    }

    const conv = this.settings.data_.conversations.find(
      (c) => c.id === this.settings.data_.currentConversationId
    );
    const title = conv?.title || "chat";

    let md = `# ${title}\n\n`;
    md += `*Exported from Nebi Chat on ${new Date().toLocaleDateString()}*\n\n---\n\n`;

    for (const msg of this.messages) {
      const roleName = msg.role === "user" ? "You" : msg.role === "assistant" ? "Nebi" : "System";
      const time = new Date(msg.timestamp).toLocaleTimeString();
      md += `### ${roleName} *(${time})*\n\n`;
      md += `${msg.content}\n\n---\n\n`;
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = this.containerEl.createEl("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_").substring(0, 50)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    new Notice("Chat exported as markdown");
  }

  private async deleteCurrentConversation(): Promise<void> {
    const convId = this.settings.data_.currentConversationId;
    if (!convId) return;

    const conv = this.settings.data_.conversations.find((c) => c.id === convId);
    const title = conv?.title || "this conversation";

    const confirmed = await new ConfirmModal(
      this.app,
      "Delete Conversation",
      `Delete "${title}"? This cannot be undone.`
    ).openAndWait();
    if (!confirmed) return;

    this.settings.data_.conversations = this.settings.data_.conversations.filter((c) => c.id !== convId);

    if (this.settings.data_.conversations.length > 0) {
      this.settings.data_.currentConversationId = this.settings.data_.conversations[0].id;
      this.messages = [...this.settings.data_.conversations[0].messages];
    } else {
      this.createNewChat();
      return;
    }

    void this.settings.save();
    this.populateConversationSelect();
    this.renderMessages();
  }
}
