// Main dashboard orchestrator
let currentPeriod = '30d';
let currentClient = null;
let customStartDate = null;
let customEndDate = null;

// Animated counter
function animateValue(el, target, duration = 1800) {
  if (!el || isNaN(target)) { if (el) el.textContent = target; return; }
  const isFloat = String(target).includes('.');
  const startTime = performance.now();
  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = target * ease;
    el.textContent = isFloat
      ? current.toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      : Math.round(current).toLocaleString('pt-PT');
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

async function initDashboard(slug) {
  currentClient = CLIENTS[slug];
  if (!currentClient) return;
  setupPeriodSelector();
  await loadData();
}

function setupPeriodSelector() {
  const customRange = document.getElementById('custom-range');
  const dateStart = document.getElementById('date-start');
  const dateEnd = document.getElementById('date-end');
  const dateApply = document.getElementById('date-apply');
  const slug = getClientSlug();
  const clientConf = CLIENTS[slug];
  const today = new Date();
  const thirtyAgo = new Date(today);
  thirtyAgo.setDate(today.getDate() - 30);

  // Enforce client start date
  const minDate = clientConf?.startDate || '2025-01-01';
  const effectiveStart = thirtyAgo < new Date(minDate) ? minDate : formatDate(thirtyAgo);

  dateEnd.value = formatDate(today);
  dateStart.value = effectiveStart;
  dateStart.min = minDate;
  dateEnd.min = minDate;

  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelector('.period-btn.active')?.classList.remove('active');
      btn.classList.add('active');
      if (btn.dataset.period === 'custom') { customRange.style.display = 'flex'; return; }
      customRange.style.display = 'none';
      currentPeriod = btn.dataset.period;
      customStartDate = null; customEndDate = null;
      await loadData();
    });
  });
  dateApply.addEventListener('click', async () => {
    if (dateStart.value && dateEnd.value) {
      customStartDate = dateStart.value; customEndDate = dateEnd.value;
      currentPeriod = 'custom';
      await loadData();
    }
  });
}

async function loadData() {
  let { start, end } = (currentPeriod === 'custom' && customStartDate && customEndDate)
    ? { start: customStartDate, end: customEndDate }
    : getDateRange(currentPeriod);
  const slug = getClientSlug();
  const client = CLIENTS[slug];

  // Enforce client start date — never query before IA went live
  if (client.startDate && start < client.startDate) {
    start = client.startDate;
  }
  showLoading();
  _cache = { key: null, data: null }; // clear cache

  const [chatbot, messaging, clicks] = await Promise.all([
    (client.services.includes('chatbot') && client.schema) ? getChatbotMetrics(client.schema, start, end) : null,
    (client.services.includes('messaging') && client.schema) ? getMessagingMetrics(client.schema, start, end) : null,
    getClickMetrics(client.domainId, start, end)
  ]);

  renderDashboard(client, chatbot, messaging, clicks);
}

function showLoading() {
  document.getElementById('dashboard-content').innerHTML = '<div class="loading"><div class="spinner"></div>A carregar dados...</div>';
}

function renderDashboard(client, chatbot, messaging, clicks) {
  const content = document.getElementById('dashboard-content');
  let html = '';
  const slug = getClientSlug();

  if (client.services.includes('chatbot') && chatbot) {
    html += renderChatbotSection(client, chatbot, clicks);
  }
  if (client.services.includes('messaging') && messaging) {
    if (html) html += '<hr class="section-divider">';
    html += renderMessagingSection(client, messaging);
  }

  // Insights — dynamic based on real data
  const insight = generateInsight(slug, client, chatbot, messaging, clicks);
  if (insight) {
    if (html) html += '<hr class="section-divider">';
    html += renderInsightsSection(insight);
  }

  if (!html) html = '<div class="loading"><p>Sem dados disponíveis para o período selecionado.</p></div>';
  content.innerHTML = html;

  requestAnimationFrame(() => {
    // Init charts independently — errors in one don't block others
    if (chatbot) {
      try { initChatbotCharts(client, chatbot); } catch (e) { console.error('initChatbotCharts:', e); }
      try { initExtendedCharts(chatbot); } catch (e) { console.error('initExtendedCharts:', e); }
    }
    if (messaging) {
      try { initMessagingCharts(messaging); } catch (e) { console.error('initMessagingCharts:', e); }
    }
    document.querySelectorAll('[data-count]').forEach(el => {
      const raw = el.dataset.count;
      const val = parseFloat(raw);
      const suffix = el.dataset.suffix || '';
      if (isNaN(val) || /[a-zA-Z]/.test(raw)) {
        el.textContent = raw; // keep strings like "14s", "2.3h"
      } else {
        animateValue(el, val);
        if (suffix) setTimeout(() => { el.textContent += suffix; }, 1900);
      }
    });
  });
}

