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
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      title={title}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered && !disabled ? 'var(--background-modifier-hover)' : 'none',
        border: 'none',
        boxShadow: 'none',
        outline: 'none',
        padding: 5,
        margin: 0,
        color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        borderRadius: '8px',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
        ...style,
      }}
    >
      {icon}
    </button>
  );
};

export default IconButton; 