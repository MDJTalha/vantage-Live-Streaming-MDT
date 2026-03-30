/**
 * Invoice utilities for generating and formatting invoice numbers
 */

interface InvoiceOptions {
  organizationId: string;
  invoiceNumber?: number;
}

/**
 * Generate a unique invoice number
 * Format: INV-{YYYYMM}-{organizationIdPrefix}-{sequentialNumber}
 */
export function generateInvoiceNumber({ organizationId, invoiceNumber = 1 }: InvoiceOptions): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const orgPrefix = organizationId.substring(0, 4).toUpperCase();
  const sequence = String(invoiceNumber).padStart(5, '0');
  
  return `INV-${year}${month}-${orgPrefix}-${sequence}`;
}

/**
 * Format invoice amount to currency string
 */
export function formatInvoiceAmount(amountCents: number, currency: string = 'USD'): string {
  const amount = amountCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Calculate invoice total with tax
 */
export function calculateInvoiceTotal(subtotal: number, taxRate: number = 0): {
  subtotal: number;
  tax: number;
  total: number;
} {
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;
  
  return { subtotal, tax, total };
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number; // in cents
  amount: number; // in cents
}

/**
 * Generate line items for an invoice
 */
export function generateLineItems(
  basePrice: number,
  quantity: number,
  description: string
): LineItem {
  const amount = basePrice * quantity;
  
  return {
    description,
    quantity,
    unitPrice: basePrice,
    amount,
  };
}

/**
 * Format invoice date
 */
export function formatInvoiceDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
