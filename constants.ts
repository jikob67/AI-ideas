
import { ProjectType, SectionType, Wallet, ProjectSection, DesignConfig, LayoutComponent, User } from './types';
import { Solana, Ethereum, Bitcoin, Monad, Base, Sui, Polygon } from './components/Icons';

export const DAILY_LIMITS: { [key in ProjectType]?: number } = {
  [ProjectType.AI_CHAT_MESSAGE]: 50,
  [ProjectType.SCREENSHOT_TO_CODE]: 15,
  [ProjectType.DRAW_TO_CODE]: 3, 
  [ProjectType.DRAW_TO_DIGITAL]: 10,
  [ProjectType.GENERATE_LOGO]: 10,
  [ProjectType.GENERATE_ICON]: 20,
  [ProjectType.GENERATE_IMAGE]: 10,
  [ProjectType.GENERATE_VIDEO]: 2,
  [ProjectType.PROJECT_BOOST]: 1,
  [ProjectType.DIGITAL_DRAWING]: 25,
  [ProjectType.TTS]: 25,
  [ProjectType.AUDIO_TRANSCRIPTION]: 10,
  [ProjectType.UPLOAD_IMAGE_CONTEXT]: 15,
  [ProjectType.UPLOAD_VIDEO_CONTEXT]: 1,
  [ProjectType.UPLOAD_AUDIO_CONTEXT]: 3,
  [ProjectType.UPLOAD_FILE_CONTEXT]: 2,
  [ProjectType.AI_CONTENT_DETECTION]: 10,
  [ProjectType.PROJECT_GENERATION]: 5,
  [ProjectType.UI_ANALYSIS]: 5,
  [ProjectType.CODE_CONVERSION]: 5,
  [ProjectType.BLOCKCHAIN_APP]: 2,
  [ProjectType.VR_AR_APP]: 2,
  [ProjectType.AI_MODEL]: 3,
};

export const PRO_LIMITS: { [key in ProjectType]?: number } = {
  [ProjectType.AI_CHAT_MESSAGE]: 250,
  [ProjectType.SCREENSHOT_TO_CODE]: 75,
  [ProjectType.DRAW_TO_CODE]: 20, 
  [ProjectType.DRAW_TO_DIGITAL]: 50,
  [ProjectType.GENERATE_LOGO]: 50,
  [ProjectType.GENERATE_ICON]: 100,
  [ProjectType.GENERATE_IMAGE]: 50,
  [ProjectType.GENERATE_VIDEO]: 10,
  [ProjectType.PROJECT_BOOST]: 5,
  [ProjectType.DIGITAL_DRAWING]: 125,
  [ProjectType.TTS]: 125,
  [ProjectType.AUDIO_TRANSCRIPTION]: 50,
  [ProjectType.UPLOAD_IMAGE_CONTEXT]: 75,
  [ProjectType.UPLOAD_VIDEO_CONTEXT]: 5,
  [ProjectType.UPLOAD_AUDIO_CONTEXT]: 15,
  [ProjectType.UPLOAD_FILE_CONTEXT]: 10,
  [ProjectType.AI_CONTENT_DETECTION]: 50,
  [ProjectType.PROJECT_GENERATION]: 25,
  [ProjectType.UI_ANALYSIS]: 25,
  [ProjectType.CODE_CONVERSION]: 25,
  [ProjectType.BLOCKCHAIN_APP]: 10,
  [ProjectType.VR_AR_APP]: 10,
  [ProjectType.AI_MODEL]: 15,
};

export const MONTHLY_LIMITS: { [key in ProjectType]?: number } = {
    [ProjectType.MARKETING_GENERATION]: 6,
};

export const PRO_MONTHLY_LIMITS: { [key in ProjectType]?: number } = {
    [ProjectType.MARKETING_GENERATION]: 60,
};


