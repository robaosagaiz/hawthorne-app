# Plano: Hawthorne nas Lojas + Integração com Dados de Saúde

> Criado: 09/02/2026 | Status: Planejamento

---

## 🎯 Dois Objetivos

1. **Publicar o Hawthorne na Google Play e App Store**
2. **Puxar dados automáticos de saúde** (passos, peso, exercícios) dos dispositivos dos pacientes

---

## Parte 1: Publicação nas Lojas

### A Estratégia: Capacitor JS

O Hawthorne já é um app React + Vite. A melhor estratégia é usar **Capacitor** (do time Ionic) para empacotar o web app como app nativo. Isso:
- ✅ Reaproveita 100% do código existente
- ✅ Acessa APIs nativas (HealthKit, Health Connect, notificações push)
- ✅ Gera `.ipa` (iOS) e `.apk/.aab` (Android) para as lojas
- ✅ Não precisa reescrever nada em Swift/Kotlin
- ✅ Plugins nativos para HealthKit + Health Connect já existem

### Custos

| Item | Custo |
|------|-------|
| Google Play Developer | US$ 25 (único) |
| Apple Developer Program | US$ 99/ano (~R$ 600/ano) |
| **Total inicial** | **~R$ 750** |

### Etapas de Implementação

#### Fase 1: Setup Capacitor (1-2h)
```
npm install @capacitor/core @capacitor/cli
npx cap init "Hawthorne" "cloud.chamon.hawthorne" --web-dir dist
npx cap add android
npx cap add ios
```
- Configurar `capacitor.config.ts` (server URL, plugins)
- Build: `npm run build && npx cap sync`

#### Fase 2: Android — Google Play (3-4h)
1. Gerar keystore de assinatura
2. Configurar `build.gradle` (versionCode, signingConfigs)
3. Build release: `npx cap open android` → Android Studio → Generate Signed Bundle
4. Criar ficha na Google Play Console:
   - Screenshots (celular + tablet)
   - Descrição, ícone, feature graphic
   - Classificação de conteúdo
   - Política de privacidade (obrigatório)
5. Upload AAB → Teste interno → Revisão → Publicação
   - **Tempo de revisão Google: ~1-3 dias**

#### Fase 3: iOS — App Store (4-6h)
1. Precisa de **Mac com Xcode** ✅ (temos o Mac Mini!)
2. Criar certificados + provisioning profiles no Apple Developer
3. `npx cap open ios` → Xcode → configurar signing
4. Configurar HealthKit capability no Xcode
5. Criar ficha no App Store Connect:
   - Screenshots para cada tamanho de tela
   - Descrição, ícone, preview
   - Classificação
   - Política de privacidade
6. Archive → Upload → TestFlight → Review → Publicação
   - **Tempo de revisão Apple: ~1-2 dias** (pode levar mais na 1ª vez)
   - ⚠️ Apple é mais rigorosa: login demo, guia de HealthKit

#### Fase 4: CI/CD (opcional, depois)
- GitHub Actions para build automático a cada push
- Fastlane para upload automático às lojas

### ⚠️ Pré-requisitos para as Lojas

- [ ] **Política de Privacidade** — URL pública obrigatória (pode ser `hawthorne.chamon.cloud/privacy`)
- [ ] **Termos de Uso** — recomendado
- [ ] **Ícone do App** (1024x1024 PNG, sem transparência para iOS)
- [ ] **Screenshots** (pelo menos 2 tamanhos)
- [ ] **Conta Google Play** (email do Robson ou da clínica)
- [ ] **Conta Apple Developer** (precisa cadastrar — CPF ou CNPJ)
- [ ] **LGPD compliance** — o app lida com dados de saúde (dados sensíveis)

---

## Parte 2: Integração com Dados de Saúde

### O Ecossistema

| Plataforma | API | Dados |
|---|---|---|
| **iOS** | Apple HealthKit | Passos, peso, exercícios, freq. cardíaca, sono, calorias ativas |
| **Android** | Google Health Connect | Passos, peso, exercícios, freq. cardíaca, sono, calorias |
| **Wearables** | Via HealthKit/HC | Apple Watch, Garmin, Fitbit, Samsung, Mi Band, etc. |

**Ponto chave:** O relógio/pulseira sincroniza com HealthKit (iOS) ou Health Connect (Android). O Hawthorne lê dessas plataformas. Não precisa integrar com cada wearable individualmente! 🎯

### Plugin Recomendado

**`@capgo/capacitor-health`** — Plugin unificado e gratuito:
- ✅ HealthKit (iOS) + Health Connect (Android) num só plugin
- ✅ Lê: passos, peso, exercícios, calorias, frequência cardíaca, sono
- ✅ Capacitor 5+
- ✅ Open source

