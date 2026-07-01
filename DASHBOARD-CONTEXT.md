# Dashboard Reports — Contexto Completo

Use este documento para retomar trabalho de dashboards numa conversa nova. Contém arquitetura, ficheiros-chave, padrões, mudanças recentes e TODOs.

---

## Arquitetura

```
[ Cliente em browser ]
   ↓ GitHub Pages — eljosimanpt231/aisolutions-reports
[ {slug}/index.html ] → [ assets/js/{config,utils,api,charts,dashboard,auth}.js ]
   ↓ fetch
[ webhook n8n: hooks.aisolutions.pt/webhook/reports-data ]
   ↓ workflow UHjdPIesKoRe5x4Q ("API - Reports Dashboard - AI Solutions")
   ├─ Build Queries (Code) — gera SQL por cliente/tipo
   ├─ Query Chatbot / Query Chatbot Hourly / Query Messaging / Query Clicks
   ├─ Query Leads / Query EcoDrive Platforms / Query Response Time / Query Extended
   └─ Combine Results (Code) → Respond Success
   ↓ Postgres prod (82.29.173.125:5432 criadordigital — schema por cliente)
   ↓ Postgres Kutt (clicks shortlinks)
```

- **Frontend**: GitHub Pages, vanilla JS + ApexCharts, dark glassmorphism
- **URL pública**: `https://eljosimanpt231.github.io/aisolutions-reports/{slug}/`
- **Repo GitHub**: `eljosimanpt231/aisolutions-reports` (branch `main`, auto-deploy via Pages)
- **Workflow n8n**: ID `UHjdPIesKoRe5x4Q`, prod `agentes.aisolutions.pt`
- **Webhook**: `GET https://hooks.aisolutions.pt/webhook/reports-data?client={slug}&start=YYYY-MM-DD&end=YYYY-MM-DD&type=chatbot|messaging|clicks|all`

---

## Estrutura de ficheiros (local: `C:\Users\Josia\n8n-workspace\reports-dashboard\`)

```
reports-dashboard/
├── DASHBOARD-CONTEXT.md          ← este ficheiro
├── DASHBOARDS-STATUS.md          ← tracking de validação por cliente
├── index.html                     ← landing page (selector cliente)
├── template.html                  ← template base para novos clientes
├── assets/
│   ├── css/                       ← styles partilhados
│   └── js/
│       ├── config.js              ← CLIENTS{} (slug → { name, password, services, schema, domainId, msgTables, costPerMessage, costPerMessageOp, startDate, channels, context, … }) + INSIGHTS{}
│       ├── utils.js               ← formatNumber, formatDate, getDateRange, getClientSlug
│       ├── api.js                 ← fetchData, transformChatbot, transformMessaging, transformEcoDriveExtras
│       ├── charts.js              ← ApexCharts (donut, bar, line, heatmap) — baseChartOptions, COLORS
│       ├── dashboard.js           ← orchestrator: initDashboard, loadData, renderDashboard, renderChatbotSection, renderMessagingSection, generateInsight, kpiCard, prettyMsgType, msgSeqLabel, MSG_SEQ_LABELS
│       ├── auth.js                ← password gate por cliente
│       └── mock.js                ← fallback se webhook offline
├── abadias/index.html
├── costuraurbana/index.html
├── ecodrive/index.html
├── farmatogo/index.html
├── fbeauty/index.html
├── georginamoura/index.html
├── hco/index.html
├── isabelpedroso/index.html       ← nutrição clínica (context clinica_nutri)
├── lojaginastica/index.html       ← Be on Sport
├── lojinhabebe/index.html
├── maninc/index.html
├── nowfitness/index.html
├── odiseguros/index.html
├── purarrituals/index.html
├── rlstore/index.html
├── rrcustoms/index.html
└── teclasdavida/index.html        ← churn em Junho 2026, mas pasta mantida
```

Cada `{slug}/index.html` é praticamente igual ao template — só muda o título e a referência ao slug. Carrega os JS partilhados com query-string de cache (`?v=N`).

---

## Cache busting

Cada vez que se edita JS partilhado, **incrementar `?v=N` em todos os index.html**:

```bash
cd reports-dashboard && find . -name "index.html" -exec sed -i 's/?v=30/?v=31/g' {} \;
```

Versão atual: **v=33**.

---

