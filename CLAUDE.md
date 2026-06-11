# CLAUDE.md — FichaFit

> Arquivo de memória do projeto para o Claude Code.
> Leia este arquivo inteiro antes de escrever qualquer código.

---

## Visão do Projeto

FichaFit é um PWA offline-first para gerenciamento de fichas de treino (ficha de treino).
Projetado para uso com uma mão durante sessões ativas de academia, onde a conectividade é
instável e o usuário está em movimento.

**Fase atual:** MVP — usuário único, uso pessoal
**Próxima fase:** Multi-usuário SaaS (Supabase RLS já preparado desde o início)

---

## Decisões Confirmadas (não alterar sem consultar o dono)

| Decisão | Valor |
|---------|-------|
| Framework | Next.js 14 (App Router) |
| Deploy | Vercel — URL auto-gerada (sem domínio custom por enquanto) |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| Auth | Magic Link via Supabase — sem senha |
| Modo offline | Dexie.js (IndexedDB) como fonte local de verdade |
| Sync | Opcional — só ocorre quando autenticado e online |
| UI | 100% Português Brasil — zero inglês na interface |
| Timer de descanso | Avança AUTOMATICAMENTE ao zerar (500ms de delay visual) |
| Unidade de peso | Somente kg — sem opção de lbs |
| Catálogo de exercícios | wger API pública — inglês como fallback aceitável |
| Avatar | Conjunto pré-definido estilo Duolingo — sem foto de perfil |
| Histórico | Completo, sem limite de data |
| Chrome Extension | Fora do escopo — PWA apenas |
| Preço | Free forever — sem billing no MVP |

---

## Estrutura do Projeto

