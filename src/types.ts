export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface ChatHistory {
  messages: Message[];
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyRequired: boolean;
  models: ModelInfo[];
}

export interface ModelInfo {
  id: string;
  name: string;
  maxTokens: number;
  contextWindow: number;
}

export interface ChatRequest {
  messages: Message[];
  model?: string;
  systemPrompt?: string;
  signal?: AbortSignal;
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly models: ModelInfo[];
  isConfigured(): boolean;
  setApiKey(key: string): void;
  setBaseUrl(url: string): void;
  setTemperature(temp: number): void;
  setMaxTokens(tokens: number): void;
  chat(request: ChatRequest): AsyncGenerator<string>;
  fetchModels?(): Promise<ModelInfo[]>;
}

export interface ProviderSettings {
  apiKey: string;
  baseUrl: string;
  selectedModel: string;
  enabled: boolean;
  systemPrompt: string;
}

export interface PluginSettingsData {
  activeProvider: string;
  providers: Record<string, ProviderSettings>;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  chatHistory: Message[];
  conversations: Conversation[];
  currentConversationId: string;
}

export const DEFAULT_SETTINGS: PluginSettingsData = {
  activeProvider: "gemini",
  providers: {
    gemini: {
      apiKey: "",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      selectedModel: "Gemini 3.5 Flash",
      enabled: true,
      systemPrompt: "",
    },
    groq: {
      apiKey: "",
      baseUrl: "https://api.groq.com/openai/v1",
      selectedModel: "groq/compound-mini",
      enabled: true,
      systemPrompt: "",
    },
    cerebras: {
      apiKey: "",
      baseUrl: "https://api.cerebras.ai/v1",
      selectedModel: "llama-3.3-70b",
      enabled: true,
      systemPrompt: "",
    },
    openrouter: {
      apiKey: "",
      baseUrl: "https://openrouter.ai/api/v1",
      selectedModel: "nvidia/nemotron-3.5-lightning:free",
      enabled: true,
      systemPrompt: "",
    },
    ollama: {
      apiKey: "",
      baseUrl: "http://localhost:11434/v1",
      selectedModel: "llama3.2",
      enabled: true,
      systemPrompt: "",
    },
  },
  systemPrompt:
    "You are a helpful AI assistant integrated into Obsidian. Help the user with their notes, ideas, and questions. Be concise and helpful.",
  maxTokens: 4096,
  temperature: 0.7,
  chatHistory: [],
  conversations: [],
  currentConversationId: "",
};
