'use client';

import { useState } from 'react';
import { ProjectConfig } from '@/lib/types';
import { MaterialConfig } from '@/lib/materials';
import { DEFAULT_CONFIG, FACTORY_CONFIG } from '@/lib/default-config';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';

interface ConfigurationEditorProps {
  config: ProjectConfig;
  onConfigChange: (config: ProjectConfig) => void;
  selectedMaterial: MaterialConfig;
}

export function ConfigurationEditor({ config, onConfigChange, selectedMaterial }: ConfigurationEditorProps) {
  const [tempConfig, setTempConfig] = useState<ProjectConfig>(config);

  const handleSave = () => {
    onConfigChange(tempConfig);
    
    // Save to localStorage
    try {
      localStorage.setItem('tap-processor-config', JSON.stringify(tempConfig));
      toast.success('Configurações salvas!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
      console.error('Erro ao salvar configurações:', error);
    }
  };

  const handleReset = () => {
    setTempConfig(FACTORY_CONFIG);
    onConfigChange(FACTORY_CONFIG);
    
    try {
      localStorage.setItem('tap-processor-config', JSON.stringify(FACTORY_CONFIG));
      toast.info('Configurações restauradas para o padrão');
    } catch (error) {
      toast.error('Erro ao restaurar configurações');
      console.error('Erro ao restaurar configurações:', error);
    }
  };

  return (
    <Card className="p-4 bg-[#24283B] border-[#414868]">
      <Accordion type="single" collapsible defaultValue="config">
        <AccordionItem value="config" className="border-[#414868]">
          <AccordionTrigger className="text-white hover:text-[#7AA2F7]">
            <div className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-[#7AA2F7]" />
              Configurações de Template
            </div>
          </AccordionTrigger>
          
          <AccordionContent className="space-y-4 pt-4">
            {/* Header Configuration */}
            <div className="space-y-2">
              <Label htmlFor="header" className="text-[#C0CAF5] text-sm font-medium">
                Cabeçalho
              </Label>
              <Textarea
                id="header"
                value={tempConfig.header}
                onChange={(e) => setTempConfig(prev => ({ ...prev, header: e.target.value }))}
                className="min-h-32 bg-[#1A1B26] border-[#414868] text-[#C0CAF5] text-xs font-mono resize-y"
                placeholder="Template do cabeçalho..."
              />
              <div className="text-xs text-[#A9B1D6] space-y-1">
                <p><strong>Variáveis disponíveis:</strong></p>
                <p>• <code className="bg-[#1A1B26] px-1 rounded">{'{FILENAME}'}</code> - Nome do arquivo sem extensão</p>
                <p>• <code className="bg-[#1A1B26] px-1 rounded">{'{DATE}'}</code> - Data e hora atual</p>
                <p>• <code className="bg-[#1A1B26] px-1 rounded">{'{MATERIAL}'}</code> - <span style={{ color: selectedMaterial.cor }}>{selectedMaterial.nome}</span></p>
                <p>• <code className="bg-[#1A1B26] px-1 rounded">{'{FEED_RATE}'}</code> - {selectedMaterial.feedRate} mm/min</p>
              </div>
            </div>

            {/* Footer Configuration */}
            <div className="space-y-2">
              <Label htmlFor="footer" className="text-[#C0CAF5] text-sm font-medium">
                Rodapé
              </Label>
              <Textarea
                id="footer"
                value={tempConfig.footer}
                onChange={(e) => setTempConfig(prev => ({ ...prev, footer: e.target.value }))}
                className="min-h-40 bg-[#1A1B26] border-[#414868] text-[#C0CAF5] text-xs font-mono resize-y"
                placeholder="Template do rodapé..."
              />
              <div className="text-xs text-[#A9B1D6] space-y-1">
                <p><strong>Variáveis disponíveis:</strong></p>
                <p>• <code className="bg-[#1A1B26] px-1 rounded">{'{TOTAL_DISTANCE}'}</code> - Distância total em mm</p>
                <p>• <code className="bg-[#1A1B26] px-1 rounded">{'{ESTIMATED_TIME}'}</code> - Tempo estimado em min</p>
                <p>• <code className="bg-[#1A1B26] px-1 rounded">{'{TOTAL_PAUSES}'}</code> - Total de pausas</p>
                <p>• <code className="bg-[#1A1B26] px-1 rounded">{'{SHORT_PAUSES}'}</code> - Pausas curtas (P{selectedMaterial.pausas.short.tempo.toFixed(1)})</p>
                <p>• <code className="bg-[#1A1B26] px-1 rounded">{'{MEDIUM_PAUSES}'}</code> - Pausas médias (P{selectedMaterial.pausas.medium.tempo.toFixed(1)})</p>
                <p>• <code className="bg-[#1A1B26] px-1 rounded">{'{LONG_PAUSES}'}</code> - Pausas longas (P{selectedMaterial.pausas.long.tempo.toFixed(1)})</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4 border-t border-[#414868]">
              <Button
                onClick={handleSave}
                className="flex-1 bg-[#7AA2F7] hover:bg-[#7AA2F7]/80 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1 border-[#E0AF68] text-[#E0AF68] hover:bg-[#E0AF68] hover:text-[#1A1B26]"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurar
              </Button>
            </div>

            {/* Algorithm Info - Dinâmico baseado no material */}
            <div className="mt-4 p-3 bg-[#1A1B26] rounded-lg border border-[#414868]">
              <h4 className="text-sm font-medium text-[#9ECE6A] mb-2">Algoritmo de Processamento:</h4>
              <div className="text-xs text-[#A9B1D6] space-y-1">
                <p>• <strong>Distância:</strong> D = max(|ΔX|, |ΔY|)</p>
                <p>• <strong>D &lt; {selectedMaterial.pausas.short.maxDist}mm:</strong> G04 P{selectedMaterial.pausas.short.tempo.toFixed(1)} (sempre insere, mantém acumulador)</p>
                <p>• <strong>{selectedMaterial.pausas.short.maxDist} ≤ D &lt; {selectedMaterial.pausas.medium.maxDist}mm:</strong> G04 P{selectedMaterial.pausas.medium.tempo.toFixed(1)} (zera acumulador)</p>
                <p>• <strong>D ≥ {selectedMaterial.pausas.long.minDist}mm:</strong> G04 P{selectedMaterial.pausas.long.tempo.toFixed(1)} (zera acumulador)</p>
                <p>• <strong>Remove:</strong> Comandos G00 e G04 existentes</p>
                <p>• <strong>Tempo:</strong> Baseado em {selectedMaterial.feedRate * 0.5} mm/min (50% do feed rate)</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
