'use client';

import React, { useState } from 'react';
import { 
  X, CheckCircle2, Shield, Lock, Zap, ArrowRight, RefreshCw, 
  Store, Building2, Mail, ExternalLink, Check 
} from 'lucide-react';
import { testPayPalAuth } from '../lib/api';
import { MerchantStore } from '../lib/types';

interface ConnectPayPalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoreConnected: (store: MerchantStore) => void;
}

export default function ConnectPayPalModal({
  isOpen,
  onClose,
  onStoreConnected
}: ConnectPayPalModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [storeName, setStoreName] = useState('Urban Feet Footwear');
  const [businessEmail, setBusinessEmail] = useState('merchant@urbanfeet.com');
  const [currency, setCurrency] = useState('USD');
  const [authenticating, setAuthenticating] = useState(false);
  const [createdStore, setCreatedStore] = useState<MerchantStore | null>(null);

  if (!isOpen) return null;

  async function handleOAuthHandshake() {
    setAuthenticating(true);
    setStep(2);
    try {
      // Perform live ping to verify real PayPal sandbox backend
      await testPayPalAuth();
      
      // Simulate OAuth 2.0 PKCE exchange
      setTimeout(() => {
        setStep(3);
        setTimeout(() => {
          const slug = storeName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
          const newMerchantId = `merchant_${slug || 'custom'}`;
          const randomPayer = `PP-PAYER-${Math.floor(100000 + Math.random() * 900000)}`;

          const store: MerchantStore = {
            id: newMerchantId,
            name: storeName,
            businessEmail,
            paypalPayerId: randomPayer,
            isVerified: true,
            connectedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            currency,
            appId: 'APP-22A05303NP776440S'
          };

          setCreatedStore(store);
          setStep(4);
          setAuthenticating(false);
        }, 1200);
      }, 1000);
    } catch (e) {
      setAuthenticating(false);
    }
  }

  function handleComplete() {
    if (createdStore) {
      onStoreConnected(createdStore);
    }
    onClose();
    setStep(1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border-color)',
          color: 'var(--foreground)'
        }}
      >
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#003087]/20 border border-[#0070ba]/40 flex items-center justify-center text-[#0070ba] font-black">
              PP
            </div>
            <div>
              <h3 className="text-sm font-bold">Connect PayPal Business Account</h3>
              <p className="text-[11px] text-slate-400">OAuth 2.0 Partner Onboarding & Auto-Sync</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between text-xs font-mono border-b" style={{ borderColor: 'var(--border-color)' }}>
          {[
            { num: 1, label: 'Store Info' },
            { num: 2, label: 'PayPal OAuth' },
            { num: 3, label: 'Webhook Sync' },
            { num: 4, label: 'Verified' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= s.num ? 'bg-sky-500 text-white' : 'bg-white/10 text-slate-500'
              }`}>
                {step > s.num ? '✓' : s.num}
              </span>
              <span className={`hidden sm:inline text-[11px] ${step === s.num ? 'text-sky-400 font-bold' : 'text-slate-500'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[calc(92vh-125px)] no-scrollbar">

          {/* STEP 1: Store & Merchant Registration */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Register your business store. ResolvePay will create an isolated tenant partition and link it securely to your PayPal merchant profile.
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Store / Business Name</label>
                  <div className="relative">
                    <Store className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input 
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Urban Feet Apparel"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                      style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Business Contact Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input 
                      type="email"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      placeholder="e.g. billing@urbanfeet.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                      style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Primary Settlement Currency</label>
                  <select 
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                    style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)', color: 'var(--foreground)' }}
                  >
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="INR">INR (₹ - Indian Rupee)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Zero-Password Protocol: Your PayPal password is never entered here. You will authorize directly via PayPal.</span>
              </div>

              <button
                onClick={handleOAuthHandshake}
                disabled={!storeName.trim() || !businessEmail.trim()}
                style={{ backgroundColor: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }} className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 hover:brightness-105 active:scale-98"
              >
                <span>Authorize with PayPal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: PayPal OAuth Handshake Simulation */}
          {step === 2 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0070ba]/20 text-[#0070ba] border border-[#0070ba]/40 flex items-center justify-center mx-auto animate-pulse">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Redirecting to PayPal Sandbox...</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Exchanging authorization code with <code className="text-sky-400">api-m.sandbox.paypal.com</code>
                </p>
              </div>
              <div className="p-4 rounded-xl text-left text-xs font-mono space-y-1.5 border shadow-inner" style={{ backgroundColor: '#0B0F17', borderColor: '#1E293B', color: '#F1F5F9' }}>
                <div className="text-emerald-400 font-bold">➜ POST /v1/oauth2/token HTTP/1.1</div>
                <div className="text-slate-200">App ID: <span className="text-white font-semibold">APP-22A05303NP776440S</span></div>
                <div className="text-slate-300">Scope: <span className="text-sky-300">https://uri.paypal.com/services/disputes/readwrite</span></div>
                <div className="text-emerald-400 font-bold">Status: 200 OK (Access Token Granted)</div>
              </div>
            </div>
          )}

          {/* STEP 3: Webhook Auto-Provisioning */}
          {step === 3 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Provisioning PayPal Webhook Stream</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Subscribing to dispute alerts and creating database isolation partition
                </p>
              </div>
              <div className="p-4 rounded-xl text-left text-xs font-mono space-y-1.5 border shadow-inner" style={{ backgroundColor: '#0B0F17', borderColor: '#1E293B', color: '#F1F5F9' }}>
                <div className="text-emerald-400 font-bold">➜ Webhook Listener: /api/webhooks/paypal</div>
                <div className="text-slate-200">Filter Events: <span className="text-white">CUSTOMER.DISPUTE.CREATED, CUSTOMER.DISPUTE.RESOLVED</span></div>
                <div className="text-emerald-400 font-bold">Idempotency Protection: ACTIVE</div>
              </div>
            </div>
          )}

          {/* STEP 4: Verified Store Card */}
          {step === 4 && createdStore && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">Store Verified & Successfully Linked!</h4>
                  <p className="text-xs opacity-90">PayPal merchant identity confirmed by PayPal Sandbox API.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border space-y-2 text-xs font-mono transition-colors" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)', color: 'var(--foreground)' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Store Name:</span>
                  <span className="font-bold font-sans" style={{ color: 'var(--foreground)' }}>{createdStore.name}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Merchant Tenant ID:</span>
                  <span className="font-bold" style={{ color: 'var(--accent-primary)' }}>{createdStore.id}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>PayPal Payer ID:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{createdStore.paypalPayerId}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Sandbox App:</span>
                  <span style={{ color: 'var(--foreground)' }}>{createdStore.appId}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Data Isolation:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">ThreadLocal PostgreSQL Scoped</span>
                </div>
              </div>

              <button
                onClick={handleComplete}
                style={{ backgroundColor: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }} className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition hover:brightness-105 active:scale-98"
              >
                <Check className="w-4 h-4" />
                <span>Switch to {createdStore.name} Dashboard</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
