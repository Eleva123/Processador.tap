import { G01Command, ProcessedResult, ProcessingStatistics, Distance, ProjectConfig, AccumulatorState } from './types';
import { MaterialConfig, DEFAULT_MATERIAL } from './materials';

export interface ScaleConfig {
  currentLength: number;
  desiredLength: number;
  scaleFactor: number;
  applyScale: boolean;
}

export class TapProcessor {
  static processFile(content: string, config: ProjectConfig, originalFilename: string, material: MaterialConfig = DEFAULT_MATERIAL, scaleConfig?: ScaleConfig): ProcessedResult {
    const startTime = performance.now();
    
    // Verificar se o arquivo já está processado
    const isAlreadyProcessed = this.isFileAlreadyProcessed(content);
    
    // First, detect and clean any previously processed content
    const cleanOriginalContent = this.detectAndCleanProcessedContent(content);
    
    // Clean the original content (remove G00 and G04 commands)
    const cleanedContent = this.cleanOriginalContent(cleanOriginalContent);
    
    // Se o arquivo já estava processado e não tem nenhuma modificação significativa
    // retornar o conteúdo original sem reprocessar
    if (isAlreadyProcessed) {
      return {
        originalContent: content,
        processedContent: content, // Retorna o mesmo conteúdo
        statistics: {
          totalDistance: 0,
          estimatedTimeMinutes: 0,
          totalCommands: 0,
          pausesInserted: { short: 0, medium: 0, long: 0, total: 0 },
          removedCommands: { g00: 0, g04: 0, total: 0 },
          processingTime: 0,
          pauseSeconds: 0,
          estimatedTotalTime: 0,
          isReprocessedFile: true // Indica que o arquivo já estava processado
        },
        filename: this.generateSanitizedFilename(originalFilename),
      };
    }
    
    // Apply scale to content if configured (BEFORE parsing and processing)
    let scaledContent = cleanedContent;
    if (scaleConfig && scaleConfig.applyScale) {
      scaledContent = this.applyScaleToContent(cleanedContent, scaleConfig.scaleFactor);
    }
    
    // Parse G01 commands from scaled content
    const g01Commands = this.parseG01Commands(scaledContent);
    
    // Calculate distances using max variation method
    const distances = this.calculateDistancesMaxVariation(g01Commands);
    
    // Process with accumulator logic
    const { pausePositions, accumulatorStats } = this.processWithAccumulator(distances, material);
    
    // Build processed content with pauses using scaled content
    const processedContent = this.buildProcessedContent(scaledContent, pausePositions, config, originalFilename, material, scaleConfig);
    
    // Calculate statistics
    const statistics = this.calculateStatistics(distances, pausePositions, content, cleanedContent, startTime, material);
    
    // Generate sanitized filename
    const filename = this.generateSanitizedFilename(originalFilename);

    return {
      originalContent: content,
      processedContent,
      statistics,
      filename,
    };
  }

