export type Language = 'en' | 'zh' | 'es' | 'gu';

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
  { code: 'gu', label: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
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
    nav_carrier: 'Carrier Radar',
    nav_warning: 'Early Warning',
    nav_settings: 'Settings',

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

    // Customer Dispute Filing Link Card (Image Fix)
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

    // Carrier Radar Tab
    carrier_title: 'Live Logistics EDI & Carrier Proof Integrations',
    carrier_sub: 'Synchronized carrier gateways providing automatic GPS-verified proof of delivery.',
    carrier_connected: 'Connected',

    // Notification Toasts
    toast_lang_switched: 'Language switched to English',
    toast_theme_switched: 'Switched to {theme} theme',
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
    nav_carrier: '承运商雷达',
    nav_warning: '预警中心',
    nav_settings: '设置',

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

    // Customer Dispute Filing Link Card (Image Fix)
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

    // Carrier Radar Tab
    carrier_title: '实时物流 EDI 与承运商举证网关',
    carrier_sub: '承运商网关毫秒级同步，提供自动 GPS 验证签收证明。',
    carrier_connected: '已连接',

    // Notification Toasts
    toast_lang_switched: '界面语言已切换为简体中文',
    toast_theme_switched: '已切换为 {theme} 主题',
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
    nav_carrier: 'Radar de transportistas',
    nav_warning: 'Alerta temprana',
    nav_settings: 'Configuración',

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

    // Customer Dispute Filing Link Card (Image Fix)
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

    // Carrier Radar Tab
    carrier_title: 'Integraciones de pruebas de transportistas y EDI en vivo',
    carrier_sub: 'Pasarelas de transportistas sincronizadas que proporcionan comprobantes de entrega verificados por GPS.',
    carrier_connected: 'Conectado',

    // Notification Toasts
    toast_lang_switched: 'Idioma cambiado a Español',
    toast_theme_switched: 'Cambiado al tema {theme}',
  },

  gu: {
    // Top Bar & App Info
    app_subtitle: 'પેપાલ ડિસ્પ્યુટ ઓટોપાયલટ',
    search_placeholder: 'ID, ગ્રાહક નામ અથવા રકમ દ્વારા શોધો...',
    connected_store: 'કનેક્ટેડ સ્ટોર',
    manage_stores: 'સ્ટોર્સ મેનેજ કરો',
    connect_new_store: '+ નવો સ્ટોર કનેક્ટ કરો',
    theme: 'થીમ',
    language: 'ભાષા',
    preferences_actions: 'પસંદગીઓ અને ક્રિયાઓ',
    sync_disputes: 'ડિસ્પ્યુટ્સ સિંક કરો',
    paypal_sandbox: 'PayPal સેન્ડબોક્સ',
    connect_paypal: 'PayPal એકાઉન્ટ કનેક્ટ કરો',
    install_mobile_app: 'મોબાઇલ એપ ઇન્સ્ટોલ કરો',
    developer_simulation: 'ડેવલપર સિમ્યુલેશન',
    simulate_item_not_received: 'માલ ન મળવાનો ડિસ્પ્યુટ બનાવો ($249.99)',
    simulate_unauthorized: 'અજાણ્યા વ્યવહારનો ડિસ્પ્યુટ બનાવો ($149.50)',
    reset_live_demo: 'લાઇવ ડેમો ડેટા રીસેટ કરો',

    // Navigation Tabs
    nav_disputes: 'ડિસ્પ્યુટ્સ કતાર',
    nav_whatsapp: 'WhatsApp ઓટોપાયલટ',
    nav_carrier: 'કેરિયર રડાર',
    nav_warning: 'અર્લી વોર્નિંગ',
    nav_settings: 'સેટિંગ્સ',

    // KPI Cards
    kpi_risk_title: 'જોખમમાં કુલ રકમ',
    kpi_risk_sub: 'કુલ ડિસ્પ્યુટ્સ • સ્વચાલિત સંરક્ષણ',
    kpi_action_title: 'જરૂરી કાર્યવાહી',
    kpi_action_sub: 'તાત્કાલિક SLA સમયમર્યાદા સક્રિય',
    kpi_defended_title: 'ડિફેન્ડ કરેલ અને સમીક્ષા હેઠળ',
    kpi_defended_sub: 'ઓટોમેટેડ પાઇપલાઇન દ્વારા સબમિટ',
    kpi_win_title: 'AI ડિફેન્સ વિન રેશિયો',

    // Table Filters
    filter_all: 'તમામ ડિસ્પ્યુટ્સ',
    filter_action: 'જરૂરી કાર્યવાહી',
    filter_defended: 'ડિફેન્ડ કરેલ / સમીક્ષા હેઠળ',
    total_count: 'મળેલા ડિસ્પ્યુટ્સ',

    // Table Columns
    col_case_id: 'કેસ ID / સંદર્ભ',
    col_buyer: 'ખરીદનાર / ગ્રાહક',
    col_amount: 'જોખમમાં રકમ',
    col_evidence: 'EDI પુરાવા',
    col_deadline: 'SLA કાઉન્ટડાઉન',
    col_ai_status: 'AI સ્ટેટસ',
    col_actions: 'ક્રિયાઓ',
    btn_track_live: 'લાઇવ ટ્રેક કરો',
    btn_review_defense: 'ડિફેન્સ જુઓ',

    // WhatsApp Tab: Header
    wa_header_title: 'Meta WhatsApp 1-Tap Autopilot',
    wa_sandbox_badge: '૧૦૦% મફત ડેવલપર સેન્ડબોક્સ',
    wa_header_sub: 'સીધું Meta Cloud API ઇન્ટિગ્રેશન. ૦ ડેશબોર્ડ લૉગિન સાથે તમારા WhatsApp પરથી સેકન્ડોમાં ચાર્જબેક ઉકેલો.',
    wa_bot_ready: 'ઓનલાઇન • બોટ તૈયાર છે',

    // Customer Dispute Filing Link Card (Image Fix)
    cust_portal_title: 'કસ્ટમર ડિસ્પ્યુટ ફાઇલિંગ લિંક (મિત્ર સાથે શેર કરો)',
    cust_portal_badge: 'એન્ડ-ટુ-એન્ડ લાઈવ',
    cust_portal_desc: 'તમારા મિત્રને આ લિંક મોકલો. તે લિંક ખોલીને ફરિયાદ સબમિટ કરશે એટલે ૨ સેકન્ડમાં સીધું તમારા વોટ્સએપ પર ૧-ટેપ એલર્ટ આવી જશે!',
    cust_portal_copy: 'લિંક કોપી કરો',
    cust_portal_copied: 'કોપી થઈ ગયું',
    cust_portal_open: 'ખોલો',

    // Instant Friend Dispute Simulator Card
    sim_title: 'ઇન્સ્ટન્ટ મિત્ર ડિસ્પ્યુટ સિમ્યુલેટર (લાઈવ ટેસ્ટ)',
    sim_badge: '૧-ક્લિક ટ્રિગર',
    sim_desc: 'અહીંથી ૧-ક્લિક કરો: સિસ્ટમ નવો ડિસ્પ્યુટ બનાવશે અને સીધો તમારા WhatsApp પર 1-Tap Auto-Defend બટન સાથે મોકલશે.',
    sim_name_label: 'મિત્ર / કસ્ટમર નામ',
    sim_amount_label: 'રકમ ($ USD)',
    sim_btn_dispatch: '🚀 મિત્રનો ડિસ્પ્યુટ મારા WhatsApp પર મોકલો',
    sim_btn_loading: 'ડિસ્પ્યુટ બનાવી WhatsApp પર મોકલી રહ્યા છીએ...',
    sim_success_msg: 'કેસ {id} દાખલ થયો! વેપારીના ફોન પર WhatsApp એલર્ટ મોકલી દીધું.',

    // Meta Access Token Update Card
    token_title: 'Meta એક્સેસ ટોકન અપડેટ (૨૪-કલાક ટોકન)',
    token_step1: 'Meta સ્ટેપ ૧',
    token_desc: 'જો Meta Developer નો ૨૪-કલાકનો ટેસ્ટ ટોકન expire થાય, તો Step 1 માંથી નવો ટોકન મેળવી અહીં પેસ્ટ કરો અને "Update Token" દબાવો.',
    token_placeholder: 'Meta Access Token પેસ્ટ કરો (EAADbNUHhHJoBS...)',
    token_btn: 'અપડેટ અને ટેસ્ટ',
    token_verifying: 'ચકાસી રહ્યા છીએ...',
    token_active: '✅ Meta Token સક્રિય અને કનેક્ટેડ છે!',

    // Live Dispatcher Box
    dispatch_title: 'તમારા ફોન પર લાઇવ WhatsApp એલર્ટ મોકલો',
    dispatch_badge: 'મફત ટેસ્ટિંગ (₹0)',
    dispatch_targeting: 'લક્ષિત સક્રિય કેસ:',
    dispatch_phone_label: 'તમારો WhatsApp ફોન નંબર (કન્ટ્રી કોડ સાથે)',
    dispatch_btn: 'WhatsApp એલર્ટ મોકલો',
    dispatch_sending: 'મોકલી રહ્યા છીએ...',
    dispatch_hint: 'ફોર્મેટ: કોઈપણ ચિહ્નો અથવા જગ્યા વિના દેશનો કોડ શામેલ કરો (દા.ત. 919876543210).',
    dispatch_success: 'WhatsApp એલર્ટ સફળતાપૂર્વક મોકલાયું',

    // Webhook Handshake Config
    webhook_title: 'Meta Cloud API Webhook હેન્ડશેક સેટિંગ',
    webhook_meta_devs: 'Meta Developers',
    webhook_callback_label: 'Callback URL (Webhook URL)',
    webhook_verify_label: 'Verify Token',
    btn_copy: 'કોપી',
    btn_copied: 'કોપી થઈ ગયું',

    // 2-Minute Setup Guide
    guide_title: '૨ મિનિટ Meta Developer Setup ગાઈડ (૧૦૦% મફત Sandbox)',
    guide_step1: 'developers.facebook.com પર જઈને નવું App બનાવો (Type: Other > Business) અને તેમાં WhatsApp પ્રોડક્ટ ઉમેરો.',
    guide_step2: 'WhatsApp > API Setup માં જઈને "To" ના ડ્રોપડાઉન માં Manage phone number list પર ક્લિક કરીને તમારો સાચો WhatsApp મોબાઈલ નંબર નાખો અને 6-digit OTP થી વેરીફાય કરો.',
    guide_step3: 'Configuration > Webhook માં Edit ક્લિક કરીને ઉપર દર્શાવેલ Callback URL અને Verify Token પેસ્ટ કરો અને messages ફીલ્ડ સબસ્ક્રાઈબ કરો.',
    guide_step4: 'હવે ઉપર આપેલા બોક્સમાં તમારો નંબર નાખીને Send WhatsApp Alert ક્લિક કરો — તમને તરત જ WhatsApp પર 1-Tap બટન સાથે મેસેજ આવી જશે!',

    // Phone Mockup
    phone_verified: 'વેરીફાઈડ બિઝનેસ એકાઉન્ટ',
    phone_dispute_alert: '🚨 પેપાલ ડિસ્પ્યુટ એલર્ટ:',
    phone_amount_at_risk: 'જોખમમાં રકમ:',
    phone_reason: 'કારણ:',
    phone_ai_action: '⚡ AI એકશન: FedEx ટ્રેકિંગ સાબિત કરે છે કે ગ્રાહકની સહી સાથે ડિલિવરી થઈ ગઈ છે.',
    phone_btn_approve: '૧. મંજૂર કરો અને ડિફેન્સ સબમિટ કરો',
    phone_btn_defended: 'પેપાલમાં સફળતાપૂર્વક ડિફેન્ડ થઈ ગયું',
    phone_btn_inspect: '૨. POD પુરાવા તપાસો',

    // Carrier Radar Tab
    carrier_title: 'લાઈવ લોજિસ્ટિક્સ EDI અને કેરિયર પુરાવા જોડાણ',
    carrier_sub: 'સ્વચાલિત GPS-ચકાસાયેલ ડિલિવરી પુરાવા પ્રદાન કરતી કેરિયર ગેટવે સિસ્ટમ.',
    carrier_connected: 'કનેક્ટેડ',

    // Notification Toasts
    toast_lang_switched: 'ગુજરાતી ભાષા પસંદ કરી',
    toast_theme_switched: '{theme} થીમ લાગુ કરી',
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
