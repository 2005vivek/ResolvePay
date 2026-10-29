'use client';

import React, { useState, useEffect } from 'react';
import { Dispute, EvidenceItem } from '../lib/types';
import { fetchEvidenceItems, uploadEvidenceFile, generateAiDraft, submitDisputeResponse } from '../lib/api';
import { X, Sparkles, Upload, FileText, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

interface Props {
  dispute: Dispute;
  onClose: () => void;
  onDisputeUpdated: () => void;
}

export default function DisputeDetailModal({ dispute, onClose, onDisputeUpdated }: Props) {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'evidence' | 'rebuttal'>('evidence');

  useEffect(() => {
    loadEvidence();
  }, [dispute.id]);

  async function loadEvidence() {
    setLoadingEvidence(true);
    try {
      const items = await fetchEvidenceItems(dispute.id);
      setEvidenceList(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEvidence(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadEvidenceFile(dispute.id, file, 'SHIPPING_PROOF');
      await loadEvidence();
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerateAiDraft() {
    setGeneratingDraft(true);
    try {
      const result = await generateAiDraft(dispute.id);
      setDraftText(result);
      setActiveTab('rebuttal');
    } catch (err: any) {
      alert('Draft generation failed: ' + err.message);
    } finally {
      setGeneratingDraft(false);
    }
  }

  async function handleSubmitToPayPal() {
    if (!draftText.trim()) {
      alert('Please generate or write a resolution response draft first.');
      return;
    }

    setSubmitting(true);
    try {
      await submitDisputeResponse(dispute.id, draftText);
      setSubmitSuccess(true);
      onDisputeUpdated();
    } catch (err: any) {
      alert('Submission error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#172033]">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-[#087E8B]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-[#172033]">Dispute Workspace</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-[#087E8B] border border-teal-200">
                  {dispute.paypalDisputeId}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Reason: <span className="text-slate-800 font-medium">{dispute.reason}</span> • Amount at Risk:{' '}
                <span className="text-emerald-700 font-bold">{dispute.amount} {dispute.currency}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-3.5 px-4 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'evidence'
                ? 'border-[#087E8B] text-[#087E8B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Evidence & Multimodal Scanner ({evidenceList.length})
          </button>
          <button
            onClick={() => setActiveTab('rebuttal')}
            className={`py-3.5 px-4 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'rebuttal'
                ? 'border-[#087E8B] text-[#087E8B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Gemini AI Legal Rebuttal {draftText ? '✓' : ''}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-white">
          {activeTab === 'evidence' && (
            <div className="space-y-6">
              {/* Evidence Upload Card */}
              <div className="border-2 border-dashed border-slate-200 hover:border-[#087E8B] rounded-xl p-6 bg-slate-50 text-center transition">
                <input
                  type="file"
                  id="evidenceUpload"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,image/*"
                  disabled={uploading}
                />
                <label
                  htmlFor="evidenceUpload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="p-3 bg-teal-100 rounded-full text-[#087E8B]">
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[#172033] hover:text-[#087E8B] underline">
                      {uploading ? 'Gemini AI is analyzing evidence...' : 'Upload Carrier Slip, Receipt, or Invoice (PDF / Image)'}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      Gemini Multimodal extracts tracking number, carrier status, delivery address & signatures automatically.
                    </p>
                  </div>
                </label>
              </div>

              {/* Uploaded Evidence Cards */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#087E8B]" />
                  Forensic Evidence Repository
                </h3>

                {loadingEvidence ? (
                  <div className="py-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#087E8B]" /> Loading evidence records...
                  </div>
                ) : evidenceList.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-sm">
                    No evidence uploaded yet. Upload a shipping slip or invoice above to let Gemini inspect facts.
                  </div>
                ) : (
                  evidenceList.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-semibold text-[#172033]">{item.filename}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-800 font-mono">
                            {item.type}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          SHA-256: {item.contentHash ? item.contentHash.substring(0, 16) + '...' : 'Verified'}
                        </span>
                      </div>

                      {/* Gemini Extracted Facts Box */}
                      {item.extractedFacts && (
                        <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 whitespace-pre-line font-sans leading-relaxed">
                          <div className="text-[#087E8B] font-semibold mb-1 flex items-center gap-1.5 text-[11px]">
                            <Sparkles className="w-3.5 h-3.5" />
                            Gemini Multimodal Extracted Facts:
                          </div>
                          {item.extractedFacts}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Action Bar */}
              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleGenerateAiDraft}
                  disabled={generatingDraft}
                  className="px-5 py-2.5 rounded-xl bg-[#087E8B] hover:bg-[#076c77] text-white font-bold text-sm flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {generatingDraft ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gemini Synthesizing Rebuttal...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Evidence-Backed Rebuttal
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'rebuttal' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#087E8B]" />
                  Gemini Generated Defense Rebuttal (Editable for PayPal Submission):
                </label>
                <button
                  onClick={handleGenerateAiDraft}
                  disabled={generatingDraft}
                  className="text-xs text-[#087E8B] hover:underline font-medium flex items-center gap-1"
                >
                  {generatingDraft ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Regenerate Draft
                </button>
              </div>

              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Click 'Generate Evidence-Backed Rebuttal' or write your response here..."
                rows={12}
                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-[#172033] text-sm font-mono leading-relaxed focus:outline-none focus:border-[#087E8B] focus:bg-white focus:ring-1 focus:ring-[#087E8B] transition placeholder:text-slate-400"
              />

              <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#087E8B] flex-shrink-0 mt-0.5" />
                <span>
                  Once submitted, ResolvePay will call PayPal&apos;s official <code>/provide-evidence</code> endpoint with this statement and transition the dispute status to <strong>UNDER_REVIEW</strong>.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
          >
            Cancel
          </button>

          {submitSuccess ? (
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Submitted Successfully to PayPal Sandbox!
            </div>
          ) : (
            <button
              onClick={handleSubmitToPayPal}
              disabled={submitting || !draftText.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#087E8B] hover:bg-[#076c77] text-white font-bold text-sm flex items-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting to PayPal API...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Approve & Submit to PayPal
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
