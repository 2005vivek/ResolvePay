export interface Dispute {
  id: string;
  paypalDisputeId: string;
  status: 'REQUIRED_ACTION' | 'UNDER_REVIEW' | 'RESOLVED' | 'OPEN' | string;
  amount: number;
  currency: string;
  reason: string;
  deadline?: string;
  disputeLifeCycleStage?: string;
  disputeChannel?: string;
  lastSyncedTime?: string;
  createdAt?: string;
  evidenceFiles?: EvidenceItem[];
}

export interface EvidenceItem {
  id: string;
  type: string;
  source: string;
  filename: string;
  contentHash: string;
  extractionStatus: string;
  extractedFacts?: string;
  fileUrl?: string;
  timestamp: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  outcome: string;
  redactedDetails?: string;
}
