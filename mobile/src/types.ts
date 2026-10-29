export interface Dispute {
  id: string;
  paypalDisputeId: string;
  status: string;
  amount: number;
  currency: string;
  reason: string;
  deadline?: string;
  disputeLifeCycleStage?: string;
  disputeChannel?: string;
}