## Padrão de contexto por cliente

O `dashboard.js` adapta a secção chatbot ao `client.context`:
- `'leads'` — EcoDrive (escolas condução; agente Alice; leads + plataformas + response time)
- `'driving_school'` — Abadias (2 agentes IA: alunos + leads)
- `'credit_qualifier'` — Georgina Moura (qualificação crédito + reativação multi-fonte)
- `'lead_gen'` — Now Fitness (IG comentários → DMs → leads)
- `'qualificador'` — Teclas da Vida (crédito) (churn — não renderiza)
- `'porteiro'` — OdiSeguros (classificação clientes existentes vs novos leads)
- `'dual_agent'` — Costura Urbana (2 agentes IA em tabelas separadas: Loja + Assistência Técnica; KPIs + gráfico resolução por agente + donut conversas por agente + tabela detalhe). Dados já vêm por canal (`wp_loja`/`wp_assistencia`); o transform preserva `conversations_ai_only`/`with_human` por canal
- `'clinica'` — Dr. Marco Rego (assistente Íris; oftalmologia). Multi-canal (WA/IG/FB) numa só `chat_histories` via `inbox_key`. KPIs: Conversas, Respostas IA, Comentários Tratados, Qualificações, Escaladas. Extended: comentários (`comments_log`), qualif/escal (`handoffs_lock.motivo`), leads (`leads_formulario`)
- `undefined` / `'standard'` — todos os outros (chatbot normal + canais)

---

## Mensagens automáticas (v2 — atual)

**Backend (workflow Query Messaging)** retorna:
```json
{
  "operacionais": [ { "tipo": "MBWAY", "sends": 102 }, … ],
  "marketing": [ {
    "categoria": "Carrinho Abandonado",   // mapeada via mapCat()
    "campaign_type": "recovery",           // raw DB
    "sequence": 1,
    "sends": 735, "clicks": 153,
    "click_rate": 20.8,
    "orders": 25, "revenue": 3459.55, "revenue_per_msg": 4.71
  }, … ],
  "automaticas": [ … ],                    // legacy alias = marketing agregado por categoria
  "totals": { total_operacionais, total_marketing, total_mensagens, total_clicked, click_rate },
  "attributed_orders": 47,
  "attributed_revenue": 5008.38
}
```

**Frontend (`renderMessagingSection`)** renderiza:
1. KPI strip — Total / Operacionais / Marketing / Cliques / Encomendas
2. **ROI Marketing** (só se `client.costPerMessage`) — Custo Marketing, Receita, Margem Líquida, ROI %, ROAS · card extra "Custo Operacionais" (informativo, fora do ROI)
3. Donut "Distribuição por Tipo"
4. Tabela "Mensagens Operacionais" (tipo + count, sem receita)
5. Tabela full-width **"Marketing — Performance por Tipo & Sequência"** com 🥇 no melhor performer por categoria, scroll horizontal em ecrãs estreitos

**ROI** calculado APENAS sobre marketing (`totalMkt × costPerMessage`) — operacionais são transacionais, sem receita atribuída, fora do ROI.

### Labels custom de sequência (`MSG_SEQ_LABELS` em dashboard.js)

```js
MSG_SEQ_LABELS = {
  fbeauty: { recovery: { 1: '30min · cliente novo', 2: '24h · cliente novo', 3: '48h · cliente novo', 4: '30min · cliente atual', 5: '24h · cliente atual' } }
}
```

Padrão para adicionar: `{ slug: { campaign_type: { sequence_int: 'label' } } }`. Função `msgSeqLabel(slug, campaignType, sequence)` faz fallback para `Msg N`.

### prettyMsgType — mapeamento DB → label

```
MBWAY → MBWay · MULTIBANCO → Multibanco · MORADA → Morada · UNBOXING → Unboxing
'CÓDIGO POSTAL' → Código Postal
recovery → Carrinho Abandonado
upsell → Upsell
winback_21d/45d/60d/90d → Recuperação Nd
```

---

## Pricing por cliente — `costPerMessage` / `costPerMessageOp`

Em `config.js`. Valores actuais (após mudanças aplicadas até Maio 2026):

