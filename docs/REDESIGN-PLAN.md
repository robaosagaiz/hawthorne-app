# Hawthorne App — Plano de Redesign Completo v2.0

> **Data:** 2026-02-08
> **Status:** Planejamento — aguardando aprovação do Robson
> **Branch:** `feature/redesign-v2` (a ser criada)

---

## 🎯 Visão Geral

Transformar o Hawthorne de um dashboard funcional em uma **experiência de app de saúde premium**, focada no paciente como usuário principal. Inspirações: Noom, Fitia, Lifesum, Lose It!, Apple Health.

**Princípio central:** O paciente abre o app e em 3 segundos entende: *como foi meu dia, como estou no protocolo, o que preciso fazer.*

---

## 📐 Arquitetura de Telas

### Paciente (4 telas)

| Tela | O que mostra | Componente |
|------|-------------|------------|
| **Hoje** | Ring de calorias, macros, peso, última refeição, TDEE | `TodayView.tsx` (NOVA) |
| **Evolução** | Gráficos de peso, energia, tendências, TDEE timeline | `ProgressView.tsx` (NOVA) |
| **Atividades** | Exercícios, passos, classificação | `ActivitySection.tsx` (refatorar) |
| **Perfil** | Metas, dados pessoais, configurações | `ProfileView.tsx` (NOVA) |

### Admin (3 telas — manter estrutura atual, polir)

| Tela | O que mostra | Componente |
|------|-------------|------------|
| **Pacientes** | Lista com cards resumo | `PatientList.tsx` (refatorar) |
| **Dashboard Paciente** | Visão detalhada + técnica | `AdminPatientView.tsx` (refatorar) |
| **Gestão** | Goals, protocolos, cadastro | `GoalsManager.tsx` (refatorar) |

---

## 🏗️ Fases de Implementação

### Fase 1 — Fundação (3-4 horas)
> Preparar terreno sem quebrar nada

- [ ] **1.1** Criar branch `feature/redesign-v2` a partir de `main`
- [ ] **1.2** Commit do estado atual (Activities + TDEE v2 + UI tweaks) antes de iniciar
- [ ] **1.3** Instalar dependências adicionais:
  - `framer-motion` — animações fluidas (transições de tela, entradas de cards)
  - `date-fns` — formatação de datas consistente (substituir manipulação manual)
  - Verificar: `recharts` já instalado (manter para gráficos)
- [ ] **1.4** Design tokens — criar `src/styles/tokens.ts`:
  ```ts
  export const colors = {
    primary: '#10B981',     // emerald-500 (saúde, progresso)
    secondary: '#0EA5E9',   // sky-500 (informação)
    warning: '#F59E0B',     // amber-500 (atenção)
    danger: '#EF4444',      // red-500 (alerta)
    surface: '#FFFFFF',
    background: '#F8FAFC',  // slate-50
    text: '#1E293B',        // slate-800
    textMuted: '#64748B',   // slate-500
  };
  
  export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
  ```
- [ ] **1.5** Bottom navigation component (`BottomNav.tsx`) — mobile-first:
  - 4 ícones: Hoje | Evolução | Atividades | Perfil
  - Badge de notificação no "Hoje" (se não registrou refeição)
  - Sticky bottom, 56px altura, safe-area aware

### Fase 2 — Tela "Hoje" (4-5 horas)
> **O coração do app** — onde o paciente passa 80% do tempo

- [ ] **2.1** `TodayView.tsx` — layout vertical scrollable:
  ```
  ┌─────────────────────────┐
  │  Saudação + Data        │  "Bom dia, Robson! 🌞"
  │  Streak counter         │  "🔥 12 dias seguidos"
  ├─────────────────────────┤
  │    ┌──────────────┐     │
  │    │  RING CHART  │     │  Calorias consumidas / meta
  │    │  1.450/2.000 │     │  Ring SVG animado
  │    │    kcal      │     │
  │    └──────────────┘     │
  │  [Prot 85g] [Carb 120g] │  Mini progress bars
  │  [Gord 45g]             │
  ├─────────────────────────┤
  │  ⚖️ Peso Atual          │  84.5 kg (↓0.3 desde última)
  │  📊 Seu Gasto           │  2.895 kcal/dia (TDEE ring)
  ├─────────────────────────┤
  │  📋 Refeições de Hoje   │
  │  ┌─ Café da manhã ──┐  │  Card expansível com foto
  │  │  Pão integral...  │  │  
  │  └──────────────────┘  │
  │  ┌─ Almoço ─────────┐  │
  │  │  Frango grelhado..│  │
  │  └──────────────────┘  │
  ├─────────────────────────┤
  │  💡 Dica do dia         │  Contextual (baseada nos dados)
  └─────────────────────────┘
  ```

