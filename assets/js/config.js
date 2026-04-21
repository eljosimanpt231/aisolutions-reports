// ============================================================
// AI Solutions — Client Reports Config
// ============================================================
// Adicionar novo cliente: criar entrada aqui + pasta com index.html
// ============================================================

const API_BASE = 'https://hooks.aisolutions.pt/webhook';

// Monthly AI insights per client (updated manually each month)
const INSIGHTS = {
  rrcustoms: {
    month: 'Março 2026',
    text: `O agente processou <strong>222 conversas</strong> nos 3 canais (WA: 158, IG: 50, FB: 14) com uma taxa de resolução de <strong>56,3%</strong>. No lado das mensagens automáticas, foram enviadas <strong>766 mensagens</strong> (408 Upsell + 358 Carrinho Abandonado) gerando <strong>395 cliques</strong> em produtos e <strong>35 encomendas atribuídas</strong> (1.025,60€). As campanhas de Upsell continuam a superar os Carrinhos Abandonados em taxa de clique.`
  },
  hco: {
    month: 'Março 2026',
    text: `O agente processou <strong>497 conversas</strong> este mês. As <strong>269 mensagens operacionais</strong> (Multibanco, MBWay, morada) mantêm a consistência com meses anteriores. A taxa de resolução IA de <strong>36%</strong> indica que muitas conversas precisam de intervenção — os temas mais frequentes de escalação são dúvidas sobre composição de produtos e compatibilidade com tipos de pele. Recomenda-se expandir a base de conhecimento nessas áreas.`
  },
  ecodrive: {
    month: 'Março 2026',
    text: `Mês forte com <strong>2.876 conversas</strong> processadas pelo agente Alice. A taxa de resolução IA de <strong>72%</strong> é a melhor do portfólio. Foram recolhidos <strong>137 leads qualificados</strong> desde o lançamento, com maior procura para <strong>CAM Inicial Categoria C</strong> e <strong>Carta B Ligeiros</strong>. Odivelas continua a ser a localidade mais pedida. As conversas fora de horário (22h-8h) representam 18% do total — demonstrando o valor do atendimento 24/7.`
  },
  fbeauty: {
    month: 'Março 2026',
    text: `<strong>326 mensagens operacionais</strong> enviadas (MBWay e Multibanco), ajudando a garantir que os clientes completam os pagamentos pendentes. Este serviço contribui diretamente para a redução de encomendas não pagas.`
  },
  farmatogo: {
    month: 'Março 2026',
    text: `<strong>422 mensagens de Carrinho Abandonado</strong> enviadas com <strong>75 cliques</strong> (17,8% taxa). As mensagens operacionais (MBWay e Morada) somaram 263 envios. O foco na recuperação de carrinhos continua a ser o principal driver de valor.`
  },
  nowfitness: {
    month: 'Março 2026',
    text: `O sistema processou <strong>38 comentários</strong> no Instagram, gerando automaticamente <strong>20 DMs</strong> para iniciar conversas de qualificação. De <strong>180 utilizadores únicos</strong> que interagiram, <strong>5 registaram-se como leads</strong> (3 Pilates, 2 PT). Foram ainda enviados <strong>111 follow-ups</strong> automáticos para manter o engagement com contactos anteriores. A taxa de conversão de 2,8% é típica de Instagram lead gen — cada lead vale consideravelmente mais do que o custo por mensagem.`
  },
  lojinhabebe: {
    month: 'Março 2026',
    text: `<strong>1.271 conversas</strong> processadas entre Instagram e Facebook — o maior volume de conversas do portfólio. O chatbot responde a dúvidas sobre produtos para bebé, tamanhos e disponibilidade, libertando a equipa para focar no atendimento personalizado.`
  },
  teclasdavida: {
    month: 'Março 2026',
    text: `<strong>986 conversas</strong> de qualificação de crédito processadas via WhatsApp. O agente identifica clientes elegíveis para crédito pessoal e encaminha os leads qualificados. Volume consistente com os meses anteriores.`
  },
  rlstore: {
    month: 'Abril 2026 (live desde dia 8)',
    text: `Primeiros dias em produção com o chatbot multiplataforma (WhatsApp + Instagram). O sistema responde autonomamente a questões sobre produtos, disponibilidade e compras, escalando para a equipa apenas quando necessário. À medida que a base de conhecimento cresce e os padrões de questões dos clientes vão sendo identificados, a taxa de resolução tende a melhorar significativamente nas primeiras semanas.`
  },
  costuraurbana: {
    month: 'Abril 2026 (live)',
    text: `Dois agentes IA em produção via WhatsApp: um agente dedicado à <strong>loja</strong> (questões sobre produtos, encomendas e disponibilidade) e um agente de <strong>assistência técnica</strong> (suporte especializado em reparações). Complementado por mensagens automáticas de carrinho abandonado para recuperar vendas perdidas. Esta arquitetura dual permite respostas mais especializadas em cada contexto.`
  },
  lojaginastica: {
    month: 'Abril 2026 (live desde dia 20)',
    text: `Cliente acabou de entrar em produção. O agente IA responde a questões sobre produtos de ginástica, disponibilidade e encomendas via WhatsApp. O ecossistema inclui ainda mensagens automáticas de carrinho abandonado, upsell e recuperação de clientes inativos — otimizando o ciclo de conversão e retenção.`
  },
  odiseguros: {
    month: 'Março 2026 (desde dia 25)',
    text: `Primeira semana em produção. A IA processou <strong>64 conversas</strong>, identificando automaticamente <strong>clientes existentes</strong> (que são encaminhados diretamente) e <strong>novos leads</strong> (onde recolhe dados: NIF, matrícula, data de nascimento, morada). Este trabalho de triagem e recolha de informação poupa tempo significativo à equipa antes mesmo de iniciar o atendimento.`
  },
  purarrituals: {
    month: 'Março 2026 (desde dia 26)',
    text: `Primeira semana em produção com resultados promissores. O agente processou <strong>96 conversas</strong> com uma taxa de resolução de <strong>67,7%</strong> — resolvendo autonomamente questões sobre produtos, ingredientes e disponibilidade. As restantes 32% são encaminhadas para a equipa para questões mais complexas ou personalizadas.`
  }
};

