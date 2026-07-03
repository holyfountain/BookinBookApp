# Reservas de O Palácio das Pedras Negras

Aplicação estática para GitHub Pages que usa Firebase Authentication e Firebase Realtime Database para gerir reservas de exemplares físicos do livro `O Palácio das Pedras Negras`, de Roberto Alves.

## O que já está configurado na app

O ficheiro `config.js` já tem o URL da tua Realtime Database:

```txt
https://bookreservationapp-4b327-default-rtdb.europe-west1.firebasedatabase.app
```

Falta apenas preencher os restantes dados da Web App Firebase.

## Setup Firebase simples

### 1. Criar uma Web App no Firebase

No Firebase Console, dentro do projeto que já criaste:

1. Vai a `Project settings`.
2. Em `Your apps`, clica no ícone Web `</>`.
3. Dá um nome, por exemplo `BookReservationApp`.
4. Não precisas ativar Firebase Hosting.
5. Copia o objeto `firebaseConfig`.

Depois preenche `config.js`:

```js
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "https://bookreservationapp-4b327-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### 2. Ativar login do admin

1. Vai a `Authentication`.
2. Clica `Get started`.
3. Em `Sign-in method`, ativa `Email/Password`.
4. Em `Users`, cria o utilizador admin com email e palavra-passe.
5. Copia o `User UID` desse utilizador.

### 3. Criar o admin na Realtime Database

Vai a `Realtime Database > Data` e cria:

```json
{
  "admins": {
    "COLOCA_AQUI_O_UID_DO_ADMIN": true
  },
  "settings": {
    "inventory": {
      "totalCopies": 0,
      "reservedCopies": 0
    }
  }
}
```

Substitui `COLOCA_AQUI_O_UID_DO_ADMIN` pelo UID real do utilizador admin.

### 4. Publicar as regras da Realtime Database

Vai a `Realtime Database > Rules` e cola o conteúdo de `database.rules.json`.

Depois clica `Publish`.

## Teste local

Serve esta pasta:

```powershell
python -m http.server 8080
```

Abre:

```txt
http://localhost:8080
```

Fluxo de teste:

1. Entra em `Administração`.
2. Faz login com o email/password criados no Firebase Auth.
3. Adiciona um lote, por exemplo `20` exemplares.
4. Fecha a administração.
5. Faz uma reserva como visitante.
6. Volta à administração e confirma que a reserva aparece na tabela.

## Estrutura de dados

- `admins/{uid}`: utilizadores autorizados a entrar na administração.
- `settings/inventory`: total de exemplares e exemplares reservados.
- `batches/{id}`: lotes adicionados pelo admin.
- `reservations/{id}`: reservas feitas pelos visitantes.

## Publicação em GitHub Pages

Antes de publicar, vai a `Authentication > Settings > Authorized domains` e adiciona o domínio do GitHub Pages, por exemplo:

```txt
holyfountain.github.io
```

Depois podes publicar estes ficheiros num repositório GitHub Pages.