export const CRYPTO_WALLETS: Wallet[] = [
    { name: 'Solana', address: 'F2UJS1wNzsfcQTknPsxBk7B25qWbU9JtiRW1eRgdwLJY', logo: Solana },
    { name: 'Ethereum', address: '0xC5BC11e19D3De81a1365259A99AF4D88c62a8C50', logo: Ethereum },
    { name: 'Monad', address: '0xC5BC11e19D3De81a1365259A99AF4D88c62a8C50', logo: Monad },
    { name: 'Base', address: '0xC5BC11e19D3De81a1365259A99AF4D88c62a8C50', logo: Base },
    { name: 'Sui', address: '0x41629e22deff6965100a4c28567dea45036d0360e6126a9c7f9c8fb1860a36c4', logo: Sui },
    { name: 'Polygon', address: '0xC5BC11e19D3De81a1365259A99AF4D88c62a8C50', logo: Polygon },
    { name: 'Bitcoin', address: 'bc1q9s855ehn959s5t2g6kjt9q7pt5t55n9gq7gpd7', logo: Bitcoin },
];

export const EXTERNAL_LINKS = {
    wordpress: 'https://aistudionews.wordpress.com/',
    blogspot: 'https://aistudionews.blogspot.com/',
};

export const HIDDEN_SECTIONS: SectionType[] = [SectionType.DESIGN, SectionType.AUTH, SectionType.DATABASE, SectionType.PAYMENTS];

export const SECTION_DEFINITIONS: { type: SectionType, name: string, description: string, defaultConfig: any }[] = [
    { type: SectionType.DESIGN, name: 'الهوية البصرية', description: 'تخصيص الألوان، الخطوط، والسمات الجمالية للمشروع.', defaultConfig: {
        colors: { primary: '#6366f1', secondary: '#a855f7', background: '#111827', text: '#f3f4f6', headerBackground: '#1f2937' },
        layout: {
            header: { enabled: true, components: [{type: 'link', text: 'الرئيسية', link: '#'}, {type: 'link', text: 'من نحن', link: '#about'}] as LayoutComponent[] },
            footer: { enabled: true, components: [{type: 'text', text: `© ${new Date().getFullYear()} AI ideas`}] as LayoutComponent[] },
        },
    } as DesignConfig },
    { type: SectionType.USERS, name: 'بوابة الأعضاء', description: 'إدارة حسابات المستخدمين وصلاحيات الوصول للمنصة.', defaultConfig: { allowRegistration: true, requireVerification: true } },
    { type: SectionType.CHAT, name: 'الدردشة الحية', description: 'إضافة قنوات تواصل فوري وتفاعل بين المستخدمين.', defaultConfig: { enableP2P: true, enableGroup: false, retentionDays: 30 } },
    { type: SectionType.STORE, name: 'المتجر الرقمي', description: 'عرض وبيع المنتجات والخدمات مع إدارة المبيعات.', defaultConfig: { products: [], currency: 'USD' } },
    { type: SectionType.BLOG, name: 'مركز المحتوى', description: 'نشر المقالات، الأخبار، والتحديثات الدورية للجمهور.', defaultConfig: { posts: [], allowComments: true } },
    { type: SectionType.HTML, name: 'تطوير مخصص', description: 'إضافة وظائف برمجية وواجهات مخصصة عبر كود HTML.', defaultConfig: { htmlContent: '<div><h1>محتوى مخصص مطور</h1></div>' } },
    { type: SectionType.ADS, name: 'تحقيق الدخل', description: 'دمج المنصات الإعلانية لتحويل الزيارات إلى أرباح.', defaultConfig: { admob: { enabled: false, bannerId: '' }, unity: { enabled: false, gameId: '' } } },
    { type: SectionType.MEDIA, name: 'مكتبة الوسائط', description: 'تنظيم الصور، الفيديوهات، والملفات الصوتية للمشروع.', defaultConfig: { allowUploads: true, maxFileSizeMB: 10 } },
    { type: SectionType.RSS, name: 'تغذية المحتوى', description: 'جلب ودمج آخر الأخبار من مصادر خارجية تلقائياً.', defaultConfig: { feedUrl: '' } },
    { type: SectionType.FORM, name: 'جمع البيانات', description: 'إنشاء نماذج لاستقبال استفسارات وبيانات المستخدمين.', defaultConfig: { fields: [{name: 'email', type: 'email', label: 'البريد الإلكتروني'}], submitText: 'إرسال' } },
    // Hidden sections with default configs
    { type: SectionType.AUTH, name: 'التوثيق الأمني', description: 'إدارة أنظمة التحقق وتسجيل الدخول الآمن.', defaultConfig: { providers: ['email', 'google'] } },
    { type: SectionType.DATABASE, name: 'هيكلة البيانات', description: 'إدارة قواعد البيانات السحابية وضمان تكامل المعلومات.', defaultConfig: { type: 'firestore', rules: 'public' } },
    { type: SectionType.PAYMENTS, name: 'المعاملات المالية', description: 'إعداد بوابات الدفع الإلكتروني والاشتراكات البرمجية.', defaultConfig: { stripe: { enabled: false, apiKey: '' } } },
    { type: SectionType.NOTIFICATIONS, name: 'مركز التنبيهات', description: 'إرسال الإشعارات اللحظية والمجدولة للمستخدمين.', defaultConfig: { fcm: { enabled: false, serverKey: '' } } },
    { type: SectionType.MAP, name: 'الخدمات الجغرافية', description: 'دمج الخرائط التفاعلية وتحديد المواقع الجغرافية.', defaultConfig: { provider: 'google', initialLat: 30.0444, initialLng: 31.2357 } },
    // New section definitions
    { type: SectionType.COMMUNITY_FEED, name: 'تفاعل المجتمع', description: 'منصة لمشاركة المنشورات والتفاعل الاجتماعي الحي.', defaultConfig: { allowPosts: true, allowLikes: true, allowComments: true } },
    { type: SectionType.EVENTS, name: 'إدارة الفعاليات', description: 'تنظيم الأحداث والمؤتمرات مع تتبع الحضور.', defaultConfig: { events: [], calendarView: true } },
    { type: SectionType.ANALYTICS, name: 'مؤشرات الأداء', description: 'تتبع سلوك المستخدمين وتحليل نمو المشروع بدقة.', defaultConfig: { provider: 'none', trackingId: '' } },
    { type: SectionType.INTEGRATIONS, name: 'تكامل الأنظمة', description: 'ربط المشروع مع خدمات الـ API الخارجية والـ Webhooks.', defaultConfig: { webhooks: [], apis: [] } },
    { type: SectionType.POINTS_REWARDS, name: 'نظام التحفيز', description: 'بناء آليات الولاء عبر النقاط والمكافآت الرقمية.', defaultConfig: { actions: [{ name: 'login', points: 5 }, { name: 'post', points: 10 }], rewards: [{ name: 'discount', cost: 100 }] } },
    { type: SectionType.TEAM, name: 'إدارة الفريق', description: 'تنظيم مهام وصلاحيات أعضاء فريق التطوير.', defaultConfig: { members: [], roles: ['admin', 'editor'] } },
];

