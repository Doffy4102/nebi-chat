# Nebi Chat

AI chat assistant for Obsidian with support for multiple free providers. Chat with AI models directly from your sidebar without paying for API access.

## Features

- **Multi-provider support**: Gemini, Groq, Cerebras, OpenRouter, and Ollama (local)
- **Free tier friendly**: All cloud providers offer free API tiers (no credit card required)
- **Streaming responses**: Text appears word-by-word as the AI generates
- **Chat history**: Conversations persist across restarts (last 200 messages)
- **Theme-aware UI**: Matches your Obsidian theme automatically
- **Markdown rendering**: Code blocks, lists, headings, and links rendered properly
- **Text selection**: Click-drag to select and copy portions of AI responses
- **Configurable**: Adjustable temperature and max tokens per response

## Installation

### Community Plugin (Recommended)

1. Open Obsidian Settings > Community Plugins
2. Search for "Nebi Chat"
3. Click Install, then Enable

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest)
2. Create a folder `obsidian-ai-chat` in your vault's `.obsidian/plugins/` directory
3. Copy the three files into that folder
4. Enable the plugin in Settings > Community Plugins

## Configuration

1. Open Settings > Nebi Chat
2. Enter an API key for at least one provider (see below for free options)
3. Select a provider and model from the dropdowns in the chat sidebar

## Free API Providers

| Provider | Free Tier | Get API Key |
|----------|-----------|-------------|
| Google Gemini | Generous free quota | [ai.google.dev](https://ai.google.dev) |
| Groq | 30 RPM, 250 RPD | [console.groq.com](https://console.groq.com) |
| Cerebras | Free tier available | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| OpenRouter | Many free models | [openrouter.ai](https://openrouter.ai) |
| Ollama | Unlimited (local) | [ollama.ai](https://ollama.ai) |

No credit card is required for any of the cloud providers.

## Usage

1. Click the message icon in the ribbon bar, or use the command palette to open Nebi Chat
2. Type your message and press Enter
3. Use the provider and model dropdowns to switch between providers
4. Adjust temperature and max tokens in Settings > Nebi Chat

### Commands

- **Open Nebi Chat**: Opens the chat sidebar
- **Clear Nebi Chat History**: Clears all messages
- **Reload Nebi Chat**: Reloads settings without restarting Obsidian

## Development

```bash
npm install
npm run build    # Production build
npm run dev      # Watch mode with hot reload
```

## Privacy

- API keys are stored locally in your vault's `.obsidian/plugins/nebi-chat/data.json` file. They are never sent anywhere except to the AI provider you configure.
- Your messages are sent directly from your device to the chosen AI provider (Google, Groq, Cerebras, OpenRouter, or Ollama). No intermediary server is involved.
- This plugin does not collect, store, or transmit any data on its own. It acts purely as a client-side interface.
- Each provider's usage is subject to their respective terms of service and privacy policies. Review them before use.

## License

MIT
