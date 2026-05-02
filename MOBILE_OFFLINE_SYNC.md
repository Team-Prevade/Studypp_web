# Mobile Offline-First API

Este documento descreve como a aplicacao mobile offline-first deve comunicar com o backend web do Study++.

## Objetivo

A app mobile pode funcionar localmente sem conta. Quando o utilizador tiver internet e quiser backup/sincronizacao, deve criar conta ou fazer login, receber tokens e enviar os dados locais para o servidor.

## Estado atual

Implementado:

- `POST /api/mobile/auth/register`
- `POST /api/mobile/auth/login`
- `POST /api/mobile/auth/check-email`
- `POST /api/mobile/auth/refresh`
- `POST /api/mobile/auth/logout`
- `GET /api/mobile/sync/status`
- `POST /api/mobile/sync/backup`

Ainda por implementar:

- `GET /api/mobile/sync/bootstrap`
- `POST /api/mobile/sync/push`
- `GET /api/mobile/sync/pull?since=...`
- `GET /api/mobile/sync/conflicts`
- `POST /api/mobile/sync/conflicts/resolve`
- `POST /api/mobile/uploads/presign`
- `POST /api/mobile/uploads/complete`

## Autenticacao

Os endpoints mobile usam tokens proprios assinados com `AUTH_SECRET`.

O cliente deve enviar o access token assim:

```http
Authorization: Bearer <accessToken>
```

Os access tokens sao curtos. Os refresh tokens servem para obter um novo par de tokens.

## Cadastro

`POST /api/mobile/auth/register`

Cria a conta no servidor para um utilizador que comecou local/offline.

Payload:

```json
{
  "deviceId": "device-uuid",
  "nome": "Erasmo Veloso",
  "email": "erasmo@example.com",
  "password": "senha-segura",
  "clientVersion": "1.0.0",
  "schemaVersion": 1
}
```

Resposta:

```json
{
  "success": true,
  "user": {
    "id": "server-user-id",
    "nome": "Erasmo Veloso",
    "email": "erasmo@example.com",
    "onboardingFeito": false
  },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900
  },
  "sync": {
    "serverTime": "2026-05-02T12:00:00.000Z",
    "requiresInitialBackup": true
  }
}
```

Depois do cadastro, a app mobile deve chamar `POST /api/mobile/sync/backup`.

## Login

`POST /api/mobile/auth/login`

Payload:

```json
{
  "deviceId": "device-uuid",
  "email": "erasmo@example.com",
  "password": "senha-segura"
}
```

Resposta:

```json
{
  "success": true,
  "user": {
    "id": "server-user-id",
    "nome": "Erasmo Veloso",
    "email": "erasmo@example.com",
    "onboardingFeito": true
  },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900
  },
  "sync": {
    "serverTime": "2026-05-02T12:00:00.000Z",
    "requiresInitialBackup": false
  }
}
```

## Verificar email

`POST /api/mobile/auth/check-email`

Payload:

```json
{
  "email": "erasmo@example.com"
}
```

Resposta:

```json
{
  "success": true,
  "exists": false
}
```

## Refresh

`POST /api/mobile/auth/refresh`

Payload:

```json
{
  "refreshToken": "..."
}
```

Resposta: novo par de tokens.

## Logout

`POST /api/mobile/auth/logout`

Na versao atual os tokens sao stateless. O mobile deve apagar `accessToken` e `refreshToken` localmente.

## Status

`GET /api/mobile/sync/status`

Requer `Authorization: Bearer <accessToken>`.

Resposta:

```json
{
  "success": true,
  "user": {
    "id": "server-user-id",
    "nome": "Erasmo Veloso",
    "email": "erasmo@example.com",
    "onboardingFeito": true
  },
  "sync": {
    "serverTime": "2026-05-02T12:00:00.000Z",
    "requiresInitialBackup": false,
    "schemaVersion": 1
  }
}
```

## Backup completo

`POST /api/mobile/sync/backup`

Requer `Authorization: Bearer <accessToken>`.

Este endpoint guarda um snapshot completo dos dados locais do mobile. Ele e idempotente por `backupId`: se o mesmo utilizador enviar o mesmo `backupId` outra vez, o servidor atualiza o snapshot existente em vez de criar duplicado.

Payload:

```json
{
  "deviceId": "device-uuid",
  "backupId": "backup-uuid",
  "clientVersion": "1.0.0",
  "schemaVersion": 1,
  "createdAt": "2026-05-02T12:00:00.000Z",
  "data": {
    "disciplinas": [],
    "aulas": [],
    "tarefas": [],
    "eventos": [],
    "avaliacoes": [],
    "notas": [],
    "apontamentos": [],
    "objectivos": [],
    "lembretes": [],
    "sessoesEstudo": [],
    "preferencias": {}
  }
}
```

Resposta:

```json
{
  "success": true,
  "backup": {
    "id": "server-backup-id",
    "backupId": "backup-uuid",
    "deviceId": "device-uuid",
    "clientVersion": "1.0.0",
    "schemaVersion": 1,
    "counts": {
      "disciplinas": 0,
      "aulas": 0,
      "tarefas": 0,
      "eventos": 0,
      "avaliacoes": 0,
      "notas": 0,
      "apontamentos": 0,
      "objectivos": 0,
      "lembretes": 0,
      "sessoesEstudo": 0
    },
    "idempotent": false,
    "receivedAt": "2026-05-02T12:00:00.000Z"
  },
  "sync": {
    "serverTime": "2026-05-02T12:00:00.000Z",
    "next": "bootstrap"
  }
}
```

Regras importantes:

- O mobile deve enviar IDs locais estaveis.
- Cada registo deve ter `localId`, `serverId` opcional, `clientCreatedAt`, `clientUpdatedAt` e `deletedAt` opcional.
- O servidor aceita backups ate 15 MB neste endpoint.
- Anexos grandes nao devem ir em JSON; devem usar endpoints de upload dedicados.
- Nesta fase o backup e guardado como snapshot bruto em `MobileBackup.payload`; ele ainda nao faz merge automatico para as tabelas de dominio.

## Proximo passo recomendado

Criar as restantes tabelas/rotas de sincronizacao fina quando o mobile precisar de merge incremental:

- `MobileDevice`
- `MobileSyncCursor`
- `MobileIdMap`
- opcional: `MobileDeletedRecord`

Estas estruturas permitem bootstrap, resolucao de conflitos e mapeamento entre IDs locais e IDs do servidor.