const CLIENTS = {
  rrcustoms: {
    name: 'RR Customs',
    password: 'rrcustoms2026',
    services: ['chatbot', 'messaging'],
    channels: ['whatsapp', 'facebook', 'instagram'],
    schema: 'rr_customs',
    domainId: 4,
    msgTables: {
      automaticas: { failFilter: 'send_failed = false' },
      operacionais: null
    }
  },
  hco: {
    name: 'HCO Cosméticos',
    password: 'hcocosmeticos2026',
    services: ['chatbot', 'messaging'],
    channels: ['whatsapp', 'facebook', 'instagram'],
    schema: 'hco_cosmeticos',
    domainId: 9,
    msgTables: {
      automaticas: { failFilter: 'failed_at IS NULL' },
      operacionais: { typeCol: 'tipo' }
    }
  },
  fbeauty: {
    name: 'FBeauty',
    password: 'fbeauty2026',
    services: ['messaging'],
    channels: [],
    schema: 'fbeauty',
    domainId: 7,
    msgTables: {
      automaticas: { failFilter: 'failed_at IS NULL' },
      operacionais: { typeCol: 'tipo' }
    }
  },
  farmatogo: {
    name: 'FarmatoGo',
    password: 'farmatogo2026',
    services: ['messaging'],
    channels: [],
    schema: 'farmatogo',
    domainId: 6,
    msgTables: {
      automaticas: { failFilter: 'send_failed = false' },
      operacionais: { typeCol: 'tipo' }
    }
  },
  maninc: {
    name: 'ManInc',
    password: 'maninc2026',
    services: ['messaging'],
    channels: [],
    schema: 'maninc',
    domainId: 8,
    msgTables: {
      automaticas: { failFilter: 'failed_at IS NULL' },
      operacionais: null
    }
  },
  teclasdavida: {
    name: 'Teclas da Vida',
    password: 'teclasdavida2026',
    services: ['chatbot', 'messaging'],
    channels: ['whatsapp'],
    schema: 'teclas_da_vida',
    domainId: 12
  },
  nowfitness: {
    name: 'Now Fitness Studio',
    password: 'nowfitness2026',
    services: ['chatbot'],
    channels: ['instagram'],
    schema: 'now_fitness_studio',
    domainId: null,
    context: 'lead_gen'  // Instagram lead generation: comments → DMs → leads
  },
  lojinhabebe: {
    name: 'Lojinha Bebé',
    password: 'lojinhabebe2026',
    services: ['chatbot'],
    channels: ['facebook', 'instagram'],
    schema: 'lojinha_bebe',
    domainId: null,
    context: 'porteiro'  // show "Conversas Só IA" framing
  },
  ecodrive: {
    name: 'EcoDrive',
    password: 'ecodrive2026',
    services: ['chatbot'],
    channels: ['chatwoot'],
    schema: 'ecodrive',
    domainId: null,
    hasLeads: true,
    context: 'leads',
    startDate: '2026-01-08'  // IA ativa desde 8/1 (filtro AI session já exclui sem IA)
  },
  odiseguros: {
    name: 'OdiSeguros',
    password: 'odiseguros2026',
    services: ['chatbot'],
    channels: ['whatsapp'],
    schema: 'odiseguros',
    domainId: null,
    startDate: '2026-03-25',
    context: 'qualificador'  // lead qualification bot, not resolution bot
  },
  purarrituals: {
    name: 'Pura Rituals',
    password: 'purarrituals2026',
    services: ['chatbot'],
    channels: ['chatwoot'],
    schema: 'pura_rituals',
    domainId: 13,
    startDate: '2026-03-26'  // IA estável a partir de 26/3 (100% sessões com IA)
  },
  rlstore: {
    name: 'RL Store',
    password: 'rlstore2026',
    services: ['chatbot'],
    channels: ['chatwoot'],
    schema: 'rl_store',
    domainId: 15,
    startDate: '2026-04-08'  // IA live a partir de 8/4/2026
  },
  costuraurbana: {
    name: 'Costura Urbana',
    password: 'costuraurbana2026',
    services: ['chatbot', 'messaging'],
    channels: ['whatsapp'],  // 2 agentes WA: loja + assistência
    schema: 'costura_urbana',
    domainId: 11,
    startDate: '2026-04-09'  // ajustar se necessário
  },
  lojaginastica: {
    name: 'Be on Sport',
    password: 'lojaginastica2026',
    services: ['chatbot', 'messaging'],
    channels: ['whatsapp'],
    schema: 'loja_de_ginastica',
    domainId: 14,
    startDate: '2026-04-20'  // live 20/4/2026 12h
  }
};
