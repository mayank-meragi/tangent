import React, { useState } from 'react';
import LucidIcon from './LucidIcon';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface SearchResultsDisplayProps {
  searchQuery?: string;
  searchResults?: SearchResult[];
  isVisible: boolean;
}

const SearchResultsDisplay: React.FC<SearchResultsDisplayProps> = ({
  searchQuery,
  searchResults = [],
  isVisible
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible || !searchResults.length) {
    return null;
  }

  return (
    <div className="tangent-search-results">
      <div 
        className="tangent-search-results-header"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        <LucidIcon 
          name={isExpanded ? "chevron-down" : "chevron-right"} 
          size={14} 
        />
        <span className="tangent-search-results-title">
          Sources ({searchResults.length})
        </span>
      </div>
      
      {isExpanded && (
        <div className="tangent-search-results-list">
          {searchQuery && (
            <div className="tangent-search-query-display">
              <strong>Query:</strong> {searchQuery}
            </div>
          )}
          {searchResults.map((result, index) => (
            <div key={index} className="tangent-search-result-item">
              <a 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="tangent-search-result-link"
              >
                {result.title}
              </a>
              <p className="tangent-search-result-snippet">
                {result.snippet}
              </p>
              <span className="tangent-search-result-url">
                {result.url}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResultsDisplay; 