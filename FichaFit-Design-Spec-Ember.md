# FichaFit — Especificação de Design (Direção "Ember")

> Documento de handoff para implementação. Descreve o redesign visual e de UX do FichaFit
> (PWA offline-first de fichas de treino, uso com uma mão durante a sessão).
> Direção escolhida: **Ember** — estética de pôster de academia: condensada, ousada,
> motivacional, com tema escuro por padrão e tema claro disponível.
>
> **Como usar:** adapte o projeto atual aos tokens, componentes e specs de tela abaixo.
> Não altere a arquitetura de dados/offline — só a camada de UI/estilo e a estrutura das telas.

---

## 1. Princípios de design (guiam todas as decisões)

1. **Menos espaço morto.** Nenhuma tela deve ficar com um bloco centralizado cercado de vazio.
   A tela de treino ativo é preenchida com informação útil: última carga, meta de reps e séries já registradas.
2. **Zona do polegar.** Ações primárias ficam ancoradas na base da tela. Steppers grandes.
   Tudo alcançável com uma mão.
3. **Feedback constante.** Toda ação responde: barra de progresso, checks nas séries concluídas,
   anel no timer de descanso, delta de carga vs. última vez, microvibração (haptics) quando disponível.
4. **Ícones de linha, não emojis.** Substituir todos os emojis (🐂, 🎉, 📚, etc.) por ícones de
   contorno consistentes (stroke 1.8px).
5. **Dois temas.** Escuro por padrão (academia tem iluminação variável); claro disponível via toggle
   (manual + respeita `prefers-color-scheme`).
6. **Botões na medida certa.** CTAs com ~54px de altura (não blocos gigantes). Largura cheia só para
   a ação primária; ações secundárias menores ou em texto.

---

## 2. Tokens de cor

Implementar como CSS custom properties, trocando o conjunto via `[data-theme="dark"]` / `[data-theme="light"]`.

### Tema escuro (padrão)
| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#121010` | Fundo da tela |
| `--surface` | `#1D1916` | Cards, inputs, steppers |
| `--surface-2` | `#28221C` | Tracks de progresso, chips, hover |
| `--nav-bg` | `#181513` | Barra de navegação inferior |
| `--border` | `rgba(255,255,255,0.07)` | Bordas de cards |
| `--text` | `#F7F4F0` | Texto principal |
| `--text-muted` | `#A89B8C` | Texto secundário |
| `--text-dim` | `#8A7C6A` | Labels/rótulos pequenos |
| `--accent` | `#FB923C` | Cor de destaque (ícones, ativo, números) |
| `--accent-2` | `#F59E0B` | Fim do gradiente |
| `--accent-grad` | `linear-gradient(135deg,#FB923C,#F59E0B)` | Botões primários, FAB, play |
| `--accent-on` | `#1A1208` | Texto/ícone sobre accent |
| `--accent-soft-bg` | `rgba(251,146,60,0.10)` | Fundo de chip/série concluída |
| `--accent-soft-border` | `rgba(251,146,60,0.28)` | Borda de série concluída |

### Tema claro
| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#FAF7F2` | Fundo (off-white quente) |
| `--surface` | `#FFFFFF` | Cards, inputs |
| `--surface-2` | `#F4EEE5` | Chips, botões neutros |
| `--nav-bg` | `#FFFFFF` | Barra de navegação |
| `--border` | `#ECE5DA` | Bordas |
| `--text` | `#1A1714` | Texto principal |
| `--text-muted` | `#8A7C6A` | Texto secundário |
| `--text-dim` | `#B0A08C` | Labels pequenos |
| `--accent` | `#D97706` | **Accent para texto/ícone** (amber-600, contraste AA sobre branco) |
| `--accent-grad` | `linear-gradient(135deg,#FB923C,#F59E0B)` | Botões primários, FAB, play |
| `--accent-on` | `#1A1208` | Texto/ícone sobre accent |
| `--accent-soft-bg` | `rgba(217,119,6,0.10)` | Fundos suaves |

> **Regra de contraste:** sobre fundos claros, use `--accent` (`#D97706`) para textos e ícones — nunca
> o laranja `#FB923C` puro em texto pequeno (reprova em contraste). O gradiente só em superfícies de botão.

---

## 3. Tipografia

