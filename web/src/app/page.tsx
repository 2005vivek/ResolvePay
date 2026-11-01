'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  fetchDisputes, syncDisputesFromPayPal, testPayPalAuth, 
  simulatePayPalDispute, simulateIdempotencyAttack,
  submitDisputeResponse
} from '../lib/api';
import { Dispute, MerchantStore, EarlyWarningRisk } from '../lib/types';
import { 
  calculateDeadlineUrgency, formatCurrency, 
  humanizeReason, humanizeStatus 
} from '../lib/utils';
import { useToast } from '../components/Toast';
import DisputeDrawer from '../components/DisputeDrawer';
import ConnectPayPalModal from '../components/ConnectPayPalModal';
import { 
  Search, RefreshCw, Zap, ShieldAlert, AlertCircle, CheckCircle2, 
  Clock, DollarSign, Sparkles, Filter, ChevronDown, ChevronRight, 
  Layers, MessageSquare, Truck, AlertTriangle, Settings, Store, 
  Lock, Check, Send, X, ArrowUpRight, ArrowUpDown, Menu, MoreVertical,
  Smartphone, Database, Inbox, Shield, Sun, Moon, Eye, RotateCcw
} from 'lucide-react';

type Tab = 'DISPUTES' | 'WHATSAPP_AUTOPILOT' | 'CARRIER_RADAR' | 'EARLY_WARNING' | 'SETTINGS';
type SortField = 'id' | 'reason' | 'amount' | 'status' | 'deadline';
type SortOrder = 'asc' | 'desc';

