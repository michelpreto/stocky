# AlmoxControl — Documento de Produto (CLAUDE.md)

> **Para o Claude Code:** este arquivo é a fonte de verdade do produto. Leia-o por inteiro antes de gerar qualquer código. Ele contém a estratégia (PSS), a especificação de design (PDS), os blueprints (serviço + técnico) e a camada de hiperpersonalização. Toda decisão de implementação deve ser coerente com este documento. Quando houver conflito entre um pedido pontual e este arquivo, peça confirmação.

---

## Nota sobre as siglas

As siglas têm interpretações variadas entre frameworks. Neste documento são usadas assim — ajuste se o seu curso/empresa usar outra definição:

| Sigla | Significado adotado | O que responde |
|-------|---------------------|----------------|
| **PSS** | Product Strategy Statement (Declaração de Estratégia do Produto) | Por quê, para quem, qual valor |
| **PDS** | Product Design Specification (Especificação de Design do Produto) | O que o produto deve fazer e como deve ser |
| **Blueprint** | Service Blueprint + Technical Blueprint | Como o serviço é entregue e como é construído |
| **Hiperpersonalização** | Hyper-personalization Layer | Como o produto se adapta a cada usuário/organização |

---

## Contexto de Origem

Este produto nasce da digitalização de uma planilha manual de controle de almoxarifado (`Planilha_Estoque-_Michel.xlsx`). A planilha controla insumos de **limpeza e copa** de uma operação, com a seguinte estrutura:

| Coluna da planilha | Significado | Vira no sistema |
|--------------------|-------------|-----------------|
| Código | Código interno do produto (SKU) | `Product.codigoInterno` |
| Descrição dos Produtos | Nome/descrição do item | `Product.nome` |
| Embalagem | Tipo de embalagem/unidade (FD-10X1KG, GL-5L, UN-500ML, PCT C/100, PAR, CX-12X1L...) | `Product.unidadeMedida` + `Product.fatorEmbalagem` |
| Quantidade Estoque | Saldo atual | `ProductWarehouse.estoqueAtual` |
| Vlr Unit | Custo unitário | `Product.custoUnitario` |
| Estoque Segurança | Estoque mínimo / ponto de alerta | `ProductWarehouse.estoqueMinimo` |
| Compra 19/05 | Lista de reposição com quantidade a comprar | Módulo de **Sugestão de Compra** |

**Aprendizados extraídos da planilha (devem ser respeitados no produto):**
- Os códigos de embalagem são compostos e informativos (ex: `FD-10X1KG` = fardo com 10 unidades de 1kg). O sistema precisa entender **unidade de compra** vs **unidade de consumo**.
- A coluna de compra registra a decisão de reposição com **quantidade e tipo de embalagem** ("12 Fardos", "08 Galões", "-" para não comprar). Isso é a semente do módulo de sugestão automática de compras.
- Itens sem código (ex: "ESPONJA", "LUVA SANRO TOP", "S. LIXO PRETO 60L") mostram que o cadastro precisa tolerar produtos incompletos e permitir completá-los depois.
- Há mistura de categorias (limpeza + alimentos/copa) — o sistema precisa de **categorização** desde o início.
- Valores monetários estão em formato brasileiro (vírgula decimal) — atenção a parsing/locale (`pt-BR`).

---

# 1. PSS — Product Strategy Statement

## 1.1 Visão

> Substituir planilhas manuais de almoxarifado por um SaaS simples, rápido e inteligente, que dá controle total ao gestor e agilidade máxima a quem opera o estoque — eliminando rupturas, perdas e compras no escuro.

## 1.2 Problema

Operações que controlam estoque em planilha sofrem com:
- **Falta de tempo real:** a planilha desatualiza no momento em que alguém retira um item sem anotar.
- **Rupturas e excessos:** sem alerta automático de estoque de segurança, falta o essencial ou sobra capital parado.
- **Compras reativas e subjetivas:** a decisão de compra depende de alguém olhar a planilha e estimar quantidades.
- **Zero rastreabilidade:** não se sabe quem retirou, quando, para qual setor.
- **Erro humano:** valores digitados errado, fórmulas quebradas, versões divergentes do arquivo.

