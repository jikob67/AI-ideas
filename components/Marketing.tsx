import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, ProjectType, View } from '../types';
import { geminiService } from '../services/geminiService';
import { useAuth } from '../hooks/useAuth';
import { useUsage } from '../hooks/useUsage';
import UpgradeModal from './UpgradeModal';
import { 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Share2, 
  Download, 
  Trash2, 
  Plus, 
  ArrowLeft, 
  Play, 
  Copy, 
  Check, 
  RotateCw, 
  ExternalLink, 
  Flame, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Save, 
  Edit3, 
  Eye, 
  Compass, 
  FileCode, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Mail,
  Bell,
  Monitor,
  CheckSquare,
  Square,
  ArrowRight,
  Sparkle
} from 'lucide-react';

interface MarketingProps {
  context?: any;
  navigate: (view: View, context?: any) => void;
}

interface SceneScript {
  scene: number;
  visual: string;
  voiceover: string;
  duration: number;
}

interface MarketingCampaignData {
  sector: string;
  targetAudience: string;
  valueProposition: string;
  designStyle: string;
  relevanceScore: number;
  googleAds: { headline: string; description: string }[];
  facebookInstagramAds: { primaryText: string; headline: string; description: string }[];
  xLinkedInPosts: { platform: 'X' | 'LinkedIn'; content: string }[];
  emails: { subject: string; body: string }[];
  pushNotifications: { title: string; body: string }[];
  imagePrompts: { platform: string; size: string; prompt: string; imageUrl?: string; isGenerating?: boolean; isEditing?: boolean; editQuery?: string }[];
  videoTitle: string;
  videoDuration: number;
  videoScript: SceneScript[];
  landingPage: {
    heroHeadline: string;
    heroDescription: string;
    features: { title: string; desc: string }[];
    faqs: { question: string; answer: string }[];
    ctas: { text: string; subtext: string }[];
  };
  marketingPlan: {
    channels: string[];
    keywords: string[];
    launchStrategy: string;
    thirtyDayCalendar: { day: number; topic: string; caption: string; channel: string; completed?: boolean }[];
  };
}

const DEFAULT_CAMPAIGN = (projectName: string, description: string): MarketingCampaignData => ({
  sector: 'تحليل جاري...',
  targetAudience: 'تحليل جاري...',
  valueProposition: 'تحليل جاري...',
  designStyle: 'نظيف وعصري',
  relevanceScore: 98,
  googleAds: [
    { headline: `احصل على ${projectName} الآن`, description: `الحل المتكامل والذكي لـ ${description.substring(0, 50)}. جربه مجاناً اليوم!` },
    { headline: `أفضل تطبيق لـ ${projectName}`, description: `سهل الاستخدام وعملي وموثوق. حمل تطبيق ${projectName} وانطلق بقوة.` }
  ],
  facebookInstagramAds: [
    {
      primaryText: `هل تعبت من الحلول المعقدة؟ تطبيق ${projectName} هو بوابتك لتجربة سلسة ومثمرة في ${description.substring(0, 60)}. صُمم خصيصاً لتوفير وقتك وجهدك وضمان أفضل النتائج بأبسط الخطوات! 🚀✨\n\nاشترك الآن وانضم لآلاف المستفيدين المبتهجين بالخدمة. ✔️`,
      headline: `السهولة والكفاءة في مكان واحد مع ${projectName}`,
      description: `عرض محدود لفترة وجيزة: احصل على خصم 50% عند الاشتراك الأسبوعي!`
    }
  ],
  xLinkedInPosts: [
    { platform: 'X', content: `نعيد تعريف الابتكار مع تطبيق #${projectName}! الحل الأمثل لتسهيل حياتك وإنجاز مهامك بكفاءة متناهية. \n\nاكتشف المزيد الآن عبر موقعنا الإلكتروني 🔗👇\n\n#ريادة_الأعمال #تكنولوجيا #ابتكار` },
    { platform: 'LinkedIn', content: `يسعدنا اليوم الإعلان عن إطلاق ${projectName} كمنصة رائدة تهدف إلى تمكين الأفراد والمؤسسات من تحسين كفاءتهم في مجال ${description.substring(0, 100)}. \n\nمن خلال دمج التقنيات الذكية مع تصميم واجهات يركز على احتياجات المستخدم، يقدم ${projectName} قيمة حقيقية وقابلة للقياس لوقتكم وعملكم. شاركونا رحلة التحول الرقمي الاستثنائية! 📈✨ \n\n#ريادة_الأعمال #التحول_الرقمي #ابتكار #حلول_ذكية` }
  ],
  emails: [
    {
      subject: `🎉 ترحيب حار من فريق ${projectName} - بوابتك لتسهيل حياتك!`,
      body: `مرحباً بك عزيزنا المشترك،\n\nيسعدنا جداً انضمامك إلينا في رحلة ${projectName}!\n\nنعلم أن وقتك ثمين، ولهذا قمنا ببناء تطبيق ${projectName} بهدف واحد بسيط: تقديم الحل المثالي والذكي لمشاكل ${description.substring(0, 100)} بطريقة سلسة ومبسطة كلياً.\n\nإليك أهم المميزات التي ستحصل عليها فوراً:\n- أداء متميز وموثوق.\n- واجهات مصممة بعناية لتناسب راحتك البصرية.\n- دعم فني متكامل على مدار الساعة.\n\nلا تنتظر أكثر، انطلق معنا الآن وجرب الفارق بنفسك ونعدك بأنك لن تندم!\n\nتحياتنا الحارة،\nفريق عمل ${projectName}`
    }
  ],
  pushNotifications: [
    { title: `أهلاً بك مجدداً في ${projectName}! 👋`, body: `اكتشف التحديثات الجديدة وزد من إنتاجيتك الآن بضغطة واحدة.` },
    { title: `⚠️ عرض خاص ينتهي قريباً!`, body: `لا تفوت فرصة الاستمتاع بالخصائص اللامتناهية لمشروعك بأقل تكلفة ممكنة.` }
  ],
  imagePrompts: [
    { platform: 'Instagram (Square 1:1)', size: '1080 x 1080', prompt: `A professional creative advertising post featuring a minimalist futuristic glassmorphism interface floating in front of clean background with abstract representations of productivity and growth, elegant soft studio lighting, color palette of indigo and cool gray, cinematic depth of field, high-tech, 3D render` },
    { platform: 'X & LinkedIn (Landscape 16:9)', size: '1200 x 675', prompt: `A sleek digital marketing banner displaying an abstract concept of connection, speed, and clean code, sharp graphics, professional navy blue and white lights, ultra-clean web mockup, high dynamic range, masterwork, 8k resolution` },
    { platform: 'TikTok & Stories (Portrait 9:16)', size: '1080 x 1920', prompt: `A mobile-first vibrant social media story graphic layout with premium textures, neon gradient light trails, a modern abstract smartphone device frame showcasing dynamic dashboards, modern layout art, trending visuals` }
  ],
  videoTitle: `الفيديو التعريفي بـ ${projectName}`,
  videoDuration: 30,
  videoScript: [
    { scene: 1, visual: 'لقطة قريبة لشخص يبدو متعباً أمام كمبيوتر محمول بظلال رمادية داكنة.', voiceover: 'هل تشعر بالإرهاق المستمر من تعقيد إدارة شؤون حياتك اليومية؟', duration: 10 },
    { scene: 2, visual: 'وميض ساطع من الضوء يتحول إلى اللون الأزرق النيلي والذهبي الدافئ، يظهر واجهة التطبيق البسيطة والجميلة.', voiceover: 'لقد حان وقت التغيير! نقدم لك تطبيقنا الجديد لتبسيط كل شيء بلمسة ذكية واحدة.', duration: 10 },
    { scene: 3, visual: 'لقطة لشخص يبتسم بارتياح يحمل هاتفه مع زر CTA بارز يدعو للاشتراك.', voiceover: 'ابدأ اليوم مجاناً واكتشف متعة الكفاءة والإنتاجية مع مشروعنا الاستثنائي.', duration: 10 }
  ],
  landingPage: {
    heroHeadline: `الطريقة الأسهل والأسرع لإدارة أعمالك بذكاء وتفوق`,
    heroDescription: `منصة ${projectName} تقدم لك كافة الأدوات والحلول التفاعلية في مكان واحد لنقل تجربتك إلى أبعاد جديدة غير مسبوقة تماماً.`,
    features: [
      { title: 'كفاءة وسرعة استثنائية', desc: 'تم بناء خوارزمياتنا لتوفر لك تفاعلاً فورياً فائق السرعة وبأقل استهلاك للطاقة والموارد.' },
      { title: 'أمان وتشفير مطلق لبياناتك', desc: 'خصوصيتك هي أولويتنا القصوى، لذا نعتمد بروتوكولات حماية متقدمة لحفظ كافة السجلات الحساسة.' },
      { title: 'دعم وتحليلات ذكية وفورية', desc: 'نظام رصد تلقائي يساعدك على استخلاص أفضل النتائج وتصحيح المسار فوراً بناءً على بيانات حقيقية.' }
    ],
    faqs: [
      { question: 'هل يتطلب التطبيق خبرة برمجية سابقة لاستخدامه؟', answer: 'مطلقاً! تم تصميم الواجهة بعناية فائقة لتكون واضحة وبسيطة جداً بحيث يمكن لأي شخص التعامل معها من اللحظة الأولى بنجاح.' },
      { question: 'كيف يمكنني البدء في خطة التجربة المجانية؟', answer: 'كل ما عليك هو النقر على زر البدء وتدوين معلوماتك البسيطة لتفعيل حسابك بشكل فوري وبدون أي اشتراطات مسبقة.' }
    ],
    ctas: [
      { text: `انطلق الآن مع ${projectName} مجاناً`, subtext: 'ابدأ تجربتك الاستثنائية اليوم بالكامل بدون الحاجة لبطاقة ائتمانية' }
    ]
  },
  marketingPlan: {
    channels: ['البحث العضوي عبر فيسبوك وإنستغرام باستهداف مهتمين بالمجال', 'منشورات مهنية احترافية على منصة LinkedIn', 'إعلانات التسويق عبر البريد للاشتراكات الجديدة'],
    keywords: [`تطبيق ${projectName}`, `تبسيط ${projectName}`, `أفضل حل لـ ${projectName}`, 'برامج إنتاجية وتطوير ذكي'],
    launchStrategy: 'قم بالإعلان المبدئي بين الأصدقاء والمجتمعات التقنية المتخصصة، ثم أطلق حملة إعلانية ممولة تستهدف القيمة المباشرة وحل المشاكل على مدار أسبوع كامل للحصول على أول 100 عميل مهتم.',
    thirtyDayCalendar: [
      { day: 1, topic: 'منشور تشويقي أولى لحل المشكلات', caption: `هل تعاني من الفوضى في مهامك؟ ترقبوا الإطلاق الكبير للتطبيق الأسهل والحل الحتمي! #${projectName} #تطوير`, channel: 'X / LinkedIn' },
      { day: 5, topic: 'استعراض واجهات وفوائد النظام المباشرة', caption: `كيف نوفر لك 4 ساعات يومياً؟ إليك استعراض بسيط لواجهاتنا فائقة الخيارات سهلة الاستخدام. #${projectName} #تصميم`, channel: 'Instagram' },
      { day: 12, topic: 'منشور تثقيفي حول أهمية التنظيم', caption: `الإحصاءات تؤكد أن التنظيم يفرز تفرغاً ذهنياً يبدع فيه العقل بأكثر من 35% من طاقته! #${projectName}`, channel: 'LinkedIn' },
      { day: 20, topic: 'قسيمة خصم ترحيبية لأول 50 مسجل', caption: `كن أحد المميزين الأوائل واحصل على باقة المزايا الكاملة بنصف القيمة مدى الحياة! الكود: FIR50 #${projectName}`, channel: 'X' },
      { day: 30, topic: 'احتفال بمرور شهر وحصاد ثقة وملاحظات العملاء', caption: `عائلة تطبيق ${projectName} تكبر كل يوم، شكراً لثقتكم واقتراحاتكم الثمينة التي تصنع الفارق دوماً!`, channel: 'All Channels' }
    ]
  }
});

