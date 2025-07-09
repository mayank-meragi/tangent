import React, { useState, useEffect } from 'react';
import { MCPServerConfig, MCPServerStatus } from '../../mcp/types';
import { getPreconfiguredServers, getServerInstallationInstructions, requiresManualInstallation } from '../../mcp/preconfiguredServers';
import IconButton from './IconButton';
import LucidIcon from './LucidIcon';

interface MCPServerManagerProps {
  servers: MCPServerConfig[];
  serverStatuses: MCPServerStatus[];
  onAddServer: (server: MCPServerConfig) => void;
  onRemoveServer: (serverName: string) => void;
  onToggleServer: (serverName: string, enabled: boolean) => void;
  onStartServer: (serverName: string) => void;
  onStopServer: (serverName: string) => void;
  isPlaceholderServer?: (serverName: string) => boolean;
}

export const MCPServerManager: React.FC<MCPServerManagerProps> = ({
  servers,
  serverStatuses,
  onAddServer,
  onRemoveServer,
  onToggleServer,
  onStartServer,
  onStopServer,
  isPlaceholderServer
}) => {
  const [showAddServer, setShowAddServer] = useState(false);
  const [selectedPreconfigured, setSelectedPreconfigured] = useState<string>('');
  const [expandedInstructions, setExpandedInstructions] = useState<{ [key: string]: boolean }>({});
  const [preconfiguredServers, setPreconfiguredServers] = useState<MCPServerConfig[]>([]);

  // Load preconfigured servers on component mount
  useEffect(() => {
    const loadPreconfiguredServers = async () => {
      try {
        const servers = await getPreconfiguredServers();
        setPreconfiguredServers(servers);
      } catch (error) {
        console.error('Failed to load preconfigured servers:', error);
        setPreconfiguredServers([]);
      }
    };
    
    loadPreconfiguredServers();
  }, []);

  const getServerStatus = (serverName: string): MCPServerStatus | undefined => {
    return serverStatuses.find(status => status.name === serverName);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'running': return 'var(--color-green)';
      case 'stopped': return 'var(--text-muted)';
      case 'error': return 'var(--color-red)';
      case 'starting': return 'var(--color-orange)';
      case 'stopping': return 'var(--color-orange)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'running': return 'check-circle';
      case 'stopped': return 'circle';
      case 'error': return 'x-circle';
      case 'starting': return 'loader-2';
      case 'stopping': return 'loader-2';
      default: return 'circle';
    }
  };



  const handleAddPreconfiguredServer = () => {
    if (selectedPreconfigured) {
      const server = preconfiguredServers.find(s => s.name === selectedPreconfigured);
      if (server) {
        onAddServer({ ...server });
        setSelectedPreconfigured('');
        setShowAddServer(false);
      }
    }
  };

  const handleToggleServer = async (serverName: string, enabled: boolean) => {
    await onToggleServer(serverName, enabled);
  };

  const handleStartServer = async (serverName: string) => {
    await onStartServer(serverName);
  };

  const handleStopServer = async (serverName: string) => {
    await onStopServer(serverName);
  };

  const handleRemoveServer = async (serverName: string) => {
    await onRemoveServer(serverName);
  };

  return (
    <div className="mcp-server-manager">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: 0 }}>MCP Servers</h3>
        <IconButton
          icon={<LucidIcon name="plus" size={16} />}
          ariaLabel="Add Server"
          onClick={() => setShowAddServer(!showAddServer)}
          title="Add Server"
        />
      </div>

      {/* Add Server Section */}
      {showAddServer && (
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--background-secondary)',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <h4 style={{ margin: '0 0 12px 0' }}>Add Pre-configured Server</h4>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={selectedPreconfigured}
              onChange={(e) => setSelectedPreconfigured(e.target.value)}
              aria-label="Select pre-configured server"
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid var(--background-modifier-border)',
                backgroundColor: 'var(--background-primary)',
                color: 'var(--text-normal)'
              }}
            >
              <option value="">Select a server...</option>
              {preconfiguredServers.map(server => (
                <option key={server.name} value={server.name}>
                  {server.name} - {server.description}
                </option>
              ))}
            </select>
            <IconButton
              icon={<LucidIcon name="plus" size={16} />}
              ariaLabel="Add Server"
              onClick={handleAddPreconfiguredServer}
              disabled={!selectedPreconfigured}
              title="Add Server"
            />
            <IconButton
              icon={<LucidIcon name="x" size={16} />}
              ariaLabel="Cancel"
              onClick={() => setShowAddServer(false)}
              title="Cancel"
            />
          </div>
        </div>
      )}

      {/* Server List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {servers.map(server => {
          const status = getServerStatus(server.name);
          const isRunning = status?.status === 'running';
          const isStarting = status?.status === 'starting';
          const isStopping = status?.status === 'stopping';
          const isPlaceholder = isPlaceholderServer && isPlaceholderServer(server.name);
          const instructions = getServerInstallationInstructions(server.name);

          return (
            <div
              key={server.name}
              style={{
                padding: '12px',
                backgroundColor: 'var(--background-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--background-modifier-border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <LucidIcon
                      name={getStatusIcon(status?.status || 'stopped')}
                      size={16}
                      className="status-icon"
                    />
                    <strong>{server.name}</strong>
                    <span style={{ 
                      fontSize: '12px', 
                      color: getStatusColor(status?.status || 'stopped'),
                      textTransform: 'capitalize'
                    }}>
                      {status?.status || 'stopped'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {server.description}
                  </div>
                  {isPlaceholder && (
                    <div style={{ marginTop: 8, color: 'var(--color-orange)', fontSize: '13px', fontWeight: 'bold' }}>
                      ⚠️ This server is not properly configured. Please follow the installation instructions below.
                    </div>
                  )}
                  {status?.lastError && (
                    <div style={{ fontSize: '11px', color: 'var(--color-red)', marginTop: '4px' }}>
                      Error: {status.lastError}
                    </div>
                  )}
                  {/* Collapsible Installation Instructions */}
                  {isPlaceholder && instructions && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-accent)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        onClick={() => setExpandedInstructions(e => ({ ...e, [server.name]: !e[server.name] }))}
                      >
                        <LucidIcon name={expandedInstructions[server.name] ? 'chevron-down' : 'chevron-right'} size={14} />
                        Installation Instructions
                      </button>
                      {expandedInstructions[server.name] && (
                        <pre style={{
                          fontSize: '12px',
                          backgroundColor: 'var(--background-primary)',
                          padding: '10px',
                          borderRadius: '6px',
                          margin: '8px 0 0 0',
                          whiteSpace: 'pre-wrap',
                          color: 'var(--text-normal)',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text',
                          overflowX: 'auto'
                        }}>{instructions}</pre>
                      )}
                    </div>
                  )}
                  {status?.status === 'stopped' && (
                    <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: '13px' }}>
                      <b>This server is currently stopped.</b><br />
                      To start it, make sure it is enabled and then click the <b>Start</b> (<span style={{fontSize: '1.1em'}}>▶️</span>) button above.<br />
                      {requiresManualInstallation(server.name) && getServerInstallationInstructions(server.name) && (
                        <>
                          <b>Installation Required:</b><br />
                          <pre style={{ 
                            fontSize: '11px', 
                            backgroundColor: 'var(--background-primary)', 
                            padding: '8px', 
                            borderRadius: '4px',
                            margin: '4px 0',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {getServerInstallationInstructions(server.name)}
                          </pre>
                        </>
                      )}
                      {!requiresManualInstallation(server.name) && (
                        <>
                          If this is your first time, you may need to install the MCP servers package:<br />
                          <code>npm install -g @modelcontextprotocol/servers</code><br />
                          The plugin will automatically launch the server for you when you click Start.
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="checkbox"
                      checked={server.enabled}
                      onChange={(e) => handleToggleServer(server.name, e.target.checked)}
                      disabled={isStarting || isStopping}
                    />
                    <span style={{ fontSize: '12px' }}>Enabled</span>
                  </label>
                  
                  {server.enabled && (
                    <>
                      {!isRunning && !isStarting && (
                        <IconButton
                          icon={<LucidIcon name="play" size={16} />}
                          ariaLabel="Start Server"
                          onClick={() => handleStartServer(server.name)}
                          disabled={isStarting || isStopping}
                          title="Start Server"
                        />
                      )}
                      {isRunning && !isStopping && (
                        <IconButton
                          icon={<LucidIcon name="square" size={16} />}
                          ariaLabel="Stop Server"
                          onClick={() => handleStopServer(server.name)}
                          disabled={isStarting || isStopping}
                          title="Stop Server"
                        />
                      )}
                    </>
                  )}
                  
                  <IconButton
                    icon={<LucidIcon name="trash-2" size={16} />}
                    ariaLabel="Remove Server"
                    onClick={() => handleRemoveServer(server.name)}
                    disabled={isStarting || isStopping}
                    title="Remove Server"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {servers.length === 0 && (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--background-secondary)',
            borderRadius: '8px'
          }}>
            <LucidIcon name="server" size={24} className="empty-state-icon" />
            <div>No MCP servers configured</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Add a server to enable additional tools
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 