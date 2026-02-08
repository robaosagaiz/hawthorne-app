# Análise: Spec TDEE (Paper Linearizado) vs Implementação Atual

## Resumo Executivo

A spec proposta é **significativamente superior** ao cálculo atual. Não é um ajuste — é uma mudança de paradigma. O modelo atual é um "atalho" que dá um número agregado. O novo é um sistema dinâmico que entrega insights clínicos por janela temporal.

---

## Comparação Detalhada

### 1. Modelo Matemático

| Aspecto | Atual | Proposto (Paper) |
|---------|-------|-------------------|
| **Fórmula** | `TDEE = Avg(CI) - (rate × ρ)` | `ΔEI(t) = ε·(BW_s(t)−BW_0) + ρ·(dBW/dt)(t)` |
| **Parâmetros** | 1 (ρ = 7000 fixo) | 2 (ρ ~7000-9500, ε ~10-30 kcal/kg/d) |
| **Resolução** | 1 valor agregado | Por dia (ou por janela) |
| **Adaptação metabólica** | ❌ Ignora | ✅ Captura via ε |
| **Baseline** | Média aritmética do CI | Mifflin-St Jeor × PAL |
| **Peso** | Regressão linear global | Suavização (MA7/EMA) + derivada local |

**O que muda na prática:**
- O ε captura que o corpo gasta menos conforme emagrece (adaptação metabólica) — isso é real e significativo clinicamente
- Derivada local do peso (dia a dia suavizado) é mais sensível que regressão linear global
- Baseline por Mifflin-St Jeor é mais fundamentado que usar a média do CI reportado

### 2. Outputs

| Output | Atual | Proposto |
|--------|-------|----------|
| TDEE | ✅ 1 valor | ✅ EE_model(t) dinâmico |
| Déficit | ✅ Simples | ✅ bias(t) com interpretação clínica |
| Aderência | ❌ | ✅ `EI_rep(t) / EI_model(t)` |
| Sub/super-relato | ❌ | ✅ bias negativo/positivo |
| Confiança | ⚠️ Genérica | ✅ Rules-based com flags específicas |
| Projeção | ✅ Linear | ✅ Mais precisa com ε |

**Ganho clínico enorme:** O `bias` é o feature killer. Saber que um paciente está sub-relatando ~300 kcal/dia é muito mais útil do que só um TDEE estimado.

### 3. Inputs

| Input | Atual | Proposto |
|-------|-------|----------|
| date + weight + calories | ✅ | ✅ |
| sexo, idade, altura | ❌ | ✅ (para Mifflin-St Jeor) |
| PAL (nível atividade) | ❌ | ✅ (default 1.6) |
| % gordura | ❌ | Opcional (melhora ε/ρ) |
| Passos/atividade | ❌ | Opcional (melhora bias) |

**Boa notícia:** Já adicionamos sexo, idade, altura e nível de atividade do Robson na planilha Goals hoje. A infraestrutura de dados já suporta.

### 4. Confiança

**Atual:** Score genérico = 60% quantidade de dados + 40% variabilidade. Não tem flags.

**Proposto (muito melhor):**
- < 14 dias OU < 6 pesagens → baixa confiança
- Peso muito ruidoso (desvio alto do resíduo) → flag
- EI_rep em < 60% dos dias → flag
- Flags clínicas: "Flutuação hídrica", "Sub-relato provável", "Atividade não medida"

### 5. Suavização do Peso

**Atual:** Moving average simples com janela de 3 dias (muito pequena)

**Proposto:** MA7 ou EMA (α ~ 0.2-0.3) — mais robusto contra flutuações hídricas

---

## Pontos de Atenção para Implementação

### 5.1 Mifflin-St Jeor para EI_0
```
Homem:  BMR = 10×peso + 6.25×altura − 5×idade − 5
Mulher: BMR = 10×peso + 6.25×altura − 5×idade − 161
```
EI_0 = EE_0 = BMR_0 × PAL_0

Precisamos puxar sexo/idade/altura da Goals sheet. Já temos endpoint `/api/patients/:id` que retorna esses dados? **Verificar.**

### 5.2 Valores default de ε e ρ
- ρ: ~7700 kcal/kg (consenso médio, nosso atual usa 7000)
- ε: ~22 kcal/kg/d (valor médio, varia com composição corporal)

**Sugestão:** Começar com defaults fixos, depois permitir calibração pelo histórico.

### 5.3 Janelas de análise
A spec sugere 7 ou 14 dias com medianas + p10-p90. Isso é mais robusto que médias (resistente a outliers).

### 5.4 Dados esparsos
Nossos pacientes não registram peso todo dia. A suavização MA7 precisa interpolar gaps. A EMA lida melhor com dados esparsos (pondera pelo último valor disponível).

**Recomendação:** Usar EMA como default, MA7 como opção.

---

## Impacto na UI

### Cards atuais (Dashboard)
- "TDEE Adaptativo" → agora mostra **EE_model** dinâmico (por janela)
- **NOVO:** Card de "Aderência" (score + badge) → visível para paciente e admin
- **NOVO:** Card de "Bias" → mais para o admin (paciente vê como "precisão do registro")

### Para o paciente (motivacional)
- "Sua aderência essa semana: 92% 🎯"
- "Seu gasto energético estimado: 2.350 kcal/dia"

### Para o nutricionista (clínico)
- "Bias médio: -280 kcal/dia → provável sub-relato"
- "Confiança: 72% (⚠️ poucos registros de peso)"
- Flags: "Flutuação hídrica detectada nos últimos 3 dias"

---

## Veredicto

| Critério | Nota |
|----------|------|
| Fundamentação científica | ⭐⭐⭐⭐⭐ (baseado em paper validado) |
| Utilidade clínica | ⭐⭐⭐⭐⭐ (bias/aderência = game changer) |
| Complexidade de implementação | ⭐⭐⭐ (moderada, ~200 linhas de lógica) |
| Compatibilidade com dados existentes | ⭐⭐⭐⭐ (já temos quase tudo) |
| Risco de quebra | ⭐⭐ (precisa testar bem, mas é substituição do calculator) |

### Recomendação
**Implementar.** A spec está bem fechada, os inputs já estão na nossa infraestrutura, e o ganho clínico é enorme. Sugiro:

1. Criar `tdeeCalculatorV2.ts` (sem tocar o v1)
2. Implementar a API proposta (profile + series + settings → daily output)
3. Testar com dados fictícios do Robson Chamon
4. Atualizar UI (TDEECard → TDEECardV2 com bias/aderência)
5. Robson valida clinicamente → deploy

---

*Análise por Lola — 2026-02-08*
