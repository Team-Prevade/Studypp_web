// Utilidades gerais
// TODO: Adicionar funções utilitárias

export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ");
};
