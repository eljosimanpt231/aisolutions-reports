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

  // Insights
  const insight = typeof INSIGHTS !== 'undefined' ? INSIGHTS[slug] : null;
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

  if (context === 'qualificador') {
    // OdiSeguros: lead qualification bot — IA talks to everyone, classifies, hands off
    kpiCards += kpiCard('Mensagens IA', msgsAI, 'qualificação + recolha dados', 3);
    kpiCards += kpiCard('Clientes Existentes', withHuman, 'identificados pela IA', 4);
    kpiCards += kpiCard('Novos Leads', aiOnly, 'qualificados para seguimento', 5, 'positive');
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
    kpiCards += kpiCard('Cliques em Produtos', kuttClicks, 'links partilhados pelo agente', 5);
  }

  // Charts
  let chartsHtml = '';
  if (activeChannels.length > 1) {
    chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>Conversas por Canal</h3><div class="chart-container" id="chart-channels"></div></div>`;
  }
  // EcoDrive platform breakdown
  if (context === 'leads' && data.platforms?.length > 1) {
    chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>Conversas por Plataforma</h3><div class="chart-container" id="chart-platforms"></div></div>`;
  }

  if (context === 'lead_gen') {
    // Now Fitness: funnel + leads table
    chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>Funil de Conversão</h3><div class="chart-container" id="chart-funnel"></div></div>`;
    // Leads table
    const leadRecords = data.lead_records || [];
    if (leadRecords.length > 0) {
      let leadsTableRows = leadRecords.map(l => `<tr><td>${l.nome || '—'}</td><td>${l.tipo_registo || '—'}</td><td>${l.criado_em?.substring(0,10) || '—'}</td></tr>`).join('');
      chartsHtml += `<div class="chart-card glass fade-in fade-in-6"><h3>Leads Registados</h3><table class="data-table"><thead><tr><th>Nome</th><th>Tipo</th><th>Data</th></tr></thead><tbody>${leadsTableRows}</tbody></table></div>`;
    }
  } else if (context === 'qualificador') {
    chartsHtml += `<div class="chart-card glass fade-in fade-in-5"><h3>Novos vs Existentes</h3><div class="chart-container" id="chart-ai-human"></div></div>`;
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
  const totalAuto = data.total_automaticas;
  const totalMsgs = data.messages_sent;
  const totalOrders = data.total_orders;
  const totalRevenue = data.total_revenue;
  const hasOp = totalOp > 0;
  const hasAuto = totalAuto > 0;

  let tableRows = '';
  data.operacionais.forEach(r => {
    tableRows += `<tr><td>${r.tipo}</td><td><span class="tag tag-op">Operacional</span></td><td class="num">${formatNumber(r.total)}</td></tr>`;
  });
  data.automaticas.forEach(r => {
    tableRows += `<tr><td>${r.tipo}</td><td><span class="tag tag-mk">Marketing</span></td><td class="num">${formatNumber(r.total)}</td></tr>`;
  });

  const totalClicked = data.total_clicked || 0;
  const clickRate = data.click_rate || 0;

  let kpiCards = kpiCard('Total Mensagens', totalMsgs, '', 2);
  if (hasOp) kpiCards += kpiCard('Operacionais', totalOp, hasOp && hasAuto ? 'morada, MB, MBWay' : '', 3);
  if (hasAuto) kpiCards += kpiCard('Marketing', totalAuto, hasOp && hasAuto ? 'carrinhos, upsell' : '', hasOp ? 4 : 3);
  if (totalClicked > 0) kpiCards += kpiCard('Cliques', totalClicked, `${clickRate.toFixed(1)}% taxa de clique`, hasOp && hasAuto ? 5 : 4);
  if (totalOrders > 0) kpiCards += kpiCard('Encomendas', totalOrders, `${formatNumber(totalRevenue)}€ receita`, 5);

  return `
    <div class="section-title fade-in fade-in-1">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7066A8" stroke-width="2"><path d="M22 2L11 13"></path><path d="M22 2L15 22L11 13L2 9L22 2Z"></path></svg>
      Mensagens Automáticas
    </div>
    <div class="kpi-grid">${kpiCards}</div>
    <div class="charts-grid">
      <div class="chart-card glass fade-in fade-in-5"><h3>Distribuição por Tipo</h3><div class="chart-container" id="chart-msg-types"></div></div>
      <div class="chart-card glass fade-in fade-in-6"><h3>Detalhe por Categoria</h3>
        ${tableRows ? `<table class="data-table"><thead><tr><th>Categoria</th><th>Tipo</th><th>Total</th></tr></thead><tbody>${tableRows}</tbody></table>` : '<p class="no-data">Sem dados.</p>'}
      </div>
    </div>
  `;
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
function kpiCard(label, value, sub, fadeN, colorClass) {
  return `
    <div class="kpi-card glass fade-in fade-in-${fadeN}">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value ${colorClass || ''}" data-count="${value}">0</div>
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
