# Algoritmo de Cálculo de TDEE Adaptativo

## Problema

Calcular o **Total Daily Energy Expenditure (TDEE)** real de um paciente usando:
- Consumo calórico diário reportado (CI - Caloric Intake)
- Medições seriadas de peso corporal

## Fundamentação Teórica

### Equação do Balanço Energético

```
ΔEnergia = CI - TDEE
```

Onde:
- **CI** = Caloric Intake (ingestão calórica diária)
- **TDEE** = Total Daily Energy Expenditure (gasto energético total)
- **ΔEnergia** = Mudança no estoque de energia corporal

### Relação Peso-Energia

A mudança de peso corporal reflete mudança no estoque de energia:

```
ΔPeso (kg) = ΔEnergia (kcal) / ρ
```

Onde **ρ** (rho) é a **densidade energética da mudança de peso** (kcal/kg).

### O Desafio: Densidade Energética Variável

A composição da mudança de peso NÃO é apenas gordura:
- **Gordura pura:** ~7.700 kcal/kg (9 kcal/g × 85% lipídio no tecido adiposo)
- **Massa magra:** ~1.800 kcal/kg (inclui água, glicogênio, proteína)
- **Glicogênio + água:** ~1.000-1.500 kcal/kg

**Estudos sugerem:**
- Perda de peso rápida: ρ ≈ 3.500-5.000 kcal/kg (mais água/glicogênio)
- Perda de peso lenta: ρ ≈ 6.000-7.700 kcal/kg (mais gordura)
- Ganho de peso: ρ ≈ 5.000-7.000 kcal/kg (depende do treino)

**Valor médio comumente usado:** ρ ≈ **7.000 kcal/kg** (compromisso)

---

## Fórmula Proposta: TDEE Adaptativo

### Método 1: Média Móvel Simples

Para um período de N dias:

```
TDEE = Média(CI) - (ΔPeso_total × ρ) / N
```

Onde:
- `Média(CI)` = média do consumo calórico nos N dias
- `ΔPeso_total` = Peso_final - Peso_inicial (em kg)
- `ρ` = 7000 kcal/kg (padrão, ajustável)
- `N` = número de dias

**Exemplo:**
- CI médio = 1800 kcal/dia
- Peso inicial = 80 kg, Peso final = 79 kg (perdeu 1 kg em 14 dias)
- TDEE = 1800 - (-1 × 7000) / 14 = 1800 + 500 = **2300 kcal/dia**

### Método 2: Regressão Linear (Mais Robusto)

Usando regressão linear nos dados de peso vs. tempo:

```
Peso(t) = Peso_inicial + taxa × t
```

Onde `taxa` é a inclinação (kg/dia).

```
TDEE = Média(CI) - (taxa × ρ)
```

**Vantagem:** Menos sensível a flutuações diárias de peso.

### Método 3: Filtro de Kalman (Avançado)

Para estimativa em tempo real com atualização contínua:

```
TDEE_estimado(t) = TDEE_estimado(t-1) + K × (TDEE_observado - TDEE_estimado(t-1))
```

Onde K é o ganho de Kalman (0 < K < 1).

---

## Implementação Recomendada

### Parâmetros Configuráveis

| Parâmetro | Valor Padrão | Descrição |
|-----------|--------------|-----------|
| `ρ` (rho) | 7000 | Densidade energética (kcal/kg) |
| `N_min` | 7 | Dias mínimos para cálculo |
| `N_ideal` | 14-21 | Dias ideais para precisão |
| `smoothing` | 0.3 | Fator de suavização para média móvel exponencial |

### Tratamento de Dados

1. **Peso:** Usar média móvel de 3-7 dias para suavizar flutuações de água
2. **Calorias:** Excluir dias com dados incompletos ou outliers (< 500 ou > 5000 kcal)
3. **Intervalo:** Mínimo de 7 dias de dados para estimativa confiável

### Cálculo de Confiança

```
Confiança = min(1, N / N_ideal) × (1 - CV_peso) × (1 - CV_calorias)
```

Onde CV = Coeficiente de Variação (desvio padrão / média)

---

## Fórmula Final Simplificada

```typescript
function calculateAdaptiveTDEE(
  dailyLogs: { date: string; calories: number; weight: number }[],
  rho: number = 7000
): { tdee: number; confidence: number; method: string } {
  
  // Filtrar logs válidos (com peso e calorias)
  const validLogs = dailyLogs.filter(log => 
    log.calories > 500 && log.calories < 5000 && log.weight > 0
  );
  
  if (validLogs.length < 7) {
    return { tdee: 0, confidence: 0, method: 'insufficient_data' };
  }
  
  // Calcular médias
  const avgCalories = mean(validLogs.map(l => l.calories));
  
  // Calcular taxa de mudança de peso (regressão linear)
  const weights = validLogs.map(l => l.weight);
  const weightChangeRate = linearRegressionSlope(weights); // kg/dia
  
  // Calcular TDEE
  const tdee = avgCalories - (weightChangeRate * rho);
  
  // Calcular confiança
  const n = validLogs.length;
  const confidence = Math.min(1, n / 14) * 0.8 + 0.2; // 80% baseado em dados, 20% base
  
  return {
    tdee: Math.round(tdee),
    confidence: Math.round(confidence * 100) / 100,
    method: 'linear_regression'
  };
}
```

---

## Referências

1. Hall, K.D. (2008). "What is the required energy deficit per unit weight loss?" - Int J Obes
2. Thomas, D.M. et al. (2014). "Time to correctly predict the amount of weight loss with dieting" - J Am Diet Assoc
3. Heymsfield, S.B. et al. (2011). "Body composition and energy balance: the state of the science"
4. Forbes, G.B. (2000). "Body fat content influences the body composition response to nutrition and exercise"

---

## Notas para Implementação no Hawthorne

1. A planilha atual tem peso apenas na aba Goals (inicial/final)
2. Precisamos de medições de peso seriadas (diárias ou semanais)
3. Sugestão: Adicionar coluna "peso" na aba Reports ou criar nova aba "Pesagens"
4. O TDEE calculado pode ser comparado com a meta para ajustar a dieta

---

*Documento criado por Lola em 2026-01-28*