```
fichafit/
├── app/                          # Next.js App Router — rotas e layouts
│   ├── layout.tsx                # Root layout: lang="pt-BR", meta PWA, fonte
│   ├── page.tsx                  # Redireciona para /treinos
│   ├── globals.css               # Tailwind base + tokens CSS globais
│   ├── (auth)/                   # Grupo de rotas com NavInferior
│   │   ├── layout.tsx            # Layout com <NavInferior />
│   │   ├── treinos/
│   │   │   ├── page.tsx          # Lista de fichas
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Detalhe/edição da ficha
│   │   │       └── sessao/
│   │   │           └── page.tsx  # TELA PRINCIPAL: sessão ativa
│   │   ├── historico/
│   │   │   ├── page.tsx          # Lista de sessões passadas
│   │   │   └── [id]/page.tsx     # Detalhe de sessão
│   │   ├── exercicios/
│   │   │   └── page.tsx          # Biblioteca de exercícios
│   │   └── perfil/
│   │       └── page.tsx          # Perfil + seletor de avatar + status sync
│   ├── login/
│   │   └── page.tsx              # Formulário Magic Link
│   ├── auth/
│   │   └── callback/route.ts     # Callback Supabase pós-clique no email
│   └── api/
│       └── exercicios-seed/
│           └── route.ts          # POST: importa catálogo wger (executar 1x)
├── src/
│   ├── modules/                  # Módulos de feature (bounded contexts)
│   │   ├── fichas/               # Fichas de treino
│   │   │   ├── domain/FichaTreino.ts
│   │   │   ├── application/useFichas.ts
│   │   │   ├── infrastructure/fichaRepository.ts    # Dexie
│   │   │   ├── infrastructure/fichaSupabase.ts      # Supabase sync
│   │   │   └── presentation/FichaListagem.tsx
│   │   ├── sessao/               # Sessão de treino ativa
│   │   │   ├── domain/SessaoTreino.ts
│   │   │   ├── application/useSessaoAtiva.ts
│   │   │   ├── infrastructure/sessaoRepository.ts
│   │   │   ├── infrastructure/sessaoSupabase.ts
│   │   │   └── presentation/FichaTreinoPage.tsx     # TELA PRINCIPAL
│   │   ├── exercicios/           # Biblioteca de exercícios
│   │   │   ├── domain/Exercicio.ts
│   │   │   ├── application/useExercicios.ts
│   │   │   ├── infrastructure/exercicioRepository.ts
│   │   │   └── infrastructure/wgerApiClient.ts
│   │   ├── historico/            # Histórico de sessões
│   │   │   ├── application/useHistorico.ts
│   │   │   └── presentation/HistoricoPage.tsx
│   │   └── auth/                 # Autenticação
│   │       ├── application/useAuth.ts
│   │       ├── infrastructure/supabaseAuth.ts
│   │       └── presentation/TelaLogin.tsx
│   └── shared/                   # Código compartilhado
│       ├── db/
│       │   ├── db.ts             # Instância Dexie singleton + schema completo
│       │   └── migrations.ts     # Versionamento Dexie
│       ├── supabase/
│       │   ├── client.ts         # Cliente browser (singleton)
│       │   ├── server.ts         # Cliente server + admin
│       │   └── database.types.ts # Tipos gerados do schema
│       ├── sync/
│       │   ├── syncEngine.ts     # Pull (servidor→local) e Push (local→servidor)
│       │   └── syncQueue.ts      # Fila de mutations offline
│       ├── components/           # Componentes UI reutilizáveis
│       │   ├── BotaoGrande.tsx       # ≥64px — alvo principal mid-workout
│       │   ├── InputNumerico.tsx     # +/- com input — otimizado para mobile
│       │   ├── LogadorSerie.tsx      # Peso + reps combinados
│       │   ├── CardExercicio.tsx     # Exercício atual na sessão
│       │   ├── ProgressoSessao.tsx   # Barra de progresso da sessão
│       │   ├── NavInferior.tsx       # Bottom navigation (oculta em /sessao)
│       │   ├── BannerOffline.tsx     # Indicador de status offline
│       │   ├── AvatarUsuario.tsx     # Avatar pré-definido do usuário
│       │   └── ModalConfirmacao.tsx  # Modal genérico para ações destrutivas
│       ├── hooks/
│       │   ├── useStatusOnline.ts    # Online/offline + dispara sync
│       │   ├── useTimer.ts           # Countdown reutilizável
│       │   └── useSync.ts            # Trigger manual de sincronização
│       ├── types/
│       │   └── avatares.ts           # Catálogo de avatares pré-definidos
│       └── utils/
│           └── formatacao.ts         # formatarDuracao, formatarDataRelativa, etc.
├── supabase/
│   └── migrations/
│       ├── 001_schema_inicial.sql    # Schema completo com RLS
│       └── 002_perfis_usuario.sql    # Tabela de perfis + trigger de criação
├── public/
│   ├── manifest.json             # Manifesto PWA
│   ├── icons/                    # icon-192.png, icon-512.png, icon-512-maskable.png
│   ├── avatares/                 # SVGs dos avatares (ou use DiceBear via URL)
│   └── screenshots/              # Screenshots para o manifesto PWA
├── .env.example                  # Template de variáveis (commitado)
├── .env.local                    # Credenciais reais (NUNCA commitar)
├── next.config.js                # Next.js + next-pwa (Workbox)
├── tailwind.config.ts            # Tailwind com tokens de design
├── tsconfig.json                 # TypeScript strict mode
├── vitest.config.ts              # Config de testes unitários
├── playwright.config.ts          # Config E2E
└── CLAUDE.md                     # Este arquivo
```

---

## Stack Completa

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 14.x |
| Linguagem | TypeScript (strict) | 5.x |
| Estilo | Tailwind CSS | 3.x |
| Componentes | shadcn/ui (Radix) | latest |
| DB Local | Dexie.js | 4.x |
| Hooks Reativos | dexie-react-hooks | 1.x |
| Backend/DB | Supabase | latest |
| Auth | Supabase Magic Link | — |
| PWA | next-pwa (Workbox) | 5.x |
| Validação | Zod | 3.x |
| UUID | uuid | 10.x |
| Testes Unitários | Vitest + Testing Library | 2.x |
| Testes E2E | Playwright | 1.x |
| CI/CD | GitHub Actions | — |
| Deploy | Vercel | — |

---

## Comandos Principais

```bash
# Instalar dependências
npm install

# Desenvolvimento local
npm run dev                    # http://localhost:3000

# Qualidade de código
npm run lint                   # ESLint
npm run typecheck              # TypeScript sem emitir arquivos

# Testes
npm run test                   # Vitest (unitários + integração)
npm run test:watch             # Vitest em modo watch
npm run test:e2e               # Playwright E2E

# Build
npm run build                  # Build de produção
npm run start                  # Servidor de produção local

# Supabase local (requer Docker)
npx supabase start             # Sobe stack local
npx supabase db reset          # Aplica migrations + seed do zero
npx supabase gen types typescript --linked > src/shared/supabase/database.types.ts

# Deploy
vercel --prod                  # Deploy manual (CI faz isso automaticamente)

# Importar catálogo de exercícios (executar 1x após deploy)
curl -X POST https://[url-vercel]/api/exercicios-seed
```

