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
    
    // Select appropriate locale based on currency for better formatting
    let locale = 'en-US';
    if (currency === 'NGN') locale = 'en-NG';
    else if (currency === 'EUR') locale = 'en-DE';
    else if (currency === 'GBP') locale = 'en-GB';

    return numAmount.toLocaleString(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
