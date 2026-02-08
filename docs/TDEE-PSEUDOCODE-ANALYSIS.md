# Análise do Pseudocódigo TDEE v2 — MVP + Calibrável

*Análise por Lola — 2026-02-08*

---

## Estrutura Recebida

Robson entregou 4 blocos:
1. **MVP** — ρ e ε fixos, produz daily + window_summary + baseline
2. **Calibrável** — ρ e ε estimados por janela com Ridge + suavidade temporal
3. **Defaults** — valores iniciais recomendados
4. **Produto** — o que aparece no painel

---

## Análise Bloco a Bloco

### Bloco 1: MVP (ρ/ε fixos)

**Fluxo:**
```
sort → smooth(BW) → derivada → baseline(Mifflin) → loop diário → janelas → output
```

**Observações técnicas:**

1. **Suavização:** MA7 ou EMA. Para dados esparsos (paciente pesa 2-3x/semana), MA7 puro vai ter gaps.
   - **Decisão necessária:** interpolar gaps antes de suavizar, ou usar EMA que lida naturalmente?
   - **Minha sugestão:** EMA com α=0.25 como default — mais robusto para dados esparsos reais dos nossos pacientes.

2. **Derivada:** `dBWdt[t] = (BW_s[t] - BW_s[t-1]) / delta_days(t, t-1)`
   - O `delta_days` é crucial — se paciente pesa segunda e quinta, delta = 3 dias.
   - Implementação direta, sem problema.

3. **Baseline:** Mifflin-St Jeor + PAL
   - Homem: `BMR = 10×peso + 6.25×altura − 5×idade − 5`
   - Mulher: `BMR = 10×peso + 6.25×altura − 5×idade − 161`
   - PAL default 1.6 → `EI_0 = EE_0 = BMR × PAL`
   - **Dados necessários:** sexo, idade, altura → já temos na Goals (P6:S6)
   - **Questão:** Precisamos expor esses campos no endpoint `/api/patients/:id`

4. **Loop diário:**
   ```
   delta_EI = eps × (BW_s[t] - BW0) + rho × dBWdt[t]
   EI_model = EI0 + delta_EI
   EE_model = EE0 + eps × (BW_s[t] - BW0)
   bias = EI_rep - EI_model
   adherence = EI_rep / EI_model
   ```
   - Simples e elegante. O eps atua como "desconto metabólico" no EE conforme peso cai.
   - Nota: EI_rep é NaN quando não tem food log → bias/adherence ficam NaN (correto).

5. **Window summaries:** Mediana (não média) → resistente a outliers. Excelente.

**Veredicto MVP:** ✅ Implementável direto. ~100-150 linhas de TypeScript.

---

### Bloco 2: Calibrável (ρ/ε por janela)

**Conceito:** Regressão linear regularizada por janela, onde:
- `y[t] = EI_rep[t] - EI0` (variação do intake reportado)
- `x1[t] = BW_s[t] - BW0` (variação do peso)
- `x2[t] = dBWdt[t]` (derivada do peso)
- Resolve: `y = ε·x1 + ρ·x2 + b + η`

**Regularização (4 termos):**
- `λ_ε(ε_j - ε_prior)²` → puxa ε pro prior (Ridge)
- `λ_ρ(ρ_j - ρ_prior)²` → puxa ρ pro prior (Ridge)
- `γ_ε(ε_j - ε_{j-1})²` → suavidade temporal de ε
- `γ_ρ(ρ_j - ρ_{j-1})²` → suavidade temporal de ρ

**Observações:**

1. **Resolver `argmin_quadratic`:** Isso é um sistema linear (derivada → igualar a zero → sistema 3×3). Não precisa de otimizador numérico.
   - A solução analítica é: `(X^T X + Λ)β = X^T y + Λ_prior × prior + Γ × prev`
   - Implementável sem dependência externa (pure TS math).

2. **`b_j` (intercepto):** Captura bias sistemático naquela janela. Se `b_j` é consistentemente negativo, o paciente está sub-relatando sistematicamente. Muito útil clinicamente.

