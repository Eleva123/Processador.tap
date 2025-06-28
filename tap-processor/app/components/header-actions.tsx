'use client';

import { TapFile } from '@/lib/types';
import { Download, Copy, PlayCircle, Trash2, Edit3, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MaterialsManager } from './materials-manager';
import { useState } from 'react';
import JSZip from 'jszip';

interface HeaderActionsProps {
  files: TapFile[];
  selectedFile?: TapFile;
  onProcessAll: () => void;
  onClearAll: () => void;
  onFilesUpdate?: (files: TapFile[]) => void;
  onEditModeChange?: (isEditing: boolean) => void;
  isProcessing: boolean;
}

export function HeaderActions({ 
  files, 
  selectedFile, 
  onProcessAll, 
  onClearAll,
  onFilesUpdate,
  onEditModeChange,
  isProcessing 
}: HeaderActionsProps) {
  
  const [showMaterials, setShowMaterials] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Código copiado para a área de transferência!');
    } catch (err) {
      toast.error('Erro ao copiar código');
    }
  };

  const downloadCompletedFiles = () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.processedContent);
    
    if (completedFiles.length === 0) {
      toast.error('Nenhum arquivo processado para download');
      return;
    }

    completedFiles.forEach(file => {
      if (file.processedContent && file.processedFilename) {
        downloadFile(file.processedContent, file.processedFilename);
      }
    });
    
    toast.success(`${completedFiles.length} arquivo${completedFiles.length > 1 ? 's baixados' : ' baixado'}!`);
  };

  const downloadAsZip = async () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.processedContent);
    
    if (completedFiles.length === 0) {
      toast.error('Nenhum arquivo processado para download');
      return;
    }

    try {
      const zip = new JSZip();
      
      // Adicionar cada arquivo ao ZIP com seu nome formatado
      completedFiles.forEach(file => {
        if (file.processedContent && file.processedFilename) {
          zip.file(file.processedFilename, file.processedContent);
        }
      });

      // Gerar o ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Criar nome do ZIP com data e hora
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const hour = String(now.getHours()).padStart(2, '0');
      const minute = String(now.getMinutes()).padStart(2, '0');
      
      const zipFilename = `TAP_Processados_${day}_${month}_${year}_${hour}h${minute}m.zip`;
      
      // Download do ZIP
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`📦 ZIP baixado com ${completedFiles.length} arquivos processados!`);
    } catch (error) {
      console.error('Erro ao criar ZIP:', error);
      toast.error('Erro ao criar arquivo ZIP');
    }
  };

  // Função: Limpar apenas arquivos processados
  const clearProcessedFiles = () => {
    const processedCount = files.filter(f => f.status === 'completed').length;
    
    if (processedCount === 0) {
      toast.info('Nenhum arquivo processado para limpar');
      return;
    }

    // Limpar apenas o conteúdo processado, mantendo os arquivos na lista
    const updatedFiles = files.map(f => 
      f.status === 'completed' 
        ? { 
            ...f, 
            status: 'pending' as const,
            processedContent: undefined,
            processedFilename: undefined,
            statistics: undefined,
            error: undefined
          }
        : f
    );
    
    if (onFilesUpdate) {
      onFilesUpdate(updatedFiles);
    }
    
    toast.success(`${processedCount} arquivo${processedCount > 1 ? 's processados limpos' : ' processado limpo'} - mantidos na lista para reprocessamento`);
  };

  // Função: Alternar modo de edição inline
  const toggleEditMode = () => {
    const newEditState = !isEditing;
    setIsEditing(newEditState);
    
    if (onEditModeChange) {
      onEditModeChange(newEditState);
    }
    
    if (newEditState) {
      toast.info('Modo de edição ativado - edite diretamente no painel processado');
    } else {
      toast.info('Modo de edição desativado');
    }
  };

  const hasPendingFiles = files.some(f => f.status === 'pending');
  const hasCompletedFiles = files.some(f => f.status === 'completed');
  const completedFilesCount = files.filter(f => f.status === 'completed').length;
  const selectedFileIsCompleted = selectedFile?.status === 'completed';

  return (
    <div className="flex items-center gap-2">
      {/* Process All Button */}
      <Button
        onClick={onProcessAll}
        disabled={!hasPendingFiles || isProcessing}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isProcessing ? (
          <div className="flex items-center">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>
            Processando...
          </div>
        ) : (
          <div className="flex items-center">
            <PlayCircle className="w-3 h-3 mr-1.5" />
            Processar ({files.filter(f => f.status === 'pending').length})
          </div>
        )}
      </Button>

      {/* Download All Completed */}
      {hasCompletedFiles && (
        <>
          {completedFilesCount > 1 ? (
            <Button
              onClick={downloadAsZip}
              size="sm"
              variant="outline"
              className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
            >
              <Archive className="w-3 h-3 mr-1.5" />
              📦 ZIP ({completedFilesCount})
            </Button>
          ) : (
            <Button
              onClick={downloadCompletedFiles}
              size="sm"
              variant="outline"
              className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
            >
              <Download className="w-3 h-3 mr-1.5" />
              Baixar ({completedFilesCount})
            </Button>
          )}
        </>
      )}

      {/* Selected File Actions */}
      {selectedFileIsCompleted && selectedFile?.processedContent && (
        <>
          <Button
            onClick={() => copyToClipboard(selectedFile.processedContent!)}
            size="sm"
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Copy className="w-3 h-3 mr-1.5" />
            Copiar
          </Button>
          
          <Button
            onClick={() => downloadFile(
              selectedFile.processedContent!, 
              selectedFile.processedFilename!
            )}
            size="sm"
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
          >
            <Download className="w-3 h-3 mr-1.5" />
            Baixar
          </Button>

          {/* Botão: Editar Inline */}
          <Button
            onClick={toggleEditMode}
            size="sm"
            variant="outline"
            className={`${
              isEditing 
                ? 'border-green-600 text-green-400 hover:bg-green-600' 
                : 'border-yellow-600 text-yellow-400 hover:bg-yellow-600'
            } hover:text-white`}
          >
            <Edit3 className="w-3 h-3 mr-1.5" />
            {isEditing ? 'Finalizar Edição' : 'Editar'}
          </Button>
        </>
      )}

      {/* Clear All */}
      {files.length > 0 && (
        <Button
          onClick={onClearAll}
          size="sm"
          variant="outline"
          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
        >
          <Trash2 className="w-3 h-3 mr-1.5" />
          Limpar
        </Button>
      )}

      {/* Limpar apenas Processados */}
      {hasCompletedFiles && (
        <Button
          onClick={clearProcessedFiles}
          size="sm"
          variant="outline"
          className="border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white"
        >
          <Trash2 className="w-3 h-3 mr-1.5" />
          Limpar Processados
        </Button>
      )}

      <Button variant="outline" onClick={() => setShowMaterials(true)}>
        Materiais
      </Button>

      {showMaterials && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex justify-center items-start p-4">
          <div className="max-h-[90vh] overflow-y-auto mt-32">
            <MaterialsManager onClose={() => setShowMaterials(false)} />
          </div>
        </div>
      )}
    </div>
  );
} 