## 1.3 Público-alvo

| Persona | Perfil | Dor principal | O que valoriza |
|---------|--------|---------------|----------------|
| **Gestor/Responsável (Admin)** | Compras, supervisão, administrativo | Não enxerga o estoque em tempo real nem prevê compras | Visão consolidada, alertas, relatórios, previsão de compra |
| **Operador de Estoque** | Almoxarife, auxiliar, equipe de limpeza/copa | Anotar baixas é lento e fácil de esquecer | Dar baixa em segundos, idealmente por celular/código de barras |
| **Solicitante** | Setores que pedem material | Pedir material é informal e sem rastreio | Pedir pelo sistema e acompanhar o status |

## 1.4 Proposta de Valor

- **Para o gestor:** "Saiba exatamente o que tem, o que vai faltar e o que comprar — sem abrir uma planilha."
- **Para o operador:** "Dê baixa de um item em menos de 10 segundos, do celular, mesmo sem internet."
- **Para a organização:** "Reduza rupturas, perdas e capital parado com decisões de compra baseadas em consumo real."

## 1.5 Diferenciais Estratégicos

1. **Migração sem atrito:** importa a planilha existente (Excel/CSV) e o sistema já nasce povoado.
2. **Sugestão de compra inteligente:** evolui a coluna "Compra" da planilha para um cálculo automático baseado em consumo, estoque de segurança e lead time do fornecedor.
3. **Operação mobile-first e offline:** o operador trabalha no chão da operação, não numa mesa.
4. **Hiperpersonalização por segmento e por uso:** o sistema se adapta ao tipo de operação (limpeza, copa, construção, hospitalar) e aos hábitos de cada usuário.

## 1.6 Métricas de Sucesso (North Star + apoio)

- **North Star:** nº de baixas/movimentações registradas por semana (mede adoção real).
- Apoio: % de itens com estoque atualizado nas últimas 48h; nº de rupturas/mês (deve cair); tempo médio para registrar uma baixa; % de compras geradas via sugestão do sistema; taxa de acuracidade no inventário.

## 1.7 Escopo (o que é e o que NÃO é)

**É:** controle de estoque, movimentações, compras, solicitações, inventário, relatórios, multi-almoxarifado, alertas.
**NÃO é (v1):** ERP financeiro completo, folha de pagamento, emissão fiscal (NF-e de saída), gestão de produção. Pode integrar com esses sistemas via API, mas não os substitui.

---

# 2. PDS — Product Design Specification

## 2.1 Requisitos Funcionais (RF)

> Os RF marcados com 📋 vêm diretamente da planilha. Os marcados com ⭐ são funções sugeridas (novas).

### RF-01 · Cadastro de Produtos 📋
- Código interno (manual ou auto-gerado), nome/descrição, código de barras ⭐, categoria, foto ⭐.
- **Embalagem composta** 📋: tipo de embalagem (Fardo, Galão, Caixa, Pacote, Par, Unidade...), unidade de medida base, e **fator de conversão** (ex: 1 fardo = 10 kg; 1 caixa = 12 litros).
- Distinção entre **unidade de compra** (galão de 5L) e **unidade de consumo** (litro) ⭐.
- Custo unitário 📋 com histórico de variação ⭐.
- Tolerância a cadastro incompleto 📋 (produto sem código pode ser salvo como rascunho e completado depois).

### RF-02 · Controle de Estoque 📋
- Saldo atual por produto e por almoxarifado 📋.
- Estoque mínimo / de segurança 📋 e estoque máximo ⭐.
- Ponto de reposição ⭐ (gatilho de compra).
- Localização física (corredor/prateleira/posição) ⭐.
- Valoração do estoque 📋 (saldo × custo unitário), total por categoria e geral ⭐.

### RF-03 · Movimentações
- **Entrada** ⭐: manual, por importação de XML de NF-e, ou via recebimento de ordem de compra.
- **Saída/baixa de consumo** ⭐: registro rápido com motivo, setor solicitante e quem retirou.
- **Ajuste** ⭐: correção de saldo (com justificativa, gera auditoria).
- **Transferência** ⭐ entre almoxarifados.
- Toda movimentação registra: usuário, data/hora, quantidade anterior e resultante.

