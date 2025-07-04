# 🎯 TAP Processor - Processador Inteligente de Arquivos CNC

Sistema web para processamento de arquivos .tap de corte CNC com escala inteligente, pausas térmicas dinâmicas e otimização de corte.

## ✨ **Funcionalidades**

- 📁 **Upload múltiplo** de arquivos .tap
- 🎯 **Escala inteligente** com efeito cascata
- ⏱️ **Pausas térmicas** dinâmicas (G04)
- 📊 **Estatísticas detalhadas** de processamento
- 🎨 **Interface moderna** e responsiva
- 📦 **Download ZIP** de múltiplos arquivos
- 🔧 **Configuração de materiais** personalizada

## 🚀 **Deploy Rápido**

### **Opção 1: Vercel (Recomendado)**

1. **Fork este repositório** ou clone para sua conta
2. Acesse [vercel.com](https://vercel.com)
3. Faça login com GitHub
4. Clique em **"New Project"**
5. Selecione o repositório
6. Configure:
   - **Framework**: Next.js
   - **Root Directory**: `tap-processor/app`
   - **Build Command**: `npm run build`
7. Clique em **"Deploy"**

### **Opção 2: Netlify**

1. Acesse [netlify.com](https://netlify.com)
2. **"New site from Git"**
3. Selecione o repositório
4. Configure:
   - **Build command**: `cd tap-processor/app && npm run build`
   - **Publish directory**: `tap-processor/app/.next`

### **Opção 3: Docker**

```bash
# Construir imagem
docker build -t tap-processor ./tap-processor/app

# Executar container
docker run -p 3000:3000 tap-processor
```

## 🛠️ **Desenvolvimento Local**

### **Pré-requisitos**
- Node.js 18+
- npm ou yarn

### **Instalação**

```bash
# Clone o repositório
git clone https://github.com/Eleva123/Processador.tap.git
cd Processador.tap

# Instale as dependências
cd tap-processor/app
npm install

# Execute em modo desenvolvimento
npm run dev
```

### **Acesse**
- **Local**: http://localhost:3000
- **Rede**: http://seu-ip:3000

## 📁 **Estrutura do Projeto**

```
tap-processor/app/
├── app/                    # Páginas Next.js 13+
├── components/             # Componentes React
│   ├── ui/                # Componentes UI base
│   └── *.tsx              # Componentes específicos
├── lib/                   # Lógica de negócio
│   ├── tap-processor.ts   # Processador TAP
│   ├── materials.ts       # Configuração de materiais
│   └── types.ts           # Tipos TypeScript
├── public/                # Arquivos estáticos
└── prisma/                # Schema do banco (se necessário)
```

## 🔧 **Configuração**

### **Materiais**
Edite `lib/materials.ts` para adicionar novos materiais:

```typescript
{
  name: "Nome do Material",
  feedRate: 1000,        // mm/min
  thermalPause: true,    // Habilitar pausas
  color: "#3b82f6"       // Cor no UI
}
```

### **Escala Inteligente**
- Acesse o botão **"Escala"** no cabeçalho
- Informe dimensão atual e desejada
- Sistema aplica efeito cascata automaticamente

## 📊 **Como Usar**

1. **Upload**: Arraste arquivos .tap ou clique para selecionar
2. **Configurar**: Selecione material e parâmetros
3. **Processar**: Clique em "Processar" para aplicar pausas G04
4. **Escalar** (opcional): Use o botão "Escala" para redimensionar
5. **Download**: Baixe arquivos individuais ou ZIP completo

## 🎯 **Algoritmo de Pausas Térmicas**

- **D ≤ 5mm**: G04 P0.0 (mantém acumulador)
- **5 < D ≤ 50mm**: G04 P0.3 (zera acumulador)
- **D > 50mm**: G04 P0.5 (zera acumulador)

## 🔄 **Deploy Automático**

O projeto inclui GitHub Actions para deploy automático no Vercel. Configure os secrets:

- `VERCEL_TOKEN`: Token do Vercel
- `ORG_ID`: ID da organização
- `PROJECT_ID`: ID do projeto

## 📝 **Licença**

Este projeto é de uso livre para fins educacionais e comerciais.

## 🤝 **Contribuição**

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

**Desenvolvido com ❤️ para otimização de corte CNC**
