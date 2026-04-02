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
    text: `<strong>766 mensagens automáticas</strong> enviadas este mês, gerando <strong>212 cliques</strong> e <strong>29 encomendas atribuídas</strong> (795,61€ em receita). A taxa de cliques das campanhas de Upsell (38,9%) supera significativamente os Carrinhos Abandonados (14,8%), sugerindo que os clientes respondem melhor a recomendações de produtos complementares. O agente IA resolveu <strong>55%</strong> das conversas sem intervenção humana — há margem para melhorar com respostas mais completas sobre prazos de entrega e políticas de devolução, que são os temas mais escalados.`
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
    text: `O agente de Instagram processou <strong>176 conversas</strong> de qualificação de leads. O sistema identifica e qualifica potenciais clientes interessados em planos de treino, encaminhando os mais promissores para a equipa.`
  },
  lojinhabebe: {
    month: 'Março 2026',
    text: `<strong>1.271 conversas</strong> processadas entre Instagram e Facebook — o maior volume de conversas do portfólio. O chatbot responde a dúvidas sobre produtos para bebé, tamanhos e disponibilidade, libertando a equipa para focar no atendimento personalizado.`
  },
  teclasdavida: {
    month: 'Março 2026',
    text: `<strong>986 conversas</strong> de qualificação de crédito processadas via WhatsApp. O agente identifica clientes elegíveis para crédito pessoal e encaminha os leads qualificados. Volume consistente com os meses anteriores.`
  }
};

const CLIENTS = {
  rrcustoms: {
    name: 'RR Customs',
    password: 'rrcustoms2026',
    services: ['chatbot', 'messaging'],
    channels: ['whatsapp'],
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
    domainId: null,
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
    domainId: null,
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
    domainId: null,
    msgTables: {
      automaticas: { failFilter: 'failed_at IS NULL' },
      operacionais: null
    }
  },
  teclasdavida: {
    name: 'Teclas da Vida',
    password: 'teclasdavida2026',
    services: ['chatbot'],
    channels: ['whatsapp'],
    schema: 'teclas_da_vida',
    domainId: null
  },
  nowfitness: {
    name: 'Now Fitness Studio',
    password: 'nowfitness2026',
    services: ['chatbot'],
    channels: ['instagram'],
    schema: 'now_fitness_studio',
    domainId: null,
    context: 'leads'  // show lead/conversion metrics
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
    startDate: '2026-01-08'  // IA ativa desde 8/1
  },
  odiseguros: {
    name: 'OdiSeguros',
    password: 'odiseguros2026',
    services: ['chatbot'],
    channels: ['whatsapp'],
    schema: 'odiseguros',
    domainId: null,
    startDate: '2026-03-25'  // IA ativa desde 25/3
  },
  purarrituals: {
    name: 'Pura Rituals',
    password: 'purarrituals2026',
    services: ['chatbot'],
    channels: ['chatwoot'],
    schema: 'pura_rituals',
    domainId: null,
    startDate: '2026-02-27'  // primeiras msgs IA 27/2, WA pode ser mais tarde
  },
  aprova: {
    name: 'Aprova',
    password: 'aprova2026',
    services: ['chatbot'],
    channels: ['whatsapp'],
    schema: null,  // sem schema próprio
    domainId: null
  }
};
