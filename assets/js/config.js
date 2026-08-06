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
  },
  isabelpedroso: {
    month: 'Julho 2026',
    text: `A assistente <strong>Maria</strong> processou <strong>mais de 500 conversas</strong> (WhatsApp e Facebook), qualificando e contactando <strong>302 leads</strong>, dos quais <strong>61 avançaram para consulta agendada</strong> — e, com o novo fluxo de reservas com pagamento (live desde 27/07), <strong>14 reservas foram pagas diretamente na conversa (1.190€)</strong>. A principal porta de entrada é a mensagem padrão dos anúncios, seguida das mensagens diretas e do quiz. <strong>60% dos leads</strong> foram geridos sem qualquer intervenção humana.`
  },
  transserrano: {
    month: 'Julho 2026',
    text: `A IA processou <strong>789 conversas faturáveis</strong> em Julho (WhatsApp: 275, Instagram: 305, Facebook: 209), representando <strong>62,33 € de variável</strong> (76,67 € c/IVA). Foram tratados <strong>1.394 comentários</strong> em posts de Instagram e Facebook com resposta pública + abertura automática de DM, um dos principais motores de volume nos canais Meta. A IA capturou <strong>64 pré-reservas</strong> diretamente na conversa (nome, atividade, datas, nº pessoas). O filtro do marker <em>"[Mensagem enviada por um atendente humano]"</em> exclui 73% de mensagens que o Chatwoot regista como IA mas são atendentes reais — sem este filtro a fatura estaria inflacionada em ~3×.`
  },
  fundosolar: {
    month: 'Agosto 2026 (primeira análise, ~3 semanas de dados)',
    text: `A <strong>Clara</strong> arrancou em produção a 14/07 e nas primeiras semanas processou <strong>~49 conversas</strong> vindas de anúncios Facebook (85%) e Instagram (14%), das quais <strong>38 abriram lead</strong> no CRM (22 em conversa, 5 já qualificadas para os comerciais). A distribuição geográfica confirma a força da região <strong>Centro/Beira Interior</strong> (Castelo Branco a puxar; Faro/Algarve em 2º) e a esmagadora maioria dos pedidos são para sistemas <strong>monofásicos</strong> (69%). Como este é o primeiro mês real, os números servem sobretudo de baseline: a taxa de qualificação, o tempo até handoff e o ratio conversas/leads vão ganhar leitura fiável a partir de Setembro.`
  },
  translowcost: {
    month: 'Julho 2026',
    text: `A Bia processou <strong>828 mensagens</strong> em Julho (wa1+wa2), com <strong>86 novos leads</strong> a entrar no funil de qualificação. Volume abaixo dos meses anteriores (queda vs Junho, com 742 novos leads) — a validar com a equipa se está ligado a pausa comercial ou ban temporário do número. <strong>85% dos pedidos são mudanças</strong>, com uma minoria de transporte de viaturas, mercadorias e armazenamento. <strong>85% em português</strong>, 10% inglês, 5% francês — cobertura multi-idioma a funcionar. Cumulativo desde arranque: <strong>1.709 leads em "Aguarda Comercial"</strong>, entregues à equipa pela Bia sem intervenção manual.`
  },
  memoria: {
    month: 'Agosto 2026',
    text: `O sistema gerou <strong>58 blog posts</strong> desde o arranque (31 Maio), com uma média de <strong>~20 posts/mês</strong> a partir de Junho. <strong>15 posts</strong> já foram publicados manualmente pela equipa clínica; <strong>43</strong> aguardam revisão. A correção aplicada em 27/07 (rotação de keywords + desativação da "estimulação cognitiva" genérica) começa a diversificar a distribuição de pilares — os próximos posts devem cobrir <strong>7 áreas clínicas</strong> em vez de convergirem para uma. Banco de fotos com <strong>93 imagens livres</strong> (~4-5 meses de autonomia).`
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
    costPerMessage: 0.15,      // marketing €/msg (ROI)
    costPerMessageOp: 0.08,    // operacionais €/msg (informativo, fora do ROI)
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
    costPerMessage: 0.12,      // marketing €/msg (ROI)
    costPerMessageOp: 0.05,    // operacionais €/msg (informativo, fora do ROI)
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
    costPerMessage: 0.15,      // marketing €/msg (ROI)
    costPerMessageOp: 0.08,    // operacionais €/msg (informativo, fora do ROI)
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
    costPerMessage: 0.12,      // marketing €/msg (ROI)
    costPerMessageOp: 0.05,    // operacionais €/msg (informativo, fora do ROI)
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
    costPerMessage: 0.15,
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
    startDate: '2026-04-09',  // ajustar se necessário
    context: 'dual_agent'  // 2 agentes IA distintos: Loja + Assistência Técnica (tabelas separadas)
  },
  lojaginastica: {
    name: 'Be on Sport',
    password: 'lojaginastica2026',
    services: ['chatbot', 'messaging'],
    channels: ['whatsapp'],
    schema: 'loja_de_ginastica',
    domainId: 14,
    startDate: '2026-04-20'  // live 20/4/2026 12h
  },
  georginamoura: {
    name: 'Georgina Moura',
    password: 'georginamoura2026',
    services: ['chatbot'],
    channels: ['whatsapp'],
    schema: 'georgina_moura',
    domainId: null,  // sem Kutt domain
    startDate: '2026-03-05',  // primeira mensagem 5/3
    context: 'credit_qualifier'
  },
  abadias: {
    name: 'Escola de Condução Abadias',
    password: 'abadias2026',
    services: ['chatbot'],
    channels: ['chatwoot'],
    schema: 'abadias',
    domainId: null,
    startDate: '2026-04-29',  // live hoje, ajustar quando user confirmar
    context: 'driving_school'
  },
  marcorego: {
    name: 'Dr. Marco Rego',
    password: 'marcorego2026',
    services: ['chatbot'],
    channels: ['whatsapp', 'instagram', 'facebook'],
    schema: 'marco_rego',
    domainId: null,
    startDate: '2026-06-14',  // go-live 14/6/2026
    context: 'clinica'  // clínica oftalmologia: atendimento multi-canal + comentários + qualificações (Íris)
  },
  isabelpedroso: {
    name: 'Isabel Pedroso',
    password: 'isabelpedroso2026',
    services: ['chatbot'],
    channels: ['whatsapp', 'facebook'],
    schema: 'isabel_pedroso',
    domainId: null,
    startDate: '2026-03-13',
    context: 'clinica_nutri'  // nutrição clínica: qualificação de leads + marcação 1ª consulta (Maria)
  },
  transserrano: {
    name: 'Trans Serrano',
    password: 'transserrano2026',
    services: ['chatbot'],
    channels: ['whatsapp', 'instagram', 'facebook'],
    schema: 'transserrano',
    domainId: null,
    startDate: '2026-04-26',           // primeira mensagem em chat_histories
    context: 'turismo_conversas',      // turismo aventura: faturação por conversa + comentários + pré-reservas
    costPerConversation: 0.079         // €/conversa faturável (variável)
  },
  fundosolar: {
    name: 'Fundo Solar',
    password: 'fundosolar2026',
    services: ['chatbot'],
    channels: ['whatsapp', 'instagram', 'facebook'],
    schema: 'fundo_solar',
    domainId: null,
    startDate: '2026-07-14',           // go-live real
    context: 'lead_qualifier_solar'    // qualificação de leads fotovoltaicos (Clara)
  },
  translowcost: {
    name: 'Translowcost',
    password: 'translowcost2026',
    services: ['chatbot'],
    channels: ['whatsapp'],
    schema: 'translowcost',
    domainId: null,
    startDate: '2026-04-17',           // primeira msg wa1 (kickoff)
    context: 'qualificador_mudancas'   // qualificação leads mudanças (Bia, 2 instâncias WA)
  },
  memoria: {
    name: 'Memo.ria',
    password: 'memoria2026',
    services: ['content'],             // sem chatbot / messaging — geração de blog posts SEO
    channels: [],
    schema: 'centro_memoria',
    domainId: null,
    startDate: '2026-05-31',           // primeiro post real em produção
    context: 'content_generation'
  }
};
