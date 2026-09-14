# 🤖 Nebi Chat

[![Version](https://img.shields.io/github/v/release/Doffy4102/nebi-chat?style=flat-square)](https://github.com/Doffy4102/nebi-chat/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://github.com/Doffy4102/nebi-chat/blob/master/LICENSE)
[![Obsidian](https://img.shields.io/badge/Obsidian-1.4.0+-purple?style=flat-square&logo=obsidian)](https://obsidian.md)
[![GitHub Stars](https://img.shields.io/github/stars/Doffy4102/nebi-chat?style=flat-square)](https://github.com/Doffy4102/nebi-chat/stargazers)

> Chat with AI models directly from your Obsidian sidebar — completely free.

<!-- Replace with your screenshot -->
<!-- ![Nebi Chat Screenshot](./screenshots/screenshot.png) -->

---

## ✨ Features

- 🌐 **Multi-provider support** — Gemini, Groq, Cerebras, OpenRouter, and Ollama (local)
- 💸 **Free tier friendly** — No credit card required for any cloud provider
- ⚡ **Streaming responses** — Text appears word-by-word as the AI generates
- 💬 **Chat history** — Conversations persist across restarts (last 200 messages)
- 🎨 **Theme-aware UI** — Matches your Obsidian theme automatically
- 📝 **Markdown rendering** — Code blocks, lists, headings, and links rendered properly
- 📋 **Text selection** — Click-drag to select and copy portions of AI responses
- ⚙️ **Configurable** — Adjustable temperature and max tokens per response
- 🧵 **Multiple threads** — Create, switch, and delete conversations
- 📤 **Export** — Download chat history as markdown
- 🔍 **Model discovery** — Auto-fetches available models from each provider

---

## 📦 Installation

### 🏪 Community Plugin (Recommended)

1. Open **Settings** → **Community Plugins**
2. Search for **"Nebi Chat"**
3. Click **Install**, then **Enable**

### 🔧 Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest)
2. Create a folder `nebi-chat` in your vault's `.obsidian/plugins/` directory
3. Copy the three files into that folder
4. Enable the plugin in **Settings** → **Community Plugins**

---

## ⚙️ Configuration

1. Open **Settings** → **Nebi Chat**
2. Enter an API key for at least one provider (see free options below)
3. Select a provider and model from the dropdowns in the chat sidebar

---

## 🌐 Free API Providers

| Provider | Free Tier | Get API Key |
|----------|-----------|-------------|
| Google Gemini | Generous free quota | [ai.google.dev](https://ai.google.dev) |
| Groq | 30 RPM, 250 RPD | [console.groq.com](https://console.groq.com) |
| Cerebras | Free tier available | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| OpenRouter | Many free models | [openrouter.ai](https://openrouter.ai) |
| Ollama | Unlimited (local) | [ollama.ai](https://ollama.ai) |

> 💳 No credit card is required for any of the cloud providers.

---

## 📖 Usage

1. 💬 Click the chat icon in the ribbon bar, or use the command palette
2. ✍️ Type your message and press **Enter**
3. 🔄 Switch providers with the dropdown menus
4. ⚙️ Adjust temperature and max tokens in **Settings** → **Nebi Chat**

### 🎯 Commands

| Command | Description |
|---------|-------------|
| **Open Nebi Chat** | Opens the chat sidebar |
| **Clear Nebi Chat History** | Clears all messages |
| **Reload Nebi Chat** | Reloads settings without restarting Obsidian |

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### 🛠️ Development Setup

```bash
git clone https://github.com/Doffy4102/nebi-chat.git
cd nebi-chat
npm install
npm run dev     # Watch mode with hot reload
npm run build   # Production build
```

### 📁 Project Structure

```
src/
├── main.ts                  # Plugin entry point
├── types.ts                 # Data models and interfaces
├── icon-svg.ts              # Custom SVG icon constant
├── views/
│   └── ChatView.ts          # Main chat sidebar view
├── ui/
│   ├── ChatInput.ts         # Message input area
│   ├── ChatMessage.ts       # Message bubble renderer
│   ├── ConfirmModal.ts      # Reusable confirmation dialog
│   └── ProviderSelector.ts  # Provider/model dropdowns
├── services/
│   ├── ProviderManager.ts   # Provider orchestration
│   ├── StreamingParser.ts   # SSE stream parser
│   └── providers/
│       ├── BaseProvider.ts         # Base provider class
│       ├── GeminiProvider.ts       # Google Gemini
│       ├── GroqProvider.ts         # Groq
│       ├── CerebrasProvider.ts     # Cerebras
│       ├── OpenRouterProvider.ts   # OpenRouter
│       └── OllamaProvider.ts       # Ollama (local)
└── settings/
    ├── PluginSettings.ts    # Settings persistence
    └── AIChatSettingTab.ts  # Settings UI
```

---

## 🔒 Privacy

- 🔑 **API keys** are stored locally in your vault's `data.json` — never sent anywhere except the provider you configure
- 🚀 **Messages** are sent directly from your device to the chosen AI provider
- 🛡️ **No data** is collected, stored, or transmitted by the plugin itself
- 📋 Each provider's usage is subject to their respective terms of service

---

## 📄 License

[MIT](LICENSE) © [doffy](https://github.com/Doffy4102)
