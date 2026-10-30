'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dispute, EarlyWarningRisk } from '../lib/types';
import { fetchDisputes, syncDisputesFromPayPal, simulatePayPalDispute, submitDisputeResponse } from '../lib/api';
import DisputeDrawer from '../components/DisputeDrawer';
import { useToast } from '../components/Toast';
import { calculateDeadlineUrgency, formatCurrency, calculateTacticalRecommendation } from '../lib/utils';
import { 
  ShieldAlert, RefreshCw, Clock, DollarSign, CheckCircle2, 
  AlertCircle, ArrowUpRight, Search, Activity, Layers, Sparkles,
  Zap, FileStack, Settings, History, Shield, Check,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
  Database, Server, Cpu, FileCheck, Lock, ExternalLink,
  Menu, X, Sun, Moon, Smartphone, MessageSquare, Truck,
  AlertTriangle, Send, Scale, User, Filter, SlidersHorizontal, ChevronDown
} from 'lucide-react';

type NavTab = 'DISPUTES' | 'WHATSAPP_AUTOPILOT' | 'CARRIER_RADAR' | 'EARLY_WARNING' | 'SETTINGS';
type SortField = 'id' | 'reason' | 'amount' | 'status' | 'deadline';
type SortOrder = 'asc' | 'desc';