### RF-04 · Sugestão de Compra / Reposição 📋⭐
- Evolução da coluna "Compra" da planilha.
- Lista automática de itens **abaixo do ponto de reposição** com **quantidade sugerida** (estoque máximo − estoque atual, ou consumo médio × lead time).
- Sugere a quantidade já na **unidade de compra** do produto (ex: "comprar 12 fardos") 📋.
- Permite gerar uma **ordem de compra** ou exportar a lista (PDF/Excel/WhatsApp) ⭐.

### RF-05 · Solicitações de Material ⭐
- Setores solicitam itens; admin aprova (total/parcial); operador separa e entrega.
- Workflow: Pendente → Aprovada → Separada → Entregue (ou Recusada).

### RF-06 · Fornecedores e Compras ⭐
- Cadastro de fornecedores (CNPJ com consulta automática, contato, itens fornecidos).
- Ordens de compra com recebimento (total/parcial) que dá entrada no estoque.
- Histórico de preços por fornecedor (qual comprou mais barato).

### RF-07 · Inventário ⭐
- Contagem cíclica ou completa; comparação saldo sistema × contado; ajuste de divergências; relatório de acuracidade.

### RF-08 · Categorização 📋⭐
- Categorias e subcategorias (Limpeza, Copa/Alimentos, EPI, Ferramentas...).
- Itens da planilha pré-classificados na importação por palavras-chave.

### RF-09 · Usuários e Permissões ⭐
- Perfis Admin, Operador, Solicitante; permissões granulares por almoxarifado e por categoria.

### RF-10 · Relatórios ⭐
- Movimentação por período, inventário valorizado, curva ABC, consumo por setor, histórico de preços, **previsão de ruptura**.

### RF-11 · Alertas e Notificações ⭐
- Estoque mínimo atingido, item zerado, validade próxima, previsão de ruptura, solicitação pendente.

### RF-12 · Controle de Validade e Lote ⭐
- Relevante para copa/alimentos (leite, café, açúcar) e produtos químicos. Lógica FEFO (vence primeiro, sai primeiro).

### RF-13 · Importação da Planilha 📋⭐
- Wizard que importa o Excel/CSV existente, mapeia colunas (Código, Descrição, Embalagem, Quantidade, Vlr Unit, Estoque Segurança), valida e popula o sistema.

### RF-14 · Multi-almoxarifado ⭐
- Vários estoques (ex: matriz, filial, obra) com transferências e visão consolidada.

### RF-15 · API e Webhooks ⭐
- API REST com API key; webhooks para eventos de estoque.

### RF-16 · Audit Trail ⭐
- Log imutável de todas as ações (quem, o quê, quando, antes/depois).

## 2.2 Requisitos Não-Funcionais (RNF)

- **RNF-01 · Performance:** busca de produto < 200ms; baixa registrada < 1s; dashboard carrega < 2s.
- **RNF-02 · Mobile-first:** o painel do operador funciona perfeitamente em telas pequenas; alvos de toque ≥ 44px.
- **RNF-03 · Offline:** o operador registra baixas sem internet; sincroniza ao reconectar (PWA).
- **RNF-04 · Localização:** `pt-BR` por padrão — moeda (R$, vírgula decimal), datas (dd/mm/aaaa), CNPJ/CEP formatados. Parsing tolerante a "42,00" e "14.47".
- **RNF-05 · Segurança:** senhas com hash forte, sessão com expiração, rate limiting, headers de segurança, validação de inputs.
- **RNF-06 · Multi-tenancy:** isolamento total de dados por organização.
- **RNF-07 · Acessibilidade:** WCAG AA — contraste, navegação por teclado, ARIA.
- **RNF-08 · Auditabilidade:** nenhum dado de movimentação pode ser apagado, apenas estornado.
- **RNF-09 · Escalabilidade:** suportar de 30 itens (a planilha atual) a dezenas de milhares.

## 2.3 Stack Técnica (decisão)

