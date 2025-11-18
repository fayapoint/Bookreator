# Arquitetura do Sistema Content Factory AI

## Visão Geral

O Content Factory AI é um sistema de geração de conteúdo baseado em múltiplos agentes de IA, capaz de criar livros, cursos e materiais educacionais de até 250 páginas com alta qualidade e controle de contexto.

## Arquitetura de Agentes

### 1. Editor (Coordenador Principal)
- **Responsabilidade:** Orquestração central de todo o fluxo de trabalho
- **Funções:**
  - Receber e processar requisições do usuário
  - Coordenar chamadas aos outros agentes
  - Verificar contexto e coesão entre capítulos
  - Manter o resumo geral do material
  - Validar qualidade final

### 2. Pesquisador (Research Agent)
- **Responsabilidade:** Coleta e validação de informações
- **Funções:**
  - Buscar informações relevantes sobre o tópico
  - Validar fontes e dados
  - Fornecer contexto factual para o Escritor

### 3. Escritor (Writer Agent)
- **Responsabilidade:** Criação do conteúdo textual
- **Funções:**
  - Redigir capítulos com base na pesquisa
  - Manter tom e estilo consistentes
  - Adaptar conteúdo ao público-alvo

### 4. Revisor (Reviewer Agent)
- **Responsabilidade:** Garantia de qualidade
- **Funções:**
  - Revisar gramática e ortografia
  - Verificar coesão e coerência
  - Sugerir melhorias de estilo
  - Validar estrutura narrativa

### 5. Artista (Artist Agent)
- **Responsabilidade:** Geração de conteúdo visual
- **Funções:**
  - Criar imagens ilustrativas
  - Gerar diagramas e infográficos
  - Manter consistência visual

## Fluxo de Trabalho

### Fase 1: Planejamento
1. Usuário define tema, estrutura e requisitos
2. Editor cria outline do material (capítulos/seções)
3. Sistema armazena plano no MongoDB

### Fase 2: Produção por Capítulo
Para cada capítulo:
1. **Editor** recupera contexto (resumo geral + capítulos anteriores)
2. **Pesquisador** busca informações sobre o tópico
3. **Escritor** redige o rascunho usando pesquisa + contexto
4. **Revisor** avalia e edita o conteúdo
5. **Artista** gera imagens (se necessário)
6. **Editor** valida:
   - Coerência com resumo geral
   - Conexão com capítulos anteriores
   - Qualidade geral
7. Sistema armazena capítulo no MongoDB
8. Editor atualiza resumo geral

### Fase 3: Finalização
1. Editor compila todo o material
2. Geração de índice e referências
3. Formatação final
4. Exportação em múltiplos formatos

## Controle de Contexto

### Resumo Geral (Global Summary)
- Mantido pelo Editor
- Atualizado após cada capítulo
- Contém: tema central, objetivos, pontos-chave, tom
- Usado para manter foco e direção

### Contexto de Capítulo (Chapter Context)
- Inclui: título, resumo, pontos principais, conexões
- Armazenado com cada capítulo no MongoDB
- Recuperado antes de criar novos capítulos

### Janela de Contexto Móvel
- Sistema mantém os últimos 3-5 capítulos em memória ativa
- Evita perda de coesão narrativa
- Reduz custo de tokens da API

## Modelo de Dados (MongoDB)

### Collection: projects
```typescript
{
  _id: ObjectId,
  userId: string,
  title: string,
  description: string,
  type: 'book' | 'course' | 'article',
  targetPages: number,
  status: 'planning' | 'in_progress' | 'completed',
  globalSummary: string,
  outline: [{
    chapterId: string,
    title: string,
    description: string,
    order: number
  }],
  agentConfig: {
    editor: { model: string },
    researcher: { model: string },
    writer: { model: string },
    reviewer: { model: string },
    artist: { model: string }
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: chapters
```typescript
{
  _id: ObjectId,
  projectId: ObjectId,
  chapterId: string,
  order: number,
  title: string,
  status: 'draft' | 'in_progress' | 'completed',
  research: {
    content: string,
    sources: [string],
    agentModel: string,
    timestamp: Date
  },
  draft: {
    content: string,
    wordCount: number,
    agentModel: string,
    timestamp: Date
  },
  reviewed: {
    content: string,
    changes: [string],
    agentModel: string,
    timestamp: Date
  },
  images: [{
    prompt: string,
    url: string,
    position: number,
    agentModel: string
  }],
  context: {
    summary: string,
    keyPoints: [string],
    connections: [string]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: agent_logs
```typescript
{
  _id: ObjectId,
  projectId: ObjectId,
  chapterId: string,
  agentType: 'editor' | 'researcher' | 'writer' | 'reviewer' | 'artist',
  model: string,
  input: string,
  output: string,
  tokensUsed: number,
  duration: number,
  timestamp: Date
}
```

## Integração com OpenRouter API

### Configuração por Agente
- Cada agente pode usar um modelo diferente
- Usuário configura no dashboard
- Modelos sugeridos:
  - Editor: GPT-4 ou Claude 3 Opus (raciocínio complexo)
  - Pesquisador: GPT-4 ou Perplexity (busca e validação)
  - Escritor: Claude 3.5 Sonnet ou GPT-4 (criatividade)
  - Revisor: GPT-4 (análise crítica)
  - Artista: DALL-E 3 ou Stable Diffusion (imagens)

### Gerenciamento de Tokens
- Sistema monitora uso de tokens por agente
- Implementa rate limiting
- Fornece estimativas de custo

## Escalabilidade para 250 Páginas

### Estratégias
1. **Processamento em Lotes:** Capítulos processados sequencialmente
2. **Contexto Otimizado:** Apenas últimos N capítulos em memória
3. **Cache de Pesquisa:** Reutilizar pesquisas similares
4. **Geração Assíncrona:** Imagens geradas em paralelo ao texto
5. **Checkpoints:** Salvar progresso a cada capítulo

### Estimativas
- 250 páginas ≈ 125.000 palavras
- ~50 capítulos de 2.500 palavras cada
- ~5-10 imagens por capítulo
- Tempo estimado: 2-4 horas (dependendo dos modelos)

## Dashboard e Interface

### Funcionalidades Principais
1. **Criação de Projeto:** Wizard para configurar novo material
2. **Configuração de Agentes:** Seleção de modelos por agente
3. **Monitor de Progresso:** Visualização em tempo real
4. **Editor de Outline:** Ajustar estrutura antes/durante produção
5. **Visualização de Capítulos:** Preview e edição manual
6. **Exportação:** PDF, EPUB, DOCX, HTML

### Modos de Operação
1. **Modo Automático:** Sistema gera tudo de uma vez
2. **Modo Assistido:** Usuário aprova cada capítulo
3. **Modo Manual:** Usuário edita e ajusta durante o processo

## Stack Tecnológico Final

- **Frontend:** Next.js 14 + React 19
- **UI:** shadcn/ui + Tailwind CSS 4
- **Backend:** Next.js API Routes + tRPC
- **Banco de Dados:** MongoDB (via Mongoose)
- **Autenticação:** Manus OAuth
- **LLM:** OpenRouter API (multi-modelo)
- **Geração de Imagens:** OpenRouter API ou API dedicada
- **Armazenamento:** S3 (para imagens e exports)

## Próximos Passos de Implementação

1. Definir schemas do MongoDB
2. Criar helpers de banco de dados
3. Implementar routers tRPC para agentes
4. Desenvolver dashboard e UI
5. Integrar OpenRouter API
6. Implementar sistema de contexto
7. Criar fluxo de geração
8. Testes e otimizações
