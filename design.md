# Study++ — Sistema de Estudo Organizado

## North Star: "Clareza que cria ritmo"
Study++ deve sentir-se como um espaço académico calmo, organizado e motivador. A interface ajuda o estudante a perceber rapidamente o que fazer hoje, onde está atrasado, como está a evoluir e qual é o próximo passo. Cada ecrã deve reduzir ansiedade: informação clara, acções óbvias, progresso visível.

## Personalidade
- **Académica, mas leve:** linguagem simples, directa e encorajadora; nunca burocrática.
- **Produtiva:** priorizar tarefas, prazos, aulas, notas, objectivos e sessões de estudo acima de decoração.
- **Confiável:** estados, datas, contagens e métricas devem ser fáceis de verificar num olhar.
- **Pessoal:** usar saudações, nomes, disciplinas e progresso do aluno para dar sensação de acompanhamento.

## Cores
- **Brand Ink (`#101235` / `#17134a`):** base escura premium da marca; sidebar, auth hero, menus flutuantes e superfícies institucionais.
- **Brand Violet (`#7c2cff`):** início do gradiente do logotipo; foco de marca, estados activos especiais e destaques de IA.
- **Brand Blue (`#246bff`):** acções principais, links, foco de inputs, navegação activa e botões primários.
- **Brand Sky (`#18a7ff`):** final do gradiente do logotipo; detalhes de brilho, progresso, hover e micro-accentos.
- **Soft Brand Background (`#eef4ff`):** fundo de inputs, painéis subtis e destaques leves ligados à marca.
- **Surface (`#ffffff`):** cartões, formulários, modais, listas e áreas de calendário.
- **Text Strong (`#111827` / `gray-900`):** títulos, números, nomes de disciplinas e conteúdo principal.
- **Text Muted (`#4b5563` / `gray-600`):** descrições, datas, labels secundárias e microcopy.
- **Border (`#e5e7eb` / `gray-200`):** separação entre secções, listas, calendário e formulários.
- **Teal (`#0d9488`, `#0f766e`):** foco, tempo de estudo, progresso positivo e acções secundárias importantes.
- **Purple (`#7c3aed`, `#8b5cf6`):** testes, tarefas em calendário, tendência de notas e destaques analíticos.
- **Orange (`#f97316`, `#ea580c`):** hábitos, esforço, streaks e métricas de energia.
- **Green (`#16a34a`, `#10b981`):** concluído, sucesso, metas completas.
- **Red (`#dc2626`, `#ef4444`):** erros, prazos críticos, avaliações e acções destrutivas.
- **Yellow (`#ca8a04`, `#fef3c7`):** pendências e avisos moderados.
- Usar cor com significado. Evitar variações decorativas que não comuniquem estado, categoria ou hierarquia.

## Tipografia
- **Fonte:** manter `Arial, Helvetica, sans-serif` enquanto o projecto não adoptar uma família própria.
- **Escala base:** corpo em 14-16px; labels em 12-14px; títulos de cartão em 18-20px; títulos de página em 30-40px.
- **Peso:** usar `font-medium` para labels e botões, `font-semibold` para subtítulos, `font-bold` para títulos e métricas.
- **Números:** métricas importantes usam 24-40px, peso forte, com label pequeno acima ou abaixo.
- **Tom textual:** preferir português claro e accionável: "Nova tarefa", "Guardar sessão", "Próximos prazos". Evitar misturar inglês quando houver equivalente natural em português.

## Layout
- **Shell autenticado:** sidebar fixa de 224px à esquerda (`w-56`), conteúdo com `ml-56`.
- **Páginas internas:** fundo azul muito claro, `min-h-screen`, padding de 32px (`p-8`) em desktop.
- **Header de página:** título forte, descrição curta e acção principal alinhada à direita quando existir.
- **Grid:** usar 1 coluna em mobile, 2 colunas em tablet, 3-4 colunas em desktop conforme densidade.
- **Espaçamento:** seguir ritmo de 8px (`gap-2`, `gap-4`, `gap-6`, `gap-8`, `mb-8`, `p-6`).
- **Densidade:** dashboards e ferramentas devem ser compactos o suficiente para trabalho diário, sem aparência de landing page.

## Elevação e Superfícies
- **Cartões padrão:** fundo branco, `rounded-lg` ou `rounded-xl`, padding 16-24px, sombra suave (`shadow`, `shadow-md` ou `shadow-sm`).
- **Cartões analíticos:** podem usar `rounded-2xl` quando abrigam gráficos, temporizador ou blocos de estatísticas grandes.
- **Separação:** preferir bordas `gray-200`, divisórias e fundos `gray-50` dentro de cartões.
- **Sombras:** usar para agrupar, não para dramatizar. Hover pode subir de `shadow` para `shadow-md`.
- **Bordas coloridas:** usar `border-l-4` para métricas, disciplinas, objectivos e listas com categoria.

