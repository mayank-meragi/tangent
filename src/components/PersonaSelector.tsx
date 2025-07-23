import React, { useState } from 'react';
import { Persona } from '../../tools/types';
import LucidIcon from './LucidIcon';

interface PersonaSelectorProps {
  personas: Persona[];
  selectedPersona: Persona | null;
  onPersonaSelect: (persona: Persona) => void;
  onPersonaClear: () => void;
  isVisible: boolean;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({ 
  personas, 
  selectedPersona, 
  onPersonaSelect, 
  onPersonaClear,
  isVisible 
}) => {
  const [hoveredPersona, setHoveredPersona] = useState<string | null>(null);

  if (!isVisible) {
    return null;
  }

  const handlePersonaClick = (persona: Persona) => {
    if (selectedPersona?.id === persona.id) {
      onPersonaClear();
    } else {
      onPersonaSelect(persona);
    }
  };

  const isPersonaSelected = (persona: Persona) => {
    return selectedPersona?.id === persona.id;
  };

  return (
    <div className="tangent-persona-selector-container">
      <div className="tangent-persona-selector">
        <div className="tangent-persona-selector-header">
          <div className="tangent-persona-selector-title">
            <LucidIcon name="user" size={20} />
            <h3>Choose a Persona</h3>
          </div>
          <p className="tangent-persona-selector-subtitle">
            Select how you'd like the AI to behave in this conversation
          </p>
        </div>

        <div className="tangent-persona-options">
          {/* No Persona Option */}
          <div 
            className={`tangent-persona-option ${!selectedPersona ? 'selected' : ''}`}
            onClick={onPersonaClear}
            onMouseEnter={() => setHoveredPersona('none')}
            onMouseLeave={() => setHoveredPersona(null)}
          >
            <div className="tangent-persona-color no-persona">
              <LucidIcon name="user-x" size={16} />
            </div>
            <div className="tangent-persona-info">
              <div className="tangent-persona-name">No Persona</div>
              <div className="tangent-persona-description">
                Use the default AI behavior without any specific personality
              </div>
            </div>
            {!selectedPersona && (
              <div className="tangent-persona-check">
                <LucidIcon name="check" size={16} />
              </div>
            )}
          </div>

          {/* Persona Options */}
          {personas.map(persona => (
            <div 
              key={persona.id} 
              className={`tangent-persona-option ${isPersonaSelected(persona) ? 'selected' : ''} ${hoveredPersona === persona.id ? 'hovered' : ''}`}
              onClick={() => handlePersonaClick(persona)}
              onMouseEnter={() => setHoveredPersona(persona.id)}
              onMouseLeave={() => setHoveredPersona(null)}
            >
              <div 
                className="tangent-persona-color" 
                style={{backgroundColor: persona.color}}
              >
                <LucidIcon name="user" size={16} />
              </div>
              <div className="tangent-persona-info">
                <div className="tangent-persona-name">{persona.name}</div>
                <div className="tangent-persona-description">{persona.description}</div>
                <div className="tangent-persona-author">
                  {persona.author === 'system' ? 'Built-in' : 'Custom'}
                </div>
              </div>
              {isPersonaSelected(persona) && (
                <div className="tangent-persona-check">
                  <LucidIcon name="check" size={16} />
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedPersona && (
          <div className="tangent-persona-preview">
            <div className="tangent-persona-preview-header">
              <LucidIcon name="info" size={16} />
              <span>Selected Persona: {selectedPersona.name}</span>
            </div>
            <div className="tangent-persona-preview-content">
              {selectedPersona.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonaSelector; 