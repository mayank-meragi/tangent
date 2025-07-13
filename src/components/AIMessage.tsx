import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import CollapsibleThinking from './CollapsibleThinking';
import IconButton from './IconButton';
import LucidIcon from './LucidIcon';

interface AIMessageProps {
  thought?: string;
  message?: string;
  style?: React.CSSProperties;
}

const AIMessage: React.FC<AIMessageProps> = ({
  thought,
  message,
  style = {},
}) => {
  const [copiedCodeBlock, setCopiedCodeBlock] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const handleCopyCode = async (code: string, language?: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeBlock(code);
      setTimeout(() => setCopiedCodeBlock(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleCopyMessage = async () => {
    if (!message) return;
    
    try {
      await navigator.clipboard.writeText(message);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px', 
        position: 'relative',
        ...style 
      }}
      className="ai-message-container"
    >
      {/* Copy message button */}
      {message && (
        <div 
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            opacity: 0,
            transition: 'opacity 0.2s ease-in-out',
            zIndex: 20,
          }}
          className="message-copy-button"
        >
          <IconButton
            icon={
              copiedMessage ? 
                <LucidIcon name="check" size={16} /> : 
                <LucidIcon name="copy" size={16} />
            }
            ariaLabel="Copy message"
            title={copiedMessage ? "Copied!" : "Copy entire message"}
            onClick={handleCopyMessage}
            style={{
              padding: '6px',
              backgroundColor: 'var(--background-secondary)',
              border: '1px solid var(--background-modifier-border)',
              borderRadius: '6px',
              color: copiedMessage ? 'var(--color-green)' : 'var(--text-muted)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          />
        </div>
      )}
      
      {thought && <CollapsibleThinking content={thought} />}
      {message && (
        <div 
          style={{
            color: 'var(--text-normal)',
            fontSize: '14px',
            lineHeight: '1.5',
            userSelect: 'text',
            WebkitUserSelect: 'text',
            MozUserSelect: 'text',
            msUserSelect: 'text',
            cursor: 'text',
            paddingRight: '40px', // Make room for copy button
          }}
          className="ai-message-content"
        >
          <ReactMarkdown
            components={{
              p: ({node, ...props}) => (
                <p 
                  style={{ 
                    margin: '8px 0',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    MozUserSelect: 'text',
                    msUserSelect: 'text',
                  }} 
                  {...props} 
                />
              ),
              code: ({node, className, children, ...props}: any) => {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                const code = String(children).replace(/\n$/, '');
                const inline = !className || !className.includes('language-');

                if (inline) {
                  return (
                    <code 
                      style={{
                        backgroundColor: 'var(--background-secondary)',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        fontSize: '0.9em',
                        fontFamily: 'monospace',
                        userSelect: 'text',
                        WebkitUserSelect: 'text',
                        MozUserSelect: 'text',
                        msUserSelect: 'text',
                      }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }

                return (
                  <div 
                    style={{
                      position: 'relative',
                      margin: '12px 0',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid var(--background-modifier-border)',
                    }}
                    className="code-block-container"
                  >
                    {language && (
                      <div 
                        style={{
                          backgroundColor: 'var(--background-secondary)',
                          padding: '4px 12px',
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          borderBottom: '1px solid var(--background-modifier-border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>{language}</span>
                        <IconButton
                          icon={
                            copiedCodeBlock === code ? 
                              <LucidIcon name="check" size={14} /> : 
                              <LucidIcon name="copy" size={14} />
                          }
                          ariaLabel="Copy code"
                          title={copiedCodeBlock === code ? "Copied!" : "Copy code"}
                          onClick={() => handleCopyCode(code, language)}
                          style={{
                            padding: '2px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: copiedCodeBlock === code ? 'var(--color-green)' : 'var(--text-muted)',
                          }}
                        />
                      </div>
                    )}
                    <pre 
                      style={{
                        margin: 0,
                        padding: '12px',
                        backgroundColor: 'var(--background-primary)',
                        overflow: 'auto',
                        fontSize: '13px',
                        lineHeight: '1.4',
                        fontFamily: 'monospace',
                        userSelect: 'text',
                        WebkitUserSelect: 'text',
                        MozUserSelect: 'text',
                        msUserSelect: 'text',
                        cursor: 'text',
                      }}
                    >
                      <code 
                        style={{
                          backgroundColor: 'transparent',
                          padding: 0,
                          fontSize: 'inherit',
                          fontFamily: 'inherit',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text',
                        }}
                        {...props}
                      >
                        {children}
                      </code>
                    </pre>
                    {!language && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                        }}
                        className="code-block-copy-button"
                      >
                        <IconButton
                          icon={
                            copiedCodeBlock === code ? 
                              <LucidIcon name="check" size={14} /> : 
                              <LucidIcon name="copy" size={14} />
                          }
                          ariaLabel="Copy code"
                          title={copiedCodeBlock === code ? "Copied!" : "Copy code"}
                          onClick={() => handleCopyCode(code)}
                          style={{
                            padding: '4px',
                            backgroundColor: 'var(--background-secondary)',
                            border: '1px solid var(--background-modifier-border)',
                            borderRadius: '4px',
                            color: copiedCodeBlock === code ? 'var(--color-green)' : 'var(--text-muted)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              },
              pre: ({node, ...props}) => (
                <pre 
                  style={{
                    margin: '12px 0',
                    padding: '12px',
                    backgroundColor: 'var(--background-primary)',
                    borderRadius: '6px',
                    overflow: 'auto',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    fontFamily: 'monospace',
                    border: '1px solid var(--background-modifier-border)',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    MozUserSelect: 'text',
                    msUserSelect: 'text',
                    cursor: 'text',
                  }}
                  {...props}
                />
              ),
              blockquote: ({node, ...props}) => (
                <blockquote 
                  style={{
                    margin: '12px 0',
                    padding: '8px 12px',
                    borderLeft: '4px solid var(--interactive-accent)',
                    backgroundColor: 'var(--background-secondary)',
                    borderRadius: '4px',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    MozUserSelect: 'text',
                    msUserSelect: 'text',
                  }}
                  {...props}
                />
              ),
              ul: ({node, ...props}) => (
                <ul 
                  style={{
                    margin: '8px 0',
                    paddingLeft: '20px',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    MozUserSelect: 'text',
                    msUserSelect: 'text',
                  }}
                  {...props}
                />
              ),
              ol: ({node, ...props}) => (
                <ol 
                  style={{
                    margin: '8px 0',
                    paddingLeft: '20px',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    MozUserSelect: 'text',
                    msUserSelect: 'text',
                  }}
                  {...props}
                />
              ),
              li: ({node, ...props}) => (
                <li 
                  style={{
                    margin: '4px 0',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    MozUserSelect: 'text',
                    msUserSelect: 'text',
                  }}
                  {...props}
                />
              ),
              h1: ({node, ...props}) => (
                <h1 
                  style={{
                    margin: '16px 0 8px 0',
                    fontSize: '1.5em',
                    fontWeight: 'bold',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    MozUserSelect: 'text',
                    msUserSelect: 'text',
                  }}
                  {...props}
                />
              ),
              h2: ({node, ...props}) => (
                <h2 
                  style={{
                    margin: '14px 0 6px 0',
                    fontSize: '1.3em',
                    fontWeight: 'bold',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    MozUserSelect: 'text',
                    msUserSelect: 'text',
                  }}
                  {...props}
                />
              ),
              h3: ({node, ...props}) => (
                <h3 
                  style={{
                    margin: '12px 0 6px 0',
                    fontSize: '1.1em',
                    fontWeight: 'bold',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    MozUserSelect: 'text',
                    msUserSelect: 'text',
                  }}
                  {...props}
                />
              ),
            }}
          >
            {message}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default AIMessage; 