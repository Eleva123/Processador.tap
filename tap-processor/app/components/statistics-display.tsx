
'use client';

import { ProcessingStatistics } from '@/lib/types';
import { BarChart3, Clock, Zap, Trash2, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatisticsDisplayProps {
  statistics?: ProcessingStatistics;
}

export function StatisticsDisplay({ statistics }: StatisticsDisplayProps) {
  if (!statistics) {
    return (
      <Card className="p-4 bg-gray-800 border-gray-700">
        <div className="flex items-center mb-3">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Estatísticas</h3>
        </div>
        <p className="text-gray-400 text-center py-8">
          Carregue um arquivo para ver as estatísticas
        </p>
      </Card>
    );
  }

  const formatTime = (timeInMinutes: number): string => {
    if (timeInMinutes < 1) {
      return `${(timeInMinutes * 60).toFixed(0)}s`;
    } else if (timeInMinutes < 60) {
      return `${timeInMinutes.toFixed(1)}min`;
    } else {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = Math.floor(timeInMinutes % 60);
      return `${hours}h ${minutes}min`;
    }
  };

  return (
    <Card className="p-4 bg-gray-800 border-gray-700">
      <div className="space-y-4">
        <div className="flex items-center mb-3">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Estatísticas</h3>
        </div>

        {/* Main Statistics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Distance */}
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Distância Total</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {statistics.totalDistance.toFixed(2)} mm
            </div>
          </div>

          {/* Estimated Time */}
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Tempo Estimado</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {formatTime(statistics.estimatedTimeMinutes)}
            </div>
            <div className="text-xs text-gray-500">
              @ 300 mm/min
            </div>
          </div>
        </div>

        {/* Pauses Statistics */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300 flex items-center">
            <Zap className="w-4 h-4 mr-1 text-yellow-400" />
            Pausas Térmicas
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Curtas (P0.0):</span>
              <span className="text-yellow-400 font-medium">
                {statistics.pausesInserted.short}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Médias (P0.3):</span>
              <span className="text-blue-400 font-medium">
                {statistics.pausesInserted.medium}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Longas (P0.5):</span>
              <span className="text-purple-400 font-medium">
                {statistics.pausesInserted.long}
              </span>
            </div>
            
            <div className="border-t border-gray-600 pt-2 mt-2">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-white">Total:</span>
                <span className="text-green-400">
                  {statistics.pausesInserted.total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Removed Commands */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300 flex items-center">
            <Trash2 className="w-4 h-4 mr-1 text-red-400" />
            Comandos Removidos
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">G00 (movimentos rápidos):</span>
              <span className="text-red-400 font-medium">
                {statistics.removedCommands.g00}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">G04 (pausas antigas):</span>
              <span className="text-red-400 font-medium">
                {statistics.removedCommands.g04}
              </span>
            </div>
            
            <div className="border-t border-gray-600 pt-2 mt-2">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-white">Total Removidos:</span>
                <span className="text-red-400">
                  {statistics.removedCommands.total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Info */}
        <div className="pt-3 border-t border-gray-600">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Comandos G01:</span>
              <span className="text-gray-400">{statistics.totalCommands}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Tempo de processamento:</span>
              <span className="text-gray-400">
                {statistics.processingTime.toFixed(0)}ms
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