// ---- Chatbot Section (adapts per client context) ----
function renderChatbotSection(client, data, clicks) {
  const total = data.total_conversations;
  const aiRate = data.ai_resolution_rate;
  const msgsAI = data.messages_ai;
  const msgsHuman = data.messages_human;
  const aiOnly = data.conversations_ai_only;
  const withHuman = data.conversations_with_human;
  const kuttClicks = clicks?.total_clicks || 0;
  const activeChannels = Object.keys(data.channels || {});
  const context = client.context || 'standard';
  const leads = data.leads_total || data.leads_period || 0;

  const periodLabel = { '7d': '7 dias', '15d': '15 dias', '30d': '30 dias', 'this-month': 'este mês', 'last-month': 'mês anterior', 'custom': 'personalizado' }[currentPeriod] || '30 dias';

  // Adapt KPIs based on client context
  let kpiCards = '';

  // Conversas — always shown
  kpiCards += kpiCard('Conversas', total, periodLabel, 2);

  if (context === 'driving_school') {
    // Abadias: dual agent (alunos + leads)
    const ext = data.extended || {};
    const b = ext.breakdown || {};
    const lr = ext.leads_recolhidos || {};
    const alunosTotal = parseInt(b.alunos_total) || 0;
    const leadsTotal = parseInt(b.leads_total) || 0;
    const alunosTaxa = parseFloat(b.alunos_taxa_pct) || 0;
    const leadsTaxa = parseFloat(b.leads_taxa_pct) || 0;
    const leadsRec = parseInt(lr.total) || 0;
    const totalAll = alunosTotal + leadsTotal;
    const alunosPct = totalAll > 0 ? Math.round((alunosTotal / totalAll) * 100) : 0;
    const leadsPct = totalAll > 0 ? Math.round((leadsTotal / totalAll) * 100) : 0;

    kpiCards += kpiCardPercent('Taxa Resolução IA', aiRate, 3, aiRate >= 70 ? 'positive' : aiRate >= 50 ? '' : 'warning');
    if (alunosTotal > 0) kpiCards += kpiCard('Conversas Alunos', alunosTotal, `${alunosPct}% do total · ${alunosTaxa}% IA`, 4);
    if (leadsTotal > 0) kpiCards += kpiCard('Conversas Leads', leadsTotal, `${leadsPct}% do total · ${leadsTaxa}% IA`, 5);
    if (leadsRec > 0) kpiCards += kpiCard('Leads Recolhidos', leadsRec, 'qualificados pela IA', 6, 'positive');
  } else if (context === 'credit_qualifier') {
    // Georgina Moura: lead qualification (multi-source) + reactivation for credit/loans
    const ext = data.extended || {};
    const ls = ext.leads_stats || {};
    const rs = ext.reactivation_stats || {};
    const qBySrc = ext.qualification_by_source || [];
    const totalLeads = parseInt(ls.total) || 0;
    const qualificadas = parseInt(ls.qualificadas) || 0;
    const emQual = parseInt(ls.em_qualificacao) || 0;
    const taxaQual = parseFloat(ls.taxa_qualificacao_pct) || 0;
    const reactSent = parseInt(rs.enviadas_periodo) || 0;
    const reactPendente = parseInt(rs.pendentes) || 0;

    // Find specific sources
    const ads = qBySrc.find(s => s.source === 'meta_ads');
    const inbound = qBySrc.find(s => s.source === 'inbound');

    kpiCards += kpiCard('Leads Totais', totalLeads, 'todas as fontes', 3);
    kpiCards += kpiCard('Leads Qualificadas', qualificadas, `${taxaQual}% taxa de qualificação`, 4, 'positive');
    if (emQual > 0) kpiCards += kpiCard('Em Qualificação', emQual, 'IA ainda em conversa', 5);

    // Meta Ads specific KPI — most relevant for ROI
    if (ads) {
      const adsQual = parseInt(ads.qualificadas) || 0;
      const adsTotal = parseInt(ads.total) || 0;
      const adsRate = parseFloat(ads.taxa_pct) || 0;
      kpiCards += kpiCard('Leads Meta Ads', `${adsQual}/${adsTotal}`, `${adsRate}% qualificadas das pagas`, 6, adsRate >= 50 ? 'positive' : 'warning');
    }

    if (reactSent > 0) {
      kpiCards += kpiCard('Reativações Enviadas', reactSent, `${reactPendente} pendentes na base`, 6);
    }
  } else if (context === 'qualificador') {
    // OdiSeguros: uses real classification from odiseguros.contatos_bloqueados
    const cls = data.extended?.classification || {};
    const existentes = parseInt(cls.clientes_existentes) || 0;
    const novosLeads = parseInt(cls.novos_leads) || 0;
    const urgentes = parseInt(cls.urgentes) || 0;
    const intHumana = parseInt(cls.intervencao_humana) || 0;
    const naoClassif = parseInt(cls.nao_classificados) || 0;

    kpiCards += kpiCard('Mensagens IA', msgsAI, 'qualificação + recolha dados', 3);
    kpiCards += kpiCard('Novos Leads', novosLeads, 'qualificados + dados recolhidos', 4, 'positive');
    kpiCards += kpiCard('Clientes Existentes', existentes, 'identificados pela IA', 5);
    if (urgentes > 0) kpiCards += kpiCard('Urgentes', urgentes, 'precisam seguro hoje', 6, 'warning');
    else if (naoClassif > 0) kpiCards += kpiCard('Em Qualificação', naoClassif, 'conversas a decorrer', 6);
  } else if (context === 'lead_gen') {
    // Now Fitness: comments → DMs → leads funnel
    const t = data;
    const totalLeads = t.total_leads || 0;
    const uniqueUsers = t.unique_users || total;
    const comments = t.total_comments || 0;
    const dmsStarted = t.dms_initiated || 0;
    const convRate = t.conversion_rate || 0;
    const followUps = t.total_follow_ups || 0;
    const pilates = t.pilates_leads || 0;
    const pt = t.pt_leads || 0;

    kpiCards = ''; // reset
    kpiCards += kpiCard('Utilizadores Únicos', uniqueUsers, periodLabel, 2);
    kpiCards += kpiCard('Leads Registados', totalLeads, pilates > 0 || pt > 0 ? `Pilates: ${pilates} | PT: ${pt}` : '', 3, 'positive');
    kpiCards += kpiCardPercent('Taxa Conversão', convRate, 4, convRate >= 10 ? 'positive' : convRate >= 5 ? '' : 'warning');
    if (comments > 0) kpiCards += kpiCard('Comentários', comments, `${dmsStarted} DMs enviadas`, 5);
    if (followUps > 0) kpiCards += kpiCard('Follow-ups', followUps, 'mensagens de acompanhamento', 6);
  } else if (context === 'porteiro') {
    // Lojinha Bebé: focus on "handled without human"
    kpiCards += kpiCard('Resolvidas Sem Humano', aiOnly, `de ${total} conversas`, 3, aiRate >= 50 ? 'positive' : '');
    kpiCards += kpiCardPercent('% Sem Intervenção', aiRate, 4, aiRate >= 50 ? 'positive' : 'warning');
  } else if (context === 'leads') {
    // EcoDrive: leads + platforms + response times + IA vs Equipa comparison
    const leadsCount = data.leads_period || 0;
    const respTime = data.response_time;
    const humanResp = data.extended?.human_response_time;
    // Count messages from extended.daily: IA vs Equipa
    const dailyRaw = data.extended?.daily || [];
    const totalAIMsgs = dailyRaw.reduce((s, d) => s + (parseInt(d.ai_msgs) || 0), 0);
    const totalTeamMsgs = dailyRaw.reduce((s, d) => s + (parseInt(d.team_msgs) || 0), 0);
    const multiplier = totalTeamMsgs > 0 ? (totalAIMsgs / totalTeamMsgs).toFixed(1) : null;

    if (leadsCount > 0) kpiCards += kpiCard('Leads Recolhidos', leadsCount, periodLabel, 3, 'positive');
    kpiCards += kpiCardPercent('Taxa Resolução IA', aiRate, 4, aiRate >= 70 ? 'positive' : aiRate >= 50 ? '' : 'warning');
    if (totalAIMsgs > 0) {
      kpiCards += kpiCard('Mensagens IA', totalAIMsgs, multiplier ? `${multiplier}× mais que a equipa` : 'automatizadas', 5, 'positive');
    }
    if (totalTeamMsgs > 0) {
      kpiCards += kpiCard('Mensagens Equipa', totalTeamMsgs, 'respostas humanas', 6);
    }
    // IA response is near real-time (~40-60s in practice), not queryable from DB
    // (DB only logs after AI processes, which creates artificially low 2s values)
    kpiCards += kpiCard('Velocidade IA', '~1min', 'resposta quase imediata', 5, 'positive');
    if (humanResp?.median_min) {
      const medMin = parseFloat(humanResp.median_min);
      const avgMin = parseFloat(humanResp.avg_min);
      const medLabel = medMin < 60 ? `${medMin.toFixed(0)}min` : `${(medMin/60).toFixed(1)}h`;
      const avgLabel = avgMin < 60 ? `${avgMin.toFixed(0)}min` : `${(avgMin/60).toFixed(1)}h`;
      kpiCards += kpiCard('Velocidade Equipa', medLabel, `mediana resposta (média ${avgLabel})`, 6);
    }
  } else {
    // Standard: RR, HCO, Teclas, OdiSeguros
    kpiCards += kpiCardPercent('Taxa Resolução IA', aiRate, 3, aiRate >= 70 ? 'positive' : aiRate >= 50 ? '' : 'warning');
    kpiCards += kpiCard('Mensagens IA', msgsAI, `${formatNumber(msgsHuman)} humanas`, 4);
  }

  if (kuttClicks > 0) {
    kpiCards += kpiCard('Cliques em Links', kuttClicks, 'partilhados pelo agente', 5);
  }
  // Off-hours KPI (all chatbot clients that have this data)
  const offHours = data.extended?.off_hours;
  if (offHours && parseFloat(offHours.off_hours_pct) > 0) {
    kpiCards += kpiCard('Fora de Horas', offHours.off_hours_pct, 'mensagens em fim-de-semana ou 18h-9h', 6, 'positive', '%');
  }

  // Charts
  let chartsHtml = '';
  if (activeChannels.length > 1) {
    chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>Conversas por Canal</h3><div class="chart-container" id="chart-channels"></div></div>`;
  }
  // Platform breakdown (EcoDrive, Pura Rituals, RL Store, any with multiple Chatwoot inboxes)
  if (data.platforms?.length > 1) {
    chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>Conversas por Plataforma</h3><div class="chart-container" id="chart-platforms"></div></div>`;
  }

  if (context === 'lead_gen') {
    // Now Fitness: funnel chart only (leads table is rendered full-width at the end)
    chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>Funil de Conversão</h3><div class="chart-container" id="chart-funnel"></div></div>`;
  } else if (context === 'driving_school') {
    // Abadias: dual donut alunos vs leads + inboxes + categorias
    const ext = data.extended || {};
    if (ext.breakdown && ((parseInt(ext.breakdown.alunos_total) || 0) + (parseInt(ext.breakdown.leads_total) || 0)) > 0) {
      chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>Alunos vs Leads</h3><div class="chart-container" id="chart-abadias-split"></div></div>`;
      chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>Resolução IA por Tipo</h3><div class="chart-container" id="chart-abadias-resolucao"></div></div>`;
    }
    if (ext.inboxes?.length > 0) {
      chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>Conversas por Inbox</h3><div class="chart-container" id="chart-abadias-inboxes"></div></div>`;
    }
    if (ext.leads_categorias?.length > 0) {
      chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>Categorias de Interesse (Leads)</h3><div class="chart-container" id="chart-abadias-categorias"></div></div>`;
    }
  } else if (context === 'credit_qualifier') {
    // Georgina Moura: Sources donut + Qualification rate by source + Objetivos
    const ext = data.extended || {};
    if (ext.leads_by_source?.length > 0) {
      chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>Leads por Fonte</h3><div class="chart-container" id="chart-leads-sources"></div></div>`;
    }
    if (ext.qualification_by_source?.length > 0) {
      chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>Taxa de Qualificação por Fonte</h3><div class="chart-container" id="chart-qualif-rate"></div></div>`;
    }
    if (ext.leads_objetivos?.length > 0) {
      chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>Objetivos dos Leads</h3><div class="chart-container" id="chart-objetivos"></div></div>`;
    }
  } else if (context === 'qualificador') {
    // OdiSeguros: Novos vs Existentes donut (real classification) + Ramos bar chart + Urgentes table
    const ext = data.extended;
    chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>Classificação de Contactos</h3><div class="chart-container" id="chart-classification"></div></div>`;
    if (ext?.ramos?.length > 0) {
      chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>Ramos de Interesse</h3><div class="chart-container" id="chart-ramos"></div></div>`;
    }
    if (ext?.urgentes_detalhe?.length > 0) {
      const RAMO_LABELS = { automovel_particular: 'Auto Particular', automovel_empresa: 'Auto Empresa', tvde: 'TVDE', saude_dental: 'Saúde Dental', multiriscos_habitacao: 'Multirriscos', acidentes_trabalho: 'AT', vida_credito: 'Vida', responsabilidade_civil: 'RC' };
      const cleanPhone = (p) => p ? String(p).split('@')[0].replace(/^351/, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : '—';
      const rows = ext.urgentes_detalhe.map(u => `<tr><td>${cleanPhone(u.telefone)}</td><td>${RAMO_LABELS[u.ramo] || u.ramo || '—'}</td><td style="font-size:0.75rem">${(u.resumo_dados||'').substring(0,120)}${(u.resumo_dados||'').length>120?'…':''}</td></tr>`).join('');
      chartsHtml += `<div class="chart-card glass fade-in fade-in-6" style="grid-column: 1 / -1"><h3>Leads Urgentes (precisam seguro hoje)</h3><table class="data-table"><thead><tr><th>Contacto</th><th>Ramo</th><th>Detalhe</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }
  } else {
    chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>${context === 'porteiro' ? 'Sem Humano vs Com Humano' : 'Resolução IA'}</h3><div class="chart-container" id="chart-ai-human"></div></div>`;
  }

  const hasHourly = data.hourly_distribution?.some(h => h.count > 0);
  if (hasHourly) {
    chartsHtml += `<div class="chart-card glass fade-in fade-in-6"><h3>Distribuição Horária</h3><div class="chart-container" id="chart-hours"></div></div>`;
  }

  // Extended charts (EcoDrive daily, Lojinha weekly evolution)
  const ext = data.extended;
  if (ext?.daily?.length > 0) {
    chartsHtml += `<div class="chart-card glass fade-in fade-in-6" style="grid-column: 1 / -1"><h3>Evolução Diária</h3><div class="chart-container" id="chart-daily" style="height:300px"></div></div>`;
  }
  if (ext?.conversationTypes?.length > 0) {
    chartsHtml += `<div class="chart-card glass fade-in fade-in-6" style="grid-column: 1 / -1"><h3>Evolução Semanal — IA vs Humano</h3><div class="chart-container" id="chart-weekly-conv" style="height:300px"></div></div>`;
  }
  if (ext?.weekly?.length > 0 && !ext?.conversationTypes) {
    chartsHtml += `<div class="chart-card glass fade-in fade-in-6" style="grid-column: 1 / -1"><h3>Mensagens por Semana</h3><div class="chart-container" id="chart-weekly-msgs" style="height:300px"></div></div>`;
  }
  // Agent breakdown (Lojinha Bebé)
  if (ext?.agentBreakdown?.length > 0) {
    // Build agent table
    const agentTotals = {};
    ext.agentBreakdown.forEach(r => {
      const id = r.agent_id;
      if (!agentTotals[id]) agentTotals[id] = { fb: 0, ig: 0, total: 0 };
      agentTotals[id].total += parseInt(r.cnt) || 0;
      if (r.platform === 'facebook') agentTotals[id].fb += parseInt(r.cnt) || 0;
      if (r.platform === 'instagram') agentTotals[id].ig += parseInt(r.cnt) || 0;
    });
    const AGENT_NAMES = { '6': 'Ricardo Pinto', '7': 'Miriam Silva', '8': 'Andreia Pinto', '9': 'Cristina Pinto', '10': 'Inês Francisco' };
    const sorted = Object.entries(agentTotals).sort((a, b) => b[1].total - a[1].total);
    let agentRows = sorted.map(([id, d]) => `<tr><td>${AGENT_NAMES[id] || 'Agente ' + id}</td><td class="num">${formatNumber(d.fb)}</td><td class="num">${formatNumber(d.ig)}</td><td class="num"><strong>${formatNumber(d.total)}</strong></td></tr>`).join('');

    chartsHtml += `<div class="chart-card glass fade-in fade-in-6"><h3>Equipa — Mensagens por Agente</h3><div class="chart-container" id="chart-agents"></div></div>`;
    chartsHtml += `<div class="chart-card glass fade-in fade-in-6"><h3>Detalhe por Agente</h3><table class="data-table"><thead><tr><th>Agente</th><th>Facebook</th><th>Instagram</th><th>Total</th></tr></thead><tbody>${agentRows}</tbody></table></div>`;
  }

  if (ext?.leads_by_interest?.length > 0) {
    const top10 = ext.leads_by_interest.slice(0, 10);
    let rows = top10.map(l => `<tr><td>${l.interesse}</td><td class="num">${l.total}</td></tr>`).join('');
    chartsHtml += `<div class="chart-card glass fade-in fade-in-6"><h3>Leads por Interesse</h3><table class="data-table"><thead><tr><th>Interesse</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  // Now Fitness: leads table full-width at the bottom (after all charts)
  if (context === 'lead_gen') {
    const leadRecords = data.lead_records || [];
    if (leadRecords.length > 0) {
      const cleanPhone = (p) => p ? String(p).split('@')[0].replace(/^351/, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : '—';
      let leadsTableRows = leadRecords.map(l => `<tr><td>${l.nome || '—'}</td><td>${cleanPhone(l.telefone)}</td><td>${l.tipo_registo || '—'}</td><td style="font-size:0.813rem">${l.objetivo_cliente || '—'}</td><td>${l.criado_em?.substring(0,10) || '—'}</td></tr>`).join('');
      chartsHtml += `<div class="chart-card glass fade-in fade-in-6" style="grid-column: 1 / -1"><h3>Leads Registados (${leadRecords.length})</h3><table class="data-table"><thead><tr><th>Nome</th><th>Contacto</th><th>Tipo</th><th>Objetivo</th><th>Data</th></tr></thead><tbody>${leadsTableRows}</tbody></table></div>`;
    }
  }

  // Abadias: leads recolhidos + handoffs full-width
  if (context === 'driving_school') {
    const extA = data.extended || {};
    const leadsA = extA.leads_recent || [];
    if (leadsA.length > 0) {
      const cleanPhone = (p) => p ? String(p).split('@')[0].replace(/^351/, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : '—';
      let rows = leadsA.map(l => `<tr><td>${l.nome || '—'}</td><td>${cleanPhone(l.telefone)}</td><td>${l.categoria_interesse || '—'}</td><td>${l.escola_preferida || '—'}</td><td><span class="tag tag-mk">${l.status || '—'}</span></td><td>${l.created_at?.substring(0,10) || '—'}</td></tr>`).join('');
      chartsHtml += `<div class="chart-card glass fade-in fade-in-6" style="grid-column: 1 / -1"><h3>Leads Recolhidos pela IA (${leadsA.length})</h3><table class="data-table"><thead><tr><th>Nome</th><th>Contacto</th><th>Categoria</th><th>Escola</th><th>Estado</th><th>Data</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }
    const handoffs = extA.handoffs_recent || [];
    if (handoffs.length > 0) {
      let rows = handoffs.map(h => `<tr><td><span class="tag ${h.tag === 'aluno' ? 'tag-op' : 'tag-mk'}">${h.tag || '—'}</span></td><td style="font-size:0.813rem">${h.razao || '—'}</td><td>${h.created_at?.substring(0,16).replace('T',' ') || '—'}</td></tr>`).join('');
      chartsHtml += `<div class="chart-card glass fade-in fade-in-6" style="grid-column: 1 / -1"><h3>Escalações para Equipa (${handoffs.length})</h3><table class="data-table"><thead><tr><th>Tipo</th><th>Razão</th><th>Data</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }
  }

  // Georgina Moura: leads recent table full-width
  if (context === 'credit_qualifier') {
    const ext2 = data.extended || {};
    const leads = ext2.leads_recent || [];
    if (leads.length > 0) {
      const cleanPhone = (p) => p ? String(p).split('@')[0].replace(/^351/, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : '—';
      const stateBadge = (s) => s === 'encaminhada' ? `<span class="tag tag-mk">Encaminhada</span>` : s ? `<span class="tag tag-op">${s}</span>` : '—';
      let rows = leads.map(l => `<tr><td>${l.nome || '—'}</td><td>${cleanPhone(l.telefone)}</td><td style="font-size:0.813rem">${l.objetivo_contacto || '—'}</td><td>${l.tem_credito_habitacao || '—'}</td><td>${stateBadge(l.estado)}</td><td>${l.created_at?.substring(0,10) || '—'}</td></tr>`).join('');
      chartsHtml += `<div class="chart-card glass fade-in fade-in-6" style="grid-column: 1 / -1"><h3>Leads Recolhidos (${leads.length})</h3><table class="data-table"><thead><tr><th>Nome</th><th>Contacto</th><th>Objetivo</th><th>Crédito Habitação</th><th>Estado</th><th>Data</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }
  }

  return `
    <div class="section-title fade-in fade-in-1">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7066A8" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      Agente IA
    </div>
    <div class="kpi-grid">${kpiCards}</div>
    <div class="charts-grid">${chartsHtml}</div>
  `;
}