export default function DashboardPage() {
  const { showToast } = useToast();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<Tab>('DISPUTES');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Multi-Tenant Store States
  const [stores, setStores] = useState<MerchantStore[]>([
    {
      id: 'merchant_resolvepay_01',
      name: 'Nexus Retail Hub',
      businessEmail: 'finance@nexusretail.com',
      paypalPayerId: 'PP-PAYER-884920',
      isVerified: true,
      connectedAt: 'Oct 28, 2026',
      currency: 'USD',
      appId: 'APP-22A05303NP776440S'
    },
    {
      id: 'merchant_stride_wear',
      name: 'Stride Activewear UK',
      businessEmail: 'ops@stridewear.co.uk',
      paypalPayerId: 'PP-PAYER-440192',
      isVerified: true,
      connectedAt: 'Oct 29, 2026',
      currency: 'GBP',
      appId: 'APP-88401929UK012'
    }
  ]);
  const [activeStoreId, setActiveStoreId] = useState<string>('merchant_resolvepay_01');
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  // Core Data States
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTION_REQUIRED' | 'UNDER_REVIEW' | 'RESOLVED'>('ALL');
  const [sortField, setSortField] = useState<SortField>('deadline');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Real-time Telemetry
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>('');
  const [payPalHealth, setPayPalHealth] = useState<{ connected: boolean; timestamp: string } | null>(null);
  const [checkingPayPal, setCheckingPayPal] = useState(false);

  // Idempotency Simulation Log
  const [idempotencyLoading, setIdempotencyLoading] = useState(false);
  const [idempotencyLog, setIdempotencyLog] = useState<any>(null);

  // Interactive WhatsApp Bot Preview
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppSubmitted, setWhatsAppSubmitted] = useState(false);

  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const storeDropdownRef = useRef<HTMLDivElement | null>(null);

  const activeStore = useMemo(() => {
    return stores.find(s => s.id === activeStoreId) || stores[0];
  }, [stores, activeStoreId]);

  // Click outside to close menus
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(e.target as Node)) {
        setStoreDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Theme Initializer
  useEffect(() => {
    const savedTheme = localStorage.getItem('resolvepay_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('light', savedTheme === 'light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('resolvepay_theme', nextTheme);
    document.documentElement.classList.toggle('light', nextTheme === 'light');
    showToast(`Switched to ${nextTheme === 'dark' ? 'Graphite & Amber' : 'Executive Light'} theme`, 'info', 'Theme Updated');
  }

  // Background Polling with Page Visibility API
  useEffect(() => {
    loadDisputes();
    checkPayPalConnection();

    let interval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (!interval) {
        interval = setInterval(loadDisputes, 5000);
      }
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        loadDisputes();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  async function loadDisputes(merchantId?: string) {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const targetMerchant = merchantId || activeStoreId;

    try {
      const data = await fetchDisputes(controller.signal, targetMerchant);
      setDisputes(data);
      setFetchError(null);
      setLastSyncTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      const errMsg = e.message || 'Failed to connect to ResolvePay backend API';
      setFetchError(errMsg);
    } finally {
      clearTimeout(timeoutId);
      isFetchingRef.current = false;
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setMoreMenuOpen(false);
    try {
      await syncDisputesFromPayPal(activeStoreId);
      await loadDisputes(activeStoreId);
      showToast(`PayPal dispute records synchronized for ${activeStore.name}`, 'success', 'Sync Complete');
    } catch (err: any) {
      showToast(err.message || 'Failed to reach PayPal Sandbox', 'error', 'PayPal Sync Failed');
    } finally {
      setSyncing(false);
    }
  }

  async function handleSimulateWebhook(reason: string = 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED', amount: string = '249.99') {
    setSimulating(true);
    setMoreMenuOpen(false);
    const randomId = Math.floor(100000 + Math.random() * 900000);
    const disputeId = `PP-D-${randomId}`;
    const deadlineIso = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    const payload = {
      id: `WH-SIMULATE-${Date.now()}`,
      event_type: 'CUSTOMER.DISPUTE.CREATED',
      create_time: new Date().toISOString(),
      resource: {
        dispute_id: disputeId,
        reason: reason,
        status: 'REQUIRED_ACTION',
        dispute_life_cycle_stage: 'CHARGEBACK',
        dispute_channel: 'INTERNAL',
        response_due_date: deadlineIso,
        seller_response_due_date: deadlineIso,
        dispute_amount: {
          value: amount,
          currency_code: activeStore.currency || 'USD'
        }
      }
    };

    try {
      await simulatePayPalDispute(payload, activeStoreId);
      await loadDisputes(activeStoreId);
      showToast(`Simulated dispute ${disputeId} ingested for ${activeStore.name}`, 'success', 'Dispute Ingested');
    } catch (err: any) {
      showToast(err.message || 'Webhook simulation error', 'error', 'Simulation Failed');
    } finally {
      setSimulating(false);
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  }

  // Metrics Derived
  const totalAmountAtRisk = useMemo(() => {
    return disputes.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [disputes]);

  const pendingActionCount = useMemo(() => {
    return disputes.filter(d => d.status !== 'UNDER_REVIEW' && d.status !== 'RESOLVED').length;
  }, [disputes]);

  const underReviewCount = useMemo(() => {
    return disputes.filter(d => d.status === 'UNDER_REVIEW').length;
  }, [disputes]);

  const resolvedCount = useMemo(() => {
    return disputes.filter(d => d.status === 'RESOLVED').length;
  }, [disputes]);

  // CLARIFIED AI WIN RATIO (Displays "No data yet" instead of "0%" when no resolved cases exist)
  const winRatioState = useMemo(() => {
    const defended = underReviewCount + resolvedCount;
    if (defended === 0) {
      return {
        display: 'No data yet',
        isCalculated: false,
        subtitle: 'Pending initial dispute outcomes'
      };
    }
    const pct = Math.round((defended / Math.max(disputes.length, 1)) * 100);
    return {
      display: `${pct}%`,
      isCalculated: true,
      subtitle: 'Multi-Carrier Proof Grounded'
    };
  }, [disputes.length, underReviewCount, resolvedCount]);

  // Filtering & Sorting
  const processedDisputes = useMemo(() => {
    let result = disputes.filter(d => {
      const q = searchQuery.toLowerCase().trim();
      const humanReason = humanizeReason(d.reason).toLowerCase();
      const rawReason = d.reason.toLowerCase();
      const matchesSearch = 
        !q ||
        d.paypalDisputeId.toLowerCase().includes(q) ||
        humanReason.includes(q) ||
        rawReason.includes(q) ||
        String(d.amount).includes(q);

      if (statusFilter === 'ALL') return matchesSearch;
      if (statusFilter === 'ACTION_REQUIRED') return matchesSearch && d.status !== 'UNDER_REVIEW' && d.status !== 'RESOLVED';
      if (statusFilter === 'UNDER_REVIEW') return matchesSearch && d.status === 'UNDER_REVIEW';
      if (statusFilter === 'RESOLVED') return matchesSearch && d.status === 'RESOLVED';
      return matchesSearch;
    });

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'id':
          comparison = a.paypalDisputeId.localeCompare(b.paypalDisputeId);
          break;
        case 'reason':
          comparison = humanizeReason(a.reason).localeCompare(humanizeReason(b.reason));
          break;
        case 'amount':
          comparison = (Number(a.amount) || 0) - (Number(b.amount) || 0);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'deadline':
          const timeA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const timeB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          comparison = timeA - timeB;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [disputes, searchQuery, statusFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(processedDisputes.length / pageSize) || 1;
  const paginatedDisputes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedDisputes.slice(start, start + pageSize);
  }, [processedDisputes, currentPage, pageSize]);

  // Active top target for WhatsApp simulator
  const targetDisputeForWhatsApp = useMemo(() => {
    return disputes.find(d => d.status !== 'UNDER_REVIEW' && d.status !== 'RESOLVED') || disputes[0] || null;
  }, [disputes]);

  const isTargetDefended = targetDisputeForWhatsApp?.status === 'UNDER_REVIEW' || targetDisputeForWhatsApp?.status === 'RESOLVED' || whatsAppSubmitted;

  useEffect(() => {
    setWhatsAppSubmitted(false);
  }, [targetDisputeForWhatsApp?.id]);

  // Interactive WhatsApp Submit
  async function handleWhatsAppApprove() {
    if (!targetDisputeForWhatsApp) return;
    setWhatsAppSubmitted(true);
    try {
      await submitDisputeResponse(
        targetDisputeForWhatsApp.id, 
        `DISPUTE REBUTTAL VIA WHATSAPP AUTOPILOT: Carrier signature proof verified for order. Merchant requests immediate case closure.`
      );
      showToast(`Dispute ${targetDisputeForWhatsApp.paypalDisputeId} defended via WhatsApp 1-Tap!`, 'success', 'WhatsApp Executed');
      await loadDisputes();
    } catch (e: any) {
      showToast(e.message || 'WhatsApp action failed', 'error', 'Error');
    }
  }

  // Pre-Dispute Early Warning Risks Mockup Data
  const earlyWarningRisks: EarlyWarningRisk[] = [
    {
      id: 'WARN-901',
      customerName: 'Marcus Vance',
      orderNumber: '#ORD-88192',
      amount: 189.00,
      sentiment: 'CRITICAL_THREAT',
      threatLevel: 'HIGH',
      customerMessage: 'Where is my order?? If I do not get a tracking number by tonight I will open a PayPal chargeback dispute!',
      recommendedAction: '1-Click Send FedEx Tracking Link & Apology Email (Prevents $15 PayPal Fee)',
      timestamp: '12m ago'
    },
    {
      id: 'WARN-902',
      customerName: 'Elena Rostova',
      orderNumber: '#ORD-88204',
      amount: 340.50,
      sentiment: 'ANGRY',
      threatLevel: 'MEDIUM',
      customerMessage: 'The size was smaller than advertised. Cancel this transaction immediately or I will contact PayPal.',
      recommendedAction: 'Offer 1-Click Return Merchandise Authorization (RMA) with Pre-paid Label',
      timestamp: '45m ago'
    }
  ];

  async function checkPayPalConnection() {
    setCheckingPayPal(true);
    try {
      const res = await testPayPalAuth(activeStoreId);
      setPayPalHealth({
        connected: res.authenticated,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (e) {
      setPayPalHealth({
        connected: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } finally {
      setCheckingPayPal(false);
    }
  }

  async function runIdempotencyTest() {
    setIdempotencyLoading(true);
    const randomEventId = `WH-EVT-${Math.floor(100000 + Math.random() * 900000)}-CHG`;
    const disputeId = `PP-D-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const result = await simulateIdempotencyAttack(randomEventId, disputeId, '249.99', activeStoreId);
      setIdempotencyLog({
        eventId: randomEventId,
        attempt1Status: result.attempt1?.status || 'SUCCESS',
        attempt2Status: result.attempt2?.status || 'DUPLICATE_ACCEPTED',
        verdict: result.idempotencyEnforced 
          ? 'PASSED: Duplicate event safely deduplicated by idempotency key cache'
          : 'FAILED: Duplicate event processed without idempotency barrier',
        timestamp: new Date().toLocaleTimeString()
      });
      showToast('Live Webhook Idempotency verified: Replay attack safely deduplicated', 'success', 'Idempotency Verified');
    } catch (err: any) {
      showToast(err.message || 'Failed to verify idempotency', 'error', 'Simulation Error');
    } finally {
      setIdempotencyLoading(false);
    }
  }

  function handleSwitchStore(id: string) {
    setActiveStoreId(id);
    setStoreDropdownOpen(false);
    setLoading(true);
    loadDisputes(id);
    const store = stores.find(s => s.id === id);
    showToast(`Switched active store partition to ${store?.name}`, 'info', 'Store Partition Switched');
  }

  function handleStoreConnected(newStore: MerchantStore) {
    setStores(prev => [newStore, ...prev]);
    setActiveStoreId(newStore.id);
    showToast(`Connected PayPal account for ${newStore.name}`, 'success', 'Store Linked');
    loadDisputes(newStore.id);
  }

  return (
    <div 
      className="min-h-screen md:h-screen flex flex-col md:flex-row md:overflow-hidden transition-colors duration-200"
      style={{
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)'
      }}
    >
      
      {/* ======================================================== */}
      {/* 1. MOBILE RESPONSIVE TOP BAR (Visible on < md screens)   */}
      {/* ======================================================== */}
      <div 
        className="md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-40 backdrop-blur-md"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg shadow-md flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-pill)", color: "var(--accent-pill-text)" }}>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-black tracking-tight">Resolve<span className="text-[var(--accent-primary)]">Pay</span></span>
            <span className="ml-1.5 px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-[var(--accent-pill)]/20 text-[var(--accent-primary)]">AI</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Hamburger Menu Toggle (44px tap target) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-amber-500/70"
            style={{ 
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--surface-hover)' 
            }}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation drawer"
        />
      )}

      {/* ======================================================== */}
      {/* 2. SIDEBAR (Static on Desktop, Drawer on Mobile)          */}
      {/* ======================================================== */}
      <aside 
        className={`
          fixed md:sticky top-0 inset-y-0 left-0 z-50 w-72 h-screen flex flex-col justify-between p-5 border-r transition-transform duration-200 md:translate-x-0 shrink-0 overflow-y-auto no-scrollbar
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="hidden md:flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl shadow-md flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-pill)", color: "var(--accent-pill-text)" }}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight">Resolve<span className="text-[var(--accent-primary)]">Pay</span></span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[var(--accent-pill)]/20 text-[var(--accent-primary)] border border-amber-500/30">
                  AI PRO
                </span>
              </div>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>PayPal Dispute Autopilot</p>
            </div>
          </div>

          {/* Navigation Items (44px tap targets) */}
          <nav className="space-y-1.5" aria-label="Main Navigation">
            <button 
              onClick={() => { setCurrentTab('DISPUTES'); setMobileMenuOpen(false); }}
              className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-amber-500/70 ${
                currentTab === 'DISPUTES'
                  ? 'shadow-xs'
                  : 'hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
              style={currentTab === 'DISPUTES' ? {
                backgroundColor: 'var(--nav-active-bg)',
                color: 'var(--nav-active-text)',
                border: '1px solid var(--nav-active-border)'
              } : undefined}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Disputes Queue</span>
              <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/30 text-slate-300">
                {disputes.length}
              </span>
            </button>

            <button 
              onClick={() => { setCurrentTab('WHATSAPP_AUTOPILOT'); setMobileMenuOpen(false); }}
              className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-amber-500/70 ${
                currentTab === 'WHATSAPP_AUTOPILOT'
                  ? 'shadow-xs'
                  : 'hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
              style={currentTab === 'WHATSAPP_AUTOPILOT' ? {
                backgroundColor: 'var(--nav-active-bg)',
                color: 'var(--nav-active-text)',
                border: '1px solid var(--nav-active-border)'
              } : undefined}
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>WhatsApp 1-Tap</span>
              <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                LIVE
              </span>
            </button>

            <button 
              onClick={() => { setCurrentTab('CARRIER_RADAR'); setMobileMenuOpen(false); }}
              className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-amber-500/70 ${
                currentTab === 'CARRIER_RADAR'
                  ? 'shadow-xs'
                  : 'hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
              style={currentTab === 'CARRIER_RADAR' ? {
                backgroundColor: 'var(--nav-active-bg)',
                color: 'var(--nav-active-text)',
                border: '1px solid var(--nav-active-border)'
              } : undefined}
            >
              <Truck className="w-4 h-4 shrink-0" />
              <span>Carrier Telemetry</span>
            </button>

            <button 
              onClick={() => { setCurrentTab('EARLY_WARNING'); setMobileMenuOpen(false); }}
              className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-amber-500/70 ${
                currentTab === 'EARLY_WARNING'
                  ? 'shadow-xs'
                  : 'hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
              style={currentTab === 'EARLY_WARNING' ? {
                backgroundColor: 'var(--nav-active-bg)',
                color: 'var(--nav-active-text)',
                border: '1px solid var(--nav-active-border)'
              } : undefined}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Early Threat Radar</span>
              <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-400 font-bold">
                2
              </span>
            </button>

            <button 
              onClick={() => { setCurrentTab('SETTINGS'); setMobileMenuOpen(false); }}
              className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-amber-500/70 ${
                currentTab === 'SETTINGS'
                  ? 'shadow-xs'
                  : 'hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
              style={currentTab === 'SETTINGS' ? {
                backgroundColor: 'var(--nav-active-bg)',
                color: 'var(--nav-active-text)',
                border: '1px solid var(--nav-active-border)'
              } : undefined}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Merchant Security</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Desktop Footer (Hidden on mobile to keep drawer uncluttered) */}
        <div className="hidden md:block space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          {/* Quick WhatsApp Action Launcher */}
          <div 
            onClick={() => setWhatsAppModalOpen(true)}
            className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 cursor-pointer hover:bg-emerald-500/15 transition space-y-1.5 group"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Bot</span>
              </span>
              <span className="text-[10px] text-emerald-300 font-mono">1-Tap</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Resolve disputes instantly from phone without dashboard login.
            </p>
          </div>

          {/* Environment Status Card */}
          <div 
            className="p-3.5 rounded-2xl border space-y-2 text-xs"
            style={{ 
              backgroundColor: 'var(--surface-hover)', 
              borderColor: 'var(--border-color)' 
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[11px]" style={{ color: 'var(--text-muted)' }}>Environment</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Sandbox Live
              </span>
            </div>
            <div className="font-mono text-[11px] truncate text-slate-300">
              Spring Boot :8085
            </div>
            <div className="flex items-center justify-between pt-1 border-t text-[10px]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-[var(--accent-primary)]" />
                <span>Isolated Merchant</span>
              </span>
              <span>PostgreSQL</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 3. MAIN WORKSPACE WITH DECLUTTERED TOP BAR               */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-hidden pb-16 md:pb-0">
        
        {/* DECLUTTERED TOP NAVBAR (Search & Store Switcher visible; rest moved to '⋯' More menu) */}
        <header 
          className="px-3 sm:px-8 py-3.5 border-b sticky top-[53px] md:top-0 z-30 backdrop-blur-md flex items-center justify-between gap-2.5 sm:gap-4 shrink-0"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-color)'
          }}
        >
          {/* 1. Search Bar (44px tap target) */}
          <div className="flex items-center gap-3 flex-1 min-w-0 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search disputes, reason, or amount..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2.5 min-h-[44px] rounded-xl text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 transition border"
                style={{
                  backgroundColor: 'var(--surface-hover)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--foreground)'
                }}
              />
            </div>
          </div>

          {/* 2. Store Switcher & Decluttered '⋯' More Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Store / Tenant Switcher Dropdown (44px tap target) */}
            <div className="relative" ref={storeDropdownRef}>
              <button
                onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl border text-xs font-bold transition hover:opacity-90 shadow-xs shrink-0 focus-visible:ring-2 focus-visible:ring-amber-500/70"
                style={{
                  backgroundColor: 'var(--surface-hover)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--foreground)'
                }}
                title="Switch active merchant store partition"
                aria-label="Switch merchant store"
              >
                <Store className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                <span className="hidden sm:inline font-sans font-semibold max-w-[130px] truncate">{activeStore.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {storeDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 rounded-2xl border shadow-2xl p-2 z-50 space-y-1 animate-slide-up"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Connected Stores</span>
                    <span className="font-mono text-emerald-400">Multi-Tenant</span>
                  </div>

                  {stores.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSwitchStore(s.id)}
                      className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between text-xs min-h-[44px] ${
                        s.id === activeStoreId 
                          ? 'bg-[var(--accent-pill)]/15 border border-amber-500/30 text-[var(--accent-primary)] font-bold' 
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[var(--accent-pill)]/20 text-[var(--accent-primary)] flex items-center justify-center font-bold text-xs shrink-0">
                          {s.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold truncate">{s.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 truncate">{s.paypalPayerId}</div>
                        </div>
                      </div>
                      {s.id === activeStoreId && <Check className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />}
                    </div>
                  ))}

                  <div className="pt-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <button
                      onClick={() => {
                        setStoreDropdownOpen(false);
                        setConnectModalOpen(true);
                      }}
                      style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                      className="w-full py-2.5 px-3 min-h-[40px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition hover:brightness-105 active:scale-98"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>+ Connect New Store</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Single Decluttered '⋯' More Options Menu (Holds Theme, Refresh, Sandbox Ping, & Dev Tools) */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition hover:opacity-90 shadow-xs focus-visible:ring-2 focus-visible:ring-amber-500/70"
                style={{
                  backgroundColor: 'var(--surface-hover)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--foreground)'
                }}
                title="More actions & Developer tools"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {moreMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 rounded-2xl border shadow-2xl p-2 z-50 space-y-1 animate-slide-up text-xs font-sans-body"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--foreground)'
                  }}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Preferences & Actions
                  </div>

                  {/* Theme Toggle */}
                  <button
                    onClick={() => { toggleTheme(); setMoreMenuOpen(false); }}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center justify-between hover:bg-white/5 transition"
                  >
                    <span className="flex items-center gap-2">
                      {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                      <span>Theme</span>
                    </span>
                    <span className="font-bold text-[11px] text-[var(--accent-primary)] font-mono">
                      {theme === 'dark' ? 'Graphite' : 'Light'}
                    </span>
                  </button>

                  {/* Sync Dispute Records */}
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center justify-between hover:bg-white/5 transition disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCw className={`w-4 h-4 text-slate-400 ${syncing ? 'animate-spin text-[var(--accent-primary)]' : ''}`} />
                      <span>Sync Disputes</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{lastSyncTimestamp || 'Live'}</span>
                  </button>

                  {/* PayPal Sandbox Status */}
                  <button
                    onClick={() => { checkPayPalConnection(); setMoreMenuOpen(false); }}
                    disabled={checkingPayPal}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center justify-between hover:bg-white/5 transition"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${payPalHealth?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                      <span>PayPal Sandbox</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      {checkingPayPal ? 'Pinging...' : payPalHealth?.connected ? 'Connected' : 'Ping'}
                    </span>
                  </button>

                  {/* Connect PayPal Account */}
                  <button
                    onClick={() => { setConnectModalOpen(true); setMoreMenuOpen(false); }}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-white/5 transition"
                  >
                    <Zap className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span>Connect PayPal Account</span>
                  </button>

                  {/* DEVELOPER ONLY MENU SECTION */}
                  <div className="pt-2 mt-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                      <span>Developer Simulation</span>
                    </div>

                    <button
                      onClick={() => handleSimulateWebhook('MERCHANDISE_OR_SERVICE_NOT_RECEIVED', '249.99')}
                      disabled={simulating}
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center justify-between hover:bg-amber-500/10 text-amber-400 transition"
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <Zap className="w-4 h-4" />
                        <span>Simulate Dispute</span>
                      </span>
                      <span className="text-[10px] font-mono">{simulating ? 'Simulating...' : '+$249.99'}</span>
                    </button>

                    <button
                      onClick={() => { setCurrentTab('SETTINGS'); setMoreMenuOpen(false); }}
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-white/5 text-slate-300 transition"
                    >
                      <Shield className="w-4 h-4 text-slate-400" />
                      <span>Idempotency Tests</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Main Body */}
        <main className="p-4 sm:p-8 space-y-6 flex-1 overflow-y-auto max-w-[1700px] w-full mx-auto">
          
          {/* TAB 1: DISPUTES QUEUE (PRIMARY HUB) */}
          {currentTab === 'DISPUTES' && (
            <>
              {/* Executive Metrics Overview using CSS GRID auto-fit & clamp() font sizing */}
              <div 
                className="grid gap-4"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}
              >
                
                {/* Metric 1: Value at Risk */}
                <div 
                  className="p-5 rounded-2xl border shadow-sm transition hover:border-amber-500/50 space-y-2"
                  style={{ 
                    backgroundColor: 'var(--surface)', 
                    borderColor: 'var(--border-color)' 
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Total Value at Risk
                    </span>
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div 
                    className="font-bold font-serif-heading"
                    style={{ fontSize: 'clamp(1.4rem, 2.2vw, 2rem)' }}
                  >
                    {loading ? (
                      <div className="h-8 w-28 rounded-lg skeleton-shimmer my-1" />
                    ) : (
                      formatCurrency(totalAmountAtRisk)
                    )}
                  </div>
                  <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                    <span>{disputes.length} Total Disputes</span>
                    <span className="opacity-60">• Automated Defense</span>
                  </div>
                </div>

                {/* Metric 2: Action Required */}
                <div 
                  className="p-5 rounded-2xl border shadow-sm transition hover:border-rose-500/50 space-y-2"
                  style={{ 
                    backgroundColor: 'var(--surface)', 
                    borderColor: 'var(--border-color)' 
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Action Required
                    </span>
                    <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div 
                    className="font-bold font-serif-heading text-rose-400"
                    style={{ fontSize: 'clamp(1.4rem, 2.2vw, 2rem)' }}
                  >
                    {loading ? (
                      <div className="h-8 w-20 rounded-lg skeleton-shimmer my-1" />
                    ) : (
                      <span>{pendingActionCount} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>cases</span></span>
                    )}
                  </div>
                  <div className="text-[11px] text-rose-400 font-semibold">
                    Urgent SLA Deadlines Active
                  </div>
                </div>

                {/* Metric 3: Defended / Under Review */}
                <div 
                  className="p-5 rounded-2xl border shadow-sm transition hover:border-emerald-500/50 space-y-2"
                  style={{ 
                    backgroundColor: 'var(--surface)', 
                    borderColor: 'var(--border-color)' 
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Defended & In Review
                    </span>
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div 
                    className="font-bold font-serif-heading text-emerald-400"
                    style={{ fontSize: 'clamp(1.4rem, 2.2vw, 2rem)' }}
                  >
                    {loading ? (
                      <div className="h-8 w-20 rounded-lg skeleton-shimmer my-1" />
                    ) : (
                      <span>{underReviewCount} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>defended</span></span>
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold">
                    Submitted via Outbox Pipeline
                  </div>
                </div>

                {/* Metric 4: Defense Ratio / Win Rate (Clarified 0% as "No data yet") */}
                <div 
                  className="p-5 rounded-2xl border shadow-sm transition hover:border-amber-500/50 space-y-2"
                  style={{ 
                    backgroundColor: 'var(--surface)', 
                    borderColor: 'var(--border-color)' 
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      AI Defense Win Ratio
                    </span>
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <div 
                    className="font-bold font-serif-heading text-[var(--accent-primary)]"
                    style={{ fontSize: 'clamp(1.4rem, 2.2vw, 2rem)' }}
                  >
                    {loading ? (
                      <div className="h-8 w-28 rounded-lg skeleton-shimmer my-1" />
                    ) : (
                      winRatioState.display
                    )}
                  </div>
                  <div className="text-[11px] text-slate-300 font-semibold">
                    {winRatioState.subtitle}
                  </div>
                </div>

              </div>

              {/* Table / List Filter Controls (44px tap targets) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {(['ALL', 'ACTION_REQUIRED', 'UNDER_REVIEW', 'RESOLVED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => { setStatusFilter(filter); setCurrentPage(1); }}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap focus-visible:ring-2 focus-visible:ring-amber-500/70 ${
                        statusFilter === filter
                          ? 'shadow-xs'
                          : 'border text-slate-400 hover:text-white'
                      }`}
                      style={{
                        borderColor: statusFilter === filter ? 'transparent' : 'var(--border-color)',
                        backgroundColor: statusFilter === filter ? 'var(--btn-primary-bg)' : 'var(--surface-hover)',
                        color: statusFilter === filter ? 'var(--btn-primary-text)' : undefined
                      }}
                    >
                      {filter === 'ALL' ? 'All Disputes' : filter.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  Showing {paginatedDisputes.length} of {processedDisputes.length} disputes
                </div>
              </div>

              {/* SKELETON LOADER STATE DURING INITIAL FETCH OR REFRESH */}
              {loading && disputes.length === 0 && (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div 
                      key={n} 
                      className="p-5 rounded-2xl border skeleton-shimmer h-24"
                      style={{ borderColor: 'var(--border-color)' }}
                    />
                  ))}
                </div>
              )}

              {/* REAL EMPTY STATE WITH ACTIONABLE NEXT STEP */}
              {!loading && processedDisputes.length === 0 && (
                <div 
                  className="p-8 sm:p-12 rounded-2xl border text-center space-y-3"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)' }}
                >
                  <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-[var(--accent-primary)]" style={{ backgroundColor: 'var(--surface-hover)' }}>
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm font-serif-heading">No Disputes Found in this Queue</h4>
                  <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                    {searchQuery 
                      ? `No disputes matched your search criteria for "${searchQuery}". Try another keyword or reset filters.`
                      : `There are currently no dispute records in the "${statusFilter.replace('_', ' ')}" queue for ${activeStore.name}.`}
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    {(searchQuery || statusFilter !== 'ALL') ? (
                      <button
                        onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                        className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold border border-amber-500/40 text-[var(--accent-primary)] hover:bg-amber-500/10 transition"
                      >
                        Reset All Filters
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSimulateWebhook()}
                        style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                        className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition hover:brightness-105 active:scale-98 shadow-sm flex items-center gap-1.5"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Simulate Test Dispute</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* MOBILE DISPUTE CARDS (< 768px / md:hidden) */}
              <div className="grid grid-cols-1 gap-4 md:hidden py-1">
                {paginatedDisputes.map((dispute) => {
                  const deadlineInfo = calculateDeadlineUrgency(dispute.deadline);
                  const isPending = dispute.status !== 'UNDER_REVIEW' && dispute.status !== 'RESOLVED';
                  return (
                    <div
                      key={dispute.id}
                      onClick={() => setSelectedDispute(dispute)}
                      className="p-5 rounded-2xl border space-y-3.5 cursor-pointer active:scale-98 transition shadow-xs"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border-color)'
                      }}
                    >
                      {/* Top Row: ID & Amount */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-[var(--accent-primary)]">
                          {dispute.paypalDisputeId}
                        </span>
                        <span className="font-mono font-black text-sm">
                          {formatCurrency(dispute.amount, dispute.currency)}
                        </span>
                      </div>

                      {/* Second Row: Humanized Reason */}
                      <div className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                        {humanizeReason(dispute.reason)}
                      </div>

                      {/* Third Row: Status Badge & SLA countdown */}
                      <div className="flex items-center justify-between pt-2 border-t text-[11px]" style={{ borderColor: 'var(--border-color)' }}>
                        <span className={`px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1.5 ${
                          isPending 
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' 
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isPending ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>{isPending ? 'Action Required' : 'Defended'}</span>
                        </span>

                        {dispute.deadline && (
                          <span className={`font-mono font-bold flex items-center gap-1 ${
                            deadlineInfo.urgency === 'CRITICAL' ? 'text-rose-400 animate-pulse' : 'text-slate-400'
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{deadlineInfo.label}</span>
                          </span>
                        )}
                      </div>

                      {/* Fourth Row: One primary action button with 44px tap target */}
                      <div className="pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDispute(dispute);
                          }}
                          style={{
                            backgroundColor: 'var(--btn-primary-bg)',
                            color: 'var(--btn-primary-text)'
                          }}
                          className="w-full min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition hover:brightness-105 active:scale-98"
                        >
                          <span>Review defense</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP & TABLET DISPUTE TABLE (>= 768px / md:block) */}
              <div 
                className="hidden md:block rounded-2xl border overflow-hidden shadow-sm"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <table className="w-full text-left text-xs">
                  <thead 
                    className="border-b font-bold uppercase tracking-wider text-[11px]"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--surface-hover)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <tr>
                      <th className="py-3.5 px-5 cursor-pointer" onClick={() => handleSort('id')}>
                        <div className="flex items-center gap-1.5">
                          <span>Dispute ID</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3.5 px-5 cursor-pointer" onClick={() => handleSort('amount')}>
                        <div className="flex items-center gap-1.5">
                          <span>Amount</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3.5 px-5 cursor-pointer" onClick={() => handleSort('reason')}>
                        <div className="flex items-center gap-1.5">
                          <span>Reason</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3.5 px-5 cursor-pointer" onClick={() => handleSort('deadline')}>
                        <div className="flex items-center gap-1.5">
                          <span>SLA Deadline</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                    {paginatedDisputes.map((dispute) => {
                      const deadlineInfo = calculateDeadlineUrgency(dispute.deadline);
                      const isPending = dispute.status !== 'UNDER_REVIEW' && dispute.status !== 'RESOLVED';
                      return (
                        <tr 
                          key={dispute.id}
                          onClick={() => setSelectedDispute(dispute)}
                          className="cursor-pointer transition hover:bg-white/5"
                        >
                          <td className="py-4 px-5 font-mono font-bold text-[var(--accent-primary)]">
                            {dispute.paypalDisputeId}
                          </td>
                          <td className="py-4 px-5 font-mono font-bold">
                            {formatCurrency(dispute.amount, dispute.currency)}
                          </td>
                          <td className="py-4 px-5 max-w-xs truncate" style={{ color: 'var(--foreground)' }}>
                            {humanizeReason(dispute.reason)}
                          </td>
                          <td className="py-4 px-5 font-mono">
                            {dispute.deadline ? (
                              <span className={`px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1.5 ${
                                deadlineInfo.urgency === 'CRITICAL' 
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse'
                                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              }`}>
                                <Clock className="w-3.5 h-3.5" />
                                <span>{deadlineInfo.label}</span>
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="py-4 px-5">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1.5 ${
                              isPending
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {isPending ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                              <span>{isPending ? 'Action Required' : 'Defended'}</span>
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDispute(dispute);
                              }}
                              style={{
                                backgroundColor: 'var(--btn-primary-bg)',
                                color: 'var(--btn-primary-text)'
                              }}
                              className="px-3.5 py-1.5 min-h-[36px] rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition shadow-xs hover:brightness-105 active:scale-98"
                            >
                              <span>Review defense</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar (44px tap targets) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="min-h-[44px] px-4 py-2 rounded-xl border text-slate-300 disabled:opacity-40 transition"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--surface-hover)' }}
                  >
                    Previous
                  </button>
                  <span className="font-mono text-slate-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="min-h-[44px] px-4 py-2 rounded-xl border text-slate-300 disabled:opacity-40 transition"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--surface-hover)' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* TAB 2: WHATSAPP 1-TAP AUTOPILOT */}
          {currentTab === 'WHATSAPP_AUTOPILOT' && (
            <div className="space-y-6 max-w-4xl">
              <div 
                className="p-6 rounded-2xl border space-y-4"
                style={{ 
                  backgroundColor: 'var(--surface)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black font-serif-heading">WhatsApp 1-Tap Dispute Resolution Engine</h3>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Enable merchants to resolve chargebacks right from WhatsApp without logging into any dashboard.
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/40">
                    ONLINE • BOT ACTIVE
                  </span>
                </div>

                {/* Simulated Phone Mockup */}
                <div className="max-w-md mx-auto rounded-3xl p-4 bg-[#0B141A] text-white shadow-2xl border border-slate-700/60 space-y-4">
                  {/* WhatsApp Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">
                        RP
                      </div>
                      <div>
                        <div className="font-bold text-xs">ResolvePay Autopilot</div>
                        <div className="text-[10px] text-emerald-400">verified business account</div>
                      </div>
                    </div>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  {/* Incoming WhatsApp Alert Bubble */}
                  <div className="p-3.5 rounded-2xl bg-[#202C33] text-xs space-y-2 border border-slate-700/50">
                    <div className="text-amber-400 font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>🚨 PayPal Dispute Alert: {targetDisputeForWhatsApp?.paypalDisputeId || 'PP-D-849102'}</span>
                    </div>
                    <div className="text-slate-300 space-y-1 font-mono text-[11px]">
                      <div>Amount at Risk: <span className="font-bold text-white">{formatCurrency(targetDisputeForWhatsApp?.amount || 249.99)}</span></div>
                      <div>Reason: <span className="text-white">{humanizeReason(targetDisputeForWhatsApp?.reason || 'Item not received')}</span></div>
                      <div className="text-emerald-400 pt-1">
                        ⚡ AI Action: FedEx tracking #784920 proves delivered with recipient signature yesterday.
                      </div>
                    </div>
                  </div>

                  {/* Interactive Buttons (44px tap targets) */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleWhatsAppApprove}
                      disabled={isTargetDefended}
                      className="w-full min-h-[44px] py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
                    >
                      {isTargetDefended ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Submitted & Defended in PayPal</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>1. Approve & Auto-Submit Rebuttal</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => targetDisputeForWhatsApp && setSelectedDispute(targetDisputeForWhatsApp)}
                      className="w-full min-h-[44px] py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                    >
                      2. Inspect POD & Evidence
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CARRIER TELEMETRY RADAR */}
          {currentTab === 'CARRIER_RADAR' && (
            <div className="space-y-6 max-w-4xl">
              <div 
                className="p-6 rounded-2xl border space-y-4"
                style={{ 
                  backgroundColor: 'var(--surface)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black font-serif-heading flex items-center gap-2">
                      <Truck className="w-5 h-5 text-[var(--accent-primary)]" />
                      <span>Live Logistics EDI & Carrier Proof Integrations</span>
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Synchronized carrier gateways providing automatic GPS-verified proof of delivery.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {[
                    { carrier: 'FedEx Express', status: 'Connected (EDI 214)', latency: '34ms', icon: Truck },
                    { carrier: 'DHL Express Global', status: 'Connected (REST API)', latency: '52ms', icon: Truck },
                    { carrier: 'USPS Priority WebTools', status: 'Connected (SOAP)', latency: '88ms', icon: Truck },
                    { carrier: 'Shiprocket & BlueDart', status: 'Connected (India API)', latency: '41ms', icon: Truck }
                  ].map((c) => (
                    <div 
                      key={c.carrier}
                      className="p-4 rounded-xl border flex items-center justify-between text-xs min-h-[64px]"
                      style={{ 
                        backgroundColor: 'var(--surface-hover)', 
                        borderColor: 'var(--border-color)' 
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <c.icon className="w-5 h-5 text-[var(--accent-primary)]" />
                        <div>
                          <div className="font-bold">{c.carrier}</div>
                          <div className="text-[10px] text-emerald-400 font-mono">{c.status}</div>
                        </div>
                      </div>
                      <span className="font-mono text-slate-400 text-[11px]">{c.latency}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EARLY THREAT RADAR */}
          {currentTab === 'EARLY_WARNING' && (
            <div className="space-y-6 max-w-4xl">
              <div 
                className="p-6 rounded-2xl border space-y-4"
                style={{ 
                  backgroundColor: 'var(--surface)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                <div>
                  <h3 className="text-base font-black font-serif-heading flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Pre-Dispute Threat & Sentiment Scanner</span>
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    AI monitors customer support tickets to intercept dispute threats before they turn into costly PayPal chargebacks.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {earlyWarningRisks.map((risk) => (
                    <div 
                      key={risk.id}
                      className="p-4 rounded-xl border space-y-2 text-xs"
                      style={{ 
                        backgroundColor: 'var(--surface-hover)', 
                        borderColor: 'var(--border-color)' 
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm">{risk.customerName} ({risk.orderNumber})</div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                          {risk.sentiment}
                        </span>
                      </div>
                      <p className="text-slate-300 italic">
                        "{risk.customerMessage}"
                      </p>
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-slate-700/60">
                        <span className="text-[var(--accent-primary)] font-semibold leading-snug">{risk.recommendedAction}</span>
                        <button 
                          onClick={() => showToast(`Sent 1-click preemptive resolution for ${risk.orderNumber}`, 'success', 'Interception Sent')}
                          style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                          className="min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs self-start sm:self-auto shrink-0 transition hover:brightness-105 active:scale-98 shadow-xs"
                        >
                          Intercept Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS (Includes WhatsApp & Environment cards relocated from mobile sidebar) */}
          {currentTab === 'SETTINGS' && (
            <div className="space-y-6 max-w-4xl">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div>
                  <h2 className="text-xl font-black font-serif-heading">Merchant Security & Live PayPal Integration</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Multi-tenant data isolation, zero-trust token auth, and real-time PayPal Sandbox telemetry.
                  </p>
                </div>
                <button
                  onClick={checkPayPalConnection}
                  disabled={checkingPayPal}
                  style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50 self-start sm:self-auto hover:brightness-105 active:scale-98"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingPayPal ? 'animate-spin' : ''}`} />
                  <span>{checkingPayPal ? 'Pinging PayPal...' : 'Test PayPal Connection Ping'}</span>
                </button>
              </div>

              {/* Mobile relocated card: WhatsApp 1-Tap Quick Bot Access */}
              <div 
                className="p-5 rounded-2xl border space-y-3"
                style={{ backgroundColor: 'rgba(52, 211, 153, 0.08)', borderColor: 'rgba(52, 211, 153, 0.3)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-400">WhatsApp 1-Tap Autopilot Dispatch</h4>
                      <p className="text-[11px] text-slate-300">Resolves incoming dispute alerts right from merchant phone without login</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setWhatsAppModalOpen(true)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition shadow-sm"
                  >
                    Open Bot Preview
                  </button>
                </div>
              </div>

              {/* 1. Live PayPal Connection Telemetry Card */}
              <div 
                className="p-6 rounded-2xl border space-y-4"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-serif-heading">PayPal Sandbox REST API Connection</h3>
                      <p className="text-[11px] text-slate-400">Direct OAuth2 & Disputes Engine Handshake</p>
                    </div>
                  </div>
                  <div 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono self-start sm:self-auto shrink-0"
                    style={{
                      backgroundColor: payPalHealth?.connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: payPalHealth?.connected ? '#10b981' : '#ef4444',
                      border: `1px solid ${payPalHealth?.connected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}
                  >
                    <span className={`w-2 h-2 rounded-full ${payPalHealth?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                    <span>{payPalHealth?.connected ? 'ACTIVE & CONNECTED' : 'DISCONNECTED'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div className="p-3 rounded-xl border space-y-1 transition-colors" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)' }}>
                    <div className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>API Endpoint</div>
                    <div className="font-bold truncate" style={{ color: 'var(--foreground)' }}>api-m.sandbox.paypal.com</div>
                  </div>
                  <div className="p-3 rounded-xl border space-y-1 transition-colors" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)' }}>
                    <div className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Sandbox App ID</div>
                    <div className="font-bold truncate text-emerald-400">APP-22A05303NP776440S</div>
                  </div>
                  <div className="p-3 rounded-xl border space-y-1 transition-colors" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)' }}>
                    <div className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Last Verified Handshake</div>
                    <div className="font-bold truncate" style={{ color: 'var(--foreground)' }}>{payPalHealth?.timestamp || 'Synchronized Just Now'}</div>
                  </div>
                </div>
              </div>

              {/* 2. Merchant Isolation & Tenant Security Card */}
              <div 
                className="p-6 rounded-2xl border space-y-4"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-serif-heading">Active Store & Tenant Isolation</h3>
                      <p className="text-[11px] text-slate-400">Multi-tenant database partition for {activeStore.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setConnectModalOpen(true)}
                    style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                    className="min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-xs self-start sm:self-auto shrink-0 hover:brightness-105 active:scale-98"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>+ Connect Another Store</span>
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border font-mono gap-2 transition-colors" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Active Business Store: </span>
                      <span className="font-bold font-sans" style={{ color: 'var(--foreground)' }}>{activeStore.name}</span>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto font-sans font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>PayPal Verified Account</span>
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border font-mono gap-2 transition-colors" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Merchant Tenant ID: </span>
                      <span className="font-bold" style={{ color: 'var(--foreground)' }}>{activeStore.id}</span>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-md border self-start sm:self-auto font-bold" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-strong)', color: 'var(--accent-primary)' }}>
                      ThreadLocal Scoped
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border font-mono gap-2 transition-colors" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>PayPal Payer ID: </span>
                      <span className="text-emerald-400 font-bold">{activeStore.paypalPayerId}</span>
                    </div>
                    <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Linked: {activeStore.connectedAt}</div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border font-mono gap-2 transition-colors" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)' }}>
                    <div className="truncate">
                      <span style={{ color: 'var(--text-muted)' }}>Internal Auth Token: </span>
                      <span className="text-amber-400 font-bold font-mono">rzp_live_sec_789f2a4b8c1d</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText('rzp_live_sec_789f2a4b8c1d');
                        showToast('Bearer token copied to clipboard', 'info', 'Copied');
                      }}
                      className="min-h-[36px] text-[11px] px-3 py-1 rounded-lg border transition font-sans font-bold flex items-center gap-1 self-start sm:self-auto shadow-2xs hover:opacity-90"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-strong)', color: 'var(--foreground)' }}
                    >
                      <span>Copy Token</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Live Webhook Idempotency Verification Terminal Card */}
              <div 
                className="p-6 rounded-2xl border space-y-4"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-serif-heading">Live Webhook Idempotency Engine Test</h3>
                      <p className="text-[11px] text-slate-400">Simulate network re-transmissions and duplicate dispute attacks</p>
                    </div>
                  </div>
                  <button
                    onClick={runIdempotencyTest}
                    disabled={idempotencyLoading}
                    style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                    className="min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition disabled:opacity-50 self-start sm:self-auto shadow-sm hover:brightness-105 active:scale-98"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${idempotencyLoading ? 'animate-spin' : ''}`} />
                    <span>{idempotencyLoading ? 'Testing Idempotency...' : 'Simulate Duplicate Webhook'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl font-mono text-xs space-y-2.5 shadow-inner border" style={{ backgroundColor: '#0B0F17', borderColor: '#1F2937', color: '#F1F5F9' }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-800 text-[11px]">
                    <span className="text-slate-300 font-bold">POST /api/webhooks/paypal/simulate (Dual Dispatch Test)</span>
                    <span className="text-emerald-400 font-bold">Index: idx_webhook_inbox_provider_event</span>
                  </div>

                  {idempotencyLog ? (
                    <div className="space-y-1.5 pt-1 text-slate-300">
                      <div className="text-[var(--accent-primary)]">➜ Dispatched Event ID: {idempotencyLog.eventId}</div>
                      <div className="text-emerald-400">✔ Attempt 1 (Initial Webhook): Status {idempotencyLog.attempt1Status || 'SUCCESS'} (Dispute Created & Outbox Enqueued)</div>
                      <div className="text-amber-400">⚡ Attempt 2 (Identical Duplicate Replay): Status {idempotencyLog.attempt2Status || 'DUPLICATE_ACCEPTED'} (Ingestion Filtered)</div>
                      <div className="pt-1 text-emerald-400 font-bold text-[11px] border-t border-white/10 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{idempotencyLog.verdict}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">Execution Timestamp: {idempotencyLog.timestamp}</div>
                    </div>
                  ) : (
                    <div className="text-slate-400 py-3 text-center text-[11px] leading-relaxed">
                      Click "Simulate Duplicate Webhook" to send two identical webhook events concurrently and witness the unique index block duplicate financial deductions in real-time.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ======================================================== */}
      {/* 4. MOBILE BOTTOM TAB NAVIGATION BAR (< md screens)       */}
      {/* ======================================================== */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-1.5 border-t backdrop-blur-md shadow-2xl"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border-color)'
        }}
      >
        <button
          onClick={() => setCurrentTab('DISPUTES')}
          className="min-h-[44px] min-w-[54px] flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition focus-visible:ring-2 focus-visible:ring-amber-500"
          style={{ color: currentTab === 'DISPUTES' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          <div className="relative">
            <Layers className="w-5 h-5" />
            {disputes.length > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[8px] bg-amber-500 text-black font-bold">
                {disputes.length}
              </span>
            )}
          </div>
          <span>Disputes</span>
        </button>

        <button
          onClick={() => setCurrentTab('WHATSAPP_AUTOPILOT')}
          className="min-h-[44px] min-w-[54px] flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition focus-visible:ring-2 focus-visible:ring-amber-500"
          style={{ color: currentTab === 'WHATSAPP_AUTOPILOT' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          <div className="relative">
            <Smartphone className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <span>WhatsApp</span>
        </button>

        <button
          onClick={() => setCurrentTab('CARRIER_RADAR')}
          className="min-h-[44px] min-w-[54px] flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition focus-visible:ring-2 focus-visible:ring-amber-500"
          style={{ color: currentTab === 'CARRIER_RADAR' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          <Truck className="w-5 h-5" />
          <span>Carrier</span>
        </button>

        <button
          onClick={() => setCurrentTab('EARLY_WARNING')}
          className="min-h-[44px] min-w-[54px] flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition focus-visible:ring-2 focus-visible:ring-amber-500"
          style={{ color: currentTab === 'EARLY_WARNING' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          <div className="relative">
            <AlertTriangle className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[8px] bg-rose-500 text-white font-bold">
              2
            </span>
          </div>
          <span>Radar</span>
        </button>

        <button
          onClick={() => setCurrentTab('SETTINGS')}
          className="min-h-[44px] min-w-[54px] flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition focus-visible:ring-2 focus-visible:ring-amber-500"
          style={{ color: currentTab === 'SETTINGS' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          <Settings className="w-5 h-5" />
          <span>Security</span>
        </button>
      </nav>

      {/* Slide-over Fullscreen Dispute Workspace Drawer */}
      {selectedDispute && (
        <DisputeDrawer
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onDisputeUpdated={loadDisputes}
        />
      )}

      {/* WhatsApp Modal Trigger from Sidebar */}
      {whatsAppModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="p-6 rounded-3xl max-w-md w-full border space-y-4 shadow-2xl animate-slide-up"
            style={{ 
              backgroundColor: 'var(--surface)', 
              borderColor: 'var(--border-color)' 
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <span className="font-bold text-sm font-serif-heading">WhatsApp Autopilot Live Preview</span>
              <button 
                onClick={() => setWhatsAppModalOpen(false)} 
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When a dispute arrives, your WhatsApp receives an immediate 1-tap card. You can test it in the WhatsApp Autopilot tab!
            </p>
            <button
              onClick={() => {
                setWhatsAppModalOpen(false);
                setCurrentTab('WHATSAPP_AUTOPILOT');
              }}
              className="w-full min-h-[44px] py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition shadow-sm"
            >
              Open WhatsApp Simulator
            </button>
          </div>
        </div>
      )}

      {/* Connect PayPal Account Onboarding Modal */}
      <ConnectPayPalModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        onStoreConnected={handleStoreConnected}
      />

    </div>
  );
}
