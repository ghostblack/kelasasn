import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathTextProps {
  text: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ text, className }) => {
  if (!text) return null;

  // Regex to find both block math $$...$$ and inline math $...$
  // Use negative looking behind/ahead to avoid matching escaped \$
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$.*?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const formula = part.slice(2, -2);
          return <BlockMath key={index} math={formula} />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const formula = part.slice(1, -1);
          return <InlineMath key={index} math={formula} />;
        }
        
        // Handle normal text, preserving newlines if necessary
        return <span key={index} className="whitespace-pre-wrap">{part}</span>;
      })}
    </span>
  );
};
