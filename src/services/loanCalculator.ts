/**
 * Financial Calculation & Schedule Engine
 * Grateful Relief Program Limited
 */

import { RepaymentInstallment, RepaymentFrequency, InterestMethod } from '../types';

/**
 * Format currency in Nigerian Naira (₦)
 */
export function formatNaira(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₦0.00';
  }
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('NGN', '₦');
}

/**
 * Format date to Nigerian standard DD/MM/YYYY
 */
export function formatDateNG(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Check if a given date is a weekend (Saturday or Sunday)
 */
export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Get next valid business day (skipping Saturday and Sunday)
 */
export function getNextBusinessDay(startDate: Date): Date {
  const date = new Date(startDate);
  date.setDate(date.getDate() + 1);
  while (isWeekend(date)) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

/**
 * Compute contractual loan terms
 * e.g., ₦20,000 @ 20% flat for 24 days = ₦4,000 interest, ₦24,000 total, ₦1,000 daily
 */
export function calculateLoanTerms(params: {
  principal: number;
  interestRatePercent: number;
  durationUnits: number;
  interestMethod?: InterestMethod;
}) {
  const { principal, interestRatePercent, durationUnits } = params;
  const contractualInterest = Math.round(principal * (interestRatePercent / 100) * 100) / 100;
  const totalScheduledRepayment = Math.round((principal + contractualInterest) * 100) / 100;
  const dailyScheduledRepayment = durationUnits > 0 ? Math.round((totalScheduledRepayment / durationUnits) * 100) / 100 : 0;

  return {
    principal,
    interestRatePercent,
    contractualInterest,
    totalScheduledRepayment,
    dailyScheduledRepayment,
    durationUnits,
  };
}

/**
 * Generate full repayment schedule, excluding Saturdays & Sundays
 */
export function generateRepaymentSchedule(params: {
  loanId: string;
  principal: number;
  interestRatePercent: number;
  durationUnits: number;
  startDate: string; // YYYY-MM-DD
  repaymentFrequency?: RepaymentFrequency;
  excludeWeekends?: boolean;
}): { installments: RepaymentInstallment[]; endDate: string } {
  const {
    loanId,
    principal,
    interestRatePercent,
    durationUnits,
    startDate,
    excludeWeekends = true,
  } = params;

  const terms = calculateLoanTerms({
    principal,
    interestRatePercent,
    durationUnits,
  });

  const scheduledDailyTotal = terms.dailyScheduledRepayment;
  const scheduledDailyPrincipal = Math.round((principal / durationUnits) * 100) / 100;
  const scheduledDailyInterest = Math.round((terms.contractualInterest / durationUnits) * 100) / 100;

  const installments: RepaymentInstallment[] = [];
  let currentDate = new Date(startDate);

  // If start date itself is a weekend and excludeWeekends is true, move to next weekday
  if (excludeWeekends && isWeekend(currentDate)) {
    currentDate = getNextBusinessDay(currentDate);
  }

  let runningOpeningBalance = terms.totalScheduledRepayment;

  for (let i = 1; i <= durationUnits; i++) {
    const dueDateStr = currentDate.toISOString().split('T')[0];
    
    // Adjust last installment for rounding differences
    const isLast = i === durationUnits;
    const currentPrincipal = isLast 
      ? Math.round((principal - scheduledDailyPrincipal * (durationUnits - 1)) * 100) / 100
      : scheduledDailyPrincipal;
    const currentInterest = isLast
      ? Math.round((terms.contractualInterest - scheduledDailyInterest * (durationUnits - 1)) * 100) / 100
      : scheduledDailyInterest;
    const currentTotal = isLast
      ? Math.round((terms.totalScheduledRepayment - scheduledDailyTotal * (durationUnits - 1)) * 100) / 100
      : scheduledDailyTotal;

    installments.push({
      id: `${loanId}-inst-${i}`,
      loanId,
      installmentNumber: i,
      dueDate: dueDateStr,
      openingBalance: runningOpeningBalance,
      scheduledPrincipal: currentPrincipal,
      scheduledInterest: currentInterest,
      scheduledTotal: currentTotal,
      actualPaid: 0,
      remainingDue: currentTotal,
      status: 'upcoming',
    });

    runningOpeningBalance = Math.round((runningOpeningBalance - currentTotal) * 100) / 100;

    // Advance to next day, skipping weekends if daily
    if (excludeWeekends) {
      currentDate = getNextBusinessDay(currentDate);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  const lastInstallment = installments[installments.length - 1];
  const endDate = lastInstallment ? lastInstallment.dueDate : startDate;

  return { installments, endDate };
}

/**
 * Allocate payment across installments
 * Order: oldest unpaid/overdue installment principal & interest first, then remaining
 */
export function allocatePayment(
  installments: RepaymentInstallment[],
  paymentAmount: number,
  interestRatio: number = 4000 / 24000 // roughly 16.67%
): {
  updatedInstallments: RepaymentInstallment[];
  principalAllocated: number;
  interestAllocated: number;
  excessAllocated: number;
} {
  let remainingPayment = paymentAmount;
  let principalAllocated = 0;
  let interestAllocated = 0;

  const updatedInstallments = installments.map(inst => ({ ...inst }));

  for (const inst of updatedInstallments) {
    if (remainingPayment <= 0) break;
    if (inst.remainingDue <= 0) continue;

    const alloc = Math.min(remainingPayment, inst.remainingDue);
    inst.actualPaid = Math.round((inst.actualPaid + alloc) * 100) / 100;
    inst.remainingDue = Math.round((inst.remainingDue - alloc) * 100) / 100;

    if (inst.remainingDue === 0) {
      inst.status = 'paid';
    } else {
      inst.status = 'partially_paid';
    }

    const currentInterestPart = Math.round(alloc * interestRatio * 100) / 100;
    const currentPrincipalPart = Math.round((alloc - currentInterestPart) * 100) / 100;

    interestAllocated += currentInterestPart;
    principalAllocated += currentPrincipalPart;
    remainingPayment = Math.round((remainingPayment - alloc) * 100) / 100;
  }

  const excessAllocated = remainingPayment > 0 ? remainingPayment : 0;
  if (excessAllocated > 0) {
    // If overpaid past all installments, apply excess to principal recovery reduction
    principalAllocated += excessAllocated;
  }

  return {
    updatedInstallments,
    principalAllocated: Math.round(principalAllocated * 100) / 100,
    interestAllocated: Math.round(interestAllocated * 100) / 100,
    excessAllocated: Math.round(excessAllocated * 100) / 100,
  };
}

/**
 * Calculate days overdue against current date
 */
export function calculateDaysOverdue(dueDateString: string, today: Date = new Date()): number {
  const due = new Date(dueDateString);
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