- [ ] **2.2** `CalorieRing.tsx` — componente SVG:
  - Ring animado (stroke-dasharray) com gradiente
  - Centro: calorias consumidas / meta
  - Cor muda: verde (dentro), amarelo (perto), vermelho (acima)
  - Animação de entrada (0 → valor atual em 1s)

- [ ] **2.3** `MacroProgressBars.tsx`:
  - 3 barras horizontais (proteína, carb, gordura)
  - Ícones coloridos + valor numérico + % da meta
  - Animação de preenchimento

- [ ] **2.4** `MealCards.tsx` — refeições do dia:
  - Agrupadas por período (Manhã, Almoço, Tarde, Noite)
  - Cada card: hora, descrição resumida, calorias
  - Expansível para ver detalhes + foto (se disponível)
  - Estado vazio: "Nenhuma refeição registrada — envie uma foto pelo WhatsApp!"

- [ ] **2.5** `StreakCounter.tsx`:
  - Conta dias consecutivos com registro
  - Badge animado tipo 🔥
  - Frase motivacional quando atinge milestones (7, 14, 30 dias)

- [ ] **2.6** `DailyTip.tsx`:
  - Dicas contextuais baseadas nos dados:
    - Proteína baixa → "Que tal incluir mais proteína no jantar?"
    - Sem registro → "Não esqueça de fotografar suas refeições!"
    - Peso caindo → "Seu progresso está ótimo! Continue assim 💪"

### Fase 3 — Tela "Evolução" (3-4 horas)
> Gráficos e tendências — onde o paciente se motiva

- [ ] **3.1** `ProgressView.tsx` — layout:
  ```
  ┌─────────────────────────┐
  │  Período: [7d][30d][All]│  Toggle de período
  ├─────────────────────────┤
  │  📊 Resumo do Período   │
  │  Peso: -2.3 kg          │  Cards horizontais
  │  Média: 1.650 kcal      │  scrolláveis
  │  Aderência: 85%         │
  ├─────────────────────────┤
  │  ⚖️ Evolução do Peso    │  Gráfico com linha suave
  │  ~~~~~~~~~~~~~~~~~~~~~~~~│  + EMA overlay
  │     ↘ tendência          │
  ├─────────────────────────┤
  │  🔥 Energia Diária      │  Bar chart colorido
  │  ████ ███ ██████ █████  │  + linha de meta
  ├─────────────────────────┤
  │  📈 Seu Gasto Energético│  TDEE timeline
  │  (TDEECardV2 compacto)  │  Ring + precisão
  ├─────────────────────────┤
  │  📋 Registro Diário     │  Tabela expansível
  └─────────────────────────┘
  ```

- [ ] **3.2** Refatorar `WeightChart.tsx`:
  - Adicionar linha EMA (peso suavizado) além dos pontos reais
  - Tooltip com data formatada
  - Área sombreada para zona-alvo de peso

- [ ] **3.3** Refatorar `EnergyChart.tsx`:
  - Barras com cores por faixa (abaixo/dentro/acima da meta)
  - Linha horizontal de meta diária
  - Média móvel de 7 dias

- [ ] **3.4** `PeriodSummaryCards.tsx`:
  - Scroll horizontal de mini-cards
  - Dados: perda de peso, média calórica, aderência, macros médios
  - Animações de contagem (número sobe de 0 ao valor)

### Fase 4 — Tela "Atividades" (2-3 horas)
> Refatorar o ActivitySection existente

- [ ] **4.1** Reorganizar layout:
  - Card principal: classificação (Ativo/Sedentário) com ícone grande
  - Timeline de atividades recentes (vertical, estilo feed)
  - Cards separados: Força, Cardio, Passos (com ícones e gráficos mini)

- [ ] **4.2** `StepsChart.tsx` — gráfico de barras diário de passos
- [ ] **4.3** `WorkoutTimeline.tsx` — feed vertical de atividades recentes
- [ ] **4.4** Integrar peso nesta tela (gráfico compacto)

