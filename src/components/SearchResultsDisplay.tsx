import React from 'react';
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
  if (!isVisible || !searchResults.length) {
    return null;
  }

  return (
    <div className="tangent-search-results">
      <div className="tangent-search-results-header">
        <LucidIcon name="search" size={14} />
        <span className="tangent-search-results-title">
          Web Search Results
          {searchQuery && (
            <span className="tangent-search-query">
              for "{searchQuery}"
            </span>
          )}
        </span>
      </div>
      
      <div className="tangent-search-results-list">
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
    </div>
  );
};

export default SearchResultsDisplay; 