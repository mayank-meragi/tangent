import { Modal, App } from "obsidian";

/**
 * Loading modal for AI tag suggestions
 */
export class CommandLoadingModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        // Create modal content
        const container = contentEl.createDiv('tag-suggest-loading-modal');

        // Add spinning icon
        const spinner = container.createDiv('loading-spinner');
        spinner.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="30 100" stroke-dashoffset="0">
          <animate attributeName="stroke-dashoffset" values="0;-100" dur="1s" repeatCount="indefinite"/>
        </svg>
    `;

        // Add loading text
        const text = container.createDiv('loading-text');
        text.setText('Analyzing content and generating tag suggestions...');

        // Add subtitle
        const subtitle = container.createDiv('loading-subtitle');
        subtitle.setText('This may take a few seconds');
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}