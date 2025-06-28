'use client';

import { useState, useEffect, useCallback } from 'react';
import { TapFile, ProjectConfig } from '@/lib/types';
import { TapProcessor, ScaleConfig } from '@/lib/tap-processor';
import { DEFAULT_CONFIG } from '@/lib/default-config';
import { ScaleModal } from '@/components/scale-modal';
import { FileUpload } from '@/components/file-upload';
import { ConfigurationEditor } from '@/components/configuration-editor';
import { CodeComparison } from '@/components/code-comparison';
import { HeaderStats } from '@/components/header-stats';
import { HeaderActions } from '@/components/header-actions';
import { Settings2, FileText, BarChart3, Upload, Settings, ChevronDown, Ruler } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { getMaterials, getMaterialById, MaterialConfig, DEFAULT_MATERIAL } from '@/lib/materials';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function HomePage() {
  const [files, setFiles] = useState<TapFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>();
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_CONFIG);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [materials, setMaterials] = useState<MaterialConfig[]>(getMaterials());
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(DEFAULT_MATERIAL.id);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [currentScaleConfig, setCurrentScaleConfig] = useState<ScaleConfig | undefined>();
  const [pendingFiles, setPendingFiles] = useState<TapFile[]>([]);

  // Get selected file
  const selectedFile = files.find(f => f.id === selectedFileId);

  // Load configuration from localStorage on mount
  useEffect(() => {
    // Sempre usar configuração padrão com placeholders dinâmicos
    setConfig(DEFAULT_CONFIG);
    
    // Limpar configuração antiga que pode estar causando problemas
    try {
      const savedConfig = localStorage.getItem('tap-processor-config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        
        // Verificar se o template tem os placeholders necessários
        const hasRequiredPlaceholders = 
          parsedConfig.header?.includes('{MATERIAL}') && 
          parsedConfig.header?.includes('{FEED_RATE}');
        
        if (!hasRequiredPlaceholders) {
          // Limpar configuração antiga que não tem placeholders
          localStorage.removeItem('tap-processor-config');
          console.log('Configuração antiga removida - usando template dinâmico');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar configuração:', error);
      localStorage.removeItem('tap-processor-config');
    }
  }, []);

  // Auto-select first file when files change
  useEffect(() => {
    if (files.length > 0 && !selectedFileId) {
      setSelectedFileId(files[0].id);
    } else if (files.length === 0) {
      setSelectedFileId(undefined);
    } else if (selectedFileId && !files.find(f => f.id === selectedFileId)) {
      setSelectedFileId(files[0]?.id);
    }
  }, [files, selectedFileId]);

  // Atualiza lista de materiais ao abrir e ao detectar mudanças no localStorage
  useEffect(() => {
    const updateMaterials = () => setMaterials(getMaterials());
    window.addEventListener('storage', updateMaterials);
    updateMaterials();
    return () => window.removeEventListener('storage', updateMaterials);
  }, []);

  // Material selecionado
  const selectedMaterial = getMaterialById(selectedMaterialId);

  const handleFilesLoaded = useCallback((newFiles: TapFile[]) => {
    setFiles(newFiles);
  }, []);

  const handleFileSelect = useCallback((fileId: string) => {
    setSelectedFileId(fileId);
  }, []);

  const handleConfigChange = useCallback((newConfig: ProjectConfig) => {
    setConfig(newConfig);
  }, []);

  const processFilesWithScale = useCallback(async (scaleConfig: ScaleConfig) => {
    setIsProcessing(true);
    let processedCount = 0;
    let errorCount = 0;
    
    // Store scale config for future use
    setCurrentScaleConfig(scaleConfig);

    for (const file of pendingFiles) {
      try {
        // Update file status to processing
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'processing' } : f
        ));

        // Process file with scale configuration
        const result = TapProcessor.processFile(file.content, config, file.name, selectedMaterial, scaleConfig);
        
        // Update file with results
        setFiles(prev => prev.map(f => 
          f.id === file.id ? {
            ...f,
            status: 'completed',
            processedContent: result.processedContent,
            processedFilename: result.filename,
            statistics: result.statistics,
          } : f
        ));

        processedCount++;
        
        // Small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Erro ao processar ${file.name}:`, error);
        
        setFiles(prev => prev.map(f => 
          f.id === file.id ? {
            ...f,
            status: 'error',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          } : f
        ));

        errorCount++;
      }
    }

    setIsProcessing(false);

    // Show results
    if (processedCount > 0) {
      toast.success(`${processedCount} arquivo${processedCount > 1 ? 's processados' : ' processado'} com sucesso!`);
    }
    
    if (errorCount > 0) {
      toast.error(`${errorCount} arquivo${errorCount > 1 ? 's com erro' : ' com erro'}`);
    }
  }, [pendingFiles, config, selectedMaterial]);

  const processAllFiles = useCallback(async () => {
    const filesToProcess = files.filter(f => f.status === 'pending');
    
    if (filesToProcess.length === 0) {
      toast.info('Nenhum arquivo pendente para processar');
      return;
    }

    // Process directly without scale (default behavior)
    const defaultScaleConfig: ScaleConfig = {
      currentLength: 0,
      desiredLength: 0,
      scaleFactor: 1,
      applyScale: false
    };
    
    setPendingFiles(filesToProcess);
    processFilesWithScale(defaultScaleConfig);
  }, [files, processFilesWithScale]);

  // Scale modal handlers
  const openScaleModal = useCallback(() => {
    const filesToProcess = files.filter(f => f.status === 'pending');
    
    if (filesToProcess.length === 0) {
      toast.info('Nenhum arquivo pendente para processar com escala');
      return;
    }

    setPendingFiles(filesToProcess);
    setShowScaleModal(true);
  }, [files]);

  const handleScaleApply = useCallback((scaleConfig: ScaleConfig) => {
    processFilesWithScale(scaleConfig);
  }, [processFilesWithScale]);

  const handleScaleClose = useCallback(() => {
    setShowScaleModal(false);
    setPendingFiles([]);
  }, []);

  const clearAllFiles = useCallback(() => {
    setFiles([]);
    setSelectedFileId(undefined);
    toast.info('Lista de arquivos limpa');
  }, []);

  // Handle content update from editor
  const handleContentUpdate = (newContent: string) => {
    if (!selectedFile) return;

    const updatedFiles = files.map(f => 
      f.id === selectedFile.id 
        ? { 
            ...f, 
            processedContent: newContent,
            status: 'completed' as const // Garantir que mantém o status de processado
          }
        : f
    );

    setFiles(updatedFiles);
  };

  return (
    <div className="min-h-screen bg-[#1A1B26]">
      <Toaster 
        theme="dark" 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#24283B',
            border: '1px solid #414868',
            color: '#C0CAF5',
          },
        }}
      />
      
      {/* Compact Fixed Header */}
      <header className="border-b border-gray-800 bg-[#1A1B26] backdrop-blur-md fixed top-0 left-0 right-0 z-50 shadow-lg">
        <div className="max-w-full mx-auto px-4 py-3">
          {/* Top Row - Title and Main Actions */}
          <div className="flex items-end-between mb-3">
            <div className="flex items-center">
              <Settings2 className="w-6 h-6 mr-3 text-[#7AA2F7]" />
              <div>
                <h1 className="text-lg font-bold text-white">
                  Processador TAP
                </h1>
                <p className="text-[#A9B1D6] text-xs">
                  Otimização automática D = max(|ΔX|, |ΔY|)
                </p>
              </div>
              {/* Seletor de material */}
              <div className="ml-6">
                <Select
                  value={selectedMaterialId}
                  onValueChange={setSelectedMaterialId}
                >
                  <SelectTrigger className="w-[180px] bg-[#24283B] border-[#414868] text-[#C0CAF5]">
                    <SelectValue placeholder="Selecionar material" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#24283B] border-[#414868]">
                    {materials.map(mat => (
                      <SelectItem 
                        key={mat.id} 
                        value={mat.id}
                        className="text-[#C0CAF5] hover:bg-[#414868] focus:bg-[#414868]"
                      >
                        <span style={{ color: mat.cor || '#C0CAF5' }}>
                          {mat.nome}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Quick Actions - AGORA ALINHADO À DIREITA */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Upload Button */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="border-[#7AA2F7] text-[#7AA2F7]">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                    {files.length > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-[#7AA2F7] text-white">
                        {files.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-[#24283B] border-[#414868]">
                  <FileUpload 
                    files={files}
                    onFilesLoaded={handleFilesLoaded}
                    selectedFileId={selectedFileId}
                    onFileSelect={handleFileSelect}
                  />
                </PopoverContent>
              </Popover>

              {/* Scale Button */}
              <Button 
                onClick={openScaleModal}
                variant="outline" 
                size="sm" 
                className="border-[#F7768E] text-[#F7768E] hover:bg-[#F7768E] hover:text-white"
                disabled={files.filter(f => f.status === 'pending').length === 0}
              >
                <Ruler className="w-4 h-4 mr-2" />
                📐 Escala
              </Button>

              {/* Config Button */}
              <Popover open={showConfig} onOpenChange={setShowConfig}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="border-[#E0AF68] text-[#E0AF68]">
                    <Settings className="w-4 h-4 mr-2" />
                    Config
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 bg-[#24283B] border-[#414868]">
                  <ConfigurationEditor 
                    config={config}
                    onConfigChange={handleConfigChange}
                    selectedMaterial={selectedMaterial}
                  />
                </PopoverContent>
              </Popover>

              {/* Process Actions */}
              <HeaderActions
                files={files}
                selectedFile={selectedFile}
                onProcessAll={processAllFiles}
                onClearAll={clearAllFiles}
                onFilesUpdate={setFiles}
                onEditModeChange={setIsEditMode}
                isProcessing={isProcessing}
              />
            </div>
          </div>
          
          {/* Bottom Row - Statistics */}
          {selectedFile?.statistics && (
            <div className="border-t border-gray-800 pt-3">
              <HeaderStats statistics={selectedFile.statistics} />
            </div>
          )}
        </div>
      </header>

      {/* Full-Width Code Comparison */}
      <main className="pt-32 px-4 py-2 min-h-screen">
        {selectedFile ? (
          <div className="h-[calc(100vh-140px)]">
            <CodeComparison
              originalContent={selectedFile.content}
              processedContent={selectedFile.processedContent || ''}
              originalFilename={selectedFile.name}
              processedFilename={selectedFile.processedFilename || ''}
              isEditMode={isEditMode}
              onContentUpdate={handleContentUpdate}
              selectedMaterial={selectedMaterial}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 text-[#565F89] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#A9B1D6] mb-2">
                Nenhum arquivo selecionado
              </h3>
              <p className="text-[#565F89] mb-4">
                Faça upload de arquivos .tap para começar o processamento
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="bg-[#7AA2F7] hover:bg-[#7AA2F7]/80 text-white">
                    <Upload className="w-4 h-4 mr-2" />
                    Carregar Arquivos
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-[#24283B] border-[#414868]">
                  <FileUpload 
                    files={files}
                    onFilesLoaded={handleFilesLoaded}
                    selectedFileId={selectedFileId}
                    onFileSelect={handleFileSelect}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </main>

      {/* Scale Modal */}
      <ScaleModal
        isOpen={showScaleModal}
        onClose={handleScaleClose}
        onApply={handleScaleApply}
        currentScale={currentScaleConfig}
      />
    </div>
  );
}
