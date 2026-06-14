# Mapa de botoes e navegacao

## Navegacao principal

Os itens principais do aplicativo ficam centralizados em `components/navigation/navItems.ts`:

- Dashboard: `/dashboard`
- Alunos: `/alunos`
- Treinos: `/treinos`
- Exercicios: `/exercicios`
- Agenda: `/agenda`
- Acompanhamento: `/acompanhamento`
- Configuracoes: `/configuracoes`
- Perfil: `/perfil`

No desktop, todos aparecem na sidebar fixa. No mobile, todos aparecem no novo menu lateral recolhivel aberto pelo botao de menu no topo. A barra inferior continua com os atalhos principais e o painel "Mais".

## Correcoes feitas

- Botao de menu mobile: abre uma sidebar lateral com todas as paginas do desktop.
- Botao de fechar menu mobile: fecha a sidebar pelo X ou pelo fundo escuro.
- Links do menu mobile: fecham a sidebar apos navegar.
- Seta de voltar: aparece no topo esquerdo em subpaginas no mobile e segue existindo no desktop.
- Botao de perfil no topo mobile: leva para `/perfil`.
- Botao "Hoje" no Dashboard: deixou de ser um botao sem acao e agora leva para `/agenda`.
- Link "Suporte" da sidebar: deixou de apontar para `#` e agora leva para `/configuracoes`.
- CTA "Novo Aluno" da sidebar: deixou de usar botao dentro de link e virou um link estilizado.
- Botao "Editar" em detalhes de exercicio: agora tem a rota real `/exercicios/[id]/editar`.

## Botoes principais revisados

- Login: envia credenciais via NextAuth e redireciona para `/dashboard`.
- Cadastro: registra usuario e redireciona para `/login` ou `/dashboard`.
- Alunos: novo aluno, abas de filtro, abrir aluno.
- Aluno detalhe: editar, excluir, nova avaliacao, upload/excluir foto, criar treino manual/IA, mensagem de acompanhamento.
- Exercicios: novo exercicio, filtro por grupo muscular, abrir exercicio, editar customizado, excluir customizado.
- Novo/editar exercicio: adicionar/remover passos, cancelar, salvar.
- Treinos: filtro por status, criar via aluno, abrir treino.
- Editor de treino: voltar, salvar, aprovar, expandir notas, adicionar/remover sessoes, mover/remover exercicios, gerar com IA, copiar para MFIT.
- Agenda: conectar Google, novo evento, cancelar/salvar evento, editar/excluir evento, navegar calendario, sincronizar, alternar visualizacao.
- Acompanhamento: abrir modal, gerar mensagem, cancelar, registrar manual, enviar e-mail.
- Configuracoes: alternar abas, testar SMTP, alternar follow-up automatico, salvar.
- Perfil: alternar especialidades, salvar perfil.

## Validacao

- `npx tsc --noEmit`: passou.
- `npm run build` com variaveis placeholder de ambiente: passou e gerou a rota `/exercicios/[id]/editar`.
- `npm run lint`: ainda falha por dividas preexistentes no projeto, principalmente `no-explicit-any`, hooks e variaveis nao usadas em arquivos fora do escopo desta correcao.
- Teste visual local: a tela publica de login renderizou. Telas autenticadas precisam das variaveis reais do Supabase/Auth para teste completo com dados.