Carregar via Google Fonts:
`Oswald` (400,500,600,700), `Bebas Neue` (400), `Archivo` (400,500,600,700,800).

| Papel | Fonte | Specs |
|---|---|---|
| Títulos de tela / nomes de exercício / botões | **Oswald** 600 | `text-transform: uppercase; letter-spacing: 0.01em` |
| Números de destaque (timer, stats, sequência) | **Bebas Neue** | line-height ~0.9; tamanho grande |
| Texto corrido / labels / metadados | **Archivo** | 400–700 |

Escala (mobile):
- Título de tela: Oswald 600, **30px**, uppercase
- Nome de exercício (treino ativo): Oswald 600, **34px**, uppercase
- Nome de ficha (card): Oswald 600, **20px**, uppercase
- Timer de descanso: Bebas Neue, **74px**
- Stat number (resumo): Bebas Neue, **34px**
- Body: Archivo 400, **13–15px**
- Label/rótulo (uppercase): Archivo/Oswald 600, **10–11px**, `letter-spacing: 0.06–0.1em`

---

## 4. Espaçamento, raio e sombra

- **Grid base:** 4px. Paddings comuns: 14–20px nas telas; 14–16px dentro de cards.
- **Raios:** cards de ficha/histórico `16–18px`; inputs/steppers `14px`; botões `16px`;
  chips `8–11px`; FAB `18px`; play/ícone-quadrado `13px`; pílulas/badges `999px`.
- **Sombra de botão accent:** `0 10px 24px -8px rgba(251,146,60,0.55)`.
- **Sombra de card (tema claro):** `0 1px 2px rgba(0,0,0,0.04)`.
- **Gap entre cards de lista:** 12px. **Gap em grids de stats:** 10px.
- **Altura da nav inferior:** 64px (+ safe-area-inset-bottom).
- **Alvos de toque:** mínimo **44×44px** (steppers 52px de altura; botões 54px).

---

## 5. Iconografia

Ícones de **contorno**, `stroke: currentColor`, `stroke-width: 1.8` (2.2 nos botões +/−),
`stroke-linecap/linejoin: round`, viewBox `0 0 24 24`. Conjunto mínimo:

- **Nav:** halteres (Treinos), calendário (Histórico), livro (Exercícios), usuário (Perfil)
- **Ações:** `+` (plus), `−` (minus), check, `×` (close), play (preenchido), chevron-left/up/down
- **Meta/feedback:** chama (sequência/streak), relógio (duração), troféu (recorde/conclusão)

Tamanhos: nav 22px; meta de card 13px; steppers 20px; ícone de conclusão 34px.
Remover **todos** os emojis atuais.

---

## 6. Componentes

### Botão primário
- Altura 54px, raio 16px, `background: var(--accent-grad)`, texto `var(--accent-on)`.
- Tipografia: Oswald 600 uppercase, 17px, `letter-spacing: 0.02em`.
- Sombra accent. Estado `:active` → `transform: scale(0.98)`.

### Botão secundário / neutro
- Altura 48–54px, raio 14–16px, `background: var(--surface)`, borda `var(--border)`, texto `var(--text)`.
- Usado em "−15s / +15s", "Pular descanso", "Cancelar".

### Ação destrutiva ("Excluir ficha")
- Apenas texto, cor vermelha (`#EF4444` dark / `#DC2626` light), centralizado, sem bloco de fundo.

### Card de ficha (lista "Minhas Fichas")
- `background: var(--surface)`, borda `var(--border)`, raio 16px, padding 15×16px.
- Linha 1: nome (Oswald 20px uppercase) à esquerda + botão **play** circular/quadrado à direita.
  - Card em foco/recomendado: borda esquerda `3px solid var(--accent)`.
  - Play do primeiro card: `var(--accent-grad)` com ícone `var(--accent-on)`; demais: `--surface-2` com ícone `--text`.
- Linha 2 (metadados): subtítulo de grupos musculares (`Peito · Tríceps`).
- Linha 3 (chips de meta): `[icone] 6 exercícios`  ·  `[icone] ~45 min`.
- Card inteiro é clicável (abre detalhe). O play inicia o treino direto.

### FAB "Nova ficha"
- 56×56px, raio 18px, `var(--accent-grad)`, ícone `+` em `var(--accent-on)`.
- Posição: `position: fixed; right: 16px; bottom: 80px` (acima da nav). Sombra accent.
- Substitui o botão gigante "Nova Ficha" da versão atual.