// ---- Messaging Section ----
function renderMessagingSection(client, data) {
  const totalOp = data.total_operacionais;
  const totalMkt = data.total_marketing || data.total_automaticas;
  const totalMsgs = data.messages_sent;
  const totalOrders = data.total_orders;
  const totalRevenue = data.total_revenue;
  const totalClicked = data.total_clicked || 0;
  const clickRate = data.click_rate || 0;
  const cost = client.costPerMessage || 0; // €/msg

  // ===== Top KPIs =====
  let kpiCards = kpiCard('Total Mensagens', totalMsgs, '', 2);
  if (totalOp > 0) kpiCards += kpiCard('Operacionais', totalOp, 'morada, MB, MBWay', 3);
  if (totalMkt > 0) kpiCards += kpiCard('Marketing', totalMkt, 'carrinhos, upsell, recuperação', 4);
  if (totalClicked > 0) kpiCards += kpiCard('Cliques', totalClicked, `${clickRate.toFixed(1)}% taxa de clique`, 5);
  if (totalOrders > 0) kpiCards += kpiCard('Encomendas', totalOrders, `${formatNumber(totalRevenue)}€ receita`, 6);

  // ===== Cost & ROI Section (only when costPerMessage configured) =====
  let costRoiSection = '';
  if (cost > 0 && totalMsgs > 0) {
    const globalCost = totalMsgs * cost;
    const netMargin = totalRevenue - globalCost;
    const roiPct = globalCost > 0 ? (netMargin / globalCost) * 100 : 0;
    const roasMult = globalCost > 0 ? totalRevenue / globalCost : 0;
    const positive = netMargin >= 0;
    const marginColor = positive ? '#00D4AA' : '#FF6B6B';
    const costFmt = cost.toFixed(2).replace('.', ',');

    costRoiSection = `
      <div class="section-title fade-in fade-in-1" style="margin-top:24px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7066A8" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        Custo & ROI
      </div>
      <div class="kpi-grid">
        <div class="kpi-card glass fade-in fade-in-2">
          <div class="kpi-label">Custo Total</div>
          <div class="kpi-value" data-count="${Math.round(globalCost)}" data-suffix="€">0</div>
          <div class="kpi-sub">${formatNumber(totalMsgs)} × ${costFmt}€/msg</div>
        </div>
        <div class="kpi-card glass fade-in fade-in-3">
          <div class="kpi-label">Receita Atribuída</div>
          <div class="kpi-value" data-count="${Math.round(totalRevenue)}" data-suffix="€">0</div>
          <div class="kpi-sub">${totalOrders} encomendas</div>
        </div>
        <div class="kpi-card glass fade-in fade-in-4">
          <div class="kpi-label">Margem Líquida</div>
          <div class="kpi-value" style="color:${marginColor};" data-count="${Math.round(netMargin)}" data-suffix="€">0</div>
          <div class="kpi-sub">receita − custo</div>
        </div>
        <div class="kpi-card glass fade-in fade-in-5">
          <div class="kpi-label">ROI</div>
          <div class="kpi-value" style="color:${marginColor};" data-count="${Math.round(roiPct)}" data-suffix="%">0</div>
          <div class="kpi-sub">${roasMult.toFixed(2)}x ROAS</div>
        </div>
      </div>
    `;
  }

  // ===== Operacionais table =====
  let opSection = '';
  if (totalOp > 0) {
    const opRows = (data.operacionais || []).slice().sort((a,b)=>b.total-a.total).map(r =>
      `<tr><td>${prettyMsgType(r.tipo)}</td><td class="num">${formatNumber(r.total)}</td></tr>`
    ).join('');
    opSection = `
      <div class="chart-card glass fade-in fade-in-5">
        <h3>Mensagens Operacionais</h3>
        <p style="color:#9b95b8;font-size:12px;margin:-4px 0 12px 0;">Confirmações transacionais — sem receita atribuída</p>
        <table class="data-table"><thead><tr><th>Tipo</th><th>Enviadas</th></tr></thead><tbody>${opRows}</tbody></table>
      </div>
    `;
  }

  // ===== Marketing ROI table =====
  let mkSection = '';
  if (totalMkt > 0 && (data.marketing || []).length > 0) {
    const bestByCat = {};
    data.marketing.forEach(m => {
      if (m.revenue > 0 && (!bestByCat[m.categoria] || m.revenue > bestByCat[m.categoria].revenue)) {
        bestByCat[m.categoria] = m;
      }
    });

    const mkRows = data.marketing.map(m => {
      const seqLabel = m.sequence == null ? '—' : `Msg ${m.sequence}`;
      const isBest = bestByCat[m.categoria] === m;
      const trophy = isBest ? ' 🥇' : '';
      const rowCost = cost > 0 ? m.sends * cost : 0;
      const rowMargin = m.revenue - rowCost;
      let roiCell = '<td class="num" style="color:#9b95b8;">—</td>';
      if (cost > 0 && rowCost > 0) {
        const rowRoi = (rowMargin / rowCost) * 100;
        const color = rowMargin >= 0 ? '#00D4AA' : '#FF6B6B';
        roiCell = `<td class="num" style="color:${color};font-weight:600;">${rowRoi.toFixed(0)}%</td>`;
      } else if (m.revenue > 0) {
        roiCell = `<td class="num">${m.revenue_per_msg.toFixed(2)}€/msg</td>`;
      }
      return `<tr>
        <td>${prettyMsgType(m.categoria)}${trophy}</td>
        <td class="num">${seqLabel}</td>
        <td class="num">${formatNumber(m.sends)}</td>
        <td class="num">${formatNumber(m.clicks)}</td>
        <td class="num">${m.click_rate.toFixed(1)}%</td>
        <td class="num">${formatNumber(m.orders)}</td>
        <td class="num">${formatNumber(m.revenue)}€</td>
        ${roiCell}
      </tr>`;
    }).join('');
    const roiHeader = cost > 0 ? 'ROI' : '€/msg';
    const costNote = cost > 0 ? ` · Custo ${cost.toFixed(2).replace('.', ',')}€/msg` : '';
    mkSection = `
      <div class="chart-card glass fade-in fade-in-6">
        <h3>Marketing — Performance por Tipo & Sequência</h3>
        <p style="color:#9b95b8;font-size:12px;margin:-4px 0 12px 0;">Receita atribuída a cada mensagem · 🥇 melhor performer por tipo${costNote}</p>
        <div style="overflow-x:auto;">
          <table class="data-table" style="font-size:13px;min-width:680px;">
            <thead><tr><th>Tipo</th><th>Msg</th><th>Enviadas</th><th>Cliques</th><th>CTR</th><th>Encom.</th><th>Receita</th><th>${roiHeader}</th></tr></thead>
            <tbody>${mkRows}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  return `
    <div class="section-title fade-in fade-in-1">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7066A8" stroke-width="2"><path d="M22 2L11 13"></path><path d="M22 2L15 22L11 13L2 9L22 2Z"></path></svg>
      Mensagens Automáticas
    </div>
    <div class="kpi-grid">${kpiCards}</div>
    ${costRoiSection}
    <div class="charts-grid" style="margin-top:24px;">
      <div class="chart-card glass fade-in fade-in-4"><h3>Distribuição por Tipo</h3><div class="chart-container" id="chart-msg-types"></div></div>
      ${opSection}
    </div>
    ${mkSection ? `<div style="margin-top:24px;">${mkSection}</div>` : ''}
  `;
}

function prettyMsgType(t) {
  const map = {
    MBWAY: 'MBWay',
    MULTIBANCO: 'Multibanco',
    MORADA: 'Morada',
    UNBOXING: 'Unboxing',
    'CÓDIGO POSTAL': 'Código Postal',
    winback_21d: 'Recuperação 21d',
    winback_45d: 'Recuperação 45d',
    winback_60d: 'Recuperação 60d',
    recovery: 'Carrinho Abandonado',
    upsell: 'Upsell'
  };
  return map[t] || t;
}

// ---- Insights Section ----
function renderInsightsSection(insight) {
  return `
    <div class="section-title fade-in fade-in-1">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
      Insights
    </div>
    <div class="insights-card glass fade-in fade-in-2">
      <div class="insights-header"><span class="insights-badge">AI Analysis</span></div>
      <div class="insights-content">${insight.text}</div>
      <div class="insights-date">Análise de ${insight.month}</div>
    </div>
  `;
}

// ---- KPI Card Helpers ----
function kpiCard(label, value, sub, fadeN, colorClass, suffix) {
  const suffixAttr = suffix ? ` data-suffix="${suffix}"` : '';
  return `
    <div class="kpi-card glass fade-in fade-in-${fadeN}">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value ${colorClass || ''}" data-count="${value}"${suffixAttr}>0</div>
      ${sub ? `<div class="kpi-sub">${sub}</div>` : ''}
    </div>`;
}

function kpiCardPercent(label, value, fadeN, colorClass) {
  return `
    <div class="kpi-card glass fade-in fade-in-${fadeN}">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value ${colorClass || ''}" data-count="${value}" data-suffix="%">0</div>
      <div class="kpi-sub">sem intervenção humana</div>
    </div>`;
}

// ============================================================
// Dynamic insight generation based on real data
// ============================================================
function generateInsight(slug, client, chatbot, messaging, clicks) {
  if (!chatbot && !messaging) return null;

  const periodLabel = currentPeriod === 'this-month' ? 'este mês' : currentPeriod === 'last-month' ? 'no mês anterior' : `nos últimos ${currentPeriod.replace('d', ' dias')}`;
  const bits = [];

  // ---- Chatbot insights ----
  if (chatbot) {
    const total = chatbot.total_conversations || 0;
    const aiRate = chatbot.ai_resolution_rate || 0;
    const aiMsgs = chatbot.messages_ai || 0;
    const offHours = chatbot.extended?.off_hours;
    const context = client.context;

    if (total > 0) {
      // Opening line
      if (context === 'porteiro') {
        bits.push(`O agente processou <strong>${total.toLocaleString('pt-PT')} conversas</strong>, resolvendo <strong>${Math.round(aiRate)}% sem intervenção humana</strong>.`);
      } else if (context === 'qualificador') {
        const cls = chatbot.extended?.classification;
        const novos = parseInt(cls?.novos_leads) || 0;
        const existentes = parseInt(cls?.clientes_existentes) || 0;
        bits.push(`A IA processou <strong>${total.toLocaleString('pt-PT')} conversas</strong>, identificando <strong>${existentes} clientes existentes</strong> e qualificando <strong>${novos} novos leads</strong> com recolha de dados completa.`);
      } else if (context === 'leads') {
        const leadsCount = chatbot.leads_period || 0;
        bits.push(`O agente processou <strong>${total.toLocaleString('pt-PT')} conversas</strong> ${periodLabel}, com taxa de resolução de <strong>${Math.round(aiRate)}%</strong>${leadsCount > 0 ? ` e <strong>${leadsCount} leads recolhidos</strong>` : ''}.`);
      } else if (context === 'lead_gen') {
        const leads = chatbot.total_leads || 0;
        const convRate = chatbot.conversion_rate || 0;
        bits.push(`O sistema de lead gen Instagram gerou <strong>${leads} leads registados</strong> de ${chatbot.unique_users || total} utilizadores únicos (${convRate.toFixed(1)}% conversão).`);
      } else {
        bits.push(`O agente processou <strong>${total.toLocaleString('pt-PT')} conversas</strong> ${periodLabel}, resolvendo <strong>${Math.round(aiRate)}%</strong> sem intervenção humana.`);
      }

      // Off-hours insight
      if (offHours && parseFloat(offHours.off_hours_pct) > 20) {
        const pct = Math.round(parseFloat(offHours.off_hours_pct));
        bits.push(`<strong>${pct}% das mensagens</strong> chegam fora de horário comercial (fim-de-semana ou depois das 18h) — o valor do atendimento 24/7 é visível aqui.`);
      }

      // Multi-platform insight
      if (chatbot.platforms?.length > 1) {
        const top = [...chatbot.platforms].sort((a, b) => (b.total_conversations || 0) - (a.total_conversations || 0))[0];
        const topPct = total > 0 ? Math.round((top.total_conversations / total) * 100) : 0;
        bits.push(`O canal principal é <strong>${top.plataforma}</strong> com ${topPct}% das conversas.`);
      }

      // IA vs team multiplier (EcoDrive-style)
      if (context === 'leads' && chatbot.extended?.daily?.[0]?.team_msgs !== undefined) {
        const aiTotal = chatbot.extended.daily.reduce((s, d) => s + (parseInt(d.ai_msgs) || 0), 0);
        const teamTotal = chatbot.extended.daily.reduce((s, d) => s + (parseInt(d.team_msgs) || 0), 0);
        if (teamTotal > 0 && aiTotal > 0) {
          const mult = (aiTotal / teamTotal).toFixed(1);
          bits.push(`A IA respondeu <strong>${mult}× mais mensagens</strong> que a equipa humana no período.`);
        }
      }

      // Clicks
      const kuttClicks = clicks?.total_clicks || 0;
      if (kuttClicks > 0) {
        bits.push(`O agente gerou <strong>${kuttClicks.toLocaleString('pt-PT')} cliques</strong> em links partilhados com clientes.`);
      }
    }
  }

  // ---- Messaging insights ----
  if (messaging) {
    const totalMsgs = messaging.messages_sent || 0;
    const totalOrders = messaging.total_orders || 0;
    const totalRevenue = messaging.total_revenue || 0;
    const clickRate = messaging.click_rate || 0;

    if (totalMsgs > 0) {
      let msgBit = `No lado das mensagens automáticas, foram enviadas <strong>${totalMsgs.toLocaleString('pt-PT')} mensagens</strong>`;
      if (clickRate > 0) msgBit += ` (${clickRate.toFixed(1)}% taxa de clique)`;
      msgBit += '.';
      bits.push(msgBit);

      if (totalOrders > 0) {
        bits.push(`Estas campanhas geraram <strong>${totalOrders} encomendas atribuídas</strong> (${totalRevenue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}€ em receita).`);
      }
    }
  }

  if (bits.length === 0) return null;

  // Pick a period label
  const today = new Date();
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const monthLabel = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;

  return {
    month: monthLabel,
    text: bits.join(' ')
  };
}
