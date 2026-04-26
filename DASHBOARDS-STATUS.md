# Dashboards — Estado de Validação

Documento para acompanhar o processo de validação dos reports de cada cliente. Só após confirmação do Josias é que o estado passa a **Aprovado**.

## Legenda
- 🔴 **Por validar** — ainda não foi revisto
- 🟡 **Em revisão** — em curso de ajustes, aguardar nova validação
- 🟢 **Aprovado** — validado pelo Josias, sem alterações pendentes
- ⚫ **Bloqueado** — depende de info/decisão externa

## Estado por cliente

| Cliente | Estado | Último review | Notas pendentes |
|---------|--------|---------------|-----------------|
| RR Customs | 🟢 Aprovado | 2026-04-22 | — |
| HCO Cosméticos | 🟡 Em revisão | 2026-04-22 | Separar operacionais vs marketing (sempre mostrar ambos KPIs) |
| FBeauty | 🟢 Aprovado | 2026-04-22 | — |
| FarmatoGo | 🟢 Aprovado | 2026-04-22 | — |
| ManInc | 🟢 Aprovado | 2026-04-22 | — |
| Teclas da Vida | 🟢 Aprovado | 2026-04-22 | — |
| Now Fitness Studio | 🟡 Em revisão | 2026-04-22 | Bug fix: coluna `nome_cliente` (não `nome`) — agora 360 utilizadores, 41 leads |
| Lojinha Bebé | 🟢 Aprovado | 2026-04-21 | — |
| EcoDrive | 🟢 Aprovado | 2026-04-21 | — |
| OdiSeguros | 🟢 Aprovado | 2026-04-21 | — |
| Pura Rituals | 🟢 Aprovado | 2026-04-22 | — |
| RL Store | 🟢 Aprovado | 2026-04-22 | — |
| Costura Urbana | 🟡 Aprovado provisório | 2026-04-22 | Rever no final do mês (1º mês completo de dados) |
| Be on Sport (Loja de Ginástica) | 🟡 Aprovado provisório | 2026-04-22 | Rever no final do mês (1º mês completo de dados) |

## Histórico de alterações por cliente

### RL Store
- 2026-04-21: Setup inicial completo — live, config, workflow, billing, Notion

### Costura Urbana
- 2026-04-21: Setup inicial — 2 chat tables (loja + assistência), messaging

### Be on Sport
- 2026-04-21: Setup inicial — WA, messaging, CRM atualizado com nome alternativo

### Now Fitness
- 2026-04-22: Bug fix crítico — query custom usava `nome` mas DB tem `nome_cliente`. Erro era silenciado por `onError: continueRegularOutput`, todos os KPIs voltavam 0. Corrigido com aliases.

### HCO
- 2026-04-22: Separar visualmente operacionais vs marketing (KPIs sempre mostram ambos para HCO/FBeauty/FarmatoGo)

### OdiSeguros
- 2026-04-21: Classification query real (contatos_bloqueados) — Novos Leads/Clientes Existentes/Urgentes/Em Qualificação. Ramos chart + tabela urgentes. Phone cleanup (remove @s.whatsapp.net). APROVADO

### Pura Rituals
- 2026-04-13: startDate corrigido para 2026-03-26 (IA estável 100% sessões)
- 2026-04-06: aiSessionFilter ativado

### EcoDrive
- 2026-04-21 (2): Try-catch individual por chart (isolar falhas), KPIs "Velocidade IA" (2.2s) e "Velocidade Equipa" (100h mediana), adicionadas KPIs "Mensagens IA" (4594) vs "Mensagens Equipa" (453) com multiplicador (10.1x). Query human_response_time corrigida para medir desde a última msg do cliente. Marker humano corrigido em platforms e daily queries (usar [Mensagem enviada por um atendente humano])
- 2026-04-21: Daily com 4 séries (conversas/IA/equipa/cliente), queries otimizadas 15s→0.4s
- 2026-04-13: Leads table criada, migração 137 leads, platforms breakdown

### Lojinha Bebé
- 2026-04-21: Daily chart + agent breakdown (IDs 7-10 mapeados)
- 2026-04-13: Context 'porteiro' ativado, métricas "sem humano"

## Processo

1. **Josias escolhe um cliente** para rever
2. **Claude testa** o dashboard e reporta o que vê
3. **Josias aponta ajustes** ou aprova
4. Se houver ajustes:
   - Claude faz as alterações
   - Estado = 🟡 Em revisão
   - Atualiza secção "Notas pendentes" com o que foi corrigido
5. Quando Josias confirma "está ok":
   - Estado = 🟢 Aprovado
   - Limpar "Notas pendentes"
   - Registar no histórico

## Áreas comuns a validar em cada dashboard

- [ ] KPIs principais mostram valores corretos (comparar com reports mensais antigos)
- [ ] Taxa de resolução IA é realista (não 100% nem 0%)
- [ ] Gráficos por canal (se aplicável) têm dados
- [ ] Distribuição horária funciona
- [ ] Cliques (se aplicável) mostram números
- [ ] Mensagens operacionais vs marketing bem separadas
- [ ] Taxa de clique das msgs automáticas (se aplicável)
- [ ] Terminologia correta (Carrinho Abandonado, não "recovery")
- [ ] startDate respeitado (não mostra dados antes de IA live)
- [ ] Period selector funciona (7d, 15d, 30d, Este mês, Mês anterior, Personalizado)
- [ ] Context-specific: leads (EcoDrive/Now Fitness), porteiro (Lojinha), qualificador (OdiSeguros), lead_gen (Now Fitness)
- [ ] Insight faz sentido e está atualizado
- [ ] Mobile funciona
