export const numberFileContent = (content: string, startLine = 1) => {
    // Add line numbers to the content
    const lines = content.split('\n');
    const numberedContent = lines.map((line, index) => `${index + startLine} | ${line}`).join('\n');
    return numberedContent;
}

export const insertNumberedContent = (
    content: string,
    operations: Array<{ startLine: number; content: string }>,
): string => {
    const lines = content.split('\n');
    const sortedOperations = [...operations].sort((a, b) => b.startLine - a.startLine);
    // Apply insertions
    for (const operation of sortedOperations) {
        let { startLine } = operation;
        const { content } = operation;
        const originalStartLine = startLine;
        // If startLine is greater than lines.length + 1, append at end
        // This prevents out-of-bounds errors and makes the tool more user-friendly
        if (startLine < 1) {
            console.log(`[insertContent] ERROR: Invalid line number: ${startLine}`);
            return content;
        }
        if (startLine > lines.length + 1) {
            // Clamp to end of file
            startLine = lines.length + 1;
            console.log(`[insertContent] Adjusted startLine from ${originalStartLine} to ${startLine} (end of file)`);
        }
        const contentLines = content.split('\n');
        console.log(`[insertContent] Inserting at line ${startLine}:`, contentLines);
        lines.splice(startLine - 1, 0, ...contentLines);
    }

    return lines.join('\n');
}