/**
 * Utility to convert URLs in text to clickable links
 */

import React from 'react';

/**
 * Converts URLs in text to clickable anchor tags
 * @param text - The text containing URLs
 * @param className - Optional CSS class for the links
 * @returns React elements with clickable links
 */
export function linkify(text: string, className?: string): React.ReactNode {
  if (!text) return text;

  // Regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    // Check if this part is a URL
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={className || "text-blue-600 hover:text-blue-800 underline break-all"}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}
