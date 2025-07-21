import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ConversationTemplate } from '../../tools/types';

interface VariableInputModalProps {
  isVisible: boolean;
  template: ConversationTemplate | null;
  onConfirm: (variables: Record<string, any>) => void;
  onCancel: () => void;
}

interface VariableFormData {
  [key: string]: any;
}

interface ValidationErrors {
  [key: string]: string;
}

export const VariableInputModal: React.FC<VariableInputModalProps> = ({
  isVisible,
  template,
  onConfirm,
  onCancel
}) => {
  const [formData, setFormData] = useState<VariableFormData>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [preview, setPreview] = useState<string>('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null)[]>([]);

  // Initialize form data with default values when template changes
  useEffect(() => {
    if (template && template.variables) {
      const initialData: VariableFormData = {};
      template.variables.forEach(variable => {
        initialData[variable.name] = variable.default !== undefined ? variable.default : '';
      });
      setFormData(initialData);
      setErrors({});
      setFocusedIndex(0);
      updatePreview(template.content, initialData);
    }
  }, [template]);

  // Update preview when form data changes
  const updatePreview = useCallback((content: string, data: VariableFormData) => {
    let previewContent = content;
    
    if (template?.variables) {
      template.variables.forEach(variable => {
        const placeholder = `{{${variable.name}}}`;
        const value = data[variable.name] !== undefined ? String(data[variable.name]) : '';
        const replacement = value || `[${variable.description || variable.name}]`;
        previewContent = previewContent.replace(new RegExp(placeholder, 'g'), replacement);
      });
    }
    
    setPreview(previewContent);
  }, [template]);

  // Handle form data changes
  const handleInputChange = (variableName: string, value: any) => {
    const newFormData = { ...formData, [variableName]: value };
    setFormData(newFormData);
    
    // Clear error for this field
    if (errors[variableName]) {
      setErrors(prev => ({ ...prev, [variableName]: '' }));
    }
    
    // Update preview
    if (template) {
      updatePreview(template.content, newFormData);
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    if (!template?.variables) return true;
    
    const newErrors: ValidationErrors = {};
    
    template.variables.forEach(variable => {
      const value = formData[variable.name];
      
      // Check required fields
      if (variable.required && (value === undefined || value === null || value === '')) {
        newErrors[variable.name] = `${variable.name} is required`;
        return;
      }
      
      // Type-specific validation
      if (value !== undefined && value !== null && value !== '') {
        switch (variable.type) {
          case 'number':
            if (isNaN(Number(value))) {
              newErrors[variable.name] = `${variable.name} must be a valid number`;
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean' && !['true', 'false', '0', '1'].includes(String(value).toLowerCase())) {
              newErrors[variable.name] = `${variable.name} must be true or false`;
            }
            break;
          case 'select':
            if (variable.options && !variable.options.includes(String(value))) {
              newErrors[variable.name] = `${variable.name} must be one of: ${variable.options.join(', ')}`;
            }
            break;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onConfirm(formData);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Ctrl/Cmd + Enter for all templates (with or without variables)
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
      return;
    }
    
    // Only handle navigation if template has variables
    if (!template?.variables) return;
    
    const totalFields = template.variables?.length || 0;
    
    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          setFocusedIndex(prev => prev > 0 ? prev - 1 : totalFields - 1);
        } else {
          setFocusedIndex(prev => prev < totalFields - 1 ? prev + 1 : 0);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => prev < totalFields - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : totalFields - 1);
        break;
      case 'Escape':
        onCancel();
        break;
    }
  };

  // Focus the current input field
  useEffect(() => {
    if (isVisible && inputRefs.current[focusedIndex]) {
      inputRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, isVisible]);

  // Focus trap for modal
  useEffect(() => {
    const handleTabKey = (e: KeyboardEvent) => {
      if (!isVisible || !modalRef.current) return;
      
      const focusableElements = modalRef.current.querySelectorAll(
        'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isVisible]);

  if (!isVisible || !template) {
    return null;
  }

  const hasErrors = Object.keys(errors).length > 0;
  const hasVariables = template.variables && template.variables.length > 0;

  return (
    <div className="variable-input-modal-overlay" onClick={onCancel}>
      <div 
        className="variable-input-modal" 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-labelledby="variable-modal-title"
        aria-describedby="variable-modal-description"
      >
        <div className="variable-input-modal-header">
          <h2 id="variable-modal-title">Configure Template Variables</h2>
          <p id="variable-modal-description">
            Customize the variables for "{template.title}" template. Use Ctrl+Enter to quickly insert.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="variable-input-form">
          {hasVariables ? (
            <div className="variable-input-fields">
              {template.variables?.map((variable, index) => (
                <div key={variable.name} className="variable-input-field">
                  <label htmlFor={`variable-${variable.name}`} className="variable-label">
                    {variable.name}
                    {variable.required && <span className="required-indicator">*</span>}
                  </label>
                  
                  {variable.description && (
                    <p className="variable-description">{variable.description}</p>
                  )}
                  
                                     {variable.type === 'select' ? (
                     <select
                       id={`variable-${variable.name}`}
                       ref={(el) => { inputRefs.current[index] = el; }}
                       value={formData[variable.name] || ''}
                       onChange={(e) => handleInputChange(variable.name, e.target.value)}
                       className={`variable-input ${errors[variable.name] ? 'error' : ''}`}
                       aria-describedby={errors[variable.name] ? `error-${variable.name}` : undefined}
                     >
                       <option value="">Select an option...</option>
                       {variable.options?.map(option => (
                         <option key={option} value={option}>
                           {option}
                         </option>
                       ))}
                     </select>
                   ) : variable.type === 'boolean' ? (
                     <div className="boolean-input-group">
                       <label className="boolean-label">
                         <input
                           type="radio"
                           ref={(el) => { inputRefs.current[index] = el; }}
                           name={`variable-${variable.name}`}
                           value="true"
                           checked={formData[variable.name] === true || formData[variable.name] === 'true'}
                           onChange={(e) => handleInputChange(variable.name, e.target.value === 'true')}
                           className="variable-input"
                         />
                         True
                       </label>
                       <label className="boolean-label">
                         <input
                           type="radio"
                           name={`variable-${variable.name}`}
                           value="false"
                           checked={formData[variable.name] === false || formData[variable.name] === 'false'}
                           onChange={(e) => handleInputChange(variable.name, e.target.value === 'true')}
                           className="variable-input"
                         />
                         False
                       </label>
                     </div>
                   ) : variable.type === 'number' ? (
                     <input
                       type="number"
                       id={`variable-${variable.name}`}
                       ref={(el) => { inputRefs.current[index] = el; }}
                       value={formData[variable.name] || ''}
                       onChange={(e) => handleInputChange(variable.name, e.target.value)}
                       className={`variable-input ${errors[variable.name] ? 'error' : ''}`}
                       aria-describedby={errors[variable.name] ? `error-${variable.name}` : undefined}
                       placeholder={variable.default !== undefined ? String(variable.default) : ''}
                     />
                   ) : (
                     <textarea
                       id={`variable-${variable.name}`}
                       ref={(el) => { inputRefs.current[index] = el; }}
                       value={formData[variable.name] || ''}
                       onChange={(e) => handleInputChange(variable.name, e.target.value)}
                       className={`variable-input ${errors[variable.name] ? 'error' : ''}`}
                       aria-describedby={errors[variable.name] ? `error-${variable.name}` : undefined}
                       placeholder={variable.default !== undefined ? String(variable.default) : variable.description}
                       rows={3}
                     />
                   )}
                  
                  {errors[variable.name] && (
                    <div id={`error-${variable.name}`} className="error-message" role="alert">
                      {errors[variable.name]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-variables-message">
              <p>This template has no variables to configure.</p>
            </div>
          )}

          {hasVariables && (
            <div className="variable-preview">
              <h3>Preview</h3>
              <div className="preview-content">
                <pre>{preview}</pre>
              </div>
            </div>
          )}

          <div className="variable-input-actions">
            <button
              type="button"
              onClick={onCancel}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="confirm-button"
              disabled={hasErrors}
            >
              Insert Template (Ctrl+Enter)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 