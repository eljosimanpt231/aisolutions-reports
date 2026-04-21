// ApexCharts dark theme helpers
const COLORS = {
  primary: '#7066A8',
  primaryLight: '#9B8FD0',
  accent: '#00D4AA',
  warning: '#FFB547',
  danger: '#FF6B6B',
  whatsapp: '#25D366',
  instagram: '#E1306C',
  facebook: '#4267B2',
  text: '#8b8a9e',
  grid: 'rgba(255,255,255,0.05)'
};

const baseChartOptions = {
  chart: {
    background: 'transparent',
    foreColor: COLORS.text,
    fontFamily: 'Inter, sans-serif',
    toolbar: { show: false },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800,
      dynamicAnimation: { speed: 400 }
    }
  },
  theme: { mode: 'dark' },
  tooltip: {
    theme: 'dark',
    style: { fontSize: '12px' },
    y: { formatter: (v) => v?.toLocaleString('pt-PT') || '0' }
  },
  grid: {
    borderColor: COLORS.grid,
    strokeDashArray: 3,
    padding: { left: 8, right: 8 }
  },
  states: {
    hover: { filter: { type: 'lighten', value: 0.15 } },
    active: { filter: { type: 'darken', value: 0.1 } }
  }
};

function initChatbotCharts(client, data) {
  // Now Fitness: funnel chart
  if (client.context === 'lead_gen' && document.getElementById('chart-funnel')) {
    const comments = data.total_comments || 0;
    const dms = data.dms_initiated || 0;
    const users = data.unique_users || data.total_conversations || 0;
    const leads = data.total_leads || 0;

    new ApexCharts(document.getElementById('chart-funnel'), {
      ...baseChartOptions,
      chart: { ...baseChartOptions.chart, type: 'bar', height: 260 },
      series: [{ name: 'Volume', data: [comments, dms, users, leads] }],
      xaxis: { categories: ['Comentários', 'DMs Enviadas', 'Conversas', 'Leads'] },
      colors: [COLORS.primaryLight],
      plotOptions: {
        bar: { borderRadius: 8, columnWidth: '55%', distributed: true, dataLabels: { position: 'top' } }
      },
      dataLabels: { enabled: true, offsetY: -20, style: { fontSize: '13px', fontWeight: 700, colors: ['#e8e6f0'] } },
      legend: { show: false },
      fill: {
        type: 'gradient',
        gradient: { shade: 'dark', type: 'vertical', shadeIntensity: 0.3, opacityFrom: 1, opacityTo: 0.7 }
      }
    }).render();
    return; // skip standard charts
  }

  // Platform breakdown chart (any client with multiple Chatwoot inboxes)
  if (data.platforms?.length > 1 && document.getElementById('chart-platforms')) {
    try {
      new ApexCharts(document.getElementById('chart-platforms'), {
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: 'bar', height: 260 },
        series: [{ name: 'Conversas', data: data.platforms.map(p => parseInt(p.total_conversations) || 0) }],
        xaxis: { categories: data.platforms.map(p => p.plataforma || 'Desconhecido') },
        colors: [COLORS.primary, COLORS.accent],
        plotOptions: { bar: { borderRadius: 8, columnWidth: '50%', distributed: true, dataLabels: { position: 'top' } } },
        dataLabels: { enabled: true, offsetY: -20, style: { fontSize: '13px', fontWeight: 700, colors: ['#e8e6f0'] } },
        legend: { show: false }
      }).render();
    } catch(e) { console.error('chart-platforms err:', e); }
  }

  // Channels bar chart — use actual channels from API data, not config
  const activeChannels = Object.keys(data.channels || {});
  if (activeChannels.length > 1 && document.getElementById('chart-channels')) {
    const channelData = data.channels;
    const channelNames = activeChannels.map(c => ({
      whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook', chatwoot: 'Chat'
    }[c] || c));
    const channelColors = activeChannels.map(c => COLORS[c] || COLORS.primary);

    new ApexCharts(document.getElementById('chart-channels'), {
      ...baseChartOptions,
      chart: { ...baseChartOptions.chart, type: 'bar', height: 260 },
      series: [{ name: 'Conversas', data: activeChannels.map(c => channelData[c]?.conversations || 0) }],
      xaxis: { categories: channelNames },
      colors: channelColors,
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: '50%',
          distributed: true,
          dataLabels: { position: 'top' }
        }
      },
      dataLabels: {
        enabled: true,
        offsetY: -20,
        style: { fontSize: '13px', fontWeight: 700, colors: ['#e8e6f0'] }
      },
      legend: { show: false }
    }).render();
  }

  // AI vs Human radial — adapts label per client context
  if (document.getElementById('chart-ai-human')) {
    const aiOnly = data.conversations_ai_only || 0;
    const withHuman = data.conversations_with_human || 0;
    const total = aiOnly + withHuman;
    const aiPercent = total > 0 ? Math.round((aiOnly / total) * 100) : 0;
    const isPorteiro = client.context === 'porteiro';
    const isQualificador = client.context === 'qualificador';
    const label = isQualificador ? 'Novos Leads' : isPorteiro ? 'Sem Humano' : 'Resolução IA';
    // For qualificador: invert — show % of NEW leads (ai_only) vs existing (with_human)
    const displayPercent = isQualificador
      ? (total > 0 ? Math.round((aiOnly / total) * 100) : 0)
      : aiPercent;

    try {
      new ApexCharts(document.getElementById('chart-ai-human'), {
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: 'radialBar', height: 280 },
        series: [displayPercent],
        plotOptions: {
          radialBar: {
            startAngle: -135,
            endAngle: 135,
            hollow: { size: '65%', background: 'transparent' },
            track: { background: 'rgba(255,255,255,0.05)', strokeWidth: '100%' },
            dataLabels: {
              name: { show: true, fontSize: '13px', color: COLORS.text, offsetY: -10 },
              value: { show: true, fontSize: '36px', fontWeight: 700, color: '#e8e6f0', offsetY: 5, formatter: (v) => v + '%' }
            }
          }
        },
        colors: [isQualificador ? COLORS.accent : (aiPercent >= 70 ? COLORS.accent : aiPercent >= 50 ? COLORS.warning : COLORS.danger)],
        labels: [label],
        stroke: { lineCap: 'round' }
      }).render();
    } catch(e) { console.error('chart-ai-human err:', e); }
  }

  // Hourly distribution
  if (document.getElementById('chart-hours') && data.hourly_distribution) {
    try {
      new ApexCharts(document.getElementById('chart-hours'), {
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: 'area', height: 260 },
        series: [{ name: 'Mensagens', data: data.hourly_distribution.map(h => h.count) }],
        xaxis: {
          categories: data.hourly_distribution.map(h => `${h.hour}h`),
          labels: { style: { fontSize: '10px' }, rotate: 0 },
          axisBorder: { show: false }, axisTicks: { show: false }
        },
        yaxis: { labels: { style: { fontSize: '11px' } } },
        colors: [COLORS.primary],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
        stroke: { curve: 'smooth', width: 2.5 },
        dataLabels: { enabled: false }
      }).render();
    } catch(e) { console.error('chart-hours err:', e); }
  }
}

