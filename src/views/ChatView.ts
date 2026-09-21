import { ItemView, WorkspaceLeaf, Notice, MarkdownView, setIcon } from "obsidian";
import { Message, Conversation } from "../types";
import { ProviderManager } from "../services/ProviderManager";
import { PluginSettings } from "../settings/PluginSettings";
import { ChatMessage, InsertMode } from "../ui/ChatMessage";
import { ChatInput } from "../ui/ChatInput";
import { ProviderSelector } from "../ui/ProviderSelector";
import { ConfirmModal } from "../ui/ConfirmModal";
import { NEBI_ICON_SVG } from "../icon-svg";
import { createSvgIcon } from "../utils/dom";

export const VIEW_TYPE_NEBI_CHAT = "nebi-chat-view";

const MAX_HISTORY = 200;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
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
  private streamingDebounceTimer: number | null = null;
  private lastSaveTimer: number | null = null;
  private lastActiveNoteLeaf: WorkspaceLeaf | null = null;

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
    setIcon(this.newChatBtnEl, "plus");
    this.newChatBtnEl.addEventListener("click", () => this.createNewChat());

    this.exportBtnEl = headerBtns.createEl("button", {
      cls: "nebi-chat-icon-btn",
      attr: { "aria-label": "Export chat", title: "Export to markdown" },
    });
    setIcon(this.exportBtnEl, "download");
    this.exportBtnEl.addEventListener("click", () => this.exportChat());

    this.refreshBtnEl = headerBtns.createEl("button", {
      cls: "nebi-chat-icon-btn",
      attr: { "aria-label": "Refresh settings", title: "Refresh settings" },
    });
    setIcon(this.refreshBtnEl, "refresh-cw");
    this.refreshBtnEl.addEventListener("click", () => {
      void this.reloadPlugin();
    });

    this.clearBtnEl = headerBtns.createEl("button", {
      cls: "nebi-chat-icon-btn",
      attr: { "aria-label": "Clear chat", title: "Clear chat" },
    });
    setIcon(this.clearBtnEl, "trash-2");
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
    setIcon(deleteConvBtn, "trash-2");
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

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf && leaf.view instanceof MarkdownView) {
          this.lastActiveNoteLeaf = leaf;
        }
      })
    );
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

    this.typingIndicator = new ChatMessage(this.chatContainerEl!, this.app, this);
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
          streamingMsg = new ChatMessage(this.chatContainerEl!, this.app, this, (content, mode) => {
            void this.insertIntoNote(content, mode);
          });
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

        const errorComp = new ChatMessage(this.chatContainerEl!, this.app, this);
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

  private async insertIntoNote(content: string, mode: InsertMode): Promise<void> {
    // Use the tracked leaf from active-leaf-change events.
    // Clicking a sidebar button steals focus, so getActiveViewOfType returns null.
    const leaf = this.lastActiveNoteLeaf;
    const file = leaf?.view instanceof MarkdownView
      ? leaf.view.file
      : this.app.workspace.getActiveFile();

    if (!file || file.extension !== "md") {
      new Notice("Open a note first to insert the response");
      return;
    }

    if (mode === "append") {
      try {
        await this.app.vault.append(file, "\n\n" + content);
        new Notice("Response appended to note");
      } catch (error: unknown) {
        console.error("[Nebi Chat] Append failed:", error);
        new Notice("Could not append to note");
      }
      return;
    }

    // Insert at cursor — need an open MarkdownView in source mode.
    if (!(leaf?.view instanceof MarkdownView)) {
      new Notice("Open a note to insert at cursor");
      return;
    }
    if (leaf.view.getMode() !== "source") {
      new Notice("Switch the note to Edit mode to insert at cursor");
      return;
    }
    leaf.view.editor.replaceSelection(content);
    new Notice("Response inserted into note");
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
      const msgComponent = new ChatMessage(this.chatContainerEl, this.app, this, (content, mode) => {
        void this.insertIntoNote(content, mode);
      });
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