- **Frontend/Backend:** Next.js 14 (App Router) + TypeScript.
- **Estilo:** Tailwind CSS + design system próprio (dark mode padrão).
- **Banco:** PostgreSQL + Prisma ORM.
- **Auth:** NextAuth.js (Auth.js v5) com perfis e permissões.
- **Estado/Data:** Zustand + TanStack Query.
- **Validação:** Zod (compartilhado front/back).
- **Gráficos:** Recharts.
- **PWA/Offline:** next-pwa + IndexedDB (Dexie).
- **Importação Excel:** SheetJS (xlsx).
- **Testes:** Vitest + Playwright.

## 2.4 Princípios de Design de Interface

1. **Velocidade acima de tudo no operador** — a baixa é a ação mais frequente; otimize cada clique.
2. **Densidade controlada no admin** — muita informação, mas organizada e escaneável.
3. **Estados sempre visíveis** — loading, vazio, erro e sucesso desenhados explicitamente.
4. **Cores semânticas consistentes** — verde (entrada/ok), vermelho (saída/crítico), âmbar (alerta), azul (info).
5. **Feedback imediato** — toda ação confirma visualmente (e com som na baixa).

---

# 3. BLUEPRINT

## 3.1 Service Blueprint — Jornada "Dar baixa em um item"

```
ATOR / CAMADA           PASSO 1            PASSO 2              PASSO 3            PASSO 4
─────────────────────────────────────────────────────────────────────────────────────────
EVIDÊNCIA FÍSICA        Item na            Tela de busca        Modal de baixa     Card verde
                        prateleira         (campo + scanner)    (qtd, setor)       de sucesso
─────────────────────────────────────────────────────────────────────────────────────────
AÇÃO DO USUÁRIO         Pega o item        Escaneia/busca       Informa qtd e      Vê confirmação,
(Operador)              para usar          o produto            confirma           próxima baixa
─────────────────────────────────────────────────────────────────────────────────────────
FRONTSTAGE              —                  Autocomplete         Validação de       Toast + beep,
(o que o sistema        —                  instantâneo,         estoque, sugestão  foco volta à
mostra)                                    leitor de barras     de lote (FEFO)     busca
─────────────────────────────────────────────────────────────────────────────────────────
BACKSTAGE               Catálogo           Query de busca       Transaction:       Webhook +
(processos              sincronizado       indexada             baixa + saldo +    notificação se
internos)               (online/offline)                        audit log          atingiu mínimo
─────────────────────────────────────────────────────────────────────────────────────────
SUPORTE                 PostgreSQL /       Índices de busca     Prisma transaction Fila de webhooks,
(infra)                 IndexedDB cache    (nome, código,       + AuditLog         engine de alertas
                                           barras)
─────────────────────────────────────────────────────────────────────────────────────────
LINHA DE FALHA          Catálogo           Produto não          Estoque            Sync falha
(riscos)                desatualizado      encontrado           insuficiente       (offline)
                        → sincronizar      → cadastrar rápido   → bloquear + avisar → fila local
```

## 3.2 Service Blueprint — Jornada "Repor estoque" (evolução da coluna Compra)

```
1. Sistema detecta itens abaixo do ponto de reposição (engine de alertas, roda por cron)
2. Gera lista de sugestão de compra com quantidade na unidade de compra ("12 fardos")
3. Admin revisa, ajusta quantidades, escolhe fornecedor (vê histórico de preços)
4. Gera ordem de compra → envia ao fornecedor (PDF/e-mail) ou exporta lista
5. Mercadoria chega → admin/operador registra recebimento (confere item a item)
6. Recebimento dá entrada automática no estoque → saldos atualizados → alertas resolvidos
```

## 3.3 Technical Blueprint — Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTES                                   │
│   Web Admin (desktop)      PWA Operador (mobile + offline)        │
└───────────────┬───────────────────────────┬─────────────────────┘
                │                           │
                ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  NEXT.JS (App Router)                             │
