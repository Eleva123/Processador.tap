'use client';

import { memo, useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { MaterialConfig, DEFAULT_MATERIAL } from '@/lib/materials';

interface CodeComparisonProps {
  originalContent: string;
  processedContent: string;
  originalFilename?: string;
  processedFilename?: string;
  className?: string;
  isEditMode?: boolean;
  onContentUpdate?: (newContent: string) => void;
  selectedMaterial?: MaterialConfig;
}

const CodeComparison = memo(function CodeComparison({
  originalContent,
  processedContent,
  originalFilename,
  processedFilename,
  className = '',
  isEditMode = false,
  onContentUpdate,
  selectedMaterial
}: CodeComparisonProps) {
  const originalScrollRef = useRef<HTMLDivElement>(null);
  const processedScrollRef = useRef<HTMLDivElement>(null);
  const [editContent, setEditContent] = useState(processedContent);

  // Sincronizar editContent quando processedContent mudar
  useEffect(() => {
    setEditContent(processedContent);
  }, [processedContent]);

  // Função para salvar edições
  const saveEdit = () => {
    if (onContentUpdate) {
      onContentUpdate(editContent);
      toast.success('Arquivo processado atualizado!');
    }
  };

  // Função para cancelar edições
  const cancelEdit = () => {
    setEditContent(processedContent);
    toast.info('Edições canceladas');
  };

  const highlightGCode = (code: string, isProcessed: boolean = false): string => {
    if (!code) return '';
    
    // Usar material selecionado ou padrão
    const material = selectedMaterial || DEFAULT_MATERIAL;
    
    // Valores dinâmicos das pausas do material atual
    const shortTime = material.pausas.short.tempo.toFixed(1);
    const mediumTime = material.pausas.medium.tempo.toFixed(1);
    const longTime = material.pausas.long.tempo.toFixed(1);
    
    return code
      .split('\n')
      .map((line, index) => {
        let highlightedLine = line.trim();
        
        // Regex para capturar qualquer G04 P{tempo}
        const g04Match = highlightedLine.match(/G04\s+P(\d+\.?\d*)/);
        
        if (g04Match) {
          const pauseValue = parseFloat(g04Match[1]).toFixed(1);
          
          // Destacar pausas G04 dinamicamente baseado no material
          if (pauseValue === shortTime) {
            // Pausa curta do material atual → Amarelo
            highlightedLine = `<span class="bg-[#FFD600]/30 text-[#FFD600] font-semibold">${highlightedLine}</span>`;
          } else if (pauseValue === mediumTime) {
            // Pausa média do material atual → Verde
            highlightedLine = `<span class="bg-[#39FF14]/30 text-[#39FF14] font-semibold">${highlightedLine}</span>`;
          } else if (pauseValue === longTime) {
            // Pausa longa do material atual → Vermelho
            highlightedLine = `<span class="bg-[#FF1744]/30 text-[#FF1744] font-semibold">${highlightedLine}</span>`;
          } else {
            // Outros tempos não definidos no material → Azul
            highlightedLine = `<span class="bg-[#00BFFF]/30 text-[#00BFFF] font-semibold">${highlightedLine}</span>`;
          }
        } else {
          // Comments
          highlightedLine = highlightedLine.replace(
            /(;.*$)/g, 
            '<span class="text-[#9ECE6A]">$1</span>'
          );
          // G e M
          highlightedLine = highlightedLine.replace(
            /\b([GM]\d+)\b/g, 
            '<span class="text-[#E0AF68] font-semibold">$1</span>'
          );
          // Coordenadas
          highlightedLine = highlightedLine.replace(
            /\b([XYZ])([-+]?\d*\.?\d+)/g, 
            '<span class="text-[#7DCFFF]">$1</span><span class="text-[#C0CAF5]">$2</span>'
          );
          // Parâmetros
          highlightedLine = highlightedLine.replace(
            /\b([FPS])([-+]?\d*\.?\d+)/g, 
            '<span class="text-[#BB9AF7]">$1</span><span class="text-[#C0CAF5]">$2</span>'
          );
        }
        // Line numbers
        const lineNumber = (index + 1).toString().padStart(4, ' ');
        return `<div class="flex hover:bg-gray-800/30 transition-colors">
          <span class="text-[#565F89] select-none mr-4 text-right w-12 flex-shrink-0 py-0.5">${lineNumber}</span>
          <span class="flex-1 py-0.5">${highlightedLine}</span>
        </div>`;
      })
      .join('\n');
  };

  const getPlaceholder = (isProcessed: boolean) => {
    if (isProcessed) {
      return !originalContent.trim() 
        ? "Selecione um arquivo para ver o código processado" 
        : "Clique em 'Processar Todos' para gerar o código otimizado";
    }
    return "Carregue arquivos .tap para visualizar o código original";
  };

  const renderCodePanel = (
    content: string, 
    title: string, 
    filename: string | undefined, 
    isProcessed: boolean,
    scrollRef: React.RefObject<HTMLDivElement>
  ) => {
    const showEditor = isProcessed && isEditMode && content.trim();
    
    return (
      <Card className="bg-[#24283B] border-[#414868] h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#414868] bg-[#1A1B26]/50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#C0CAF5] flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${isProcessed ? (isEditMode ? 'bg-yellow-400' : 'bg-green-400') : 'bg-blue-400'}`} />
              {title} {showEditor && '(Editando)'}
            </h3>
            {filename && (
              <span className="text-xs text-[#565F89] truncate ml-2 max-w-40">
                {filename}
              </span>
            )}
          </div>
          {/* Botões de ação do editor */}
          {showEditor && (
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={saveEdit} className="bg-[#7AA2F7] text-white">
                <Save className="w-3 h-3 mr-1" />
                Salvar
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit}>
                <X className="w-3 h-3 mr-1" />
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {!content.trim() ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-[#565F89] p-8">
                <p className="text-sm">{getPlaceholder(isProcessed)}</p>
              </div>
            </div>
          ) : showEditor ? (
            // Editor mode - textarea
            <div className="h-full p-4">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-full bg-[#1A1B26] border-[#414868] text-[#C0CAF5] font-mono text-xs resize-none"
                placeholder="Edite o código processado..."
              />
            </div>
          ) : (
            // View mode - syntax highlighted
            <div 
              ref={scrollRef}
              className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
            >
              <div className="p-4">
                <pre 
                  className="text-xs font-mono text-[#C0CAF5] whitespace-pre-wrap break-words leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightGCode(content, isProcessed) 
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {content.trim() && (
          <div className="px-4 py-2 border-t border-[#414868] bg-[#1A1B26]/30">
            <div className="flex justify-between items-center text-xs text-[#565F89]">
              <span>{(showEditor ? editContent : content).split('\n').length} linhas</span>
              <span>{((showEditor ? editContent : content).length / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className={`grid grid-cols-2 gap-4 h-full ${className}`}>
      {/* Original Code */}
      {renderCodePanel(
        originalContent,
        "Código Original", 
        originalFilename,
        false,
        originalScrollRef
      )}

      {/* Processed Code */}
      {renderCodePanel(
        processedContent,
        "Código Processado", 
        processedFilename,
        true,
        processedScrollRef
      )}
    </div>
  );
});

export { CodeComparison }; 