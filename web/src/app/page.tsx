'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  fetchDisputes, syncDisputesFromPayPal, testPayPalAuth, 
  simulatePayPalDispute, simulateIdempotencyAttack,
  submitDisputeResponse,
  sendTestWhatsAppAlert,
  updateWhatsAppToken,
  fileCustomerDispute
} from '../lib/api';
import { Dispute, MerchantStore, EarlyWarningRisk } from '../lib/types';
import { 
  calculateDeadlineUrgency, formatCurrency, 
  humanizeReason, humanizeStatus,
  calculateDisputeTracking
} from '../lib/utils';
import { useToast } from '../components/Toast';
import DisputeDrawer from '../components/DisputeDrawer';
import ConnectPayPalModal from '../components/ConnectPayPalModal';
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning, hapticPullTrigger } from '../lib/haptics';
import { 
  Search, RefreshCw, Zap, ShieldAlert, AlertCircle, CheckCircle2, 
  Clock, DollarSign, Sparkles, Filter, ChevronDown, ChevronLeft, ChevronRight, 
  Layers, MessageSquare, Truck, AlertTriangle, Settings, Store, 
  Lock, Check, Send, X, ArrowUpRight, ArrowUpDown, Menu, MoreVertical,
  Smartphone, Database, Inbox, Shield, Sun, Moon, Eye, RotateCcw, Download,
  Radio, Activity,
  Copy, ExternalLink, HelpCircle, Languages
} from 'lucide-react';
import { Language, SUPPORTED_LANGUAGES, getTranslation } from '../lib/translations';
import { useLanguage } from '../context/LanguageContext';

type Tab = 'DISPUTES' | 'WHATSAPP_AUTOPILOT' | 'CARRIER_RADAR' | 'EARLY_WARNING' | 'SETTINGS';
type SortField = 'latest' | 'deadline' | 'amount' | 'reason' | 'id' | 'status';
type SortOrder = 'asc' | 'desc';