### Stepper (reps / peso)
- Container 52px de altura, raio 14px, `--surface`, borda `--border`, layout flex.
- `[−]` (44px, cor muted) · valor central (Oswald 22px) · `[+]` (44px, cor accent).
- Long-press acelera o incremento. Peso incrementa em 2,5kg (configurável); reps em 1.

### Chip de série concluída
- `background: var(--accent-soft-bg)`, borda `var(--accent-soft-border)`, raio 11px, padding 8×12px.
- Esquerda: `Série N` (muted). Direita: `10 × 80 kg` + ícone check accent.

### Barra de progresso
- Track 5px, raio 999px, `--surface-2`. Fill `var(--accent-grad)`, raio 999px, com transição de largura.

### Anel do timer (descanso)
- SVG 200×200, dois círculos r=88, stroke-width 12.
- Trilho `--surface-2`; progresso `var(--accent)`, `stroke-linecap: round`, girado −90°,
  animado por `stroke-dashoffset` (circunferência ≈ 553).
- Centro: número Bebas Neue 74px em `var(--accent)` + "de 2:00" pequeno em `--text-dim`.

### Card de stat (resumo / histórico)
- `--surface`, borda `--border`, raio 14px, padding 14px.
- Número Bebas Neue 34px + rótulo Archivo 11px muted. Card de destaque usa `--accent-soft-bg`.

### Barra de navegação inferior
- 64px, `--nav-bg`, borda superior `--border`, 4 itens distribuídos.
- Item: ícone 22px + label 10px. Ativo = `var(--accent)` (dark) / `#D97706` (light) + label 600.
  Inativo = `--text-dim`. Respeitar `env(safe-area-inset-bottom)`.

---

## 7. Especificação por tela

### 7.1 Minhas Fichas (home)
- Header: rótulo de dia (`QUARTA-FEIRA`, Oswald uppercase, accent) + título `Minhas Fichas`
  + badge de sequência (chama + número) à direita.
- Lista de cards de ficha (ver componente). Primeiro card com borda-accent à esquerda.
- **Estado vazio:** ilustração simples em linha (não emoji) + texto curto + o FAB visível.
  Texto: "Nenhuma ficha ainda. Toque em + para criar a primeira."
- FAB "+" fixo. Nav inferior com "Treinos" ativo.

### 7.2 Detalhe da ficha (montar treino)
- Header: chevron-left + nome da ficha (Oswald uppercase).
- Lista de exercícios como cards: nome + `3 séries · 8–12 reps · 90s` em metadados;
  controles de reordenar (handle de arrastar OU setas ↑/↓) e remover (×) à direita.
- Botão secundário "Adicionar exercício" + **botão primário "Iniciar Treino"** (desabilitado
  com aparência clara enquanto não houver exercícios).
- "Excluir ficha" como link destrutivo no rodapé.

### 7.3 Adicionar exercício (form)
- Campos: nome (com autocomplete do catálogo), Séries / Descanso(s) / Reps mín. / Reps máx.
  em grade 2×2, Carga de referência (opcional).
- Inputs no estilo `--surface` + borda. Primário "Adicionar exercício" + secundário "Cancelar".

### 7.4 Treino ativo — registrar série  ⭐ (tela mais crítica)
- Topo: chevron-left + nome da ficha + `Ex. 2 de 4` + **barra de progresso** do treino.
- Bloco do exercício: rótulo `EXERCÍCIO 2 DE 4` (accent) + nome (Oswald 34px) +
  **indicador de séries em "dots"** (barras: concluídas accent, atual destacada, futuras `--surface-2`)
  + texto `Série 3 de 3`.
- **Cartões de referência (preenchem o vazio):**
  - `ÚLTIMA VEZ` → `8 × 80 kg` (puxar do histórico do mesmo exercício).
  - `META REPS` → `8 – 12`.
- **Séries já registradas** listadas como chips com check (Série 1, Série 2…).
- **Zona do polegar (base):** steppers grandes de Repetições e Peso lado a lado +
  **botão primário "Registrar Série N"** com gradiente de fade do fundo acima.
