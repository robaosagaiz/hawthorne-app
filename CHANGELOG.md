# Changelog

## [0.2.0] - 2026-01-30

### 🔴 Correções Críticas
- **Tela branca no Admin corrigida**: quando a API do Google Sheets falha, agora mostra mensagem de erro clara com botão "Tentar Novamente" em vez de crashar
- **Loading infinito resolvido**: PatientList agora tem tratamento de erro com feedback visual e retry

### 🟡 Nova Feature: Acompanhamento de Peso
- **Coluna de peso na tabela diária**: mostra peso do dia com variação (↑/↓) em relação ao registro anterior
- **Gráfico de Evolução de Peso** (WeightChart): novo gráfico com linha de peso, peso inicial como referência e meta
- **Tooltips detalhados**: variação diária e total no hover do gráfico
- **StatCard de peso atualizado**: mostra peso atual, variação total e número de registros
- **Backend atualizado**: coluna `peso` adicionada ao parser dos Reports (range A1:O)

### 🟢 Melhorias de UX
- **Mobile responsivo**: lista de pacientes agora usa cards touch-friendly no celular (em vez de tabela cortada)
- **Tabela de logs responsiva**: colunas de macros escondem no mobile, mantendo data/energia/peso/status
- **Grid de stats adaptativo**: 2 colunas no mobile, 4 no desktop
- **Stats bar responsiva**: wrap adequado em telas pequenas

### ⚙️ Infraestrutura
- Servidor aceita `PORT` via env (compatível com Render/Railway)
- Servidor serve frontend estático + API numa URL só
- Credenciais Google via `GOOGLE_CREDENTIALS_JSON` env var
- `render.yaml` para deploy one-click no Render
- Dockerfile atualizado: Node.js (frontend + API) em vez de nginx-only

## [0.1.0] - 2026-01-27

### Initial Release
- Dashboard com gráficos de energia, macros e distribuição
- TDEE Adaptativo
- Admin panel com lista de pacientes
- Relatórios detalhados com análises
- Backend API (Google Sheets → Express)
- Firebase Auth