const AGENT_NAMES = { '6': 'Ricardo Pinto', '7': 'Miriam Silva', '8': 'Andreia Pinto', '9': 'Cristina Pinto', '10': 'Inês Francisco' };
const AGENT_COLORS_MAP = { '6': '#00B894', '7': '#E1306C', '8': '#FDCB6E', '9': '#00CEC9', '10': '#6C5CE7' };

function initExtendedCharts(data) {
  const ext = data?.extended;
  if (!ext) return;

  // OdiSeguros: Classification donut
  if (ext.classification && document.getElementById('chart-classification')) {
    try {
      const cls = ext.classification;
      const existentes = parseInt(cls.clientes_existentes) || 0;
      const novos = parseInt(cls.novos_leads) || 0;
      const intH = parseInt(cls.intervencao_humana) || 0;
      const naoClass = parseInt(cls.nao_classificados) || 0;
      new ApexCharts(document.getElementById('chart-classification'), {
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: 'donut', height: 280 },
        series: [existentes, novos, intH, naoClass],
        labels: ['Clientes Existentes', 'Novos Leads', 'Intervenção Humana', 'Em Qualificação'],
        colors: ['#6B7280', COLORS.accent, COLORS.warning, COLORS.primaryLight],
        plotOptions: { pie: { donut: { size: '60%', labels: { show: true, total: { show: true, label: 'Total', color: COLORS.text, formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0).toLocaleString('pt-PT') }, value: { color: '#e8e6f0', fontSize: '22px', fontWeight: 700 } } } } },
        legend: { position: 'bottom', labels: { colors: COLORS.text }, fontSize: '12px' },
        dataLabels: { enabled: false },
        stroke: { width: 0 }
      }).render();
    } catch(e) { console.error('chart-classification err:', e); }
  }

  // OdiSeguros: Ramos bar chart
  if (ext.ramos?.length > 0 && document.getElementById('chart-ramos')) {
    try {
      const RAMO_LABELS = { automovel_particular: 'Auto Particular', automovel_empresa: 'Auto Empresa', tvde: 'TVDE', saude_dental: 'Saúde Dental', multiriscos_habitacao: 'Multirriscos', acidentes_trabalho: 'Acidentes Trabalho', vida_credito: 'Vida / Crédito', responsabilidade_civil: 'Resp. Civil' };
      const top = ext.ramos.slice(0, 8);
      new ApexCharts(document.getElementById('chart-ramos'), {
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: 'bar', height: 280 },
        series: [{ name: 'Contactos', data: top.map(r => parseInt(r.total) || 0) }],
        xaxis: { categories: top.map(r => RAMO_LABELS[r.ramo] || r.ramo) },
        colors: [COLORS.primary],
        plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: '60%' } },
        dataLabels: { enabled: true, style: { colors: ['#e8e6f0'], fontSize: '12px', fontWeight: 700 } },
        legend: { show: false }
      }).render();
    } catch(e) { console.error('chart-ramos err:', e); }
  }

  // Daily trend chart — EcoDrive format {day, conversations, ai_msgs, team_msgs, customer_msgs}
  if (ext.daily?.length > 0 && ext.daily[0]?.conversations !== undefined && document.getElementById('chart-daily')) {
    try {
      const days = ext.daily.map(d => d.day);
      new ApexCharts(document.getElementById('chart-daily'), {
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: 'area', height: 280 },
        series: [
          { name: 'Msgs IA', data: ext.daily.map(d => parseInt(d.ai_msgs) || 0) },
          { name: 'Msgs Equipa', data: ext.daily.map(d => parseInt(d.team_msgs) || 0) },
          { name: 'Msgs Cliente', data: ext.daily.map(d => parseInt(d.customer_msgs) || 0) }
        ],
        xaxis: { categories: days, labels: { rotate: -45, style: { fontSize: '9px' }, formatter: (v) => v?.substring(5) || '' } },
        colors: [COLORS.primary, COLORS.warning, '#6B7280'],
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.25, opacityTo: 0.02 } },
        dataLabels: { enabled: false },
        legend: { position: 'top', labels: { colors: COLORS.text } }
      }).render();
    } catch(e) { console.error('chart-daily err:', e); }
  }

  // Daily trend chart — Lojinha format {day, platform, sender_type, cnt}
  if (ext.daily?.length > 0 && ext.daily[0]?.sender_type !== undefined && document.getElementById('chart-daily')) {
    // Aggregate by day (merge platforms)
    const dayMap = {};
    ext.daily.forEach(r => {
      if (!dayMap[r.day]) dayMap[r.day] = { ai_agent: 0, human_agent: 0, customer: 0 };
      dayMap[r.day][r.sender_type] += parseInt(r.cnt) || 0;
    });
    const days = Object.keys(dayMap).sort();
    new ApexCharts(document.getElementById('chart-daily'), {
      ...baseChartOptions,
      chart: { ...baseChartOptions.chart, type: 'area', height: 280 },
      series: [
        { name: 'IA', data: days.map(d => dayMap[d].ai_agent) },
        { name: 'Equipa', data: days.map(d => dayMap[d].human_agent) },
        { name: 'Cliente', data: days.map(d => dayMap[d].customer) }
      ],
      xaxis: { categories: days, labels: { rotate: -45, style: { fontSize: '9px' }, formatter: (v) => v?.substring(5) || '' } },
      colors: [COLORS.primary, COLORS.warning, '#555'],
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.25, opacityTo: 0.02 } },
      dataLabels: { enabled: false },
      legend: { position: 'top', labels: { colors: COLORS.text } }
    }).render();
  }

  // Weekly conversation types (Lojinha Bebé: ai_only vs human_only)
  if (ext.conversationTypes?.length > 0 && document.getElementById('chart-weekly-conv')) {
    // Aggregate by week (merge platforms)
    const weekMap = {};
    ext.conversationTypes.forEach(r => {
      if (!weekMap[r.week]) weekMap[r.week] = { ai_only: 0, human_only: 0 };
      weekMap[r.week][r.conversation_type] += parseInt(r.cnt) || 0;
    });
    const weeks = Object.keys(weekMap).sort();
    const aiOnly = weeks.map(w => weekMap[w].ai_only);
    const humanOnly = weeks.map(w => weekMap[w].human_only);

    new ApexCharts(document.getElementById('chart-weekly-conv'), {
      ...baseChartOptions,
      chart: { ...baseChartOptions.chart, type: 'bar', height: 280, stacked: true },
      series: [
        { name: 'Só IA', data: aiOnly },
        { name: 'Com Humano', data: humanOnly }
      ],
      xaxis: { categories: weeks.map(w => w.substring(5)), labels: { style: { fontSize: '10px' } } },
      colors: [COLORS.accent, COLORS.warning],
      plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
      dataLabels: { enabled: false },
      legend: { position: 'top', labels: { colors: COLORS.text } }
    }).render();
  }

  // Weekly messages stacked (Lojinha Bebé: ai_agent, customer, human_agent)
  if (ext.weekly?.length > 0 && document.getElementById('chart-weekly-msgs')) {
    const weekMap = {};
    ext.weekly.forEach(r => {
      if (!weekMap[r.week]) weekMap[r.week] = { ai_agent: 0, customer: 0, human_agent: 0 };
      weekMap[r.week][r.sender_type] += parseInt(r.cnt) || 0;
    });
    const weeks = Object.keys(weekMap).sort();

    new ApexCharts(document.getElementById('chart-weekly-msgs'), {
      ...baseChartOptions,
      chart: { ...baseChartOptions.chart, type: 'bar', height: 280, stacked: true },
      series: [
        { name: 'IA', data: weeks.map(w => weekMap[w].ai_agent) },
        { name: 'Humano', data: weeks.map(w => weekMap[w].human_agent) },
        { name: 'Cliente', data: weeks.map(w => weekMap[w].customer) }
      ],
      xaxis: { categories: weeks.map(w => w.substring(5)), labels: { style: { fontSize: '10px' } } },
      colors: [COLORS.primary, COLORS.warning, '#555'],
      plotOptions: { bar: { borderRadius: 3, columnWidth: '65%' } },
      dataLabels: { enabled: false },
      legend: { position: 'top', labels: { colors: COLORS.text } }
    }).render();
  }

  // Agent breakdown donut (Lojinha Bebé)
  if (ext.agentBreakdown?.length > 0 && document.getElementById('chart-agents')) {
    try {
      const agentTotals = {};
      ext.agentBreakdown.forEach(r => {
        const id = r.agent_id;
        if (!agentTotals[id]) agentTotals[id] = 0;
        agentTotals[id] += parseInt(r.cnt) || 0;
      });
      const ids = Object.keys(agentTotals).sort((a, b) => agentTotals[b] - agentTotals[a]);
      new ApexCharts(document.getElementById('chart-agents'), {
        ...baseChartOptions,
        chart: { ...baseChartOptions.chart, type: 'donut', height: 280 },
        series: ids.map(id => agentTotals[id]),
        labels: ids.map(id => AGENT_NAMES[id] || `Agente ${id}`),
        colors: ids.map(id => AGENT_COLORS_MAP[id] || COLORS.primary),
        plotOptions: { pie: { donut: { size: '60%', labels: { show: true, total: { show: true, label: 'Total', color: COLORS.text, formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0).toLocaleString('pt-PT') }, value: { color: '#e8e6f0', fontSize: '22px', fontWeight: 700 } } } } },
        legend: { position: 'bottom', labels: { colors: COLORS.text } },
        dataLabels: { enabled: false },
        stroke: { width: 0 }
      }).render();
    } catch(e) { console.error('chart-agents err:', e); }
  }
}