| Cliente | Marketing (`costPerMessage`) | Operacionais (`costPerMessageOp`) |
|---|---|---|
| HCO Cosméticos | 0,12€ | 0,05€ |
| FBeauty | 0,15€ | 0,08€ |
| FarmatoGo | 0,12€ | 0,05€ |
| RR Customs | 0,15€ | — (sem ops) |
| ManInc | 0,15€ | — (sem ops) |

**⚠️ Pendente aplicar (Junho 2026) — pricing reduzido por migração Cloud API:**

| Cliente | Marketing novo | Operacionais novo | Notas |
|---|---|---|---|
| HCO | **0,07€** (Cloud API mkt) | **0,05€** ops uazapi (MBWay/MB/Morada) + **0,04€** unboxing Cloud API | Operacionais MBWay/MB/Morada continuam em uazapi (não-oficial, sem custo Meta); unboxing migrou para Cloud API |
| FBeauty | **0,10€** | **0,07€** | Migração Cloud API completa |
| RR Customs | **0,12€** | — | Redução negociada (pedido em revisão pelo Pedro) |
| FarmatoGo | manter 0,12€ | manter 0,05€ | sem alteração |
| ManInc | manter 0,15€ | — | sem alteração |

A HCO precisa de dois preços diferentes para operacionais — atualmente `costPerMessageOp` é único. Modelo a alterar para suportar **per-tipo** quando se aplicar (ver TODO mais abaixo).

---

## Mudanças recentes (changelog inverso)

- **v=33** — Isabel Pedroso (nutrição clínica): novo context `clinica_nutri` (assistente Maria, qualificadora de leads + marcação 1ª consulta; chatbot-only). Modelo próprio: `isabel_pedroso.chat_histories` (colunas `session_id, message` jsonb; canal por prefixo do session_id — `WP-Isabel%`=WhatsApp, senão Instagram; humano por conteúdo `%atendente humano%`/`%[ATENDENTE]%`). Backend: `customChatbotQuery` (mesma shape channels do Marco Rego) + `extendedQuery` (funnel de `ghl_sync` por `current_stage`, automacao de `automsgs_log` send_status='sent', autonomia_leads = leads em `ghl_sync` sem mensagem de atendente). KPIs: Conversas, Mensagens IA, Leads Contactados, Consultas Agendadas. Blocos: donut por canal, Funil de Leads (Contactados→Agendadas→conversão), card Autonomia da IA (sobre leads), tabela Mensagens Automáticas (labels amigáveis). Sem messaging, sem Kutt. Junho: 323 conversas, funil 102→13, autonomia 74/115 (64%).
- **v=32** — Dr. Marco Rego: novo context `clinica` (clínica oftalmologia, assistente Íris). Modelo de dados próprio: uma só `marco_rego.chat_histories` com `inbox_key` a distinguir canal (`Dr Marco Rego Oftalmologista WhatsApp`=WhatsApp, `dr.marcorego.oftalmologia`=Instagram, `Facebook`=Facebook). Backend: `customChatbotQuery` (channels shape via CASE no inbox_key; humano detetado por conteúdo `%atendente humano%`) + `extendedQuery` (comentários de `comments_log`, qualificações/escalações de `handoffs_lock` por `motivo`, leads de `leads_formulario`). KPIs: Conversas, Respostas IA, Comentários Tratados, Qualificações, Escaladas. Tabelas: comentários/canal, qualif&escal/origem, leads/fonte. Sem messaging, sem Kutt.
- **v=31** — Costura Urbana: novo context `dual_agent` (Loja vs Assistência Técnica). Métricas por agente (resolução, conversas, mensagens IA) a partir de `data.channels` — sem alterações ao workflow. Maio: Loja 41,9% / Assistência 68,75% / global 50,3%. Escolhida resolução-por-conversa (favorável) vs deflexão-por-mensagem (pior, rejeitada).
- **v=30** — Fix: `jsonb_array_length(clicks)` rebentava quando `clicks` não era array. Guarda `jsonb_typeof='array'` adicionada. Label `winback_90d`. Be on Sport passou a mostrar mensagens automáticas.
- **v=29** — ROI calculado SÓ sobre marketing (operacionais fora). Adicionado `costPerMessageOp` separado, card informativo "Custo Operacionais".
- **v=28** — FBeauty: labels custom de sequência (30min/24h/48h cliente novo/atual).
- **v=27** — Marketing ROI table movida para linha própria full-width (era esmagada como 3ª coluna). `overflow-x:auto` + `min-width:680px`.
- **v=26** — Nova secção "Custo & ROI" (renomeada depois para "ROI Marketing") + tabela Marketing por Tipo & Sequência com 🥇 melhor performer. Backend devolve breakdown por `(campaign_type, message_sequence)` + `attr_breakdown` agregada por par.
- **v=25** — Adicionados dashboards Abadias, Costura Urbana, Be on Sport, Georgina Moura (e removida pasta Aprova).

