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
  carrierTracking?: CarrierProof;
  customerEmail?: string;
  buyerName?: string;
}

export interface CarrierProof {
  carrier: 'FEDEX' | 'DHL' | 'UPS' | 'USPS' | 'SHIPROCKET' | 'BLUEDART' | string;
  trackingNumber: string;
  status: 'DELIVERED' | 'IN_TRANSIT' | 'EXCEPTION';
  deliveryDate: string;
  deliveryLocation: string;
  signedBy: string;
  gpsCoordinates?: string;
  proofDocumentUrl?: string;
}

export interface TacticalRecommendation {
  action: 'FIGHT_DISPUTE' | 'CONCEDE_REFUND' | 'REQUEST_MORE_TIME';
  winProbability: number;
  estimatedRecovery: number;
  penaltyFeeAtRisk: number;
  rationale: string;
  keyFactors: { label: string; impact: string; positive: boolean }[];
}

export interface PolicyMatch {
  policyName: string;
  clause: string;
  complianceStatus: 'VIOLATION_BY_BUYER' | 'COMPLIANT' | 'NEEDS_REVIEW';
  summary: string;
}

export type SupportedLanguage = 'en' | 'de' | 'fr' | 'es' | 'ja';

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

export interface EarlyWarningRisk {
  id: string;
  customerName: string;
  orderNumber: string;
  amount: number;
  sentiment: 'CRITICAL_THREAT' | 'ANGRY' | 'CONFUSED';
  threatLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  customerMessage: string;
  recommendedAction: string;
  timestamp: string;
}

export interface MerchantStore {
  id: string;
  name: string;
  businessEmail: string;
  paypalPayerId: string;
  isVerified: boolean;
  connectedAt: string;
  currency: string;
  appId?: string;
}
