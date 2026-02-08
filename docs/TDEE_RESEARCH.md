# Pesquisa: TDEE Adaptativo e Modelos de Dinâmica de Peso Corporal

> **Documento de Pesquisa — Hawthorne App**
> Compilado por Lola (assistente de pesquisa do Dr. Robson Chamon)
> Data: 01/02/2026

---

## Sumário Executivo

Este documento sintetiza os principais estudos científicos sobre cálculo de TDEE (Total Daily Energy Expenditure) adaptativo, densidade energética variável (ρ/rho), e modelos matemáticos de dinâmica de peso corporal. O objetivo é fundamentar a implementação de um sistema de TDEE adaptativo progressivo no Hawthorne App.

**Conclusão principal:** A regra estática dos "3500 kcal = 1 lb" (7700 kcal/kg) é uma simplificação grosseira. Modelos dinâmicos mostram que ρ varia de ~3.500 kcal/kg (início da dieta) a ~7.700 kcal/kg (estado estável), e que a termogênese adaptativa reduz o TDEE em 15-25% além do previsto pela composição corporal. Um sistema de TDEE verdadeiramente adaptativo precisa incorporar essas dinâmicas.

---

## Índice

1. [Equações Preditivas de BMR/REE](#1-equações-preditivas-de-bmrree)
   - 1.1 Harris-Benedict (1918/1919)
   - 1.2 Roza & Shizgal (1984) — Revisão da Harris-Benedict
   - 1.3 Mifflin-St Jeor (1990)
   - 1.4 Katch-McArdle / Cunningham
   - 1.5 Pavlidou et al. (2023) — Nova Revisão
2. [Modelos Dinâmicos de Peso Corporal](#2-modelos-dinâmicos-de-peso-corporal)
   - 2.1 Chow & Hall (2008) — Dinâmica do Peso Corporal
   - 2.2 Hall et al. (2011) — Quantificação do Balanço Energético
   - 2.3 Thomas et al. (2009/2011) — Modelo Pennington
3. [Densidade Energética Variável (ρ)](#3-densidade-energética-variável-ρ)
   - 3.1 Hall (2008) — Déficit Energético por Unidade de Peso
   - 3.2 Heymsfield et al. (2012) — Cinética Energética na Perda de Peso
   - 3.3 Heymsfield et al. (2014) — "Quarter FFM Rule"
4. [Termogênese Adaptativa](#4-termogênese-adaptativa)
   - 4.1 Leibel, Rosenbaum et al. (2010) — Termogênese Adaptativa
   - 4.2 Müller & Bosy-Westphal (2013)
5. [Composição Corporal com Medicação Anti-Obesidade](#5-composição-corporal-com-medicação-anti-obesidade)
   - 5.1 SURMOUNT-1 DXA Substudy (2025) — Tirzepatida
   - 5.2 SURPASS-3 MRI (2025) — Composição Muscular
   - 5.3 GLP-1 e Termogênese Adaptativa
6. [Tabela Comparativa das Equações](#6-tabela-comparativa-das-equações)
7. [Recomendações para o Hawthorne App](#7-recomendações-para-o-hawthorne-app)

---

## 1. Equações Preditivas de BMR/REE

### 1.1 Harris-Benedict (1918/1919)

**Referência completa:**
Harris JA, Benedict FG. *A Biometric Study of Human Basal Metabolism.* Proceedings of the National Academy of Sciences. 1918;4(12):370-373. Monografia completa: Carnegie Institution of Washington, 1919.

**Metodologia:**
- 239 sujeitos saudáveis (136 homens, 103 mulheres)
- Idade: 16-63 anos
- Calorimetria indireta
- Regressão múltipla com peso, altura, idade e sexo
- Período de coleta: ~10 anos

**Fórmulas (unidades métricas, kcal/dia):**

```
Homens: BMR = 13,75 × peso(kg) + 5,003 × altura(cm) − 6,755 × idade(anos) + 66,47

Mulheres: BMR = 9,563 × peso(kg) + 1,850 × altura(cm) − 4,676 × idade(anos) + 655,1
```

**R² reportado:** Homens = 0,64; Mulheres = 0,36

**Limitações:**
- Amostra pequena, predominantemente branca, peso normal
- R² baixo, especialmente para mulheres
- Não considera composição corporal (massa magra vs gorda)
- Tende a **superestimar** o BMR em obesos (~5-15%)
- Dados coletados há mais de 100 anos — padrões metabólicos diferentes

---

### 1.2 Roza & Shizgal (1984) — Revisão da Harris-Benedict

**Referência completa:**
Roza AM, Shizgal HM. *The Harris Benedict equation reevaluated: resting energy requirements and the body cell mass.* American Journal of Clinical Nutrition. 1984;40(1):168-182.

**Metodologia:**
- 337 sujeitos (168 homens, 169 mulheres)
- Faixa etária mais ampla que o estudo original
- Reanálise dos dados originais de Harris-Benedict + novos dados de Benedict
- Demonstraram que REE é diretamente proporcional à massa celular corporal (BCM)
- Demonstraram que REE é independente de sexo e idade quando corrigido por BCM

**Fórmulas revisadas (kcal/dia):**

```
Homens: BMR = 13,397 × peso(kg) + 4,799 × altura(cm) − 5,677 × idade(anos) + 88,362

Mulheres: BMR = 9,247 × peso(kg) + 3,098 × altura(cm) − 4,330 × idade(anos) + 447,593
```

**R² reportado:** Homens = 0,77; Mulheres = 0,68

**Intervalo de confiança 95%:** ±213 kcal/dia (homens); ±201 kcal/dia (mulheres)

**Precisão:** ~±14% em indivíduos saudáveis

**Avanços em relação à original:**
- Amostra maior e mais diversa em idade
- Melhor R² (especialmente mulheres: 0,36 → 0,68)
- Conexão com massa celular corporal (BCM) como preditor real

**Limitações:**
- Ainda não incorpora composição corporal diretamente
- Precisão moderada (±14%)
- Amostra predominantemente caucasiana

---

### 1.3 Mifflin-St Jeor (1990)

**Referência completa:**
Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. *A new predictive equation for resting energy expenditure in healthy individuals.* American Journal of Clinical Nutrition. 1990;51(2):241-247.

**Metodologia:**
- 498 sujeitos saudáveis (251 homens, 247 mulheres)
- Idade: 19-78 anos (média 45 ± 14)
- Peso médio: homens 87,5 ± 14,4 kg; mulheres 70,2 ± 14,1 kg
- Incluiu indivíduos de peso normal (n=264) E obesos (n=234)
- REE medido por calorimetria indireta
- Validação cruzada em subgrupos

**Fórmula (kcal/dia):**

```
Homens:   REE = 9,99 × peso(kg) + 6,25 × altura(cm) − 4,92 × idade(anos) + 5

Mulheres: REE = 9,99 × peso(kg) + 6,25 × altura(cm) − 4,92 × idade(anos) − 161
```

> **Nota:** A única diferença entre sexos é a constante (+5 vs −161), simplificando enormemente a implementação.

**R² reportado:** 0,71 para ambos os sexos

**Validação posterior (Frankenfield et al., 2005, JADA):**
- Revisão sistemática comparando equações preditivas
- Mifflin-St Jeor foi a **mais confiável**, prevendo RMR dentro de 10% do medido em mais indivíduos (obesos e não-obesos) que qualquer outra equação
- **Recomendada pela Academy of Nutrition and Dietetics (ADA)**

**Vantagens:**
- Amostra moderna (1990) e diversa (peso normal + obesos)
- Fórmula unificada (mesmo coeficiente para ambos os sexos, exceto constante)
- Melhor precisão em obesos que Harris-Benedict
- Maior amostra que estudos anteriores

**Limitações:**
- Participantes nos BMI "normal" e "sobrepeso" — não validada para obesidade extrema (IMC > 40)
- Não incorpora composição corporal
- R² de 0,71 — ~29% da variância não explicada

---

### 1.4 Katch-McArdle / Cunningham

**Referências:**
- Katch F, McArdle WD. *Prediction of body density from simple anthropometric measurements in college-age men and women.* Human Biology. 1973;45(3):445-454.
- Cunningham JJ. *A reanalysis of the factors influencing basal metabolic rate in normal adults.* American Journal of Clinical Nutrition. 1980;33(11):2372-2374.

**Fórmula (ambos os sexos, kcal/dia):**

```
BMR = 370 + (21,6 × Massa Magra em kg)
```

> **Cunningham é equivalente:** RMR = 500 + (22 × Massa Magra em kg)

**Vantagens:**
- Usa massa magra (LBM) como preditor → mais precisa para atletas e obesos
- Sexo-independente (a diferença metabólica é capturada pela LBM)
- Ideal quando se tem bioimpedância ou DEXA

**Limitações:**
- **Requer medição de composição corporal** (% gordura ou LBM)
- Assume composição corporal "normal" dentro do tecido magro
- Menos validada em populações extremas

**Relevância para o Hawthorne App:**
Quando o paciente tem dados de bioimpedância ou DEXA, esta equação pode ser mais precisa, especialmente em pacientes com:
- Obesidade grau III
- Alta massa muscular
- Em uso de tirzepatida (onde a composição corporal muda significativamente)

---

### 1.5 Pavlidou et al. (2023) — Nova Revisão

**Referência:**
Pavlidou E et al. *Revised Harris–Benedict Equation: New Human Resting Metabolic Rate Equation.* Metabolites. 2023;13(2):189.

**Fórmulas (kcal/dia):**

```
Homens: RMR = 9,65 × peso(kg) + 573 × altura(m) − 5,08 × idade(anos) + 260

Mulheres: RMR = 7,38 × peso(kg) + 607 × altura(m) − 2,31 × idade(anos) + 43
```

**R²:** Homens = 0,95; Mulheres = 0,86

**Destaque:** Criadas em condições obesogênicas modernas, incluindo pacientes com doenças controladas (DM, DCV, tireoide). Amostra de 722 caucasianos.

---

## 2. Modelos Dinâmicos de Peso Corporal

### 2.1 Chow & Hall (2008) — Dinâmica do Peso Corporal

**Referência completa:**
Chow CC, Hall KD. *The Dynamics of Human Body Weight Change.* PLoS Computational Biology. 2008;4(3):e1000045.

**Metodologia:**
- Modelo matemático baseado em balanço de fluxo de macronutrientes
- Sistema de 3 compartimentos (gordura, proteína, glicogênio) reduzido a 2 (gordura + massa magra)
- Validado contra dados do Minnesota Starvation Experiment
- Análise de sistemas dinâmicos com teoria de plano de fase

**Equações fundamentais do modelo de 2 compartimentos:**

```
Gordura (F):   ρF × dF/dt = (1-p) × (I - E)     [ρF = 39,5 MJ/kg = 9.441 kcal/kg]
Massa Magra (L): ρL × dL/dt = p × (I - E)         [ρL = 7,6 MJ/kg = 1.816 kcal/kg]
```

Onde:
- **I** = taxa de ingestão energética metabolizável (kcal/dia)
- **E** = taxa de gasto energético total (kcal/dia)
- **p** = fração de partição energética para massa magra (função da gordura corporal)
- **ρF** = 9.441 kcal/kg (densidade energética da gordura pura)
- **ρL** = 1.816 kcal/kg (densidade energética da mudança de massa magra)

**Relação de Forbes (partição de energia):**

```
dL/dF = D / (D + F)

Onde D ≈ 10,4 kg (constante de Forbes)
```

Isso significa:
- Pessoa com 40 kg de gordura: dL/dF = 10,4/(10,4+40) = **0,21** → 79% da perda vem de gordura
- Pessoa com 10 kg de gordura: dL/dF = 10,4/(10,4+10) = **0,51** → 49% da perda vem de gordura

**Contribuições-chave:**
1. Demonstrou que todos os modelos anteriores são casos especiais deste modelo geral
2. Mostrou que o comportamento genérico pode ser dividido em duas classes (ponto fixo único vs. manifold invariante)
3. Estabeleceu que glicogênio pode ser tratado em quasi-equilíbrio (dG/dt ≈ 0) em escalas > 1 dia

**Valores de ρ derivados:**
- ρ (gordura pura): **9.441 kcal/kg** (39,5 MJ/kg)
- ρ (massa magra — mudança): **1.816 kcal/kg** (7,6 MJ/kg)
- ρ (composto, obeso): **~7.700 kcal/kg** (32,2 MJ/kg) → a famosa regra dos 3500 kcal/lb
- ρ (composto, magro): **~4.000-5.000 kcal/kg** → menos energia necessária por kg perdido

---

### 2.2 Hall et al. (2011) — Quantificação do Balanço Energético (Lancet)

**Referência completa:**
Hall KD, Sacks G, Chandramohan D, Chow CC, Wang YC, Gortmaker SL, Swinburn BA. *Quantification of the effect of energy imbalance on bodyweight.* The Lancet. 2011;378(9793):826-837.

**Metodologia:**
- Modelo matemático dinâmico não-linear de metabolismo humano adulto
- Incorpora adaptações de gasto energético durante perda de peso
- Validado contra dados CALERIE, dietas líquidas, e jejum de 30 dias
- Implementado como NIH Body Weight Planner (https://www.niddk.nih.gov/bwp)

**Modelo simplificado de 1 compartimento (regra prática):**

```
Para cada mudança de 100 kJ/dia (~24 kcal/dia) na ingestão:
→ Mudança eventual de ~1 kg no peso corporal

Equivalentemente: ~10 kcal/dia por libra de mudança de peso
                   ~22 kcal/dia por kg de mudança de peso
```

**Dinâmica temporal:**
- **Meia-vida:** ~1 ano para atingir metade da perda máxima
- **95% da perda:** ~3 anos para atingir
- **Estado estável:** nunca é verdadeiramente alcançado, mas ~95% em 3 anos

**Resultados-chave do paper:**

1. **A regra dos 3500 kcal/lb SUPERESTIMA** a perda de peso em ~100% no primeiro ano
   - Exemplo: Déficit de 500 kcal/dia
   - Regra estática prediz: 23 kg em 1 ano
   - Modelo dinâmico prediz: ~12 kg em 1 ano

2. **Pessoas com mais gordura corporal perdem MAIS peso** para o mesmo déficit
   - Preservam mais massa magra → menos redução de gasto energético → maior perda total
   - Mas levam MAIS TEMPO para atingir o estado estável

3. **Exercício vs Dieta:** Não são equivalentes energeticamente
   - Exercício gera perda de peso menor no curto prazo mas com melhor preservação de massa magra
   - No longo prazo, exercício + dieta converge para resultado similar

4. **Incerteza basal:** ±5% de erro na estimativa do TDEE inicial → ±4 kg de variabilidade na perda de peso em vários anos

**Fórmula do modelo completo (webappendix):**

A taxa de mudança de peso é governada por:

```
ρ(BW) × dBW/dt = EI − TEE(BW)

Onde:
- ρ(BW) = densidade energética efetiva da mudança de peso (varia com composição corporal)
- EI = ingestão energética (kcal/dia)
- TEE(BW) = gasto energético total como função do peso (inclui REE + NREE + DIT)
```

**Constante de tempo (τ):**

```
τ = ρ(BW) / (dTEE/dBW)

Para uma pessoa "média":
τ ≈ 35 dias (se ρ = 7700 kcal/kg e dTEE/dBW ≈ 22 kcal/kg/dia)

Mas na prática, com partição de composição corporal, τ ≈ 200-365 dias
```

---

### 2.3 Thomas et al. (2009/2011) — Modelo Pennington

**Referências:**
- Thomas DM, Ciesla A, Levine JA, Stevens JG, Martin CK. *A mathematical model of weight change with adaptation.* Mathematical Biosciences and Engineering. 2009;6(4):873-887.
- Thomas DM et al. *A Simple Model Predicting Individual Weight Change in Humans.* J Math Biol. 2011;5(6):579-599.
- Thomas DM et al. *New fat free mass – fat mass model for use in physiological energy balance equations.* Nutrition & Metabolism. 2010;7:39.

**Modelo:**
- Similar ao Hall, mas com relação FFM-FM diferente (Forbes clássico vs Forbes modificado)
- Usa sistema de peso adaptativo no preditor
- Inclui parâmetro de atividade física espontânea (SPA) que diminui com perda de peso
- Implementado como Pennington Biomedical Research Center Weight Loss Predictor

**Relação FFM-FM (Thomas et al., 2010):**

```
FFM = Forbes_constante × ln(FM) + k

Modificação: Relação não-linear algébrica em vez da logarítmica original de Forbes
```

**Contribuição-chave:** Modelos de Forbes (logarítmicos) têm limitações quando pareados com equações diferenciais de balanço energético de uma dimensão. Thomas propôs relações mais estáveis matematicamente.

---

## 3. Densidade Energética Variável (ρ)

### 3.1 Hall (2008) — Déficit Energético por Unidade de Peso

**Referência completa:**
Hall KD. *What is the Required Energy Deficit per unit Weight Loss?* International Journal of Obesity. 2008;32(3):573-576.

**Este é o paper fundamental sobre ρ variável.** Demonstra que a regra dos 7700 kcal/kg é uma simplificação.

**Fórmula da densidade energética da perda de peso:**

```
ρ_total = ρF + (ρL − ρF) × (ΔL/ΔBW)

Onde:
- ρF = 39,5 MJ/kg = 9.441 kcal/kg (gordura)
- ρL = 7,6 MJ/kg = 1.816 kcal/kg (massa magra)
- ΔL/ΔBW = fração da perda que vem de massa magra
```

**Fração de massa magra perdida (Forbes modificado):**

```
ΔL/ΔBW = 1 + (Fi/ΔBW) − (10,4/ΔBW) × W{(10,4/ΔBW) × exp(ΔBW/10,4) × (Fi/exp(Fi/10,4))}

Onde:
- Fi = gordura corporal inicial (kg)
- ΔBW = perda de peso total (kg)
- W = função Lambert W
```

**Valores de ρ preditos pelo modelo:**

| Gordura Inicial (kg) | Perda de 5 kg | Perda de 15 kg | Perda de 25 kg |
|:-----:|:-----:|:-----:|:-----:|
| 10 kg | ~4.500 kcal/kg | ~4.200 kcal/kg | ~4.000 kcal/kg |
| 20 kg | ~6.000 kcal/kg | ~5.500 kcal/kg | ~5.200 kcal/kg |
| 30 kg | ~7.200 kcal/kg | ~6.800 kcal/kg | ~6.500 kcal/kg |
| 40 kg+ | ~7.700 kcal/kg | ~7.400 kcal/kg | ~7.200 kcal/kg |

**Insights críticos:**
1. **Quanto mais gordo o indivíduo, MAIOR o ρ** → mais deficit necessário por kg perdido
2. **Quanto mais peso perdido, MENOR o ρ médio** → porque mais massa magra é catabolizada ao longo do tempo
3. **A regra de 7700 kcal/kg só funciona para gordura corporal inicial > 30 kg**
4. **Para pessoas magras (< 20 kg gordura), ρ pode ser < 5000 kcal/kg**
5. **Homens perdem mais peso que mulheres** para o mesmo déficit porque têm menos gordura relativa

---

### 3.2 Heymsfield et al. (2012) — Cinética Energética na Perda de Peso

**Referência completa:**
Heymsfield SB, Thomas D, Nguyen AM, Peng JZ, Martin C, Shen W, Strauss B, Bosy-Westphal A, Müller MJ. *Energy Content of Weight Loss: Kinetic Features During Voluntary Caloric Restriction.* Metabolism. 2012;61(7):937-943.

**Metodologia:**
- Estudo CALERIE: 23 homens e mulheres com sobrepeso, 24 semanas de restrição calórica
- Estudo Kiel: 75 obesos (15H, 60M), 13 semanas de VLCD (800-1000 kcal/dia)
- DXA para composição corporal em múltiplos pontos no tempo
- Densidade energética: gordura = 9,3 kcal/g; FFM = 1,1 kcal/g

**Resultados fundamentais sobre a dinâmica de ρ:**

| Período | ΔEC/ΔW (kcal/kg) | Interpretação |
|:-----:|:-----:|:-----:|
| Semana 4 | **4.858 ± 388** | Perda rápida, muita água e glicogênio |
| Semana 6 | **6.041 ± 376** | Transição para perda de gordura |
| Semana 10+ | **~6.500-7.000** | Estabilização perto do valor de "gordura" |

**ρ estabiliza após ~4-6 semanas** e mantém-se relativamente constante depois disso.

**Diferença entre sexos:**
- Mulheres (Kiel): **6.804 ± 226 kcal/kg** (mais gordura na perda)
- Homens (Kiel): **6.119 ± 240 kcal/kg** (mais massa magra na perda)
- Diferença significativa (p < 0,05)

**ρ por tipo de perda (CALERIE, 24 semanas):**
- Homens: 6.500 ± 1.302 kcal/kg
- Mulheres: 7.261 ± 867 kcal/kg

---

### 3.3 Heymsfield et al. (2014) — "Quarter FFM Rule"

**Referência:**
Heymsfield SB, Thomas D, Bosy-Westphal A, Shen W, Peterson CM, Müller MJ. *Weight Loss Composition is One-Fourth Fat-Free Mass: A Critical Review and Critique of This Widely Cited Rule.* Obesity Reviews. 2014;15(4):310-321.

**A "Regra do Quarto":** ~75% da perda de peso é gordura, ~25% é FFM

**Fórmula conectando as duas regras:**

```
Conteúdo energético (kcal/kg) = 1.020 × (ΔFFM/ΔW) + 9.500 × (1 − ΔFFM/ΔW)

Se ΔFFM/ΔW = 0,25:
→ ρ = 1.020 × 0,25 + 9.500 × 0,75 = 255 + 7.125 = 7.380 kcal/kg (≈ 7.700)
```

**Variação temporal da composição da perda (dados históricos do Minnesota):**

| Período | % Gordura na perda | % FFM na perda | ρ estimado |
|:-----:|:-----:|:-----:|:-----:|
| Semanas 1-3 | **25%** | **75%** | ~3.200 kcal/kg |
| Semanas 3+ | **85%** | **15%** | ~8.200 kcal/kg |
| Longo prazo (>12 sem) | **70%** | **30%** | ~7.000 kcal/kg |

**Conclusão crucial:** ρ NÃO é constante. Varia dramaticamente nas primeiras semanas e depende de:
- Gordura corporal inicial
- Sexo
- Tipo de intervenção (dieta vs exercício vs cirurgia)
- Ingestão proteica
- Presença de treinamento de resistência

---

## 4. Termogênese Adaptativa

### 4.1 Leibel, Rosenbaum et al. (2010)

**Referência:**
Rosenbaum M, Leibel RL. *Adaptive thermogenesis in humans.* International Journal of Obesity. 2010;34(S1):S47-S55.

**Achados principais sobre manutenção de peso reduzido em 10%:**

| Componente | Mudança | Reversível com Leptina? |
|:-----:|:-----:|:-----:|
| TEE (24h) | **−15%** (300-400 kcal/dia) | Sim |
| REE | −0% a −5% | Parcialmente |
| DIT (efeito térmico alimento) | Sem mudança | N/A |
| NREE (atividade não-repouso) | **−30%** | Sim |
| Eficiência muscular | **+20%** | Sim |
| SNS (simpático) | **−40%** | Sim |
| PNS (parassimpático) | **+80%** | Não |
| T3 | −7% | Sim |
| T4 | −9% | Sim |
| Leptina | Proporcional à gordura | Sim (reposição) |

**Implicações práticas:**
- Um ex-obeso precisa de **300-400 kcal/dia A MENOS** que alguém nunca-obeso do mesmo peso e composição corporal
- Essa adaptação **persiste por anos** (documentado até 7 anos)
- ~60% da redução no TEE é explicável pela composição corporal; **~40% é termogênese adaptativa**
- NREE é o componente MAIS afetado (60-72% da termogênese adaptativa)
- Eficiência muscular aumenta ~25%, permitindo mesma atividade com menos gasto calórico

### 4.2 Quantificação da Termogênese Adaptativa (2025)

**Fonte:** Cell Reports Medicine, 2025 — *Can muscle avert GLP1R weight plateau and regain?*

**Dados consolidados para perda de 10% do peso:**
- TEE diminui **15%** total
- ~60% da redução é por perda de massa (esperado)
- ~40% é termogênese adaptativa (AT)
  - BMR reduz ~5% → contribui com ~40% da AT
  - NREE reduz ~20% → contribui com ~60% da AT
  - Eficiência muscular melhora ~25%

**Contribuição relativa dos órgãos ao BMR:**
- Cérebro + coração + fígado + rins = **5-6% do peso corporal** mas **~80% do BMR**
- Músculo esquelético = ~20% do BMR (em repouso)
- Tecido adiposo = ~5% do BMR

---

## 5. Composição Corporal com Medicação Anti-Obesidade

### 5.1 SURMOUNT-1 DXA Substudy (2025)

**Referência:**
Look AR et al. *Body composition changes during weight reduction with tirzepatide in the SURMOUNT-1 study of adults with obesity or overweight.* Diabetes, Obesity and Metabolism. 2025. DOI: 10.1111/dom.16275

**Metodologia:**
- Subestudo do SURMOUNT-1 (n=160 de 2539 do estudo principal)
- DXA (absorciometria de raios-X de dupla energia) basal e semana 72
- 73% mulheres; peso médio 102,5 kg; IMC médio 38,0 kg/m²
- Tirzepatida 5/10/15 mg vs placebo

**Resultados:**

| Parâmetro | Tirzepatida (pooled) | Placebo |
|:-----:|:-----:|:-----:|
| Perda peso total | **−21,3%** | −5,3% |
| Perda massa gorda | **−33,9%** | −8,2% |
| Perda massa magra | **−10,9%** | −2,6% |
| **Proporção gordura:magra** | **~75%:25%** | ~75%:25% |

**Achado fundamental:** A proporção 75% gordura / 25% massa magra foi **consistente** entre tirzepatida e placebo, e entre todos os subgrupos (sexo, idade, magnitude de perda).

**Implicações para ρ:**
Com tirzepatida, usando a proporção 75:25:
```
ρ_tirzepatida ≈ 0,75 × 9.441 + 0,25 × 1.816 = 7.081 + 454 = ~7.535 kcal/kg
```

Isso é muito próximo dos 7.700 kcal/kg da regra clássica, o que valida o uso do modelo de Wishnofsky para pacientes obesos em tirzepatida.

### 5.2 SURPASS-3 MRI — Composição Muscular

**Referência:**
The Lancet Diabetes & Endocrinology. 2025. *Tirzepatide and muscle composition changes in people with type 2 diabetes.*

- Tirzepatida reduziu gordura infiltrada no músculo
- Volume muscular livre de gordura manteve-se estável
- Sugere preservação da qualidade muscular mesmo com perda de massa total

### 5.3 GLP-1 e Termogênese Adaptativa

**Referência:**
PMC 12490208 (2025). *Can muscle avert GLP1R weight plateau and regain?*

**Achados críticos:**
- Tirzepatida **REDUZ** tanto o gasto energético durante o sono quanto o TEE total, mesmo após ajuste para FFM e FM
- Isso sugere que **GLP-1 agonistas NÃO previnem a termogênese adaptativa**
- O platô de perda de peso com tirzepatida (~24-36 semanas) é parcialmente explicado pela AT
- Descontinuação de semaglutida: ~50% descontinuam em 12 meses → reganho rápido
- A preservação de massa muscular pode ser a chave para sustentação do peso perdido

**Implicações para TDEE adaptativo com medicação:**
O sistema deve:
1. Assumir que AT ocorre MESMO com medicação
2. Ajustar TDEE para baixo progressivamente
3. Monitorar platôs como sinal de AT significativa
4. Incorporar dados de composição corporal quando disponíveis

---

## 6. Tabela Comparativa das Equações

| Equação | Ano | Variáveis | R² (H/M) | Melhor para | Limitações |
|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|
| **Harris-Benedict** | 1918/19 | Peso, Altura, Idade, Sexo | 0,64/0,36 | Histórico/referência | Superestima em obesos |
| **Roza-Shizgal** | 1984 | Peso, Altura, Idade, Sexo | 0,77/0,68 | Uso geral | Moderada precisão |
| **Mifflin-St Jeor** | 1990 | Peso, Altura, Idade, Sexo | 0,71/0,71 | **Recomendada (ADA)** | Não testada IMC>40 |
| **Katch-McArdle** | 1973 | Massa Magra | N/A | Atletas, obesos com DEXA | Requer % gordura |
| **Cunningham** | 1980 | Massa Magra | N/A | Idem | Idem |
| **Pavlidou** | 2023 | Peso, Altura, Idade, Sexo | 0,95/0,86 | Modernos/obesos | Só caucasianos |

---

## 7. Recomendações para o Hawthorne App

### 7.1 Arquitetura do Sistema de TDEE Adaptativo

Recomendo um **modelo de 3 fases com blend progressivo**:

#### Fase 1: Preditiva (Semanas 1-4)
- Usar **Mifflin-St Jeor** como equação base
- Se dados de composição corporal disponíveis → usar **Katch-McArdle** como segundo estimador
- Multiplicar pelo fator de atividade (PAL) para obter TDEE
- **ρ nesta fase: usar ~4.000-5.000 kcal/kg** (perda inicial inclui muita água/glicogênio)

```python
# Fase 1 - BMR Preditivo
def bmr_mifflin(peso_kg, altura_cm, idade, sexo):
    bmr = 9.99 * peso_kg + 6.25 * altura_cm - 4.92 * idade
    return bmr + 5 if sexo == 'M' else bmr - 161

def bmr_katch(massa_magra_kg):
    return 370 + 21.6 * massa_magra_kg

# TDEE = BMR × PAL
# PAL: 1.2 (sedentário), 1.375 (leve), 1.55 (moderado), 1.725 (intenso), 1.9 (muito intenso)
```

#### Fase 2: Transição/Blend (Semanas 4-12)
- Começar a coletar dados de peso real → calcular TDEE "observado"
- **Blend progressivo:** peso do modelo preditivo diminui, peso do adaptativo aumenta

```python
# TDEE observado (reverso a partir da perda de peso real)
def tdee_observado(intake_medio, delta_peso_kg, dias, rho):
    """
    Se paciente comeu X kcal/dia e perdeu Y kg em Z dias:
    TDEE_observado = intake + (delta_peso * rho) / dias
    """
    return intake_medio + (abs(delta_peso_kg) * rho) / dias

# Blend progressivo
def tdee_blend(tdee_preditivo, tdee_observado, semana):
    """
    Semana 1-4: 100% preditivo
    Semana 5-8: blend linear (80% pred → 40% pred)
    Semana 9+: 20% preditivo, 80% observado
    """
    if semana <= 4:
        peso_pred = 1.0
    elif semana <= 8:
        peso_pred = 1.0 - (semana - 4) * 0.15  # 1.0 → 0.40
    else:
        peso_pred = 0.20
    
    return peso_pred * tdee_preditivo + (1 - peso_pred) * tdee_observado
```

#### Fase 3: Adaptativo (Semanas 12+)
- Predominantemente baseado em dados reais
- ρ ajustado para ~7.000-7.700 kcal/kg (perda estabilizada)
- Incorporar fator de termogênese adaptativa

```python
# Fator de termogênese adaptativa
def fator_at(peso_perdido_pct):
    """
    Baseado nos dados de Rosenbaum & Leibel:
    - 0% perda: fator = 1.0 (sem adaptação)
    - 5% perda: fator = 0.95 (5% AT)
    - 10% perda: fator = 0.90 (10% AT)
    - 15%+ perda: fator = 0.85 (15% AT, platô)
    """
    if peso_perdido_pct <= 0:
        return 1.0
    elif peso_perdido_pct <= 5:
        return 1.0 - (peso_perdido_pct / 100)
    elif peso_perdido_pct <= 10:
        return 0.95 - ((peso_perdido_pct - 5) / 100)
    else:
        return max(0.85, 0.90 - ((peso_perdido_pct - 10) / 200))

# TDEE adaptativo final
def tdee_adaptativo(bmr_atual, pal, peso_perdido_pct):
    tdee_base = bmr_atual * pal
    return tdee_base * fator_at(peso_perdido_pct)
```

### 7.2 Modelo de ρ Dinâmico

```python
def rho_dinamico(semana, gordura_inicial_kg, sexo):
    """
    ρ (kcal/kg) varia com o tempo e composição corporal.
    
    Baseado em Heymsfield et al. 2012:
    - Semanas 1-4: ρ baixo (água, glicogênio)
    - Semanas 4-6: transição
    - Semanas 6+: ρ estável
    """
    # Fase precoce (semanas 1-4): muita água e glicogênio
    if semana <= 2:
        rho_base = 3500  # Muito glicogênio e água
    elif semana <= 4:
        rho_base = 5000  # Transição
    elif semana <= 6:
        rho_base = 6000  # Estabilizando
    else:
        rho_base = 7000  # Perda predominantemente de gordura
    
    # Ajuste por gordura corporal (Hall 2008)
    # Mais gordura = maior ρ (mais gordura na perda = mais energia por kg)
    if gordura_inicial_kg >= 30:
        fator_gordura = 1.10  # Obesos: mais próximo de 7700
    elif gordura_inicial_kg >= 20:
        fator_gordura = 1.00  # Normal
    else:
        fator_gordura = 0.85  # Magros: ρ mais baixo
    
    # Ajuste por sexo (Heymsfield 2012)
    fator_sexo = 1.05 if sexo == 'F' else 0.95  # Mulheres perdem mais gordura
    
    return rho_base * fator_gordura * fator_sexo
```

### 7.3 Considerações para Pacientes com Tirzepatida

```python
def ajustes_tirzepatida(tdee_base, semana_medicacao, dose_mg):
    """
    Ajustes específicos para pacientes em tirzepatida:
    
    1. Proporção gordura:magra se mantém em ~75:25 (SURMOUNT-1)
    2. AT ocorre MESMO com medicação
    3. Perda de peso mais agressiva (16-22% em 72 semanas)
    4. Platô típico em 24-36 semanas
    """
    # ρ para tirzepatida: usar ~7500 kcal/kg (composição 75:25 confirmada pelo SURMOUNT-1)
    rho_tirze = 7500
    
    # Perda esperada (dados SURMOUNT-1)
    perda_esperada_pct = {
        5: 16.0,   # 5 mg
        10: 21.4,  # 10 mg
        15: 22.5   # 15 mg
    }.get(dose_mg, 20.0)
    
    # Fator de saciedade: tirzepatida reduz intake naturalmente
    # Paciente pode comer MENOS do que o prescrito (monitorar!)
    reducao_intake_estimada = 0.25 to 0.35  # 25-35% menos intake
    
    return {
        'rho': rho_tirze,
        'perda_esperada_72sem': perda_esperada_pct,
        'at_esperada': True,
        'alerta_plateau': semana_medicacao >= 24,
        'monitorar_massa_magra': True
    }
```

### 7.4 Regra Simplificada de Hall para Interface do App

Para comunicação com o paciente, usar a **regra simplificada de Hall (2011)**:

> "Para cada 10 kcal/dia de mudança sustentada, espere ~0,45 kg de mudança de peso ao longo do tempo."

Ou em formato tabular para o app:

| Déficit diário | Perda em 3 meses | Perda em 6 meses | Perda em 12 meses | Perda final (~3 anos) |
|:-----:|:-----:|:-----:|:-----:|:-----:|
| 250 kcal/dia | ~4 kg | ~6 kg | ~8 kg | ~11 kg |
| 500 kcal/dia | ~7 kg | ~10 kg | ~14 kg | ~22 kg |
| 750 kcal/dia | ~9 kg | ~14 kg | ~18 kg | ~33 kg |
| 1000 kcal/dia | ~11 kg | ~17 kg | ~22 kg | ~44 kg |

*(Valores aproximados para homem de 100 kg, sedentário)*

### 7.5 Alertas e Safeguards

O sistema deve implementar:

1. **Alerta de platô:** Se perda < 0,1 kg/semana por 3 semanas consecutivas → sugerir reavaliação de TDEE e adesão
2. **Alerta de perda rápida:** Se perda > 1,5% do peso/semana → verificar adesão, hidratação, possível perda excessiva de massa magra
3. **Alerta de adaptação:** Se TDEE calculado cair > 15% do inicial → flag de termogênese adaptativa significativa → sugerir "diet break" ou refeeds
4. **Proteção de intake mínimo:** Nunca sugerir < 1200 kcal/dia (mulheres) ou < 1500 kcal/dia (homens) sem supervisão médica
5. **Recalibração periódica:** A cada 4 semanas, recalcular BMR com peso atualizado + fator AT

### 7.6 Stack Técnico Sugerido

```
Dados de entrada:
├── Obrigatórios: peso, altura, idade, sexo, nível atividade
├── Opcionais: % gordura (bioimpedância/DEXA), massa magra
├── Medicação: tirzepatida dose/semaglutida
└── Registro diário: peso, intake calórico

Motor de cálculo:
├── BMR: Mifflin-St Jeor (default) ou Katch-McArdle (se %gordura disponível)
├── TDEE: BMR × PAL × fator_AT
├── ρ dinâmico: baseado em semana + composição corporal
├── Blend: preditivo ↔ observado (progressivo)
└── Meta calórica: TDEE − déficit prescrito

Saídas:
├── Meta calórica diária
├── Previsão de perda (curvilínea, não linear!)
├── Gráfico comparativo: real vs previsto
├── Alertas: platô, perda rápida, AT, intake mínimo
└── Relatório mensal para o médico
```

---

## Referências Completas

1. Harris JA, Benedict FG. A Biometric Study of Human Basal Metabolism. PNAS. 1918;4(12):370-373.
2. Harris JA, Benedict FG. A Biometric Study of Basal Metabolism in Man. Carnegie Institution of Washington, Publication No. 279. 1919.
3. Roza AM, Shizgal HM. The Harris Benedict equation reevaluated: resting energy requirements and the body cell mass. Am J Clin Nutr. 1984;40(1):168-182.
4. Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51(2):241-247.
5. Frankenfield D, Roth-Yousey L, Compher C. Comparison of predictive equations for resting metabolic rate in healthy nonobese and obese adults: a systematic review. J Am Diet Assoc. 2005;105(5):775-789.
6. Chow CC, Hall KD. The dynamics of human body weight change. PLoS Comput Biol. 2008;4(3):e1000045.
7. Hall KD. What is the required energy deficit per unit weight loss? Int J Obes. 2008;32(3):573-576.
8. Hall KD, Sacks G, Chandramohan D, Chow CC, Wang YC, Gortmaker SL, Swinburn BA. Quantification of the effect of energy imbalance on bodyweight. Lancet. 2011;378(9793):826-837.
9. Thomas DM, Ciesla A, Levine JA, Stevens JG, Martin CK. A mathematical model of weight change with adaptation. Math Biosci Eng. 2009;6(4):873-887.
10. Thomas DM et al. New fat free mass – fat mass model for use in physiological energy balance equations. Nutr Metab. 2010;7:39.
11. Thomas DM et al. A Simple Model Predicting Individual Weight Change in Humans. J Math Biol. 2011;5(6):579-599.
12. Heymsfield SB et al. Energy Content of Weight Loss: Kinetic Features During Voluntary Caloric Restriction. Metabolism. 2012;61(7):937-943.
13. Heymsfield SB et al. Weight Loss Composition is One-Fourth Fat-Free Mass: A Critical Review. Obes Rev. 2014;15(4):310-321.
14. Rosenbaum M, Leibel RL. Adaptive thermogenesis in humans. Int J Obes. 2010;34(S1):S47-S55.
15. Forbes GB. Lean body mass-body fat interrelationships in humans. Nutr Rev. 1987;45:225-231.
16. Wishnofsky M. Caloric equivalents of gained or lost weight. Am J Clin Nutr. 1958;6:542-546.
17. Look AR et al. Body composition changes during weight reduction with tirzepatide in the SURMOUNT-1 study. Diabetes Obes Metab. 2025. DOI: 10.1111/dom.16275.
18. Cell Reports Medicine. Can muscle avert GLP1R weight plateau and regain? 2025.
19. Pavlidou E et al. Revised Harris–Benedict Equation: New Human Resting Metabolic Rate Equation. Metabolites. 2023;13(2):189.
20. Cho YH et al. Dynamic Energy Balance and Obesity Prevention. J Obes Metab Syndr. 2019;28(4):203-210.

---

*Documento gerado para uso interno do Hawthorne App. Pesquisa conduzida em 01/02/2026.*
*Para questões sobre implementação, consultar Dr. Robson Chamon.*
