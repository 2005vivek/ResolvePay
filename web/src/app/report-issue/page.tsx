'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, Send, CheckCircle2, AlertTriangle, ArrowRight, 
  ExternalLink, Sparkles, Smartphone, Package, Check
} from 'lucide-react';
import { fileCustomerDispute } from '../../lib/api';

export default function CustomerDisputePortal() {
  const [customerName, setCustomerName] = useState('Rahul Sharma');
  const [customerEmail, setCustomerEmail] = useState('rahul.buyer@example.com');
  const [caseId, setCaseId] = useState(`PP-D-${Math.floor(100000 + Math.random() * 900000)}`);
  const [amount, setAmount] = useState('249.99');
  const [reason, setReason] = useState('MERCHANDISE_OR_SERVICE_NOT_RECEIVED');
  const [details, setDetails] = useState('I purchased this item 4 days ago, but the tracking shows not delivered or sent to a wrong postal address.');
  const [submitting, setSubmitting] = useState(false);
  const [submittedCase, setSubmittedCase] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fileCustomerDispute({
        customerName,
        customerEmail,
        paypalDisputeId: caseId,
        amount: parseFloat(amount) || 249.99,
        reason,
        details,
        notifyPhone: '919974442291',
      });

      setSubmittedCase(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit customer dispute. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCaseId(`PP-D-${Math.floor(100000 + Math.random() * 900000)}`);
    setSubmittedCase(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#070D12] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>PayPal Buyer Resolution Center</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Live Test Portal
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Customer Dispute Resolution Portal — Submitting an issue dispatches an instant 1-Tap alert to the merchant WhatsApp.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition"
          >
            <span>Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Main Content Area */}
        {!submittedCase ? (
          <div className="bg-[#0C151D] border border-slate-800/80 rounded-2xl p-5 sm:p-7 shadow-xl space-y-5">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>File a Live Transaction Dispute</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Use this form to file or simulate a customer issue. Submitting will dispatch a real-time 1-Tap defense alert to WhatsApp in seconds!
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Case ID & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    PayPal Case / Dispute ID
                  </label>
                  <input
                    type="text"
                    required
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Unique Case ID</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Dispute Amount ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Held In Escrow</span>
                </div>
              </div>

              {/* Row 2: Customer Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Customer / Friend Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 3: Reason */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Reason for Dispute
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MERCHANDISE_OR_SERVICE_NOT_RECEIVED">Item Not Received</option>
                  <option value="MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED">Item Significantly Not As Described</option>
                  <option value="UNAUTHORISED">Unauthorised Transaction</option>
                </select>
              </div>

              {/* Row 4: Details */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Customer Explanation & Dispute Details
                </label>
                <textarea
                  rows={3}
                  required
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[48px] py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/30 disabled:opacity-50 active:scale-[0.99]"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Transmitting Dispute & Alerting WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Customer Dispute</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Success Screen */
          <div className="bg-[#0C151D] border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-slide-up">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-white">Dispute Lodged Successfully!</h2>
              <p className="text-xs text-slate-400">
                The customer dispute has been officially registered in the ResolvePay & PayPal sandbox system.
              </p>
            </div>

            {/* Case Details Box */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Case ID:</span>
                <span className="text-white font-bold">{submittedCase.paypalDisputeId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Amount:</span>
                <span className="text-emerald-400 font-bold">${submittedCase.amount} USD</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Reason:</span>
                <span className="text-slate-200">{submittedCase.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                  ACTION REQUIRED
                </span>
              </div>
            </div>

            {/* Real-time WhatsApp Alert Notice */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-left flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 mt-0.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-1">
                <div className="font-bold text-emerald-300">
                  📱 WhatsApp Alert Dispatched to Merchant Phone!
                </div>
                <div className="text-slate-300 leading-relaxed text-[11px]">
                  A live 1-Tap rebuttal alert has been sent to the merchant registered WhatsApp number. The merchant can review and defend the dispute directly from their phone.
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/"
                className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
              >
                <span>View on Merchant Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={resetForm}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs transition"
              >
                File Another Test Dispute
              </button>
            </div>
          </div>
        )}

        {/* Informative Footer */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <div>ResolvePay AI Engine • Multi-carrier GPS Delivery Validation</div>
          <div>Powered by PayPal Dispute Automation API & Meta WhatsApp Cloud API</div>
        </div>

      </div>
    </div>
  );
}