function initMessagingCharts(data) {
  if (!document.getElementById('chart-msg-types')) return;

  const items = [];
  const labels = [];
  const colors = [];
  const opColors = ['#00D4AA', '#00B894', '#55E6C1', '#7DCEA0'];
  const mkColors = ['#7066A8', '#9B8FD0', '#B8B0E0', '#FFB547'];

  (data.operacionais || []).forEach((r, i) => {
    labels.push(r.tipo);
    items.push(r.total);
    colors.push(opColors[i % opColors.length]);
  });
  (data.automaticas || []).forEach((r, i) => {
    labels.push(r.tipo);
    items.push(r.total);
    colors.push(mkColors[i % mkColors.length]);
  });

  new ApexCharts(document.getElementById('chart-msg-types'), {
    ...baseChartOptions,
    chart: { ...baseChartOptions.chart, type: 'donut', height: 280 },
    series: items,
    labels: labels,
    colors: colors,
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              fontSize: '13px',
              color: COLORS.text,
              formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0).toLocaleString('pt-PT')
            },
            value: {
              fontSize: '24px',
              fontWeight: 700,
              color: '#e8e6f0',
              formatter: (v) => parseInt(v).toLocaleString('pt-PT')
            }
          }
        }
      }
    },
    legend: {
      position: 'bottom',
      fontSize: '12px',
      labels: { colors: COLORS.text },
      markers: { size: 6, offsetX: -4 }
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 }
  }).render();
}
