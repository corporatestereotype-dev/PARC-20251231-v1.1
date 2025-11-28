import React, { useMemo } from 'react';

interface CodeBlockProps {
  title: string;
  content: string;
  language?: string;
  highlightTerm?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ title, content, language = 'text', highlightTerm }) => {
  const highlightedContent = useMemo(() => {
    if (!highlightTerm || highlightTerm.trim() === '') {
      return content;
    }
    // Escape special regex characters in the search term
    const escapedTerm = highlightTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (escapedTerm.trim() === '') return content;
    
    const parts = content.split(new RegExp(`(${escapedTerm})`, 'gi'));
    
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlightTerm.toLowerCase() ? (
            <mark key={i} className="bg-yellow-500/40 text-white rounded px-0.5 py-0">
              {part}
            </mark>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          )
        )}
      </>
    );
  }, [content, highlightTerm]);
  
  return (
    <div className="bg-slate-900/70 rounded-lg overflow-hidden border border-slate-700 h-full flex flex-col">
       {title && (
        <div className="px-4 py-2 bg-slate-800/60 border-b border-slate-700 flex-shrink-0">
          <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        </div>
      )}
      <pre className="p-4 text-sm text-slate-200 overflow-auto flex-grow">
        <code className={`language-${language} whitespace-pre-wrap break-words`}>{highlightedContent}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;