export const PLAN_SECTIONS: { [key in 'free' | 'premium']: SectionType[] } = {
    free: [ SectionType.DESIGN, SectionType.HTML, SectionType.USERS, SectionType.CHAT, SectionType.STORE, SectionType.BLOG, SectionType.ADS, SectionType.MEDIA, SectionType.RSS, SectionType.FORM, SectionType.MAP, SectionType.AUTH, SectionType.DATABASE, SectionType.PAYMENTS, SectionType.NOTIFICATIONS ],
    premium: [ SectionType.DESIGN, SectionType.HTML, SectionType.USERS, SectionType.CHAT, SectionType.STORE, SectionType.BLOG, SectionType.ADS, SectionType.MEDIA, SectionType.RSS, SectionType.FORM, SectionType.MAP, SectionType.AUTH, SectionType.DATABASE, SectionType.PAYMENTS, SectionType.NOTIFICATIONS, SectionType.ANALYTICS, SectionType.INTEGRATIONS, SectionType.COMMUNITY_FEED, SectionType.EVENTS, SectionType.POINTS_REWARDS, SectionType.TEAM ]
};

export const getInitialSectionsForTemplate = (template: 'blank' | 'store' | 'business', projectName: string = 'New Project'): ProjectSection[] => {
    const baseSections: ProjectSection[] = [
        { id: `sec-${Date.now()}-design`, type: SectionType.DESIGN, title: 'الهوية البصرية للمشروع', config: SECTION_DEFINITIONS.find(d => d.type === SectionType.DESIGN)!.defaultConfig },
        { id: `sec-${Date.now()}-html`, type: SectionType.HTML, title: 'الواجهة الرئيسية', config: { htmlContent: `<h1>مرحباً بك في ${projectName}!</h1><p>هذا هو الهيكل الأولي لمشروعك الجديد المطور بالذكاء الاصطناعي.</p>` } },
    ];
    
    switch (template) {
        case 'store':
            return [
                ...baseSections,
                { id: `sec-${Date.now()}-store`, type: SectionType.STORE, title: 'كتالوج المنتجات', config: SECTION_DEFINITIONS.find(d => d.type === SectionType.STORE)!.defaultConfig },
                { id: `sec-${Date.now()}-media`, type: SectionType.MEDIA, title: 'أصول الوسائط', config: SECTION_DEFINITIONS.find(d => d.type === SectionType.MEDIA)!.defaultConfig },
            ];
        case 'business':
             return [
                ...baseSections,
                { id: `sec-${Date.now()}-form`, type: SectionType.FORM, title: 'مركز التواصل', config: SECTION_DEFINITIONS.find(d => d.type === SectionType.FORM)!.defaultConfig },
                { id: `sec-${Date.now()}-map`, type: SectionType.MAP, title: 'الموقع الجغرافي', config: SECTION_DEFINITIONS.find(d => d.type === SectionType.MAP)!.defaultConfig },
            ];
        case 'blank':
        default:
            return baseSections;
    }
};


