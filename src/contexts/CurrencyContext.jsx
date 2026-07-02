import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('user_currency') || 'NGN';
  });

  useEffect(() => {
    localStorage.setItem('user_currency', currency);
  }, [currency]);

  const formatAmount = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    
    try {
      return numAmount.toLocaleString(undefined, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch (e) {
      // Fallback if an invalid currency is somehow set
      return `${currency} ${numAmount.toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