3. **Dados mínimos por janela:** ≥7 dias com EI + ≥4 pesos. Realista para nossos pacientes? 
   - Paciente ativo: ~5 food logs/semana + 2-3 pesagens → em janela de 14 dias: ~10 EI + ~5 pesos ✅
   - Paciente pouco aderente: ~2 food logs/semana + 1 pesagem → em 14 dias: ~4 EI + ~2 pesos ❌
   - **Fallback:** quando dados insuficientes para calibrar, usar MVP (ε/ρ fixos).

4. **Gammas altos (50-200):** Isso é agressivo na suavidade — ε e ρ vão mudar devagar entre janelas. Bom para MVP, evita overfitting.

**Veredicto Calibrável:** ⚠️ Implementável mas mais complexo (~200-250 linhas). Resolver sistema 3×3 com regularização requer algebra matricial (ou desdobrar manualmente). Sugiro implementar após validar o MVP.

---

### Bloco 3: Defaults

| Parâmetro | Valor | Notas |
|-----------|-------|-------|
| smoothing | MA7 ou EMA α≈0.25 | Prefiro EMA para dados esparsos |
| window_days | 14 (default), 7 (opção) | 14 mais robusto |
| min_points/janela | ≥7 EI + ≥4 pesos | Fallback pro MVP se não atingir |
| rho_default | 8500 kcal/kg | Nosso atual usa 7000 — muda significativamente |
| eps_default | 22 kcal/kg/d | Novo parâmetro |
| λ_ε, λ_ρ | 10-50 | Ridge moderado |
| γ_ε, γ_ρ | 50-200 | Suavidade forte |

**Nota sobre ρ = 8500:** Isso é mais alto que o "consenso" de 7700. Faz sentido se a perda de peso inclui mais tecido magro (que tem ρ menor). Para pacientes com tirzepatida, a composição da perda pode variar.

---

## Decisões Pendentes (para discutir)

### 1. Implementar MVP primeiro ou ir direto pro Calibrável?
**Minha recomendação:** MVP primeiro. Motivos:
- Mais simples de validar clinicamente
- Se os defaults estiverem razoáveis, já entrega valor
- O calibrável depende de ter dados suficientes por janela (que pacientes novos não têm)
- Podemos ter fallback: calibrável quando tem dados, MVP quando não tem

### 2. EMA vs MA7 para suavização?
**Minha recomendação:** EMA (α=0.25) como default.
- Nossos pacientes pesam 2-3x/semana, não diariamente
- EMA lida melhor com gaps
- MA7 assume dados uniformemente espaçados

### 3. Como expor dados antropométricos no frontend?
Opções:
- A) Adicionar campos ao endpoint existente `/api/patients/:id`
- B) Endpoint separado `/api/patients/:id/profile`
**Recomendo A** — mais simples, já buscamos patient data no Dashboard.

### 4. Como apresentar bias para o paciente?
O bias é sensível — dizer "você está sub-relatando" pode desmotivar.
Opções:
- "Precisão do registro: 85%" (positivo)
- "Aderência ao protocolo: 92%" (foco no comportamento)
- Mostrar bias absoluto apenas pro admin

### 5. Onde mostra no app?
- **TDEECard atual → substituir** por novo com EE_model + bias + aderência
- **Aba Atividades** → poderia ter um card de aderência
- **Admin** → visão completa com flags e b_j

---

## Plano de Implementação Sugerido

### Fase 1: MVP (ρ/ε fixos)
1. `tdeeCalculatorV2.ts` — lógica pura (testável isolada)
2. Endpoint: `GET /api/patients/:id/energy-model` (server-side, evita cálculo no browser)
3. `TDEECardV2.tsx` — UI com EE_model, bias, aderência, confiança
4. Testar com dados fictícios do Robson → validar clinicamente

### Fase 2: Calibrável
5. Adicionar `estimate_energy_calibrated()` no mesmo módulo
6. Resolver sistema 3×3 regularizado (pure TS, sem deps)
7. Usar calibrável quando dados suficientes, fallback MVP
8. Painel admin com ε/ρ estimados por janela + flags

### Fase 3: Refinamento
9. Calibrar lambdas/gammas com dados de 10-20 pacientes reais
10. Integrar passos/atividade para decomposição do bias
11. Projeções ("a esse ritmo, em X semanas atinge peso Y")

---

*Próximo passo: Robson decide se partimos pro MVP ou discute mais algum ponto.*