export const getInitialSectionsForProjectType = (projectType: ProjectType, plan: 'free' | 'premium' = 'free', projectName: string): ProjectSection[] => {
    const baseSections: ProjectSection[] = [
        { id: `sec-${Date.now()}-design`, type: SectionType.DESIGN, title: 'الهوية البصرية', config: SECTION_DEFINITIONS.find(d => d.type === SectionType.DESIGN)!.defaultConfig },
        { id: `sec-${Date.now()}-html`, type: SectionType.HTML, title: 'الواجهة الرئيسية', config: { htmlContent: `<h1>أهلاً بك في ${projectName}!</h1><p>تم بناء هذا الأساس باستخدام خوارزميات AI ideas المتقدمة.</p>` } },
    ];

    let suggestedSectionTypes: SectionType[] = [];

    switch (projectType) {
        case ProjectType.STORE:
            suggestedSectionTypes = [SectionType.STORE, SectionType.MEDIA, SectionType.USERS, SectionType.FORM];
            break;
        case ProjectType.SOCIAL_NETWORK:
            suggestedSectionTypes = [SectionType.COMMUNITY_FEED, SectionType.CHAT, SectionType.USERS, SectionType.POINTS_REWARDS];
            break;
        case ProjectType.CHARITY_WEBSITE:
            suggestedSectionTypes = [SectionType.STORE, SectionType.FORM, SectionType.EVENTS, SectionType.POINTS_REWARDS];
            break;
        case ProjectType.BLOG:
            suggestedSectionTypes = [SectionType.BLOG, SectionType.RSS, SectionType.FORM];
            break;
        case ProjectType.WEBSITE:
        case ProjectType.LANDING_PAGE:
             suggestedSectionTypes = [SectionType.FORM, SectionType.MAP, SectionType.MEDIA];
             break;
        case ProjectType.BLOCKCHAIN_APP:
            suggestedSectionTypes = [SectionType.USERS, SectionType.STORE, SectionType.INTEGRATIONS];
            break;
        case ProjectType.VR_AR_APP:
            suggestedSectionTypes = [SectionType.MEDIA, SectionType.USERS];
            break;
        case ProjectType.AI_MODEL:
        case ProjectType.DATA_VISUALIZATION:
             suggestedSectionTypes = [SectionType.FORM, SectionType.ANALYTICS];
             break;
        default:
            return baseSections;
    }

    const availableSectionsForPlan = PLAN_SECTIONS[plan];
    const finalSectionTypes = suggestedSectionTypes.filter(type => availableSectionsForPlan.includes(type));

    const projectSections = finalSectionTypes.map((type) => {
        const def = SECTION_DEFINITIONS.find(d => d.type === type)!;
        let config = def.defaultConfig;
        if(type === SectionType.STORE && projectType === ProjectType.CHARITY_WEBSITE){
            config = {...config, currency: 'USD'}; 
        }
        return {
            id: `sec-${Date.now()}-s-${type.toLowerCase()}`,
            type: type,
            title: def.name,
            config: config
        };
    });

    return [...baseSections, ...projectSections];
};

export const SUPPORTED_VIDEO_TYPES = {
    mp4: { mime: "video/mp4", extension: ".mp4" },
    webm: { mime: "video/webm", extension: ".webm" },
    mov: { mime: "video/quicktime", extension: ".mov" },
};
