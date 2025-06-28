# Sistema de Materiais Dinâmicos - TAP Processor

## Visão Geral

O TAP Processor agora suporta **materiais de corte totalmente editáveis**, permitindo configurar parâmetros específicos para cada tipo de material (EPS, PVC, MDF, etc.) com suas próprias regras de pausas térmicas.

## Como Usar

### 1. Acessar o Gerenciador de Materiais
- Clique no botão **"Materiais"** no header da aplicação
- Uma janela modal abrirá com todos os materiais cadastrados

### 2. Criar Novo Material
- Clique em **"Novo Material"**
- Preencha todos os campos:
  - **ID**: Identificador único (ex: T1, EPS, PVC)
  - **Nome**: Nome descritivo do material
  - **Cor**: Cor hexadecimal para identificação visual
  - **Feed Rate**: Velocidade de corte em mm/min
  - **Descrição**: Informações adicionais sobre o material

### 3. Configurar Pausas Térmicas
Cada material possui 3 tipos de pausas configuráveis:

#### P0.0 (Pausa Curta) - Amarelo
- **Distância máxima**: Movimentos até X mm
- **Tempo**: Duração da pausa em segundos
- **Comportamento**: Mantém o acumulador de distância

#### P0.3 (Pausa Média) - Verde  
- **Distância máxima**: Movimentos até X mm
- **Tempo**: Duração da pausa em segundos
- **Comportamento**: Zera o acumulador de distância

#### P0.5 (Pausa Longa) - Vermelho
- **Distância mínima**: Movimentos a partir de X mm
- **Tempo**: Duração da pausa em segundos
- **Comportamento**: Zera o acumulador de distância

### 4. Algoritmo/Lógica
- Campo de texto livre para documentar a lógica específica do material
- Pode incluir regras especiais, observações ou instruções

## Exemplos de Configuração

### EPS T1 (Padrão)
```
ID: T1
Nome: EPS T1
Feed Rate: 600 mm/min
P0.0: D < 5mm, 0.0s
P0.3: D < 50mm, 0.3s  
P0.5: D ≥ 50mm, 0.5s
```

### PVC Rígido
```
ID: PVC
Nome: PVC Rígido
Feed Rate: 300 mm/min
P0.0: D < 3mm, 0.1s
P0.3: D < 30mm, 0.4s
P0.5: D ≥ 30mm, 0.6s
```

### MDF
```
ID: MDF
Nome: MDF 18mm
Feed Rate: 400 mm/min
P0.0: D < 4mm, 0.05s
P0.3: D < 40mm, 0.35s
P0.5: D ≥ 40mm, 0.55s
```

## Funcionalidades

### ✅ Implementado
- [x] Cadastro completo de materiais
- [x] Edição de todos os parâmetros
- [x] Remoção de materiais
- [x] Persistência no navegador (localStorage)
- [x] Validações básicas
- [x] Interface responsiva
- [x] Cores diferenciadas por tipo de pausa

### 🔄 Próximos Passos
- [ ] Seleção de material ativo no processamento
- [ ] Integração com algoritmo de processamento TAP
- [ ] Estatísticas baseadas no material selecionado
- [ ] Exportar/importar configurações de materiais
- [ ] Templates pré-configurados

## Estrutura Técnica

### Interface MaterialConfig
```typescript
interface MaterialConfig {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  feedRate: number;
  pausas: {
    short: { maxDist: number; tempo: number };
    medium: { maxDist: number; tempo: number };
    long: { minDist: number; tempo: number };
  };
  algoritmo?: string;
}
```

### Persistência
- Os materiais são salvos no `localStorage` do navegador
- Chave: `tap_materials`
- Formato: JSON array de MaterialConfig
- Fallback: Material padrão T1 se não houver dados

### Componentes
- `MaterialsManager`: Interface principal de gerenciamento
- `HeaderActions`: Botão para abrir o gerenciador
- `materials.ts`: Lógica de dados e persistência

## Dicas de Uso

1. **Nomenclatura**: Use IDs curtos e descritivos (T1, EPS, PVC, MDF)
2. **Cores**: Escolha cores que facilitem identificação visual
3. **Feed Rate**: Baseie-se na velocidade recomendada pelo fabricante
4. **Pausas**: Ajuste conforme a densidade e comportamento térmico do material
5. **Documentação**: Use o campo algoritmo para registrar observações importantes

## Suporte

Para dúvidas ou problemas:
1. Verifique se todos os campos obrigatórios estão preenchidos
2. Confirme que o ID é único
3. Teste com valores de feed rate e pausas realistas
4. Use o material padrão T1 como referência 