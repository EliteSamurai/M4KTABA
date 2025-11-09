'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_CURRENCIES, type CurrencyConfig } from '@/lib/i18n/config';
import { DollarSign } from 'lucide-react';

const POPULAR_CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'TRY', 'PKR'];

export function CurrencySelector() {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  // Load saved currency from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('preferred_currency');
    if (saved && saved in SUPPORTED_CURRENCIES) {
      setSelectedCurrency(saved);
      // Dispatch custom event so other components can react
      window.dispatchEvent(
        new CustomEvent('currencyChange', { detail: { currency: saved } })
      );
    }
  }, []);

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    localStorage.setItem('preferred_currency', currency);
    
    // Dispatch event for other components to update
    window.dispatchEvent(
      new CustomEvent('currencyChange', { detail: { currency } })
    );
    
    // Optionally reload page to update all prices
    // window.location.reload();
  };

  return (
    <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
      <SelectTrigger className="w-[140px]">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {/* Popular Currencies */}
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Popular
        </div>
        {POPULAR_CURRENCIES.map((code) => {
          const config = SUPPORTED_CURRENCIES[code];
          return (
            <SelectItem key={code} value={code}>
              <div className="flex items-center justify-between w-full">
                <span>{code}</span>
                <span className="text-muted-foreground text-xs ml-2">
                  {config.symbol}
                </span>
              </div>
            </SelectItem>
          );
        })}
        
        {/* All Other Currencies */}
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
          All Currencies
        </div>
        {Object.entries(SUPPORTED_CURRENCIES)
          .filter(([code]) => !POPULAR_CURRENCIES.includes(code))
          .map(([code, config]) => (
            <SelectItem key={code} value={code}>
              <div className="flex items-center justify-between w-full">
                <span>{code}</span>
                <span className="text-muted-foreground text-xs ml-2">
                  {config.symbol}
                </span>
              </div>
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Hook to use current currency in components
 */
export function useCurrency() {
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    // Load initial value
    const saved = localStorage.getItem('preferred_currency');
    if (saved && saved in SUPPORTED_CURRENCIES) {
      setCurrency(saved);
    }

    // Listen for changes
    const handleCurrencyChange = (e: CustomEvent) => {
      setCurrency(e.detail.currency);
    };

    window.addEventListener('currencyChange', handleCurrencyChange as EventListener);
    
    return () => {
      window.removeEventListener('currencyChange', handleCurrencyChange as EventListener);
    };
  }, []);

  return currency;
}

/**
 * Component that formats price with current currency
 */
interface PriceDisplayProps {
  amount: number; // Amount in USD
  className?: string;
}

export function PriceDisplay({ amount, className }: PriceDisplayProps) {
  const currency = useCurrency();
  const [displayPrice, setDisplayPrice] = useState('');

  useEffect(() => {
    async function convertPrice() {
      const { convertAndFormatSync } = await import('@/lib/currency');
      const formatted = convertAndFormatSync(amount, currency);
      setDisplayPrice(formatted);
    }
    
    convertPrice();
  }, [amount, currency]);

  return <span className={className}>{displayPrice || `$${amount.toFixed(2)}`}</span>;
}

