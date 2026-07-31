export { storage } from './storage';

// Currency formatter for Indian Rupees
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  })}`;
};

// Simple currency format without decimals
export const formatCurrencySimple = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};
