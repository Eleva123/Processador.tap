'use client';

import { ProcessingStatistics } from '@/lib/types';
import { BarChart3, Clock, Target, Zap } from 'lucide-react';

interface HeaderStatsProps {
  statistics: ProcessingStatistics;
}

export function HeaderStats({ statistics }: HeaderStatsProps) {
  const { totalDistance, estimatedTimeMinutes, pausesInserted, pauseSeconds, estimatedTotalTime } = statistics;
  const min = Math.floor(estimatedTotalTime / 60);
  const sec = Math.round(estimatedTotalTime % 60);
  return (
    <div className="flex flex-wrap gap-4 text-xs text-[#C0CAF5]">
      <div>
        <span className="font-bold">Distância:</span> {totalDistance.toFixed(2)} mm
      </div>
      <div>
        <span className="font-bold">Tempo corte:</span> {estimatedTimeMinutes.toFixed(1)} min
      </div>
      <div>
        <span className="font-bold">Tempo pausas:</span> {pauseSeconds.toFixed(1)} s
      </div>
      <div>
        <span className="font-bold">Tempo total:</span> {min} min {sec} s
      </div>
      <div>
        <span className="font-bold">Pausas:</span> <span className="text-[#FFD600]">{pausesInserted.short} P0.0</span> / <span className="text-[#39FF14]">{pausesInserted.medium} P0.3</span> / <span className="text-[#FF1744]">{pausesInserted.long} P0.5</span>
      </div>
    </div>
  );
} 