---

## Variáveis de Ambiente

### `.env.local` (nunca commitar)

```env
# Supabase — dashboard.supabase.com → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Somente server-side — NUNCA prefixar com NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# URL do app — atualizar com URL gerada pelo Vercel após deploy
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Após primeiro deploy no Vercel

1. Copiar a URL gerada (ex: `https://fichafit-abc123.vercel.app`)
2. Atualizar `NEXT_PUBLIC_APP_URL` nas env vars da Vercel
3. No Supabase → Authentication → URL Configuration:
   ```
   Site URL:      https://fichafit-abc123.vercel.app
   Redirect URLs: https://fichafit-abc123.vercel.app/auth/callback
                  http://localhost:3000/auth/callback
   ```

---

## Arquitetura de Dados — Três Modos

```
┌─────────────────────────────────────────────────┐
│  Modo 1: Local puro                             │
│  Condição: offline OU não autenticado           │
│  Fonte: Dexie.js (IndexedDB)                    │
│  Sync: nenhum                                   │
├─────────────────────────────────────────────────┤
│  Modo 2: Online, não sincronizado               │
│  Condição: online, sem Magic Link feito         │
│  Fonte: Dexie.js                                │
│  Sync: fila acumula, não executa                │
├─────────────────────────────────────────────────┤
│  Modo 3: Sincronizado                           │
│  Condição: online + autenticado                 │
│  Fonte: Dexie.js ↔ Supabase                    │
│  Sync: push ao concluir sessão, pull ao logar   │
└─────────────────────────────────────────────────┘
```

**Fluxo de escrita:**
```
Ação do usuário
  → Validação de domínio (domain/)
  → Escrita no Dexie (imediata, nunca bloqueia UI)
  → Enfileirar na syncQueue
  → [quando online + autenticado] push para Supabase
```

---

## Regras de Código — Obrigatórias

### Arquitetura

1. **Camada de domínio é pura.** Arquivos em `domain/` não podem importar React,
   Dexie, Supabase, ou qualquer biblioteca externa. Apenas TypeScript e uuid.

2. **Sem lógica de negócio em componentes.** Componentes chamam hooks da camada
   `application/`. Hooks chamam `infrastructure/`. Nunca pule camadas.

3. **Offline é o estado padrão.** Toda feature deve funcionar sem rede.
   Supabase é aditivo — nunca bloqueante.

4. **Validação nas fronteiras.** Use Zod em toda entrada de dados externos:
   API Supabase, wger API, e dados lidos do IndexedDB (schema pode ser stale).

5. **Imutabilidade no domínio.** Funções de domínio retornam novos objetos,
   nunca mutam o argumento. Ex: `logSet()` retorna nova sessão, não modifica a existente.

### UX / Interface

6. **Touch targets ≥ 48px.** O app é usado com mãos suadas na academia.
   Todo elemento interativo deve ter `min-height: 48px` e `min-width: 48px`.

7. **Ações primárias na metade inferior da tela.** O botão principal de cada
   tela deve estar acessível com o polegar sem reposicionar o telefone.

8. **Todo texto em Português Brasil.** Zero inglês na UI, labels, mensagens
   de erro, toasts, estados vazios, ou placeholder text.

9. **Sempre tratar loading, erro e estado vazio.** Nenhum componente sem esses
   três estados implementados. Estado vazio deve ter texto + CTA.

10. **Timer de descanso avança automaticamente.** Ao zerar, aguardar 500ms
    (para o usuário ver "0:00") e então chamar `aoCompletar()` sem interação.

### Segurança / Dados

11. **RLS em toda tabela do Supabase.** Nenhuma tabela com dados de usuário
    sem Row Level Security ativa. Verificar nas migrations.

12. **`usuario_id` em toda query.** Toda query Dexie filtra por `usuarioId`.
    Toda query Supabase usa `eq('usuario_id', userId)`. Nunca retornar todos os dados.

13. **Soft delete apenas.** Nunca `DELETE` físico. Usar `deletadoEm: timestamp`.