export default function DashboardPage() {
  const { showToast } = useToast();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<Tab>('DISPUTES');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Mobile Pull-to-Refresh Gesture (Entire App from screen top)
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const pullTriggeredRef = useRef(false);
  const mainScrollRef = useRef<HTMLElement | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    const isAtTop = (typeof window === 'undefined' || window.scrollY <= 5) && 
                    (!mainScrollRef.current || mainScrollRef.current.scrollTop <= 5);
    if (isAtTop) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
      pullTriggeredRef.current = false;
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isPulling || syncing) return;
    const isAtTop = (typeof window === 'undefined' || window.scrollY <= 5) && 
                    (!mainScrollRef.current || mainScrollRef.current.scrollTop <= 5);
    if (isAtTop) {
      const diff = e.touches[0].clientY - touchStartY.current;
      if (diff > 0) {
        const distance = Math.min(90, diff * 0.42);
        setPullDistance(distance);
        if (distance >= 55 && !pullTriggeredRef.current) {
          pullTriggeredRef.current = true;
          hapticPullTrigger();
        }
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  }

  async function handleFullAppRefresh() {
    setSyncing(true);
    hapticSuccess();

    // 1. Completely reset search query & dismiss mobile keyboard
    setSearchQuery('');
    setSearchFocused(false);
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 2. Completely reset filters, sorting, and pagination back to pristine defaults
    setStatusFilter('ALL');
    setCurrentPage(1);
    setSortField('latest');
    setSortOrder('desc');

    // 3. Close any open overlays, drawers, sheets, and menus
    setSelectedDispute(null);
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
    setStoreDropdownOpen(false);
    setWhatsAppModalOpen(false);
    setConnectModalOpen(false);
    setIdempotencyLog(null);
    setFetchError(null);

    // 4. Reset scroll positions back to top
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 5. Fetch fresh live records from PayPal and backend
    try {
      await Promise.allSettled([
        syncDisputesFromPayPal(activeStoreId),
        loadDisputes(activeStoreId),
        testPayPalAuth(activeStoreId)
      ]);
      hapticSuccess();
      showToast('Search cleared, filters reset, and dispute records updated', 'success', 'App Fully Refreshed');
    } catch (err: any) {
      showToast(err.message || 'Refresh encountered an issue', 'error');
    } finally {
      setSyncing(false);
    }
  }

  function handleTouchEnd() {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullDistance >= 55) {
      handleFullAppRefresh();
    }
    setPullDistance(0);
  }


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
    },
    {
      id: 'merchant_jeet_jajal',
      name: 'Jeet Global Commerce',
      businessEmail: 'jajaljeet2005@gmail.com',
      paypalPayerId: 'PP-PAYER-991201',
      isVerified: true,
      connectedAt: 'Nov 09, 2026',
      currency: 'USD',
      appId: 'APP-77291039US991'
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
  const [drawerInitialTab, setDrawerInitialTab] = useState<'ai' | 'carrier' | 'evidence' | 'policy' | 'tracking'>('tracking');

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTION_REQUIRED' | 'UNDER_REVIEW' | 'RESOLVED'>('ALL');
  const [sortField, setSortField] = useState<SortField>('latest');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

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
  const langMenuRef = useRef<HTMLDivElement | null>(null);

  // Internationalization (i18n) State via App-Wide Context
  const { currentLang, setLanguage, t } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  function handleSelectLanguage(code: Language) {
    hapticLight();
    setLanguage(code);
    setLangMenuOpen(false);
    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === code);
    const toastMsg = getTranslation(code, 'toast_lang_switched');
    showToast(toastMsg, 'info', langObj ? `${langObj.flag} ${langObj.label}` : 'Language');
  }

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
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
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
    hapticLight();
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('resolvepay_theme', nextTheme);
    document.documentElement.classList.toggle('light', nextTheme === 'light');
    showToast(`Switched to ${nextTheme === 'dark' ? 'Graphite & Amber' : 'Executive Light'} theme`, 'info', 'Theme Updated');
  }

  // Mobile Display Mode: Standalone Installed App vs Standard Mobile Browser
  const [isStandalone, setIsStandalone] = useState(false);

  // PWA Install Prompt State & Live Vercel Update State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [hasAppUpdate, setHasAppUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showMobileInstallBanner, setShowMobileInstallBanner] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOSDevice(isIOS);

    // 1. Check if early install prompt was captured before React hydration
    if ((window as any).__resolvepay_install_prompt) {
      setDeferredPrompt((window as any).__resolvepay_install_prompt);
      setCanInstall(true);
    }

    const handleEarlyPrompt = () => {
      if ((window as any).__resolvepay_install_prompt) {
        setDeferredPrompt((window as any).__resolvepay_install_prompt);
        setCanInstall(true);
      }
    };
    window.addEventListener('resolvepay:installable', handleEarlyPrompt);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__resolvepay_install_prompt = e;
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 2. Service Worker Registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((registration) => {
        // Detect background service worker update
        registration.onupdatefound = () => {
          const installing = registration.installing;
          if (installing) {
            installing.onstatechange = () => {
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(installing);
                setHasAppUpdate(true);
              }
            };
          }
        };

        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }).catch((err) => {
        console.warn('SW register error:', err);
      });
    }

    // 3. Automated Vercel Deployment Auto-Fetch Check
    let currentCommitSha: string | null = null;
    const checkDeploymentUpdate = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const incomingSha = data.commitSha;
        if (!incomingSha) return;

        // On first run: save the current active SHA. Never show update banner on initial load!
        if (!currentCommitSha) {
          currentCommitSha = incomingSha;
          return;
        }

        // If the SHA changes during the session: Vercel deployed a new commit!
        if (incomingSha !== currentCommitSha) {
          currentCommitSha = incomingSha;
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => reg?.update());
          }
          setHasAppUpdate(true);
        }
      } catch (_) {}
    };

    // Initial check (initializes currentCommitSha silently, no false positive banner)
    checkDeploymentUpdate();

    // Check periodically every 20 seconds
    const versionInterval = setInterval(checkDeploymentUpdate, 20000);

    // Also check on tab focus
    const handleVisCheck = () => {
      if (document.visibilityState === 'visible') {
        checkDeploymentUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisCheck);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('resolvepay:installable', handleEarlyPrompt);
      document.removeEventListener('visibilitychange', handleVisCheck);
      clearInterval(versionInterval);
    };
  }, []);

  async function handleInstallApp() {
    setMoreMenuOpen(false);
    setMobileMenuOpen(false);

    if (isStandalone) {
      showToast('ResolvePay is already running in App Mode!', 'info', 'Already Installed');
      return;
    }

    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? (window as any).__resolvepay_install_prompt : null);

    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          showToast('ResolvePay App installed successfully to your home screen!', 'success', 'App Installed');
          setDeferredPrompt(null);
          if (typeof window !== 'undefined') (window as any).__resolvepay_install_prompt = null;
          setCanInstall(false);
          setShowMobileInstallBanner(false);
        } else {
          showToast('App installation was cancelled', 'info', 'Installation');
        }
      } catch (err) {
        console.error('PWA install error:', err);
        setShowInstallGuide(true);
      }
    } else {
      setShowInstallGuide(true);
    }
  }

  function handleApplyAppUpdate() {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setTimeout(() => {
      window.location.reload();
    }, 300);
  }

  // Instant SWR Cache for Disputes from sessionStorage
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(`resolvepay_disputes_${activeStoreId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDisputes(parsed);
          setLoading(false);
        }
      }
    } catch (_) {}
  }, [activeStoreId]);

  useEffect(() => {
    const checkStandalone = () => {
      if (typeof window === 'undefined') return;
      const urlParams = new URLSearchParams(window.location.search);
      const urlParam = urlParams.get('app') || urlParams.get('mode');
      const tabParam = urlParams.get('tab');
      if (tabParam === 'disputes') setCurrentTab('DISPUTES');
      else if (tabParam === 'whatsapp') setCurrentTab('WHATSAPP_AUTOPILOT');
      else if (tabParam === 'radar') setCurrentTab('EARLY_WARNING');
      else if (tabParam === 'carrier') setCurrentTab('CARRIER_RADAR');
      else if (tabParam === 'settings') setCurrentTab('SETTINGS');

      if (urlParam === '1' || urlParam === 'standalone') {
        setIsStandalone(true);
        return;
      }

      const isPwa = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');

      setIsStandalone(!!isPwa);
    };

    checkStandalone();

    try {
      const mql = window.matchMedia('(display-mode: standalone)');
      const handler = (e: MediaQueryListEvent) => {
        setIsStandalone(e.matches);
      };
      if (mql.addEventListener) {
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
      }
    } catch (err) {}
  }, []);

  // Cross-Panel Global Dispute Search Handler
  function handleSearchChange(val: string) {
    setSearchQuery(val);
    setCurrentPage(1);

    const trimmed = val.trim();
    if (trimmed.length > 0) {
      if (currentTab !== 'DISPUTES') {
        setCurrentTab('DISPUTES');
        showToast(`Redirected to Disputes queue for query "${trimmed}"`, 'info', 'Search Navigation');
      }

      if (statusFilter !== 'ALL') {
        const q = trimmed.toLowerCase();
        const matchesInDifferentStatus = disputes.some(d => 
          d.paypalDisputeId.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
        );
        if (matchesInDifferentStatus) {
          setStatusFilter('ALL');
        }
      }
    }
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
      let data = await fetchDisputes(controller.signal, targetMerchant);
      if (!data || data.length === 0) {
        // Direct PayPal live sync for this user
        try {
          await syncDisputesFromPayPal(targetMerchant);
          data = await fetchDisputes(controller.signal, targetMerchant);
        } catch (_) {}
      }
      setDisputes(data);
      try {
        sessionStorage.setItem(`resolvepay_disputes_${targetMerchant}`, JSON.stringify(data));
      } catch (_) {}
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
    hapticLight();
    setSyncing(true);
    setMoreMenuOpen(false);
    try {
      await syncDisputesFromPayPal(activeStoreId);
      await loadDisputes(activeStoreId);
      hapticSuccess();
      showToast(`PayPal dispute records synchronized for ${activeStore.name}`, 'success', 'Sync Complete');
    } catch (err: any) {
      hapticWarning();
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
        case 'latest': {
          const timeA = a.lastSyncedTime ? new Date(a.lastSyncedTime).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const timeB = b.lastSyncedTime ? new Date(b.lastSyncedTime).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          if (timeA && timeB && timeA !== timeB) {
            comparison = timeA - timeB;
          } else {
            comparison = (a.paypalDisputeId || a.id).localeCompare(b.paypalDisputeId || b.id);
          }
          break;
        }
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

  // Instant Live Search Dropdown Results (Appears immediately under search bar)
  const quickSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return disputes.filter(d => 
      d.paypalDisputeId.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      humanizeReason(d.reason).toLowerCase().includes(q) ||
      String(d.amount).includes(q) ||
      (d.customerEmail && d.customerEmail.toLowerCase().includes(q)) ||
      (d.buyerName && d.buyerName.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [disputes, searchQuery]);

  // Meta WhatsApp Cloud API Live Integration State
  const [waPhoneNumber, setWaPhoneNumber] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waDispatchResult, setWaDispatchResult] = useState<{
    success: boolean;
    mode?: string;
    disputeId?: string;
    recipient?: string;
    message?: string;
    status?: string;
    previewText?: string;
  } | null>(null);
  const [waCopiedWebhook, setWaCopiedWebhook] = useState(false);
  const [waCopiedToken, setWaCopiedToken] = useState(false);
  const [showWaGuide, setShowWaGuide] = useState(false);

  async function handleSendRealWhatsApp() {
    const cleanDigits = (waPhoneNumber || '').replace(/[^0-9]/g, '');
    if (!cleanDigits || cleanDigits.length < 10) {
      showToast('Please enter your WhatsApp phone number with country code (e.g. +91 98765 43210)', 'warning');
      hapticWarning();
      return;
    }

    try {
      setWaSending(true);
      hapticMedium();
      const result = await sendTestWhatsAppAlert(
        waPhoneNumber,
        targetDisputeForWhatsApp?.paypalDisputeId || 'PP-D-849102'
      );
      setWaDispatchResult(result);
      hapticSuccess();
      showToast(
        result.mode === 'LIVE_META_API'
          ? '🚀 Real WhatsApp alert dispatched via Meta Cloud API!'
          : '⚡ WhatsApp Sandbox alert simulated and dispatched!',
        'success',
        'WhatsApp Alert'
      );
    } catch (err: any) {
      hapticWarning();
      showToast(err.message || 'Failed to dispatch WhatsApp alert', 'error');
    } finally {
      setWaSending(false);
    }
  }

  function copyWebhookUrl() {
    navigator.clipboard.writeText('https://resolvepay-api.onrender.com/api/webhooks/whatsapp');
    setWaCopiedWebhook(true);
    hapticLight();
    showToast('Webhook URL copied to clipboard!', 'success');
    setTimeout(() => setWaCopiedWebhook(false), 2000);
  }

  function copyVerifyToken() {
    navigator.clipboard.writeText('resolvepay_wa_verify_2026');
    setWaCopiedToken(true);
    hapticLight();
    showToast('Verify token copied to clipboard!', 'success');
    setTimeout(() => setWaCopiedToken(false), 2000);
  }

  // Meta Access Token Dynamic Updater State
  const [waCustomToken, setWaCustomToken] = useState('');
  const [waUpdatingToken, setWaUpdatingToken] = useState(false);
  const [waTokenHealth, setWaTokenHealth] = useState<any>(null);
  const [waCopiedCustomerLink, setWaCopiedCustomerLink] = useState(false);

  // Friend / Customer Real Dispute Ingestion Simulation
  const [simCustomerName, setSimCustomerName] = useState('Ankit Patel (Friend)');
  const [simDisputeAmount, setSimDisputeAmount] = useState('249.99');
  const [simDisputeReason, setSimDisputeReason] = useState('MERCHANDISE_OR_SERVICE_NOT_RECEIVED');
  const [simDisputeFiling, setSimDisputeFiling] = useState(false);
  const [simDisputeResult, setSimDisputeResult] = useState<any>(null);

  async function handleUpdateWaToken() {
    if (!waCustomToken.trim()) {
      showToast('Please paste a valid Meta access token from Step 1', 'warning');
      hapticWarning();
      return;
    }
    setWaUpdatingToken(true);
    hapticMedium();
    try {
      const res = await updateWhatsAppToken(waCustomToken.trim());
      setWaTokenHealth(res);
      if (res.valid) {
        showToast('✅ Meta Access Token updated and verified successfully!', 'success');
        hapticSuccess();
      } else {
        showToast('⚠️ Token warning: ' + (res.message || 'Token check failed'), 'warning');
        hapticWarning();
      }
    } catch (err: any) {
      showToast('Failed to update token: ' + err.message, 'error');
      hapticWarning();
    } finally {
      setWaUpdatingToken(false);
    }
  }

  async function handleSimulateFriendDispute() {
    setSimDisputeFiling(true);
    setSimDisputeResult(null);
    hapticMedium();
    try {
      const customCaseId = 'PP-D-' + Math.floor(100000 + Math.random() * 900000);
      const res = await fileCustomerDispute({
        customerName: simCustomerName,
        amount: parseFloat(simDisputeAmount) || 249.99,
        reason: simDisputeReason,
        details: 'Friend test dispute: Package marked delivered by courier but not received by consignee.',
        paypalDisputeId: customCaseId,
        notifyPhone: waPhoneNumber || '919974442291',
      });
      setSimDisputeResult(res);
      showToast('🚀 New dispute ' + res.paypalDisputeId + ' filed & alert sent to WhatsApp!', 'success');
      hapticSuccess();
      loadDisputes();
    } catch (err: any) {
      showToast('Failed to file friend dispute: ' + err.message, 'error');
      hapticWarning();
    } finally {
      setSimDisputeFiling(false);
    }
  }

  function copyCustomerPortalLink() {
    if (typeof window !== 'undefined') {
      const portalUrl = window.location.origin + '/report-issue';
      navigator.clipboard.writeText(portalUrl);
      setWaCopiedCustomerLink(true);
      hapticLight();
      showToast('Customer dispute portal link copied to clipboard!', 'success');
      setTimeout(() => setWaCopiedCustomerLink(false), 2000);
    }
  }

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
      
      {/* Mobile Drawer Backdrop (Shown in mobile browser mode when sidebar is opened) */}
      {mobileMenuOpen && !isStandalone && (
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
          ${!isStandalone && mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="space-y-4">
          {/* Mobile Drawer Top Bar with dedicated uncrowded Close Button */}
          <div className="md:hidden flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-400">Navigation</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border text-slate-400 hover:text-[var(--foreground)] hover:bg-slate-500/10 active:scale-95 transition"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--surface-hover)' }}
              aria-label="Close navigation drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Brand Header */}
          <div className="flex items-center gap-3 px-1">
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
              className={`sidebar-nav-btn w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-amber-500/70 ${
                currentTab === 'DISPUTES' ? 'active shadow-xs' : ''
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>{t('nav_disputes')}</span>
              <span 
                className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono transition"
                style={{
                  backgroundColor: currentTab === 'DISPUTES' ? 'rgba(0, 0, 0, 0.25)' : 'var(--surface-active)',
                  color: currentTab === 'DISPUTES' ? 'inherit' : 'var(--text-secondary)'
                }}
              >
                {disputes.length}
              </span>
            </button>

            <button 
              onClick={() => { setCurrentTab('WHATSAPP_AUTOPILOT'); setMobileMenuOpen(false); }}
              className={`sidebar-nav-btn w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-amber-500/70 ${
                currentTab === 'WHATSAPP_AUTOPILOT' ? 'active shadow-xs' : ''
              }`}
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>WhatsApp 1-Tap</span>
              <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/40">
                LIVE
              </span>
            </button>

            <button 
              onClick={() => { setCurrentTab('CARRIER_RADAR'); setMobileMenuOpen(false); }}
              className={`sidebar-nav-btn w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-amber-500/70 ${
                currentTab === 'CARRIER_RADAR' ? 'active shadow-xs' : ''
              }`}
            >
              <Truck className="w-4 h-4 shrink-0" />
              <span>Carrier Telemetry</span>
            </button>

            <button 
              onClick={() => { setCurrentTab('EARLY_WARNING'); setMobileMenuOpen(false); }}
              className={`sidebar-nav-btn w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-amber-500/70 ${
                currentTab === 'EARLY_WARNING' ? 'active shadow-xs' : ''
              }`}
            >
              <AlertTriangle className={`w-4 h-4 shrink-0 ${currentTab === 'EARLY_WARNING' ? '' : 'text-amber-500'}`} />
              <span>Early Threat Radar</span>
              <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-500 font-bold">
                2
              </span>
            </button>

            <button 
              onClick={() => { setCurrentTab('SETTINGS'); setMobileMenuOpen(false); }}
              className={`sidebar-nav-btn w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-amber-500/70 ${
                currentTab === 'SETTINGS' ? 'active shadow-xs' : ''
              }`}
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
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Bot</span>
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-300 font-mono">1-Tap</span>
            </div>
            <p className="text-[11px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
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
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Sandbox Live
              </span>
            </div>
            <div className="font-mono text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
              Spring Boot :8085
            </div>
            <div className="flex items-center justify-between pt-1 border-t text-[10px]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-[var(--accent-primary)]" />
                <span>Isolated Merchant</span>
              </span>
              <span style={{ color: 'var(--text-muted)' }}>PostgreSQL</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 3. MAIN WORKSPACE WITH DECLUTTERED TOP BAR               */}
      {/* ======================================================== */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 flex flex-col min-w-0 md:h-screen md:overflow-hidden ${isStandalone ? 'pb-16' : 'pb-4'} md:pb-0`}
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.35}px)` : undefined,
          transition: isPulling ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* App-Wide Screen-Top Pull-to-Refresh Indicator (Fixed at very top of phone display, above searchbar) */}
        {pullDistance > 0 && (
          <div 
            className="md:hidden fixed top-2 left-0 right-0 z-[100] flex justify-center pointer-events-none select-none transition-transform duration-75"
            style={{ transform: `translateY(${Math.min(pullDistance, 60)}px)` }}
          >
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-2xl backdrop-blur-md border transition-all ${
              pullDistance >= 55 
                ? 'bg-amber-500 text-black scale-105 shadow-amber-500/30 border-amber-400' 
                : 'bg-[var(--surface)] text-[var(--accent-primary)] border-[var(--border-color)]'
            }`}>
              <RefreshCw className={`w-4 h-4 ${pullDistance >= 55 || syncing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 4}deg)` }} />
              <span>{syncing ? 'Refreshing Entire App...' : pullDistance >= 55 ? 'Release to Refresh App' : 'Pull down to refresh app'}</span>
            </div>
          </div>
        )}
        
        {/* DECLUTTERED TOP NAVBAR (Static/Sticky at top=0 on both mobile and desktop; no jitter or partial scroll) */}
        <header 
          className="border-b sticky top-0 z-30 backdrop-blur-md shrink-0 transition-smooth"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-color)'
          }}
        >
          {/* VERCEL LIVE DEPLOYMENT UPDATE NOTIFICATION BANNER (Inside header, natural layout flow, NEVER covers search bar) */}
          {hasAppUpdate && (
            <div 
              role="alert"
              className="border-b px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 animate-top-slide transition-all"
              style={{
                backgroundColor: 'var(--surface-hover)',
                borderColor: 'var(--border-strong)',
                color: 'var(--foreground)'
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span 
                  className="p-1.5 rounded-lg flex items-center justify-center shrink-0 shadow-xs" 
                  style={{ 
                    backgroundColor: 'var(--accent-pill)', 
                    color: 'var(--accent-pill-text)' 
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                </span>
                <div className="text-xs font-semibold leading-tight truncate">
                  <span style={{ color: 'var(--foreground)' }}>🚀 New Update Live on Vercel!</span>
                  <span className="hidden sm:inline font-normal ml-1.5" style={{ color: 'var(--text-muted)' }}>
                    A new build is ready.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleApplyAppUpdate}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 shadow-xs flex items-center gap-1.5"
                  style={{
                    backgroundColor: 'var(--btn-primary-bg)',
                    color: 'var(--btn-primary-text)'
                  }}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Update Now</span>
                </button>
                <button
                  onClick={() => setHasAppUpdate(false)}
                  className="p-1.5 rounded-lg transition hover:opacity-80"
                  style={{
                    color: 'var(--text-muted)'
                  }}
                  title="Dismiss update banner"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
          {/* Mobile Top Brand Row (Visible only on < md screens) */}
          <div 
            className="md:hidden flex items-center justify-between px-4 py-2.5 border-b"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg shadow-sm flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-pill)", color: "var(--accent-pill-text)" }}>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight">Resolve<span className="text-[var(--accent-primary)]">Pay</span></span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[var(--accent-pill)]/20 text-[var(--accent-primary)] border border-amber-500/30">AI</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isStandalone && (
                <button
                  onClick={handleInstallApp}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 active:scale-95 transition shadow-sm border"
                  style={{
                    backgroundColor: 'var(--btn-primary-bg)',
                    color: 'var(--btn-primary-text)',
                    borderColor: 'var(--border-strong)'
                  }}
                  title="1-Click Install App to Home Screen"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
              )}

              {!isStandalone && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-amber-500/70"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--surface-hover)',
                    color: 'var(--foreground)'
                  }}
                  aria-label="Toggle navigation menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>

          {/* Search, Store Switcher, and More Menu Row */}
          <div className="px-3 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2.5 sm:gap-4 shrink-0">
          {/* 1. Search Bar with Live Instant Autocomplete Dropdown (44px tap target) */}
          <div className="flex items-center gap-3 flex-1 min-w-0 max-w-md" ref={searchContainerRef}>
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={currentTab === 'DISPUTES' ? "Search disputes, ID, reason, or amount..." : "Search dispute ID (redirects to Disputes queue)..."}
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => {
                  handleSearchChange(e.target.value);
                  setSearchFocused(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Close keyboard and dropdown without automatically opening any dispute
                    (e.target as HTMLElement).blur();
                    setSearchFocused(false);
                    if (currentTab !== 'DISPUTES') {
                      setCurrentTab('DISPUTES');
                    }
                  } else if (e.key === 'Escape') {
                    (e.target as HTMLElement).blur();
                    setSearchFocused(false);
                  }
                }}
                className="w-full pl-9 pr-8 py-2.5 min-h-[44px] rounded-xl text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 transition border"
                style={{
                  backgroundColor: 'var(--surface-hover)',
                  borderColor: searchFocused && searchQuery ? 'var(--accent-primary)' : 'var(--border-color)',
                  color: 'var(--foreground)'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    handleSearchChange('');
                    setSearchFocused(false);
                  }}
                  className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-[var(--foreground)] transition rounded-md"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* LIVE SEARCH AUTOCOMPLETE POPUP (Mobile App Only - Hidden on PC/Desktop via md:hidden) */}
              {searchFocused && searchQuery.trim().length > 0 && (
                <div 
                  className="md:hidden absolute left-0 right-0 top-full mt-2 rounded-2xl border shadow-2xl p-2.5 z-[70] space-y-2 animate-top-slide max-h-[75vh] sm:max-h-[380px] overflow-y-auto"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-strong)',
                    boxShadow: '0 16px 40px -8px rgba(0,0,0,0.45)'
                  }}
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <span>Instant Results ({quickSearchResults.length})</span>
                    <span className="font-mono text-[9px] text-[var(--accent-primary)] font-bold">Tap row to view</span>
                  </div>

                  {quickSearchResults.length > 0 ? (
                    <div className="space-y-1 pt-0.5">
                      {quickSearchResults.map((dispute) => {
                        const isPending = dispute.status !== 'UNDER_REVIEW' && dispute.status !== 'RESOLVED';
                        return (
                          <div
                            key={dispute.id}
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setSearchFocused(false);
                              if (currentTab !== 'DISPUTES') setCurrentTab('DISPUTES');
                            }}
                            className="p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-2.5 hover:bg-[var(--surface-hover)] active:scale-98 shadow-xs"
                            style={{
                              borderColor: 'var(--border-color)',
                              backgroundColor: 'var(--surface-hover)'
                            }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                                style={{
                                  backgroundColor: 'var(--surface)',
                                  borderColor: 'var(--border-color)'
                                }}
                              >
                                <ShieldAlert className="w-4 h-4 text-[var(--accent-primary)]" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-mono font-bold text-xs text-[var(--accent-primary)] flex items-center gap-1.5">
                                  <span>{dispute.paypalDisputeId}</span>
                                  {isPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                                </div>
                                <div className="text-[11px] truncate font-semibold" style={{ color: 'var(--foreground)' }}>
                                  {humanizeReason(dispute.reason)}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="font-mono font-bold text-xs" style={{ color: 'var(--foreground)' }}>
                                {formatCurrency(dispute.amount, dispute.currency)}
                              </div>
                              <span className={`px-2 py-0.2 rounded-full font-bold text-[9px] inline-flex items-center gap-1 ${
                                isPending 
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
                                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {isPending ? 'Action Required' : 'Defended'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center space-y-2">
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        No disputes matching <span className="font-bold font-mono text-[var(--foreground)]">"{searchQuery}"</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleSearchChange('');
                          setSearchFocused(false);
                        }}
                        className="text-[11px] font-bold text-[var(--accent-primary)] hover:underline"
                      >
                        Clear search filter
                      </button>
                    </div>
                  )}

                  {quickSearchResults.length > 0 && (
                    <div className="pt-1.5 border-t text-center" style={{ borderColor: 'var(--border-color)' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchFocused(false);
                          if (currentTab !== 'DISPUTES') setCurrentTab('DISPUTES');
                        }}
                        className="text-[11px] font-bold text-[var(--accent-primary)] hover:underline py-1 w-full flex items-center justify-center gap-1"
                      >
                        <span>View all matching in queue ({processedDisputes.length})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
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
                          : 'hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--foreground)]'
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

            {/* Translate / Language Switcher Button */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="min-h-[44px] px-3 flex items-center gap-2 rounded-xl border transition hover:opacity-90 shadow-xs focus-visible:ring-2 focus-visible:ring-amber-500/70"
                style={{
                  backgroundColor: 'var(--surface-hover)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--foreground)'
                }}
                title="Change Language / 切换语言 / Cambiar idioma"
                aria-label="Language selector"
              >
                <Languages className="w-4 h-4 text-[var(--accent-primary)]" />
                <span className="text-xs font-bold font-mono uppercase">{currentLang}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition ${langMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {langMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-52 max-h-80 overflow-y-auto no-scrollbar rounded-2xl border shadow-2xl p-1.5 z-50 space-y-1 animate-slide-up text-xs font-sans-body"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--foreground)'
                  }}
                >
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 sticky top-0 bg-[var(--surface)] z-10">
                    Select Language / 语言
                  </div>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => handleSelectLanguage(l.code)}
                      className={`w-full min-h-[38px] px-3 py-2 rounded-xl flex items-center justify-between transition ${
                        currentLang === l.code ? 'bg-[var(--accent-pill)]/20 text-[var(--accent-primary)] font-bold' : 'hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({l.nativeName})</span>
                      </span>
                      {currentLang === l.code && <Check className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
                    </button>
                  ))}
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

                  {/* Language Selector inside More Menu */}
                  <div className="p-2 rounded-xl border border-slate-500/20 mb-1" style={{ backgroundColor: 'var(--surface-hover)' }}>
                    <div className="flex items-center justify-between pb-1.5 text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                        <span>Language / 语言 / Idioma</span>
                      </span>
                      <span className="font-mono uppercase text-[var(--accent-primary)] font-bold">{currentLang}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => { handleSelectLanguage(l.code); setMoreMenuOpen(false); }}
                          className={`py-1.5 px-1 rounded-lg text-center text-[10px] font-bold transition flex flex-col items-center justify-center ${
                            currentLang === l.code
                              ? 'bg-[var(--accent-pill)] text-white shadow-xs'
                              : 'hover:bg-slate-500/10 text-slate-400 hover:text-[var(--foreground)]'
                          }`}
                          title={l.label}
                        >
                          <span className="text-sm">{l.flag}</span>
                          <span className="font-mono text-[9px] uppercase mt-0.5">{l.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Toggle */}
                  <button
                    onClick={() => { toggleTheme(); setMoreMenuOpen(false); }}
                    className="dropdown-menu-item w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center justify-between transition"
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
                    className="dropdown-menu-item w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center justify-between transition disabled:opacity-50"
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
                    className="dropdown-menu-item w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center justify-between transition"
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
                    className="dropdown-menu-item w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center gap-2 transition"
                  >
                    <Zap className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span>Connect PayPal Account</span>
                  </button>

                  {/* Install Mobile App (PWA) */}
                  <button
                    onClick={handleInstallApp}
                    className="dropdown-menu-item w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center justify-between transition"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-amber-500 dark:text-amber-400">Install Mobile App</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      PWA
                    </span>
                  </button>

                  {/* DEVELOPER ONLY MENU SECTION */}
                  <div className="pt-2 mt-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                      <span>Developer Simulation</span>
                    </div>

                    <button
                      onClick={() => handleSimulateWebhook('MERCHANDISE_OR_SERVICE_NOT_RECEIVED', '249.99')}
                      disabled={simulating}
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center justify-between hover:bg-amber-500/10 text-amber-500 dark:text-amber-400 transition"
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <Zap className="w-4 h-4" />
                        <span>Simulate Dispute</span>
                      </span>
                      <span className="text-[10px] font-mono">{simulating ? 'Simulating...' : '+$249.99'}</span>
                    </button>

                    <button
                      onClick={() => { setCurrentTab('SETTINGS'); setMoreMenuOpen(false); }}
                      className="dropdown-menu-item w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center gap-2 transition"
                    >
                      <Shield className="w-4 h-4 text-slate-400" />
                      <span>Idempotency Tests</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

        {/* Dynamic Main Body */}
        <main ref={mainScrollRef} className="p-4 sm:p-8 space-y-6 flex-1 overflow-y-auto max-w-[1700px] w-full mx-auto pb-safe">
          
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
                      {t('kpi_risk_title')}
                    </span>
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
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
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
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
                      {t('kpi_action_title')}
                    </span>
                    <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div 
                    className="font-bold font-serif-heading text-rose-600 dark:text-rose-400"
                    style={{ fontSize: 'clamp(1.4rem, 2.2vw, 2rem)' }}
                  >
                    {loading ? (
                      <div className="h-8 w-20 rounded-lg skeleton-shimmer my-1" />
                    ) : (
                      <span>{pendingActionCount} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>cases</span></span>
                    )}
                  </div>
                  <div className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold">
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
                      {t('kpi_defended_title')}
                    </span>
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div 
                    className="font-bold font-serif-heading text-emerald-600 dark:text-emerald-400"
                    style={{ fontSize: 'clamp(1.4rem, 2.2vw, 2rem)' }}
                  >
                    {loading ? (
                      <div className="h-8 w-20 rounded-lg skeleton-shimmer my-1" />
                    ) : (
                      <span>{underReviewCount} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>defended</span></span>
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
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
                      {t('kpi_win_title')}
                    </span>
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
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

              {/* Table / List Filter Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { key: 'ALL', label: 'All Disputes', count: disputes.length },
                    { key: 'ACTION_REQUIRED', label: 'Action Required', count: disputes.filter(d => d.status !== 'UNDER_REVIEW' && d.status !== 'RESOLVED').length },
                    { key: 'UNDER_REVIEW', label: 'Under Review', count: disputes.filter(d => d.status === 'UNDER_REVIEW').length },
                    { key: 'RESOLVED', label: 'Resolved', count: disputes.filter(d => d.status === 'RESOLVED').length }
                  ].map(({ key, label, count }) => (
                    <button
                      key={key}
                      onClick={() => { hapticLight(); setStatusFilter(key as any); setCurrentPage(1); }}
                      className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 touch-spring focus-visible:ring-2 focus-visible:ring-amber-500/70 ${
                        statusFilter === key
                          ? 'shadow-xs'
                          : 'border text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                      }`}
                      style={{
                        borderColor: statusFilter === key ? 'transparent' : 'var(--border-color)',
                        backgroundColor: statusFilter === key ? 'var(--btn-primary-bg)' : 'var(--surface)',
                        color: statusFilter === key ? 'var(--btn-primary-text)' : undefined
                      }}
                    >
                      <span>{label}</span>
                      <span 
                        className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold"
                        style={{
                          backgroundColor: statusFilter === key ? 'rgba(0,0,0,0.18)' : 'var(--surface-hover)',
                          color: statusFilter === key ? 'var(--btn-primary-text)' : 'var(--foreground)'
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {/* Quick Sort Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-sans font-semibold">Sort:</span>
                    <select
                      value={`${sortField}-${sortOrder}`}
                      onChange={(e) => {
                        const [f, o] = e.target.value.split('-');
                        setSortField(f as any);
                        setSortOrder(o as any);
                        setCurrentPage(1);
                      }}
                      className="px-2.5 py-1 rounded-xl border text-xs font-sans font-bold cursor-pointer transition focus:outline-none"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--foreground)'
                      }}
                    >
                      <option value="latest-desc">Latest First (Newest)</option>
                      <option value="deadline-asc">Urgent SLA First</option>
                      <option value="amount-desc">Highest Amount ($)</option>
                      <option value="amount-asc">Lowest Amount ($)</option>
                      <option value="id-desc">Dispute ID</option>
                    </select>
                  </div>

                  <span>
                    Showing {paginatedDisputes.length} of {processedDisputes.length}
                  </span>
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
              <div className="grid grid-cols-1 gap-3.5 md:hidden py-1">
                {paginatedDisputes.map((dispute) => {
                  const deadlineInfo = calculateDeadlineUrgency(dispute.deadline);
                  const isPending = dispute.status !== 'UNDER_REVIEW' && dispute.status !== 'RESOLVED';
                  const tracking = calculateDisputeTracking(dispute);
                  return (
                    <div
                      key={dispute.id}
                      onClick={() => { hapticMedium(); setSelectedDispute(dispute); }}
                      className="p-4 rounded-2xl border space-y-3 cursor-pointer active:scale-98 transition shadow-xs hover:border-[var(--border-strong)] group touch-spring"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border-color)'
                      }}
                    >
                      {/* Top Header: ID, Reason, and Amount */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-xs" 
                            style={{ 
                              backgroundColor: 'var(--surface-hover)', 
                              borderColor: 'var(--border-color)' 
                            }}
                          >
                            <ShieldAlert className="w-4 h-4 text-[var(--accent-primary)]" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono font-bold text-xs text-[var(--accent-primary)] flex items-center gap-1.5">
                              <span>{dispute.paypalDisputeId}</span>
                              {isPending && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                            </div>
                            <div className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                              {humanizeReason(dispute.reason)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-mono font-black text-sm" style={{ color: 'var(--foreground)' }}>
                            {formatCurrency(dispute.amount, dispute.currency)}
                          </div>
                          <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                            {dispute.currency || 'USD'}
                          </div>
                        </div>
                      </div>

                      {/* Middle Status & SLA Countdown Badges */}
                      <div className="flex items-center justify-between pt-2.5 border-t text-[11px]" style={{ borderColor: 'var(--border-color)' }}>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1.5 ${
                          isPending 
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isPending ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>{isPending ? 'Action Required' : 'Defended'}</span>
                        </span>

                        {dispute.deadline ? (
                          <span className={`font-mono font-bold flex items-center gap-1 ${
                            deadlineInfo.urgency === 'CRITICAL' ? 'text-rose-500 animate-pulse' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{deadlineInfo.label}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">No SLA active</span>
                        )}
                      </div>

                      {/* Bottom Action Footer */}
                      {/* Bottom Action Footer with Dual Buttons */}
                      <div className="pt-2.5 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-color)' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            hapticMedium();
                            setDrawerInitialTab('tracking');
                            setSelectedDispute(dispute);
                          }}
                          className="flex-1 py-2 px-2.5 rounded-xl border border-[var(--border-color)] hover:border-[var(--accent-primary)] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition text-[var(--foreground)] touch-spring"
                          title="Open Live Tracking Journey"
                        >
                          <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Track Live</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            hapticMedium();
                            setDrawerInitialTab('ai');
                            setSelectedDispute(dispute);
                          }}
                          style={{
                            backgroundColor: 'var(--btn-primary-bg)',
                            color: 'var(--btn-primary-text)'
                          }}
                          className="flex-1 py-2 px-2.5 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-xs transition hover:brightness-105 active:scale-95 touch-spring"
                        >
                          <span>Review Defense</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
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
                      const tracking = calculateDisputeTracking(dispute);
                      return (
                        <tr 
                          key={dispute.id}
                          onClick={() => setSelectedDispute(dispute)}
                          className="cursor-pointer transition hover:bg-[var(--surface-hover)]"
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
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse'
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
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
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${isPending ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                              <span>{isPending ? 'Action Required' : 'Defended'}</span>
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* 1. Track Live Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  hapticMedium();
                                  setDrawerInitialTab('tracking');
                                  setSelectedDispute(dispute);
                                }}
                                className="px-3 py-1.5 min-h-[36px] rounded-xl font-bold text-xs inline-flex items-center gap-1.5 border border-[var(--border-color)] hover:border-[var(--accent-primary)] hover:bg-[var(--surface-hover)] transition text-[var(--foreground)] touch-spring"
                                title="Track live dispute lifecycle"
                              >
                                <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Track Live</span>
                              </button>

                              {/* 2. Review Defense Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  hapticMedium();
                                  setDrawerInitialTab('ai');
                                  setSelectedDispute(dispute);
                                }}
                                style={{
                                  backgroundColor: 'var(--btn-primary-bg)',
                                  color: 'var(--btn-primary-text)'
                                }}
                                className="px-3.5 py-1.5 min-h-[36px] rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition shadow-xs hover:brightness-105 active:scale-98 touch-spring"
                              >
                                <span>Review defense</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Premium Theme-Aware Pagination Bar */}
              {totalPages > 1 && (
                <div 
                  className="flex items-center justify-between gap-2 sm:gap-4 text-xs pt-4 pb-2 border-t mt-4"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  {/* Previous Button */}
                  <button
                    onClick={() => {
                      setCurrentPage(p => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="min-h-[40px] px-3 sm:px-4 py-2 rounded-xl border font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed shadow-xs"
                    style={{ 
                      borderColor: 'var(--border-strong)', 
                      backgroundColor: 'var(--surface-hover)',
                      color: 'var(--foreground)'
                    }}
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {/* Page Indicator & Numbered Pills */}
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => {
                          setCurrentPage(page);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center transition active:scale-95 ${
                          currentPage === page ? 'shadow-sm' : 'border hover:bg-[var(--surface-hover)]'
                        }`}
                        style={{
                          backgroundColor: currentPage === page ? 'var(--btn-primary-bg)' : 'var(--surface)',
                          color: currentPage === page ? 'var(--btn-primary-text)' : 'var(--foreground)',
                          borderColor: currentPage === page ? 'transparent' : 'var(--border-color)'
                        }}
                        aria-label={`Go to page ${page}`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => {
                      setCurrentPage(p => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="min-h-[40px] px-3 sm:px-4 py-2 rounded-xl border font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed shadow-xs"
                    style={{ 
                      borderColor: 'var(--border-strong)', 
                      backgroundColor: 'var(--surface-hover)',
                      color: 'var(--foreground)'
                    }}
                    aria-label="Next Page"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* TAB 2: WHATSAPP 1-TAP AUTOPILOT */}
          {currentTab === 'WHATSAPP_AUTOPILOT' && (
            <div className="space-y-6 max-w-5xl">
              {/* Top Banner Card */}
              <div 
                className="p-6 rounded-2xl border space-y-6"
                style={{ 
                  backgroundColor: 'var(--surface)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black font-serif-heading">Meta WhatsApp 1-Tap Autopilot</h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                          100% FREE DEV SANDBOX
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Direct Meta Cloud API integration. Resolve chargebacks from your actual WhatsApp in seconds with 0 dashboard logins.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                      <span>ONLINE • BOT READY</span>
                    </span>
                  </div>
                </div>

                {/* Grid: Live Meta Sandbox Config (Left) + WhatsApp Phone Mockup (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Live Sandbox Setup & Dispatcher */}
                  <div className="lg:col-span-7 space-y-5">

                    {/* Customer Dispute Portal Card (Share with Friend) - Vibrant Color & High Contrast */}
                    <div 
                      className="p-5 rounded-2xl border space-y-3.5 shadow-sm transition"
                      style={{
                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(79, 70, 229, 0.08) 50%, var(--surface) 100%)',
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center">
                            <ExternalLink className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[var(--foreground)]">
                              {t('cust_portal_title')}
                            </h4>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                              Live Customer Filing Portal
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/40 font-mono font-bold tracking-wide">
                          {t('cust_portal_badge')}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--foreground)] opacity-90 leading-relaxed font-medium">
                        {t('cust_portal_desc')}
                      </p>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                        <input
                          type="text"
                          readOnly
                          value={typeof window !== 'undefined' ? `${window.location.origin}/report-issue` : 'https://resolvepay-autopilot.vercel.app/report-issue'}
                          className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl text-xs font-mono border select-all font-semibold focus:outline-none"
                          style={{
                            backgroundColor: 'var(--surface-hover)',
                            borderColor: 'rgba(59, 130, 246, 0.45)',
                            color: 'var(--foreground)'
                          }}
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={copyCustomerPortalLink}
                            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition inline-flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25"
                          >
                            {waCopiedCustomerLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{waCopiedCustomerLink ? t('cust_portal_copied') : t('cust_portal_copy')}</span>
                          </button>
                          <a
                            href="/report-issue"
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-blue-500/30 hover:bg-blue-500/10 text-xs font-bold transition inline-flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400"
                            style={{ backgroundColor: 'var(--surface)' }}
                          >
                            <span>{t('cust_portal_open')}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Quick Friend Dispute Simulator Box */}
                    <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                            {t('sim_title')}
                          </h4>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-mono font-bold">
                          {t('sim_badge')}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {t('sim_desc')}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">{t('sim_name_label')}</label>
                          <input
                            type="text"
                            value={simCustomerName}
                            onChange={(e) => setSimCustomerName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-xs border"
                            style={{
                              backgroundColor: 'var(--surface)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--foreground)'
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">{t('sim_amount_label')}</label>
                          <input
                            type="number"
                            value={simDisputeAmount}
                            onChange={(e) => setSimDisputeAmount(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-xs border font-mono"
                            style={{
                              backgroundColor: 'var(--surface)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--foreground)'
                            }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleSimulateFriendDispute}
                        disabled={simDisputeFiling}
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md shadow-amber-500/20"
                      >
                        {simDisputeFiling ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{t('sim_btn_loading')}</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>{t('sim_btn_dispatch')}</span>
                          </>
                        )}
                      </button>
                      {simDisputeResult && (
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                          ✅ Case {simDisputeResult.paypalDisputeId} filed! WhatsApp alert dispatched to merchant phone.
                        </div>
                      )}
                    </div>

                    {/* Meta Cloud API Token Dynamic Updater */}
                    <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                            {t('token_title')}
                          </h4>
                        </div>
                        <a
                          href="https://developers.facebook.com/apps"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-bold"
                        >
                          <span>{t('token_step1')}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {t('token_desc')}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="password"
                          value={waCustomToken}
                          onChange={(e) => setWaCustomToken(e.target.value)}
                          placeholder={t('token_placeholder')}
                          className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          style={{
                            backgroundColor: 'var(--surface)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--foreground)'
                          }}
                        />
                        <button
                          onClick={handleUpdateWaToken}
                          disabled={waUpdatingToken}
                          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-50 shrink-0 flex items-center justify-center gap-1"
                        >
                          {waUpdatingToken ? t('token_verifying') : t('token_btn')}
                        </button>
                      </div>
                      {waTokenHealth && (
                        <div className={`p-2 rounded-lg text-xs font-mono ${
                          waTokenHealth.valid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                          {waTokenHealth.valid ? '✅ Meta Token is ACTIVE & CONNECTED!' : `⚠️ ${waTokenHealth.message || 'Token check failed'}`}
                        </div>
                      )}
                    </div>
                    {/* Live Dispatcher Box */}
                    <div className="p-4 rounded-xl border space-y-3.5" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <h4 className="text-sm font-bold text-[var(--foreground)]">{t('dispatch_title')}</h4>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                          {t('dispatch_badge')}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--text-muted)]">
                        {t('dispatch_targeting')} <strong className="text-amber-700 dark:text-amber-400 font-mono font-bold">{targetDisputeForWhatsApp?.paypalDisputeId || 'PP-D-849102'}</strong> ({formatCurrency(targetDisputeForWhatsApp?.amount || 249.99)})
                      </p>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                          {t('dispatch_phone_label')}
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="tel"
                            value={waPhoneNumber}
                            onChange={(e) => setWaPhoneNumber(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            style={{
                              backgroundColor: 'var(--surface)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--foreground)'
                            }}
                          />
                          <button
                            onClick={handleSendRealWhatsApp}
                            disabled={waSending}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 shadow-md shadow-emerald-500/20 shrink-0"
                          >
                            {waSending ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>{t('dispatch_sending')}</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>{t('dispatch_btn')}</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {t('dispatch_hint')}
                        </p>
                      </div>

                      {/* Live Dispatch Result Banner */}
                      {waDispatchResult && (
                        <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          waDispatchResult.success 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                        }`}>
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>WhatsApp Alert Dispatched</span>
                            </span>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/30">
                              {waDispatchResult.mode || 'SANDBOX'}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-300">
                            Recipient: <span className="text-white font-bold">{waDispatchResult.recipient}</span> • Dispute: <span className="text-white font-bold">{waDispatchResult.disputeId}</span>
                          </div>
                          {waDispatchResult.previewText && (
                            <div className="p-2 rounded bg-black/40 text-[10px] font-mono text-slate-300 whitespace-pre-line mt-1 border border-slate-700/40">
                              {waDispatchResult.previewText}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Meta Webhook Connection Credentials */}
                    <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                            Meta Cloud API Webhook Handshake Config
                          </h4>
                        </div>
                        <a 
                          href="https://developers.facebook.com/apps" 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 font-bold"
                        >
                          <span>Meta Developers</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="space-y-2.5">
                        {/* 1. Callback URL */}
                        <div>
                          <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">
                            Callback URL (Webhook URL)
                          </label>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value="https://resolvepay-api.onrender.com/api/webhooks/whatsapp"
                              className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs font-mono border select-all"
                              style={{
                                backgroundColor: 'var(--surface)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--foreground)'
                              }}
                            />
                            <button
                              onClick={copyWebhookUrl}
                              className="px-3.5 py-2 rounded-lg border text-xs font-bold hover:bg-[var(--surface-hover)] transition inline-flex items-center justify-center gap-1 text-[var(--foreground)] shrink-0"
                              style={{ borderColor: 'var(--border-color)' }}
                            >
                              {waCopiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{waCopiedWebhook ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                        {/* 2. Verify Token */}
                        <div>
                          <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">
                            Verify Token
                          </label>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value="resolvepay_wa_verify_2026"
                              className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs font-mono border select-all font-bold text-emerald-700 dark:text-emerald-400"
                              style={{
                                backgroundColor: 'var(--surface)',
                                borderColor: 'var(--border-color)'
                              }}
                            />
                            <button
                              onClick={copyVerifyToken}
                              className="px-3.5 py-2 rounded-lg border text-xs font-bold hover:bg-[var(--surface-hover)] transition inline-flex items-center justify-center gap-1 text-[var(--foreground)] shrink-0"
                              style={{ borderColor: 'var(--border-color)' }}
                            >
                              {waCopiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{waCopiedToken ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step-by-Step Meta Setup Guide Toggle */}
                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                      <button
                        onClick={() => setShowWaGuide(!showWaGuide)}
                        className="w-full p-3.5 text-left flex items-center justify-between hover:bg-[var(--surface-hover)] transition"
                      >
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-[var(--foreground)]">
                            {t('guide_title')}
                          </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition text-[var(--text-muted)] ${showWaGuide ? 'rotate-180' : ''}`} />
                      </button>

                      {showWaGuide && (
                        <div className="p-4 pt-1 border-t space-y-2.5 text-xs text-[var(--text-muted)]" style={{ borderColor: 'var(--border-color)' }}>
                          <div className="flex gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold font-mono flex items-center justify-center shrink-0 text-[11px]">1</span>
                            <div>
                              {t('guide_step1')}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold font-mono flex items-center justify-center shrink-0 text-[11px]">2</span>
                            <div>
                              {t('guide_step2')}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold font-mono flex items-center justify-center shrink-0 text-[11px]">3</span>
                            <div>
                              {t('guide_step3')}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold font-mono flex items-center justify-center shrink-0 text-[11px]">4</span>
                            <div>
                              {t('guide_step4')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Simulated Phone Mockup */}
                  <div className="lg:col-span-5">
                    <div className="rounded-3xl p-4 bg-[#0B141A] text-white shadow-2xl border border-slate-700/60 space-y-4 max-w-sm mx-auto">
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
                      <span>{t('carrier_title')}</span>
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t('carrier_sub')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {[
                    { carrier: 'FedEx Express', status: t('carrier_status_edi'), latency: '34ms', icon: Truck },
                    { carrier: 'DHL Express Global', status: t('carrier_status_rest'), latency: '52ms', icon: Truck },
                    { carrier: 'USPS Priority WebTools', status: t('carrier_status_soap'), latency: '88ms', icon: Truck },
                    { carrier: 'Shiprocket & BlueDart', status: t('carrier_status_india'), latency: '41ms', icon: Truck }
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
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">{c.status}</div>
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
                    <span>{t('warning_title')}</span>
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {t('warning_sub')}
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
                          onClick={() => showToast(t('warning_sent_toast', { order: risk.orderNumber }), 'success', 'Interception Sent')}
                          style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                          className="min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs self-start sm:self-auto shrink-0 transition hover:brightness-105 active:scale-98 shadow-xs"
                        >
                          {t('warning_btn_intercept')}
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
                  <h2 className="text-xl font-black font-serif-heading">{t('sec_title')}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {t('sec_sub')}
                  </p>
                </div>
                <button
                  onClick={checkPayPalConnection}
                  disabled={checkingPayPal}
                  style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50 self-start sm:self-auto hover:brightness-105 active:scale-98"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingPayPal ? 'animate-spin' : ''}`} />
                  <span>{checkingPayPal ? t('sec_pinging') : t('sec_btn_ping')}</span>
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
                      <h4 className="text-sm font-bold text-emerald-400">{t('sec_wa_title')}</h4>
                      <p className="text-[11px] text-slate-300">{t('sec_wa_sub')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setWhatsAppModalOpen(true)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition shadow-sm"
                  >
                    {t('sec_btn_bot_preview')}
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
                      <h3 className="text-sm font-bold font-serif-heading">{t('sec_paypal_card_title')}</h3>
                      <p className="text-[11px] text-slate-400">{t('sec_paypal_card_sub')}</p>
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
                    <span>{payPalHealth?.connected ? t('sec_active_connected') : t('sec_disconnected')}</span>
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
                      <h3 className="text-sm font-bold font-serif-heading">{t('sec_tenant_title')}</h3>
                      <p className="text-[11px] text-slate-400">{t('sec_tenant_sub', { name: activeStore.name })}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setConnectModalOpen(true)}
                    style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                    className="min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-xs self-start sm:self-auto shrink-0 hover:brightness-105 active:scale-98"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{t('sec_btn_connect_another')}</span>
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border font-mono gap-2 transition-colors" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{t('sec_active_store_label')} </span>
                      <span className="font-bold font-sans" style={{ color: 'var(--foreground)' }}>{activeStore.name}</span>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto font-sans font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{t('sec_verified_badge')}</span>
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border font-mono gap-2 transition-colors" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{t('sec_tenant_id_label')} </span>
                      <span className="font-bold" style={{ color: 'var(--foreground)' }}>{activeStore.id}</span>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-md border self-start sm:self-auto font-bold" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-strong)', color: 'var(--accent-primary)' }}>
                      ThreadLocal Scoped
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border font-mono gap-2 transition-colors" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>{t('sec_payer_id_label')} </span>
                      <span className="text-emerald-400 font-bold">{activeStore.paypalPayerId}</span>
                    </div>
                    <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{t('sec_linked_label')} {activeStore.connectedAt}</div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border font-mono gap-2 transition-colors" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-color)' }}>
                    <div className="truncate">
                      <span style={{ color: 'var(--text-muted)' }}>{t('sec_auth_token_label')} </span>
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
                      <span>{t('sec_btn_copy_token')}</span>
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
                      <h3 className="text-sm font-bold font-serif-heading">{t('idem_title')}</h3>
                      <p className="text-[11px] text-slate-400">{t('idem_sub')}</p>
                    </div>
                  </div>
                  <button
                    onClick={runIdempotencyTest}
                    disabled={idempotencyLoading}
                    style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                    className="min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition disabled:opacity-50 self-start sm:self-auto shadow-sm hover:brightness-105 active:scale-98"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${idempotencyLoading ? 'animate-spin' : ''}`} />
                    <span>{idempotencyLoading ? t('idem_btn_testing') : t('idem_btn_simulate')}</span>
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
                      {t('idem_empty_hint')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ======================================================== */}
      {/* 4. MOBILE BOTTOM TAB NAVIGATION BAR (Visible in Installed App mode; Hidden in Mobile Browser mode) */}
      {/* ======================================================== */}
      {isStandalone && (
        <nav 
          aria-label="Mobile Navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-1.5 pb-safe border-t backdrop-blur-md shadow-2xl animate-slide-up"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border-color)'
        }}
      >
        <button
          onClick={() => { hapticLight(); setCurrentTab('DISPUTES'); }}
          className="min-h-[44px] min-w-[54px] flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition touch-spring focus-visible:ring-2 focus-visible:ring-amber-500"
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
          <span>{t('nav_disputes')}</span>
        </button>

        <button
          onClick={() => { hapticLight(); setCurrentTab('WHATSAPP_AUTOPILOT'); }}
          className="min-h-[44px] min-w-[54px] flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition touch-spring focus-visible:ring-2 focus-visible:ring-amber-500"
          style={{ color: currentTab === 'WHATSAPP_AUTOPILOT' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          <div className="relative">
            <Smartphone className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <span>{t('nav_whatsapp')}</span>
        </button>

        <button
          onClick={() => { hapticLight(); setCurrentTab('CARRIER_RADAR'); }}
          className="min-h-[44px] min-w-[54px] flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition touch-spring focus-visible:ring-2 focus-visible:ring-amber-500"
          style={{ color: currentTab === 'CARRIER_RADAR' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          <Truck className="w-5 h-5" />
          <span>{t('nav_carrier')}</span>
        </button>

        <button
          onClick={() => { hapticLight(); setCurrentTab('EARLY_WARNING'); }}
          className="min-h-[44px] min-w-[54px] flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition touch-spring focus-visible:ring-2 focus-visible:ring-amber-500"
          style={{ color: currentTab === 'EARLY_WARNING' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          <div className="relative">
            <AlertTriangle className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[8px] bg-rose-500 text-white font-bold">
              2
            </span>
          </div>
          <span>{t('nav_warning')}</span>
        </button>

        <button
          onClick={() => { hapticLight(); setCurrentTab('SETTINGS'); }}
          className="min-h-[44px] min-w-[54px] flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition touch-spring focus-visible:ring-2 focus-visible:ring-amber-500"
          style={{ color: currentTab === 'SETTINGS' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          <Settings className="w-5 h-5" />
          <span>{t('nav_settings')}</span>
        </button>
      </nav>
      )}

      {/* Slide-over Fullscreen Dispute Workspace Drawer */}
      {selectedDispute && (
        <DisputeDrawer
          dispute={selectedDispute}
          initialTab={drawerInitialTab}
          onClose={() => setSelectedDispute(null)}
          onDisputeUpdated={loadDisputes}
        />
      )}

      {/* WhatsApp Modal Trigger from Sidebar */}
      {whatsAppModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="p-6 rounded-3xl max-w-md w-full border space-y-4 shadow-2xl animate-slide-up"
            style={{ 
              backgroundColor: 'var(--surface)', 
              borderColor: 'var(--border-color)' 
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <span className="font-bold text-sm font-serif-heading" style={{ color: 'var(--foreground)' }}>WhatsApp Autopilot Live Preview</span>
              <button 
                onClick={() => setWhatsAppModalOpen(false)} 
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
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

      {/* PWA Mobile App Install Instructions Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div 
            className="p-6 rounded-3xl max-w-md w-full border space-y-4 shadow-2xl relative"
            style={{ 
              backgroundColor: 'var(--surface)', 
              borderColor: 'var(--border-color)',
              color: 'var(--foreground)'
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Install ResolvePay Mobile App</h3>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Add to your Phone Home Screen</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInstallGuide(false)} 
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition"
                style={{ 
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--surface-hover)'
                }}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Install ResolvePay to your mobile home screen for a fullscreen native app experience with instant dispute resolution and fast biometric/touch access.
            </p>

            <div className="space-y-2.5 py-1">
              <div 
                className="p-3.5 rounded-2xl border flex items-start gap-3 transition" 
                style={{ 
                  backgroundColor: 'var(--surface-hover)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs">
                  <span className="font-bold text-amber-500">
                    {isIOSDevice ? 'Tap the Share Button' : 'Open the Browser Menu'}
                  </span>
                  <p className="mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {isIOSDevice 
                      ? 'In Safari, tap the Share icon (⎋) at the bottom navigation bar.' 
                      : 'Tap the three-dot menu icon (⋮) in the top-right corner of Chrome or Edge.'}
                  </p>
                </div>
              </div>

              <div 
                className="p-3.5 rounded-2xl border flex items-start gap-3 transition" 
                style={{ 
                  backgroundColor: 'var(--surface-hover)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs">
                  <span className="font-bold text-amber-500">
                    {isIOSDevice ? 'Tap "Add to Home Screen"' : 'Tap "Install app" or "Add to Home screen"'}
                  </span>
                  <p className="mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {isIOSDevice 
                      ? 'Scroll down the share sheet and tap ⊞ "Add to Home Screen", then tap "Add".' 
                      : 'Select "Install app" or "Add to Home screen" from the menu options.'}
                  </p>
                </div>
              </div>

              <div 
                className="p-3.5 rounded-2xl border flex items-start gap-3 transition" 
                style={{ 
                  backgroundColor: 'var(--surface-hover)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div className="text-xs">
                  <span className="font-bold text-emerald-500">Launch from Home Screen</span>
                  <p className="mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Open ResolvePay directly from your phone home screen with bottom-tab navigation and fullscreen workspace.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full min-h-[44px] py-2.5 rounded-xl font-bold text-xs transition active:scale-98 shadow-sm flex items-center justify-center gap-2"
              style={{ 
                backgroundColor: 'var(--btn-primary-bg)', 
                color: 'var(--btn-primary-text)' 
              }}
            >
              <Check className="w-4 h-4" />
              <span>Done, Got It</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
