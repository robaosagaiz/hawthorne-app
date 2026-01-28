# 📊 MISSION REPORT: TDEE Adaptativo

**Data:** 2026-01-28
**Solicitado por:** Dr. Robson Chamon
**Executado por:** Lola 🤖

---

## ✅ Missão Cumprida!

Implementei o **TDEE Adaptativo** no Hawthorne App conforme solicitado.

---

## 📐 A Fórmula

```
TDEE = Média(Consumo Calórico) - (Taxa de Mudança de Peso × 7000)
```

### Como funciona:
1. **Coleta dados:** Calorias diárias + Peso seriado
2. **Calcula taxa:** Usa regressão linear para encontrar kg/dia
3. **Estima TDEE:** Aplica a fórmula acima
4. **Gera confiança:** Baseado na quantidade e qualidade dos dados

### Exemplo:
- Paciente consome 1800 kcal/dia em média
- Perdeu 1 kg em 14 dias (taxa = -0.071 kg/dia)
- TDEE = 1800 - (-0.071 × 7000) = 1800 + 500 = **2300 kcal/dia**

---

## 🖥️ O que foi implementado

### 1. Algoritmo (`src/utils/tdeeCalculator.ts`)
- Função `calculateAdaptiveTDEE()` - Cálculo principal
- Função `getCalorieRecommendation()` - Sugere ajuste de calorias
- Suporte a configuração customizada (ρ, dias mínimos, etc.)

### 2. Componente Visual (`src/components/Dashboard/TDEECard.tsx`)
- Card bonito mostrando TDEE estimado
- Indicador de confiança (baixa/moderada/alta)
- Déficit/superávit atual
- Calculadora de metas (quanto comer para perder X kg/semana)
- Interpretação em português

### 3. Documentação (`docs/TDEE_ALGORITHM.md`)
- Fundamentação científica completa
- Referências de estudos
- Parâmetros configuráveis

---

## ⚠️ Limitação Atual

**A planilha atual NÃO tem peso diário nos Reports!**

O TDEE precisa de medições de peso seriadas. Atualmente:
- Aba `Goals` tem apenas peso_inicial e peso_final
- Aba `Reports` tem calorias diárias, mas não peso

### Sugestões para resolver:
1. **Opção A:** Adicionar coluna `peso` na aba `Reports`
2. **Opção B:** Criar nova aba `Pesagens` com: data, grupo, peso
3. **Opção C:** Bot do WhatsApp perguntar peso periodicamente

---

## 🚀 Para ver funcionando

1. **Backend rodando:**
```bash
cd hawthorne-app/server
npm install
npm start
```

2. **Frontend rodando:**
```bash
cd hawthorne-app
npm install  
npm run dev
```

3. **Acesse:** http://localhost:5173

4. **Faça login como admin** e selecione um paciente

5. **O TDEECard aparecerá** (mostrará "Dados insuficientes" até ter peso nos logs)

---

## 📝 Próximos Passos Sugeridos

1. [ ] Adicionar coleta de peso na planilha
2. [ ] Testar com dados reais de peso
3. [ ] Ajustar parâmetro ρ se necessário (baseado em resultados)
4. [ ] Adicionar gráfico de evolução do TDEE ao longo do tempo

---

**Bom descanso, Doutor! Quando acordar, a magia estará pronta para uso.** 🌙✨

*— Lola*
