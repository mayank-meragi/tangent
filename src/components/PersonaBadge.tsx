import React from 'react';
import { Persona } from '../../tools/types';
import LucidIcon from './LucidIcon';

interface PersonaBadgeProps {
  persona: Persona;
  onClear: () => void;
}

const PersonaBadge: React.FC<PersonaBadgeProps> = ({ persona, onClear }) => {
  return (
    <div className="tangent-persona-badge">
      <div 
        className="tangent-persona-badge-color" 
        style={{ backgroundColor: persona.color }}
      />
      <span className="tangent-persona-badge-name">{persona.name}</span>
      <button 
        className="tangent-persona-badge-clear"
        onClick={onClear}
        title="Clear persona"
      >
        <LucidIcon name="x" size={12} />
      </button>
    </div>
  );
};

export default PersonaBadge; 