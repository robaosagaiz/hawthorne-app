# Changelog - Hawthorne App

## [2026-01-27] - Integração com Google Sheets 🎉

### Adicionado
- **Backend API** (`/server`) - Servidor Express que lê dados do Google Sheets
  - `GET /api/health` - Status da conexão
  - `GET /api/patients` - Lista todos os pacientes (aba Goals)
  - `GET /api/patients/:grupoId` - Paciente específico
  - `GET /api/daily-logs/:grupoId` - Logs diários formatados para o Dashboard
  - `GET /api/reports/:grupoId` - Relatórios completos com análises

- **Serviço de API** (`apiService.ts`) - Camada de abstração para chamar o backend
  - Fallback automático para Firestore se API indisponível
  - Conversão de tipos Patient → UserProfile

- **UI Melhorada**
  - Lista de pacientes com busca e filtros
  - Indicador de fonte de dados (Google Sheets vs Firestore)
  - Cards de estatísticas melhorados
  - Banner do paciente no painel de detalhes

### Alterado
- `Dashboard.tsx` - Agora busca dados da API primeiro, depois Firestore
- `PatientList.tsx` - Interface totalmente redesenhada com mais informações
- `AdminDashboard.tsx` - Header melhorado com navegação

### Dados Reais
O app agora mostra dados reais de **23 pacientes** vindos da planilha do Google Sheets, incluindo:
- Metas calóricas e de macros
- Peso inicial/atual
- Objetivo (Emagrecimento, Ganho de massa, etc.)
- Medicação (Tirzepatida, etc.)

---

## Como Rodar

### 1. Backend API (Terminal 1)
```bash
cd server
npm install
npm start
```
A API roda em `http://localhost:3001`

### 2. Frontend (Terminal 2)
```bash
npm install
npm run dev
```
O app roda em `http://localhost:5173`

### Produção
Para deploy, você precisa:
1. Hospedar o backend em algum lugar (Railway, Render, VPS)
2. Atualizar `VITE_API_URL` no `.env` com a URL do backend
3. Fazer build: `npm run build`
4. Servir a pasta `dist/`

---

Desenvolvido com ❤️ pela Lola enquanto o Robson voava para NY 🛫
