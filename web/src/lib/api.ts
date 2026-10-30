import { Dispute, EvidenceItem } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8085/api';
const AUTH_TOKEN = process.env.NEXT_PUBLIC_RESOLVEPAY_AUTH_TOKEN || 'rzp_live_sec_789f2a4b8c1d';

const authHeaders = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'X-Merchant-Id': 'merchant_resolvepay_01',
};

export async function fetchDisputes(signal?: AbortSignal): Promise<Dispute[]> {
  const res = await fetch(`${API_BASE_URL}/disputes`, {
    cache: 'no-store',
    headers: { ...authHeaders },
    signal,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}: Failed to fetch disputes`);
  }
  return res.json();
}

export async function fetchDisputeById(id: string): Promise<Dispute> {
  const res = await fetch(`${API_BASE_URL}/disputes/${id}`, {
    cache: 'no-store',
    headers: { ...authHeaders },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}: Failed to fetch dispute details`);
  }
  return res.json();
}

export async function syncDisputesFromPayPal(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/disputes/sync`, {
    method: 'POST',
    headers: { ...authHeaders },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}: Failed to sync from PayPal`);
  }
  return res.json();
}

export async function testPayPalAuth(): Promise<{ status: string; provider: string; authenticated: boolean; timestamp: string }> {
  const res = await fetch(`${API_BASE_URL}/disputes/test-auth`, {
    cache: 'no-store',
    headers: { ...authHeaders },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to reach PayPal Sandbox`);
  }
  return res.json();
}

export async function generateAiDraft(id: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/disputes/${id}/draft`, {
    method: 'POST',
    headers: { ...authHeaders },
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(errorText || `HTTP ${res.status}: Failed to generate AI draft`);
  }
  return res.text();
}

export async function submitDisputeResponse(id: string, draftText: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/disputes/${id}/submit`, {
    method: 'POST',
    headers: {
      ...authHeaders,
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

export async function fetchEvidenceItems(disputeId: string): Promise<EvidenceItem[]> {
  const res = await fetch(`${API_BASE_URL}/disputes/${disputeId}/evidence`, {
    cache: 'no-store',
    headers: { ...authHeaders },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}: Failed to fetch evidence items`);
  }
  return res.json();
}

export async function uploadEvidenceFile(disputeId: string, file: File, type: string = 'SHIPPING_PROOF'): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const res = await fetch(`${API_BASE_URL}/disputes/${disputeId}/evidence/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'X-Merchant-Id': 'merchant_resolvepay_01',
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `HTTP ${res.status}: Failed to upload evidence`);
  }
  return data;
}

export async function simulatePayPalDispute(payload: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/webhooks/paypal/simulate`, {
    method: 'POST',
    headers: {
      ...authHeaders,
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

export function getEvidenceContentUrl(disputeId: string, evidenceId: string): string {
  return `${API_BASE_URL}/disputes/${disputeId}/evidence/${evidenceId}/content`;
}