  private static detectAndCleanProcessedContent(content: string): string {
    const lines = content.split('\n');
    const cleanedLines: string[] = [];
    
    let insideHeader = false;
    let insideFooter = false;
    let headerEndFound = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      const lowerLine = trimmedLine.toLowerCase();
      
      // Detect ANY processed header patterns
      if (!headerEndFound && (
          lowerLine.startsWith('; projeto:') || 
          lowerLine.startsWith('; data:') ||
          lowerLine.startsWith('; tipo de eps:') ||
          lowerLine.startsWith('; feed rate:') ||
          lowerLine.includes('=== inicio do corte ===') ||
          lowerLine.includes('modo absoluto') ||
          lowerLine.includes('zera a origem') ||
          lowerLine.includes('velocidade base'))) {
        insideHeader = true;
        continue;
      }
      
      // Detect end of header - when we find actual cutting G-code
      if (insideHeader) {
        const upperLine = trimmedLine.toUpperCase();
        
        // Skip standard configuration commands
        if (upperLine.includes('G90') || 
            upperLine.includes('G92') || 
            upperLine.match(/^F\d+/) ||
            trimmedLine === '' ||
            lowerLine.startsWith(';')) {
          continue;
        }
        
        // Check if this is actual cutting code (G01 with coordinates)
        if (upperLine.match(/G0?1/) && (upperLine.includes('X') || upperLine.includes('Y'))) {
          insideHeader = false;
          headerEndFound = true;
          // This is actual cutting code, keep it
        } else if (upperLine.match(/^[NnMm]\d+/) || upperLine.match(/^G0?[^1]/)) {
          // Other G-codes or M-codes, likely still header/setup
          continue;
        } else {
          // Unknown command, assume header ended
          insideHeader = false;
          headerEndFound = true;
        }
      }
      
      // Detect start of footer
      if (lowerLine.includes('=== fim do corte ===') ||
          lowerLine.includes('=== estatisticas ===') ||
          lowerLine.includes('=== creditos ===') ||
          lowerLine.includes('eleva digital midia') ||
          lowerLine.includes('danilo pellens') ||
          lowerLine.includes('whatsapp') ||
          lowerLine.includes('distancia total') ||
          lowerLine.includes('tempo estimado') ||
          lowerLine.includes('pausas inseridas') ||
          trimmedLine.toUpperCase() === 'M30') {
        insideFooter = true;
        continue;
      }
      
      // Skip lines inside header or footer
      if (insideHeader || insideFooter) {
        continue;
      }
      
      // Clean up the line
      let cleanLine = line;
      
      // Remove line numbers at start (N5, N10, etc) to avoid conflicts
      cleanLine = cleanLine.replace(/^\s*[Nn]\d+\s+/, '');
      
      // Remove duplicate empty lines
      if (cleanLine.trim() === '' && 
          cleanedLines.length > 0 && 
          cleanedLines[cleanedLines.length - 1].trim() === '') {
        continue;
      }
      
      // Remove duplicate F600 commands
      const upperClean = cleanLine.trim().toUpperCase();
      if (upperClean === 'F600' && 
          cleanedLines.some(prevLine => prevLine.trim().toUpperCase() === 'F600')) {
        continue;
      }
      
      // Keep the line
      cleanedLines.push(cleanLine);
    }
    
