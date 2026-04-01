// ============================================================
// AI Solutions — Client Reports Config
// ============================================================
// Adicionar novo cliente: criar entrada aqui + pasta com index.html
// ============================================================

const API_BASE = 'https://hooks.aisolutions.pt/webhook';

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
    domainId: null
  },
  lojinhabebe: {
    name: 'Lojinha Bebé',
    password: 'lojinhabebe2026',
    services: ['chatbot'],
    channels: ['facebook', 'instagram'],
    schema: 'lojinha_bebe',
    domainId: null
  },
  ecodrive: {
    name: 'EcoDrive',
    password: 'ecodrive2026',
    services: ['chatbot'],
    channels: ['whatsapp'],
    schema: 'ecodrive',
    domainId: null
  },
  odiseguros: {
    name: 'OdiSeguros',
    password: 'odiseguros2026',
    services: ['chatbot'],
    channels: ['whatsapp'],
    schema: 'odiseguros',
    domainId: null
  },
  purarrituals: {
    name: 'Pura Rituals',
    password: 'purarrituals2026',
    services: ['chatbot'],
    channels: ['whatsapp'],
    schema: null,  // TODO: verificar
    domainId: null
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
