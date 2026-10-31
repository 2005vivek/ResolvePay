import { Dispute, EvidenceItem } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8085/api';
const AUTH_TOKEN = process.env.NEXT_PUBLIC_RESOLVEPAY_AUTH_TOKEN || 'rzp_live_sec_789f2a4b8c1d';

let currentMerchantId = 'merchant_resolvepay_01';

export function getActiveMerchantId(): string {
  return currentMerchantId;
}

export function setActiveMerchantId(id: string): void {
  currentMerchantId = id || 'merchant_resolvepay_01';
}

function getAuthHeaders(overrideMerchantId?: string) {
  return {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'X-Merchant-Id': overrideMerchantId || currentMerchantId,
  };
}

export async function fetchDisputes(signal?: AbortSignal, merchantId?: string): Promise<Dispute[]> {
  const res = await fetch(`${API_BASE_URL}/disputes`, {
    cache: 'no-store',
    headers: getAuthHeaders(merchantId),
    signal,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}: Failed to fetch disputes`);
  }
  return res.json();
}

export async function fetchDisputeById(id: string, merchantId?: string): Promise<Dispute> {
  const res = await fetch(`${API_BASE_URL}/disputes/${id}`, {
    cache: 'no-store',
    headers: getAuthHeaders(merchantId),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}: Failed to fetch dispute details`);
  }
  return res.json();
}

export async function syncDisputesFromPayPal(merchantId?: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/disputes/sync`, {
    method: 'POST',
    headers: getAuthHeaders(merchantId),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}: Failed to sync from PayPal`);
  }
  return res.json();
}

export async function testPayPalAuth(merchantId?: string): Promise<{ status: string; provider: string; authenticated: boolean; timestamp: string }> {
  const res = await fetch(`${API_BASE_URL}/disputes/test-auth`, {
    cache: 'no-store',
    headers: getAuthHeaders(merchantId),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to reach PayPal Sandbox`);
  }
  return res.json();
}

export async function generateAiDraft(id: string, merchantId?: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/disputes/${id}/draft`, {
    method: 'POST',
    headers: getAuthHeaders(merchantId),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(errorText || `HTTP ${res.status}: Failed to generate AI draft`);
  }
  return res.text();
}

export async function submitDisputeResponse(id: string, draftText: string, merchantId?: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/disputes/${id}/submit`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(merchantId),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ draftText }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}: Submission rejected by provider`);
  }
  return data;
}

export async function fetchEvidenceItems(disputeId: string, merchantId?: string): Promise<EvidenceItem[]> {
  const res = await fetch(`${API_BASE_URL}/disputes/${disputeId}/evidence`, {
    cache: 'no-store',
    headers: getAuthHeaders(merchantId),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}: Failed to fetch evidence items`);
  }
  return res.json();
}

export async function uploadEvidenceFile(disputeId: string, file: File, type: string = 'SHIPPING_PROOF', merchantId?: string): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const res = await fetch(`${API_BASE_URL}/disputes/${disputeId}/evidence/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'X-Merchant-Id': merchantId || currentMerchantId,
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `HTTP ${res.status}: Failed to upload evidence`);
  }
  return data;
}

export async function simulatePayPalDispute(payload: any, merchantId?: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/webhooks/paypal/simulate`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(merchantId),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}: Webhook simulation failed`);
  }
  return data;
}

/**
 * Executes a live double-dispatch test to demonstrate Webhook Idempotency.
 * First dispatch should succeed (SUCCESS), second dispatch with identical event ID
 * should return DUPLICATE_ACCEPTED / DUPLICATE_IGNORED.
 */
export async function simulateIdempotencyAttack(eventId: string, disputeId: string, amount: string = '199.00', merchantId?: string) {
  const payload = {
    id: eventId,
    event_type: 'CUSTOMER.DISPUTE.CREATED',
    create_time: new Date().toISOString(),
    resource_type: 'dispute',
    resource: {
      dispute_id: disputeId,
      dispute_amount: {
        currency: 'USD',
        value: amount
      },
      reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
      status: 'REQUIRED_ACTION',
      dispute_life_cycle_stage: 'CHARGEBACK',
      dispute_channel: 'INTERNAL'
    }
  };

  // First Attempt
  const attempt1 = await simulatePayPalDispute(payload, merchantId);

  // Second Attempt (Immediate duplicate replay attack or network re-transmission)
  const attempt2 = await simulatePayPalDispute(payload, merchantId);

  return {
    eventId,
    disputeId,
    attempt1,
    attempt2,
    idempotencyEnforced: attempt2.status === 'DUPLICATE_ACCEPTED' || attempt2.status === 'DUPLICATE_IGNORED'
  };
}

export function getEvidenceContentUrl(disputeId: string, evidenceId: string): string {
  return `${API_BASE_URL}/disputes/${disputeId}/evidence/${evidenceId}/content`;
}
