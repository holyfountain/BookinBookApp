# Instruções para administração das reservas

Este guia explica como usar a versão online da página de reservas do livro **O Palácio das Pedras Negras**, de Roberto Alves.

## Link da página online

A página pública de reservas fica em:

```txt
https://holyfountain.github.io/BookinBookApp/
```

Este é o link que pode ser enviado aos leitores para reservarem exemplares.

## O que os leitores podem fazer

Na página pública, cada leitor pode:

1. Ver quantos exemplares ainda estão disponíveis.
2. Ler a informação sobre o livro e o autor.
3. Preencher uma reserva com:
   - nome completo;
   - número de telefone;
   - número de exemplares.

Quando não houver exemplares disponíveis, o botão de reserva fica desativado.

## Entrar na administração

1. Abre a página online.
2. Clica em **Administração** no topo da página.
3. Introduz o email e a palavra-passe de administração.
4. Clica em **Entrar**.

A área de administração mostra:

- total de exemplares colocados à venda;
- número de exemplares reservados;
- número de exemplares ainda disponíveis;
- lista de reservas;
- lista de lotes para venda.

## Adicionar exemplares para venda

Os exemplares são adicionados por lotes.

1. Entra em **Administração**.
2. Na secção **Adicionar lote para venda**, escreve o nome do lote.
   - Exemplo: `Lote de lançamento`.
3. Escreve o número de exemplares desse lote.
4. Clica em **Adicionar lote**.

Depois de adicionar o lote, o número de livros disponíveis na página pública é atualizado automaticamente.

## Apagar um lote

Na secção **Lotes para venda**, cada lote tem o seu próprio botão **Apagar**.

Ao apagar um lote:

1. A aplicação pede confirmação.
2. O total de exemplares é reduzido pelo número de exemplares desse lote.
3. O lote desaparece da lista.

Se existirem reservas ativas que dependam desses exemplares, a aplicação impede a eliminação do lote.

## Ver reservas

Na secção **Reservas**, o admin consegue ver:

- nome do leitor;
- telefone;
- número de exemplares reservados;
- data da reserva;
- estado da reserva.

Os dados pessoais dos leitores só aparecem na área de administração. Não são públicos.

## Cancelar ou repor uma reserva

Cada reserva tem um botão de ação:

- **Cancelar**: cancela uma reserva ativa e devolve os exemplares ao stock disponível.
- **Repor**: volta a ativar uma reserva cancelada, se houver stock suficiente.

Usa **Cancelar** quando uma pessoa desistir da reserva ou quando a reserva já não deve contar para o stock.

## Exportar reservas para CSV

Para guardar uma cópia das reservas:

1. Entra em **Administração**.
2. Vai à secção **Reservas**.
3. Clica em **Exportar CSV**.

O ficheiro descarregado pode ser aberto em Excel, Google Sheets ou outra folha de cálculo.

## Alterar o acesso de administração

Na secção **Alterar acesso de administração**, podes atualizar:

- o email de administração;
- a palavra-passe de administração.

Depois de alterar credenciais, guarda a nova informação num local seguro.

## Sair da administração

Quando terminares, clica em **Terminar sessão**.

Isto é especialmente importante se estiveres a usar um computador partilhado.

## Regras importantes

- Não partilhes a palavra-passe de administração com leitores.
- Não publiques capturas de ecrã com nomes ou telefones de leitores.
- Antes de divulgar o link, confirma que existe pelo menos um lote ativo com exemplares disponíveis.
- Se o stock chegar a zero, a página continua visível, mas novas reservas ficam bloqueadas.

## Problemas comuns

### O botão de reserva está desativado

Isto acontece quando não há exemplares disponíveis. Entra na administração e adiciona um novo lote.

### Não consigo entrar na administração

Confirma se estás a usar o email e a palavra-passe corretos. Se o problema continuar, pode ser necessário verificar o utilizador no Firebase Authentication.

### Apagar lote não funciona

Se houver reservas ativas associadas ao stock atual, primeiro cancela as reservas necessárias. Depois tenta apagar o lote novamente.

### As reservas não aparecem

Confirma que estás dentro da área de administração. As reservas não aparecem na página pública por motivos de privacidade.
