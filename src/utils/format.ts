export const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return 'Q0.00';
  return `Q${amount.toFixed(2)}`;
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-GT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};