import React from 'react';
import IconButton from './IconButton';
import LucidIcon from './LucidIcon';

interface ToggleButtonProps {
  iconName: string;
  isEnabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  enabledTitle: string;
  disabledTitle: string;
  enabledAriaLabel: string;
  disabledAriaLabel: string;
  size?: number;
  showSpinner?: boolean;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  iconName,
  isEnabled,
  onToggle,
  disabled = false,
  enabledTitle,
  disabledTitle,
  enabledAriaLabel,
  disabledAriaLabel,
  size = 14,
  showSpinner = false
}) => {
  return (
    <div className="tangent-toggle-button-container" style={{ position: 'relative' }}>
      {/* Spinner background when showSpinner is true */}
      {showSpinner && (
        <div className="tangent-spinner-background" />
      )}
      <IconButton
        icon={<LucidIcon name={iconName} size={size} />}
        ariaLabel={isEnabled ? enabledAriaLabel : disabledAriaLabel}
        onClick={onToggle}
        disabled={disabled}
        title={isEnabled ? enabledTitle : disabledTitle}
        style={{
          backgroundColor: isEnabled ? 'var(--background-modifier-hover)' : 'transparent',
          color: isEnabled ? 'var(--text-accent)' : 'var(--text-faint)',
          border: isEnabled ? '1px solid var(--background-modifier-border)' : '1px solid transparent',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.6 : 1,
          position: 'relative',
          zIndex: 2,
        }}
      />
    </div>
  );
};

export default ToggleButton; 