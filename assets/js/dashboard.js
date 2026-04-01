// Main dashboard orchestrator
let currentPeriod = '30d';
let currentClient = null;

async function initDashboard(slug) {
  currentClient = CLIENTS[slug];
  if (!currentClient) return;

  setupPeriodSelector();
  await loadData();
}

function setupPeriodSelector() {
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelector('.period-btn.active')?.classList.remove('active');
      btn.classList.add('active');
      currentPeriod = btn.dataset.period;
      await loadData();
    });
  });
}

async function loadData() {
  const { start, end } = getDateRange(currentPeriod);
  const slug = getClientSlug();
  const client = CLIENTS[slug];

  showLoading();

  const promises = [];

  if (client.services.includes('chatbot') && client.schema) {
    promises.push(getChatbotMetrics(client.schema, start, end));
  } else {
    promises.push(Promise.resolve(null));
  }

  if (client.services.includes('messaging') && client.schema) {
    promises.push(getMessagingMetrics(client.schema, start, end));
  } else {
    promises.push(Promise.resolve(null));
  }

  promises.push(getClickMetrics(client.domainId, start, end));

  const [chatbot, messaging, clicks] = await Promise.all(promises);

  renderDashboard(client, chatbot, messaging, clicks);
}

function showLoading() {
  const content = document.getElementById('dashboard-content');
  content.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      A carregar dados...
    </div>
  `;
}

function renderDashboard(client, chatbot, messaging, clicks) {
  const content = document.getElementById('dashboard-content');
  let html = '';

  // Chatbot section
  if (client.services.includes('chatbot') && chatbot) {
    html += renderChatbotSection(client, chatbot, clicks);
  }

  // Messaging section
  if (client.services.includes('messaging') && messaging) {
    if (html) html += '<hr class="section-divider">';
    html += renderMessagingSection(messaging, clicks);
  }

  // No data fallback
  if (!html) {
    html = `
      <div class="loading">
        <p>Sem dados disponíveis para o período selecionado.</p>
      </div>
    `;
  }

  content.innerHTML = html;

  // Init charts after DOM update
  if (chatbot) initChatbotCharts(client, chatbot);
  if (messaging) initMessagingCharts(messaging);
}

function renderChatbotSection(client, data, clicks) {
  const totalConversations = data.total_conversations || 0;
  const aiRate = data.ai_resolution_rate || 0;
  const totalMsgsAI = data.messages_ai || 0;
  const totalMsgsHuman = data.messages_human || 0;
  const totalClicks = clicks?.total_clicks || 0;

  const aiRateClass = aiRate >= 70 ? 'positive' : aiRate >= 50 ? 'warning' : '';

  return `
    <div class="section-title">Agente IA</div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Conversas</div>
        <div class="kpi-value">${formatNumber(totalConversations)}</div>
        <div class="kpi-sub">últimos ${currentPeriod === '30d' ? '30 dias' : currentPeriod}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Taxa Resolução IA</div>
        <div class="kpi-value ${aiRateClass}">${formatPercent(aiRate)}</div>
        <div class="kpi-sub">sem intervenção humana</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Mensagens IA</div>
        <div class="kpi-value">${formatNumber(totalMsgsAI)}</div>
        <div class="kpi-sub">${formatNumber(totalMsgsHuman)} mensagens humanas</div>
      </div>
      ${totalClicks ? `
      <div class="kpi-card">
        <div class="kpi-label">Cliques em Links</div>
        <div class="kpi-value">${formatNumber(totalClicks)}</div>
        <div class="kpi-sub">produtos partilhados</div>
      </div>` : ''}
    </div>
    <div class="charts-grid">
      ${client.channels.length > 1 ? `
      <div class="chart-card">
        <h3>Conversas por Canal</h3>
        <div class="chart-container"><canvas id="chart-channels"></canvas></div>
      </div>` : ''}
      <div class="chart-card">
        <h3>IA vs Humano</h3>
        <div class="chart-container"><canvas id="chart-ai-human"></canvas></div>
      </div>
      <div class="chart-card">
        <h3>Distribuição Horária</h3>
        <div class="chart-container"><canvas id="chart-hours"></canvas></div>
      </div>
    </div>
  `;
}

function renderMessagingSection(data, clicks) {
  const opRows = (data.operacionais || []);
  const mkRows = (data.automaticas || []);
  const totalOp = opRows.reduce((s, r) => s + r.total, 0);
  const totalMk = mkRows.reduce((s, r) => s + r.total, 0);
  const total = totalOp + totalMk;
  const totalClicks = clicks?.total_clicks || 0;

  let tableHtml = '';
  if (opRows.length) {
    tableHtml += opRows.map(r => `
      <tr>
        <td>${r.tipo || r.categoria}</td>
        <td>Operacional</td>
        <td><strong>${formatNumber(r.total)}</strong></td>
      </tr>
    `).join('');
  }
  if (mkRows.length) {
    tableHtml += mkRows.map(r => `
      <tr>
        <td>${r.tipo || r.categoria}</td>
        <td>Marketing</td>
        <td><strong>${formatNumber(r.total)}</strong></td>
      </tr>
    `).join('');
  }

  return `
    <div class="section-title">Mensagens Automáticas</div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Total Mensagens</div>
        <div class="kpi-value">${formatNumber(total)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Operacionais</div>
        <div class="kpi-value">${formatNumber(totalOp)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Marketing</div>
        <div class="kpi-value">${formatNumber(totalMk)}</div>
      </div>
      ${totalClicks ? `
      <div class="kpi-card">
        <div class="kpi-label">Cliques</div>
        <div class="kpi-value">${formatNumber(totalClicks)}</div>
      </div>` : ''}
    </div>
    <div class="charts-grid">
      <div class="chart-card">
        <h3>Mensagens por Tipo</h3>
        <div class="chart-container"><canvas id="chart-msg-types"></canvas></div>
      </div>
      <div class="chart-card">
        <h3>Detalhe por Categoria</h3>
        <table class="data-table">
          <thead>
            <tr><th>Categoria</th><th>Tipo</th><th>Total</th></tr>
          </thead>
          <tbody>${tableHtml}</tbody>
        </table>
      </div>
    </div>
  `;
}
