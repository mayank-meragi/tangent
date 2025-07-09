import React, { useState, useEffect } from 'react';
import { SecurityConfig } from '../../mcp/types';

interface SecuritySettingsProps {
  securityConfig: SecurityConfig;
  onConfigChange: (config: SecurityConfig) => void;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  securityConfig,
  onConfigChange
}) => {
  const [config, setConfig] = useState<SecurityConfig>(securityConfig);
  const [newCommand, setNewCommand] = useState('');
  const [newDomain, setNewDomain] = useState('');

  useEffect(() => {
    setConfig(securityConfig);
  }, [securityConfig]);

  const updateConfig = (updates: Partial<SecurityConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const addCommand = () => {
    if (newCommand.trim() && !config.allowedCommands.includes(newCommand.trim())) {
      updateConfig({
        allowedCommands: [...config.allowedCommands, newCommand.trim()]
      });
      setNewCommand('');
    }
  };

  const removeCommand = (command: string) => {
    updateConfig({
      allowedCommands: config.allowedCommands.filter(c => c !== command)
    });
  };

  const addDomain = () => {
    if (newDomain.trim() && !config.allowedDomains.includes(newDomain.trim())) {
      updateConfig({
        allowedDomains: [...config.allowedDomains, newDomain.trim()]
      });
      setNewDomain('');
    }
  };

  const removeDomain = (domain: string) => {
    updateConfig({
      allowedDomains: config.allowedDomains.filter(d => d !== domain)
    });
  };

  return (
    <div className="security-settings">
      <h3>Security Configuration</h3>
      
      {/* Allowed Commands */}
      <div className="setting-group">
        <h4>Allowed Commands</h4>
        <p className="setting-description">
          Commands that are allowed to be executed by MCP servers.
        </p>
        
        <div className="command-list">
          {config.allowedCommands.map((command, index) => (
            <div key={index} className="command-item">
              <span className="command-name">{command}</span>
              <button
                className="remove-button"
                onClick={() => removeCommand(command)}
                title="Remove command"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        <div className="add-command">
          <input
            type="text"
            value={newCommand}
            onChange={(e) => setNewCommand(e.target.value)}
            placeholder="Enter command name"
            onKeyPress={(e) => e.key === 'Enter' && addCommand()}
          />
          <button onClick={addCommand}>Add Command</button>
        </div>
      </div>

      {/* Allowed Domains */}
      <div className="setting-group">
        <h4>Allowed Domains</h4>
        <p className="setting-description">
          Domains that MCP servers are allowed to connect to.
        </p>
        
        <div className="domain-list">
          {config.allowedDomains.map((domain, index) => (
            <div key={index} className="domain-item">
              <span className="domain-name">{domain}</span>
              <button
                className="remove-button"
                onClick={() => removeDomain(domain)}
                title="Remove domain"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        <div className="add-domain">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="Enter domain name"
            onKeyPress={(e) => e.key === 'Enter' && addDomain()}
          />
          <button onClick={addDomain}>Add Domain</button>
        </div>
      </div>

      {/* Timeout Settings */}
      <div className="setting-group">
        <h4>Timeout Settings</h4>
        <div className="setting-item">
          <label>
            Maximum Timeout (ms):
            <input
              type="number"
              value={config.maxTimeout}
              onChange={(e) => updateConfig({ maxTimeout: parseInt(e.target.value) || 30000 })}
              min="1000"
              max="300000"
            />
          </label>
        </div>
      </div>

      {/* Memory Settings */}
      <div className="setting-group">
        <h4>Memory Settings</h4>
        <div className="setting-item">
          <label>
            Maximum Memory Usage (MB):
            <input
              type="number"
              value={config.maxMemoryUsage}
              onChange={(e) => updateConfig({ maxMemoryUsage: parseInt(e.target.value) || 512 })}
              min="64"
              max="2048"
            />
          </label>
        </div>
      </div>

      {/* Security Features */}
      <div className="setting-group">
        <h4>Security Features</h4>
        
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={config.enableSandboxing}
              onChange={(e) => updateConfig({ enableSandboxing: e.target.checked })}
            />
            Enable Sandboxing
          </label>
          <p className="setting-description">
            Run MCP servers in a sandboxed environment for additional security.
          </p>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={config.requireConfirmation}
              onChange={(e) => updateConfig({ requireConfirmation: e.target.checked })}
            />
            Require Confirmation for Destructive Operations
          </label>
          <p className="setting-description">
            Ask for user confirmation before executing potentially destructive operations.
          </p>
        </div>
      </div>

      {/* Rate Limiting */}
      <div className="setting-group">
        <h4>Rate Limiting</h4>
        
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={config.rateLimiting.enabled}
              onChange={(e) => updateConfig({
                rateLimiting: { ...config.rateLimiting, enabled: e.target.checked }
              })}
            />
            Enable Rate Limiting
          </label>
        </div>

        {config.rateLimiting.enabled && (
          <>
            <div className="setting-item">
              <label>
                Max Calls per Minute:
                <input
                  type="number"
                  value={config.rateLimiting.maxCallsPerMinute}
                  onChange={(e) => updateConfig({
                    rateLimiting: {
                      ...config.rateLimiting,
                      maxCallsPerMinute: parseInt(e.target.value) || 60
                    }
                  })}
                  min="1"
                  max="1000"
                />
              </label>
            </div>

            <div className="setting-item">
              <label>
                Max Calls per Hour:
                <input
                  type="number"
                  value={config.rateLimiting.maxCallsPerHour}
                  onChange={(e) => updateConfig({
                    rateLimiting: {
                      ...config.rateLimiting,
                      maxCallsPerHour: parseInt(e.target.value) || 1000
                    }
                  })}
                  min="10"
                  max="10000"
                />
              </label>
            </div>
          </>
        )}
      </div>

      <style>{`
        .security-settings {
          padding: 1rem;
          max-width: 800px;
        }

        .setting-group {
          margin-bottom: 2rem;
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .setting-group h4 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .setting-description {
          margin: 0.5rem 0 1rem 0;
          color: #666;
          font-size: 0.9rem;
        }

        .command-list,
        .domain-list {
          margin-bottom: 1rem;
        }

        .command-item,
        .domain-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          margin: 0.25rem 0;
          background: #f5f5f5;
          border-radius: 4px;
        }

        .remove-button {
          background: #ff4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
        }

        .remove-button:hover {
          background: #cc0000;
        }

        .add-command,
        .add-domain {
          display: flex;
          gap: 0.5rem;
        }

        .add-command input,
        .add-domain input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .add-command button,
        .add-domain button {
          padding: 0.5rem 1rem;
          background: #007acc;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .add-command button:hover,
        .add-domain button:hover {
          background: #005a9e;
        }

        .setting-item {
          margin-bottom: 1rem;
        }

        .setting-item label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .setting-item input[type="number"] {
          width: 100px;
          padding: 0.25rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .setting-item input[type="checkbox"] {
          margin-right: 0.5rem;
        }
      `}</style>
    </div>
  );
}; 