---

## Schemas Postgres (essenciais)

**Por cliente** (`schema = client.schema`):
- `mensagens_automaticas` — colunas: `id, campaign_type, message_sequence, sent_at, failed_at, clicks (jsonb), customer_email/customer_phone, related_order_id` (variantes: RR Customs/FarmatoGo usam `send_failed (bool)` + `clicked_at (ts)`)
- `mensagens_operacionais` (só HCO/FBeauty/FarmatoGo) — `id, tipo, sent_at, phone, order_number, …`
- `order_attributions` — `order_id, campaign_type, message_sequence, revenue, attributed_at, attribution_method`
- `wp_chat_histories` / `instagram_chat_histories` / `facebook_chat_histories` (HCO tem também `_archive` + view `_full`)
- `products_database`, `base_dados_encomendas`, `base_dados_produtos`, `base_dados_variantes`, `base_conhecimento_*`

**Comum**: `public.kutt_links` para clicks (via Kutt domain `client.domainId`).

---

## Adicionar novo cliente

1. **Criar schema Postgres** (`scripts/create_client.js` — usa template)
2. **Adicionar a `CLIENTS{}` em `config.js`**:
   ```js
   slug: {
     name: 'Nome',
     password: 'slugYYYY',
     services: ['chatbot'|'messaging'|both],
     channels: ['whatsapp', 'instagram', 'facebook', 'chatwoot'],
     schema: 'nome_schema',
     domainId: <kutt>,
     startDate: 'YYYY-MM-DD',   // primeira data com dados; queries antes desta data clamp
     context: 'leads'|'driving_school'|'credit_qualifier'|'lead_gen'|'porteiro'|undefined,
     costPerMessage: 0.15,       // só se paga por mensagem
     costPerMessageOp: 0.08,     // só se tem operacionais E paga por elas
     msgTables: {                // só se tem messaging
       automaticas: { failFilter: 'failed_at IS NULL'|'send_failed = false' },
       operacionais: { typeCol: 'tipo' } | null
     }
   }
   ```
3. **Adicionar entry a `INSIGHTS{}`** (mês + texto HTML com `<strong>` para destaques)
4. **Criar pasta `{slug}/index.html`** — copiar `template.html`, ajustar title + meta
5. **Adicionar config ao workflow n8n** (`Build Queries` → CLIENT_MAP no início) — schema, chatTables, messaging config, domainId
6. **Bump cache version** + commit + push

---

## Trabalhar no workflow n8n

API REST:
```bash
curl https://agentes.aisolutions.pt/api/v1/workflows/UHjdPIesKoRe5x4Q \
  -H "X-N8N-API-KEY: <key em .claude.json>"
```

Key em `.claude.json` (segundo n8n-mcp-prod). PUT é não-atómico: re-GET após PUT para validar.

Ler `parameters.jsCode` dos nós Code. Para editar:
1. Fetch workflow → ficheiro
2. Patch o `jsCode` do nó (Build Queries ou Combine Results)
3. PUT de volta com `{ name, nodes, connections, settings }`

Padrão: `tmp_explore/patch_*.js` scripts isolados por mudança.

---

## TODOs / pendentes

### Alta prioridade (aplicar com pricing changes Junho 2026)

1. **HCO: custo operacionais por tipo** — actualmente `costPerMessageOp` é único valor; HCO precisa de **0,05€ para MBWay/Multibanco/Morada** e **0,04€ para Unboxing**.
   Opções:
   - (a) `costPerMessageOp` aceita objeto `{MBWAY:0.05, MULTIBANCO:0.05, MORADA:0.05, UNBOXING:0.04, default:0.05}` — render itera e soma
   - (b) Manter scalar + linha-a-linha na tabela operacionais com sua coluna de custo
   - (c) Backend devolve `cost_per_msg` por linha — frontend só soma