14. **Sem secrets no código.** Tudo via variáveis de ambiente.
    `SUPABASE_SERVICE_ROLE_KEY` nunca com prefixo `NEXT_PUBLIC_`.

### Sincronização

15. **`clientId` em sessões.** Todo registro `SessaoTreino` tem `clientId` UUID
    gerado client-side, separado do `id`. Usado para deduplicação no upsert.

16. **Fila de sync é persistente.** Mutations offline ficam na tabela `filaSync`
    do Dexie, não em memória. Sobrevivem a refresh e fechamento do app.

17. **Push antes de pull.** Ao sincronizar: sempre `pushParaServidor()` primeiro,
    depois `pullDoServidor()`. Evita sobrescrever dados locais novos com dados antigos.

18. **Máximo 5 tentativas.** Entrada da fila com 5+ tentativas é removida com log
    de aviso. Não acumular indefinidamente.

### Convenções de Código

19. **Conventional Commits em português:**
    ```
    feat(sessao): adicionar timer de descanso com avanço automático
    fix(sync): corrigir deduplicação por clientId
    refactor(db): extrair queries de sessão para repositório
    test(dominio): cobrir casos de erro na lógica de séries
    docs(claude): atualizar decisões de avatar
    chore(deps): atualizar dexie para 4.0.8
    ```

20. **Nomenclatura:**
    ```
    Arquivos:           kebab-case        → sessao-repository.ts
    Componentes React:  PascalCase        → CardExercicio.tsx
    Hooks:              camelCase + use   → useSessaoAtiva.ts
    Constantes:         SCREAMING_SNAKE   → TEMPO_DESCANSO_PADRAO
    Interfaces/Types:   PascalCase        → SessaoTreino, FichaTreino
    Tabelas DB:         snake_case plural → sessoes_treino, fichas_treino
    Colunas DB:         snake_case        → criado_em, usuario_id
    ```

21. **TypeScript strict.** Zero `any`. Dados externos tipados com Zod antes de usar.
    Retornos de funções públicas sempre explícitos.

---

## Contrato UX — Tela de Sessão (FichaTreinoPage)

Esta é a tela mais crítica. Regras não negociáveis:

```
┌────────────────────────────────────┐
│ [Nome da Ficha]          [offline] │  ← Header fixo, não-interativo
│ ████████████░░░░░░░░ 3/5           │  ← Barra de progresso
├────────────────────────────────────┤
│                                    │
│  Exercício 2 de 5          (small) │
│                                    │
│  Supino Reto             (h2, 28px+│
│                                    │
│  3    de 4 séries     (destaque)   │
│                                    │
│  [8-10 reps]  [Ref: 80 kg]         │
│                                    │
│  ████░░░░ (indicadores de séries)  │
│                                    │
├────────────────────────────────────┤
│  [  Reps  -  8  + ]  [ Peso -75+ ] │  ← InputNumerico
│                                    │
│  ┌──────────────────────────────┐  │
│  │     Registrar Série 3        │  │  ← ≥64px altura, largura total
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
         ↑ Tudo abaixo da linha de dobra
         ↑ Ações primárias no bottom 40%
```

- **Nenhum modal bloqueia** as informações do exercício durante uso ativo
- **Peso pré-preenchido** com o valor da última série daquele exercício
- **Timer aparece** onde estavam os inputs, não como overlay
- **NavInferior oculta** em `/sessao` — maximiza espaço
- **`aria-live="polite"`** na seção de conteúdo para anunciar mudanças a leitores de tela

---

## Schema do Banco (Supabase / PostgreSQL)

### Tabelas principais

| Tabela | Chave | RLS | Descrição |
|--------|-------|-----|-----------|
| `perfis_usuario` | `id` (FK auth.users) | ✅ | Nome + avatar_id |
| `exercicio_definicoes` | `id` | ✅ | Catálogo global (usuario_id=null) + custom |
| `fichas_treino` | `id` | ✅ | Fichas do usuário (soft delete) |
| `exercicios_ficha` | `id` | ✅ | Exercícios dentro de uma ficha |
| `sessoes_treino` | `id` (client-gen) | ✅ | Sessões — id gerado offline |
| `series_realizadas` | `id` | ✅ | Séries dentro de uma sessão |

### Campos críticos

