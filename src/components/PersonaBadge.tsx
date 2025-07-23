import React from 'react';
import { Persona } from '../../tools/types';

interface PersonaBadgeProps {
  persona: Persona;
}

const PersonaBadge: React.FC<PersonaBadgeProps> = ({ persona }) => {
  return (
    <div className="tangent-persona-badge">
      <div 
        className="tangent-persona-badge-color" 
        style={{ backgroundColor: persona.color }}
      />
      <span className="tangent-persona-badge-name">{persona.name}</span>
    </div>
  );
};

export default PersonaBadge; 