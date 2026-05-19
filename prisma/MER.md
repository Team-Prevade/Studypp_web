# MER - Modelo Entidade-Relacionamento

Utilizador(id, nome, email, passwordHash, anoEscolar, curso, bio, avatarUrl, onboardingFeito, anoLectivoInicio, anoLectivoFim, primeiroDiaSemana, mostrarFimSemana, duracaoTarefaPadrao, modoAppearance, corAcento, createdAt, updatedAt)

Disciplina(id, utilizadorId, nome, cor, professor, sala, notas, ordem, ativo, createdAt, updatedAt)

Aula(id, utilizadorId, disciplinaId, diaSemana, horaInicio, horaFim, sala, professor, repetir, dataInicio, dataFim, cor, notas, createdAt, updatedAt)

Tarefa(id, utilizadorId, disciplinaId, titulo, descricao, prazo, prioridade, status, concluidaEm, progresso, createdAt, updatedAt)

Evento(id, utilizadorId, disciplinaId, titulo, tipo, dataInicio, dataFim, diaInteiro, notas, createdAt, updatedAt)

Avaliacao(id, utilizadorId, disciplinaId, nome, tipo, data, nota, peso, observacoes, createdAt, updatedAt)

Nota(id, utilizadorId, avaliacaoId, createdAt)

Apontamento(id, utilizadorId, disciplinaId, parentId, aulaId, tarefaId, titulo, conteudo, tipo, fixado, createdAt, updatedAt)

Objectivo(id, utilizadorId, titulo, descricao, categoria, prazo, status, concluidoEm, createdAt, updatedAt)

SubTarefaObjectivo(id, objectivoId, titulo, concluida, concluidaEm, ordem, createdAt)

SessaoEstudo(id, utilizadorId, disciplinaId, tipo, duracaoPrevista, duracaoReal, status, iniciadaEm, terminadaEm, notas)

Lembrete(id, utilizadorId, disciplinaId, titulo, dataHora, repetir, notas, concluido, concluidoEm, createdAt, updatedAt)

NotificacaoApp(id, utilizadorId, titulo, mensagem, tipo, lida, url, createdAt)

PreferenciaNotificacao(id, utilizadorId, notifTarefasAtivo, notifTarefasAntecedencia, notifTarefasAtrasadas, notifEstudoInicio, notifEstudoFimPausa, notifEstudoFimSessao, notifObjectivosAtivo, notifObjectivosDias, notifLembretesAtivo, browserNotif, emailNotif, emailNotifAddress, updatedAt)

MobileBackup(id, utilizadorId, deviceId, backupId, clientVersion, schemaVersion, clientCreatedAt, payload, counts, createdAt, updatedAt)