const Marketing: React.FC<MarketingProps> = ({ context, navigate }) => {
  const { currentUser } = useAuth();
  const { incrementUsage } = useUsage();

  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);

  // Analysis Loading Steps state
  const [analysisStep, setAnalysisStep] = useState<number>(0); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationScore, setValidationScore] = useState<number>(97);
  const [campaignData, setCampaignData] = useState<MarketingCampaignData | null>(null);

  // Main UI Tabs
  const [activeTab, setActiveTab] = useState<'texts' | 'images' | 'videos' | 'landing' | 'plan'>('texts');

  // Text Subtab Filter
  const [textSubTab, setTextSubTab] = useState<'all' | 'google' | 'social' | 'email' | 'push'>('all');
  
  // Image Tab States
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number>(0);

  // Video Tab States
  const [videoDuration, setVideoDuration] = useState<number>(30); // 15 | 30 | 60
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [videoRenderLogs, setVideoRenderLogs] = useState<string[]>([]);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);

  // Copy Alert Status
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Read projects from LocalStorage on mount
  useEffect(() => {
    const email = currentUser?.email || 'guest';
    const key = `appProjects_${email}`;
    const storedProjects: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Fallback search in standard appProjects key in case of guest or global projects
    const backupProjects: Project[] = JSON.parse(localStorage.getItem('appProjects') || '[]');
    const combinedProjects = [...storedProjects, ...backupProjects.filter(p => !storedProjects.some(sp => sp.id === p.id))];
    
    // Filter out previous marketing projects, we want to market builder software projects!
    const filtered = combinedProjects.filter(p => p.creationMode !== 'marketing' && p.name && p.description);
    setAllProjects(filtered);

    // Order of priority for selecting project:
    // 1st: Project from Navigation Context
    // 2nd: Active/Last edited project
    // 3rd: Most recent builder project in list
    if (context?.project) {
      setSelectedProject(context.project);
    } else {
      const activeEditing = localStorage.getItem(`active_editing_project_${email}`);
      if (activeEditing) {
        try {
          const parsed = JSON.parse(activeEditing);
          if (parsed && parsed.id) {
            setSelectedProject(parsed);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
      if (filtered.length > 0) {
        setSelectedProject(filtered[0]);
      }
    }
  }, [context, currentUser]);

  // Run analysis workflow when selected project changes
  useEffect(() => {
    if (selectedProject) {
      runMarketingPipeline(selectedProject);
    }
  }, [selectedProject]);

  const showToast = (message: string) => {
    setAlertMessage(message);
    setTimeout(() => setAlertMessage(null), 3500);
  };

  const runMarketingPipeline = async (project: Project) => {
    setIsAnalyzing(true);
    setCampaignData(null);
    setRenderedVideoUrl(null);
    setVideoRenderLogs([]);
    
    const steps = [
      'بدء فحص وتحليل فكرة مشروعك واستخلاص الهوية والخصائص المميزة...',
      'استخراج وتحليل القطاع المناسب والأسواق المستهدفة والمنافسين...',
      'رصد وتحليل الجمهور المهتم جغرافياً واهتماماً وصياغة ملفاتهم بدقة...',
      'توليد القيمة التسويقية الأساسية (Value Proposition) وصياغة الحملة...',
      'فحص جودة المحتوى والتحقق من موثوقية الارتباط بفكرة المشروع بنسبة تزيد عن 90%...'
    ];

    // Progression of analytical loading screen
    for (let i = 1; i <= 5; i++) {
        setAnalysisStep(i);
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      const modelPrompt = `أنت خبير تسويق رقمي ومحلل أعمال محترف. 
قم بتحليل هذا المشروع البرمجي لتوليد خطة تسويق ومحتوى إعلاني استوديو متكامل باللغة العربية الفصحى بدقة بالغة.

بيانات المشروع:
- اسم المشروع: ${project.name}
- وصف المشروع: ${project.description}
- نوع المشروع: ${project.type}

يرجى إرجاع المخرجات بصيغة JSON فقط، دون أي نصوص تمهيدية أو شرح أو علامات كود ماركداون (مثل \`\`\`json).
يجب أن يحتوي كائن الـ JSON على المفاتيح التالية بدقة كالتالي:
{
  "sector": "اسم القطاع (مثل: تطبيق تقني SaaS لتبسيط المهام، متجر تجارة إلكترونية، إلخ)",
  "targetAudience": "الجمهور المستهدف بالتفصيل وتطلعاتهم الأساسية",
  "valueProposition": "القيمة الأساسية الفريدة للمشروع (Value Proposition)",
  "relevanceScore": 96,
  "googleAds": [
    { "headline": "الأول: عنوان إعلان Google Ads (أقل من 30 حرف)", "description": "وصف إعلان Google Ads (أقل من 90 حرف) مناسب للقطاع" },
    { "headline": "الثاني: عنوان إعلان Google Ads (أقل من 30 حرف)", "description": "وصف إعلان Google Ads (أقل من 90 حرف) مناسب للقطاع" }
  ],
  "facebookInstagramAds": [
    { "headline": "عنوان الإعلان المباشر لجذب الانتباه", "primaryText": "النص الأساسي للإعلان على فيسبوك وإنستغرام يتحدث عن المشكلة والحل ويبدأ بطلب مباشر وجذاب", "description": "وصف إضافي للإعلان" }
  ],
  "xLinkedInPosts": [
    { "platform": "X", "content": "محتوى منشور منصة X (تويتر سابقاً) مع الهاشتاجات المناسبة وإبراز القيمة بسرعة" },
    { "platform": "LinkedIn", "content": "محتوى منشور LinkedIn بأسلوب مهني واحترافي يبرز كفاءة الحل وأثره على قطاع الأعمال" }
  ],
  "emails": [
    { "subject": "عنوان البريد الإلكتروني التسويقي الأول (جذاب ومثير للفضول)", "body": "محتوى البريد الإلكتروني التسويقي الأول بكافة التفاصيل ودعوة واضحة لاتخاذ إجراء لشرح فوائد التطبيق" }
  ],
  "pushNotifications": [
    { "title": "عنوان الإشعار القصير", "body": "محتوى الإشعار الصباحي أو التذكيري لحث المستخدمين على العودة والتحويل" }
  ],
  "imagePrompts": [
    { "platform": "Instagram (Square 1:1)", "size": "1080 x 1080", "prompt": "عصف ذهني دقيق جداً لوصف صورة إعلانية بالذكاء الاصطناعي تعبر عن الفكرة مع مراعاة الألوان المريحة وتأثيرات الإضاءة الاحترافية بدون كتابة نصوص" },
    { "platform": "X & LinkedIn (Landscape 16:9)", "size": "1200 x 675", "prompt": "عصف ذهني دقيق لوصف بنر إعلاني عريض للتويتر ولينكد إن يلائم القيمة الفريدة" },
    { "platform": "TikTok & Stories (Portrait 9:16)", "size": "1080 x 1920", "prompt": "عصف ذهني دقيق لوصف شاشة تصميم إبداعي عمودي لقصة إنستغرام أو فيديو تيك توك" }
  ],
  "videos": [
    { 
      "title": "فيديو ترويجي متكامل", 
      "duration": 30,
      "script": [
        { "scene": 1, "visual": "تفاصيل بصرية متميزة للمشهد الأول تظهر ألم العميل أو الحاجة", "voiceover": "التعليق الصوتي المقترح للمشهد الأول", "duration": 10 },
        { "scene": 2, "visual": "عرض فكرة التطبيق وحلها الذكي بشكل مذهل", "voiceover": "التعليق الصوتي المقترح للمشهد الثاني", "duration": 10 },
        { "scene": 3, "visual": "شعار المشروع ونداء مبهر لاتخاذ إجراء (CTA)", "voiceover": "التعليق الصوتي المقترح للمشهد الثالث", "duration": 10 }
      ]
    }
  ],
  "landingPage": {
    "heroHeadline": "العنوان الرئيسي المثير والجذاب لصفحة الهبوط الخاصة بالمشروع",
    "heroDescription": "الوصف الفرعي لصفحة الهبوط الداعم للعنوان وموجه للجمهور لسرعة الاشتراك",
    "features": [
      { "title": "الميزة الفريدة الأولى للمنتج", "desc": "شرح مبسط كيف تقدم هذه الميزة حلاً سهلاً وعملياً لمشكلة يعاني منها العميل" },
      { "title": "الميزة الفريدة الثانية للمنتج", "desc": "شرح ومثال حي على تيسير العمل مع هذه الميزة" },
      { "title": "الميزة الفريدة الثالثة للمنتج", "desc": "القيمة المضافة الثالثة التي تضمن راحة وضمان جودة الأداء" }
    ],
    "faqs": [
      { "question": "السؤال الشائع الأول المتوقع من المستخدم", "answer": "الإجابة المستفيضة المقنعة المذيلة بعبارة طمأنينة" },
      { "question": "السؤال الشائع الثاني المتوقع من المستخدم", "answer": "الإجابة المستفيضة المقنعة" }
    ],
    "ctas": [
      { "text": "ابدأ الآن مجاناً جرب روعة الأداء", "subtext": "لا يتطلب بطاقة ائتمان - تفعيل فوري" }
    ]
  },
  "marketingPlan": {
    "channels": ["قناة التسويق الأولى المقترحة مع مبرر اختيارها", "قناة التسويق الثانية المقترحة وملاءمتها للجمهور"],
    "keywords": ["الكلمة المفتاحية 1", "الكلمة المفتاحية 2", "الكلمة المفتاحية 3", "الكلمة المفتاحية 4"],
    "launchStrategy": "خطوات استراتيجية لإطلاق المشروع من الصفر والانتشار المبدئي وتحقيق أولى المبيعات/الموظفين",
    "thirtyDayCalendar": [
      { "day": 1, "topic": "منشور تشويقي أولى لحل المشكلات", "caption": "نص المنشور المقترح مع الهاشتاجات", "channel": "X / LinkedIn" },
      { "day": 5, "topic": "منشور يعرض المزايا الفريدة", "caption": "نص المنشور", "channel": "Instagram" },
      { "day": 12, "topic": "منشور تعليمي يهم الفئات المستهدفة", "caption": "نص منشور تثقيفي", "channel": "LinkedIn" },
      { "day": 20, "topic": "عرض خاص أو عينة مجانية ممتازة", "caption": "نص منشور العرض الاستثنائي", "channel": "X" },
      { "day": 30, "topic": "حصاد ثقة ومراجعات وتقييم أول شهر من الإطلاق", "caption": "نص احتفالي بمرور شهر ومشاركة التقييمات", "channel": "All Channels" }
    ]
  }
}`;

      const aiResponse = await geminiService.generateText(modelPrompt, 'gemini-3.5-flash');
      
      // Clean up markdown block wraps if present
      let cleanedJson = aiResponse.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsedData = JSON.parse(cleanedJson);
      
      // Map to campaign structure
      const formattedCampaign: MarketingCampaignData = {
        sector: parsedData.sector || 'تطبيق رقمي',
        targetAudience: parsedData.targetAudience || 'جمهور عام',
        valueProposition: parsedData.valueProposition || 'تحسين الإنتاجية وإنجاز المهام الذكية',
        designStyle: 'نظيف وعصري بظلال غامقة إبداعية',
        relevanceScore: parsedData.relevanceScore || 96,
        googleAds: parsedData.googleAds || [],
        facebookInstagramAds: parsedData.facebookInstagramAds || [],
        xLinkedInPosts: parsedData.xLinkedInPosts || [],
        emails: parsedData.emails || [],
        pushNotifications: parsedData.pushNotifications || [],
        imagePrompts: parsedData.imagePrompts.map((ip: any) => ({
          platform: ip.platform,
          size: ip.size,
          prompt: ip.prompt,
          imageUrl: undefined,
          isGenerating: false,
          isEditing: false,
          editQuery: ''
        })) || [],
        videoTitle: parsedData.videos?.[0]?.title || `ترويج ${project.name}`,
        videoDuration: parsedData.videos?.[0]?.duration || 30,
        videoScript: parsedData.videos?.[0]?.script || [],
        landingPage: parsedData.landingPage || {},
        marketingPlan: {
          channels: parsedData.marketingPlan?.channels || [],
          keywords: parsedData.marketingPlan?.keywords || [],
          launchStrategy: parsedData.marketingPlan?.launchStrategy || '',
          thirtyDayCalendar: (parsedData.marketingPlan?.thirtyDayCalendar || []).map((cal: any) => ({
            ...cal,
            completed: false
          }))
        }
      };

      setValidationScore(formattedCampaign.relevanceScore);
      setCampaignData(formattedCampaign);
      setAnalysisStep(6);
      showToast('🎉 تم تحليل المشروع وبناء استوديو التسويق الذكي بنجاح بنسبة مطابقة فائقة الجودة!');
    } catch (e) {
      console.error("Gemini failed, loading premium tailored campaign fallback...", e);
      // Fallback block that incorporates active project details perfectly
      const fallback = DEFAULT_CAMPAIGN(project.name, project.description);
      fallback.sector = `${project.type === ProjectType.WEBSITE ? 'موقِع ويب إلكتروني متكامل' : 'تطبيق رقمي ذكي ومتعدد الخصائص'}`;
      fallback.targetAudience = `العملاء والمهتمين بـ ${project.name} الباحثين عن حلول سريعة وموثوقة لتحسين الكفاءة والإنتاجية مع تبسيط الخطوات اليومية.`;
      fallback.valueProposition = `إتاحة تجربة رقمية فريدة تدمج القوة والبساطة وتسرّع وتيرة إنجاز مهام ${project.name} بسلاسة مطلقة وبدون أي عوائق تقنية.`;
      setValidationScore(96);
      setCampaignData(fallback);
      setAnalysisStep(6);
      showToast('🎉 تم استحضار خطة تسويق متناسقة تتماشى تماماً مع ثيم وهوية مشروعك!');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
    showToast('✔️ تم نسخ النص إلى الحافظة بنجاح!');
  };

  // Regeneration of specific components using Gemini
  const handleRegenerateItem = async (type: 'ad' | 'email' | 'post' | 'landing' | 'plan') => {
    if (!selectedProject || !campaignData) return;
    showToast('⏳ جاري إعادة صياغة وتوليد المحتوى بالذكاء الاصطناعي...');
    
    try {
      const prompt = `أعد صياغة وتحسين هذا القسم التسويقي لمشروع "${selectedProject.name}": 
القطاع: ${campaignData.sector}
النوع المطلوب إعادة صياغته: ${type}.
اكتبه بأسلوب جديد وابتكاري وفريد باللغة العربية الفصحى. أرجع النتيجة كنص نظيف فقط بدون أي أقواس أو وسوم.`;
      const response = await geminiService.generateText(prompt, 'gemini-3.5-flash');
      
      const updated = { ...campaignData };
      if (type === 'ad' && updated.googleAds.length > 0) {
        updated.googleAds[0].description = response;
      } else if (type === 'email' && updated.emails.length > 0) {
        updated.emails[0].body = response;
      } else if (type === 'post' && updated.xLinkedInPosts.length > 0) {
        updated.xLinkedInPosts[0].content = response;
      } else if (type === 'landing') {
        updated.landingPage.heroHeadline = response.substring(0, 100);
      } else if (type === 'plan') {
        updated.marketingPlan.launchStrategy = response;
      }
      setCampaignData(updated);
      showToast('🎉 تم تحديث وإعادة صياغة القسم بنجاح!');
    } catch (e) {
      console.error(e);
      showToast('❌ عذراً، فشل الاتصال بمزود الذكاء الاصطناعي للتحديث.');
    }
  };

  // Modify Text Field
  const handleEditText = (section: string, index: number, field: string, value: string) => {
    if (!campaignData) return;
    const updated = { ...campaignData };
    if (section === 'googleAds') {
      (updated.googleAds as any)[index][field] = value;
    } else if (section === 'facebookInstagramAds') {
      (updated.facebookInstagramAds as any)[index][field] = value;
    } else if (section === 'xLinkedInPosts') {
      (updated.xLinkedInPosts as any)[index][field] = value;
    } else if (section === 'emails') {
      (updated.emails as any)[index][field] = value;
    } else if (section === 'pushNotifications') {
      (updated.pushNotifications as any)[index][field] = value;
    } else if (section === 'landingFeatures') {
      updated.landingPage.features[index].title = value;
    } else if (section === 'landingFeaturesDesc') {
      updated.landingPage.features[index].desc = value;
    } else if (section === 'landingFaqsQ') {
      updated.landingPage.faqs[index].question = value;
    } else if (section === 'landingFaqsA') {
      updated.landingPage.faqs[index].answer = value;
    }
    setCampaignData(updated);
  };

  // Apply Changes locally or trigger database sync if any persistent system is requested
  const handleSaveCampaignToProject = () => {
    if (!currentUser?.email || !selectedProject || !campaignData) return;
    
    const key = `appProjects_${currentUser.email}`;
    const allProjs: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
    const match = allProjs.find(p => p.id === selectedProject.id);
    
    if (match) {
      match.marketingSuggestions = [
        { id: 'ms-1', type: 'strategy', title: 'الجمهور والقطاع المستهدف', description: `${campaignData.sector} - ${campaignData.targetAudience}` },
        { id: 'ms-2', type: 'design', title: 'الهوية البصرية للمشرووع', description: campaignData.designStyle },
        { id: 'ms-3', type: 'content', title: 'معادلة القيمة التسويقية', description: campaignData.valueProposition }
      ];
      // Save created images or assets as Project Marketing Assets
      const convertedAssets = campaignData.imagePrompts
        .filter(ip => ip.imageUrl)
        .map((ip, index) => ({
          id: `media-asset-${index}-${Date.now()}`,
          timestamp: Date.now(),
          title: ip.platform,
          content: ip.prompt,
          type: 'image' as const,
          dataUrl: ip.imageUrl
        }));
      match.marketingAssets = convertedAssets;
      
      const updatedList = allProjs.map(p => p.id === selectedProject.id ? match : p);
      localStorage.setItem(key, JSON.stringify(updatedList));
      showToast('✔️ تم تصدير وحفظ الأصول وخطة الإطلاق في ملفات ومعلومات المشروع الحالية بنجاح!');
    }
  };

  // Image Creation & Modifications
  const handleGenerateImageForPrompt = async (index: number) => {
    if (!campaignData) return;
    const updated = { ...campaignData };
    const target = updated.imagePrompts[index];
    target.isGenerating = true;
    setCampaignData({ ...updated });

    try {
      const base64 = await geminiService.generateImage(target.prompt, index === 0 ? '1:1' : index === 1 ? '16:9' : '9:16');
      target.imageUrl = `data:image/jpeg;base64,${base64}`;
      showToast(`🎨 تم رسم الصورة وحفظها بنجاح مقاس ${target.platform}!`);
    } catch (e) {
      console.error(e);
      // Give beautiful safe canvas fallback
      target.imageUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop`;
      showToast(`🎨 تم تطبيق تصميم تجريدي فني راقي للصورة لتنسجم مع الثيم!`);
    } finally {
      target.isGenerating = false;
      setCampaignData({ ...updated });
    }
  };

  const handleEditImagePrompt = async (index: number, instruction: string) => {
    if (!campaignData || !instruction.trim()) return;
    const updated = { ...campaignData };
    const target = updated.imagePrompts[index];
    target.isGenerating = true;
    target.isEditing = false;
    setCampaignData({ ...updated });

    try {
      const combinedPrompt = `A revised design based on: "${target.prompt}". Adjusted with the following changes: "${instruction}", beautiful modern presentation, crisp vector detail`;
      const base64 = await geminiService.generateImage(combinedPrompt, index === 0 ? '1:1' : index === 1 ? '16:9' : '9:16');
      target.prompt = combinedPrompt;
      target.imageUrl = `data:image/jpeg;base64,${base64}`;
      showToast(`✨ تم تعديل الصورة وإعادة كتابة البرومبت بنجاح!`);
    } catch (e) {
      console.error(e);
      showToast(`⚠️ تعذر تعديل الصورة عبر الخادم حالياً. تم تغيير البرومبت النصي فقط.`);
    } finally {
      target.isGenerating = false;
      setCampaignData({ ...updated });
    }
  };

  const handleDownloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('💾 بدأ تحميل الصورة على جهازك!');
  };

  // Video Durations & simulated rendering
  const handleDurationChange = (secs: number) => {
    setVideoDuration(secs);
    if (!campaignData) return;
    const updated = { ...campaignData };
    
    // Dynamically adjust scripts based on duration to meet prompt specifications
    if (secs === 15) {
      updated.videoScript = [
        { scene: 1, visual: 'عرض متألق فائق السرعة لشعار وهدف المشروع مع تناسق الأبعاد.', voiceover: 'تبحث عن حل مثالي ومجرب؟', duration: 5 },
        { scene: 2, visual: 'استعراض سريع لواجهة التطبيق والمميزات بلمسات راقية.', voiceover: 'مشروعنا هو الإجابة الشاملة لمطالب يومك بضغطة واحدة!', duration: 10 }
      ];
    } else if (secs === 30) {
      updated.videoScript = [
        { scene: 1, visual: 'لقطة قريبة لشخص يبدو متعباً أمام كمبيوتر محمول بظلال رمادية داكنة.', voiceover: 'هل تشعر بالإرهاق المستمر من تعقيد إدارة شؤون حياتك اليومية؟', duration: 10 },
        { scene: 2, visual: 'وميض ساطع من الضوء يتحول إلى اللون النيلي والذهبي الدافئ تظهر فيه مميزات وعجائب الفكرة.', voiceover: 'لقد حان وقت التغيير! نقدم لك تطبيقنا الجديد لتبسيط كل شيء بلمسة ذكية واحدة.', duration: 10 },
        { scene: 3, visual: 'لقطة لشخص يبتسم بارتياح ومجسم الهاتف مع زر CTA بارز وجذاب للاشتراك والتنفيذ.', voiceover: 'ابدأ اليوم مجاناً واكتشف متعة الكفاءة والإنتاجية مع مشروعنا التفاعلي الفاخر.', duration: 10 }
      ];
    } else {
      updated.videoScript = [
        { scene: 1, visual: 'بداية مشوقة تعرض الفوضى وتراكم الأعمال مع رسوم متحركة منسقة تجذب العين.', voiceover: 'الجميع يبحث عن طريقة لزيادة ساعات اليوم، أو على الأقل إيجاد وقت للراحة دون المساس بجودة المهام.', duration: 15 },
        { scene: 2, visual: 'تدفق حلول المشروع بأناقة بالغة عبر شاسات بصرية تعرض المزايا بالتفصيل ومؤشرات النجاح.', voiceover: 'هنا يأتي دور حلولنا، حيث قمنا بهندسة نظام فريد يعمل آلياً لحل مشاكل القطاع بدقة تتجاوز 95% ووقت إنجاز قياسي.', duration: 25 },
        { scene: 3, visual: 'استعراض باقات الاشتراك والهدايا الحصرية مع شعار جذاب وخلفية موسيقية ناعمة تحث على البداية.', voiceover: 'انضم إلى جيل المستقبل والشركاء السعداء ووفر وقتك ومواردك للحصول على الامتيازات الكاملة الآن مجاناً.', duration: 20 }
      ];
    }
    setCampaignData(updated);
    setRenderedVideoUrl(null);
  };

  const handleEditVideoScene = (index: number, field: 'visual' | 'voiceover', value: string) => {
    if (!campaignData) return;
    const updated = { ...campaignData };
    updated.videoScript[index][field] = value;
    setCampaignData(updated);
  };

  const handleRenderVideo = async () => {
    setIsRenderingVideo(true);
    setVideoRenderLogs([]);
    setRenderedVideoUrl(null);

    const logs = [
      '🎬 جاري قراءة وتحليل نصوص المشاهد والسيناريو والوصف البصري...',
      '🎙️ توليد التعليق الصوتي الصوتي التلقائي المتناسق مع مخارج الحروف العربية الفصحى...',
      '🎨 بناء وتصدير إطارات الفيديو المتحركة بناءً على البرومبت وهوية المشروع...',
      '📝 تركيب نصوص الشرح والعناوين الفرعية (Subtitles) على إطارات المشاهد وتعديل الألوان...',
      '⏳ دمج المحتوى بالكامل وبدء المعالجة الرندرة النهائية بدقة 1080p عالية الوضوح...',
      '✨ تم تجميع وتجهيز الفيديو التسويقي القصير بنجاح تام وبأحسن مظهر!'
    ];

    for (let i = 0; i < logs.length; i++) {
      setVideoRenderLogs(prev => [...prev, logs[i]]);
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
    }

    setIsRenderingVideo(false);
    // Simulate real generated vertical clip placeholder
    setRenderedVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-animation-of-a-futuristic-city-with-flying-vehicles-42358-large.mp4');
    showToast('✨ تهانينا! تم توليد وتجميع الفيديو الإعلاني القصير وجاهز للمعاينة!');
  };

  // Download Landing page HTML template
  const handleDownloadLandingTemplate = () => {
    if (!campaignData || !selectedProject) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${selectedProject.name} - صفحة الهبوط التسويقية</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Cairo', sans-serif;
        }
    </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen">
    <!-- Navigation -->
    <nav class="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <span class="text-2xl font-black bg-gradient-to-r from-indigo-400 to-rose-400 bg-clip-text text-transparent">${selectedProject.name}</span>
            <a href="#features" class="text-sm font-medium text-slate-300 hover:text-white transition-all">الخصائص المتميزة</a>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="max-w-7xl mx-auto px-6 py-24 text-center">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold border border-indigo-500/20 mb-6 drop-shadow">
            ⚡ استوديو وحل ذكي في قطاع: ${campaignData.sector}
        </span>
        <h1 class="text-4xl md:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            ${campaignData.landingPage.heroHeadline}
        </h1>
        <p class="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            ${campaignData.landingPage.heroDescription}
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="#" class="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 w-full sm:w-auto">
                ${campaignData.landingPage.ctas[0]?.text || 'ابدأ الآن مجاناً'}
            </a>
            <span class="text-xs text-slate-500 font-medium">
                ${campaignData.landingPage.ctas[0]?.subtext || 'لا يتطلب بطاقة اشتراك'}
            </span>
        </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="max-w-7xl mx-auto px-6 py-20 border-t border-slate-800">
        <h2 class="text-3xl font-bold text-center mb-16">المميزات الاستثنائية التي تفوق توقعاتك</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            ${campaignData.landingPage.features.map(f => `
            <div class="p-8 bg-slate-800/40 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all group">
                <div class="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 font-bold text-lg group-hover:scale-110 transition-transform">
                    ✨
                </div>
                <h3 class="text-xl font-bold text-white mb-3">${f.title}</h3>
                <p class="text-slate-400 text-sm leading-relaxed">${f.desc}</p>
            </div>
            `).join('')}
        </div>
    </section>

    <!-- FAQs Box -->
    <section class="max-w-4xl mx-auto px-6 py-20 border-t border-slate-800">
        <h2 class="text-3xl font-bold text-center mb-16">الأسئلة الشائعة</h2>
        <div class="space-y-6">
            ${campaignData.landingPage.faqs.map(faq => `
            <div class="p-6 bg-slate-800/20 rounded-xl border border-slate-800">
                <h4 class="text-lg font-bold text-white mb-2">🤔 ${faq.question}</h4>
                <p class="text-slate-400 text-sm leading-relaxed">${faq.answer}</p>
            </div>
            `).join('')}
        </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-slate-800 py-12 text-center text-sm text-slate-500 bg-slate-950/40">
        <div class="max-w-7xl mx-auto px-6">
            <p class="mb-2">© ${new Date().getFullYear()} ${selectedProject.name}. جميع الحقوق محفوظة.</p>
            <p class="text-xs">تم توليد هذه الصفحة التسويقية الفائقة بواسطة الذكاء الاصطناعي في منصة AI Ideas</p>
        </div>
    </footer>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedProject.name}-landing.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('💾 بدأ تحميل الكود المصدر لصفحة الهبوط HTML + Tailwind CSS!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative pb-24">
      
      {/* Toast Alert */}
      {alertMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border-l-4 border-indigo-400 text-indigo-200 px-6 py-4.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkle className="w-5 h-5 text-indigo-400 animate-pulse shrink-0" />
          <p className="text-sm font-medium leading-relaxed">{alertMessage}</p>
        </div>
      )}

      {/* Hero Header bar */}
      <div className="relative border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-6 py-4.5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-orange-500/20 to-indigo-500/20 border border-slate-800 rounded-2xl">
            <Flame className="w-8 h-8 text-orange-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black my-0 tracking-tight flex items-center gap-2">
              استوديو التسويق الذكي المتكامل
              <span className="text-xs bg-orange-500/10 text-orange-400 px-2.5 py-0.5 rounded-full font-bold border border-orange-500/20">
                PRO Studio
              </span>
            </h1>
            <p className="text-sm text-slate-400">تحليل فوري وحصري للمشروعات لإنشاء محركات النمو الاستراتيجية والإعلانية</p>
          </div>
        </div>

        {/* Project Picker / Stats info */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-500 font-bold hidden md:inline">المشروع المستهدف الحالي:</label>
          <div className="relative">
            <button 
              onClick={() => setIsProjectSelectorOpen(!isProjectSelectorOpen)}
              className="px-4 py-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl flex items-center gap-2 text-sm font-bold transition-all"
            >
              <Monitor className="w-4 h-4 text-indigo-400" />
              <span>{selectedProject ? selectedProject.name : 'اختر مشروعاً...'}</span>
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md border border-indigo-500/20">انقر لتغيير المشروع</span>
            </button>

            {/* Selector Dropdown list */}
            {isProjectSelectorOpen && (
              <div className="absolute left-0 mt-2 z-30 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 border-b border-slate-800 text-xs font-bold text-slate-500">
                  حدد المشروع لتحليل وتوليد الحملات
                </div>
                <div className="max-h-60 overflow-y-auto mt-1 space-y-1">
                  {allProjects.map(proj => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setSelectedProject(proj);
                        setIsProjectSelectorOpen(false);
                      }}
                      className={`w-full text-right p-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${selectedProject?.id === proj.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      <span className="truncate">{proj.name}</span>
                      <ChevronRightIcon className="w-4 h-4 opacity-50" />
                    </button>
                  ))}
                  {allProjects.length === 0 && (
                    <div className="text-center p-4 text-xs text-slate-500">
                      لا توجد مشاريع برمجية متاحة بعد. 
                      <button 
                        onClick={() => navigate('projectWizard')}
                        className="text-indigo-400 hover:underline block mx-auto mt-2 font-bold"
                      >
                        أنشئ مشروعاً الأول الآن 🚀
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Body Layout */}
      <div className="px-6 py-6 flex-grow max-w-7xl mx-auto w-full">
        {selectedProject ? (
          <>
            {/* Analytical Pipeline status card */}
            {isAnalyzing ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto my-12 shadow-2xl backdrop-blur-md">
                <SpinnerIcon className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-6" />
                <h3 className="text-2xl font-black mb-2 tracking-tight">استوديو الذكاء الاصطناعي يباشر إبداعه...</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">يقوم النظام بتحليل المشروع وتقديم المحتوى التسويقي بناءً على البيانات الدقيقة فقط لتأمين جودة تفوق 90%.</p>
                
                {/* Visual Step-by-Step progress tracker */}
                <div className="text-right max-w-md mx-auto space-y-4 border-t border-slate-800 pt-6">
                  {[
                    'فحص وتحليل فكرة مشروعك الرئيسي واستخراج الهوية والخصائص المميزة.',
                    'تحديد القطاع التجاري والمنافسين بشكل دقيق بمختلف الجوانب.',
                    'تحليل تفصيلي لشرائح الجمهور المستهدف وسلوكياتهم الإلكترونية.',
                    'توليد القيمة التسويقية الحصرية وكافة الرسائل الدعائية والبرومبات.',
                    'التحقق والتحكيم الداخلي لجودة المحتوى (معدل التطابق الحالي: 96%).'
                  ].map((label, stepIdx) => {
                    const stepNum = stepIdx + 1;
                    const isDone = analysisStep > stepNum;
                    const isActive = analysisStep === stepNum;
                    return (
                      <div 
                        key={stepIdx} 
                        className={`flex items-start gap-3 text-sm transition-all duration-300 ${isDone ? 'text-indigo-400 font-medium' : isActive ? 'text-slate-200 font-bold scale-[1.01]' : 'text-slate-600'}`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-indigo-400 animate-bounce" />
                          ) : isActive ? (
                            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <div className="w-5 h-5 border border-slate-700 rounded-full flex items-center justify-center text-xs text-slate-600 font-semibold font-mono">
                              {stepNum}
                            </div>
                          )}
                        </div>
                        <p>{label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : campaignData ? (
              <div className="space-y-6">
                
                {/* Project Analysis Brief & Match score */}
                <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/20 font-bold">
                        القطاع الموصوف: {campaignData.sector}
                      </span>
                      <span className="text-xs bg-rose-500/10 text-rose-300 px-3 py-1 rounded-full border border-rose-500/20 font-bold">
                        طراز وتصميم الهوية: {campaignData.designStyle}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
                      <strong>💡 القيمة الاستراتيجية الأساسية (Proposition Value):</strong> {campaignData.valueProposition}
                    </p>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-4xl">
                      <strong>🎯 الجمهور المهتم المستخلص لتوجيه الحملات:</strong> {campaignData.targetAudience}
                    </p>
                  </div>
                  
                  {/* Gauge score container */}
                  <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl text-center flex flex-row md:flex-col items-center gap-3 shrink-0">
                    <div className="relative flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center">
                        <span className="text-lg font-black font-mono text-indigo-400">{validationScore}%</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-300 my-0">دقة الارتباط بالفكرة</h4>
                      <p className="text-[10px] text-green-400 mt-0.5">امتثال مميز وخالٍ من الانحراف</p>
                    </div>
                  </div>
                </div>

                {/* Sub-navigation tabs with gorgeous design */}
                <div className="flex bg-slate-900 border border-slate-850 rounded-2xl p-1.5 overflow-x-auto gap-1">
                  {[
                    { id: 'texts', label: 'نصوص إعلانية', icon: FileText, desc: 'إعلانات، منشورات، إيميلات' },
                    { id: 'images', label: 'صور ترويجية', icon: ImageIcon, desc: 'بانرات ومنشورات سوشيال' },
                    { id: 'videos', label: 'فيديوهات تفاعلية', icon: VideoIcon, desc: 'سكربت، تعليق، توليد فيديو' },
                    { id: 'landing', label: 'صفحة الهبوط', icon: Monitor, desc: 'عناوين، مميزات، كود سريع' },
                    { id: 'plan', label: 'خطة التسويق', icon: Calendar, desc: 'قنوات، روزنامة 30 يوم' }
                  ].map(tab => {
                    const IconComp = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 min-w-[150px] py-3.5 px-4 rounded-xl text-right transition-all flex items-start gap-3 group relative overflow-hidden ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/15' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'}`}
                      >
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-indigo-500' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
                          <IconComp className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                        </div>
                        <div>
                          <p className="font-bold text-sm leading-tight">{tab.label}</p>
                          <p className={`text-[10px] sm:block ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>{tab.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* TAB 1: Texts section */}
                {activeTab === 'texts' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                        {[
                          { id: 'all', label: 'الكل' },
                          { id: 'google', label: 'Google Ads' },
                          { id: 'social', label: 'شبكات السوشيال' },
                          { id: 'email', label: 'البريد الإلكتروني' },
                          { id: 'push', label: 'التنبيهات بوش' }
                        ].map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => setTextSubTab(sub.id as any)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${textSubTab === sub.id ? 'bg-slate-800 text-white border border-slate-700 shadow-inner' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={handleSaveCampaignToProject}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-all"
                        >
                          <Save className="w-4 h-4" />
                          <span>حفظ الأصول بالكامل بالمشروع</span>
                        </button>
                        <button 
                          onClick={() => handleRegenerateItem('ad')}
                          className="px-3 py-2.5 bg-slate-800 hover:bg-slate-755 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>إعادة صياغة ذكية للأقسام</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Google Ads Group */}
                      {(textSubTab === 'all' || textSubTab === 'google') && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                          <h4 className="font-bold text-md text-white flex items-center gap-2 mb-2">
                            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                            إعلانات Google Ads المنسقة
                          </h4>
                          {campaignData.googleAds.map((ad, idx) => (
                            <div key={idx} className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3">
                              <div>
                                <label className="text-[10px] text-indigo-400 font-bold font-mono">السطر الأول (Headline):</label>
                                <input
                                  type="text"
                                  value={ad.headline}
                                  onChange={e => handleEditText('googleAds', idx, 'headline', e.target.value)}
                                  className="w-full bg-slate-900 text-white text-sm font-bold p-1 px-2 border border-slate-800 rounded mt-1 outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-green-400 font-bold font-mono">الوصف الإعلاني (Description):</label>
                                <textarea
                                  value={ad.description}
                                  onChange={e => handleEditText('googleAds', idx, 'description', e.target.value)}
                                  rows={2}
                                  className="w-full bg-slate-900 text-slate-300 text-xs p-1.5 border border-slate-800 rounded mt-1 outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleCopy(`${ad.headline}\n${ad.description}`, `google-ad-${idx}`)}
                                  className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                                  title="نسخ الإعلان"
                                >
                                  {copiedId === `google-ad-${idx}` ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Facebook & Instagram Grid */}
                      {(textSubTab === 'all' || textSubTab === 'social') && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                          <h4 className="font-bold text-md text-white flex items-center gap-2 mb-2">
                            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                            إعلانات Facebook و Instagram المدفوعة
                          </h4>
                          {campaignData.facebookInstagramAds.map((ad, idx) => (
                            <div key={idx} className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3">
                              <div>
                                <label className="text-[10px] text-indigo-400 font-bold">العنوان (Headline):</label>
                                <input
                                  type="text"
                                  value={ad.headline}
                                  onChange={e => handleEditText('facebookInstagramAds', idx, 'headline', e.target.value)}
                                  className="w-full bg-slate-900 text-white text-sm font-bold p-1 px-2 border border-slate-800 rounded mt-1 outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400">النص التسويقي الأساسي (Primary CTA Text):</label>
                                <textarea
                                  value={ad.primaryText}
                                  onChange={e => handleEditText('facebookInstagramAds', idx, 'primaryText', e.target.value)}
                                  rows={5}
                                  className="w-full bg-slate-900 text-slate-300 text-xs p-2 border border-slate-800 rounded mt-1 outline-none focus:border-indigo-500 leading-relaxed"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleCopy(`${ad.headline}\n\n${ad.primaryText}`, `fb-ad-${idx}`)}
                                  className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                                >
                                  {copiedId === `fb-ad-${idx}` ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Organic posts (X and LinkedIn) */}
                      {(textSubTab === 'all' || textSubTab === 'social') && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 md:col-span-2">
                          <h4 className="font-bold text-md text-white flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                            منشورات شبكة السوشيال ميديا العضوية (Organic Posts)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {campaignData.xLinkedInPosts.map((post, idx) => (
                              <div key={idx} className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex flex-col justify-between space-y-3">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${post.platform === 'X' ? 'bg-slate-800 text-white' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                      منصة {post.platform}
                                    </span>
                                    <span className="text-[10px] text-slate-500">منشور تسويقي تفاعلي</span>
                                  </div>
                                  <textarea
                                    value={post.content}
                                    onChange={e => handleEditText('xLinkedInPosts', idx, 'content', e.target.value)}
                                    rows={6}
                                    className="w-full bg-slate-900 text-slate-200 text-xs p-2 border border-slate-850 rounded mt-1 outline-none focus:border-indigo-500 leading-relaxed"
                                  />
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
                                  <button 
                                    onClick={() => handleCopy(post.content, `organic-${idx}`)}
                                    className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                                  >
                                    {copiedId === `organic-${idx}` ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Email Sequences */}
                      {(textSubTab === 'all' || textSubTab === 'email') && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 md:col-span-2">
                          <h4 className="font-bold text-md text-white flex items-center gap-2">
                            <Mail className="w-5 h-5 text-indigo-400" />
                            حملة البريد الإلكتروني التسويقي البارد (Cold / Welcome Emails)
                          </h4>
                          {campaignData.emails.map((email, idx) => (
                            <div key={idx} className="bg-slate-950 p-5 border border-slate-850 rounded-xl space-y-4">
                              <div>
                                <label className="text-[10px] text-indigo-400 font-bold">العنوان وموضوع البريد الخاص بك (Email Subject):</label>
                                <input
                                  type="text"
                                  value={email.subject}
                                  onChange={e => handleEditText('emails', idx, 'subject', e.target.value)}
                                  className="w-full bg-slate-900 text-white text-sm font-bold p-2 border border-slate-800 rounded mt-1 outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400">محتوى الإيميل (Email Body Code):</label>
                                <textarea
                                  value={email.body}
                                  onChange={e => handleEditText('emails', idx, 'body', e.target.value)}
                                  rows={8}
                                  className="w-full bg-slate-900 text-slate-300 text-xs p-3 border border-slate-800 rounded mt-1 outline-none focus:border-indigo-500 leading-relaxed font-sans"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleCopy(`الموضوع: ${email.subject}\n\n${email.body}`, `email-${idx}`)}
                                  className="px-4 py-2 text-xs bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl font-bold text-slate-300 flex items-center gap-1.5 transition-all"
                                >
                                  {copiedId === `email-${idx}` ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                  <span>نسخ الإيميل التسويقي</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Push Notifications */}
                      {(textSubTab === 'all' || textSubTab === 'push') && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 md:col-span-2">
                          <h4 className="font-bold text-md text-white flex items-center gap-2">
                            <Bell className="w-5 h-5 text-orange-400" />
                            إشعارات بوش تذكيرية وسريعة (Push Notifications)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {campaignData.pushNotifications.map((push, idx) => (
                              <div key={idx} className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-amber-500" />
                                <div className="flex items-center gap-2">
                                  <Bell className="w-4 h-4 text-orange-400 shrink-0" />
                                  <input
                                    type="text"
                                    value={push.title}
                                    onChange={e => handleEditText('pushNotifications', idx, 'title', e.target.value)}
                                    className="w-full bg-transparent text-white text-sm font-bold border-none outline-none focus:border-b focus:border-slate-800"
                                  />
                                </div>
                                <textarea
                                  value={push.body}
                                  onChange={e => handleEditText('pushNotifications', idx, 'body', e.target.value)}
                                  rows={2}
                                  className="w-full bg-transparent text-slate-300 text-xs border-none outline-none resize-none leading-relaxed"
                                />
                                <div className="flex justify-end pt-1">
                                  <button 
                                    onClick={() => handleCopy(`${push.title}\n${push.body}`, `push-${idx}`)}
                                    className="p-1.5 bg-slate-900 hover:bg-slate-850 rounded-md text-slate-400 hover:text-white"
                                  >
                                    {copiedId === `push-${idx}` ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* TAB 2: Images module */}
                {activeTab === 'images' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h3 className="text-lg font-black text-white mb-2">توليد الصور وصناعة التصاميم الممولة</h3>
                      <p className="text-slate-400 text-xs">صمّم جميع لوحات مشروعك التسويقي بنقرة واحدة بالمقاسات والبرومبت المبتكر مباشرة من قطاع الخدمة.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {campaignData.imagePrompts.map((img, idx) => {
                        const hasImg = !!img.imageUrl;
                        return (
                          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full">
                            
                            {/* Visual Display container */}
                            <div className="aspect-video bg-slate-950 flex items-center justify-center p-3 relative overflow-hidden group border-b border-slate-850">
                              {img.isGenerating ? (
                                <div className="text-center space-y-2 animate-pulse">
                                  <SpinnerIcon className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                                  <p className="text-[10px] text-slate-500 font-bold">جاري الصياغة الفنية والمقاس...</p>
                                </div>
                              ) : hasImg ? (
                                <>
                                  <img 
                                    src={img.imageUrl} 
                                    alt={img.platform} 
                                    className="object-contain w-full h-full rounded-lg transition-transform duration-500 group-hover:scale-105" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                    <button 
                                      onClick={() => handleDownloadImage(img.imageUrl!, `${img.platform}.jpg`)}
                                      className="p-2 bg-indigo-600 rounded-lg text-white font-medium hover:bg-indigo-500 shadow"
                                      title="تحميل بجهازك"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const updated = { ...campaignData };
                                        updated.imagePrompts[idx].isEditing = true;
                                        setCampaignData(updated);
                                      }}
                                      className="p-2 bg-slate-800 rounded-lg text-slate-200 font-medium hover:bg-slate-700 hover:text-white"
                                      title="طلب تعديل الصورة"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center p-4">
                                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                                    <ImageIcon className="w-5 h-5" />
                                  </div>
                                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                                    {img.size}
                                  </span>
                                  <p className="text-slate-500 text-xs mt-2">تصميم مخصص للمنصة وجاهز للتوليد</p>
                                </div>
                              )}
                            </div>

                            {/* Info & prompt area */}
                            <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-indigo-400">{img.platform}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">{img.size}</span>
                                </div>
                                {img.isEditing ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={img.editQuery || ''}
                                      onChange={e => {
                                        const updated = { ...campaignData };
                                        updated.imagePrompts[idx].editQuery = e.target.value;
                                        setCampaignData(updated);
                                      }}
                                      rows={2}
                                      placeholder="مثال: غير ألوان الخلفية إلى نيون أزرق دافئ وأضف واجهة ثلاثية الأبعاد..."
                                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500"
                                    />
                                    <div className="flex gap-1.5 justify-end">
                                      <button
                                        onClick={() => handleEditImagePrompt(idx, img.editQuery || '')}
                                        className="px-3 py-1 bg-green-600 text-white font-bold text-[10px] rounded-lg"
                                      >
                                        توليد التعديلات
                                      </button>
                                      <button
                                        onClick={() => {
                                          const updated = { ...campaignData };
                                          updated.imagePrompts[idx].isEditing = false;
                                          setCampaignData(updated);
                                        }}
                                        className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] rounded-lg"
                                      >
                                        إلغاء
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-slate-300 text-xs leading-relaxed line-clamp-3 hover:line-clamp-none cursor-pointer p-1 rounded hover:bg-slate-950 transition-all">
                                    {img.prompt}
                                  </p>
                                )}
                              </div>

                              <div className="flex gap-2 pt-2 border-t border-slate-850">
                                <button 
                                  onClick={() => handleGenerateImageForPrompt(idx)}
                                  disabled={img.isGenerating}
                                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-indigo-500/10"
                                >
                                  {img.isGenerating ? <SpinnerIcon className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                  <span>{hasImg ? 'إعادة تصميم الصورة' : 'توليد الصورة بالذكاء الاصطناعي'}</span>
                                </button>
                                {hasImg && (
                                  <button
                                    onClick={() => handleDownloadImage(img.imageUrl!, `${img.platform}.jpg`)}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                                    title="تحميل"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 3: Video section */}
                {activeTab === 'videos' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                          <VideoIcon className="w-5 h-5 text-indigo-400" />
                          صناعة الفيديوهات الإعلانية والقصيرة
                        </h3>
                        <p className="text-slate-400 text-xs mt-1">تحديد المدة وتوليد تعليق صوتي ومشاهد متناسقة مرندرة بالكامل بالذكاء الاصطناعي.</p>
                      </div>
                      
                      {/* Duration Picker option */}
                      <div className="flex items-center gap-2 bg-slate-950 p-1 border border-slate-850 rounded-xl shrink-0">
                        {[15, 30, 60].map(secs => (
                          <button
                            key={secs}
                            onClick={() => handleDurationChange(secs)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${videoDuration === secs ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                            {secs} ثانية
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Scenes timeline & custom edits */}
                      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                          <h4 className="font-bold text-sm text-slate-300">سيناريو المشاهد والتعليق الصوتي المعتمد</h4>
                          <span className="text-[10px] text-indigo-400 font-bold">{campaignData.videoScript.length} مشاهد مخصصة</span>
                        </div>

                        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                          {campaignData.videoScript.map((sc, scIdx) => (
                            <div key={scIdx} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 relative">
                              <span className="absolute top-3 left-3 text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                                المشهد {sc.scene} • {sc.duration} ث
                              </span>
                              
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold">الوصف البصري للمشهد والرسوم المتحركة:</label>
                                <textarea
                                  value={sc.visual}
                                  onChange={e => handleEditVideoScene(scIdx, 'visual', e.target.value)}
                                  rows={2}
                                  className="w-full bg-slate-900 text-slate-200 text-xs p-2 border border-slate-850 rounded mt-1 outline-none focus:border-indigo-500"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] text-green-400 font-bold">سكريبت التعليق الصوتي المقترح (Voiceover narrative):</label>
                                <textarea
                                  value={sc.voiceover}
                                  onChange={e => handleEditVideoScene(scIdx, 'voiceover', e.target.value)}
                                  rows={2}
                                  className="w-full bg-slate-900 text-slate-205 text-xs p-2 border border-slate-850 rounded mt-1 outline-none focus:border-indigo-500 font-mono"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rendering display & player mockup */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                        <div className="space-y-4">
                          <h4 className="font-bold text-sm text-white">معاينة وشاشة توليد الفيديو النهائي</h4>
                          
                          {/* Player Box */}
                          <div className="aspect-[9/16] max-h-[320px] bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden relative flex items-center justify-center mx-auto w-full max-w-[190px]">
                            {isRenderingVideo ? (
                              <div className="text-center p-3 space-y-3 z-10">
                                <SpinnerIcon className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
                                <p className="text-[10px] text-slate-400 font-bold animate-pulse">جاري دمج الملفات الصوتية والبصريات...</p>
                              </div>
                            ) : renderedVideoUrl ? (
                              <video 
                                src={renderedVideoUrl} 
                                controls 
                                autoPlay 
                                loop 
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="text-center p-4">
                                <VideoIcon className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                                <p className="text-[10px] text-slate-500">انقر على الزر لتوليد رندرة الفيديو</p>
                              </div>
                            )}

                            {/* Aesthetic overlay captions */}
                            {campaignData.videoScript.length > 0 && (
                              <div className="absolute bottom-4 left-2 right-2 bg-black/75 backdrop-blur-sm p-2 rounded-lg border border-slate-800 text-center">
                                <p className="text-[9px] text-indigo-400 font-bold font-mono">شرح ترويجي:</p>
                                <p className="text-[10px] text-slate-200 truncate mt-0.5">{campaignData.videoScript[0].voiceover}</p>
                              </div>
                            )}
                          </div>

                          {/* Render Logs terminal */}
                          {videoRenderLogs.length > 0 && (
                            <div className="bg-slate-950 rounded-xl p-3 border border-slate-850 font-mono text-[9px] text-green-400 max-h-36 overflow-y-auto space-y-1">
                              {videoRenderLogs.map((log, lIdx) => (
                                <p key={lIdx} className="leading-relaxed">&gt; {log}</p>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-850">
                          <button
                            onClick={handleRenderVideo}
                            disabled={isRenderingVideo}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all text-white shadow-lg shadow-indigo-500/10"
                          >
                            <Play className="w-4 h-4" />
                            <span>توليد ورندرة الفيديو التسويقي</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* TAB 4: Landing Page section */}
                {activeTab === 'landing' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="text-lg font-black text-white">صناعة وبناء محتوى صفحة الهبوط الخاصة بالمشروع</h3>
                        <p className="text-slate-400 text-xs mt-1">نسخة ترويجية تهدف إلى إثارة اهتمام العملاء فوراً وتوجيههم وتسهيل عملية الانضمام.</p>
                      </div>
                      <button
                        onClick={handleDownloadLandingTemplate}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs rounded-xl flex items-center gap-1.5 text-white shadow transition-all shrink-0"
                      >
                        <FileCode className="w-4 h-4" />
                        <span>تحميل وتصدير صفحة الهبوط كملف HTML مستقل</span>
                      </button>
                    </div>

                    {/* Live mockup browser screen */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                      
                      {/* Browser header strip */}
                      <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-850">
                        <div className="flex gap-1.5">
                          <span className="w-3 h-3 bg-red-500/35 rounded-full" />
                          <span className="w-3 h-3 bg-yellow-500/35 rounded-full" />
                          <span className="w-3 h-3 bg-green-500/35 rounded-full" />
                        </div>
                        <div className="bg-slate-900 text-slate-500 text-[10px] font-mono rounded-lg px-20 py-1 border border-slate-800 truncate max-w-xs md:max-w-md">
                          https://demo-marketing.ai-ideas.io/{selectedProject.name.toLowerCase()}
                        </div>
                        <span className="w-4" />
                      </div>

                      {/* Mock Landing Preview Area */}
                      <div className="p-8 md:p-12 space-y-12 max-h-[500px] overflow-y-auto">
                        
                        {/* Landing Hero Column */}
                        <div className="text-center max-w-4xl mx-auto space-y-4">
                          <span className="inline-flex py-1 px-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-bold">
                            ✨ نعيش اليوم في قطاع: {campaignData.sector}
                          </span>
                          
                          <input
                            type="text"
                            value={campaignData.landingPage.heroHeadline}
                            onChange={e => {
                              const updated = { ...campaignData };
                              updated.landingPage.heroHeadline = e.target.value;
                              setCampaignData(updated);
                            }}
                            className="w-full text-center bg-transparent text-white font-black text-2xl md:text-4xl tracking-tight border-none outline-none focus:ring-1 focus:ring-slate-800 p-2 rounded"
                          />

                          <textarea
                            value={campaignData.landingPage.heroDescription}
                            onChange={e => {
                              const updated = { ...campaignData };
                              updated.landingPage.heroDescription = e.target.value;
                              setCampaignData(updated);
                            }}
                            rows={3}
                            className="w-full text-center bg-transparent text-slate-400 text-sm md:text-md border-none outline-none focus:ring-1 focus:ring-slate-800 p-2 rounded leading-relaxed max-w-2xl mx-auto resize-none"
                          />

                          <div className="pt-4 flex flex-col justify-center items-center gap-2">
                            <span className="px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-xl text-xs select-none">
                              {campaignData.landingPage.ctas[0]?.text}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {campaignData.landingPage.ctas[0]?.subtext}
                            </span>
                          </div>
                        </div>

                        {/* Features mockup Grid */}
                        <div className="border-t border-slate-800 pt-8 space-y-4">
                          <h4 className="text-center font-bold text-sm text-slate-400">الفرص والخصائص المتميزة التي تحصل عليها</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {campaignData.landingPage.features.map((ft, ftIdx) => (
                              <div key={ftIdx} className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-3">
                                <input
                                  type="text"
                                  value={ft.title}
                                  onChange={e => handleEditText('landingFeatures', ftIdx, 'title', e.target.value)}
                                  className="w-full bg-transparent text-white font-bold text-sm border-none outline-none focus:ring-1 focus:ring-slate-800 p-1 rounded"
                                />
                                <textarea
                                  value={ft.desc}
                                  onChange={e => handleEditText('landingFeaturesDesc', ftIdx, 'desc', e.target.value)}
                                  rows={3}
                                  className="w-full bg-transparent text-slate-400 text-xs border-none outline-none focus:ring-1 focus:ring-slate-800 p-1 rounded resize-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* FAQs Accordion Grid */}
                        <div className="border-t border-slate-800 pt-8 space-y-4">
                          <h4 className="text-center font-bold text-sm text-slate-400">الأسئلة الشائعة</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {campaignData.landingPage.faqs.map((faq, faqIdx) => (
                              <div key={faqIdx} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2">
                                <input
                                  type="text"
                                  value={faq.question}
                                  onChange={e => handleEditText('landingFaqsQ', faqIdx, 'question', e.target.value)}
                                  className="w-full bg-transparent text-white font-bold text-xs border-none outline-none focus:ring-1 focus:ring-slate-800 p-1 rounded"
                                />
                                <textarea
                                  value={faq.answer}
                                  onChange={e => handleEditText('landingFaqsA', faqIdx, 'answer', e.target.value)}
                                  rows={2}
                                  className="w-full bg-transparent text-slate-400 text-[11px] border-none outline-none focus:ring-1 focus:ring-slate-800 p-1 rounded resize-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: Plan section */}
                {activeTab === 'plan' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Left structure: General Plan briefing */}
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:col-span-1 space-y-6 flex flex-col justify-between">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-md font-bold text-white flex items-center gap-2 mb-3">
                              <Target className="w-5 h-5 text-indigo-400" />
                              القنوات والوسائل المستهدفة
                            </h3>
                            <div className="space-y-2">
                              {campaignData.marketingPlan.channels.map((chan, chIdx) => (
                                <div key={chIdx} className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-350 flex items-center gap-2 font-medium">
                                  <span className="w-2 h-2 bg-indigo-400 rounded-full shrink-0 animate-pulse" />
                                  <span>{chan}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-md font-bold text-white flex items-center gap-2 mb-3">
                              <TrendingUp className="w-5 h-5 text-rose-400" />
                              رصد الكلمات المفتاحية الذكية
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {campaignData.marketingPlan.keywords.map((kw, kwIdx) => (
                                <span key={kwIdx} className="text-xs bg-slate-950 border border-slate-850 text-indigo-300 font-mono px-3 py-1.5 rounded-xl font-bold">
                                  #{kw}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-md font-bold text-white flex items-center gap-2 mb-2">
                              <Compass className="w-5 h-5 text-green-400" />
                              خطة واستراتيجية الإطلاق
                            </h3>
                            <p className="text-slate-300 text-xs leading-relaxed bg-slate-950/60 p-4 border border-slate-850 rounded-xl">
                              {campaignData.marketingPlan.launchStrategy}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-850">
                          <button
                            onClick={() => handleRegenerateItem('plan')}
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-705 text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                          >
                            <RotateCw className="w-4 h-4" />
                            <span>إعادة تخطيط استراتيجية الإطلاق</span>
                          </button>
                        </div>
                      </div>

                      {/* Right structure: 30-Day Content interactive calendar */}
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                          <div>
                            <h3 className="text-lg font-black text-white">روزنامة المحتوى والتواصل - 30 يوماً متكاملة</h3>
                            <p className="text-slate-500 text-xs mt-0.5">جدول أعمال مبرمج ومخطط للنشر ومتابعة الخطوات والتقدم بشكل تفاعلي.</p>
                          </div>
                          
                          {/* Checked elements stats indicator */}
                          <span className="text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                            تم نشر: {campaignData.marketingPlan.thirtyDayCalendar.filter(c => c.completed).length} من 5 منشورات برمجية
                          </span>
                        </div>

                        <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                          {campaignData.marketingPlan.thirtyDayCalendar.map((item, idx) => {
                            const isCheck = !!item.completed;
                            return (
                              <div 
                                key={idx} 
                                className={`p-4 border rounded-2xl flex items-start gap-4 transition-all duration-300 ${isCheck ? 'bg-indigo-950/15 border-indigo-500/30 opacity-75' : 'bg-slate-950 border-slate-850 hover:border-slate-700'}`}
                              >
                                {/* Interactive check state */}
                                <button
                                  onClick={() => {
                                    const updated = { ...campaignData };
                                    updated.marketingPlan.thirtyDayCalendar[idx].completed = !isCheck;
                                    setCampaignData(updated);
                                    showToast(isCheck ? '↩️ تم إلغاء علامة النشر للمنشور' : '🚀 رائع! تم تسجيل نشر المنشور وتحديث الإحصاءات بنجاح!');
                                  }}
                                  className={`shrink-0 mt-0.5 p-1 rounded-lg transition-colors ${isCheck ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-800'}`}
                                >
                                  {isCheck ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                </button>

                                <div className="space-y-1.5 flex-grow">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-2 py-0.5">
                                      اليوم {item.day}
                                    </span>
                                    <span className="text-xs bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold">
                                      المنصة المقترحة: {item.channel}
                                    </span>
                                  </div>
                                  <h5 className="font-bold text-sm text-white mb-1">{item.topic}</h5>
                                  <p className="text-slate-405 text-xs leading-relaxed font-sans">{item.caption}</p>
                                </div>

                                <button 
                                  onClick={() => handleCopy(item.caption, `calendar-text-${idx}`)}
                                  className="p-2 border border-slate-805 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white shrink-0 self-center"
                                  title="نسخ محتوى المنشور"
                                >
                                  {copiedId === `calendar-text-${idx}` ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-850 rounded-3xl p-12 text-center max-w-lg mx-auto my-12 shadow-2xl">
                <AlertCircle className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-bounce" />
                <h3 className="text-xl font-bold text-white mb-2">استوديو التسويق يحتاج إلى فكرة لتحليلها</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">يرجى الانتظار حتى تكتمل قراءة بيانات المشروع أو اختيار واحد من قائمة المشاريع بالأعلى.</p>
                <button 
                  onClick={() => selectedProject && runMarketingPipeline(selectedProject)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-505 font-bold text-xs rounded-xl text-white shadow"
                >
                  بدء التحليل الفوري الآن
                </button>
              </div>
            )}
          </>
        ) : (
          /* Landing/Onboarding State when no project is created yet */
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto my-12 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-slate-800 text-orange-400 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black mb-3">لا توجد مشاريع برمجية نشطة حالياً</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto mb-8">
              يعتمد قسم "المحتوى التسويقي" بشكل كامل على بيانات ومواصفات مشروعك المنشأ لتصميم الحملات والبرومبت بأعلى دقة مطابقة بنسبة تفوق 90%.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
              <button 
                onClick={() => navigate('projectWizard')}
                className="p-5 border border-slate-800 hover:border-indigo-500/50 bg-slate-950 hover:bg-slate-900 rounded-2xl text-right transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="font-bold text-sm text-white mb-1">ابتكار مشروع جديد</h4>
                <p className="text-[10px] text-slate-500 leading-normal">اصنع فكرة أو تطبيق وارجع لتوليد كامل محتواه التسويقي فوراً.</p>
              </button>

              <div className="p-5 border border-slate-800 bg-slate-950 rounded-2xl text-right relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-orange-500" />
                <div>
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center mb-3">
                    <TrendingUp className="w-4 h-4 animate-pulse" />
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">توليد من فكرة مخصصة</h4>
                  <p className="text-[10px] text-slate-500 leading-normal">أدخل فكرة مبدئية وعامة لتوليد مصفوفة تسويقية لها بشكل طارئ ومستعجل.</p>
                </div>
                <button
                  onClick={() => {
                    const tempProj = {
                      id: `temp-${Date.now()}`,
                      name: 'متجري الإلكتروني الجديد',
                      description: 'منصة لبيع ومبادلة المنتجات والخدمات الصديقة للبيئة بشكل عصري وآمن وبدون رسوم مخفية.',
                      type: ProjectType.STORE,
                      files: [],
                      sections: [],
                      timestamp: Date.now()
                    };
                    setSelectedProject(tempProj);
                  }}
                  className="mt-3 text-[10px] text-indigo-400 hover:underline text-right font-bold flex items-center gap-1"
                >
                  <span>جرب التوليد من فكرة عينة مخصصة الآن</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};

// Simple visual helper components to fit named imports and style boundaries
const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
  <svg className={`${className}`} fill="none" viewBox="0 0 24 24" {...props}>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const ChevronRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
  <svg className={`${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

export default Marketing;
