# Descobertas de Pesquisa: Arquitetura Multi-Agente e Stack Tecnológico

## Arquitetura Multi-Agente para Criação de Conteúdo

O sistema de agentes proposto (Editor, Pesquisador, Escritor, Revisor, Artista) se encaixa no conceito de **Sistemas Multiagentes (MAS)**, que utilizam agentes autônomos para resolver problemas complexos de forma coordenada.

### Padrões de Design e Orquestração

*   **Orquestração Centralizada (Coordenador):** Um agente central (o **Editor** no nosso caso) gerencia o fluxo de trabalho, chamando os outros agentes em sequência. Isso garante controle e previsibilidade, essencial para um processo de criação de conteúdo estruturado (livros, cursos).
*   **Autonomia Descentralizada:** Os agentes individuais (Pesquisador, Escritor, Revisor, Artista) terão autonomia para executar suas tarefas específicas, mas a comunicação e o controle de fluxo serão orquestrados pelo Editor.
*   **Frameworks de Orquestração:** Ferramentas como **LangChain** e **LangGraph** são mencionadas como consolidadoras para orquestração e coreografia de agentes. Embora não possamos usar diretamente bibliotecas Python no frontend Next.js, os conceitos de **Graph-based orchestration** (como no LangGraph) são ideais para o fluxo de trabalho sequencial e de checagem de contexto (capítulo-a-capítulo).

### Fluxo de Trabalho Proposto (Orquestrado pelo Editor)

1.  **Editor (Coordenador):** Recebe o tema e o plano inicial do usuário.
2.  **Pesquisador:** Busca informações sobre o tópico do capítulo atual.
3.  **Escritor:** Redige o conteúdo do capítulo, utilizando a pesquisa e o contexto geral/resumo.
4.  **Revisor:** Avalia e edita o rascunho do Escritor (gramática, coesão, tom).
5.  **Artista:** Gera imagens para o capítulo (se necessário).
6.  **Editor (Check de Contexto):**
    *   Verifica o capítulo recém-criado em relação ao **resumo geral** do material (para manter o foco).
    *   Verifica o capítulo em relação aos **capítulos anteriores** (para manter a coesão e evitar repetições).
    *   Armazena o capítulo no **MongoDB**.
    *   Atualiza o **resumo geral** do material.
7.  **Loop:** Repete para o próximo capítulo até atingir o limite de 250 páginas.

### Stack Tecnológico

*   **Frontend/Backend:** Next.js (Fullstack)
*   **Componentes:** shadcn/ui
*   **Banco de Dados:** MongoDB (conforme solicitado)
*   **Integração LLM:** OpenRouter API (com seleção de modelo por agente)
*   **Armazenamento de Dados:** MongoDB será usado para armazenar:
    *   Capítulos (conteúdo final e rascunhos).
    *   Resumo Geral do Material (para controle de contexto).
    *   Configurações do Dashboard (incluindo modelos de IA por agente).
    *   Dados de Usuário.

### Próximos Passos

1.  **Inicializar o Projeto:** Usar `webdev_init_project` com `web-db-user` para configurar Next.js, backend, MongoDB e autenticação.
2.  **Estrutura de Dados:** Definir o esquema do MongoDB para projetos, capítulos e configurações de agentes.
3.  **Desenvolvimento:** Implementar o dashboard, a interface de configuração e o sistema de agentes.

## Ferramentas de Criação de Conteúdo

A pesquisa inicial identificou várias ferramentas de IA (Jasper, Copy.ai, ClickUp, etc.), o que confirma a viabilidade do projeto. O foco agora é construir a nossa própria ferramenta com a arquitetura de agentes.

## Geração de Imagens

A geração de imagens será integrada ao fluxo do agente **Artista**, utilizando a API da OpenRouter ou uma API de geração de imagens compatível (como DALL-E ou Stable Diffusion, se acessível via OpenRouter).
