# Product

## Register

product

## Users

Dois perfis distintos, cada um com sua própria tela:

- **Operador / almoxarife** — dá entrada e baixa de itens no dia a dia, muitas vezes de forma rápida e repetitiva, no balcão ou no depósito. Usa a tela simplificada `/baixa`. Nem sempre tem intimidade com tecnologia; precisa de rótulos claros, poucos passos e nenhum jargão.
- **Gestor / comprador** — acompanha custos, estoque mínimo, rupturas e relatórios para decidir compras. Uso mais analítico, no escritório, a partir do dashboard com sidebar.

O sistema é multi-tenant: cada organização vê apenas seus próprios dados (produtos, almoxarifados, movimentações).

## Product Purpose

O AlmoxControl é um sistema de gestão de almoxarifado (estoque interno) para pequenas e médias operações. Ele controla produtos, embalagens e fatores de conversão, movimentações de entrada/saída/ajuste, múltiplos almoxarifados, fornecedores e custos.

O sucesso é medido por **controle gerencial**: o gestor enxerga rupturas, itens abaixo do mínimo, custo total em estoque e tendências de consumo de relance — e o operador registra movimentações sem erro e sem fricção. Estoque errado custa dinheiro; o produto existe para que o número na tela seja sempre confiável e a decisão de compra seja óbvia.

## Brand Personality

**Simples, acessível, humano.** É uma ferramenta de trabalho, não uma vitrine. A voz é direta e em português claro do dia a dia — "Registrar Entrada", "Itens Críticos", "Abaixo do mínimo" — nunca jargão técnico ou de ERP. Clareza vence sofisticação sempre que houver conflito.

Emocionalmente, deve transmitir **segurança e calma**: o usuário confia no número, entende o estado do estoque num relance e nunca fica em dúvida sobre o que um botão faz. Densidade de informação é bem-vinda para o gestor, desde que continue legível.

## Anti-references

- **ERP legado (Totvs/SAP anos 2000):** cinza sobre cinza, telas densas e feias, menus infinitos, jargão. O oposto do que queremos.
- **"Dashboard genérico de IA":** card gigante com número + gradiente, repetido em grade idêntica, eyebrow em maiúsculas acima de cada seção. Sem personalidade.
- **Excesso de enfeite visual** que compete com o dado. Vidro/blur decorativo, animação gratuita, cor sem função — tudo isso atrapalha quem só quer saber quanto tem em estoque.

## Design Principles

1. **O número é o herói.** A informação de estoque (quantidade, custo, déficit) é o que importa — layout, cor e tipografia existem para deixá-la inequívoca, não para disputar atenção.
2. **Fale como gente, em português claro.** Rótulos, estados e mensagens de erro em linguagem que qualquer funcionário entende de primeira. Menos jargão, mais verbo direto.
3. **Estado sempre visível.** Crítico, abaixo do mínimo, ativo/inativo, entrada/saída/ajuste — cada estado tem leitura imediata por cor + texto (nunca só cor), para o público amplo e para daltônicos.
4. **Dois públicos, dois pesos.** O operador recebe uma tela enxuta e à prova de erro; o gestor recebe densidade e visão de conjunto. Não force um no molde do outro.
5. **Confiança por consistência.** Manter o sistema visual atual (dark OLED, azul primário, âmbar de alerta, Inter + Fira Code nos números) e refinar sobre ele — previsibilidade é o que gera confiança numa ferramenta de trabalho diária.

## Accessibility & Inclusion

- **Meta WCAG AA**, com atenção redobrada a contraste de texto (corpo ≥ 4.5:1) sobre o fundo escuro — inclusive placeholders e texto "muted".
- **Público amplo com pouca familiaridade tecnológica:** rótulos claros, hierarquia óbvia, alvos de clique confortáveis, o mínimo de passos por tarefa. Evitar depender de ícones sem texto.
- **Estado nunca só por cor:** sempre cor + rótulo/ícone (badges de tipo de movimentação, itens críticos), atendendo daltonismo.
- **Reduzir movimento** quando `prefers-reduced-motion` estiver ativo; nenhuma animação essencial à compreensão do dado.
