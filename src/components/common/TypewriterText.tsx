import React, { useEffect, useState } from 'react';

interface TypewriterTextProps {
  text: string;
  speedMs?: number;
  className?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speedMs = 25,
  className = '',
}) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    if (!text) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speedMs);

    return () => clearInterval(interval);
  }, [text, speedMs]);

  return (
    <span className={className}>
      {displayedText}
      {displayedText.length < text.length && (
        <span className="inline-block w-1.5 h-4 ml-0.5 bg-brand-500 animate-pulse" />
      )}
    </span>
  );
};
