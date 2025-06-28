'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Ruler, Calculator, Info } from 'lucide-react';

export interface ScaleConfig {
  currentLength: number;
  desiredLength: number;
  scaleFactor: number;
  applyScale: boolean;
}

interface ScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (scaleConfig: ScaleConfig) => void;
  currentScale?: ScaleConfig;
}

export function ScaleModal({ isOpen, onClose, onApply, currentScale }: ScaleModalProps) {
  const [currentLength, setCurrentLength] = useState('');
  const [desiredLength, setDesiredLength] = useState('');
  const [scaleFactor, setScaleFactor] = useState(1);

  // Calcular fator automaticamente
  useEffect(() => {
    const current = parseFloat(currentLength);
    const desired = parseFloat(desiredLength);
    
    if (current > 0 && desired > 0) {
      const factor = desired / current;
      setScaleFactor(factor);
    } else {
      setScaleFactor(1);
    }
  }, [currentLength, desiredLength]);

  // Carregar valores existentes se houver
  useEffect(() => {
    if (currentScale && currentScale.applyScale) {
      setCurrentLength(currentScale.currentLength.toString());
      setDesiredLength(currentScale.desiredLength.toString());
    }
  }, [currentScale]);

  const handleApply = () => {
    const current = parseFloat(currentLength);
    const desired = parseFloat(desiredLength);
    
    const scaleConfig: ScaleConfig = {
      currentLength: current || 0,
      desiredLength: desired || 0,
      scaleFactor,
      applyScale: current > 0 && desired > 0
    };
    
    onApply(scaleConfig);
    onClose();
  };

  const handleSkip = () => {
    const scaleConfig: ScaleConfig = {
      currentLength: 0,
      desiredLength: 0,
      scaleFactor: 1,
      applyScale: false
    };
    
    onApply(scaleConfig);
    onClose();
  };

  const isValidScale = currentLength && desiredLength && parseFloat(currentLength) > 0 && parseFloat(desiredLength) > 0;
  const percentageChange = isValidScale ? ((scaleFactor - 1) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center text-white">
            <Ruler className="w-5 h-5 mr-2 text-blue-400" />
            📐 Escala Personalizada
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Ajuste o tamanho da peça antes do processamento (opcional)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Campo: Medida Atual */}
          <div className="space-y-2">
            <Label htmlFor="current" className="text-gray-200 flex items-center">
              <Info className="w-4 h-4 mr-1 text-yellow-400" />
              Comprimento atual da peça (mm):
            </Label>
            <Input
              id="current"
              type="number"
              placeholder="Ex: 982"
              value={currentLength}
              onChange={(e) => setCurrentLength(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          {/* Campo: Medida Desejada */}
          <div className="space-y-2">
            <Label htmlFor="desired" className="text-gray-200 flex items-center">
              <Info className="w-4 h-4 mr-1 text-green-400" />
              Comprimento desejado final (mm):
            </Label>
            <Input
              id="desired"
              type="number"
              placeholder="Ex: 986"
              value={desiredLength}
              onChange={(e) => setDesiredLength(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          {/* Cálculo Automático */}
          {isValidScale && (
            <Card className="p-4 bg-gray-800 border-gray-600">
              <div className="flex items-center mb-2">
                <Calculator className="w-4 h-4 mr-2 text-purple-400" />
                <span className="text-sm font-medium text-purple-400">Cálculo Automático:</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Fator de Escala:</span>
                  <span className="font-mono text-blue-400">{scaleFactor.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Variação:</span>
                  <span className={`font-mono ${percentageChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(3)}%
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Aviso */}
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
            <div className="flex items-start">
              <Info className="w-4 h-4 mr-2 text-blue-400 mt-0.5" />
              <div className="text-xs text-blue-300">
                <p className="font-medium mb-1">Como funciona:</p>
                <p>• Se ambos os campos forem preenchidos, a escala será aplicada a todas as coordenadas X e Y</p>
                <p>• Se deixar em branco, o arquivo será processado no tamanho original</p>
                <p>• A escala é aplicada ANTES do cálculo de pausas e estatísticas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Pular (Tamanho Original)
          </Button>
          
          {isValidScale ? (
            <Button
              onClick={handleApply}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Aplicar Escala {scaleFactor.toFixed(4)}
            </Button>
          ) : (
            <Button
              onClick={handleApply}
              disabled
              variant="outline"
              className="flex-1 border-gray-600 text-gray-500"
            >
              Preencha os campos
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 