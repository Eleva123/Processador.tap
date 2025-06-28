// Estrutura de material para corte CNC
export interface MaterialConfig {
  id: string; // ex: "T1"
  nome: string; // ex: "EPS T1"
  descricao?: string;
  cor?: string; // badge
  feedRate: number; // mm/min
  pausas: {
    short: { maxDist: number; tempo: number };   // P0.0
    medium: { maxDist: number; tempo: number };  // P0.3
    long: { minDist: number; tempo: number };    // P0.5
  };
  algoritmo?: string; // lógica/descrição do processamento
}

// Material padrão T1
export const DEFAULT_MATERIAL: MaterialConfig = {
  id: 'T1',
  nome: 'EPS T1',
  descricao: 'Isopor padrão, densidade baixa',
  cor: '#7AA2F7',
  feedRate: 600,
  pausas: {
    short: { maxDist: 5, tempo: 0.0 },
    medium: { maxDist: 50, tempo: 0.3 },
    long: { minDist: 50, tempo: 0.5 },
  },
  algoritmo: `• Distância: D = max(|ΔX|, |ΔY|)\n• D < 5mm: G04 P0.0 (sempre insere, mantém acumulador)\n• 5 ≤ D < 50mm: G04 P0.3 (zera acumulador)\n• D ≥ 50mm: G04 P0.5 (zera acumulador)\n• Remove: Comandos G00 e G04 existentes\n• Tempo: Baseado em 300 mm/min`,
};

// Material T2 de exemplo para teste
export const T2_MATERIAL: MaterialConfig = {
  id: 'T2',
  nome: 'EPS T2',
  descricao: 'Isopor densidade média',
  cor: '#E0AF68',
  feedRate: 500,
  pausas: {
    short: { maxDist: 8, tempo: 0.1 },
    medium: { maxDist: 40, tempo: 0.4 },
    long: { minDist: 40, tempo: 0.7 },
  },
  algoritmo: `• Material T2 com diferentes parâmetros de corte`,
};

// Funções utilitárias para persistência dos materiais (localStorage)
export function getMaterials(): MaterialConfig[] {
  if (typeof window === 'undefined') return [DEFAULT_MATERIAL, T2_MATERIAL];
  const raw = localStorage.getItem('tap_materials');
  let mats: MaterialConfig[] = [];
  if (raw) {
    try {
      mats = JSON.parse(raw);
    } catch {
      mats = [];
    }
  }
  // Garante que o T1 sempre esteja presente
  if (!mats.some(m => m.id === DEFAULT_MATERIAL.id)) {
    mats = [DEFAULT_MATERIAL, ...mats];
  }
  // Garante que o T2 de exemplo sempre esteja presente
  if (!mats.some(m => m.id === T2_MATERIAL.id)) {
    mats = [DEFAULT_MATERIAL, T2_MATERIAL, ...mats.filter(m => m.id !== DEFAULT_MATERIAL.id)];
  }
  return mats;
}

export function saveMaterials(materials: MaterialConfig[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tap_materials', JSON.stringify(materials));
}

// Utilitário para buscar material por id
export function getMaterialById(id: string): MaterialConfig {
  const mats = getMaterials();
  return mats.find(m => m.id === id) || DEFAULT_MATERIAL;
} 