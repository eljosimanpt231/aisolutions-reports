# NEXO · Dashboard EduGEP

Dashboard operacional do agente IA **NEXO** para a **EduGEP** (Setúbal).
Componente pilot do projecto EduGEP × AI Solutions, 20 anos EduGEP (2006–2026).

**URL producao:** https://eljosimanpt231.github.io/aisolutions-reports/edugep-nexo/

---

## Acesso

- Password unica partilhada (armazenada como hash SHA-256 no bundle)
- Sessao 8h em `localStorage` (`nexo_auth_v1`)
- Rate limit local 5 tentativas / 60s
- Botao "Sair" no header limpa a sessao

**Password actual:** ver `implementacao.md` do EduGEP ou pedir ao Josias.

**Trocar password:**
```bash
node -e "console.log(require('crypto').createHash('sha256').update('NOVA_PASSWORD').digest('hex'))"
```
Substituir o valor de `PW_HASH` em `assets/js/auth.js` e fazer commit + push.

**Upgrade path (server-side auth):** documentado na proposta final `dashboard/06-proposta-final.md` seccao 2 — n8n webhook `/webhook/edugep-nexo-auth` com bcrypt em env var. ~4h de trabalho para migrar.

---

## O que mostra

### Visao geral (KPIs)
- Mensagens 7d + delta vs 7d anterior
- Sessoes unicas 7d + delta
- Mensagens 30d
- Sessoes 30d
- Handoffs para atendente
- Canais activos (WA/IG/FB)

### Insights IA (gerados por Claude Haiku 4.5 via OpenRouter)
- **Top duvidas** — 5 topicos mais falados + prioridade + exemplos anonimizados
- **Qualidade das respostas NEXO** — score 1-5, reasoning, sentiment por canal, melhor resposta destacada
- **Campanhas mencionadas** — quais das 10 campanhas activas EduGEP surgem nas conversas

### Volume
- Chart line stacked mensagens/dia por canal (30d)
- Donut distribuicao total por canal

### Actividade
- Heatmap dia-da-semana × hora (30d)
- Timeline de eventos das ultimas 24h

### Conversas
- Lista das ultimas 100 sessoes (nome se em `edugep.leads`, telefone, canal, tags handoff/reset)
- Transcricao completa da sessao clicada (bolhas coloridas por origem, `textContent` para XSS-safe)

---

## Arquitectura

**Stack:** Vanilla JS ES6 + ApexCharts 3.54.1 self-hosted + CSS namespace `.edugep-*`

**Dados:** snapshots JSON estaticos em `data/*.json`
- Regenerados via `scripts/fetch-data.mjs` (Node + `pg`)
- Query directa ao Postgres producao `edugep` schema (read-only)

**Insights IA:** `scripts/gen-insights.mjs`
- Puxa 200 msgs recentes anonimizadas (strip telefones/emails)
- Chama OpenRouter (`anthropic/claude-haiku-4.5`)
- Custo ~$0.025 por corrida completa (3 blocos)
- Escreve `data/insights/*.json`

**Auth:** client-side hash SHA-256 (MVP; upgrade path para n8n server-side)

**Deploy:** GitHub Pages auto no push para `main`

---

## Ficheiros

```
edugep-nexo/
├── index.html              (SPA pagina unica)
├── assets/
│   ├── css/edugep.css      (namespace .edugep-*, dark-first, paleta REAL edugep.pt)
│   ├── js/
│   │   ├── auth.js         (password overlay + session 8h)
│   │   └── dashboard.js    (orquestrador, textContent para XSS)
│   ├── vendor/
│   │   └── apexcharts.min.js (self-hosted 3.54.1)
│   └── img/
│       ├── edugep-logo.png   (extraido de edugep.pt)
│       └── edugep-icon-192.png (favicon)
└── data/
    ├── overview.json
    ├── series-30d.json
    ├── channel-distribution.json
    ├── heatmap.json
    ├── sessions-recent.json
    ├── transcripts.json    (top 20 sessoes com conteudo completo)
    ├── campanhas.json
    ├── leads.json
    ├── contactos-servicos.json
    ├── kb-chunks.json
    ├── nexo-timeline-24h.json
    └── insights/
        ├── top-duvidas.json
        ├── quality-sentiment.json
        ├── campaigns-mentions.json
        └── _meta.json
```

---

## Manutencao (refresh de dados)

Os scripts `fetch-data.mjs` e `gen-insights.mjs` estao em `C:/Users/Josia/n8n-workspace/tmp_explore/edugep-dashboard/` (fora do repo publico por seguranca — contêm credenciais Postgres e chave OpenRouter).

**Refresh manual completo:**
```bash
cd C:/Users/Josia/n8n-workspace/tmp_explore/edugep-dashboard
node fetch-data.mjs      # regenera todos os snapshots JSON
node gen-insights.mjs    # regenera os 3 blocos LLM (~$0.025)

# Copiar para o repo:
cp -r edugep-nexo/data/. ../edugep-dashboard-repo/aisolutions-reports/edugep-nexo/data/

cd ../edugep-dashboard-repo/aisolutions-reports
git add edugep-nexo/data
git commit -m "chore(edugep-nexo): refresh data"
git push
```

**Automatizacao futura (Fase 2):** GH Action com cron 6h chama estes scripts (ver `dashboard/06-proposta-final.md` seccao 4).

---

## Regras duras (nao violar)

1. **NUNCA `innerHTML`** para renderizar `message.content` — sempre `textContent`
2. **CSS namespace `.edugep-*`** — nao colidir com CSS partilhado do repo
3. **Sem CDN externo** — ApexCharts self-hosted; sem Google Fonts
4. **Postgres read-only** — todas as queries SELECT-only; nunca INSERT/UPDATE/DELETE
5. **Anonimizacao antes de LLM** — telefones/emails/nomes substituidos por placeholders

---

## Roadmap curto

- **Fase 1 (feito):** MVP com dados reais, insights LLM, deploy publico com password
- **Fase 2:** GH Action cron 6h para refresh automatico + webhook n8n para queries live (paginacao chat viewer)
- **Fase 3:** Custom domain `nexo.edugep.pt`, SSO Cloudflare Access + Google Workspace `@edugep.pt`, feedback loop, KB coverage heatmap com pgvector

---

**Contactos:**
- Josias Ponte (AI Solutions) — info@aisolutions.pt
- DPO EduGEP — dpo@edugep.pt

*20 anos a ligar pessoas · 2006—2026*
