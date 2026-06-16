export function formatMoney(amount: number, currency = 'INR') {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return amount.toLocaleString(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
}
