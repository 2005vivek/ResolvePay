/**
 * Utility functions for ResolvePay UI
 */

export interface DeadlineUrgency {
  label: string;
  urgency: 'CRITICAL' | 'ELEVATED' | 'ROUTINE' | 'EXPIRED' | 'NONE';
  hoursRemaining?: number;
}

/**
 * Calculates deadline urgency and human-readable countdown from an ISO timestamp.
 * Adheres strictly to real timestamps rather than hard-coded strings.
 */
export function calculateDeadlineUrgency(deadlineIso?: string | null): DeadlineUrgency {
  if (!deadlineIso || deadlineIso.trim() === '') {
    return {
      label: 'No deadline set',
      urgency: 'NONE'
    };
  }

  const deadline = new Date(deadlineIso);
  if (isNaN(deadline.getTime())) {
    return {
      label: 'Invalid deadline',
      urgency: 'NONE'
    };
  }

  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      label: 'Deadline expired',
      urgency: 'EXPIRED',
      hoursRemaining: 0
    };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  const remainingMinutes = totalMinutes % 60;

  let label = '';
  if (days > 0) {
    label = `${days}d ${remainingHours}h left`;
  } else if (totalHours > 0) {
    label = `${totalHours}h ${remainingMinutes}m left`;
  } else {
    label = `${remainingMinutes}m left`;
  }

  let urgency: 'CRITICAL' | 'ELEVATED' | 'ROUTINE';
  if (totalHours < 24) {
    urgency = 'CRITICAL'; // < 24 hours
  } else if (totalHours <= 72) {
    urgency = 'ELEVATED'; // 24 - 72 hours
  } else {
    urgency = 'ROUTINE';  // > 72 hours
  }

  return {
    label,
    urgency,
    hoursRemaining: totalHours
  };
}

/**
 * Formats a currency amount with standard separators and currency code
 */
export function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

/**
 * Computes a factual readiness score (0-100%) based on attached evidence and facts
 */
export function calculateDefenseReadiness(evidenceCount: number, hasDraft: boolean): {
  score: number;
  label: string;
  color: string;
} {
  if (evidenceCount === 0 && !hasDraft) {
    return { score: 20, label: 'Evidence Needed', color: 'text-rose-700' };
  }
  if (evidenceCount === 0 && hasDraft) {
    return { score: 50, label: 'Draft Ready (No Proofs)', color: 'text-amber-700' };
  }
  if (evidenceCount > 0 && !hasDraft) {
    return { score: 70, label: 'Proofs Ingested', color: 'text-blue-700' };
  }
  return { score: 95, label: 'Strong Defense Package', color: 'text-emerald-700' };
}