Alternativa: `@perfood/capacitor-healthkit` (só iOS) + plugin separado para Android

### Dados que Queremos Puxar

| Dado | Uso no Hawthorne | Prioridade |
|------|-----------------|-----------|
| **Passos diários** | ActivitySection (substitui registro manual) | 🔴 Alta |
| **Peso** | Dashboard peso (substitui registro manual) | 🔴 Alta |
| **Exercícios** | ActivitySection (tipo, duração, calorias) | 🔴 Alta |
| **Calorias ativas** | TDEE v2 (melhora estimativa de PAL) | 🟡 Média |
| **Freq. cardíaca** | Futuro — monitoramento | 🟢 Baixa |
| **Sono** | Futuro — correlação com peso | 🟢 Baixa |

### Fluxo Proposto

```
                     ┌─────────────────┐
  Apple Watch ──►    │   HealthKit     │
  Garmin ──────►     │  (iOS)          │──► Capacitor Plugin ──►┐
  Mi Band ─────►     │                 │                        │
                     └─────────────────┘                        │
                                                                ▼
                                                    ┌──────────────────┐
                                                    │ Hawthorne App    │
                                                    │ (Sync Service)   │──► Backend API ──► Google Sheets
                                                    │                  │    /api/sync-health
                                                    └──────────────────┘
                     ┌─────────────────┐                        ▲
  Samsung Watch ──►  │ Health Connect  │                        │
  Fitbit ──────────► │  (Android)      │──► Capacitor Plugin ──►┘
  Pixel Watch ─────► │                 │
                     └─────────────────┘
```

### Etapas de Implementação

#### Fase 1: Plugin + Permissões (2-3h)
1. Instalar `@capgo/capacitor-health`
2. Configurar permissões no `AndroidManifest.xml` e `Info.plist`
3. Tela de "Conectar dados de saúde" no ProfileView
4. Solicitar permissões ao paciente

#### Fase 2: Sync Service (3-4h)
1. Criar `healthSyncService.ts`:
   - `syncSteps()` — últimos 7 dias de passos
   - `syncWeight()` — últimas pesagens
   - `syncExercises()` — últimos exercícios
2. Sync automático ao abrir o app + a cada 30min em background
3. Deduplicação: não registrar duplicatas no Sheets

#### Fase 3: Backend Endpoint (2h)
1. `POST /api/sync-health` — recebe batch de dados do dispositivo
2. Append na aba Activities (mesmo formato atual)
3. Marcar `source: 'healthkit'` ou `source: 'health_connect'`
4. Deduplica por `(grupo, date, type, source)`

#### Fase 4: UI Integration (2h)
1. Badge/ícone mostrando fonte do dado (⌚ = automático, ✏️ = manual)
2. Toggle "Sincronizar dados de saúde" no ProfileView
3. Status de última sincronização

### ⚠️ Considerações Importantes

- **HealthKit só funciona em app nativo** (não funciona no browser/PWA) — por isso precisa do Capacitor
- **Health Connect precisa Android 14+** ou app Health Connect instalado
- **Permissões são granulares** — paciente escolhe quais dados compartilhar
- **Background sync no iOS** é limitado — Apple restringe muito
- **Dados de saúde = dados sensíveis (LGPD)** — precisa consentimento explícito

---

## 📋 Cronograma Proposto

| Semana | Atividade | Tempo |
|--------|-----------|-------|
| **Semana 1** | Setup Capacitor + build Android + build iOS | 6-8h |
| **Semana 2** | Integração HealthKit/Health Connect + sync | 5-7h |
| **Semana 3** | Política privacidade + screenshots + ficha lojas | 3-4h |
| **Semana 3** | Submit Google Play + App Store | 2h |
| **Semana 4** | Revisão + ajustes + publicação | - |

**Total estimado: ~16-21h de trabalho**
**Investimento: ~R$ 750** (contas de desenvolvedor)

---

## 🚀 Quick Wins (posso começar agora!)

1. **Setup Capacitor** — adicionar ao projeto, testar build
2. **Política de Privacidade** — gerar página
3. **Ícone do app** — criar versão 1024x1024

---

## Decisões Pendentes (preciso do Robson)

1. **Conta Apple Developer** — cadastrar no CPF do Robson ou CNPJ da clínica?
2. **Conta Google Play** — email `robsonachamon@gmail.com` ou criar uma específica?
3. **Nome na loja** — "Hawthorne" ou "Hawthorne - Nutrição"?
4. **App gratuito?** — Provavelmente sim (pacientes da clínica)
5. **Prioridade** — Começar pelas lojas ou pela integração de saúde primeiro?
6. **LGPD** — Precisa de assessoria jurídica para política de dados de saúde?