## Componentes
- **Botão primário:** gradiente Brand Violet → Brand Blue → Brand Sky, texto branco, `rounded-lg`, 40-48px de altura, ícone à esquerda quando a acção cria/adiciona.
- **Botão secundário:** branco ou `gray-50`, borda `gray-300`, texto `gray-700`, hover suave.
- **Botão destrutivo:** ícone discreto em cinzento por padrão; hover vermelho com fundo vermelho claro.
- **Icon buttons:** usar lucide-react; tamanho comum 16-24px; sempre com área clicável confortável.
- **Inputs:** `rounded-lg`, padding horizontal 12-16px, fundo `#eef4ff` em auth/settings ou branco em formulários internos, foco com ring violeta suave e borda Brand Blue.
- **Tabs e filtros:** controlos segmentados com estado activo sólido ou cartão branco com sombra leve.
- **Badges:** `rounded-full`, texto 12px, cores semânticas. Usar para prioridade, status, categoria, prazo e contagem.
- **Cards de métrica:** label pequeno, número grande, ícone no canto, acento colorido à esquerda.
- **Listas:** linhas brancas ou `gray-50`, borda suave, item clicável com hover discreto.
- **Calendário:** grelha com bordas claras, dia actual em azul, eventos com cor cheia e texto branco.
- **Modais:** overlay `black/50`, painel branco centralizado, título forte, borda inferior no cabeçalho.
- **Estados vazios:** cartão branco com padding amplo, ícone opcional em cinzento, uma frase curta e útil.

## Navegação
- A sidebar é a âncora visual do produto: gradiente escuro Brand Ink com luz violeta/azul, texto branco, item activo em branco com texto Brand Ink.
- Os itens devem usar ícone + label, alinhamento consistente e hover `white/10`.
- Na sidebar, usar apenas o símbolo oficial em `public/brand/logo-mark.svg`, sem texto, como assinatura visual compacta.
- Em telas de autenticação/onboarding, o texto Study++ pode acompanhar o símbolo quando houver espaço.
- Logout fica no fim da sidebar e deve parecer uma acção secundária, não competir com navegação.

## Dados e Visualização
- Mostrar primeiro a resposta operacional: o que existe hoje, o que está pendente, o que mudou.
- Gráficos devem ser simples: barras, linhas, anéis de progresso, heatmaps e barras horizontais.
- Usar cores por domínio: teal para estudo/foco, purple para notas/testes, orange para energia/hábitos, green para concluído, red para risco.
- Sempre acompanhar números com labels e contexto temporal: "Esta semana", "Hoje", "vs ant.", "últimos 30 dias".
- Evitar gráficos decorativos sem dados reais ou sem legenda contextual.

## Conteúdo e Microcopy
- Falar com o estudante de forma directa: "Bom dia", "Próximos prazos", "Sem aulas agendadas para hoje".
- Mensagens de erro devem explicar o problema e manter o tom calmo.
- CTAs começam por verbo: "Nova tarefa", "Guardar disciplina", "Criar objectivo", "Iniciar sessão".
- Evitar textos longos dentro de cartões; a interface deve ser escaneável.
- Manter consistência PT: preferir "objectivos", "definições", "palavra-passe", "sessão", "concluído".

## Acessibilidade
- Garantir contraste WCAG AA em texto normal, especialmente em badges e botões coloridos.
- Não depender apenas da cor: combinar ícone, label ou posição para indicar estado.
- Áreas clicáveis devem ter pelo menos 40px de altura; 44-48px quando possível.
- Estados `disabled`, `loading`, `hover`, `focus` e `active` devem ser visíveis.
- Inputs precisam de `label` real; placeholders não substituem labels.

## Regras Para Novos Agentes
- Preservar o sistema visual existente antes de introduzir novas abstrações.
- Usar Tailwind conforme o projecto já faz; evitar CSS global novo salvo quando for token/base compartilhada.
- Usar `lucide-react` para ícones funcionais.
- Não criar landing pages para áreas autenticadas; construir a ferramenta ou fluxo real.
- Não introduzir elementos puramente decorativos, gradientes exagerados ou ilustrações sem função.
- Manter cartões brancos sobre fundos azul/índigo claros para ecrãs de trabalho.
- Usar cores semânticas de forma estável para que tarefas, testes, hábitos e progresso sejam reconhecíveis.
- Antes de alterar padrões de layout, verificar telas próximas: dashboard, tarefas, notas, disciplinas, estatísticas e temporizador.
