export interface TapFile {
  id: string;
  name: string;
  content: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  processedContent?: string;
  processedFilename?: string;
  statistics?: ProcessingStatistics;
  error?: string;
}

export interface G01Command {
  line: number;
  x?: number;
  y?: number;
  z?: number;
  originalLine: string;
}

export interface ProcessedResult {
  originalContent: string;
  processedContent: string;
  statistics: ProcessingStatistics;
  filename: string;
}

export interface ProcessingStatistics {
  totalDistance: number;
  estimatedTimeMinutes: number;
  totalCommands: number;
  pausesInserted: {
    short: number; // < 5mm, G04 P0.0
    medium: number; // 5-50mm, G04 P0.3
    long: number; // >= 50mm, G04 P0.5
    total: number;
  };
  removedCommands: {
    g00: number;
    g04: number;
    total: number;
  };
  processingTime: number;
  pauseSeconds: number; // tempo total de pausas em segundos
  estimatedTotalTime: number; // tempo total estimado (corte + pausas) em segundos
  isReprocessedFile?: boolean; // indica se o arquivo já estava processado
}

export interface ProjectConfig {
  header: string;
  footer: string;
}

export interface Distance {
  value: number;
  from: G01Command;
  to: G01Command;
}

export interface AccumulatorState {
  shortAccumulator: number;
  mediumAccumulator: number;
  longAccumulator: number;
}