### Fase 5 — Tela "Perfil" (1-2 horas)
> Informações pessoais e configurações

- [ ] **5.1** `ProfileView.tsx`:
  - Avatar com iniciais
  - Dados do protocolo (peso inicial, meta, data início)
  - Metas diárias (visualização, não edição)
  - Link para WhatsApp da clínica
  - Logout

### Fase 6 — Admin Polish (2-3 horas)
> Melhorias no painel administrativo

- [ ] **6.1** `PatientList.tsx` — redesign:
  - Cards com mini-ring de calorias do dia
  - Indicador de aderência (verde/amarelo/vermelho)
  - Último registro (tempo relativo: "há 2 horas")
  - Filtros: todos, ativos hoje, inativos

- [ ] **6.2** Admin Dashboard do paciente:
  - Manter visão técnica completa (TDEE expandido, janelas, bias)
  - Adicionar: alertas automáticos (paciente sem registro há 2+ dias)
  - Quick actions: ajustar metas, enviar mensagem

### Fase 7 — Polimento Final (2-3 horas)

- [ ] **7.1** Loading states com Skeleton em todas as telas
- [ ] **7.2** Empty states com ilustrações simples e CTAs
- [ ] **7.3** Animações de transição entre telas (Framer Motion)
- [ ] **7.4** Pull-to-refresh (PWA gesture)
- [ ] **7.5** Testar em mobile real (responsive breakpoints)
- [ ] **7.6** Performance: lazy loading de gráficos, code splitting por rota
- [ ] **7.7** Dark mode (tokens já preparados na Fase 1)

---

## 📱 Decisões de Design

### Mobile-First
- **Bottom nav** para pacientes (não sidebar)
- Touch targets mínimos de 44px
- Scroll vertical natural (sem tabs horizontais internos)
- Cards com border-radius generoso (16px)

### Hierarquia Visual
1. **Ring de calorias** — o dado mais importante, sempre visível
2. **Peso** — segundo dado mais relevante
3. **Macros** — detalhamento nutricional
4. **TDEE** — contexto energético (secondary)

### Paleta
- **Primário:** Emerald/Teal (saúde, crescimento, Hawthorne)
- **Secundário:** Sky blue (informação, TDEE)
- **Acento:** Amber (atenção), Red (alerta)
- **Background:** Slate-50 (clean, não snow white)

### Tipografia
- Headers: `Inter` ou system font (bold, large)
- Body: system font (regular, legível)
- Números: `tabular-nums` (alinhamento em tabelas)

---

## ⚠️ Regras de Segurança

1. **Branch dedicada** — tudo em `feature/redesign-v2`, zero mexida na `main`
2. **Backend intocado** — redesign é 100% frontend; `server/index.js` não muda
3. **Dados reais preservados** — nenhuma alteração em endpoints ou Google Sheets
4. **Rollback fácil** — se algo der errado, `git checkout main` e pronto
5. **Teste local** — Robson valida em `100.114.182.121:5173` antes de merge
6. **Commit frequente** — commits por componente (granulares, revertíveis)

---

## 🕐 Estimativa Total

| Fase | Horas | Prioridade |
|------|-------|------------|
| 1. Fundação | 3-4h | 🔴 Essencial |
| 2. Tela Hoje | 4-5h | 🔴 Essencial |
| 3. Tela Evolução | 3-4h | 🔴 Essencial |
| 4. Atividades | 2-3h | 🟡 Importante |
| 5. Perfil | 1-2h | 🟡 Importante |
| 6. Admin Polish | 2-3h | 🟢 Nice to have |
| 7. Polimento | 2-3h | 🟢 Nice to have |
| **Total** | **~18-24h** | — |

**Sugestão:** Fases 1-3 primeiro (core patient experience, ~11-13h), depois 4-7.

---

## 📋 Checklist Pré-Início

- [ ] Robson aprova este plano
- [ ] Commit do estado atual em `main` (Activities + TDEE v2)
- [ ] Branch `feature/redesign-v2` criada
- [ ] Dependências instaladas
- [ ] Decidir: manter a lógica `feature/v2-dashboard` local existente ou partir fresh?

---

*Criado por Lola — 08/02/2026*