    // Remove trailing empty lines
    while (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1].trim() === '') {
      cleanedLines.pop();
    }
    
    return cleanedLines.join('\n');
  }

  private static cleanOriginalContent(content: string): string {
    const lines = content.split('\n');
    const cleanedLines: string[] = [];

    lines.forEach(line => {
      const trimmedLine = line.trim().toUpperCase();
      
      // Skip G00 commands
      if (trimmedLine.startsWith('G00') || trimmedLine.startsWith('G0 ')) {
        return;
      }
      
      // Skip existing G04 pause commands
      if (trimmedLine.startsWith('G04') || trimmedLine.startsWith('G4 ')) {
        return;
      }
      
      // Remove/filter any F commands (feed rate) from the original file
      // The system will use ONLY the material's feed rate
      let cleanedLine = line;
      
      // Remove F commands: F600, F500, etc.
      // Pattern: F followed by digits (with optional decimal)
      cleanedLine = cleanedLine.replace(/\s*F\d+(\.\d+)?\s*/gi, ' ');
      
      // Remove standalone F lines (like "N1 F500" becomes "N1")
      const lineAfterFRemoval = cleanedLine.trim();
      
      // Skip lines that become empty or only contain line numbers after F removal
      if (lineAfterFRemoval === '' || /^N\d+\s*$/.test(lineAfterFRemoval.toUpperCase())) {
        return;
      }
      
      // Clean up extra spaces
      cleanedLine = cleanedLine.replace(/\s+/g, ' ').trim();
      
      // Keep the cleaned line
      cleanedLines.push(cleanedLine);
    });

    return cleanedLines.join('\n');
  }

  private static parseG01Commands(content: string): G01Command[] {
    const lines = content.split('\n');
    const g01Commands: G01Command[] = [];
    let currentX = 0;
    let currentY = 0;
    let currentZ = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim().toUpperCase();
      
      // Detecta comandos G01 ou G1 em qualquer posição da linha
      if (trimmedLine.includes('G01') || trimmedLine.includes('G1 ') || trimmedLine.includes(' G1')) {
        // Verifica se é realmente um comando G01/G1 (não apenas parte de outro comando)
        const g01Match = trimmedLine.match(/\b(G01|G1)\b/);
        if (g01Match) {
          // Extract X coordinate
          const xMatch = trimmedLine.match(/X([-+]?\d*\.?\d+)/);
          if (xMatch) currentX = parseFloat(xMatch[1]);

          // Extract Y coordinate
          const yMatch = trimmedLine.match(/Y([-+]?\d*\.?\d+)/);
          if (yMatch) currentY = parseFloat(yMatch[1]);

          // Extract Z coordinate
          const zMatch = trimmedLine.match(/Z([-+]?\d*\.?\d+)/);
          if (zMatch) currentZ = parseFloat(zMatch[1]);

          const command: G01Command = {
            line: index,
            originalLine: line,
            x: currentX,
            y: currentY,
            z: currentZ,
          };

          g01Commands.push(command);
        }
      }
    });

    return g01Commands;
  }

  private static applyScale(g01Commands: G01Command[], scaleFactor: number): G01Command[] {
    return g01Commands.map(command => ({
      ...command,
      x: (command.x ?? 0) * scaleFactor,
      y: (command.y ?? 0) * scaleFactor,
      // Z coordinate is typically not scaled for CNC cutting
      z: command.z
    }));
  }

  private static applyScaleToContent(content: string, scaleFactor: number): string {
    const lines = content.split('\n');
    
    // Track current position (absolute coordinates)
    let currentX = 0;
    let currentY = 0;
    
    return lines.map(line => {
      const trimmedLine = line.trim().toUpperCase();
      
      // Only process lines that contain G01 commands
      if (trimmedLine.includes('G01') || trimmedLine.match(/\bG1\b/)) {
        
        let scaledLine = line;
        let newX = currentX;
        let newY = currentY;
        
        // Extract and calculate scaled X coordinate
        const xMatch = trimmedLine.match(/X([-+]?\d*\.?\d+)/);
        if (xMatch) {
          const targetX = parseFloat(xMatch[1]);
          const deltaX = targetX - currentX;  // Calculate trajectory/distance
          const scaledDeltaX = deltaX * scaleFactor;  // Scale the trajectory
          newX = currentX + scaledDeltaX;  // Apply scaled trajectory to current position
          
          // Replace X coordinate in the line
          scaledLine = scaledLine.replace(/(\bG0?1\b.*?)X([-+]?\d*\.?\d+)/gi, (match, beforeX) => {
            return `${beforeX}X${newX.toFixed(4)}`;
          });
        }
        
        // Extract and calculate scaled Y coordinate  
        const yMatch = trimmedLine.match(/Y([-+]?\d*\.?\d+)/);
        if (yMatch) {
          const targetY = parseFloat(yMatch[1]);
          const deltaY = targetY - currentY;  // Calculate trajectory/distance
          const scaledDeltaY = deltaY * scaleFactor;  // Scale the trajectory
          newY = currentY + scaledDeltaY;  // Apply scaled trajectory to current position
          
          // Replace Y coordinate in the line
          scaledLine = scaledLine.replace(/(\bG0?1\b.*?)Y([-+]?\d*\.?\d+)/gi, (match, beforeY) => {
            return `${beforeY}Y${newY.toFixed(4)}`;
          });
        }
        
        // Update current position for next iteration (CASCADE EFFECT)
        currentX = newX;
        currentY = newY;
        
        return scaledLine;
      }
      
      // Return line unchanged if not a G01 command
      return line;
    }).join('\n');
  }

  private static calculateDistancesMaxVariation(g01Commands: G01Command[]): Distance[] {
    const distances: Distance[] = [];

    for (let i = 1; i < g01Commands.length; i++) {
      const from = g01Commands[i - 1];
      const to = g01Commands[i];

      const dx = Math.abs((to.x ?? 0) - (from.x ?? 0));
      const dy = Math.abs((to.y ?? 0) - (from.y ?? 0));

      // Distance = max(|ΔX|, |ΔY|) - conforme especificação
      const distance = Math.max(dx, dy);

      distances.push({
        value: distance,
        from,
        to,
      });
    }

    return distances;
  }

  private static processWithAccumulator(distances: Distance[], material: MaterialConfig): { 
    pausePositions: Map<number, string>, 
    accumulatorStats: AccumulatorState 
  } {
    const pausePositions = new Map<number, string>();
    const stats = {
      shortAccumulator: 0,
      mediumAccumulator: 0,
      longAccumulator: 0,
    };

    let accumulator = 0;

    distances.forEach(distance => {
      const d = distance.value;

      // Aplicar regras específicas do material selecionado:
      // D < material.pausas.short.maxDist -> G04 P{material.pausas.short.tempo} (mantém acumulador)
      // material.pausas.short.maxDist ≤ D < material.pausas.medium.maxDist -> G04 P{material.pausas.medium.tempo} (zera acumulador)  
      // D ≥ material.pausas.long.minDist -> G04 P{material.pausas.long.tempo} (zera acumulador)
      
      if (d < material.pausas.short.maxDist) {
        // D < maxDist curta -> pausa curta
        pausePositions.set(distance.to.line, `P${material.pausas.short.tempo.toFixed(1)}`);
        stats.shortAccumulator++;
        // Mantém o acumulador (conforme especificação)
        accumulator += d;
      } else if (d < material.pausas.medium.maxDist) {
        // maxDist curta ≤ D < maxDist média -> pausa média
        pausePositions.set(distance.to.line, `P${material.pausas.medium.tempo.toFixed(1)}`);
        stats.mediumAccumulator++;
        accumulator = 0; // Zera acumulador
      } else {
        // D ≥ minDist longa -> pausa longa
        pausePositions.set(distance.to.line, `P${material.pausas.long.tempo.toFixed(1)}`);
        stats.longAccumulator++;
        accumulator = 0; // Zera acumulador
      }
    });

    return { pausePositions, accumulatorStats: stats };
  }

  private static buildProcessedContent(
    cleanedContent: string, 
    pausePositions: Map<number, string>, 
    config: ProjectConfig,
    originalFilename: string,
    material: MaterialConfig,
    scaleConfig?: ScaleConfig
  ): string {
    const lines = cleanedContent.split('\n');
    const processedLines: string[] = [];
    // Calculate statistics for template replacement
    const totalDistance = this.calculateTotalDistance(cleanedContent);
    const pauseCounts = this.countPausesByType(pausePositions, material);
    // Calcular tempo de corte e pausas (50% da velocidade do feed rate)
    const effectiveFeedRate = material.feedRate * 0.5; // 50% do feed rate
    const corteMin = totalDistance / effectiveFeedRate; // em minutos
    
    // Debug para verificar cálculo
    console.log('🔢 CÁLCULO TEMPO:');
    console.log('Distância total:', totalDistance, 'mm');
    console.log('Feed rate original:', material.feedRate, 'mm/min');
    console.log('Feed rate efetivo (50%):', effectiveFeedRate, 'mm/min');
    console.log('Tempo de corte calculado:', corteMin, 'minutos');
    let pauseSeconds = 0;
    pausePositions.forEach(pause => {
      // Remover o 'P' e converter para número
      const pauseValue = parseFloat(pause.replace('P', ''));
      pauseSeconds += pauseValue;
    });
    const totalSeconds = corteMin * 60 + pauseSeconds;
    const min = Math.floor(totalSeconds / 60);
    const sec = Math.round(totalSeconds % 60);
    // Tempo de corte detalhado
    const corteMinInt = Math.floor(corteMin);
    const corteSec = Math.round((corteMin - corteMinInt) * 60);
    // Tempo total estimado (minutos arredondados para cima)
    const tempoTotalMin = Math.ceil(totalSeconds / 60);
    // Prepare template variables
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
    const filenameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
    // Replace template variables in header
    let headerContent = config.header
      .replace('{FILENAME}', filenameWithoutExt)
      .replace('{DATE}', dateStr)
      .replace('{MATERIAL}', material.nome)
      .replace(/{FEED_RATE}/g, material.feedRate.toString());
    
    // Debug: Log para verificar se os valores estão corretos
    console.log('🔧 DEBUG PROCESSAMENTO:');
    console.log('Material ID:', material.id);
    console.log('Material Nome:', material.nome);
    console.log('Material Feed Rate:', material.feedRate);
    console.log('Header original:', config.header);
    console.log('Header processado:', headerContent);
    // Replace template variables in footer com tempos organizados
    let footerContent = config.footer
      .replace('{TOTAL_DISTANCE}', totalDistance.toFixed(2))
      .replace('{ESTIMATED_TIME}', `${corteMinInt} minutos e ${corteSec} segundos`)
      .replace('{TOTAL_COMMANDS}', lines.length.toString())
      .replace('{TOTAL_PAUSES}', pauseCounts.total.toString())
      .replace('{SHORT_PAUSES}', pauseCounts.short.toString())
      .replace('{MEDIUM_PAUSES}', pauseCounts.medium.toString())
      .replace('{LONG_PAUSES}', pauseCounts.long.toString())
      .replace('{PAUSE_SECONDS}', pauseSeconds.toFixed(1));
    
    // Add scale information to footer statistics if applied
    let scaleInfo = '';
    if (scaleConfig && scaleConfig.applyScale) {
      scaleInfo = `; Escala aplicada: ${scaleConfig.currentLength}mm → ${scaleConfig.desiredLength}mm (${scaleConfig.scaleFactor.toFixed(6)}x)\n`;
    }
    
    // Adicionar tempo total e escala DENTRO das estatísticas
    footerContent = footerContent.replace(
      /; Tempo de pausas: [\d.]+\s+segundos\s*\n\s*\n\s*\n\s*\n; G-CODE gerado por:/,
      `; Tempo de pausas: ${pauseSeconds.toFixed(1)} segundos\n${scaleInfo}; TEMPO TOTAL ESTIMADO: ${tempoTotalMin} minutos\n\n\n\n; G-CODE gerado por:`
    );
    // Add header
    processedLines.push(...headerContent.split('\n'));
    processedLines.push('');
    // Build a map of original line numbers to cleaned line numbers
    const originalToCleanedLineMap = new Map<number, number>();
    const originalLines = cleanedContent.split('\n');
    let cleanedLineIndex = 0;

    originalLines.forEach((line, originalIndex) => {
      if (line.trim()) {
        originalToCleanedLineMap.set(originalIndex, cleanedLineIndex);
        cleanedLineIndex++;
      }
    });

    // Process lines and insert pauses, adicionando numeração N1, N2, ...
    let nCount = 1;
    lines.forEach((line, index) => {
      if (line.trim()) { // Only add non-empty lines
        // Não numera comentários
        if (/^\s*;/.test(line)) {
          processedLines.push(line);
        } else {
          processedLines.push(`N${nCount} ${line}`);
          nCount++;
        }
        // Check if this line should have a pause after it
        if (pausePositions.has(index)) {
          processedLines.push(`N${nCount} G04 ${pausePositions.get(index)}`);
          nCount++;
        }
      }
    });

    // Add footer
    processedLines.push('');
    processedLines.push(...footerContent.split('\n'));
    return processedLines.join('\n');
  }

  private static calculateTotalDistance(content: string): number {
    const g01Commands = this.parseG01Commands(content);
    const distances = this.calculateDistancesMaxVariation(g01Commands);
    return distances.reduce((sum, d) => sum + d.value, 0);
  }

  private static countPausesByType(pausePositions: Map<number, string>, material: MaterialConfig): {
    short: number;
    medium: number;
    long: number;
    total: number;
  } {
    const counts = { short: 0, medium: 0, long: 0, total: 0 };
    
    pausePositions.forEach(pauseTime => {
      // Remover o 'P' do início para comparar apenas o valor numérico
      const timeValue = parseFloat(pauseTime.replace('P', ''));
      
      // Comparar usando o mesmo formato toFixed(1)
      if (timeValue === parseFloat(material.pausas.short.tempo.toFixed(1))) {
        counts.short++;
      } else if (timeValue === parseFloat(material.pausas.medium.tempo.toFixed(1))) {
        counts.medium++;
      } else if (timeValue === parseFloat(material.pausas.long.tempo.toFixed(1))) {
        counts.long++;
      }
    });
    
    counts.total = counts.short + counts.medium + counts.long;
    return counts;
  }

  private static calculateEstimatedTime(totalDistance: number, feedRate: number = 600): { minutes: number; seconds: number; totalMinutes: number } {
    // Tempo baseado em 50% do feed rate conforme especificação
    const effectiveFeedRate = feedRate * 0.5;
    const timeInMinutes = totalDistance / effectiveFeedRate;
    const minutes = Math.floor(timeInMinutes);
    const seconds = Math.floor((timeInMinutes - minutes) * 60);
    return { minutes, seconds, totalMinutes: timeInMinutes };
  }

  private static calculateStatistics(
    distances: Distance[], 
    pausePositions: Map<number, string>, 
    originalContent: string,
    cleanedContent: string,
    startTime: number,
    material: MaterialConfig
  ): ProcessingStatistics {
    const totalDistance = distances.reduce((sum, d) => sum + d.value, 0);
    
    // Count pauses by type
    const pauseCounts = this.countPausesByType(pausePositions, material);

    // Count removed commands
    const originalLines = originalContent.split('\n');
    const cleanedLines = cleanedContent.split('\n');
    const removedG00 = originalLines.filter(line => {
      const trimmed = line.trim().toUpperCase();
      return trimmed.startsWith('G00') || trimmed.startsWith('G0 ');
    }).length;
    
    const removedG04 = originalLines.filter(line => {
      const trimmed = line.trim().toUpperCase();
      return trimmed.startsWith('G04') || trimmed.startsWith('G4 ');
    }).length;

    // Estimate machining time based on 50% of feed rate
    const effectiveFeedRate = material.feedRate * 0.5;
    const estimatedTimeObj = {
      totalMinutes: totalDistance / effectiveFeedRate,
      minutes: Math.floor(totalDistance / effectiveFeedRate),
      seconds: Math.floor(((totalDistance / effectiveFeedRate) % 1) * 60),
    };
    
    // Calcular tempo total de pausas
    let pauseSeconds = 0;
    pausePositions.forEach(pause => {
      // Remover o 'P' e converter para número
      const pauseValue = parseFloat(pause.replace('P', ''));
      pauseSeconds += pauseValue;
    });

    const processingTime = performance.now() - startTime;

    return {
      totalDistance,
      estimatedTimeMinutes: estimatedTimeObj.totalMinutes,
      totalCommands: distances.length + 1, // +1 for initial position
      pausesInserted: {
        short: pauseCounts.short,
        medium: pauseCounts.medium,
        long: pauseCounts.long,
        total: pauseCounts.total,
      },
      removedCommands: {
        g00: removedG00,
        g04: removedG04,
        total: removedG00 + removedG04,
      },
      processingTime,
      pauseSeconds,
      estimatedTotalTime: estimatedTimeObj.totalMinutes * 60 + pauseSeconds,
    };
  }

  private static generateSanitizedFilename(originalFilename: string): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    
    // Remove extensão
    let baseName = originalFilename.replace(/\.[^/.]+$/, '');
    
    // Remove parênteses
    baseName = baseName.replace(/[()]/g, '');
    
    // Remove acentos
    baseName = baseName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Remove espaços duplicados e substitui espaços por underscore
    baseName = baseName.replace(/\s+/g, ' ').trim().replace(/\s/g, '_');
    
    // Remove caracteres especiais exceto underscore e hífen
    baseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '');
    
    return `${baseName}_${day}_${month}_${year}.tap`;
  }

  // Método para processar múltiplos arquivos
  static processMultipleFiles(files: { name: string; content: string }[], config: ProjectConfig): ProcessedResult[] {
    return files.map(file => this.processFile(file.content, config, file.name));
  }

  // Nova função para detectar se um arquivo já está processado
  private static isFileAlreadyProcessed(content: string): boolean {
    const lines = content.split('\n');
    let g01Count = 0;
    let g04Count = 0;
    let hasHeader = false;
    let hasFooter = false;
    
    // Verificar se tem header e footer de processamento
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      
      // Detectar header
      if (trimmed.includes('=== inicio do corte ===')) {
        hasHeader = true;
      }
      
      // Detectar footer
      if (trimmed.includes('=== estatisticas ===')) {
        hasFooter = true;
      }
      
      // Contar comandos G01
      if (trimmed.startsWith('g01') || trimmed.startsWith('g1 ')) {
        g01Count++;
      }
      
      // Contar comandos G04
      if (trimmed.startsWith('g04') || trimmed.startsWith('g4 ')) {
        g04Count++;
      }
    }
    
    // Se tem header, footer e a quantidade de G04 é próxima da quantidade de G01
    // (cada G01 deve ter um G04 correspondente, exceto o primeiro)
    return hasHeader && hasFooter && g04Count > 0 && Math.abs(g01Count - g04Count) <= 1;
  }
}