│   ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐     │
│   │ UI / Páginas │  │ Route Handlers│  │ Middleware (auth,   │     │
│   │ (RSC + CSR)  │  │ /api/*        │  │ permissões, rate)   │     │
│   └─────────────┘  └──────┬───────┘  └─────────────────────┘     │
│                           │                                       │
│   ┌───────────────────────▼─────────────────────────────────┐    │
│   │           CAMADA DE SERVIÇO (lógica de negócio)          │    │
│   │  StockService · PurchaseService · RequestService ·       │    │
│   │  InventoryService · NotificationService ·                │    │
│   │  PersonalizationService · AuditService                   │    │
│   └───────────────────────┬─────────────────────────────────┘    │
└───────────────────────────┼──────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                    ▼
┌──────────────┐   ┌─────────────────┐   ┌──────────────────┐
│ PostgreSQL    │   │ Redis           │   │ Storage (S3/local)│
│ (Prisma ORM)  │   │ (cache, rate    │   │ fotos, fichas,    │
│ dados + audit │   │ limit, filas)   │   │ relatórios PDF    │
└──────────────┘   └─────────────────┘   └──────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│  INTEGRAÇÕES EXTERNAS                                              │
│  ReceitaWS (CNPJ) · ViaCEP · SMTP (e-mail) · Webhooks (saída) ·    │
│  Cron (verificação de alertas e ruptura) · API pública (entrada)  │
└──────────────────────────────────────────────────────────────────┘
```

## 3.4 Modelo de Dados (derivado da planilha)

```prisma
// Núcleo derivado diretamente da planilha
model Product {
  id              String   @id @default(cuid())
  codigoInterno   String?  // "Código" — opcional (há itens sem código na planilha)
  nome            String   // "Descrição dos Produtos"
  codigoBarras    String?
  categoryId      String
  // Embalagem composta — interpretação de "FD-10X1KG", "GL-5L", etc.
  tipoEmbalagem   String   // FARDO, GALAO, CAIXA, PACOTE, PAR, UNIDADE, ROLO...
  unidadeConsumo  String   // KG, L, UN, ML, M...
  fatorEmbalagem  Float    @default(1) // 1 fardo = 10 (kg) ; 1 galão = 5 (L)
  custoUnitario   Decimal? @db.Decimal(12,2) // "Vlr Unit"
  foto            String?
  fichaSeguranca  String?
  organizationId  String
  ativo           Boolean  @default(true)
  // relações: ProductWarehouse, StockMovement, etc.
}

model ProductWarehouse {
  productId       String
  warehouseId     String
  estoqueAtual    Float    // "Quantidade Estoque"
  estoqueMinimo   Float    // "Estoque Segurança"
  estoqueMaximo   Float?   // sugerido (novo)
  pontoReposicao  Float?   // sugerido (novo)
  localizacao     String?
  @@id([productId, warehouseId])
}

// "Compra 19/05" vira o módulo de sugestão de compra
model PurchaseSuggestion {
  id               String  @id @default(cuid())
  productId        String
  warehouseId      String
  estoqueAtual     Float
  pontoReposicao   Float
  quantidadeSugerida Float        // na unidade de compra
  unidadeCompra    String         // "Fardos", "Galões", "Unidades"
  consumoMedioDia  Float?
  status           String         // PENDENTE, NA_OC, IGNORADA
  geradoEm         DateTime @default(now())
}
```

> Os demais models (Category, StockMovement, Supplier, PurchaseOrder, MaterialRequest, InventoryCount, User, AuditLog, Notification, etc.) seguem o schema completo da Fase 1 do guia de construção. Este bloco mostra apenas o núcleo que mapeia 1:1 com a planilha.

## 3.5 Lógica de Conversão de Embalagem (regra de negócio crítica)

A planilha mistura unidade de compra e de consumo. A regra:

```
Exemplo: AGUA SANITARIA 5L TALGE — Embalagem "GL-5L"
  - tipoEmbalagem = GALAO
  - unidadeConsumo = L
  - fatorEmbalagem = 5

Compra: o fornecedor entrega em galões → entrada de "8 galões" soma 40 L (8 × 5) ao estoque,
        OU mantém-se o controle em galões (decisão por produto: campo "controlarPor").

Consumo: a baixa pode ser feita na unidade de consumo (ex: 2 L) ou na unidade de compra (1 galão).
         O sistema converte e atualiza o saldo coerentemente.
```

Cada produto define `controlarPor` = `EMBALAGEM` (controla em galões/fardos) ou `CONSUMO` (controla em L/kg). A planilha atual controla por embalagem — esse é o **padrão de migração**.

---

# 4. HIPERPERSONALIZAÇÃO

A camada que faz o AlmoxControl se adaptar a cada organização e a cada usuário, indo além de um CRUD genérico.

## 4.1 Personalização por Segmento (na ativação)

No onboarding, a organização escolhe seu segmento e o sistema se pré-configura:

| Segmento | Categorias pré-criadas | Unidades comuns | Campos extras ativados |
|----------|------------------------|-----------------|------------------------|
| **Limpeza & Copa** (caso da planilha) | Limpeza, Copa/Alimentos, Descartáveis, Higiene | Galão, Fardo, Pacote, Unidade, Litro, Kg | Validade (alimentos) |
| Construção Civil | Material Elétrico, Hidráulico, EPI, Ferramentas | Metro, Peça, Rolo, Saco | Localização em obra |
| Hospitalar | Medicamentos, Descartáveis, Instrumentos, EPI | Caixa, Frasco, Unidade | Lote + Validade obrigatórios |
| Industrial | Peças, Insumos, Lubrificantes, EPI | Peça, Litro, Kg | Lote, ficha de segurança |

> Como a planilha do Michel é de limpeza e copa, o template **"Limpeza & Copa"** já vem com a estrutura de embalagens (Galão 5L, Fardo 10x1kg, Caixa 12x1L, Pacote c/100) e com controle de validade ativado para itens de copa.

## 4.2 Personalização por Papel (Role-based UX)

O sistema mostra interfaces diferentes conforme o perfil — não apenas esconde botões, **reorganiza a experiência**:
- **Admin** abre no Dashboard com KPIs, alertas e sugestão de compra.
- **Operador** abre direto na tela de baixa rápida, com o campo de busca em foco.
- **Solicitante** abre na criação de solicitação e no acompanhamento dos seus pedidos.

## 4.3 Personalização por Comportamento (adaptativa)

O sistema aprende com o uso e se ajusta:
- **Itens favoritos do operador:** os produtos que cada operador mais movimenta sobem para o topo da busca e viram atalhos.
- **Setores frequentes:** o select de "setor solicitante" ordena pelos setores que o usuário mais usa.
- **Quantidades habituais:** ao dar baixa, sugere a quantidade média que aquele item costuma sair (ex: "geralmente 2 galões").
- **Horário de pico:** o dashboard destaca os horários/dias de maior movimentação para planejar reposição.
- **Dashboard configurável:** cada admin arrasta e fixa os widgets que importam para ele (valor em estoque, ruptura, curva ABC...).

## 4.4 Personalização Inteligente de Compra (o "pulo do gato")

Evolução direta da coluna "Compra 19/05" da planilha, agora automática e personalizada:
- **Consumo médio real:** calcula o consumo histórico de cada item (média móvel dos últimos 30/60/90 dias).
- **Previsão de ruptura:** estima em quantos dias o item zera com o consumo atual.
- **Quantidade sugerida personalizada:** considera estoque de segurança, lead time do fornecedor preferido e sazonalidade.
- **Lista de compra na unidade certa:** entrega "comprar 12 fardos de açúcar" — exatamente como o Michel já anotava na planilha, mas calculado.
- **Aprendizado de preço:** sinaliza quando um item está mais caro que o histórico, sugerindo cotação.

## 4.5 Alertas e Notificações Personalizados

- Cada usuário escolhe **o que** quer ser notificado e **por onde** (in-app, e-mail, push).
- O admin define **limiares personalizados** por categoria (ex: alimentos alertam com 15 dias de validade; limpeza, com 30 dias de estoque).
- "Resumo do dia" opcional por e-mail: o que entrou, o que saiu, o que precisa comprar.

## 4.6 Personalização Visual (white-label leve)

- Logo e cores da organização no painel.
- Modo claro/escuro por usuário.
- Densidade de tabela (compacta/confortável) por preferência.

## 4.7 Arquitetura da Hiperpersonalização

```
PersonalizationService
├── SegmentProfile      → template aplicado na ativação (categorias, unidades, campos)
├── UserPreferences     → tema, densidade, notificações, widgets do dashboard
├── BehaviorModel       → favoritos, quantidades habituais, setores frequentes
│                         (alimentado por eventos de movimentação)
├── ConsumptionEngine   → consumo médio, previsão de ruptura, quantidade sugerida
└── ThresholdRules      → limiares de alerta por categoria/produto/usuário
```

Tudo armazenado por `userId` e `organizationId`, calculado de forma incremental a cada movimentação (sem necessidade de ML pesado na v1 — começa com estatística e regras; pode evoluir para modelos preditivos depois).

---

# 5. Resumo — Funções da Planilha vs. Funções Sugeridas

## 5.1 Funções que JÁ existem na planilha (devem estar na v1) 📋
1. Cadastro de produto com código interno.
2. Descrição/nome do produto.
3. Controle de embalagem composta (fardo, galão, caixa, pacote, par...).
4. Quantidade em estoque (saldo atual).
5. Valor/custo unitário.
6. Estoque de segurança (mínimo).
7. Lista/sugestão de compra com quantidade e tipo de embalagem.
8. Valoração implícita do estoque (saldo × valor).
9. Tolerância a itens sem código (cadastro incompleto).
10. Mistura de categorias (limpeza + copa) → necessidade de categorização.

## 5.2 Funções SUGERIDAS (novas) ⭐
1. Código de barras + leitura por câmera/scanner.
2. Movimentações rastreáveis (entrada/saída/ajuste/transferência) com usuário e data.
3. Baixa rápida mobile com motivo, setor e quem retirou.
4. Importação de XML de NF-e.
5. Sugestão de compra automática por consumo + previsão de ruptura.
6. Ordens de compra e recebimento.
7. Fornecedores com histórico de preços e consulta de CNPJ.
8. Solicitações de material com workflow de aprovação.
9. Inventário cíclico/completo com acuracidade.
10. Controle de lote e validade (FEFO) — relevante para copa/alimentos.
11. Multi-almoxarifado com transferências e visão consolidada.
12. Relatórios (curva ABC, consumo por setor, previsão de ruptura, inventário valorizado).
13. Alertas e notificações configuráveis.
14. Usuários e permissões granulares.
15. Audit trail imutável.
16. API pública + webhooks.
17. PWA com modo offline e sincronização.
18. Importação da planilha existente (wizard de migração).
19. Hiperpersonalização (segmento, papel, comportamento, compra inteligente, visual).

---

# 6. Roadmap Sugerido (fases para o Claude Code)

| Fase | Entrega | Inclui |
|------|---------|--------|
| **MVP (v0.1)** | "Substituir a planilha" | Importar planilha, cadastro de produtos com embalagem, saldo, mínimo, baixa/entrada manual, dashboard básico, alerta de mínimo |
| **v0.2** | "Operação rápida" | Baixa mobile + código de barras, PWA offline, busca inteligente |
| **v0.3** | "Compra inteligente" | Sugestão de compra automática, fornecedores, ordens de compra, previsão de ruptura |
| **v0.4** | "Governança" | Solicitações, inventário, permissões, audit trail, relatórios |
| **v0.5** | "Escala" | Multi-almoxarifado, lote/validade, API/webhooks |
| **v1.0** | "Hiperpersonalização" | Templates por segmento, comportamento adaptativo, alertas personalizados, white-label leve |

> Para gerar o código de cada fase, use os 23 prompts do guia de construção (`almoxcontrol-guia-claude-code.md`) — este documento define **o quê e por quê**; aquele define **o passo a passo de como construir**.

---

## Instruções finais para o Claude Code

1. Trate este arquivo como `CLAUDE.md` na raiz do projeto.
2. Comece sempre pela **importação da planilha** e pelo **núcleo de produtos com embalagem composta** — é o que torna o sistema imediatamente útil para quem já usa a planilha.
3. A **regra de conversão de embalagem** (seção 3.5) é a parte mais sutil — implemente com testes unitários cobrindo fardo, galão, caixa, pacote e par.
4. Respeite o locale `pt-BR` em todo parsing de número e moeda.
5. A hiperpersonalização começa simples (regras + estatística). Não introduza ML pesado na v1.
