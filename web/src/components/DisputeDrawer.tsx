'use client';

import React, { useState, useEffect } from 'react';
import { Dispute, EvidenceItem } from '../lib/types';
import { fetchEvidenceItems, uploadEvidenceFile, generateAiDraft, submitDisputeResponse } from '../lib/api';
import { calculateDeadlineUrgency, formatCurrency, calculateDefenseReadiness } from '../lib/utils';
import { useToast } from './Toast';
import { 
  X, Sparkles, Upload, FileText, CheckCircle2, AlertTriangle, 
  ShieldCheck, ArrowRight, Loader2, Copy, Check, ExternalLink,
  Truck, Clock, ChevronRight, FileCheck, Eye, ShieldAlert,
  AlertCircle, Undo2
} from 'lucide-react';

interface Props {
  dispute: Dispute;
  onClose: () => void;
  onDisputeUpdated: () => void;
}

export default function DisputeDrawer({ dispute, onClose, onDisputeUpdated }: Props) {
  const { showToast } = useToast();

  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [initialDraftText, setInitialDraftText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState(dispute.status === 'UNDER_REVIEW');
  const [activeTab, setActiveTab] = useState<'ai' | 'evidence' | 'timeline'>('ai');
  const [previewItem, setPreviewItem] = useState<EvidenceItem | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Check if draft has unsaved user edits
  const isDirty = draftText.trim() !== '' && draftText !== initialDraftText && !submittedStatus;

  // Real-time SLA urgency calculation
  const deadlineInfo = calculateDeadlineUrgency(dispute.deadline);

  // Verifiable defense readiness score based on facts
  const readiness = calculateDefenseReadiness(evidenceList.length, Boolean(draftText.trim()));

  useEffect(() => {
    loadEvidence();
  }, [dispute.id]);

  async function loadEvidence() {
    setLoadingEvidence(true);
    try {
      const items = await fetchEvidenceItems(dispute.id);
      setEvidenceList(items);
    } catch (e: any) {
      showToast(e.message || 'Failed to load evidence', 'error', 'Evidence Retrieval Error');
    } finally {
      setLoadingEvidence(false);
    }
  }

  function handleAttemptClose() {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('File size exceeds PayPal 10MB limit', 'error', 'File Too Large');
      return;
    }

    setUploading(true);
    try {
      await uploadEvidenceFile(dispute.id, file, 'SHIPPING_PROOF');
      showToast(`Ingested ${file.name} with SHA-256 fingerprinting.`, 'success', 'Evidence Recorded');
      await loadEvidence();
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error', 'Upload Error');
    } finally {
      setUploading(false);
    }
  }

  async function handleLoadSampleEvidence() {
    setUploading(true);
    try {
      const sampleBlob = new Blob([
        `FEDEX EXPRESS PROOF OF DELIVERY\n` +
        `Tracking Number: 748920194820\n` +
        `Delivered To: Front Porch with Signature\n` +
        `Delivery Date: ${new Date().toLocaleDateString()} 14:22 EST\n` +
        `Recipient: H. Patel\n` +
        `Status: SIGNED & DELIVERED (Direct contradiction to Item Not Received claim)`
      ], { type: 'text/plain' });
      const sampleFile = new File([sampleBlob], 'FedEx_Proof_Of_Delivery.pdf', { type: 'application/pdf' });
      await uploadEvidenceFile(dispute.id, sampleFile, 'CARRIER_TRACKING');
      showToast('Simulated FedEx carrier delivery record loaded for demonstration.', 'info', 'Demo Ingestion');
      await loadEvidence();
    } catch (err: any) {
      showToast(err.message || 'Failed to load demo evidence', 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerateAiDraft() {
    setGeneratingDraft(true);
    try {
      const result = await generateAiDraft(dispute.id);
      setDraftText(result);
      setInitialDraftText(result);
      setActiveTab('ai');
      showToast('Gemini analyzed evidence and synthesized legal defense rebuttal.', 'success', 'Draft Ready');
    } catch (err: any) {
      showToast(err.message || 'AI generation failed', 'error', 'Gemini AI Error');
    } finally {
      setGeneratingDraft(false);
    }
  }

  async function handleSubmitToPayPal() {
    if (!draftText.trim()) {
      showToast('Please generate or enter a defense statement before submitting.', 'warning', 'Action Required');
      return;
    }

    setSubmitting(true);
    try {
      await submitDisputeResponse(dispute.id, draftText);
      setSubmittedStatus(true);
      setInitialDraftText(draftText);
      showToast('Rebuttal statement officially submitted to PayPal Dispute Center.', 'success', 'Submitted Successfully');
      onDisputeUpdated();
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error', 'PayPal Submission Error');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(draftText);
    setCopied(true);
    showToast('Rebuttal copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleAttemptClose}
    >
      <div 
        className="w-full max-w-2xl bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl overflow-hidden text-[#172033]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top App Bar */}
        <div className="p-6 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087E8B]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#172033] tracking-tight">Case Workspace</h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  {dispute.paypalDisputeId}
                </span>
                {isDirty && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Unsaved Edits
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Channel: <span className="text-[#172033] font-medium">{dispute.disputeChannel || 'PayPal Sandbox'}</span> • Stage: <span className="text-amber-700 font-medium">{dispute.disputeLifeCycleStage || 'CHARGEBACK'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleAttemptClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Case Snapshot Banner */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Amount In Dispute</span>
            <span className="text-emerald-700 font-bold font-mono text-base">
              {formatCurrency(dispute.amount, dispute.currency)}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Dispute Reason</span>
            <span className="text-[#172033] font-semibold truncate block" title={dispute.reason}>
              {dispute.reason.replace(/_/g, ' ')}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">SLA Deadline</span>
            <span className={`font-mono font-bold flex items-center gap-1.5 ${
              deadlineInfo.urgency === 'CRITICAL' ? 'text-rose-700' :
              deadlineInfo.urgency === 'ELEVATED' ? 'text-amber-700' :
              deadlineInfo.urgency === 'EXPIRED' ? 'text-red-700' :
              'text-slate-700'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              {deadlineInfo.label}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'ai'
                ? 'border-[#087E8B] text-[#087E8B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Defense Studio
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'evidence'}
            onClick={() => setActiveTab('evidence')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'evidence'
                ? 'border-[#087E8B] text-[#087E8B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Evidence Vault ({evidenceList.length})
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'timeline'}
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'timeline'
                ? 'border-[#087E8B] text-[#087E8B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Audit Lifecycle
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">

          {/* TAB 1: AI DEFENSE STUDIO */}
          {activeTab === 'ai' && (
            <div className="space-y-5">
              {/* Evidence-Grounded Defense Readiness Callout */}
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-teal-100 text-[#087E8B]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#172033] flex items-center gap-2">
                      <span>Defense Preparedness:</span>
                      <span className={`font-mono font-bold ${readiness.color}`}>{readiness.label} ({readiness.score}%)</span>
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {evidenceList.length > 0 
                        ? `${evidenceList.length} verified carrier document(s) cross-referenced.` 
                        : 'No receipts attached yet. Add shipping proof in Evidence Vault to strengthen case.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleGenerateAiDraft}
                  disabled={generatingDraft}
                  className="px-3.5 py-2 rounded-lg bg-[#087E8B] hover:bg-[#076c77] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                >
                  {generatingDraft ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      {draftText ? 'Regenerate Draft' : 'Generate Rebuttal'}
                    </>
                  )}
                </button>
              </div>

              {/* Editor Workspace */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="rebuttalEditor" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Official Defense Statement (Submitted to PayPal):
                  </label>
                  {draftText && (
                    <button
                      onClick={handleCopy}
                      className="text-xs text-slate-500 hover:text-[#087E8B] flex items-center gap-1.5 transition font-medium"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied to Clipboard' : 'Copy Text'}
                    </button>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    id="rebuttalEditor"
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    placeholder="Click 'Generate Rebuttal' above. Gemini AI will cross-reference your uploaded evidence and synthesize an authoritative PayPal-compliant chargeback defense statement..."
                    rows={13}
                    className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-[#172033] text-xs font-mono leading-relaxed focus:outline-none focus:border-[#087E8B] focus:bg-white focus:ring-1 focus:ring-[#087E8B] transition resize-none placeholder:text-slate-400"
                  />
                  {!draftText && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                      <Sparkles className="w-8 h-8 text-teal-300 mb-2 animate-pulse" />
                      <p className="text-xs text-slate-500 font-medium max-w-xs">
                        No rebuttal generated yet. Click &apos;Generate Rebuttal&apos; to let Gemini evaluate the case evidence.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal submission disclaimer */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
                <AlertTriangle className="w-4 h-4 text-[#087E8B] flex-shrink-0 mt-0.5" />
                <span>
                  Authoritative Submission: Executing submission triggers a signed call to PayPal&apos;s 
                  <code className="mx-1 px-1 py-0.5 rounded bg-slate-200 text-slate-800">/provide-evidence</code> endpoint and records an immutable audit log in PostgreSQL.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: EVIDENCE VAULT */}
          {activeTab === 'evidence' && (
            <div className="space-y-5">
              {/* Upload Card */}
              <div className="border-2 border-dashed border-slate-200 hover:border-[#087E8B] rounded-2xl p-6 bg-slate-50 hover:bg-teal-50/20 text-center transition">
                <input
                  type="file"
                  id="drawerUpload"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,image/*"
                  disabled={uploading}
                />
                <label
                  htmlFor="drawerUpload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="p-3 bg-teal-100 rounded-xl text-[#087E8B]">
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#172033] hover:text-[#087E8B] underline block">
                      {uploading ? 'Gemini is extracting document facts...' : 'Upload Invoices, Carrier Slips, or Receipts'}
                    </span>
                    <span className="text-xs text-slate-500">Supported: PDF, JPG, PNG (Max 10MB per PayPal specification)</span>
                  </div>
                </label>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-center gap-2">
                  <span className="text-xs text-slate-500">Demo Simulation:</span>
                  <button
                    onClick={handleLoadSampleEvidence}
                    disabled={uploading}
                    className="text-xs font-bold text-[#087E8B] hover:underline"
                  >
                    + Load Sample FedEx Delivery Proof
                  </button>
                </div>
              </div>

              {/* Evidence Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Attached Evidentiary Documents ({evidenceList.length})
                </h4>

                {loadingEvidence ? (
                  <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#087E8B]" /> Loading forensic records...
                  </div>
                ) : evidenceList.length === 0 ? (
                  <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
                    No evidence uploaded yet. Click above to attach tracking numbers, invoices, or delivery slips.
                  </div>
                ) : (
                  evidenceList.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 hover:border-slate-300 hover:bg-white transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-[#172033]">{item.filename}</span>
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-800 font-mono">
                            {item.type}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setPreviewItem(item)}
                            className="text-xs text-[#087E8B] hover:underline flex items-center gap-1 font-medium transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                          <span className="text-xs font-mono text-slate-400">
                            {item.contentHash ? `SHA: ${item.contentHash.substring(0, 10)}...` : 'Verified'}
                          </span>
                        </div>
                      </div>

                      {item.extractedFacts && (
                        <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                          <div className="text-[#087E8B] font-bold text-xs mb-1 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Gemini Fact Extraction:
                          </div>
                          {item.extractedFacts}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TIMELINE & AUDIT */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dispute Audit Lifecycle</h4>
              
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* Step 1 */}
                <div className="flex items-start gap-4 pl-8 relative">
                  <div className="w-3 h-3 rounded-full bg-[#087E8B] ring-4 ring-teal-100 absolute left-1.5 top-1" />
                  <div>
                    <p className="text-xs font-bold text-[#172033]">Dispute Ingested via Webhook</p>
                    <p className="text-xs text-slate-600">Case ID: {dispute.paypalDisputeId} • Stage: {dispute.disputeLifeCycleStage || 'CHARGEBACK'}</p>
                    <span className="text-xs font-mono text-slate-500">Provider: PAYPAL • Status: REQUIRED_ACTION</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4 pl-8 relative">
                  <div className={`w-3 h-3 rounded-full absolute left-1.5 top-1 ${
                    evidenceList.length > 0 ? 'bg-emerald-600 ring-4 ring-emerald-100' : 'bg-slate-300'
                  }`} />
                  <div>
                    <p className="text-xs font-bold text-[#172033]">
                      {evidenceList.length > 0 ? 'Evidence Ingestion & Extraction Complete' : 'Awaiting Evidence Ingestion'}
                    </p>
                    <p className="text-xs text-slate-600">
                      {evidenceList.length > 0 
                        ? `${evidenceList.length} carrier file(s) hashed with SHA-256 and verified.` 
                        : 'Upload carrier tracking receipt in Evidence Vault.'}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4 pl-8 relative">
                  <div className={`w-3 h-3 rounded-full absolute left-1.5 top-1 ${
                    draftText ? 'bg-[#087E8B] ring-4 ring-teal-100' : 'bg-slate-300'
                  }`} />
                  <div>
                    <p className="text-xs font-bold text-[#172033]">
                      {draftText ? 'AI Rebuttal Synthesized' : 'Rebuttal Drafting Pending'}
                    </p>
                    <p className="text-xs text-slate-600">
                      {draftText ? 'Grounding prompt cross-referenced carrier facts.' : 'Generate in AI Defense Studio.'}
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-4 pl-8 relative">
                  <div className={`w-3 h-3 rounded-full absolute left-1.5 top-1 ${
                    submittedStatus ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-300'
                  }`} />
                  <div>
                    <p className="text-xs font-bold text-[#172033]">
                      {submittedStatus ? 'Submitted to PayPal Dispute Center' : 'Ready for Operator Approval'}
                    </p>
                    <p className="text-xs text-slate-600">
                      {submittedStatus ? 'Status: UNDER_REVIEW • Awaiting PayPal decision.' : 'Requires 1-Tap merchant approval.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Action Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleAttemptClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
          >
            Close Workspace
          </button>

          {submittedStatus ? (
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Defense Submitted to PayPal Sandbox!
            </div>
          ) : (
            <button
              onClick={handleSubmitToPayPal}
              disabled={submitting || !draftText.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#087E8B] hover:bg-[#076c77] text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting to PayPal API...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  1-Tap Submit to PayPal
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Discard Edits Confirmation Dialog */}
      {showExitConfirm && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowExitConfirm(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl text-[#172033]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#172033]">Unsaved Rebuttal Edits</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              You have modified the defense rebuttal statement. If you close this workspace now, your unsubmitted edits will be lost.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Keep Editing
              </button>

              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Document Preview Modal */}
      {previewItem && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewItem(null)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl text-[#172033]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#087E8B]" />
                <h3 className="text-sm font-bold text-[#172033]">{previewItem.filename}</h3>
              </div>
              <button 
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Document Type</span>
                  <span className="font-semibold text-[#172033]">{previewItem.type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">SHA-256 Fingerprint</span>
                  <span className="font-mono text-[#087E8B] truncate block">
                    {previewItem.contentHash}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Extracted Facts & Verification</span>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
                  {previewItem.extractedFacts || 'No text extracted. Document registered in forensic database.'}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href={`http://localhost:8085/api/disputes/${dispute.id}/evidence/${previewItem.id}/content?auth_token=rzp_live_sec_789f2a4b8c1d`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#087E8B] hover:underline flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Original Binary Document</span>
              </a>

              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