2. **Aplicar pricing Junho 2026** (HCO, FBeauty, RR Customs) — ver tabela acima
3. **EcoDrive — sem `costPerMessage`** (fixed-fee, sem messaging em DB); confirmar que renderização não tropeça

### Média prioridade

4. **Insights dinâmicos por mês** — `INSIGHTS{}` é hardcoded; idealmente um LLM gera baseado nos dados do mês corrente. Atualmente texto está stale (Março 2026).
5. **Period selector predefinido** — actualmente `30d`; clientes com `startDate` recente vêem janela parcial.
6. **Comparação mês anterior** — KPIs sem delta. Adicionar `vs mês anterior +X%`.
7. **Exportar PDF do dashboard** — pedido recorrente de alguns clientes.

### Baixa prioridade

8. **Heatmap horário** — Now Fitness e EcoDrive têm dados; chart preparado mas falta input.
9. **Mobile responsive review** — `min-width:680px` na tabela marketing força scroll em iPhones; aceitável mas pode melhorar.
10. **Multi-idioma** — todos os labels PT-PT; preparar i18n se algum cliente quiser EN.

---

## Conhecimento operacional

- **Cliente Teclas da Vida deu churn (Junho 2026)** — pasta `teclasdavida/` mantida mas sem renovação de insight.
- **Memo.ria** — novo cliente Junho 2026 (100€ + IVA mensalidade); ainda **não criado** no dashboard system (pendente onboarding técnico — schema, workflow, pasta).
- **RL Store** — agente downgrade Maio 2026 (200€ → 100€), agora secretária operacional + MBWay; dashboard não precisa de alteração estrutural.
- **Be on Sport** — passou a ter messaging em Maio 2026 (após fix v=30). Donna principal é Odete.
- **Costura Urbana** — alterações aplicadas Maio 2026; aguardar feedback no envio fatura Junho.
- **Lojinha Bebé** — schema chama-se `lojinha_bebe` (com underscore), nome interno também aparece como "Lojinha M&M".

---

## Comandos úteis

```bash
# Refetch workflow
curl https://agentes.aisolutions.pt/api/v1/workflows/UHjdPIesKoRe5x4Q -H "X-N8N-API-KEY: <key>" -o tmp_explore/wf_dashboards.json

# Test webhook
curl "https://hooks.aisolutions.pt/webhook/reports-data?client=fbeauty&start=2026-05-01&end=2026-05-31&type=messaging"

# Query DB direto (Node)
node -e "const {Client}=require('pg');const c=new Client({host:'82.29.173.125',port:5432,user:'postgres',password:'5C4765C8EB7E9EE8CB68B2DB578F9',database:'criadordigital'});c.connect().then(()=>c.query('SELECT … FROM <schema>.<tabela>')).then(r=>{console.log(r.rows);c.end()})"

# Bump cache version + push
cd reports-dashboard && find . -name "index.html" -exec sed -i 's/?v=N/?v=N+1/g' {} \; && git add -A && git commit -m "..." && git push

# Sintaxe check JS
node -c assets/js/dashboard.js
```

---

## Credenciais & links

- **GitHub repo**: https://github.com/eljosimanpt231/aisolutions-reports
- **Token GitHub**: ver `memory/github.md`
- **Workflow n8n**: https://agentes.aisolutions.pt (workflow `UHjdPIesKoRe5x4Q`)
- **n8n API key**: ver `.claude.json` (n8n-mcp-prod env)
- **Postgres prod**: `82.29.173.125:5432 criadordigital` (user `postgres`, pass em `.claude.json` postgres-prod env)
- **Postgres Kutt**: ver memory `shortlinks.md`
- **URLs públicas**: `https://eljosimanpt231.github.io/aisolutions-reports/{slug}/`
- **Passwords clientes**: em `INSIGHTS`/`CLIENTS` em `config.js` (formato `{slug}2026`)

---

## Como continuar trabalho noutra conversa

Coloca este ficheiro em contexto e diz:
> "Vou continuar trabalho no dashboard de reports. Lê `reports-dashboard/DASHBOARD-CONTEXT.md` para contexto completo. O pedido é: …"

E descreve só o pedido específico. O agente terá: arquitetura, ficheiros, padrões, mudanças recentes, pricing por cliente, schemas DB, comandos úteis, TODOs e credenciais.
