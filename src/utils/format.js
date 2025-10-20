export const formatCurrencyEUR = v => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(v)
