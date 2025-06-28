
'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CodePreviewProps {
  title?: string;
  content: string;
  isProcessed?: boolean;
  className?: string;
  placeholder?: string;
}

const CodePreview = memo(function CodePreview({ 
  title = '', 
  content, 
  isProcessed = false, 
  className = '',
  placeholder = 'Nenhum conteúdo para exibir'
}: CodePreviewProps) {
  
  const highlightGCode = (code: string): string => {
    if (!code) return '';
    
    return code
      .split('\n')
      .map((line, index) => {
        let highlightedLine = line;
        
        // Comments
        highlightedLine = highlightedLine.replace(
          /(;.*$)/g, 
          '<span class="text-[#9ECE6A]">$1</span>'
        );
        
        // G and M commands
        highlightedLine = highlightedLine.replace(
          /\b([GM]\d+)\b/g, 
          '<span class="text-[#E0AF68] font-semibold">$1</span>'
        );
        
        // Coordinates (X, Y, Z)
        highlightedLine = highlightedLine.replace(
          /\b([XYZ])([-+]?\d*\.?\d+)/g, 
          '<span class="text-[#7DCFFF]">$1</span><span class="text-[#C0CAF5]">$2</span>'
        );
        
        // Parameters (F, P, S)
        highlightedLine = highlightedLine.replace(
          /\b([FPS])([-+]?\d*\.?\d+)/g, 
          '<span class="text-[#BB9AF7]">$1</span><span class="text-[#C0CAF5]">$2</span>'
        );
        
        // Line numbers (optional)
        const lineNumber = (index + 1).toString().padStart(4, ' ');
        
        return `<div class="flex">
          <span class="text-[#565F89] select-none mr-4 text-right w-12 flex-shrink-0">${lineNumber}</span>
          <span class="flex-1">${highlightedLine}</span>
        </div>`;
      })
      .join('\n');
  };

  if (!content.trim()) {
    return (
      <Card className={`bg-[#24283B] border-[#414868] ${className}`}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-[#565F89]">
            <p className="text-sm">{placeholder}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`bg-[#24283B] border-[#414868] ${className}`}>
      <div className="h-full flex flex-col">
        {title && (
          <div className="px-4 py-2 border-b border-[#414868]">
            <h3 className="text-sm font-medium text-[#C0CAF5]">{title}</h3>
          </div>
        )}
        
        <ScrollArea className="flex-1">
          <div className="p-4">
            <pre 
              className="text-xs font-mono text-[#C0CAF5] whitespace-pre-wrap break-words leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: highlightGCode(content) 
              }}
            />
          </div>
        </ScrollArea>
        
        {content && (
          <div className="px-4 py-2 border-t border-[#414868] bg-[#1A1B26]/50">
            <div className="flex justify-between items-center text-xs text-[#565F89]">
              <span>{content.split('\n').length} linhas</span>
              <span>{(content.length / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});

export { CodePreview };