- Link discreto "Encerrar treino" abaixo. Após registrar, ir para o estado de descanso (7.5).
- Mostrar delta opcional ("+2,5 kg vs. última") quando o peso superar a referência.

### 7.5 Descanso (timer)
- Mesmo topo (nome + progresso).
- Centro: rótulo `DESCANSO` + **anel de timer** com número Bebas 74px (contagem regressiva).
- **Cartão "A SEGUIR":** próximo exercício/série + meta (`Supino Reto · Série 3 · Meta 8–12 · 80 kg`).
- Ações na base: `−15s` / `+15s` (secundários) + **"Pular descanso"** (primário).
- Comportamento: tocar/vibrar ao zerar; manter contagem mesmo com tela bloqueada (offline-safe).

### 7.6 Treino completo (resumo)
- Barra de progresso 100% no topo.
- Ícone de troféu em "badge" circular accent-soft + título `TREINO CONCLUÍDO!` (Oswald) + subtítulo.
- **Grade 2×2 de stats** (Bebas): Duração, Séries, Volume total (kg), Recordes (card destaque accent).
- Botão primário "Concluir Treino" (salva no histórico). Link "Encerrar sem concluir".
- Substituir o emoji 🎉 pelo troféu/checkmark em ícone.

### 7.7 Histórico
- Título `Histórico` + **resumo da semana** (2 cards Bebas): "Esta semana: 3 treinos" e
  "Sequência: 5 dias" (número em accent).
- Lista de sessões: card por treino com nome (Oswald) + `Hoje · 42 min` à direita +
  chips de resumo (`6 exercícios`, `12 séries`, `2 PRs` em accent). Tocar abre o detalhe da sessão.
- Detalhe da sessão: como hoje (séries por exercício), mas com tipografia/cores novas.

### 7.8 Perfil
- Cartão de identidade: avatar + "Atleta local" + "Usando sem conta — dados só neste aparelho".
- Grade de avatares para escolher (manter funcionalidade; aplicar anel accent no selecionado).
- **Card de Sincronização:** "N alterações aguardando envio" + botão primário "Entrar para sincronizar".
- **Adicionar toggle de tema** (Sistema / Claro / Escuro) neste perfil.

### 7.9 Exercícios (catálogo)
- Campo de busca (estilo input). Estado vazio: ícone de livro (linha) + texto +
  botão primário "Baixar catálogo de exercícios" + secundário "Criar exercício próprio".
- Resultados em lista de cards simples (nome + grupo muscular + chevron).

---

## 8. Microinterações & feedback

- **Registrar série:** chip surge com animação curta (fade+slide 150ms) + check; haptic leve.
- **Barra/anel:** transições suaves de `width`/`stroke-dashoffset` (200–300ms ease).
- **Botões:** `:active { transform: scale(0.98) }`; estados disabled com opacidade ~0.45.
- **Fim do timer:** vibração (`navigator.vibrate`) + som curto opcional; anel pulsa.
- **Conclusão de treino:** entrada do troféu com leve "pop" (scale 0.9→1, 250ms).
- **PR/recorde:** destacar em accent quando a carga/volume superar o histórico.
- Respeitar `prefers-reduced-motion` (desligar animações não essenciais).

---

## 9. Acessibilidade & PWA

- Contraste mínimo AA: usar `--accent` (`#D97706`) para accent em texto no tema claro.
- Alvos de toque ≥ 44px; foco visível em inputs/botões.
- `env(safe-area-inset-*)` na nav e nos rodapés de ação (iPhone notch/home bar).
- Tema escuro como padrão; `theme-color` do manifest deve acompanhar o tema ativo.
- Tudo deve funcionar offline (não introduzir dependências de rede para renderizar UI).

---

## 10. Resumo do "antes → depois"

| Problema atual | Solução nesta spec |
|---|---|
| Telas com muito espaço vazio | Treino ativo preenchido com referência (última vez/meta) e séries feitas |
| Botões grandes demais | CTAs de 54px; FAB para "Nova ficha"; secundários menores |
| Falta de feedback | Progresso, dots de série, chips com check, anel de timer, deltas/PRs |
| Emojis | Ícones de linha consistentes (stroke 1.8) |
| Só tema claro cru | Escuro por padrão + claro via toggle (tokens prontos) |
| Hierarquia fraca | Oswald uppercase nos títulos, Bebas nos números, Archivo no corpo |
