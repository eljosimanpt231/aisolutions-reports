// Mock data for design preview — remove when n8n webhooks are live
const MOCK_MODE = true;

const MOCK_CHATBOT = {
  total_conversations: 287,
  ai_resolution_rate: 76.3,
  messages_ai: 1842,
  messages_human: 423,
  conversations_ai_only: 219,
  conversations_with_human: 68,
  channels: {
    whatsapp: { conversations: 156, messages_ai: 980, messages_human: 210 },
    instagram: { conversations: 78, messages_ai: 520, messages_human: 130 },
    facebook: { conversations: 53, messages_ai: 342, messages_human: 83 }
  },
  hourly_distribution: [
    {hour:0,count:3},{hour:1,count:1},{hour:2,count:0},{hour:3,count:0},
    {hour:4,count:1},{hour:5,count:2},{hour:6,count:5},{hour:7,count:12},
    {hour:8,count:18},{hour:9,count:32},{hour:10,count:38},{hour:11,count:35},
    {hour:12,count:28},{hour:13,count:22},{hour:14,count:30},{hour:15,count:34},
    {hour:16,count:29},{hour:17,count:25},{hour:18,count:21},{hour:19,count:18},
    {hour:20,count:15},{hour:21,count:12},{hour:22,count:8},{hour:23,count:5}
  ]
};

const MOCK_MESSAGING = {
  operacionais: [
    { tipo: 'MBWay', total: 206 },
    { tipo: 'Multibanco', total: 121 },
    { tipo: 'Morada', total: 89 },
    { tipo: 'Código Postal', total: 34 }
  ],
  automaticas: [
    { tipo: 'Carrinho Abandonado', total: 359 },
    { tipo: 'Upsell', total: 409 }
  ],
  messages_sent: 1218,
  total_clicks: 523,
  total_orders: 47,
  total_revenue: 3245.80,
  click_rate: 42.9,
  growth: {
    messages: 12.3,
    clicks: 8.7,
    orders: 15.2,
    revenue: 18.4
  }
};

const MOCK_CLICKS = { total_clicks: 523 };

// Override API functions in mock mode
if (MOCK_MODE) {
  window.getChatbotMetrics = async () => MOCK_CHATBOT;
  window.getMessagingMetrics = async () => MOCK_MESSAGING;
  window.getClickMetrics = async () => MOCK_CLICKS;
}
