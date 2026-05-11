# MER (Modelo Entidade-Relacionamento)

Documento gerado a partir de `prisma/schema.prisma`.
Inclui um diagrama Mermaid ER e uma lista de entidades principais com campos relevantes.

## Diagrama (Mermaid ER)

```mermaid
erDiagram
  UTILIZADOR {
    String id PK
    String nome
    String email UNIQUE
    String passwordHash
    DateTime createdAt
    DateTime updatedAt
  }

  DISCIPLINA {
    String id PK
    String utilizadorId FK
    String nome
    String cor
    Boolean ativo
    DateTime createdAt
    DateTime updatedAt
  }

  AULA {
    String id PK
    String utilizadorId FK
    String disciplinaId FK
    DiaSemana diaSemana
    String horaInicio
    String horaFim
  }

  TAREFA {
    String id PK
    String utilizadorId FK
    String disciplinaId FK
    String titulo
    DateTime prazo
    PrioridadeTarefa prioridade
    StatusTarefa status
  }

  EVENTO {
    String id PK
    String utilizadorId FK
    String disciplinaId FK
    String titulo
    TipoEvento tipo
    DateTime dataInicio
  }

  AVALIACAO {
    String id PK
    String utilizadorId FK
    String disciplinaId FK
    String nome
    TipoAvaliacao tipo
    DateTime data
  }

  NOTA {
    String id PK
    String utilizadorId FK
    String avaliacaoId FK
  }

  APONTAMENTO {
    String id PK
    String utilizadorId FK
    String disciplinaId FK
    String parentId FK
    String aulaId FK
    String tarefaId FK
  }

  OBJECTIVO {
    String id PK
    String utilizadorId FK
    String titulo
    CategoriaObjectivo categoria
    StatusObjectivo status
  }

  SESSAO_ESTUDO {
    String id PK
    String utilizadorId FK
    String disciplinaId FK
    TipoSessaoEstudo tipo
    Int duracaoPrevista
    StatusSessaoEstudo status
  }

  LEMBRETE {
    String id PK
    String utilizadorId FK
    String disciplinaId FK
    String titulo
    DateTime dataHora
    RepetirLembrete repetir
  }

  NOTIFICACAO_APP {
    String id PK
    String utilizadorId FK
    String titulo
  }

  PREFERENCIA_NOTIFICACAO {
    String id PK
    String utilizadorId UNIQUE FK
  }

  MOBILE_BACKUP {
    String id PK
    String utilizadorId FK
    String deviceId
    String backupId
  }

  // Relacionamentos
  UTILIZADOR ||--o{ DISCIPLINA : possui
  UTILIZADOR ||--o{ AULA : possui
  DISCIPLINA ||--o{ AULA : contem

  UTILIZADOR ||--o{ TAREFA : possui
  DISCIPLINA ||--o{ TAREFA : contem
  TAREFA }o--|| DISCIPLINA : pertence_a

  UTILIZADOR ||--o{ EVENTO : possui
  DISCIPLINA ||--o{ EVENTO : relacionado_com

  DISCIPLINA ||--o{ AVALIACAO : tem
  AVALIACAO ||--o{ NOTA : tem
  UTILIZADOR ||--o{ NOTA : possui

  UTILIZADOR ||--o{ APONTAMENTO : possui
  APONTAMENTO }o--|| APONTAMENTO : parent
  AULA ||--o{ APONTAMENTO : contem
  TAREFA ||--o{ APONTAMENTO : contem

  UTILIZADOR ||--o{ OBJECTIVO : possui
  OBJECTIVO ||--o{ SubTarefaObjectivo : tem

  UTILIZADOR ||--o{ SESSAO_ESTUDO : possui
  DISCIPLINA ||--o{ SESSAO_ESTUDO : relacionada

  UTILIZADOR ||--o{ LEMBRETE : possui
  UTILIZADOR ||--o{ NOTIFICACAO_APP : possui

  UTILIZADOR ||--o{ PREFERENCIA_NOTIFICACAO : possui
  UTILIZADOR ||--o{ MOBILE_BACKUP : possui
```

## Entidades principais (resumo)

- **Utilizador**: utilizadores da aplicação; PK `id`; possui relacionamentos 1:N com quase todas as outras entidades (disciplinas, aulas, tarefas, eventos, notas, apontamentos, objectivos, sessoesEstudo, lembretes, notificacoes, mobileBackups, etc.).

- **Disciplina**: pertence a `Utilizador` (`utilizadorId` FK); tem `Aula[]`, `Tarefa[]`, `Avaliacao[]`, `Apontamento[]`, `SessaoEstudo[]`, `Evento[]`.

- **Aula**: pertence a `Disciplina` e a `Utilizador`; representa recorrência no calendário (`diaSemana`, `horaInicio`, `horaFim`).

- **Tarefa**: pode pertencer a `Disciplina` (opcional); tem estado, prioridade, prazo e apontamentos relacionados.

- **Evento**: eventos calendario, pode estar ligado a `Disciplina` e a `Utilizador`.

- **Avaliacao / Nota**: `Avaliacao` pertence a `Disciplina`; `Nota` relaciona `Avaliacao` com `Utilizador` (uma nota por avaliação).

- **Apontamento**: notas/rich-text; hierárquicos (parent/subNotas) e relacionáveis com `Aula` ou `Tarefa`.

- **Objectivo / SubTarefaObjectivo**: objetivos do utilizador com subtasks.

- **SessaoEstudo**: sessões de pomodoro; liga a `Utilizador` e opcionalmente a `Disciplina`.

- **Lembrete**: lembretes com repetição e horário.

- **NotificacaoApp / PreferenciaNotificacao / MobileBackup**: notificações e configurações por utilizador; backups do mobile.

## Enums

O schema define vários enums importantes (exemplos):

- `TipoAvaliacao` — TESTE, TRABALHO, ORAL, PARTICIPACAO, PROJECTO
- `TipoEvento` — TESTE_EXAME, ENTREGA_TRABALHO, EVENTO_PESSOAL, FERIADO
- `PrioridadeTarefa` — ALTA, MEDIA, BAIXA
- `StatusTarefa` — PENDENTE, CONCLUIDA, ATRASADA
- `TipoSessaoEstudo`, `StatusSessaoEstudo`, `RepetirLembrete`, `CategoriaObjectivo`, `StatusObjectivo`, `DiaSemana`, `RepetirAula`

## Observações

- Chaves estrangeiras com `onDelete: Cascade` ou `SetNull` estão definidas no schema (mantive apenas uma referência textual neste documento).
- O diagrama Mermaid é um resumo visual; para detalhes completos consulte `prisma/schema.prisma`.

---

_Gerado automaticamente a partir do schema Prisma._
