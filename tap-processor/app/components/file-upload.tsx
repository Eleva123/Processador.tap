'use client';

import { useState, useCallback, useRef } from 'react';
import { TapFile } from '@/lib/types';
import { Upload, FileText, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface FileUploadProps {
  files: TapFile[];
  onFilesLoaded: (files: TapFile[]) => void;
  selectedFileId?: string;
  onFileSelect: (fileId: string) => void;
}

export function FileUpload({ files, onFilesLoaded, selectedFileId, onFileSelect }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInput = useCallback(async (inputFiles: FileList | null) => {
    if (!inputFiles || inputFiles.length === 0) return;

    setIsLoading(true);
    const newFiles: TapFile[] = [];
    const validFiles = Array.from(inputFiles).filter(file => 
      file.name.toLowerCase().endsWith('.tap')
    );

    if (validFiles.length === 0) {
      toast.error('Nenhum arquivo .tap válido selecionado');
      setIsLoading(false);
      return;
    }

    if (validFiles.length !== inputFiles.length) {
      toast.warning(`${inputFiles.length - validFiles.length} arquivo(s) ignorado(s). Apenas arquivos .tap são aceitos.`);
    }

    try {
      // Process all files with Promise.all for better performance
      const filePromises = validFiles.map((file) => {
        return new Promise<TapFile>((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content) {
              const tapFile: TapFile = {
                id: `${Date.now()}-${Math.random()}-${file.name}`,
                name: file.name,
                content,
                size: file.size,
                status: 'pending',
              };
              resolve(tapFile);
            } else {
              reject(new Error(`Erro ao ler arquivo: ${file.name}`));
            }
          };
          
          reader.onerror = () => {
            reject(new Error(`Erro ao ler arquivo: ${file.name}`));
          };
          
          reader.readAsText(file);
        });
      });

      // Wait for all files to be processed
      const processedFiles = await Promise.all(filePromises);
      
      // Update files list
      onFilesLoaded([...files, ...processedFiles]);
      
      toast.success(`${processedFiles.length} arquivo(s) carregado(s) com sucesso!`);
      
    } catch (error) {
      console.error('Erro ao processar arquivos:', error);
      toast.error('Erro ao carregar alguns arquivos');
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [files, onFilesLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileInput(e.dataTransfer.files);
  }, [handleFileInput]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileInput(e.target.files);
  }, [handleFileInput]);

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    onFilesLoaded(updatedFiles);
    
    // Select another file if the removed one was selected
    if (selectedFileId === fileId && updatedFiles.length > 0) {
      onFileSelect(updatedFiles[0].id);
    }
    
    toast.info('Arquivo removido da lista');
  };

  const clearAllFiles = () => {
    onFilesLoaded([]);
    toast.info('Lista de arquivos limpa');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getStatusIcon = (status: TapFile['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: TapFile['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'processing':
        return 'Processando';
      case 'completed':
        return 'Concluído';
      case 'error':
        return 'Erro';
      default:
        return 'Pendente';
    }
  };

  return (
    <Card className="p-4 bg-gray-800 border-gray-700">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Upload className="w-5 h-5 mr-2 text-blue-400" />
          Upload de Arquivos
        </h3>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver
              ? 'border-blue-400 bg-blue-400/10'
              : 'border-gray-600 hover:border-gray-500'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={!isLoading ? handleDrop : undefined}
          onDragOver={!isLoading ? handleDragOver : undefined}
          onDragLeave={!isLoading ? handleDragLeave : undefined}
          onClick={!isLoading ? triggerFileInput : undefined}
        >
          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-gray-300">Carregando arquivos...</p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-300 mb-2">
                Arraste arquivos .tap aqui ou clique para selecionar
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileInput();
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Selecionar Arquivos
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const response = await fetch('/exemplo.tap');
                      if (response.ok) {
                        const content = await response.text();
                        const sampleFile: TapFile = {
                          id: `exemplo-${Date.now()}`,
                          name: 'EXEMPLO.tap',
                          content,
                          size: content.length,
                          status: 'pending',
                        };
                        onFilesLoaded([...files, sampleFile]);
                        toast.success('Arquivo EXEMPLO.tap carregado!');
                      } else {
                        toast.error('Erro ao carregar arquivo de exemplo');
                      }
                    } catch (error) {
                      console.error('Erro ao carregar exemplo:', error);
                      toast.error('Erro ao carregar arquivo de exemplo');
                    }
                  }}
                  className="text-xs text-gray-400 hover:text-gray-300"
                >
                  📄 Carregar Arquivo de Exemplo
                </Button>
              </div>
            </>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".tap"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isLoading}
            aria-label="Selecionar arquivos .tap"
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-300">
                Arquivos ({files.length})
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFiles}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                disabled={isLoading}
              >
                Limpar Lista
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedFileId === file.id
                      ? 'border-blue-400 bg-blue-400/10'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                  }`}
                  onClick={() => onFileSelect(file.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="text-sm text-gray-300 truncate">
                        {file.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(file.status)}
                        <span className="text-xs text-gray-400">
                          {getStatusText(file.status)}
                        </span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                        disabled={isLoading}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-1 text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                  
                  {file.error && (
                    <div className="mt-2 text-xs text-red-400">
                      {file.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
