import React from 'react';

interface IconButtonProps {
  icon: React.ReactNode;
  ariaLabel: string;
  onClick?: () => void;
  disabled?: boolean;
  size?: number;
  color?: string;
  title?: string;
  style?: React.CSSProperties;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  ariaLabel,
  onClick,
  disabled = false,
  size = 18,
  color = 'var(--text-muted)',
  title,
  style = {},
}) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      title={title}
      style={{
        background: 'none',
        border: 'none',
        boxShadow: 'none',
        outline: 'none',
        padding: 0,
        margin: 0,
        color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        borderRadius: 0,
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {icon}
    </button>
  );
};

export default IconButton; 