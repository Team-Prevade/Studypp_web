// Configuração da SDK de IA
// TODO: Configurar provider (OpenAI, Anthropic, etc.) e modelo

export const aiProvider = process.env.AI_PROVIDER || 'openai';
export const aiModel = process.env.AI_MODEL || 'gpt-4-turbo';
