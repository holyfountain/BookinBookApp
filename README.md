# Guia de administração das reservas

Este guia explica como usar a aplicação de reservas do livro **O Palácio das Pedras Negras**, de Roberto Alves.

Página pública: [https://holyfountain.github.io/opalaciodaspedrasnegras/](https://holyfountain.github.io/opalaciodaspedrasnegras/)

## Visão geral

A aplicação permite:

- mostrar ao público quantos livros ainda estão disponíveis;
- receber reservas com nome, telefone e número de exemplares;
- gerir lotes de livros colocados à venda;
- acompanhar reservas, pagamentos e cancelamentos;
- exportar reservas para CSV;
- criar e gerir acessos de administradores.

Os dados pessoais dos leitores aparecem apenas na área de administração.

## Entrar como administrador

1. Abre a página pública.
2. Clica em **Administração** no topo da página.
3. Escreve o email e a palavra-passe de administração.
4. Clica em **Entrar**.

Depois de entrar, o painel mostra:

- total de exemplares colocados à venda;
- número de exemplares reservados;
- número de exemplares disponíveis;
- ferramentas para adicionar lotes e gerir administradores;
- tabela de reservas;
- lista de lotes para venda.

## Adicionar livros para venda

Os livros são adicionados por lotes.

1. Entra na área **Administração**.
2. Na secção **Adicionar lote para venda**, escreve o nome do lote.
3. Escreve o número de exemplares desse lote.
4. Clica em **Adicionar lote**.

Exemplo de nome de lote: `Lote de lançamento`.

O total de livros disponíveis na página pública é atualizado automaticamente.

## Apagar um lote

Na secção **Lotes para venda**, cada lote tem o botão **Apagar**.

Ao apagar um lote:

1. A aplicação pede confirmação.
2. O total de exemplares é reduzido pelo número de exemplares do lote.
3. O lote desaparece da lista.

Se existirem reservas ativas que dependam desse stock, a aplicação impede a eliminação. Nesse caso, cancela primeiro as reservas necessárias ou mantém o lote ativo.

## Ler a tabela de reservas

Na secção **Reservas**, cada linha mostra:

- **Nome**: nome do leitor;
- **Telefone**: contacto usado na reserva;
- **Exemplares**: quantidade reservada;
- **Data**: data e hora da reserva;
- **Estado**: `ativa` ou `cancelada`;
- **Pagamento**: `paga` ou `não paga`;
- **Ação**: botões para cancelar/repor e alterar pagamento.

As etiquetas de estado e pagamento são destacadas por cor para facilitar a leitura.

## Confirmar pagamentos

Quando receberes o pagamento de uma reserva:

1. Entra em **Administração**.
2. Na tabela **Reservas**, encontra a linha da pessoa.
3. Clica em **Pago**.

A etiqueta de pagamento passa para `paga` e o botão muda para **Não Pago**.

Se precisares corrigir um erro, clica em **Não Pago** para voltar a marcar a reserva como não paga.

## Cancelar ou repor reservas

Usa estes botões na coluna **Ação**:

- **Cancelar**: cancela uma reserva ativa e devolve os exemplares ao stock disponível.
- **Repor**: reativa uma reserva cancelada, se ainda houver stock suficiente.

Usa **Cancelar** quando uma pessoa desistir, quando a reserva for duplicada por engano ou quando a encomenda já não deve contar para o stock.

## Reservas duplicadas pelo telefone

A aplicação usa o número de telefone para evitar reservas duplicadas.

Se um leitor fizer uma nova reserva com um telefone que já tem uma reserva ativa e não paga, a página pergunta se deve acrescentar os novos exemplares à reserva existente.

Se a reserva anterior estiver marcada como paga, uma nova reserva com o mesmo telefone cria uma encomenda separada.

## Notificações por email

Sempre que uma reserva é criada ou atualizada por telefone duplicado, a aplicação envia uma notificação por email ao endereço configurado na aplicação.

As notificações são enviadas através de um serviço de email externo. A reserva continua guardada mesmo que o envio do email falhe temporariamente.

Importante: criar um novo administrador não altera o destinatário das notificações. As notificações continuam a ser enviadas para o endereço configurado na aplicação.

## Exportar reservas

Para guardar uma cópia das reservas:

1. Entra em **Administração**.
2. Vai à secção **Reservas**.
3. Clica em **Exportar CSV**.

O ficheiro pode ser aberto em Excel, Google Sheets ou outra folha de cálculo.

## Gerir administradores

Na secção **Administradores**, existem duas áreas.

### O meu acesso

Usa esta área para alterar o acesso do administrador atualmente autenticado.

Podes alterar:

- o email atual;
- a palavra-passe, preenchendo o campo **Nova palavra-passe**.

Se não quiseres mudar a palavra-passe, deixa esse campo vazio.

Depois de alterar credenciais, guarda a nova informação num local seguro. Em alguns casos, pode ser necessário terminar sessão e voltar a entrar antes de tentar alterar email ou palavra-passe.

### Novo administrador

Usa esta área para criar outro acesso de administração.

1. Escreve o email do novo administrador.
2. Define uma palavra-passe inicial com pelo menos 6 caracteres.
3. Clica em **Adicionar Administrador**.

Depois de criado, o novo administrador pode entrar pela mesma opção **Administração** da página pública.

## Sair da administração

Quando terminares, clica em **Terminar sessão**.

Faz isto sempre que estiveres num computador partilhado.

## Rotina recomendada

Antes de divulgar o link:

1. Entra em **Administração**.
2. Confirma que existe pelo menos um lote ativo com exemplares disponíveis.
3. Confirma que o contador público mostra os livros disponíveis.
4. Faz uma reserva de teste, confirma se aparece na tabela e cancela-a de seguida.

Durante a venda:

1. Verifica regularmente novas reservas.
2. Marca como **Pago** quando receberes o pagamento.
3. Cancela reservas inválidas ou desistências.
4. Exporta CSV quando precisares de uma cópia de trabalho.

## Regras importantes

- Não partilhes palavras-passe de administração com leitores.
- Cria um acesso separado para cada administrador.
- Não publiques capturas de ecrã com nomes ou telefones de leitores.
- Mantém o link público apenas para reservas; a gestão deve ser feita só por admins.
- Se o stock chegar a zero, a página continua visível, mas novas reservas ficam bloqueadas.

## Problemas comuns

### O botão Reservar está desativado

Normalmente significa que não há exemplares disponíveis. Entra em **Administração** e adiciona um novo lote.

### Não consigo entrar na administração

Confirma se estás a usar o email e a palavra-passe corretos. Se o problema continuar, pede ao responsável técnico da aplicação para confirmar se o teu acesso de administração existe.

### Não consigo adicionar um administrador

Confirma que estás autenticado como administrador e que a palavra-passe inicial tem pelo menos 6 caracteres. Se o problema continuar, pede ao responsável técnico da aplicação para verificar as permissões da base de dados.

### Não consigo apagar um lote

Se houver reservas ativas que dependam desse stock, a aplicação bloqueia a eliminação. Cancela primeiro as reservas necessárias ou mantém o lote.

### Uma reserva não aparece

Confirma que estás na área **Administração**. As reservas não aparecem na página pública por motivos de privacidade.

### Não recebi email de notificação

Confirma se a reserva aparece na tabela. Se aparecer, a reserva foi guardada. O envio de email pode falhar por configuração do serviço de email, limites do serviço ou endereço de destino incorreto.
