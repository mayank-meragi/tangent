# Tangent - AI Chat Plugin for Obsidian

Tangent is an AI chat plugin for Obsidian that integrates with Google's Gemini AI to provide intelligent assistance within your vault. It allows you to have conversations with AI about your notes, files, and ideas.

## Features

- **AI Chat Interface**: Clean, modern chat interface integrated into Obsidian's sidebar
- **Gemini AI Integration**: Powered by Google's Gemini AI models
- **File Context**: Automatically include current file content in conversations
- **File Selection**: Manually select files to include in conversations using @ mentions
- **Tool Integration**: AI can read, write, and list files in your vault
- **Memory System**: AI remembers previous conversations and user preferences
- **Conversation History**: Save and load previous conversations
- **Message Editing**: Edit and regenerate AI responses
- **Thinking Mode**: Enable AI reasoning and step-by-step thinking
- **Multiple Models**: Support for different Gemini models

## Conversation History

Tangent automatically saves your conversations and provides a history feature:

- **Auto-save**: Conversations are automatically saved as you chat
- **History Tab**: Click the history icon in the top-right to view all conversations
- **Load Conversations**: Click on any conversation to load it and continue chatting
- **Delete Conversations**: Remove conversations you no longer need
- **Conversation Titles**: Automatically generated from the first message

## Setup

1. Install the plugin in Obsidian
2. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Add your API key in the plugin settings
4. Open the chat panel using the ribbon icon or command palette

## Usage

- **Start a conversation**: Type your message and press Enter
- **Include files**: Use @ to mention files in your vault
- **Edit messages**: Click the edit button on any user message
- **View history**: Click the history icon to see past conversations
- **New chat**: Click the refresh icon to start a fresh conversation

## File Operations

The AI can perform various file operations in your vault:
- List all files and folders
- Read file contents
- Write new files or update existing ones
- Access a persistent memory system

## Settings

- **Gemini API Key**: Your Google AI API key for Gemini access
- **Model Selection**: Choose between different Gemini models
- **Thinking Mode**: Enable/disable AI reasoning capabilities

## Development

This plugin is built with TypeScript and React, providing a modern development experience.

## First time developing plugins?

Quick starting guide for new plugin devs:

- Check if [someone already developed a plugin for what you want](https://obsidian.md/plugins)! There might be an existing plugin similar enough that you can partner up with.
- Make a copy of this repo as a template with the "Use this template" button (login to GitHub if you don't see it).
- Clone your repo to a local development folder. For convenience, you can place this folder in your `.obsidian/plugins/your-plugin-name` folder.
- Install NodeJS, then run `npm i` in the command line under your repo folder.
- Run `npm run dev` to compile your plugin from `main.ts` to `main.js`.
- Make changes to `main.ts` (or create new `.ts` files). Those changes should be automatically compiled into `main.js`.
- Reload Obsidian to load the new version of your plugin.
- Enable plugin in settings window.
- For updates to the Obsidian API run `npm update` in the command line under your repo folder.

## Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

## Adding your plugin to the community plugin list

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

## How to use

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## Improve code quality with eslint (optional)
- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code. 
- To use eslint with this project, make sure to install eslint from terminal:
  - `npm install -g eslint`
- To use eslint to analyze this project use this command:
  - `eslint main.ts`
  - eslint will then create a report with suggestions for code improvement by file and line number.
- If your source code is in a folder, such as `src`, you can use eslint with this command to analyze all files in that folder:
  - `eslint .\src\`

## Funding URL

You can include funding URLs where people who use your plugin can financially support it.

The simple way is to set the `fundingUrl` field to your link in your `manifest.json` file:

```json
{
    "fundingUrl": "https://buymeacoffee.com"
}
```

If you have multiple URLs, you can also do:

```json
{
    "fundingUrl": {
        "Buy Me a Coffee": "https://buymeacoffee.com",
        "GitHub Sponsor": "https://github.com/sponsors",
        "Patreon": "https://www.patreon.com/"
    }
}
```

## API Documentation

See https://github.com/obsidianmd/obsidian-api
