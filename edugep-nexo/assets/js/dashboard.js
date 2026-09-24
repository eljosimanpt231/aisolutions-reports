// NEXO Dashboard - Orquestrador principal
// Carrega snapshots JSON estáticos e renderiza tudo.
// Todos os content de mensagens usam textContent (nunca innerHTML) — proteção XSS.

(function() {
  'use strict';

  const DATA = {
    overview: null,
    series: null,
    channels: null,
    heatmap: null,
    sessions: null,
    transcripts: null,
    campanhas: null,
    leads: null,
    servicos: null,
    kb: null,
    timeline: null,
    insights: { duvidas: null, quality: null, campaigns: null, meta: null },
  };

  const CHANNEL_NAMES = {
    'whatsapp': 'WhatsApp',
    'instagram': 'Instagram',
    'facebook': 'Facebook',
    'wp': 'WhatsApp',
    'ig': 'Instagram',
    'fb': 'Facebook',
  };

  function channelName(p) {
    return CHANNEL_NAMES[p?.toLowerCase()] || p || 'Desconhecido';
  }

  function channelClass(p) {
    const k = p?.toLowerCase();
    if (k === 'whatsapp' || k === 'wp') return 'edugep-ch-whatsapp';
    if (k === 'instagram' || k === 'ig') return 'edugep-ch-instagram';
    if (k === 'facebook' || k === 'fb') return 'edugep-ch-facebook';
    return '';
  }

  function fmtRelativeTime(iso) {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = Math.max(0, now - then);
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'agora mesmo';
    if (min < 60) return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h}h`;
    const d = Math.floor(h / 24);
    if (d < 30) return `há ${d} dia${d > 1 ? 's' : ''}`;
    const w = Math.floor(d / 7);
    if (w < 8) return `há ${w} sem`;
    const mo = Math.floor(d / 30);
    return `há ${mo} mês${mo > 1 ? 'es' : ''}`;
  }

  function fmtNumber(n) {
    return new Intl.NumberFormat('pt-PT').format(n);
  }

  function fmtPercent(n) {
    return `${Math.round(n)}%`;
  }

  function fmtDelta(cur, prev) {
    if (!prev || prev === 0) return { pct: null, label: 'sem base', direction: 'neutral' };
    const delta = ((cur - prev) / prev) * 100;
    return {
      pct: delta,
      label: `${delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} ${Math.abs(delta).toFixed(0)}% vs 7d ant.`,
      direction: delta > 5 ? 'up' : delta < -5 ? 'down' : 'neutral',
    };
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: '2-digit' });
  }

  function fmtDateTime(iso) {
    const d = new Date(iso);
    return d.toLocaleString('pt-PT', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function fmtHour(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  }

  // ================== DATA LOADING ==================
  async function loadData() {
    const base = './data';
    const files = {
      overview: `${base}/overview.json`,
      series: `${base}/series-30d.json`,
      channels: `${base}/channel-distribution.json`,
      heatmap: `${base}/heatmap.json`,
      sessions: `${base}/sessions-recent.json`,
      transcripts: `${base}/transcripts.json`,
      campanhas: `${base}/campanhas.json`,
      leads: `${base}/leads.json`,
      servicos: `${base}/contactos-servicos.json`,
      kb: `${base}/kb-chunks.json`,
      timeline: `${base}/nexo-timeline-24h.json`,
      insights_duvidas: `${base}/insights/top-duvidas.json`,
      insights_quality: `${base}/insights/quality-sentiment.json`,
      insights_campaigns: `${base}/insights/campaigns-mentions.json`,
      insights_meta: `${base}/insights/meta.json`,
    };
    const results = await Promise.all(
      Object.entries(files).map(async ([k, url]) => {
        try {
          const r = await fetch(url);
          if (!r.ok) throw new Error(`${url}: ${r.status}`);
          return [k, await r.json()];
        } catch (e) {
          console.warn(`Failed to load ${k}:`, e.message);
          return [k, null];
        }
      })
    );
    for (const [k, v] of results) {
      if (k.startsWith('insights_')) {
        DATA.insights[k.replace('insights_', '')] = v;
      } else {
        DATA[k] = v;
      }
    }
  }

  // ================== KPIs ==================
  function renderKPIs() {
    const grid = document.getElementById('edugep-kpi-grid');
    if (!grid || !DATA.overview) return;
    const t = DATA.overview.totals;
    const respRate = t.msgs_ai > 0 ? (t.msgs_ai / t.msgs_human * 100) : 0;
    const handoffSessions = DATA.sessions?.sessions?.filter(s => s.has_handoff).length || 0;
    const delta7d = fmtDelta(t.msgs_7d, t.msgs_prev_7d);
    const deltaSessions = fmtDelta(t.sessions_7d, t.sessions_prev_7d);

    const kpis = [
      {
        label: 'Mensagens · 7 dias',
        value: fmtNumber(t.msgs_7d),
        delta: delta7d,
        featured: true,
      },
      {
        label: 'Sessões únicas · 7d',
        value: fmtNumber(t.sessions_7d),
        delta: deltaSessions,
      },
      {
        label: 'Mensagens · 30d',
        value: fmtNumber(t.msgs_30d),
        suffix: `de ${fmtNumber(t.total_msgs)} total`,
      },
      {
        label: 'Sessões · 30d',
        value: fmtNumber(t.sessions_30d),
        suffix: `${fmtNumber(t.unique_sessions)} total`,
      },
      {
        label: 'Handoffs para atendente',
        value: fmtNumber(handoffSessions),
        suffix: 'sessões',
      },
      {
        label: 'Canais activos',
        value: fmtNumber(t.channels),
        suffix: 'WA · IG · FB',
      },
    ];

    grid.textContent = '';
    kpis.forEach(k => {
      const card = document.createElement('div');
      card.className = 'edugep-kpi' + (k.featured ? ' edugep-kpi--featured' : '');
      const label = document.createElement('div');
      label.className = 'edugep-kpi-label';
      label.textContent = k.label;
      card.appendChild(label);
      const value = document.createElement('div');
      value.className = 'edugep-kpi-value';
      value.textContent = k.value;
      if (k.suffix) {
        const s = document.createElement('span');
        s.className = 'edugep-kpi-suffix';
        s.textContent = k.suffix;
        value.appendChild(s);
      }
      card.appendChild(value);
      if (k.delta) {
        const d = document.createElement('div');
        d.className = 'edugep-kpi-delta ' + (
          k.delta.direction === 'up' ? 'edugep-delta-up' :
          k.delta.direction === 'down' ? 'edugep-delta-down' :
          'edugep-delta-neutral'
        );
        d.textContent = k.delta.label;
        card.appendChild(d);
      }
      grid.appendChild(card);
    });

    // Live label
    if (t.last_msg) {
      const live = document.getElementById('edugep-live-label');
      if (live) live.textContent = `Última msg ${fmtRelativeTime(t.last_msg)}`;
    }
    const updated = document.getElementById('edugep-updated-at');
    if (updated && DATA.overview.generated_at) {
      updated.textContent = `Dados actualizados ${fmtRelativeTime(DATA.overview.generated_at)}`;
    }
  }

  // ================== INSIGHTS: TOP DUVIDAS ==================
  function renderDuvidas() {
    const box = document.getElementById('edugep-duvidas-list');
    const meta = document.getElementById('edugep-duvidas-meta');
    if (!box) return;
    const data = DATA.insights.duvidas;
    if (!data || !data.topicos || !Array.isArray(data.topicos)) {
      renderEmpty(box, 'A processar', 'Insights gerados a cada 6h');
      return;
    }
    if (meta) {
      meta.textContent = `${data.sample_size} msgs · gerado ${fmtRelativeTime(data.generated_at)}`;
    }
    box.textContent = '';
    data.topicos.slice(0, 6).forEach(t => {
      const el = document.createElement('div');
      el.className = 'edugep-insight';
      const head = document.createElement('div');
      const title = document.createElement('div');
      title.className = 'edugep-insight-title';
      title.textContent = t.titulo;
      const metaEl = document.createElement('div');
      metaEl.className = 'edugep-insight-meta';
      const countBadge = document.createElement('span');
      countBadge.textContent = `${t.count}× mencionado · `;
      metaEl.appendChild(countBadge);
      const prio = document.createElement('span');
      prio.className = 'edugep-priority-' + (t.prioridade || 'medium').toLowerCase();
      prio.textContent = t.prioridade || 'medium';
      metaEl.appendChild(prio);
      head.appendChild(title);
      head.appendChild(metaEl);
      el.appendChild(head);
      if (t.exemplo) {
        const ex = document.createElement('div');
        ex.className = 'edugep-insight-example';
        ex.textContent = `"${t.exemplo}"`;
        el.appendChild(ex);
      }
      box.appendChild(el);
    });
  }

  // ================== INSIGHTS: QUALIDADE ==================
  function renderQuality() {
    const box = document.getElementById('edugep-quality');
    if (!box) return;
    const q = DATA.insights.quality;
    if (!q || !q.qualidade_media_nexo) {
      renderEmpty(box, 'Amostra insuficiente', 'Precisa de ≥20 respostas NEXO');
      return;
    }
    box.textContent = '';
    const hero = document.createElement('div');
    hero.className = 'edugep-quality-hero';
    const val = document.createElement('span');
    val.className = 'edugep-quality-value';
    val.textContent = q.qualidade_media_nexo.toFixed(1);
    const max = document.createElement('span');
    max.className = 'edugep-quality-max';
    max.textContent = '/ 5';
    hero.appendChild(val);
    hero.appendChild(max);
    box.appendChild(hero);

    if (q.qualidade_reasoning) {
      const r = document.createElement('div');
      r.style.fontSize = '12px';
      r.style.color = 'var(--edugep-text-secondary)';
      r.style.marginBottom = '16px';
      r.style.lineHeight = '1.5';
      r.textContent = q.qualidade_reasoning;
      box.appendChild(r);
    }

    if (q.sentiment_geral) {
      const s = document.createElement('div');
      s.style.display = 'flex';
      s.style.gap = '8px';
      s.style.marginBottom = '16px';
      const total = (q.sentiment_geral.positivo || 0) + (q.sentiment_geral.neutro || 0) + (q.sentiment_geral.negativo || 0);
      [
        { label: '😊', n: q.sentiment_geral.positivo, color: 'var(--edugep-success)' },
        { label: '😐', n: q.sentiment_geral.neutro, color: 'var(--edugep-text-muted)' },
        { label: '😟', n: q.sentiment_geral.negativo, color: 'var(--edugep-danger)' },
      ].forEach(item => {
        const it = document.createElement('div');
        it.style.flex = '1';
        it.style.padding = '10px';
        it.style.background = 'rgba(10,13,20,0.4)';
        it.style.borderRadius = '8px';
        it.style.textAlign = 'center';
        it.innerHTML = '';
        const em = document.createElement('div');
        em.textContent = item.label;
        em.style.fontSize = '20px';
        const num = document.createElement('div');
        num.textContent = item.n || 0;
        num.style.fontSize = '18px';
        num.style.fontWeight = '700';
        num.style.color = item.color;
        it.appendChild(em);
        it.appendChild(num);
        s.appendChild(it);
      });
      box.appendChild(s);
    }

    if (q.melhor_resposta && q.melhor_resposta.pergunta) {
      const wrap = document.createElement('div');
      wrap.style.padding = '12px';
      wrap.style.background = 'rgba(34, 197, 94, 0.06)';
      wrap.style.borderLeft = '3px solid var(--edugep-success)';
      wrap.style.borderRadius = '6px';
      wrap.style.fontSize = '11px';
      wrap.style.color = 'var(--edugep-text-secondary)';
      wrap.style.lineHeight = '1.5';
      const t = document.createElement('div');
      t.style.fontWeight = '600';
      t.style.color = 'var(--edugep-success)';
      t.style.marginBottom = '4px';
      t.textContent = '✓ Melhor resposta';
      const p = document.createElement('div');
      p.textContent = q.melhor_resposta.porque;
      wrap.appendChild(t);
      wrap.appendChild(p);
      box.appendChild(wrap);
    }
  }

  // ================== CHARTS ==================
  function renderChartSeries() {
    const el = document.getElementById('edugep-chart-series');
    if (!el || !DATA.series) return;
    const days = DATA.series.days;
    const byChannel = DATA.series.by_channel;
    const channels = Object.keys(byChannel);
    const series = channels.map(ch => ({
      name: channelName(ch),
      data: days.map(d => byChannel[ch][d] || 0),
    }));
    const colors = channels.map(ch => {
      const k = ch.toLowerCase();
      if (k.includes('whats')) return '#25D366';
      if (k.includes('insta')) return '#E4405F';
      if (k.includes('face')) return '#1877F2';
      return '#22D3EE';
    });
    new ApexCharts(el, {
      chart: {
        type: 'area', height: 280, background: 'transparent', foreColor: '#B8C1D1',
        toolbar: { show: false }, animations: { enabled: true, easing: 'easeout', speed: 800 },
      },
      series,
      colors,
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100] } },
      xaxis: {
        categories: days.map(d => {
          const dt = new Date(d);
          return dt.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
        }),
        labels: { style: { colors: '#7A869A', fontSize: '10px' } },
        axisBorder: { color: 'rgba(255,255,255,0.06)' },
        axisTicks: { color: 'rgba(255,255,255,0.06)' },
      },
      yaxis: {
        labels: { style: { colors: '#7A869A', fontSize: '10px' } },
      },
      grid: {
        borderColor: 'rgba(255,255,255,0.05)',
        strokeDashArray: 3,
      },
      tooltip: { theme: 'dark', x: { format: 'dd MMM' } },
      legend: { position: 'top', horizontalAlign: 'right', labels: { colors: '#B8C1D1' } },
    }).render();
  }

  function renderChartChannels() {
    const el = document.getElementById('edugep-chart-channels');
    if (!el || !DATA.channels) return;
    const chs = DATA.channels.channels;
    new ApexCharts(el, {
      chart: { type: 'donut', height: 280, background: 'transparent', foreColor: '#B8C1D1' },
      series: chs.map(c => c.messages),
      labels: chs.map(c => channelName(c.platform)),
      colors: chs.map(c => {
        const k = c.platform.toLowerCase();
        if (k.includes('whats')) return '#25D366';
        if (k.includes('insta')) return '#E4405F';
        if (k.includes('face')) return '#1877F2';
        return '#22D3EE';
      }),
      stroke: { colors: ['#111621'], width: 2 },
      dataLabels: { enabled: true, style: { fontSize: '12px', fontWeight: 600 } },
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              total: {
                show: true, label: 'Total msgs',
                color: '#B8C1D1', fontSize: '11px',
                formatter: () => fmtNumber(chs.reduce((s, c) => s + c.messages, 0)),
              },
              value: { color: '#F5F7FA', fontSize: '22px', fontWeight: 700 },
            }
          }
        }
      },
      tooltip: { theme: 'dark' },
      legend: { position: 'bottom', labels: { colors: '#B8C1D1' } },
    }).render();
  }

  // ================== CAMPANHAS ==================
  function renderCampanhas() {
    const box = document.getElementById('edugep-camp-list');
    if (!box) return;
    const data = DATA.insights.campaigns;
    if (!data || !data.campanhas) {
      renderEmpty(box, 'A processar', 'Insights de campanhas gerados a cada 6h');
      return;
    }
    const rows = [...(data.campanhas || [])].sort((a, b) => (b.count || 0) - (a.count || 0));
    box.textContent = '';
    rows.slice(0, 8).forEach(c => {
      const r = document.createElement('div');
      r.className = 'edugep-camp-row';
      const info = document.createElement('div');
      const nome = document.createElement('div');
      nome.className = 'edugep-camp-nome';
      nome.textContent = c.nome;
      info.appendChild(nome);
      if (c.context) {
        const ctx = document.createElement('div');
        ctx.className = 'edugep-camp-context';
        ctx.textContent = c.context;
        info.appendChild(ctx);
      }
      const count = document.createElement('div');
      count.className = 'edugep-camp-count';
      count.textContent = c.count;
      r.appendChild(info);
      r.appendChild(count);
      box.appendChild(r);
    });

    if (data.outros_topicos && data.outros_topicos.length) {
      const hr = document.createElement('div');
      hr.style.margin = '12px 0 8px';
      hr.style.fontSize = '11px';
      hr.style.color = 'var(--edugep-text-muted)';
      hr.style.textTransform = 'uppercase';
      hr.style.letterSpacing = '0.08em';
      hr.textContent = 'Outros tópicos';
      box.appendChild(hr);
      data.outros_topicos.slice(0, 5).forEach(t => {
        const r = document.createElement('div');
        r.className = 'edugep-camp-row';
        const info = document.createElement('div');
        const nome = document.createElement('div');
        nome.className = 'edugep-camp-nome';
        nome.style.color = 'var(--edugep-text-secondary)';
        nome.textContent = t.topic;
        info.appendChild(nome);
        const count = document.createElement('div');
        count.className = 'edugep-camp-count';
        count.style.color = 'var(--edugep-text-muted)';
        count.textContent = t.count;
        r.appendChild(info);
        r.appendChild(count);
        box.appendChild(r);
      });
    }
  }

  // ================== HEATMAP ==================
  function renderHeatmap() {
    const box = document.getElementById('edugep-heatmap');
    if (!box || !DATA.heatmap) return;
    const cells = DATA.heatmap.cells;
    if (!cells.length) {
      renderEmpty(box, 'Sem dados', 'Amostra insuficiente para heatmap');
      return;
    }
    // Build 7x24 grid
    const grid = {};
    let max = 0;
    cells.forEach(c => {
      grid[`${c.dow}-${c.hora}`] = c.n;
      if (c.n > max) max = c.n;
    });
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    box.textContent = '';

    const container = document.createElement('div');
    container.className = 'edugep-heatmap-container';
    const labels = document.createElement('div');
    labels.className = 'edugep-heatmap-labels';
    days.forEach(d => {
      const l = document.createElement('div');
      l.textContent = d;
      labels.appendChild(l);
    });
    container.appendChild(labels);

    const g = document.createElement('div');
    g.className = 'edugep-heatmap-grid';
    // hours header
    const hoursRow = document.createElement('div');
    hoursRow.className = 'edugep-heatmap-cols';
    for (let h = 0; h < 24; h++) {
      const hEl = document.createElement('div');
      hEl.className = 'edugep-heatmap-hour';
      hEl.textContent = h % 3 === 0 ? h.toString().padStart(2, '0') : '·';
      hoursRow.appendChild(hEl);
    }
    g.appendChild(hoursRow);

    const rows = document.createElement('div');
    rows.className = 'edugep-heatmap-rows';
    for (let dow = 0; dow < 7; dow++) {
      const row = document.createElement('div');
      row.className = 'edugep-heatmap-row';
      for (let h = 0; h < 24; h++) {
        const cell = document.createElement('div');
        cell.className = 'edugep-heat-cell';
        const n = grid[`${dow}-${h}`] || 0;
        if (n > 0) {
          const intensity = Math.min(1, n / max);
          if (intensity < 0.3 && n < 3) {
            cell.style.background = 'rgba(74, 63, 156, 0.10)';
          } else {
            // Gradient brand -> cyan
            const r = Math.round(41 + (34 - 41) * intensity);
            const g = Math.round(35 + (211 - 35) * intensity);
            const b = Math.round(92 + (238 - 92) * intensity);
            cell.style.background = `rgba(${r}, ${g}, ${b}, ${0.15 + intensity * 0.85})`;
          }
          cell.title = `${days[dow]} ${h}h — ${n} msgs`;
        }
        row.appendChild(cell);
      }
      rows.appendChild(row);
    }
    g.appendChild(rows);
    container.appendChild(g);
    box.appendChild(container);
  }

  // ================== SESSIONS + TRANSCRIPT ==================
  function renderSessions() {
    const box = document.getElementById('edugep-sessions-list');
    const hint = document.getElementById('edugep-sessions-hint');
    if (!box || !DATA.sessions) return;
    const list = DATA.sessions.sessions;
    if (hint) hint.textContent = `${list.length} sessões · click para transcrição`;
    box.textContent = '';
    list.slice(0, 100).forEach(s => {
      const el = document.createElement('div');
      el.className = 'edugep-session-item';
      el.dataset.sessionId = s.session_id;

      const head = document.createElement('div');
      head.className = 'edugep-session-head';
      const phone = document.createElement('div');
      phone.className = 'edugep-session-phone';
      phone.textContent = s.lead_nome
        ? `${s.lead_nome}`
        : s.session_id.length > 20 ? s.session_id.slice(0, 20) + '…' : s.session_id;
      const ch = document.createElement('span');
      ch.className = 'edugep-session-channel ' + channelClass(s.platform);
      ch.textContent = channelName(s.platform);
      head.appendChild(phone);
      head.appendChild(ch);
      el.appendChild(head);

      if (s.lead_nome) {
        const tel = document.createElement('div');
        tel.style.fontSize = '10px';
        tel.style.fontFamily = '"SF Mono", monospace';
        tel.style.color = 'var(--edugep-text-muted)';
        tel.style.marginBottom = '4px';
        tel.textContent = s.session_id;
        el.appendChild(tel);
      }

      const meta = document.createElement('div');
      meta.className = 'edugep-session-meta';
      const t = document.createElement('span');
      t.textContent = fmtRelativeTime(s.last_msg);
      meta.appendChild(t);
      const c = document.createElement('span');
      c.textContent = `${s.msg_count} msgs`;
      meta.appendChild(c);
      if (s.ai_count > 0) {
        const nx = document.createElement('span');
        nx.className = 'edugep-session-tag edugep-tag-nexo';
        nx.textContent = `${s.ai_count} NEXO`;
        meta.appendChild(nx);
      }
      if (s.has_handoff) {
        const hh = document.createElement('span');
        hh.className = 'edugep-session-tag edugep-tag-handoff';
        hh.textContent = 'HANDOFF';
        meta.appendChild(hh);
      }
      if (s.has_reset) {
        const rr = document.createElement('span');
        rr.className = 'edugep-session-tag edugep-tag-reset';
        rr.textContent = 'RESET';
        meta.appendChild(rr);
      }
      el.appendChild(meta);

      el.addEventListener('click', () => {
        document.querySelectorAll('.edugep-session-item').forEach(x => x.classList.remove('edugep-active'));
        el.classList.add('edugep-active');
        renderTranscript(s.session_id, s);
      });

      box.appendChild(el);
    });

    // Auto-open first session with transcripts
    if (DATA.transcripts && DATA.transcripts.transcripts) {
      const firstSid = Object.keys(DATA.transcripts.transcripts)[0];
      if (firstSid) {
        const firstEl = box.querySelector(`[data-session-id="${CSS.escape(firstSid)}"]`);
        if (firstEl) {
          firstEl.classList.add('edugep-active');
          const s = list.find(x => x.session_id === firstSid);
          if (s) renderTranscript(firstSid, s);
        }
      }
    }
  }

  function renderTranscript(sid, session) {
    const box = document.getElementById('edugep-transcript');
    if (!box) return;
    box.textContent = '';

    const t = DATA.transcripts?.transcripts?.[sid];
    if (!t) {
      const empty = document.createElement('div');
      empty.className = 'edugep-transcript-empty';
      empty.textContent = 'Transcrição desta sessão não está no snapshot local. Precisa de refresh dos dados.';
      box.appendChild(empty);
      return;
    }

    // Header
    const h = document.createElement('div');
    h.className = 'edugep-transcript-header';
    const tit = document.createElement('div');
    tit.className = 'edugep-transcript-title';
    tit.textContent = session?.lead_nome
      ? `${session.lead_nome} · ${session.session_id}`
      : session?.session_id || sid;
    h.appendChild(tit);
    const sub = document.createElement('div');
    sub.style.fontSize = '11px';
    sub.style.color = 'var(--edugep-text-muted)';
    sub.textContent = `${channelName(session?.platform || '')} · ${t.length} mensagens`;
    h.appendChild(sub);
    box.appendChild(h);

    // Messages
    t.forEach(msg => {
      const el = document.createElement('div');
      const kind = (msg.type === 'ai' || msg.agent_name) ? 'ai' : 'human';
      el.className = 'edugep-msg edugep-msg-' + kind;

      const inner = document.createElement('div');
      inner.style.display = 'flex';
      inner.style.flexDirection = 'column';
      inner.style.maxWidth = '78%';

      const bubble = document.createElement('div');
      bubble.className = 'edugep-msg-bubble';
      // CRITICAL: textContent, nunca innerHTML
      bubble.textContent = msg.content || '(sem conteúdo)';
      inner.appendChild(bubble);

      const meta = document.createElement('div');
      meta.className = 'edugep-msg-meta';
      meta.style.alignSelf = kind === 'ai' ? 'flex-end' : 'flex-start';
      const who = document.createElement('span');
      who.textContent = kind === 'ai' ? (msg.agent_name || 'NEXO') : 'Utilizador';
      meta.appendChild(who);
      const time = document.createElement('span');
      time.textContent = fmtDateTime(msg.created_at);
      meta.appendChild(time);
      inner.appendChild(meta);

      el.appendChild(inner);
      box.appendChild(el);
    });
  }

  // ================== TIMELINE 24H ==================
  function renderTimeline() {
    const box = document.getElementById('edugep-timeline');
    const count = document.getElementById('edugep-tl-count');
    if (!box || !DATA.timeline) return;
    const events = DATA.timeline.events || [];
    if (count) count.textContent = `${events.length} eventos`;
    box.textContent = '';
    if (!events.length) {
      renderEmpty(box, 'Sem actividade nas últimas 24h', 'A janela abrange todas as msgs enviadas ou recebidas.');
      return;
    }

    // Group by hour
    const byHour = {};
    events.forEach(e => {
      const d = new Date(e.ts);
      const h = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}h`;
      if (!byHour[h]) byHour[h] = [];
      byHour[h].push(e);
    });
    const hours = Object.keys(byHour).sort();
    hours.forEach(h => {
      const col = document.createElement('div');
      col.className = 'edugep-timeline-hour';
      const lbl = document.createElement('div');
      lbl.className = 'edugep-timeline-hour-label';
      lbl.textContent = h.slice(11);
      col.appendChild(lbl);
      byHour[h].forEach(ev => {
        const e = document.createElement('div');
        e.className = 'edugep-timeline-event edugep-event-' + (ev.type === 'ai' ? 'ai' : 'human');
        const t = document.createElement('div');
        t.style.fontWeight = '600';
        t.textContent = (ev.type === 'ai' ? '↑ NEXO' : '↓ ' + channelName(ev.platform)) + ' ' + fmtHour(ev.ts);
        e.appendChild(t);
        const p = document.createElement('div');
        p.style.opacity = '0.8';
        p.textContent = (ev.preview || '').slice(0, 60);
        e.appendChild(p);
        e.title = ev.preview || '';
        col.appendChild(e);
      });
      box.appendChild(col);
    });
  }

  // ================== HELPERS ==================
  function renderEmpty(el, title, hint) {
    el.textContent = '';
    const wrap = document.createElement('div');
    wrap.className = 'edugep-empty';
    const t = document.createElement('div');
    t.className = 'edugep-empty-title';
    t.textContent = title;
    wrap.appendChild(t);
    if (hint) {
      const h = document.createElement('div');
      h.className = 'edugep-empty-hint';
      h.textContent = hint;
      wrap.appendChild(h);
    }
    el.appendChild(wrap);
  }

  // ================== INIT ==================
  async function init() {
    try {
      await loadData();
      renderKPIs();
      renderDuvidas();
      renderQuality();
      renderChartSeries();
      renderChartChannels();
      renderCampanhas();
      renderHeatmap();
      renderSessions();
      renderTimeline();
    } catch (e) {
      console.error('Dashboard init error:', e);
    }
  }

  document.addEventListener('edugep-auth-success', init);
  // Also init if already authed on page load
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const app = document.getElementById('edugep-app');
      if (app && app.style.display !== 'none') init();
    }, 100);
  });

})();
