import { Dispute } from './types';

// Points to local Spring Boot machine IP or localhost (10.0.2.2 for Android emulator)
const API_BASE_URL = 'http://localhost:8085/api';

export async function fetchDisputes(): Promise<Dispute[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/disputes`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch (e) {
    console.warn('API fetch fallback to mock:', e);
    return [
      {
        id: '1',
        paypalDisputeId: 'PP-D-128491',
        status: 'ACTION_REQUIRED',
        amount: 249.99,
        currency: 'USD',
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        deadline: '2026-11-02T18:00:00Z',
      },
      {
        id: '2',
        paypalDisputeId: 'PP-D-998124',
        status: 'UNDER_REVIEW',
        amount: 89.50,
        currency: 'USD',
        reason: 'UNAUTHORISED',
        deadline: '2026-11-04T12:00:00Z',
      }
    ];
  }
}

export async function submitDisputeResponse(id: string, draftText: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/disputes/${id}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ draftText }),
  });
  return res.json();
}
