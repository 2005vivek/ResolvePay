export type Language = 'en' | 'zh' | 'es' | 'ja' | 'de' | 'hi';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English (US)', flag: '🇺🇸' },
  { code: 'zh', label: 'Chinese', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'es', label: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'ja', label: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'de', label: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

export const translations = {
  en: {
    // Top Bar & App Info
    app_subtitle: 'PayPal Dispute Autopilot',
    search_placeholder: 'Search disputes by ID, buyer name, or amount...',
    connected_store: 'Connected Store',
    manage_stores: 'Manage Stores',
    connect_new_store: '+ Connect New Store',
    theme: 'Theme',
    language: 'Language',
    preferences_actions: 'Preferences & Actions',
    sync_disputes: 'Sync Disputes',
    paypal_sandbox: 'PayPal Sandbox',
    connect_paypal: 'Connect PayPal Account',
    install_mobile_app: 'Install Mobile App',
    developer_simulation: 'Developer Simulation',
    simulate_item_not_received: 'Simulate Item Not Received ($249.99)',
    simulate_unauthorized: 'Simulate Unauthorised Dispute ($149.50)',
    reset_live_demo: 'Reset Live Demo Disputes',

    // Navigation Tabs
    nav_disputes: 'Disputes Queue',
    nav_whatsapp: 'WhatsApp Autopilot',
    nav_carrier: 'Carrier Telemetry Radar',
    nav_warning: 'Early Threat Radar',
    nav_settings: 'Merchant Security',

    // KPI Cards
    kpi_risk_title: 'Total Value at Risk',
    kpi_risk_sub: 'Total Disputes • Automated Defense',
    kpi_action_title: 'Action Required',
    kpi_action_sub: 'Urgent SLA Deadlines Active',
    kpi_defended_title: 'Defended & In Review',
    kpi_defended_sub: 'Submitted via Outbox Pipeline',
    kpi_win_title: 'AI Defense Win Ratio',

    // Table Filters
    filter_all: 'All Disputes',
    filter_action: 'Action Required',
    filter_defended: 'Defended / Under Review',
    total_count: 'Disputes Found',

    // Table Columns
    col_case_id: 'Case ID / Reference',
    col_buyer: 'Buyer / Customer',
    col_amount: 'Amount at Risk',
    col_evidence: 'EDI Evidence',
    col_deadline: 'SLA Countdown',
    col_ai_status: 'AI Status',
    col_actions: 'Actions',
    btn_track_live: 'Track Live',
    btn_review_defense: 'Review defense',

    // WhatsApp Tab: Header
    wa_header_title: 'Meta WhatsApp 1-Tap Autopilot',
    wa_sandbox_badge: '100% FREE DEV SANDBOX',
    wa_header_sub: 'Direct Meta Cloud API integration. Resolve chargebacks from your actual WhatsApp in seconds with 0 dashboard logins.',
    wa_bot_ready: 'ONLINE • BOT READY',

    // Customer Dispute Filing Link Card
    cust_portal_title: 'Customer Dispute Filing Link (Share with Friend)',
    cust_portal_badge: 'End-to-End Live',
    cust_portal_desc: 'Send this live link to a customer or friend. When they submit a dispute, a 1-Tap alert is dispatched to your WhatsApp in 2 seconds!',
    cust_portal_copy: 'Copy Link',
    cust_portal_copied: 'Copied',
    cust_portal_open: 'Open',

    // Instant Friend Dispute Simulator Card
    sim_title: 'Instant Friend Dispute Simulator (Live Test)',
    sim_badge: '1-Click Trigger',
    sim_desc: '1-Click trigger: system creates a live dispute and dispatches an alert with a 1-Tap Auto-Defend button directly to your WhatsApp.',
    sim_name_label: 'Friend / Customer Name',
    sim_amount_label: 'Amount ($ USD)',
    sim_btn_dispatch: '🚀 Dispatch Friend Dispute to My WhatsApp',
    sim_btn_loading: 'Creating Dispute & Pushing to WhatsApp...',
    sim_success_msg: 'Case {id} filed! WhatsApp alert dispatched to merchant phone.',

    // Meta Access Token Update Card
    token_title: 'Meta Access Token Update (24-Hour Token)',
    token_step1: 'Meta Step 1',
    token_desc: 'If your Meta Developer 24-hour test token expires, click Step 1 to generate a new token, paste it here, and click "Update Token".',
    token_placeholder: 'Paste Meta Access Token (EAADbNUHhHJoBS...)',
    token_btn: 'Update & Test',
    token_verifying: 'Verifying...',
    token_active: '✅ Meta Token is ACTIVE & CONNECTED!',

    // Live Dispatcher Box
    dispatch_title: 'Send Live WhatsApp Alert to Your Phone',
    dispatch_badge: 'Free Testing ($0)',
    dispatch_targeting: 'Targeting active case:',
    dispatch_phone_label: 'Your WhatsApp Phone Number (with Country Code)',
    dispatch_btn: 'Send WhatsApp Alert',
    dispatch_sending: 'Sending...',
    dispatch_hint: 'Format: Include country code without symbols or spaces (e.g., 919876543210).',
    dispatch_success: 'WhatsApp Alert Dispatched',

    // Webhook Handshake Config
    webhook_title: 'Meta Cloud API Webhook Handshake Config',
    webhook_meta_devs: 'Meta Developers',
    webhook_callback_label: 'Callback URL (Webhook URL)',
    webhook_verify_label: 'Verify Token',
    btn_copy: 'Copy',
    btn_copied: 'Copied',

    // 2-Minute Setup Guide
    guide_title: '2-Minute Meta Developer Setup Guide (100% Free Sandbox)',
    guide_step1: 'Go to developers.facebook.com, create a new App (Type: Other > Business), and add the WhatsApp product.',
    guide_step2: 'Under WhatsApp > API Setup, select "Manage phone number list" under "To", add your WhatsApp mobile number and verify it with a 6-digit OTP.',
    guide_step3: 'Under Configuration > Webhook, click Edit, paste the Callback URL and Verify Token above, and subscribe to the "messages" field.',
    guide_step4: 'Now enter your phone number above and click "Send WhatsApp Alert" — you will immediately receive an interactive message with a 1-Tap button on your WhatsApp!',

    // Phone Mockup
    phone_verified: 'verified business account',
    phone_dispute_alert: '🚨 PayPal Dispute Alert:',
    phone_amount_at_risk: 'Amount at Risk:',
    phone_reason: 'Reason:',
    phone_ai_action: '⚡ AI Action: FedEx tracking proves delivered with recipient signature.',
    phone_btn_approve: '1. Approve & Auto-Submit Rebuttal',
    phone_btn_defended: 'Submitted & Defended in PayPal',
    phone_btn_inspect: '2. Inspect POD & Evidence',

    // TAB 3: Carrier Radar
    carrier_title: 'Live Logistics EDI & Carrier Proof Integrations',
    carrier_sub: 'Synchronized carrier gateways providing automatic GPS-verified proof of delivery.',
    carrier_connected: 'Connected',
    carrier_status_edi: 'Connected (EDI 214)',
    carrier_status_rest: 'Connected (REST API)',
    carrier_status_soap: 'Connected (SOAP)',
    carrier_status_india: 'Connected (India API)',

    // TAB 4: Early Threat Radar
    warning_title: 'Pre-Dispute Threat & Sentiment Scanner',
    warning_sub: 'AI monitors customer support tickets to intercept dispute threats before they turn into costly PayPal chargebacks.',
    warning_btn_intercept: 'Intercept Now',
    warning_sent_toast: 'Sent 1-click preemptive resolution for {order}',

    // TAB 5: Merchant Security
    sec_title: 'Merchant Security & Live PayPal Integration',
    sec_sub: 'Multi-tenant data isolation, zero-trust token auth, and real-time PayPal Sandbox telemetry.',
    sec_btn_ping: 'Test PayPal Connection Ping',
    sec_pinging: 'Pinging PayPal...',
    sec_wa_title: 'WhatsApp 1-Tap Autopilot Dispatch',
    sec_wa_sub: 'Resolves incoming dispute alerts right from merchant phone without login',
    sec_btn_bot_preview: 'Open Bot Preview',
    sec_paypal_card_title: 'PayPal Sandbox REST API Connection',
    sec_paypal_card_sub: 'Direct OAuth2 & Disputes Engine Handshake',
    sec_active_connected: 'ACTIVE & CONNECTED',
    sec_disconnected: 'DISCONNECTED',
    sec_tenant_title: 'Active Store & Tenant Isolation',
    sec_tenant_sub: 'Multi-tenant database partition for {name}',
    sec_btn_connect_another: '+ Connect Another Store',
    sec_active_store_label: 'Active Business Store:',
    sec_verified_badge: 'PayPal Verified Account',
    sec_tenant_id_label: 'Merchant Tenant ID:',
    sec_payer_id_label: 'PayPal Payer ID:',
    sec_linked_label: 'Linked:',
    sec_auth_token_label: 'Internal Auth Token:',
    sec_btn_copy_token: 'Copy Token',
    idem_title: 'Live Webhook Idempotency Engine Test',
    idem_sub: 'Simulate network re-transmissions and duplicate dispute attacks',
    idem_btn_testing: 'Testing Idempotency...',
    idem_btn_simulate: 'Simulate Duplicate Webhook',
    idem_empty_hint: 'Click "Simulate Duplicate Webhook" to send two identical webhook events concurrently and witness the unique index block duplicate financial deductions in real-time.',

    // Notification Toasts
    toast_lang_switched: 'Language switched to English',
    toast_theme_switched: 'Switched to {theme} theme',

    // Customer Resolution Portal (/report-issue)
    portal_page_title: 'PayPal Buyer Resolution Center',
    portal_page_sub: 'Customer Dispute Resolution Portal — Submitting an issue dispatches an instant 1-Tap alert to the merchant WhatsApp.',
    portal_form_title: 'File a Live Transaction Dispute',
    portal_form_desc: 'Use this form to file or simulate a customer issue. Submitting will dispatch a real-time 1-Tap defense alert to WhatsApp in seconds!',
    portal_field_case_id: 'PayPal Case / Dispute ID',
    portal_field_amount: 'Dispute Amount ($ USD)',
    portal_field_cust_name: 'Customer / Friend Name',
    portal_field_cust_email: 'Customer Email',
    portal_field_reason: 'Reason for Dispute',
    portal_opt_inr: 'Item Not Received',
    portal_opt_snad: 'Item Significantly Not As Described',
    portal_opt_unauth: 'Unauthorised Transaction',
    portal_field_details: 'Customer Explanation & Dispute Details',
    portal_btn_submit: 'Submit Customer Dispute',
    portal_transmitting: 'Transmitting Dispute & Alerting WhatsApp...',
    portal_success_title: 'Dispute Lodged Successfully!',
    portal_success_desc: 'The customer dispute has been officially registered in the ResolvePay & PayPal sandbox system.',
    portal_wa_alert_title: '📱 WhatsApp Alert Dispatched to Merchant Phone!',
    portal_wa_alert_desc: 'A live 1-Tap rebuttal alert has been sent to the merchant registered WhatsApp number. The merchant can review and defend the dispute directly from their phone.',
    portal_btn_dashboard: 'View on Merchant Dashboard',
    portal_btn_another: 'File Another Test Dispute',

    // Connect PayPal Modal
    modal_paypal_title: 'Connect PayPal Business Account',
    modal_paypal_sub: 'OAuth 2.0 Partner Onboarding & Auto-Sync',
    modal_store_name: 'Store / Brand Name',
    modal_business_email: 'Primary Business PayPal Email',
    modal_currency: 'Settlement Currency',
    modal_btn_connect: 'Initiate PayPal OAuth 2.0 Connection',
    modal_connecting: 'Establishing Secure Sandbox Handshake...',
  },

  zh: {
    // Top Bar & App Info
    app_subtitle: 'PayPal 争议自动处理引擎',
    search_placeholder: '按 ID、买家姓名或金额搜索争议...',
    connected_store: '已连接店铺',
    manage_stores: '管理店铺',
    connect_new_store: '+ 连接新店铺',
    theme: '主题',
    language: '语言',
    preferences_actions: '偏好与操作',
    sync_disputes: '同步争议',
    paypal_sandbox: 'PayPal 沙盒',
    connect_paypal: '连接 PayPal 账户',
    install_mobile_app: '安装手机 App',
    developer_simulation: '开发者模拟工具',
    simulate_item_not_received: '模拟未收到商品争议 ($249.99)',
    simulate_unauthorized: '模拟未经授权交易争议 ($149.50)',
    reset_live_demo: '重置实时演示数据',

    // Navigation Tabs
    nav_disputes: '争议队列',
    nav_whatsapp: 'WhatsApp 自动处理',
    nav_carrier: '承运商遥测雷达',
    nav_warning: '早期威胁雷达',
    nav_settings: '商户安全设置',

    // KPI Cards
    kpi_risk_title: '风险资金总额',
    kpi_risk_sub: '争议总数 • 自动防御保护',
    kpi_action_title: '需处理事项',
    kpi_action_sub: '紧急 SLA 截止日期进行中',
    kpi_defended_title: '已防御 / 审核中',
    kpi_defended_sub: '已通过自动化管道提交',
    kpi_win_title: 'AI 防御胜率',

    // Table Filters
    filter_all: '全部争议',
    filter_action: '需处理',
    filter_defended: '已防御 / 审核中',
    total_count: '找到的争议',

    // Table Columns
    col_case_id: '案件 ID / 编号',
    col_buyer: '买家 / 客户',
    col_amount: '风险金额',
    col_evidence: 'EDI 物流凭证',
    col_deadline: 'SLA 倒计时',
    col_ai_status: 'AI 状态',
    col_actions: '操作',
    btn_track_live: '实时追踪',
    btn_review_defense: '审查抗辩',

    // WhatsApp Tab: Header
    wa_header_title: 'Meta WhatsApp 一键自动防御',
    wa_sandbox_badge: '100% 免费开发沙盒',
    wa_header_sub: 'Meta Cloud API 官方直连。无需登录后台，直接从手机 WhatsApp 几秒内快速抗辩退款。',
    wa_bot_ready: '在线 • 机器人就绪',

    // Customer Dispute Filing Link Card
    cust_portal_title: '客户争议提交链接 (与好友分享)',
    cust_portal_badge: '端到端实时生效',
    cust_portal_desc: '将此实时链接发送给客户或好友。他们提交争议后，2秒内您的 WhatsApp 就会收到一键抗辩警报！',
    cust_portal_copy: '复制链接',
    cust_portal_copied: '已复制',
    cust_portal_open: '打开',

    // Instant Friend Dispute Simulator Card
    sim_title: '即时好友争议模拟器 (实时测试)',
    sim_badge: '一键触发',
    sim_desc: '一键触发：系统将自动生成新争议，并直接将带有 1-Tap 自动抗辩按钮的警报推送到您的 WhatsApp。',
    sim_name_label: '好友 / 客户姓名',
    sim_amount_label: '金额 ($ USD)',
    sim_btn_dispatch: '🚀 发送好友争议到我的 WhatsApp',
    sim_btn_loading: '正在创建争议并推送到 WhatsApp...',
    sim_success_msg: '案件 {id} 已创建！WhatsApp 警报已发送到商家手机。',

    // Meta Access Token Update Card
    token_title: 'Meta 访问令牌更新 (24小时临时令牌)',
    token_step1: 'Meta 步骤 1',
    token_desc: '如果您的 Meta Developer 24小时测试令牌已过期，请在步骤1生成新令牌，粘贴在此并点击“更新令牌”。',
    token_placeholder: '粘贴 Meta 访问令牌 (EAADbNUHhHJoBS...)',
    token_btn: '更新并测试',
    token_verifying: '验证中...',
    token_active: '✅ Meta 令牌有效并已成功连接！',

    // Live Dispatcher Box
    dispatch_title: '向您的手机发送实时 WhatsApp 警报',
    dispatch_badge: '免费测试 ($0)',
    dispatch_targeting: '目标活跃案件：',
    dispatch_phone_label: '您的 WhatsApp 手机号 (包含国家代码)',
    dispatch_btn: '发送 WhatsApp 警报',
    dispatch_sending: '发送中...',
    dispatch_hint: '格式：包含国家代码，不含符号或空格 (例如：919876543210 或 8613800138000)。',
    dispatch_success: 'WhatsApp 警报已成功发出',

    // Webhook Handshake Config
    webhook_title: 'Meta Cloud API Webhook 握手配置',
    webhook_meta_devs: 'Meta 开发者平台',
    webhook_callback_label: '回调 URL (Webhook URL)',
    webhook_verify_label: '验证令牌 (Verify Token)',
    btn_copy: '复制',
    btn_copied: '已复制',

    // 2-Minute Setup Guide
    guide_title: '2分钟 Meta 开发者极速配置指南 (100% 免费沙盒)',
    guide_step1: '访问 developers.facebook.com，新建应用 (类型：其他 > 业务) 并添加 WhatsApp 产品。',
    guide_step2: '前往 WhatsApp > API 设置，在“至”下拉菜单中点击“管理电话号码列表”，添加真实 WhatsApp 号码并输入6位验证码完成验证。',
    guide_step3: '在配置 > Webhook 中点击编辑，粘贴上方的回调 URL 和验证令牌，并勾选订阅 messages 字段。',
    guide_step4: '在上方输入框中输入您的手机号并点击“发送 WhatsApp 警报” — 您的 WhatsApp 将立即收到带有一键操作按钮的互动消息！',

    // Phone Mockup
    phone_verified: '官方认证企业账户',
    phone_dispute_alert: '🚨 PayPal 争议警报：',
    phone_amount_at_risk: '风险金额：',
    phone_reason: '原因：',
    phone_ai_action: '⚡ AI 举证：FedEx 追踪证明已妥投并有收件人签名。',
    phone_btn_approve: '1. 批准并自动提交抗辩',
    phone_btn_defended: '已成功在 PayPal 提交抗辩',
    phone_btn_inspect: '2. 检查 POD 签收与证据',

    // TAB 3: Carrier Radar
    carrier_title: '实时物流 EDI 与承运商举证网关',
    carrier_sub: '承运商网关毫秒级同步，提供自动 GPS 验证签收证明。',
    carrier_connected: '已连接',
    carrier_status_edi: '已连接 (EDI 214)',
    carrier_status_rest: '已连接 (REST API)',
    carrier_status_soap: '已连接 (SOAP)',
    carrier_status_india: '已连接 (India API)',

    // TAB 4: Early Threat Radar
    warning_title: '争议前威胁与客户情绪扫描器',
    warning_sub: 'AI 实时监控客服会话，在争议升级为昂贵的 PayPal 扣款前提前拦截。',
    warning_btn_intercept: '立即拦截',
    warning_sent_toast: '已为订单 {order} 发送一键预防性解决方案',

    // TAB 5: Merchant Security
    sec_title: '商户安全与实时 PayPal 官方集成',
    sec_sub: '多租户数据完全隔离、零信任令牌认证及实时 PayPal 沙盒遥测。',
    sec_btn_ping: '测试 PayPal 连接响应',
    sec_pinging: '正在 Ping PayPal...',
    sec_wa_title: 'WhatsApp 一键自动处理调度器',
    sec_wa_sub: '无需登录，直接在商户手机上解决传入的争议警报',
    sec_btn_bot_preview: '打开机器人预览',
    sec_paypal_card_title: 'PayPal 沙盒 REST API 直连',
    sec_paypal_card_sub: 'OAuth2 与争议核心引擎即时握手',
    sec_active_connected: '运行中且已连接',
    sec_disconnected: '未连接',
    sec_tenant_title: '活跃店铺与租户隔离',
    sec_tenant_sub: '针对 {name} 的多租户数据库隔离分区',
    sec_btn_connect_another: '+ 连接另一个店铺',
    sec_active_store_label: '活跃商户店铺：',
    sec_verified_badge: 'PayPal 官方认证账户',
    sec_tenant_id_label: '商户租户 ID：',
    sec_payer_id_label: 'PayPal Payer ID：',
    sec_linked_label: '绑定时间：',
    sec_auth_token_label: '内部认证令牌：',
    sec_btn_copy_token: '复制令牌',
    idem_title: '实时 Webhook 幂等引擎测试',
    idem_sub: '模拟网络重传和重复争议攻击',
    idem_btn_testing: '正在测试幂等性...',
    idem_btn_simulate: '模拟重放重复 Webhook',
    idem_empty_hint: '点击“模拟重放重复 Webhook”并发发送两个相同的 Webhook 事件，实时见证唯一索引拦截重复扣款。',

    // Notification Toasts
    toast_lang_switched: '界面语言已切换为简体中文',
    toast_theme_switched: '已切换为 {theme} 主题',

    // Customer Resolution Portal (/report-issue)
    portal_page_title: 'PayPal 买家争议解决中心',
    portal_page_sub: '客户争议解决门户 — 提交争议即可触发即时一键防御并向商家 WhatsApp 发送通知。',
    portal_form_title: '提交实时交易争议',
    portal_form_desc: '使用此表单模拟客户售后问题。提交后将在数秒内将实时一键抗辩警报发送到商家 WhatsApp！',
    portal_field_case_id: 'PayPal 案件 / 争议 ID',
    portal_field_amount: '争议金额 ($ USD)',
    portal_field_cust_name: '客户 / 好友姓名',
    portal_field_cust_email: '客户邮箱',
    portal_field_reason: '争议原因',
    portal_opt_inr: '未收到商品 (Item Not Received)',
    portal_opt_snad: '商品严重不符 (Significantly Not As Described)',
    portal_opt_unauth: '未经授权的交易 (Unauthorised Transaction)',
    portal_field_details: '客户说明与争议详情',
    portal_btn_submit: '提交客户争议',
    portal_transmitting: '正在传输争议并提醒 WhatsApp...',
    portal_success_title: '争议提交成功！',
    portal_success_desc: '客户争议已正式录入 ResolvePay 和 PayPal 沙盒系统。',
    portal_wa_alert_title: '📱 WhatsApp 警报已发送至商家手机！',
    portal_wa_alert_desc: '实时一键抗辩警报已发送至商家的 WhatsApp 号码。商家可直接在手机上审查并抗辩此案例。',
    portal_btn_dashboard: '在商家控制台查看',
    portal_btn_another: '提交另一笔测试争议',

    // Connect PayPal Modal
    modal_paypal_title: '连接 PayPal 商业账户',
    modal_paypal_sub: 'OAuth 2.0 合作伙伴接入与自动同步',
    modal_store_name: '店铺 / 品牌名称',
    modal_business_email: '主要业务 PayPal 邮箱',
    modal_currency: '结算货币',
    modal_btn_connect: '发起 PayPal OAuth 2.0 授权',
    modal_connecting: '正在建立安全沙盒握手连接...',
  },

  es: {
    // Top Bar & App Info
    app_subtitle: 'Piloto automático de disputas de PayPal',
    search_placeholder: 'Buscar disputas por ID, comprador o importe...',
    connected_store: 'Tienda conectada',
    manage_stores: 'Gestionar tiendas',
    connect_new_store: '+ Conectar nueva tienda',
    theme: 'Tema',
    language: 'Idioma',
    preferences_actions: 'Preferencias y acciones',
    sync_disputes: 'Sincronizar disputas',
    paypal_sandbox: 'Entorno de pruebas de PayPal',
    connect_paypal: 'Conectar cuenta de PayPal',
    install_mobile_app: 'Instalar aplicación móvil',
    developer_simulation: 'Simulación de desarrollador',
    simulate_item_not_received: 'Simular artículo no recibido ($249.99)',
    simulate_unauthorized: 'Simular transacción no autorizada ($149.50)',
    reset_live_demo: 'Restablecer datos de demostración en vivo',

    // Navigation Tabs
    nav_disputes: 'Cola de disputas',
    nav_whatsapp: 'Piloto automático de WhatsApp',
    nav_carrier: 'Radar de telemetría de transportistas',
    nav_warning: 'Radar de amenazas tempranas',
    nav_settings: 'Seguridad del comerciante',

    // KPI Cards
    kpi_risk_title: 'Valor total en riesgo',
    kpi_risk_sub: 'Total de disputas • Defensa automatizada',
    kpi_action_title: 'Acción requerida',
    kpi_action_sub: 'Plazos de SLA urgentes activos',
    kpi_defended_title: 'Defendido y en revisión',
    kpi_defended_sub: 'Enviado por canal automatizado',
    kpi_win_title: 'Tasa de éxito de defensa IA',

    // Table Filters
    filter_all: 'Todas las disputas',
    filter_action: 'Acción requerida',
    filter_defended: 'Defendido / En revisión',
    total_count: 'Disputas encontradas',

    // Table Columns
    col_case_id: 'ID de caso / Referencia',
    col_buyer: 'Comprador / Cliente',
    col_amount: 'Importe en riesgo',
    col_evidence: 'Pruebas EDI',
    col_deadline: 'Cuenta regresiva SLA',
    col_ai_status: 'Estado de IA',
    col_actions: 'Acciones',
    btn_track_live: 'Rastrear en vivo',
    btn_review_defense: 'Revisar defensa',

    // WhatsApp Tab: Header
    wa_header_title: 'Piloto automático de Meta WhatsApp en 1 toque',
    wa_sandbox_badge: 'SANDBOX DE DESARROLLO 100% GRATIS',
    wa_header_sub: 'Integración directa con Meta Cloud API. Resuelve devoluciones desde tu WhatsApp en segundos con 0 inicios de sesión en el panel.',
    wa_bot_ready: 'EN LÍNEA • BOT LISTO',

    // Customer Dispute Filing Link Card
    cust_portal_title: 'Enlace de disputa de cliente (compartir con amigo)',
    cust_portal_badge: 'En vivo de extremo a extremo',
    cust_portal_desc: 'Envía este enlace activo a un cliente o amigo. Cuando envíen una disputa, ¡recibirás una alerta de 1 toque en tu WhatsApp en 2 segundos!',
    cust_portal_copy: 'Copiar enlace',
    cust_portal_copied: 'Copiado',
    cust_portal_open: 'Abrir',

    // Instant Friend Dispute Simulator Card
    sim_title: 'Simulador instantáneo de disputas (prueba en vivo)',
    sim_badge: 'Disparador de 1 clic',
    sim_desc: 'Disparador de 1 clic: el sistema crea una disputa en vivo y envía una alerta con un botón de auto-defensa de 1 toque directamente a tu WhatsApp.',
    sim_name_label: 'Nombre del amigo / cliente',
    sim_amount_label: 'Importe ($ USD)',
    sim_btn_dispatch: '🚀 Enviar disputa de amigo a mi WhatsApp',
    sim_btn_loading: 'Creando disputa y enviando a WhatsApp...',
    sim_success_msg: '¡Caso {id} registrado! Alerta de WhatsApp enviada al teléfono del comerciante.',

    // Meta Access Token Update Card
    token_title: 'Actualizar token de acceso de Meta (token de 24 horas)',
    token_step1: 'Meta Paso 1',
    token_desc: 'Si tu token de prueba de 24 horas de Meta Developer expira, genera uno nuevo en el Paso 1, pégalo aquí y presiona "Actualizar token".',
    token_placeholder: 'Pega el token de acceso de Meta (EAADbNUHhHJoBS...)',
    token_btn: 'Actualizar y probar',
    token_verifying: 'Verificando...',
    token_active: '✅ ¡El token de Meta está ACTIVO Y CONECTADO!',

    // Live Dispatcher Box
    dispatch_title: 'Enviar alerta en vivo de WhatsApp a tu teléfono',
    dispatch_badge: 'Prueba gratuita ($0)',
    dispatch_targeting: 'Caso activo objetivo:',
    dispatch_phone_label: 'Tu número de teléfono de WhatsApp (con código de país)',
    dispatch_btn: 'Enviar alerta de WhatsApp',
    dispatch_sending: 'Enviando...',
    dispatch_hint: 'Formato: Incluye código de país sin símbolos ni espacios (ej., 34612345678 o 5215512345678).',
    dispatch_success: 'Alerta de WhatsApp enviada con éxito',

    // Webhook Handshake Config
    webhook_title: 'Configuración Webhook de Meta Cloud API',
    webhook_meta_devs: 'Meta Developers',
    webhook_callback_label: 'URL de devolución de llamada (Webhook URL)',
    webhook_verify_label: 'Token de verificación',
    btn_copy: 'Copiar',
    btn_copied: 'Copiado',

    // 2-Minute Setup Guide
    guide_title: 'Guía de configuración de Meta Developer en 2 minutos (Sandbox gratis)',
    guide_step1: 'Ve a developers.facebook.com, crea una nueva aplicación (Tipo: Otro > Negocios) y agrega el producto WhatsApp.',
    guide_step2: 'En WhatsApp > Configuración de API, haz clic en "Administrar lista de números de teléfono" debajo de "Para", agrega tu número de WhatsApp y verifícalo con un código OTP de 6 dígitos.',
    guide_step3: 'En Configuración > Webhook, haz clic en Editar, pega la URL de devolución de llamada y el Token de verificación de arriba, y suscríbete al campo "messages".',
    guide_step4: '¡Ahora ingresa tu número arriba y haz clic en "Enviar alerta de WhatsApp": recibirás de inmediato un mensaje interactivo con un botón de 1 toque en tu WhatsApp!',

    // Phone Mockup
    phone_verified: 'cuenta de empresa verificada',
    phone_dispute_alert: '🚨 Alerta de disputa de PayPal:',
    phone_amount_at_risk: 'Importe en riesgo:',
    phone_reason: 'Motivo:',
    phone_ai_action: '⚡ Acción de IA: Rastreo de FedEx demuestra entrega con firma del destinatario.',
    phone_btn_approve: '1. Aprobar y enviar refutación automática',
    phone_btn_defended: 'Enviado y defendido en PayPal',
    phone_btn_inspect: '2. Inspeccionar comprobante y pruebas',

    // TAB 3: Carrier Radar
    carrier_title: 'Integraciones de pruebas de transportistas y EDI en vivo',
    carrier_sub: 'Pasarelas de transportistas sincronizadas que proporcionan comprobantes de entrega verificados por GPS.',
    carrier_connected: 'Conectado',
    carrier_status_edi: 'Conectado (EDI 214)',
    carrier_status_rest: 'Conectado (REST API)',
    carrier_status_soap: 'Conectado (SOAP)',
    carrier_status_india: 'Conectado (India API)',

    // TAB 4: Early Threat Radar
    warning_title: 'Escáner de sentimiento y amenazas previas a disputas',
    warning_sub: 'La IA supervisa las conversaciones de soporte para interceptar amenazas antes de que se conviertan en costosas disputas de PayPal.',
    warning_btn_intercept: 'Interceptar ahora',
    warning_sent_toast: 'Resolución preventiva enviada para {order}',

    // TAB 5: Merchant Security
    sec_title: 'Seguridad del comerciante e integración en vivo con PayPal',
    sec_sub: 'Aislamiento de datos multi-inquilino, autenticación de confianza cero y telemetría de PayPal Sandbox en tiempo real.',
    sec_btn_ping: 'Probar ping de conexión con PayPal',
    sec_pinging: 'Comprobando PayPal...',
    sec_wa_title: 'Despachador automático de WhatsApp en 1 toque',
    sec_wa_sub: 'Resuelve disputas entrantes directamente desde el teléfono del comerciante sin iniciar sesión',
    sec_btn_bot_preview: 'Abrir vista previa del bot',
    sec_paypal_card_title: 'Conexión REST API de PayPal Sandbox',
    sec_paypal_card_sub: 'Enlace directo de OAuth2 con el motor de disputas',
    sec_active_connected: 'ACTIVO Y CONECTADO',
    sec_disconnected: 'DESCONECTADO',
    sec_tenant_title: 'Aislamiento de tienda activa y multi-inquilino',
    sec_tenant_sub: 'Partición de base de datos aislada para {name}',
    sec_btn_connect_another: '+ Conectar otra tienda',
    sec_active_store_label: 'Tienda comercial activa:',
    sec_verified_badge: 'Cuenta verificada de PayPal',
    sec_tenant_id_label: 'ID de inquilino comerciante:',
    sec_payer_id_label: 'PayPal Payer ID:',
    sec_linked_label: 'Vinculado:',
    sec_auth_token_label: 'Token de autenticación interno:',
    sec_btn_copy_token: 'Copiar token',
    idem_title: 'Prueba del motor de idempotencia de webhooks en vivo',
    idem_sub: 'Simula retransmisiones de red y ataques de disputas duplicadas',
    idem_btn_testing: 'Probando idempotencia...',
    idem_btn_simulate: 'Simular webhook duplicado',
    idem_empty_hint: 'Haz clic en "Simular webhook duplicado" para enviar dos eventos webhook idénticos simultáneamente y presenciar el bloqueo de deducciones duplicadas.',

    // Notification Toasts
    toast_lang_switched: 'Idioma cambiado a Español',
    toast_theme_switched: 'Cambiado al tema {theme}',

    // Customer Resolution Portal (/report-issue)
    portal_page_title: 'Centro de resolución de compradores de PayPal',
    portal_page_sub: 'Portal de resolución de disputas de clientes — El envío genera una alerta instantánea de 1 toque al WhatsApp del comerciante.',
    portal_form_title: 'Presentar una disputa de transacción en vivo',
    portal_form_desc: 'Usa este formulario para simular un reclamo de cliente. ¡Al enviarlo, recibirás una alerta de defensa en tiempo real en WhatsApp en segundos!',
    portal_field_case_id: 'ID de caso / disputa de PayPal',
    portal_field_amount: 'Importe de disputa ($ USD)',
    portal_field_cust_name: 'Nombre del cliente / amigo',
    portal_field_cust_email: 'Correo electrónico del cliente',
    portal_field_reason: 'Motivo de la disputa',
    portal_opt_inr: 'Artículo no recibido (Item Not Received)',
    portal_opt_snad: 'Artículo muy diferente al descrito (SNAD)',
    portal_opt_unauth: 'Transacción no autorizada',
    portal_field_details: 'Explicación del cliente y detalles',
    portal_btn_submit: 'Enviar disputa de cliente',
    portal_transmitting: 'Transmitiendo disputa y alertando a WhatsApp...',
    portal_success_title: '¡Disputa presentada con éxito!',
    portal_success_desc: 'La disputa del cliente ha sido registrada oficialmente en el entorno de pruebas de ResolvePay y PayPal.',
    portal_wa_alert_title: '📱 ¡Alerta de WhatsApp enviada al teléfono del comerciante!',
    portal_wa_alert_desc: 'Se ha enviado una alerta de refutación de 1 toque al número de WhatsApp del comerciante. El comerciante puede revisar y defender la disputa directamente desde su teléfono.',
    portal_btn_dashboard: 'Ver en panel del comerciante',
    portal_btn_another: 'Presentar otra disputa de prueba',

    // Connect PayPal Modal
    modal_paypal_title: 'Conectar cuenta comercial de PayPal',
    modal_paypal_sub: 'Incorporación de socios y sincronización automática OAuth 2.0',
    modal_store_name: 'Nombre de la tienda / marca',
    modal_business_email: 'Correo electrónico principal de PayPal Business',
    modal_currency: 'Moneda de liquidación',
    modal_btn_connect: 'Iniciar conexión PayPal OAuth 2.0',
    modal_connecting: 'Estableciendo enlace seguro de pruebas...',
  },

  ja: {
    // Top Bar & App Info
    app_subtitle: 'PayPal 異議申し立て自動対応エンジン',
    search_placeholder: 'ケースID、購入者名、または金額で検索...',
    connected_store: '接続中のストア',
    manage_stores: 'ストア管理',
    connect_new_store: '+ 新しいストアを接続',
    theme: 'テーマ',
    language: '言語',
    preferences_actions: '設定とアクション',
    sync_disputes: '異議申し立てを同期',
    paypal_sandbox: 'PayPal サンドボックス',
    connect_paypal: 'PayPal アカウントを接続',
    install_mobile_app: 'モバイルアプリをインストール',
    developer_simulation: '開発者シミュレーション',
    simulate_item_not_received: '未着異議申し立てをシミュレート ($249.99)',
    simulate_unauthorized: '未承認取引異議をシミュレート ($149.50)',
    reset_live_demo: 'デモデータをリセット',

    // Navigation Tabs
    nav_disputes: '異議申し立てキュー',
    nav_whatsapp: 'WhatsApp オートパイロット',
    nav_carrier: '配送キャリアテレメトリレーダー',
    nav_warning: '早期脅威検知レーダー',
    nav_settings: '加盟店セキュリティ設定',

    // KPI Cards
    kpi_risk_title: 'リスク総額',
    kpi_risk_sub: '総異議申し立て件数 • 自動防御保護',
    kpi_action_title: '対応要件',
    kpi_action_sub: '緊急 SLA 期限が進行中',
    kpi_defended_title: '防御済み / 審査中',
    kpi_defended_sub: '自動パイプライン経由で提出済み',
    kpi_win_title: 'AI 防御勝率',

    // Table Filters
    filter_all: 'すべての異議申し立て',
    filter_action: '要対応',
    filter_defended: '防御済み / 審査中',
    total_count: '見つかった件数',

    // Table Columns
    col_case_id: 'ケースID / 参照番号',
    col_buyer: '購入者 / 顧客',
    col_amount: 'リスク金額',
    col_evidence: 'EDI 物流証拠',
    col_deadline: 'SLA カウントダウン',
    col_ai_status: 'AI ステータス',
    col_actions: 'アクション',
    btn_track_live: 'リアルタイム追跡',
    btn_review_defense: '反論書を確認',

    // WhatsApp Tab: Header
    wa_header_title: 'Meta WhatsApp 1タップ オートパイロット',
    wa_sandbox_badge: '100% 無料開発サンドボックス',
    wa_header_sub: 'Meta Cloud API 直接連携。ダッシュボードへのログイン不要で、WhatsApp から数秒でチャージバックに反論できます。',
    wa_bot_ready: 'オンライン • ボット待機中',

    // Customer Dispute Filing Link Card
    cust_portal_title: '顧客異議申し立て提出リンク (友人と共有)',
    cust_portal_badge: 'エンドツーエンド稼働中',
    cust_portal_desc: 'このリンクを顧客または友人に送信します。相手が異議を送信すると、2秒以内にあなたの WhatsApp へ1タップ通知が届きます！',
    cust_portal_copy: 'リンクをコピー',
    cust_portal_copied: 'コピー完了',
    cust_portal_open: '開く',

    // Instant Friend Dispute Simulator Card
    sim_title: '即時異議申し立てシミュレーター (ライブテスト)',
    sim_badge: '1クリック起動',
    sim_desc: '1クリックで新規異議申し立てを自動生成し、WhatsApp に1タップ自動防御ボタン付きアラートを直接送信します。',
    sim_name_label: '友人 / 顧客の名前',
    sim_amount_label: '金額 ($ USD)',
    sim_btn_dispatch: '🚀 異議アラートを WhatsApp に送信',
    sim_btn_loading: '異議を作成して WhatsApp へ送信中...',
    sim_success_msg: 'ケース {id} が作成されました！加盟店の電話へ WhatsApp アラートを送信しました。',

    // Meta Access Token Update Card
    token_title: 'Meta アクセストークン更新 (24時間トークン)',
    token_step1: 'Meta ステップ 1',
    token_desc: 'Meta Developer の24時間テストトークンが期限切れになった場合は、ステップ1で新規発行し、ここに貼り付けて「トークン更新」をクリックしてください。',
    token_placeholder: 'Meta アクセストークンを貼り付け (EAADbNUHhHJoBS...)',
    token_btn: '更新＆接続テスト',
    token_verifying: '検証中...',
    token_active: '✅ Meta トークンはアクティブで接続されています！',

    // Live Dispatcher Box
    dispatch_title: 'スマートフォンへライブ WhatsApp 通知を送信',
    dispatch_badge: '無料テスト ($0)',
    dispatch_targeting: '対象のアクティブケース：',
    dispatch_phone_label: 'あなたの WhatsApp 電話番号 (国番号付き)',
    dispatch_btn: 'WhatsApp アラートを送信',
    dispatch_sending: '送信中...',
    dispatch_hint: '形式：記号や空白を含まない国番号付き番号 (例: 819012345678 または 919876543210)。',
    dispatch_success: 'WhatsApp アラートが正常にディスパッチされました',

    // Webhook Handshake Config
    webhook_title: 'Meta Cloud API Webhook ハンドシェイク設定',
    webhook_meta_devs: 'Meta 開発者ポータル',
    webhook_callback_label: 'コールバック URL (Webhook URL)',
    webhook_verify_label: '検証トークン (Verify Token)',
    btn_copy: 'コピー',
    btn_copied: 'コピー完了',

    // 2-Minute Setup Guide
    guide_title: '2分で完了！Meta 開発者設定ガイド (完全無料サンドボックス)',
    guide_step1: 'developers.facebook.com にアクセスし、新しいアプリを作成（タイプ：その他 > ビジネス）して WhatsApp 製品を追加します。',
    guide_step2: 'WhatsApp > API設定の「送信先」プルダウンで「電話番号リストの管理」をクリックし、実際の電話番号を追加して6桁のOTPで認証します。',
    guide_step3: '設定 > Webhook で編集をクリックし、上記のコールバックURLと検証トークンを入力して「messages」フィールドを購読します。',
    guide_step4: '上の入力欄に電話番号を入力して「WhatsApp アラートを送信」をクリックします — すぐに1タップボタン付きメッセージが届きます！',

    // Phone Mockup
    phone_verified: '認証済みビジネスアカウント',
    phone_dispute_alert: '🚨 PayPal 異議申し立てアラート：',
    phone_amount_at_risk: 'リスク金額：',
    phone_reason: '理由：',
    phone_ai_action: '⚡ AI アクション：FedEx の追跡により署名付き配達完了が立証されています。',
    phone_btn_approve: '1. 承認して反論書を自動提出',
    phone_btn_defended: 'PayPal にて防御提出完了',
    phone_btn_inspect: '2. 配達証明 (POD) と証拠を確認',

    // TAB 3: Carrier Radar
    carrier_title: 'ライブ物流 EDI ＆ キャリア配達証明統合',
    carrier_sub: 'GPS 認証済みの配達証明をミリ秒単位で自動同期するキャリアゲートウェイ。',
    carrier_connected: '接続完了',
    carrier_status_edi: '接続完了 (EDI 214)',
    carrier_status_rest: '接続完了 (REST API)',
    carrier_status_soap: '接続完了 (SOAP)',
    carrier_status_india: '接続完了 (India API)',

    // TAB 4: Early Threat Radar
    warning_title: '異議申し立て前の脅威・顧客感情スキャナー',
    warning_sub: 'AI がサポートチケットを監視し、高額なチャージバックに発展する前にトラブルを先回りして検知・解決します。',
    warning_btn_intercept: '先回り対応を実行',
    warning_sent_toast: '注文 {order} に対するワンクリック事前解決策を送信しました',

    // TAB 5: Merchant Security
    sec_title: '加盟店セキュリティ ＆ リアルタイム PayPal 公式連携',
    sec_sub: 'マルチテナントデータ完全分離、ゼロトラスト認証、リアルタイム PayPal サンドボックステレメトリ。',
    sec_btn_ping: 'PayPal 接続テストを実行',
    sec_pinging: 'PayPal に ping 実行中...',
    sec_wa_title: 'WhatsApp 1タップ 自動対応ディスパッチャー',
    sec_wa_sub: 'ログイン不要で加盟店のスマートフォンから直接アラートに対応',
    sec_btn_bot_preview: 'ボットプレビューを開く',
    sec_paypal_card_title: 'PayPal サンドボックス REST API 直結',
    sec_paypal_card_sub: 'OAuth2 ＆ 異議申し立てエンジン即時ハンドシェイク',
    sec_active_connected: '稼働中 ＆ 正常接続',
    sec_disconnected: '切断中',
    sec_tenant_title: 'アクティブストア ＆ テナント完全分離',
    sec_tenant_sub: '{name} 専用の独立データベースパーティション',
    sec_btn_connect_another: '+ 別のストアを追加接続',
    sec_active_store_label: 'アクティブなビジネスストア：',
    sec_verified_badge: 'PayPal 認証済みアカウント',
    sec_tenant_id_label: '加盟店テナント ID：',
    sec_payer_id_label: 'PayPal Payer ID：',
    sec_linked_label: '連携日時：',
    sec_auth_token_label: '内部認証トークン：',
    sec_btn_copy_token: 'トークンをコピー',
    idem_title: 'リアルタイム Webhook 冪等性エンジンテスト',
    idem_sub: 'ネットワークの再送と重複異議申し立て攻撃をシミュレート',
    idem_btn_testing: '冪等性をテスト中...',
    idem_btn_simulate: '重複 Webhook をシミュレート',
    idem_empty_hint: '「重複 Webhook をシミュレート」をクリックして2つの同一 Webhook を同時に送信し、重複引き落としがリアルタイムで遮断される動作を確認します。',

    // Notification Toasts
    toast_lang_switched: '言語を日本語に切り替えました',
    toast_theme_switched: '{theme} テーマに切り替えました',

    // Customer Resolution Portal (/report-issue)
    portal_page_title: 'PayPal 購入者問題解決センター',
    portal_page_sub: '顧客異議申し立てポータル — 申請を行うと、加盟店の WhatsApp へ即時に1タップ防御アラートが送信されます。',
    portal_form_title: 'リアルタイム取引異議申し立ての提出',
    portal_form_desc: 'このフォームを使って購入者トラブルをシミュレートできます。送信後、加盟店の WhatsApp へ数秒で通知が届きます！',
    portal_field_case_id: 'PayPal ケース / 異議申し立て ID',
    portal_field_amount: '異議申し立て金額 ($ USD)',
    portal_field_cust_name: '顧客 / 友人の氏名',
    portal_field_cust_email: '顧客メールアドレス',
    portal_field_reason: '異議申し立ての理由',
    portal_opt_inr: '商品未着 (Item Not Received)',
    portal_opt_snad: '説明と著しく異なる商品 (SNAD)',
    portal_opt_unauth: '未承認取引 (Unauthorised Transaction)',
    portal_field_details: '顧客の説明および問題の詳細',
    portal_btn_submit: '顧客異議申し立てを送信',
    portal_transmitting: '異議を送信し WhatsApp へ通知中...',
    portal_success_title: '異議申し立てが正常に受理されました！',
    portal_success_desc: '顧客の異議申し立ては ResolvePay および PayPal サンドボックスシステムに正式に登録されました。',
    portal_wa_alert_title: '📱 加盟店のスマートフォンへ WhatsApp アラートを送信しました！',
    portal_wa_alert_desc: '加盟店の WhatsApp 番号へ1タップ反論通知を送信しました。加盟店はスマートフォンから直接ケースを確認し、反論することができます。',
    portal_btn_dashboard: '加盟店ダッシュボードで確認',
    portal_btn_another: '別のテスト異議を送信する',

    // Connect PayPal Modal
    modal_paypal_title: 'PayPal ビジネスアカウントの接続',
    modal_paypal_sub: 'OAuth 2.0 パートナー連携＆自動同期',
    modal_store_name: 'ストア / ブランド名',
    modal_business_email: '主要ビジネス PayPal メールアドレス',
    modal_currency: '決済通貨',
    modal_btn_connect: 'PayPal OAuth 2.0 連携を開始',
    modal_connecting: '安全なサンドボックス接続を確立中...',
  },

  de: {
    // Top Bar & App Info
    app_subtitle: 'PayPal Konflikt-Autopilot',
    search_placeholder: 'Konflikte nach ID, Käufer oder Betrag suchen...',
    connected_store: 'Verbundener Shop',
    manage_stores: 'Shops verwalten',
    connect_new_store: '+ Neuen Shop verbinden',
    theme: 'Design',
    language: 'Sprache',
    preferences_actions: 'Einstellungen & Aktionen',
    sync_disputes: 'Konflikte synchronisieren',
    paypal_sandbox: 'PayPal Sandbox',
    connect_paypal: 'PayPal-Konto verbinden',
    install_mobile_app: 'Mobile App installieren',
    developer_simulation: 'Entwickler-Simulation',
    simulate_item_not_received: 'Artikel nicht erhalten simulieren ($249.99)',
    simulate_unauthorized: 'Unautorisierte Transaktion simulieren ($149.50)',
    reset_live_demo: 'Live-Demo-Daten zurücksetzen',

    // Navigation Tabs
    nav_disputes: 'Konflikt-Warteschlange',
    nav_whatsapp: 'WhatsApp-Autopilot',
    nav_carrier: 'Versanddienstleister-Telemetrieradar',
    nav_warning: 'Frühwarnradar für Bedrohungen',
    nav_settings: 'Händlersicherheit',

    // KPI Cards
    kpi_risk_title: 'Gefährdeter Gesamtwert',
    kpi_risk_sub: 'Konflikte gesamt • Automatisierte Abwehr',
    kpi_action_title: 'Handlungsbedarf',
    kpi_action_sub: 'Dringende SLA-Fristen aktiv',
    kpi_defended_title: 'Verteidigt & In Prüfung',
    kpi_defended_sub: 'Über automatische Pipeline eingereicht',
    kpi_win_title: 'KI-Abwehr-Erfolgsquote',

    // Table Filters
    filter_all: 'Alle Konflikte',
    filter_action: 'Handlung erforderlich',
    filter_defended: 'Verteidigt / In Prüfung',
    total_count: 'Gefundene Konflikte',

    // Table Columns
    col_case_id: 'Fall-ID / Referenz',
    col_buyer: 'Käufer / Kunde',
    col_amount: 'Gefährdeter Betrag',
    col_evidence: 'EDI-Versandnachweis',
    col_deadline: 'SLA-Countdown',
    col_ai_status: 'KI-Status',
    col_actions: 'Aktionen',
    btn_track_live: 'Live verfolgen',
    btn_review_defense: 'Abwehr prüfen',

    // WhatsApp Tab: Header
    wa_header_title: 'Meta WhatsApp 1-Tap Autopilot',
    wa_sandbox_badge: '100% KOSTENLOSE ENTWICKLER-SANDBOX',
    wa_header_sub: 'Direkte Meta Cloud API-Integration. Lösen Sie Rückbuchungen sekundenschnell direkt über WhatsApp ohne Dashboard-Login.',
    wa_bot_ready: 'ONLINE • BOT BEREIT',

    // Customer Dispute Filing Link Card
    cust_portal_title: 'Kunden-Konflikt-Link (Mit Freund teilen)',
    cust_portal_badge: 'End-to-End Live',
    cust_portal_desc: 'Senden Sie diesen Link an einen Kunden oder Freund. Sobald dieser einen Fall einreicht, erhalten Sie in 2 Sekunden einen 1-Tap-Alert auf WhatsApp!',
    cust_portal_copy: 'Link kopieren',
    cust_portal_copied: 'Kopiert',
    cust_portal_open: 'Öffnen',

    // Instant Friend Dispute Simulator Card
    sim_title: 'Sofort-Konflikt-Simulator (Live-Test)',
    sim_badge: '1-Klick-Auslöser',
    sim_desc: '1-Klick-Auslöser: Das System erstellt einen neuen Fall und sendet sofort eine Benachrichtigung mit 1-Tap-Abwehr-Button an Ihr WhatsApp.',
    sim_name_label: 'Name des Freundes / Kunden',
    sim_amount_label: 'Betrag ($ USD)',
    sim_btn_dispatch: '🚀 Test-Konflikt an mein WhatsApp senden',
    sim_btn_loading: 'Konflikt wird erstellt & an WhatsApp gesendet...',
    sim_success_msg: 'Fall {id} erstellt! WhatsApp-Benachrichtigung an Händlertelefon gesendet.',

    // Meta Access Token Update Card
    token_title: 'Meta-Zugriffstoken-Aktualisierung (24h-Token)',
    token_step1: 'Meta Schritt 1',
    token_desc: 'Wenn Ihr 24h-Testtoken für Meta Developer abläuft, generieren Sie in Schritt 1 einen neuen, fügen ihn hier ein und klicken auf "Token aktualisieren".',
    token_placeholder: 'Meta-Zugriffstoken einfügen (EAADbNUHhHJoBS...)',
    token_btn: 'Aktualisieren & Testen',
    token_verifying: 'Wird überprüft...',
    token_active: '✅ Meta-Token ist AKTIV & VERBUNDEN!',

    // Live Dispatcher Box
    dispatch_title: 'Live-WhatsApp-Alarm an Ihr Telefon senden',
    dispatch_badge: 'Kostenloser Test ($0)',
    dispatch_targeting: 'Ziel aktiver Fall:',
    dispatch_phone_label: 'Ihre WhatsApp-Telefonnummer (mit Ländervorwahl)',
    dispatch_btn: 'WhatsApp-Alarm senden',
    dispatch_sending: 'Wird gesendet...',
    dispatch_hint: 'Format: Ländervorwahl ohne Sonderzeichen oder Leerzeichen (z. B. 491701234567 oder 919876543210).',
    dispatch_success: 'WhatsApp-Alarm erfolgreich versendet',

    // Webhook Handshake Config
    webhook_title: 'Meta Cloud API Webhook-Handshake-Konfiguration',
    webhook_meta_devs: 'Meta Developers',
    webhook_callback_label: 'Callback-URL (Webhook-URL)',
    webhook_verify_label: 'Verifizierungstoken (Verify Token)',
    btn_copy: 'Kopieren',
    btn_copied: 'Kopiert',

    // 2-Minute Setup Guide
    guide_title: '2-Minuten Meta Developer Setup-Anleitung (100% Gratis-Sandbox)',
    guide_step1: 'Gehen Sie zu developers.facebook.com, erstellen Sie eine neue App (Typ: Andere > Unternehmen) und fügen Sie das WhatsApp-Produkt hinzu.',
    guide_step2: 'Unter WhatsApp > API-Setup wählen Sie unter "An" die Option "Telefonnummernliste verwalten", fügen Ihre Handynummer hinzu und bestätigen sie mit einem 6-stelligen OTP.',
    guide_step3: 'Klicken Sie unter Konfiguration > Webhook auf Bearbeiten, fügen Sie die obige Callback-URL und den Verifizierungstoken ein und abonnieren Sie das Feld "messages".',
    guide_step4: 'Geben Sie nun oben Ihre Nummer ein und klicken Sie auf "WhatsApp-Alarm senden" — Sie erhalten sofort eine interaktive Nachricht mit 1-Tap-Button auf WhatsApp!',

    // Phone Mockup
    phone_verified: 'Verifiziertes Unternehmenskonto',
    phone_dispute_alert: '🚨 PayPal-Konflikt-Alarm:',
    phone_amount_at_risk: 'Gefährdeter Betrag:',
    phone_reason: 'Grund:',
    phone_ai_action: '⚡ KI-Aktion: FedEx-Tracking belegt Zustellung mit Unterschrift des Empfängers.',
    phone_btn_approve: '1. Freigeben & Gegendarstellung einreichen',
    phone_btn_defended: 'Erfolgreich bei PayPal verteidigt',
    phone_btn_inspect: '2. Zustellnachweis (POD) einsehen',

    // TAB 3: Carrier Radar
    carrier_title: 'Live-Logistik-EDI & Versanddienstleister-Nachweise',
    carrier_sub: 'Synchronisierte Versand-Gateways mit automatischer GPS-geprüfter Zustellungsbestätigung.',
    carrier_connected: 'Verbunden',
    carrier_status_edi: 'Verbunden (EDI 214)',
    carrier_status_rest: 'Verbunden (REST API)',
    carrier_status_soap: 'Verbunden (SOAP)',
    carrier_status_india: 'Verbunden (India API)',

    // TAB 4: Early Threat Radar
    warning_title: 'Scanner für Vorab-Bedrohungen & Kundenstimmung',
    warning_sub: 'KI überwacht Support-Tickets in Echtzeit, um Streitigkeiten abzuwenden, bevor kostspielige PayPal-Rückbuchungen entstehen.',
    warning_btn_intercept: 'Jetzt intervenieren',
    warning_sent_toast: 'Präventive 1-Klick-Lösung für {order} gesendet',

    // TAB 5: Merchant Security
    sec_title: 'Händlersicherheit & Live-PayPal-Integration',
    sec_sub: 'Multi-Tenant-Datenisolierung, Zero-Trust-Authentifizierung und Live-Telemetrie der PayPal-Sandbox.',
    sec_btn_ping: 'PayPal-Verbindungstest ausführen',
    sec_pinging: 'PayPal wird angefragt...',
    sec_wa_title: 'WhatsApp 1-Tap Autopilot-Dispatch',
    sec_wa_sub: 'Löst eingehende Konflikte direkt vom Händler-Smartphone ohne Anmeldung',
    sec_btn_bot_preview: 'Bot-Vorschau öffnen',
    sec_paypal_card_title: 'PayPal Sandbox REST API-Verbindung',
    sec_paypal_card_sub: 'Direkter OAuth2-Handshake mit der Konflikt-Engine',
    sec_active_connected: 'AKTIV & VERBUNDEN',
    sec_disconnected: 'GETRENNT',
    sec_tenant_title: 'Aktiver Shop & Mandantentrennung',
    sec_tenant_sub: 'Isolierte Datenbankpartition für {name}',
    sec_btn_connect_another: '+ Weiteren Shop verbinden',
    sec_active_store_label: 'Aktiver Unternehmens-Shop:',
    sec_verified_badge: 'Von PayPal verifiziertes Konto',
    sec_tenant_id_label: 'Händler-Mandanten-ID:',
    sec_payer_id_label: 'PayPal Payer-ID:',
    sec_linked_label: 'Verknüpft am:',
    sec_auth_token_label: 'Internes Authentifizierungstoken:',
    sec_btn_copy_token: 'Token kopieren',
    idem_title: 'Echtzeit-Webhook-Idempotenz-Test',
    idem_sub: 'Simuliert Netzwerk-Wiederholungen und doppelte Konflikt-Angriffe',
    idem_btn_testing: 'Idempotenz wird getestet...',
    idem_btn_simulate: 'Doppelten Webhook simulieren',
    idem_empty_hint: 'Klicken Sie auf "Doppelten Webhook simulieren", um zwei identische Webhook-Ereignisse gleichzeitig zu senden und die Sperrung doppelter Belastungen zu sehen.',

    // Notification Toasts
    toast_lang_switched: 'Sprache auf Deutsch umgestellt',
    toast_theme_switched: 'Zu Design {theme} gewechselt',

    // Customer Resolution Portal (/report-issue)
    portal_page_title: 'PayPal Käufer-Klärungszentrum',
    portal_page_sub: 'Kunden-Konfliktlösungsportal — Das Einreichen sendet sofort einen 1-Tap-Alarm an das WhatsApp des Händlers.',
    portal_form_title: 'Einen Live-Transaktionskonflikt melden',
    portal_form_desc: 'Verwenden Sie dieses Formular, um einen Kundenfall zu simulieren. Nach dem Absenden wird in Sekunden ein Echtzeit-Abwehr-Alert an WhatsApp gesendet!',
    portal_field_case_id: 'PayPal Fall- / Konflikt-ID',
    portal_field_amount: 'Konfliktbetrag ($ USD)',
    portal_field_cust_name: 'Name des Kunden / Freundes',
    portal_field_cust_email: 'E-Mail des Kunden',
    portal_field_reason: 'Grund des Konflikts',
    portal_opt_inr: 'Artikel nicht erhalten (Item Not Received)',
    portal_opt_snad: 'Artikel weicht erheblich ab (SNAD)',
    portal_opt_unauth: 'Unautorisierte Transaktion',
    portal_field_details: 'Kundenerklärung & Falldetails',
    portal_btn_submit: 'Kundenkonflikt einreichen',
    portal_transmitting: 'Konflikt wird übermittelt & WhatsApp alarmiert...',
    portal_success_title: 'Konflikt erfolgreich eingereicht!',
    portal_success_desc: 'Der Kundenkonflikt wurde offiziell im ResolvePay- & PayPal-Sandbox-System registriert.',
    portal_wa_alert_title: '📱 WhatsApp-Alarm an Händlertelefon gesendet!',
    portal_wa_alert_desc: 'Ein 1-Tap-Gegendarstellungs-Alarm wurde an die WhatsApp-Nummer des Händlers gesendet. Der Händler kann den Fall direkt von seinem Telefon aus verteidigen.',
    portal_btn_dashboard: 'Im Händler-Dashboard anzeigen',
    portal_btn_another: 'Weiteren Test-Konflikt einreichen',

    // Connect PayPal Modal
    modal_paypal_title: 'PayPal-Geschäftskonto verbinden',
    modal_paypal_sub: 'OAuth 2.0 Partner-Onboarding & automatische Synchronisierung',
    modal_store_name: 'Shop- / Markenname',
    modal_business_email: 'Primäre geschäftliche PayPal-E-Mail',
    modal_currency: 'Abrechnungswährung',
    modal_btn_connect: 'PayPal OAuth 2.0-Verbindung starten',
    modal_connecting: 'Sichere Sandbox-Verbindung wird hergestellt...',
  },

  hi: {
    // Top Bar & App Info
    app_subtitle: 'PayPal विवाद ऑटोपायलट इंजन',
    search_placeholder: 'आईडी, ग्राहक का नाम या राशि से खोजें...',
    connected_store: 'जुड़ा हुआ स्टोर',
    manage_stores: 'स्टोर प्रबंधित करें',
    connect_new_store: '+ नया स्टोर जोड़ें',
    theme: 'थीम',
    language: 'भाषा',
    preferences_actions: 'प्राथमिकताएं और क्रियाएं',
    sync_disputes: 'विवाद सिंक करें',
    paypal_sandbox: 'PayPal सैंडबॉक्स',
    connect_paypal: 'PayPal खाता जोड़ें',
    install_mobile_app: 'मोबाइल ऐप इंस्टॉल करें',
    developer_simulation: 'डेवलपर सिमुलेशन',
    simulate_item_not_received: 'सामान नहीं मिला विवाद सिमुलेट करें ($249.99)',
    simulate_unauthorized: 'अनधिकृत लेनदेन विवाद सिमुलेट करें ($149.50)',
    reset_live_demo: 'लाइव डेमो डेटा रीसेट करें',

    // Navigation Tabs
    nav_disputes: 'विवाद कतार',
    nav_whatsapp: 'WhatsApp ऑटोपायलट',
    nav_carrier: 'कूरियर टेलीमेट्री रडार',
    nav_warning: 'प्रारंभिक खतरा रडार',
    nav_settings: 'व्यापारी सुरक्षा केंद्र',

    // KPI Cards
    kpi_risk_title: 'जोखिम में कुल राशि',
    kpi_risk_sub: 'कुल विवाद • स्वचालित सुरक्षा प्रणाली',
    kpi_action_title: 'आवश्यक कार्रवाई',
    kpi_action_sub: 'अति आवश्यक SLA समयसीमा सक्रिय',
    kpi_defended_title: 'सुरक्षित एवं समीक्षाधीन',
    kpi_defended_sub: 'स्वचालित पाइपलाइन द्वारा प्रस्तुत',
    kpi_win_title: 'AI बचाव जीत अनुपात',

    // Table Filters
    filter_all: 'सभी विवाद',
    filter_action: 'कार्रवाई आवश्यक',
    filter_defended: 'सुरक्षित / समीक्षाधीन',
    total_count: 'मिले विवाद',

    // Table Columns
    col_case_id: 'केस आईडी / संदर्भ',
    col_buyer: 'खरीदार / ग्राहक',
    col_amount: 'जोखिम राशि',
    col_evidence: 'EDI लॉजिस्टिक्स साक्ष्य',
    col_deadline: 'SLA काउंटडाउन',
    col_ai_status: 'AI स्थिति',
    col_actions: 'कार्रवाई',
    btn_track_live: 'लाइव ट्रैक करें',
    btn_review_defense: 'बचाव की समीक्षा करें',

    // WhatsApp Tab: Header
    wa_header_title: 'Meta WhatsApp 1-टैप ऑटोपायलट',
    wa_sandbox_badge: '100% मुफ़्त डेवलपर सैंडबॉक्स',
    wa_header_sub: 'सीधा Meta Cloud API एकीकरण। डैशबोर्ड में लॉगिन किए बिना, अपने WhatsApp से सेकंडों में चार्जबैक का समाधान करें।',
    wa_bot_ready: 'ऑनलाइन • बॉट तैयार है',

    // Customer Dispute Filing Link Card
    cust_portal_title: 'ग्राहक विवाद दर्ज करने का लिंक (मित्र के साथ साझा करें)',
    cust_portal_badge: 'एंड-टू-एंड लाइव',
    cust_portal_desc: 'यह लाइव लिंक अपने ग्राहक या मित्र को भेजें। जब वे विवाद सबमिट करेंगे, तो 2 सेकंड में आपके WhatsApp पर 1-टैप अलर्ट आ जाएगा!',
    cust_portal_copy: 'लिंक कॉपी करें',
    cust_portal_copied: 'कॉपी हो गया',
    cust_portal_open: 'खोलें',

    // Instant Friend Dispute Simulator Card
    sim_title: 'त्वरित मित्र विवाद सिम्युलेटर (लाइव टेस्ट)',
    sim_badge: '1-क्लिक ट्रिगर',
    sim_desc: '1-क्लिक ट्रिगर: सिस्टम एक नया विवाद बनाएगा और सीधे आपके WhatsApp पर 1-टैप ऑटो-डिफेंड बटन के साथ अलर्ट भेजेगा।',
    sim_name_label: 'मित्र / ग्राहक का नाम',
    sim_amount_label: 'राशि ($ USD)',
    sim_btn_dispatch: '🚀 मित्र का विवाद मेरे WhatsApp पर भेजें',
    sim_btn_loading: 'विवाद बनाकर WhatsApp पर भेजा जा रहा है...',
    sim_success_msg: 'केस {id} दर्ज हो गया! व्यापारी के फोन पर WhatsApp अलर्ट भेज दिया गया है।',

    // Meta Access Token Update Card
    token_title: 'Meta एक्सेस टोकन अपडेट (24 घंटे का टोकन)',
    token_step1: 'Meta स्टेप 1',
    token_desc: 'यदि आपका Meta Developer 24 घंटे का टेस्ट टोकन समाप्त हो जाता है, तो स्टेप 1 से नया टोकन जनरेट करें, यहां पेस्ट करें और "अपडेट टोकन" पर क्लिक करें।',
    token_placeholder: 'Meta एक्सेस टोकन पेस्ट करें (EAADbNUHhHJoBS...)',
    token_btn: 'अपडेट और टेस्ट करें',
    token_verifying: 'सत्यापित किया जा रहा है...',
    token_active: '✅ Meta टोकन सक्रिय और कनेक्टेड है!',

    // Live Dispatcher Box
    dispatch_title: 'अपने फोन पर लाइव WhatsApp अलर्ट भेजें',
    dispatch_badge: 'मुफ़्त परीक्षण ($0)',
    dispatch_targeting: 'लक्षित सक्रिय केस:',
    dispatch_phone_label: 'आपका WhatsApp फोन नंबर (देश कोड सहित)',
    dispatch_btn: 'WhatsApp अलर्ट भेजें',
    dispatch_sending: 'भेजा जा रहा है...',
    dispatch_hint: 'प्रारूप: बिना किसी चिन्ह या स्पेस के देश कोड शामिल करें (जैसे, 919876543210)।',
    dispatch_success: 'WhatsApp अलर्ट सफलतापूर्वक भेज दिया गया',

    // Webhook Handshake Config
    webhook_title: 'Meta Cloud API वेबहुक हैंडशेक कॉन्फ़िगरेशन',
    webhook_meta_devs: 'Meta डेवलपर्स',
    webhook_callback_label: 'कॉलबैक यूआरएल (Webhook URL)',
    webhook_verify_label: 'सत्यापन टोकन (Verify Token)',
    btn_copy: 'कॉपी करें',
    btn_copied: 'कॉपी हो गया',

    // 2-Minute Setup Guide
    guide_title: '2 मिनट Meta Developer सेटअप गाइड (100% मुफ़्त सैंडबॉक्स)',
    guide_step1: 'developers.facebook.com पर जाएं, नया ऐप बनाएं (प्रकार: अन्य > व्यवसाय) और WhatsApp उत्पाद जोड़ें।',
    guide_step2: 'WhatsApp > API सेटअप में "To" ड्रॉपडाउन के तहत "फ़ोन नंबर सूची प्रबंधित करें" पर क्लिक करें, अपना WhatsApp नंबर जोड़ें और 6-अंकीय OTP से सत्यापित करें।',
    guide_step3: 'कॉन्फ़िगरेशन > वेबहुक में एडिट पर क्लिक करें, ऊपर दिया गया कॉलबैक URL और सत्यापन टोकन पेस्ट करें, और "messages" फ़ील्ड को सब्सक्राइब करें।',
    guide_step4: 'अब ऊपर अपना नंबर दर्ज करें और "WhatsApp अलर्ट भेजें" पर क्लिक करें — आपको तुरंत WhatsApp पर 1-टैप बटन वाला मैसेज प्राप्त होगा!',

    // Phone Mockup
    phone_verified: 'सत्यापित व्यावसायिक खाता',
    phone_dispute_alert: '🚨 PayPal विवाद अलर्ट:',
    phone_amount_at_risk: 'जोखिम में राशि:',
    phone_reason: 'कारण:',
    phone_ai_action: '⚡ AI कार्रवाई: FedEx ट्रैकिंग प्राप्तकर्ता के हस्ताक्षर के साथ डिलीवरी प्रमाणित करती है।',
    phone_btn_approve: '1. स्वीकृत करें और स्वचालित बचाव भेजें',
    phone_btn_defended: 'PayPal में सफलतापूर्वक सुरक्षित प्रस्तुत',
    phone_btn_inspect: '2. डिलीवरी साक्ष्य (POD) देखें',

    // TAB 3: Carrier Radar
    carrier_title: 'लाइव लॉजिस्टिक्स EDI एवं कैरियर साक्ष्य एकीकरण',
    carrier_sub: 'स्वचालित GPS-सत्यापित डिलीवरी साक्ष्य प्रदान करने वाली कैरियर गेटवे प्रणाली।',
    carrier_connected: 'कनेक्टेड',
    carrier_status_edi: 'कनेक्टेड (EDI 214)',
    carrier_status_rest: 'कनेक्टेड (REST API)',
    carrier_status_soap: 'कनेक्टेड (SOAP)',
    carrier_status_india: 'कनेक्टेड (India API)',

    // TAB 4: Early Threat Radar
    warning_title: 'विवाद-पूर्व खतरा एवं ग्राहक भावना स्कैनर',
    warning_sub: 'AI ग्राहक सहायता संदेशों की निगरानी करता है ताकि महंगी PayPal चार्जबैक में बदलने से पहले विवादों को रोका जा सके।',
    warning_btn_intercept: 'तुरंत समाधान भेजें',
    warning_sent_toast: 'ऑर्डर {order} के लिए एक-क्लिक निवारण भेजा गया',

    // TAB 5: Merchant Security
    sec_title: 'व्यापारी सुरक्षा एवं लाइव PayPal एकीकरण',
    sec_sub: 'मल्टी-टेनेंट डेटा अलगाव, ज़ीरो-ट्रस्ट टोकन प्रमाणीकरण और रीयल-टाइम PayPal सैंडबॉक्स टेलीमेट्री।',
    sec_btn_ping: 'PayPal कनेक्शन पिंग टेस्ट करें',
    sec_pinging: 'PayPal से संपर्क किया जा रहा है...',
    sec_wa_title: 'WhatsApp 1-टैप ऑटोपायलट डिस्पैच',
    sec_wa_sub: 'बिना लॉगिन किए व्यापारी के फोन से सीधे विवाद अलर्ट हल करें',
    sec_btn_bot_preview: 'बॉट पूर्वावलोकन खोलें',
    sec_paypal_card_title: 'PayPal सैंडबॉक्स REST API कनेक्शन',
    sec_paypal_card_sub: 'OAuth2 और विवाद इंजन के बीच सीधा हैंडशेक',
    sec_active_connected: 'सक्रिय एवं कनेक्टेड',
    sec_disconnected: 'डिस्कनेक्टेड',
    sec_tenant_title: 'सक्रिय स्टोर एवं टेनेंट अलगाव',
    sec_tenant_sub: '{name} के लिए सुरक्षित डेटाबेस पार्टीशन',
    sec_btn_connect_another: '+ एक और स्टोर जोड़ें',
    sec_active_store_label: 'सक्रिय बिजनेस स्टोर:',
    sec_verified_badge: 'PayPal सत्यापित खाता',
    sec_tenant_id_label: 'मर्चेंट टेनेंट आईडी:',
    sec_payer_id_label: 'PayPal Payer आईडी:',
    sec_linked_label: 'जोड़ा गया:',
    sec_auth_token_label: 'आंतरिक प्रमाणीकरण टोकन:',
    sec_btn_copy_token: 'टोकन कॉपी करें',
    idem_title: 'लाइव वेबहुक आइडमपोटेंसी इंजन परीक्षण',
    idem_sub: 'नेटवर्क पुनः प्रसारण और डुप्लिकेट विवाद हमलों का अनुकरण करें',
    idem_btn_testing: 'आइडमपोटेंसी का परीक्षण हो रहा है...',
    idem_btn_simulate: 'डुप्लिकेट वेबहुक का अनुकरण करें',
    idem_empty_hint: 'एक साथ दो समान वेबहुक इवेंट भेजने के लिए "डुप्लिकेट वेबहुक का अनुकरण करें" पर क्लिक करें और वास्तविक समय में कटौती अवरुद्ध देखें।',

    // Notification Toasts
    toast_lang_switched: 'भाषा बदलकर हिन्दी कर दी गई है',
    toast_theme_switched: '{theme} थीम लागू कर दी गई है',

    // Customer Resolution Portal (/report-issue)
    portal_page_title: 'PayPal खरीदार समाधान केंद्र',
    portal_page_sub: 'ग्राहक विवाद समाधान पोर्टल — शिकायत सबमिट करने पर व्यापारी के WhatsApp पर तुरंत 1-टैप अलर्ट जाता है।',
    portal_form_title: 'लाइव लेनदेन विवाद दर्ज करें',
    portal_form_desc: 'ग्राहक समस्या का अनुकरण करने के लिए इस फॉर्म का उपयोग करें। सबमिट करने पर सेकंडों में WhatsApp पर बचाव अलर्ट भेजा जाएगा!',
    portal_field_case_id: 'PayPal केस / विवाद आईडी',
    portal_field_amount: 'विवाद राशि ($ USD)',
    portal_field_cust_name: 'ग्राहक / मित्र का नाम',
    portal_field_cust_email: 'ग्राहक ईमेल',
    portal_field_reason: 'विवाद का कारण',
    portal_opt_inr: 'सामान नहीं मिला (Item Not Received)',
    portal_opt_snad: 'विवरण से भिन्न सामान (Significantly Not As Described)',
    portal_opt_unauth: 'अनधिकृत लेनदेन (Unauthorised Transaction)',
    portal_field_details: 'ग्राहक का स्पष्टीकरण एवं विवाद विवरण',
    portal_btn_submit: 'ग्राहक विवाद सबमिट करें',
    portal_transmitting: 'विवाद भेजा जा रहा है और WhatsApp को सूचित किया जा रहा है...',
    portal_success_title: 'विवाद सफलतापूर्वक दर्ज हो गया!',
    portal_success_desc: 'ग्राहक विवाद आधिकारिक तौर पर ResolvePay और PayPal सैंडबॉक्स में दर्ज कर लिया गया है।',
    portal_wa_alert_title: '📱 व्यापारी के फोन पर WhatsApp अलर्ट भेजा गया!',
    portal_wa_alert_desc: 'व्यापारी के पंजीकृत WhatsApp नंबर पर 1-टैप बचाव अलर्ट भेजा गया है। व्यापारी सीधे अपने फोन से विवाद का बचाव कर सकता है।',
    portal_btn_dashboard: 'व्यापारी डैशबोर्ड पर देखें',
    portal_btn_another: 'एक और टेस्ट विवाद दर्ज करें',

    // Connect PayPal Modal
    modal_paypal_title: 'PayPal व्यावसायिक खाता जोड़ें',
    modal_paypal_sub: 'OAuth 2.0 भागीदार ऑनबोर्डिंग और स्वचालित सिंक',
    modal_store_name: 'स्टोर / ब्रांड का नाम',
    modal_business_email: 'प्राथमिक व्यावसायिक PayPal ईमेल',
    modal_currency: 'निपटान मुद्रा',
    modal_btn_connect: 'PayPal OAuth 2.0 कनेक्शन शुरू करें',
    modal_connecting: 'सुरक्षित सैंडबॉक्स हैंडशेक स्थापित किया जा रहा है...',
  }
};

export function getTranslation(lang: Language, key: keyof typeof translations['en'], params?: Record<string, string | number>): string {
  const dict = translations[lang] || translations.en;
  let str = (dict as any)[key] || (translations.en as any)[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, String(v));
    });
  }
  return str;
}
