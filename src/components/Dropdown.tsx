import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DropdownItem } from '../../tools/types';
import LucidIcon from './LucidIcon';

interface DropdownProps {
  items: DropdownItem[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  maxHeight?: number;
  maxItems?: number;
  openUpwards?: boolean;
  autoOpen?: boolean;
  selectedIndex?: number;
  onSelectedIndexChange?: (index: number) => void;
  itemRenderer?: (item: DropdownItem, isSelected: boolean, isHighlighted: boolean) => React.ReactNode;
  onOpenChange?: (isOpen: boolean) => void;
  'aria-label'?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  items,
  value,
  onValueChange,
  placeholder = 'Select an option...',
  searchable = true,
  disabled = false,
  className = '',
  style = {},
  maxHeight = 300,
  maxItems = 5,
  openUpwards = false,
  autoOpen = false,
  selectedIndex = 0,
  onSelectedIndexChange,
  itemRenderer,
  onOpenChange,
  'aria-label': ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [filteredItems, setFilteredItems] = useState<DropdownItem[]>(items);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Get selected item
  const selectedItem = items.find(item => item.id === value);

  // Filter items and limit to maxItems
  useEffect(() => {
    setFilteredItems(items.slice(0, maxItems));
  }, [items, maxItems]);

  // Reset selected index when dropdown closes
  useEffect(() => {
    if (!isOpen && onSelectedIndexChange) {
      onSelectedIndexChange(0);
    }
  }, [isOpen, onSelectedIndexChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextIndex = selectedIndex < filteredItems.length - 1 ? selectedIndex + 1 : 0;
        onSelectedIndexChange?.(nextIndex);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : filteredItems.length - 1;
        onSelectedIndexChange?.(prevIndex);
        break;
      }
      case 'Enter':
        e.preventDefault();
        if (isOpen && selectedIndex >= 0 && selectedIndex < filteredItems.length) {
          handleSelect(filteredItems[selectedIndex]);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  }, [disabled, filteredItems, selectedIndex, isOpen, onSelectedIndexChange]);

  // Handle item selection
  const handleSelect = useCallback((item: DropdownItem) => {
    onValueChange?.(item.id);
    setIsOpen(false);
    if (onSelectedIndexChange) {
      onSelectedIndexChange(0);
    }
  }, [onValueChange, onSelectedIndexChange]);

  // Handle dropdown toggle
  const handleToggle = useCallback(() => {
    if (disabled) return;
    
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    onOpenChange?.(newIsOpen);
  }, [disabled, isOpen, onOpenChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onOpenChange]);

  // Focus dropdown when it opens and scroll highlighted item into view
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      // Focus the dropdown container for keyboard navigation
      dropdownRef.current.focus();
    }
    
    if (selectedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [isOpen, selectedIndex]);

  // Default item renderer
  const defaultItemRenderer = (item: DropdownItem, isSelected: boolean, isHighlighted: boolean) => (
    <div className="dropdown-item-content">
      {item.icon && (
        <LucidIcon 
          name={item.icon} 
          size={16} 
          className="dropdown-item-icon"
        />
      )}
      <div className="dropdown-item-text">
        <div className="dropdown-item-title">{item.title}</div>
        {item.description && (
          <div className="dropdown-item-description">{item.description}</div>
        )}
      </div>
      {item.category && (
        <div className="dropdown-item-category">{item.category}</div>
      )}
    </div>
  );

  return (
    <div 
      ref={dropdownRef}
      className={`tangent-dropdown ${className} ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
      style={style}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Trigger button - only show if not autoOpen */}
      {!autoOpen && (
        <button
          type="button"
          className="dropdown-trigger"
          onClick={handleToggle}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={ariaLabel || 'Select option'}
        >
          <div className="dropdown-value">
            {selectedItem ? (
              <div className="dropdown-selected-item">
                {selectedItem.icon && (
                  <LucidIcon 
                    name={selectedItem.icon} 
                    size={16} 
                    className="dropdown-selected-icon"
                  />
                )}
                <span className="dropdown-selected-text">{selectedItem.title}</span>
              </div>
            ) : (
              <span className="dropdown-placeholder">{placeholder}</span>
            )}
          </div>
          <LucidIcon 
            name={isOpen ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            className="dropdown-chevron"
          />
        </button>
      )}

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          className={`dropdown-menu ${openUpwards ? 'dropdown-menu-up' : ''} ${autoOpen ? 'dropdown-menu-auto' : ''}`}
          style={{
            [openUpwards ? 'bottom' : 'top']: autoOpen ? '0' : '100%',
            [openUpwards ? 'top' : 'bottom']: 'auto',
            marginTop: openUpwards ? '0' : (autoOpen ? '0' : '4px'),
            marginBottom: openUpwards ? (autoOpen ? '0' : '4px') : '0'
          }}
        >
          {/* Items list */}
          <ul 
            ref={listRef}
            className="dropdown-list"
            role="listbox"
            aria-label="Options"
            style={{ maxHeight }}
          >
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                const isSelected = item.id === value;
                const isHighlighted = index === selectedIndex;
                
                return (
                  <li
                    key={item.id}
                    className={`dropdown-item ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                    role="option"
                    aria-selected={isSelected ? 'true' : 'false'}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => onSelectedIndexChange?.(index)}
                  >
                    {itemRenderer 
                      ? itemRenderer(item, isSelected, isHighlighted)
                      : defaultItemRenderer(item, isSelected, isHighlighted)
                    }
                  </li>
                );
              })
            ) : (
              <li className="dropdown-empty">
                <div className="dropdown-empty-content">
                  <LucidIcon name="search-x" size={24} className="dropdown-empty-icon" />
                  <span>No options found</span>
                </div>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dropdown; 