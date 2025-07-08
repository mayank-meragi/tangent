import React, { useRef, useEffect } from 'react';
import { setIcon } from 'obsidian';

interface LucidIconProps {
  name: string;
  size?: number;
  className?: string;
}

const LucidIcon: React.FC<LucidIconProps> = ({ name, size = 16, className = '' }) => {
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (iconRef.current) {
      setIcon(iconRef.current, name);
    }
  }, [name]);

  return (
    <span
      ref={iconRef}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: size,
        height: size,
      }}
    />
  );
};

export default LucidIcon; 