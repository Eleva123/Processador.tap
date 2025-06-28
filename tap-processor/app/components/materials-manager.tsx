'use client';

import { useState, useEffect } from 'react';
import { MaterialConfig, getMaterials, saveMaterials, DEFAULT_MATERIAL } from '@/lib/materials';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

export function MaterialsManager({ onClose, onSelect }: { onClose: () => void, onSelect?: (id: string) => void }) {
  const [materials, setMaterials] = useState<MaterialConfig[]>(getMaterials());
  const [editing, setEditing] = useState<MaterialConfig | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Atualiza lista de materiais ao abrir/modal ser montado
  useEffect(() => {
    setMaterials(getMaterials());
  }, []);

  function handleEdit(mat: MaterialConfig) {
    setEditing({ ...mat });
    setIsNew(false);
  }
  function handleNew() {
    setEditing({ ...DEFAULT_MATERIAL, id: '', nome: '', algoritmo: '', descricao: '', cor: '#7AA2F7' });
    setIsNew(true);
  }
  function handleDelete(id: string) {
    if (confirm('Remover material?')) {
      const updated = materials.filter(m => m.id !== id);
      setMaterials(updated);
      saveMaterials(updated);
      // Força atualização global (para o seletor suspenso)
      window.dispatchEvent(new Event('storage'));
    }
  }
  function handleSave() {
    if (!editing) return;
    
    // Validações básicas
    if (!editing.nome.trim()) {
      alert('Nome do material é obrigatório');
      return;
    }
    if (!editing.id.trim()) {
      alert('ID do material é obrigatório');
      return;
    }
    if (editing.feedRate <= 0) {
      alert('Feed Rate deve ser maior que zero');
      return;
    }
    
    let updated: MaterialConfig[];
    if (isNew) {
      // Verificar se ID já existe
      if (materials.some(m => m.id === editing.id)) {
        alert('ID já existe. Escolha outro ID.');
        return;
      }
      updated = [...materials, { ...editing, id: editing.id || `M${Date.now()}` }];
    } else {
      updated = materials.map(m => m.id === editing.id ? editing : m);
    }
    setMaterials(updated);
    saveMaterials(updated);
    setEditing(null);
    setIsNew(false);
  }
  return (
    <div className="bg-[#1A1B26] rounded-lg border border-[#414868] shadow-2xl w-[800px]">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-[#414868]">
        <h2 className="text-lg font-bold text-[#7AA2F7]">Materiais de Corte</h2>
        <Button size="sm" variant="outline" onClick={onClose}>Fechar</Button>
      </div>
      
      {/* Conteúdo */}
      <div className="p-4">
        {/* Botão Novo Material */}
        <div className="mb-4">
          <Button size="sm" className="bg-[#7AA2F7] text-white" onClick={handleNew}>Novo Material</Button>
        </div>
        
        {/* Lista de materiais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {materials.filter(mat => mat.id !== 'T1').map(mat => (
            <div key={mat.id} className="p-3 border border-[#414868] rounded-lg bg-[#24283B]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm" style={{ color: mat.cor }}>{mat.nome}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(mat)} className="text-xs">Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(mat.id)} className="text-xs">Remover</Button>
                  {onSelect && <Button size="sm" onClick={() => { onSelect(mat.id); onClose(); }} className="text-xs">Selecionar</Button>}
                </div>
              </div>
              <div className="text-xs text-[#A9B1D6]">
                <div>Feed Rate: {mat.feedRate} mm/min</div>
                <div>P0.0: D &lt; {mat.pausas.short.maxDist}mm, {mat.pausas.short.tempo}s</div>
                <div>P0.3: D &lt; {mat.pausas.medium.maxDist}mm, {mat.pausas.medium.tempo}s</div>
                <div>P0.5: D ≥ {mat.pausas.long.minDist}mm, {mat.pausas.long.tempo}s</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Formulário de edição */}
        {editing && (
          <div className="border-t border-[#414868] pt-4 mt-4">
            <div className="p-3 border border-[#E0AF68] rounded-lg bg-[#24283B]">
              <h3 className="font-bold text-[#E0AF68] mb-3">{isNew ? 'Novo Material' : 'Editar Material'}</h3>
              
              {/* Informações básicas */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-[#A9B1D6] mb-1">ID</label>
                  <Input 
                    value={editing.id} 
                    onChange={e => setEditing({ ...editing, id: e.target.value })} 
                    placeholder="T1"
                    className="bg-[#1A1B26] border-[#414868] text-[#C0CAF5]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A9B1D6] mb-1">Nome</label>
                  <Input 
                    value={editing.nome} 
                    onChange={e => setEditing({ ...editing, nome: e.target.value })} 
                    placeholder="Nome do material"
                    className="bg-[#1A1B26] border-[#414868] text-[#C0CAF5]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A9B1D6] mb-1">Cor (hex)</label>
                  <Input 
                    value={editing.cor} 
                    onChange={e => setEditing({ ...editing, cor: e.target.value })}
                    className="bg-[#1A1B26] border-[#414868] text-[#C0CAF5]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A9B1D6] mb-1">Feed Rate</label>
                  <Input 
                    type="number" 
                    value={editing.feedRate} 
                    onChange={e => setEditing({ ...editing, feedRate: Number(e.target.value) })}
                    className="bg-[#1A1B26] border-[#414868] text-[#C0CAF5]"
                  />
                </div>
              </div>
              
              {/* Pausas */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-white mb-2">Configurações de Pausas</h4>
                <div className="grid grid-cols-3 gap-3">
                  {/* P0.0 */}
                  <div className="p-2 border border-[#FFD600]/30 rounded bg-[#1A1B26]">
                    <h5 className="text-xs font-bold text-[#FFD600] mb-2">P0.0</h5>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-[#A9B1D6] mb-1">Distância máx (mm)</label>
                        <Input 
                          type="number" 
                          value={editing.pausas.short.maxDist} 
                          onChange={e => setEditing({ ...editing, pausas: { ...editing.pausas, short: { ...editing.pausas.short, maxDist: Number(e.target.value) } } })}
                          className="bg-[#24283B] border-[#414868] text-[#C0CAF5]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#A9B1D6] mb-1">Tempo (s)</label>
                        <Input 
                          type="number" 
                          value={editing.pausas.short.tempo} 
                          onChange={e => setEditing({ ...editing, pausas: { ...editing.pausas, short: { ...editing.pausas.short, tempo: Number(e.target.value) } } })}
                          className="bg-[#24283B] border-[#414868] text-[#C0CAF5]"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* P0.3 */}
                  <div className="p-2 border border-[#39FF14]/30 rounded bg-[#1A1B26]">
                    <h5 className="text-xs font-bold text-[#39FF14] mb-2">P0.3</h5>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-[#A9B1D6] mb-1">Distância máx (mm)</label>
                        <Input 
                          type="number" 
                          value={editing.pausas.medium.maxDist} 
                          onChange={e => setEditing({ ...editing, pausas: { ...editing.pausas, medium: { ...editing.pausas.medium, maxDist: Number(e.target.value) } } })}
                          className="bg-[#24283B] border-[#414868] text-[#C0CAF5]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#A9B1D6] mb-1">Tempo (s)</label>
                        <Input 
                          type="number" 
                          value={editing.pausas.medium.tempo} 
                          onChange={e => setEditing({ ...editing, pausas: { ...editing.pausas, medium: { ...editing.pausas.medium, tempo: Number(e.target.value) } } })}
                          className="bg-[#24283B] border-[#414868] text-[#C0CAF5]"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* P0.5 */}
                  <div className="p-2 border border-[#FF1744]/30 rounded bg-[#1A1B26]">
                    <h5 className="text-xs font-bold text-[#FF1744] mb-2">P0.5</h5>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-[#A9B1D6] mb-1">Distância mín (mm)</label>
                        <Input 
                          type="number" 
                          value={editing.pausas.long.minDist} 
                          onChange={e => setEditing({ ...editing, pausas: { ...editing.pausas, long: { ...editing.pausas.long, minDist: Number(e.target.value) } } })}
                          className="bg-[#24283B] border-[#414868] text-[#C0CAF5]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#A9B1D6] mb-1">Tempo (s)</label>
                        <Input 
                          type="number" 
                          value={editing.pausas.long.tempo} 
                          onChange={e => setEditing({ ...editing, pausas: { ...editing.pausas, long: { ...editing.pausas.long, tempo: Number(e.target.value) } } })}
                          className="bg-[#24283B] border-[#414868] text-[#C0CAF5]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Botões de ação */}
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="bg-[#7AA2F7] text-white" onClick={handleSave}>
                  Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditing(null); setIsNew(false); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 