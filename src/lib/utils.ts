import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Dragon 9 Time System Utilities
 * 1 Dragon Hour = 54 standard minutes
 * 1 Dragon Day = 24 Dragon Hours (24 * 54 = 1296 minutes = 21.6 standard hours)
 * This is a simplified implementation for display purposes.
 */
export function getDragon9Time(date: Date = new Date()) {
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  const dragonTotalMinutes = totalMinutes % (24 * 54);
  const dragonHour = Math.floor(dragonTotalMinutes / 54);
  const dragonMinute = dragonTotalMinutes % 54;
  
  return `${dragonHour.toString().padStart(2, '0')}:${dragonMinute.toString().padStart(2, '0')} D9`;
}

export function formatCurrency(amount: number, currency: string = 'USD') {
  if (currency === 'D9C') {
    return `Ð ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