- `sessoes_treino.client_id` → UUID único para deduplicação no sync
- `sessoes_treino.id` → gerado no cliente (não pelo servidor)
- `exercicio_definicoes.wger_id` → ID do exercício no wger (UNIQUE, evita duplicatas)
- Toda tabela tem `usuario_id UUID REFERENCES auth.users(id)`
- Colunas `deletado_em TIMESTAMPTZ` para soft delete

---

## Avatares (Estilo Duolingo)

12 opções pré-definidas em `src/shared/types/avatares.ts`:

```
avatar_01: Urso      (roxo)    avatar_07: Touro     (vermelho)
avatar_02: Leão      (âmbar)   avatar_08: Pantera   (escuro)
avatar_03: Tigre     (vermelho) avatar_09: Raposa   (laranja)
avatar_04: Águia     (azul)    avatar_10: Tubarão   (azul claro)
avatar_05: Lobo      (cinza)   avatar_11: Dragão    (violeta)
avatar_06: Gorila    (verde)   avatar_12: Robô      (teal)
```

Armazenado como `avatar_id` string em `perfis_usuario`.
Exibido via `<AvatarUsuario avatarId="avatar_03" tamanho="md" />`.

**Opção de implementação recomendada:** DiceBear API
```
https://api.dicebear.com/7.x/adventurer/svg?seed=urso&backgroundColor=8B5CF6
```
Elimina necessidade de SVGs locais. Gera determinístico pelo seed.

---

## API wger — Catálogo de Exercícios

```
Base URL:  https://wger.de/api/v2/
Endpoint:  GET /exercise/?format=json&language=8&limit=100
language:  8 = Português, 2 = Inglês (fallback)
```

**Fluxo de importação:**
1. Rota `POST /api/exercicios-seed` chamada uma vez após deploy
2. Verifica se catálogo já existe (≥50 registros) antes de importar
3. Importa até 3 páginas × 100 exercícios = ~300 exercícios
4. Upsert por `wger_id` para evitar duplicatas
5. `usuario_id = null` para exercícios do catálogo
6. Exercícios custom do usuário: `is_custom = true`, `usuario_id` preenchido

---

## Geração de Novos Módulos

Ao criar novos módulos, sempre gerar as 4 camadas nesta ordem:

```bash
# 1. Domínio — lógica pura, zero imports externos
src/modules/{nome}/domain/{NomeEntidade}.ts

# 2. Aplicação — hooks React + orquestração
src/modules/{nome}/application/use{NomeEntidade}.ts

# 3. Infraestrutura — persistência
src/modules/{nome}/infrastructure/{nome}Repository.ts   # Dexie
src/modules/{nome}/infrastructure/{nome}Supabase.ts     # Supabase

# 4. Apresentação — componentes
src/modules/{nome}/presentation/{NomePagina}.tsx
```

Ao criar rotas de API (`app/api/`), sempre incluir:
- Validação de input com Zod
- Autenticação via `createSupabaseServerClient()`
- Verificação de `user.id` antes de qualquer query
- Resposta de erro padronizada: `{ erro: string, codigo: string }`

---

## Checklist de PR / Antes de Commitar

- [ ] Todos os textos da UI estão em Português Brasil
- [ ] Touch targets ≥ 48px em elementos novos
- [ ] Estado de loading, erro e vazio implementados
- [ ] Sem `any` TypeScript novo
- [ ] Sem `console.log` commitado (use `console.warn` para avisos de dev)
- [ ] Sem segredos hardcoded
- [ ] Novas tabelas Supabase têm RLS ativa
- [ ] Queries filtram por `usuario_id`
- [ ] Testes de domínio atualizados se lógica mudou
- [ ] CLAUDE.md atualizado se uma decisão mudou

---

## Contexto de Expansão Multi-Usuário (Futuro)

Quando chegar a hora de abrir para outros usuários, estas decisões já foram tomadas:

- **RLS já ativa** em todas as tabelas — nenhuma migration necessária
- **`usuario_id` em todo registro** — isolamento de dados garantido
- **Auth via Supabase** — suporta múltiplos usuários nativamente
- **Próximos passos:** tela de cadastro, planos de assinatura (Stripe),
  e possivelmente Hostinger + Cloudflare para domínio custom

---

*Última atualização: decisões confirmadas pelo dono do projeto*
*Avatar: conjunto pré-definido (Duolingo style) — sem foto de perfil*
*Histórico: completo, sem limite de data*
*Domínio: URL Vercel auto-gerada por enquanto*
