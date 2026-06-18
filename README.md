# FichaFit

PWA (Progressive Web App) offline-first para gerenciamento de fichas de treino. Pensado para uso
com uma mão durante sessões ativas de academia, onde a conectividade é instável e o usuário está
em movimento.

## Funcionalidades

- **Fichas de treino**: criar, editar (nome e descrição), excluir e agrupar fichas em "Grupos"
  (ex: um grupo "PPL" reunindo as fichas Push, Pull e Legs).
- **Exercícios na ficha**: adicionar e editar exercícios com séries, faixa de repetições, descanso
  e carga de referência, escolhendo a partir de um seletor com busca conectado à biblioteca de
  exercícios (catálogo + customizados).
- **Sessão ativa de treino**: tela otimizada para uso durante o treino, com registro rápido de
  séries (peso + repetições), avanço automático do timer de descanso ao zerar e indicador de
  progresso da sessão.
- **Histórico**: lista completa das sessões realizadas, sem limite de data, com detalhe de cada
  sessão.
- **Biblioteca de exercícios**: catálogo importado da API pública do wger, além de exercícios
  customizados criados pelo próprio usuário.
- **Assistente de IA personal trainer**: gera uma ficha de treino completa e personalizada (com
  base em objetivo, idade, peso, sexo e frequência semanal) usando a API da Anthropic.
- **Modo offline**: toda a aplicação funciona sem rede — os dados ficam no IndexedDB (Dexie.js) e
  sincronizam automaticamente com o Supabase quando o usuário está autenticado e online.
- **Login via Magic Link**: autenticação sem senha através do Supabase Auth.
- **PWA instalável**: pode ser adicionado à tela inicial do celular e funciona como app nativo.
- **Avatares**: conjunto de avatares pré-definidos para personalizar o perfil.
- **Tema**: seletor de tema claro/escuro.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript (strict) |
| Estilo | Tailwind CSS |
| DB local | Dexie.js (IndexedDB) |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| Validação | Zod |
| IA | API da Anthropic (Claude) |
| Testes | Vitest + Playwright |

## Como rodar localmente

```bash
npm install
cp .env.example .env.local   # preencher com suas próprias credenciais
npm run dev                  # http://localhost:3000
```

Variáveis necessárias em `.env.local`: ver `.env.example` (Supabase, URL do app e, opcionalmente,
`ANTHROPIC_API_KEY` para habilitar a assistente de IA).

## Convenções do projeto

Todas as decisões de arquitetura, regras de código e convenções estão documentadas em
[`CLAUDE.md`](./CLAUDE.md).