export default function DashboardPage() {
  const { showToast } = useToast();
  
  // Theme Toggle: 'dark' (Luxe Obsidian) or 'light' (Crisp Slate)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // Mobile Navigation Drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // App Navigation Tabs
  const [currentTab, setCurrentTab] = useState<NavTab>('DISPUTES');
  
  // Dispute Data State
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>('Live');

  // Interactive WhatsApp Simulator Modal
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppSubmitted, setWhatsAppSubmitted] = useState(false);

  // Sorting and Pagination State
  const [sortField, setSortField] = useState<SortField>('deadline');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Polling Concurrency and In-Flight Request Guards
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize theme from system or localStorage
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
    showToast(`Switched to ${nextTheme === 'dark' ? 'Dark Luxe FinTech' : 'Executive Light'} theme`, 'info', 'Theme Updated');
  }

  // Background Polling with Page Visibility API
  useEffect(() => {
    loadDisputes();

    let interval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (!interval) {
        interval = setInterval(loadDisputes, 4000);
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

  async function loadDisputes() {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const data = await fetchDisputes(controller.signal);
      setDisputes(data);
      setFetchError(null);
      setLastSyncTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error('Failed to load disputes', e);
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
    try {
      await syncDisputesFromPayPal();
      await loadDisputes();
      showToast('PayPal dispute records successfully synchronized', 'success', 'Sync Complete');
    } catch (err: any) {
      showToast(err.message || 'Failed to reach PayPal Sandbox', 'error', 'PayPal Sync Failed');
    } finally {
      setSyncing(false);
    }
  }

  async function handleSimulateWebhook(reason: string = 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED', amount: string = '289.50') {
    setSimulating(true);
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
          currency_code: 'USD'
        }
      }
    };

    try {
      await simulatePayPalDispute(payload);
      await loadDisputes();
      showToast(`Simulated dispute ${disputeId} ingested with 48h SLA deadline`, 'success', 'Dispute Ingested');
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

  const defenseRatio = useMemo(() => {
    if (disputes.length === 0) return '100%';
    const defended = underReviewCount + resolvedCount;
    return `${Math.round((defended / disputes.length) * 100)}%`;
  }, [disputes.length, underReviewCount, resolvedCount]);

  // Filtering & Sorting
  const processedDisputes = useMemo(() => {
    let result = disputes.filter(d => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        d.paypalDisputeId.toLowerCase().includes(q) ||
        d.reason.toLowerCase().includes(q) ||
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
          comparison = a.reason.localeCompare(b.reason);
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

  return (
    <div 
      className="min-h-screen flex flex-col md:flex-row transition-colors duration-200"
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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-black tracking-tight">Resolve<span className="text-sky-500">Pay</span></span>
            <span className="ml-1.5 px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-sky-500/20 text-sky-400">AI</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg border transition hover:opacity-80"
            style={{ 
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--surface-hover)' 
            }}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border transition hover:opacity-80"
            style={{ 
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--surface-hover)' 
            }}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SIDEBAR (Desktop & Mobile Drawer)                     */}
      {/* ======================================================== */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-72 flex flex-col justify-between p-5 border-r transition-transform duration-300 md:translate-x-0 shrink-0
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight">Resolve<span className="text-sky-500">Pay</span></span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  AI PRO
                </span>
              </div>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>PayPal Dispute Autopilot</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            <button 
              onClick={() => { setCurrentTab('DISPUTES'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                currentTab === 'DISPUTES'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : 'hover:bg-white/5 opacity-80 hover:opacity-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Disputes Queue</span>
              <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/30">
                {disputes.length}
              </span>
            </button>

            <button 
              onClick={() => { setCurrentTab('WHATSAPP_AUTOPILOT'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                currentTab === 'WHATSAPP_AUTOPILOT'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'hover:bg-white/5 opacity-80 hover:opacity-100'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp 1-Tap</span>
              <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                LIVE
              </span>
            </button>

            <button 
              onClick={() => { setCurrentTab('CARRIER_RADAR'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                currentTab === 'CARRIER_RADAR'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : 'hover:bg-white/5 opacity-80 hover:opacity-100'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Carrier Telemetry</span>
            </button>

            <button 
              onClick={() => { setCurrentTab('EARLY_WARNING'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                currentTab === 'EARLY_WARNING'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : 'hover:bg-white/5 opacity-80 hover:opacity-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Early Threat Radar</span>
              <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-400">
                2
              </span>
            </button>

            <button 
              onClick={() => { setCurrentTab('SETTINGS'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                currentTab === 'SETTINGS'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : 'hover:bg-white/5 opacity-80 hover:opacity-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Merchant Security</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Info Card */}
        <div className="space-y-3">
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

          {/* Merchant Status */}
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
            <div className="font-mono text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
              Spring Boot :8085
            </div>
            <div className="flex items-center justify-between pt-1 border-t text-[10px]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-sky-400" />
                <span>Isolated Merchant</span>
              </span>
              <span>PostgreSQL</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 3. MAIN CONTENT WORKSPACE                                */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header 
          className="px-4 sm:px-8 py-3.5 border-b sticky top-0 z-30 backdrop-blur-md flex items-center justify-between gap-4"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-color)'
          }}
        >
          {/* Search Bar */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Dispute ID, Reason, or Amount..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 transition border"
                style={{
                  backgroundColor: 'var(--surface-hover)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--foreground)'
                }}
              />
            </div>
          </div>

          {/* Action Center */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle on Desktop */}
            <button
              onClick={toggleTheme}
              className="hidden md:flex p-2 rounded-xl border transition hover:opacity-80"
              style={{ 
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--surface-hover)' 
              }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* Quick Demo Simulator */}
            <button
              onClick={() => handleSimulateWebhook('MERCHANDISE_OR_SERVICE_NOT_RECEIVED', '249.99')}
              disabled={simulating}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
              title="Simulates incoming PayPal dispute"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{simulating ? 'Simulating...' : '+ Simulate Dispute'}</span>
            </button>

            {/* Sync Button */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="p-2 rounded-xl border transition disabled:opacity-50"
              style={{ 
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--surface-hover)' 
              }}
              title="Sync from PayPal Sandbox"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </header>

        {/* Dynamic Main Body */}
        <main className="p-4 sm:p-8 space-y-6 flex-1 overflow-y-auto max-w-[1700px] w-full mx-auto">
          
          {/* TAB 1: DISPUTES QUEUE (PRIMARY HUB) */}
          {currentTab === 'DISPUTES' && (
            <>
              {/* Executive Metrics Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Metric 1: Value at Risk */}
                <div 
                  className="p-5 rounded-2xl border shadow-sm transition hover:border-sky-500/50 space-y-2"
                  style={{ 
                    backgroundColor: 'var(--surface)', 
                    borderColor: 'var(--border-color)' 
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Total Value at Risk
                    </span>
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono">
                    {formatCurrency(totalAmountAtRisk)}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
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
                  <div className="text-2xl sm:text-3xl font-black font-mono text-rose-400">
                    {pendingActionCount} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>cases</span>
                  </div>
                  <div className="text-[11px] text-rose-400 font-semibold">
                    Urgent SLA Deadlines Active
                  </div>
                </div>

                {/* Metric 3: Defended / Under Review */}
                <div 
                  className="p-5 rounded-2xl border shadow-sm transition hover:border-sky-500/50 space-y-2"
                  style={{ 
                    backgroundColor: 'var(--surface)', 
                    borderColor: 'var(--border-color)' 
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Defended & In Review
                    </span>
                    <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-sky-400">
                    {underReviewCount} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>defended</span>
                  </div>
                  <div className="text-[11px] text-sky-400 font-semibold">
                    Submitted via Outbox Pipeline
                  </div>
                </div>

                {/* Metric 4: Defense Ratio / Win Rate */}
                <div 
                  className="p-5 rounded-2xl border shadow-sm transition hover:border-emerald-500/50 space-y-2"
                  style={{ 
                    backgroundColor: 'var(--surface)', 
                    borderColor: 'var(--border-color)' 
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      AI Defense Win Ratio
                    </span>
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                    {defenseRatio}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold">
                    Multi-Carrier Proof Grounded
                  </div>
                </div>

              </div>

              {/* Table / List Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {(['ALL', 'ACTION_REQUIRED', 'UNDER_REVIEW', 'RESOLVED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => { setStatusFilter(filter); setCurrentPage(1); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        statusFilter === filter
                          ? 'bg-sky-500 text-white shadow-xs'
                          : 'border text-slate-400 hover:text-white'
                      }`}
                      style={{
                        borderColor: statusFilter === filter ? 'transparent' : 'var(--border-color)',
                        backgroundColor: statusFilter === filter ? undefined : 'var(--surface-hover)'
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

              {/* MOBILE DISPUTE CARDS (Visible on mobile screens < md) */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {paginatedDisputes.map((dispute) => {
                  const deadlineInfo = calculateDeadlineUrgency(dispute.deadline);
                  const isPending = dispute.status !== 'UNDER_REVIEW' && dispute.status !== 'RESOLVED';
                  return (
                    <div
                      key={dispute.id}
                      onClick={() => setSelectedDispute(dispute)}
                      className="p-4 rounded-2xl border space-y-3 cursor-pointer active:scale-98 transition"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border-color)'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-sky-400">
                          {dispute.paypalDisputeId}
                        </span>
                        <span className="font-mono font-black text-sm">
                          {formatCurrency(dispute.amount, dispute.currency)}
                        </span>
                      </div>

                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {dispute.reason}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t text-[11px]" style={{ borderColor: 'var(--border-color)' }}>
                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                          isPending ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'
                        }`}>
                          {isPending ? 'Action Required' : 'Defended'}
                        </span>

                        {dispute.deadline && (
                          <span className={`font-mono font-bold flex items-center gap-1 ${
                            deadlineInfo.urgency === 'CRITICAL' ? 'text-rose-400 animate-pulse' : 'text-slate-400'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {deadlineInfo.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP & TABLET DISPUTE TABLE (Visible on >= md screens) */}
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
                          <td className="py-4 px-5 font-mono font-bold text-sky-400">
                            {dispute.paypalDisputeId}
                          </td>
                          <td className="py-4 px-5 font-mono font-bold">
                            {formatCurrency(dispute.amount, dispute.currency)}
                          </td>
                          <td className="py-4 px-5 max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                            {dispute.reason}
                          </td>
                          <td className="py-4 px-5 font-mono">
                            {dispute.deadline ? (
                              <span className={`px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                                deadlineInfo.urgency === 'CRITICAL' 
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse'
                                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              }`}>
                                <Clock className="w-3 h-3" />
                                {deadlineInfo.label}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="py-4 px-5">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                              isPending
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
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
                              className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 font-bold text-xs inline-flex items-center gap-1 transition"
                            >
                              <span>Review Defense</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border text-slate-300 disabled:opacity-40 transition"
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
                    className="px-3 py-1.5 rounded-lg border text-slate-300 disabled:opacity-40 transition"
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
                      <h3 className="text-base font-black">WhatsApp 1-Tap Dispute Resolution Engine</h3>
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
                      <div>Reason: <span className="text-white">{targetDisputeForWhatsApp?.reason || 'MERCHANDISE_NOT_RECEIVED'}</span></div>
                      <div className="text-emerald-400 pt-1">
                        ⚡ AI Action: FedEx tracking #784920 proves delivered with recipient signature yesterday.
                      </div>
                    </div>
                  </div>

                  {/* Interactive Button in WhatsApp */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleWhatsAppApprove}
                      disabled={isTargetDefended}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
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
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
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
                    <h3 className="text-base font-black flex items-center gap-2">
                      <Truck className="w-5 h-5 text-sky-400" />
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
                      className="p-4 rounded-xl border flex items-center justify-between text-xs"
                      style={{ 
                        backgroundColor: 'var(--surface-hover)', 
                        borderColor: 'var(--border-color)' 
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <c.icon className="w-5 h-5 text-sky-400" />
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
                  <h3 className="text-base font-black flex items-center gap-2 text-amber-400">
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
                      <div className="pt-2 flex items-center justify-between border-t border-slate-700/60">
                        <span className="text-sky-400 font-semibold">{risk.recommendedAction}</span>
                        <button 
                          onClick={() => showToast(`Sent 1-click preemptive resolution for ${risk.orderNumber}`, 'success', 'Interception Sent')}
                          className="px-3 py-1 rounded bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px]"
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

          {/* TAB 5: SETTINGS */}
          {currentTab === 'SETTINGS' && (
            <div className="space-y-6 max-w-3xl">
              <div 
                className="p-6 rounded-2xl border space-y-4"
                style={{ 
                  backgroundColor: 'var(--surface)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                <h3 className="text-base font-black">Merchant Security & Isolation Settings</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-black/20 font-mono space-y-1">
                    <div>Merchant ID: <span className="text-sky-400 font-bold">merchant_resolvepay_01</span></div>
                    <div>Isolation Strategy: Multi-Tenant TenantContext Scoped Repository</div>
                    <div>Webhook Idempotency: WebhookInbox Unique Index Enforcement</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Slide-over Dispute Workspace Drawer */}
      {selectedDispute && (
        <DisputeDrawer
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onDisputeUpdated={loadDisputes}
        />
      )}

      {/* WhatsApp Modal Trigger from Sidebar */}
      {whatsAppModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div 
            className="p-6 rounded-3xl max-w-md w-full border space-y-4 shadow-2xl"
            style={{ 
              backgroundColor: 'var(--surface)', 
              borderColor: 'var(--border-color)' 
            }}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-700">
              <span className="font-bold text-sm">WhatsApp Autopilot Live Preview</span>
              <button onClick={() => setWhatsAppModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When a dispute arrives, your WhatsApp receives an immediate 1-tap card. You can test it in the WhatsApp Autopilot tab on the left sidebar!
            </p>
            <button
              onClick={() => {
                setWhatsAppModalOpen(false);
                setCurrentTab('WHATSAPP_AUTOPILOT');
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition"
            >
              Open WhatsApp Simulator
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
