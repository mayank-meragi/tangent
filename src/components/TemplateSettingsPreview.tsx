import React from 'react';
import { TemplateSettings } from '../../tools/types';
import LucidIcon from './LucidIcon';

interface TemplateSettingsPreviewProps {
  settings?: TemplateSettings;
}

const TemplateSettingsPreview: React.FC<TemplateSettingsPreviewProps> = ({ settings }) => {
  if (!settings) return null;

  return (
    <div className="template-settings-preview">
      <div className="settings-icon">
        <LucidIcon name="settings" size={12} />
      </div>
      <div className="settings-list">
        {settings.thinkingEnabled !== undefined && (
          <span className="setting-item">
            <LucidIcon name="brain" size={10} />
            Thinking: {settings.thinkingEnabled ? 'On' : 'Off'}
          </span>
        )}
        {settings.webSearchEnabled !== undefined && (
          <span className="setting-item">
            <LucidIcon name="search" size={10} />
            Web: {settings.webSearchEnabled ? 'On' : 'Off'}
          </span>
        )}
        {settings.modelId !== undefined && (
          <span className="setting-item">
            <LucidIcon name="cpu" size={10} />
            {settings.modelId}
          </span>
        )}
      </div>
    </div>
  );
};

export default TemplateSettingsPreview; 