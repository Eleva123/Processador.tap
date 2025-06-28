
'use client';

import { TapFile } from '@/lib/types';
import { Download, Copy, PlayCircle, Trash2, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import JSZip from 'jszip';

interface ActionButtonsProps {
  files: TapFile[];
  selectedFile?: TapFile;
  onProcessAll: () => void;
  onClearAll: () => void;
  isProcessing: boolean;
}

export function ActionButtons({ 
  files, 
  selectedFile, 
  onProcessAll, 
  onClearAll,
  isProcessing 
}: ActionButtonsProps) {
  
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

  const hasPendingFiles = files.some(f => f.status === 'pending');
  const hasCompletedFiles = files.some(f => f.status === 'completed');
  const completedFilesCount = files.filter(f => f.status === 'completed').length;
  const selectedFileIsCompleted = selectedFile?.status === 'completed';

  return (
    <Card className="p-4 bg-gray-800 border-gray-700">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <PlayCircle className="w-5 h-5 mr-2 text-blue-400" />
          Ações
        </h3>

        {/* Global Actions */}
        <div className="space-y-3">
          <Button
            onClick={onProcessAll}
            disabled={!hasPendingFiles || isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processando...
              </div>
            ) : (
              <div className="flex items-center">
                <PlayCircle className="w-4 h-4 mr-2" />
                Processar Todos ({files.filter(f => f.status === 'pending').length})
              </div>
            )}
          </Button>

          {hasCompletedFiles && (
            <>
              {completedFilesCount > 1 ? (
                <Button
                  onClick={downloadAsZip}
                  variant="outline"
                  className="w-full border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  📦 Baixar ZIP ({completedFilesCount} arquivos)
                </Button>
              ) : (
                <Button
                  onClick={downloadCompletedFiles}
                  variant="outline"
                  className="w-full border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Arquivo ({completedFilesCount})
                </Button>
              )}
            </>
          )}

          {files.length > 0 && (
            <Button
              onClick={onClearAll}
              variant="outline"
              className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Lista
            </Button>
          )}
        </div>

        {/* Selected File Actions */}
        {selectedFile && (
          <>
            <div className="border-t border-gray-600 pt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Arquivo Selecionado: {selectedFile.name}
              </h4>
              
              <div className="space-y-2">
                {selectedFileIsCompleted && selectedFile.processedContent && (
                  <>
                    <Button
                      onClick={() => copyToClipboard(selectedFile.processedContent!)}
                      variant="outline"
                      size="sm"
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Código Processado
                    </Button>
                    
                    <Button
                      onClick={() => downloadFile(
                        selectedFile.processedContent!, 
                        selectedFile.processedFilename!
                      )}
                      variant="outline"
                      size="sm"
                      className="w-full border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Este Arquivo
                    </Button>
                  </>
                )}
                
                {selectedFile.status === 'pending' && (
                  <div className="text-center py-2">
                    <span className="text-sm text-yellow-400">
                      Arquivo aguardando processamento
                    </span>
                  </div>
                )}
                
                {selectedFile.status === 'error' && (
                  <div className="text-center py-2">
                    <span className="text-sm text-red-400">
                      Erro no processamento
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Status Summary */}
        {files.length > 0 && (
          <div className="border-t border-gray-600 pt-4">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Total de arquivos:</span>
                <span>{files.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Pendentes:</span>
                <span className="text-yellow-400">
                  {files.filter(f => f.status === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Concluídos:</span>
                <span className="text-green-400">
                  {files.filter(f => f.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Com erro:</span>
                <span className="text-red-400">
                  {files.filter(f => f.status === 'error').length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
