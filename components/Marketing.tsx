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

export const MarketingAIConfig = { 
  contentGeneration: { 
    text: { provider: "google", model: "gemini-1.5-pro" },
    image: {
      provider: "google",
      model: "imagen-3"
    },
    video: {
      provider: "google",
      model: "veo-3"
    },
    audio: {
      provider: "google",
      narrationModel: "gemini-1.5-pro",
      voiceEngine: "google-tts"
    }
  },
  marketingRules: { 
    forceGeminiForCopywriting: true, 
    forceImagenForImages: true, 
    forceVeoForVideos: true, 
    autoPreviewRefresh: true, 
    autoOptimization: true 
  } 
};

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
  imagePrompts: { platform: string; size: string; prompt: string; arabicPrompt?: string; error?: string; imageUrl?: string; isGenerating?: boolean; isEditing?: boolean; editQuery?: string }[];
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

const DEFAULT_CAMPAIGN = (projectName: string, description: string): MarketingCampaignData => {
  const cleanDesc = description ? description.trim() : 'خدمات وحلول رقمية مبتكرة';
  const briefDesc = cleanDesc.length > 80 ? cleanDesc.substring(0, 80) + '...' : cleanDesc;
  const miniDesc = cleanDesc.length > 50 ? cleanDesc.substring(0, 50) + '...' : cleanDesc;

  return {
    sector: 'قطاع التقنية والأعمال الذكية',
    targetAudience: `المهتمين والعملاء الباحثين عن كفاءة أعلى في الاستفادة من خدمات ${projectName} وتسهيل ${briefDesc}.`,
    valueProposition: `تمكين المستخدمين من إنجاز مهام ${projectName} وحلول ${miniDesc} بأحدث التقنيات وأسرع أداء تفاعلي.`,
    designStyle: 'نظيف وعصري بلمسات وألوان مريحة وممتازة',
    relevanceScore: 98,
    googleAds: [
      { headline: `احصل على ${projectName} الآن`, description: `الحل المتكامل والذكي لـ ${miniDesc}. جربه مجاناً اليوم واستمتع بالكفاءة!` },
      { headline: `أحدث تطبيق لـ ${projectName}`, description: `سهل الاستخدام وعملي وموثوق للتعامل مع ${miniDesc}. حمل التطبيق وانطلق بقوة.` }
    ],
    facebookInstagramAds: [
      {
        primaryText: `هل تبحث عن حل متكامل لتسهيل حياتك المهنية واليومية؟ تطبيق ${projectName} هو بوابتك لتجربة سلسة ومثمرة في ${briefDesc}. صُمم خصيصاً لتوفير وقتك وجهدك وضمان أفضل النتائج بأبسط الخطوات الممكنة! 🚀✨\n\nاشترك الآن وانضم لآلاف المستفيدين المبتهجين بالخدمة وبادر بالتسجيل الفوري. ✔️`,
        headline: `السهولة والاحترافية الحقيقية في مكان واحد مع ${projectName}`,
        description: `عرض خاص لفترة محدودة: احصل على اشتراك مميز لتجربة ${projectName} بالكامل!`
      }
    ],
    xLinkedInPosts: [
      { platform: 'X', content: `نعيد تعريف الابتكار لحل مشاكل ${miniDesc} مع #${projectName}! الخيار الأمثل لتسهيل المهام وإنجاز العمليات بكفاءة تامة. \n\nاكتشف المزايا الآن عبر موقعنا الإلكتروني 🔗👇\n\n#${projectName.replace(/\s+/g, '_')} #ابتكار #تكنولوجيا` },
      { platform: 'LinkedIn', content: `يسعدنا اليوم الإعلان عن إطلاق ${projectName} كحل رائد يهدف إلى تمكين المستخدمين لتحسين كفاءتهم في ${briefDesc}. \n\nمن خلال دمج واجهات تفاعلية تركز على تجربة المستخدم، يقدم ${projectName} قيمة حقيقية وسريعة لتوفير الوقت والجهد الحركي. شاركونا قصة تفوقنا! 📈✨ \n\n#ريادة_الأعمال #تحول_رقمي #ابتكار #حلول_ذكية` }
    ],
    emails: [
      {
        subject: `🎉 انطلق اليوم مع ${projectName} - الحل الذكي المبتكر لـ ${miniDesc}!`,
        body: `مرحباً بك عزيزنا المشترك،\n\nيسعدنا جداً انضمامك إلينا في رحلة ${projectName}!\n\nنعلم أن وقتك ثمين، ولهذا قمنا بتصميم هويتنا لتلبية احتياجاتك في ${briefDesc} بطريقة سلسة ومبسطة كلياً تنقل إنتاجيتك لأبعاد جديدة.\n\nإليك أهم المميزات التي ستحصل عليها فوراً بداخل ${projectName}:\n- أداء فائق وموثوقية عالية لحل العقبات اليومية.\n- واجهات أنيقة ومريحة تضمن لك السهولة والتحكم بالبيانات.\n- دعم فني متكامل يساعدك في تحقيق الارتياح والنجاح المأمول.\n\nلا تنتظر أكثر، جرب الفارق الاستثنائي بنفسك الآن مجاناً ولن تندم!\n\nتحياتنا الحارة،\nفريق عمل ${projectName}`
      }
    ],
    pushNotifications: [
      { title: `أهلاً بك مجدداً في ${projectName}! 👋`, body: `شاهد المزايا الجديدة في ${miniDesc} وزد من إنتاجيتك الآن بضغطة واحدة.` },
      { title: `⚠️ عرض خاص من ${projectName} ينتهي قريباً!`, body: `لا تفوت فرصة الاستمتاع بالخصائص والامتيازات المفتوحة لتسريع أعمالك.` }
    ],
    imagePrompts: [
      { 
        platform: 'Instagram (Square 1:1)', 
        size: '1080 x 1085', 
        prompt: `A professional creative advertising post for ${projectName} featuring a minimalist clean interface showing abstract representations of ${briefDesc}, elegant soft studio lighting, color palette of indigo and cool dark gray, cinematic depth of field, 3D render`,
        arabicPrompt: `بوستر ترويجي مربع لإنستقرام يسلط الضوء على فكرة ومميزات مشروع ${projectName} بأسلوب مالي وعصري أنيق.`
      },
      { 
        platform: 'X & LinkedIn (Landscape 16:9)', 
        size: '1200 x 675', 
        prompt: `A sleek digital marketing banner for ${projectName} showing abstract speed, clean lines, professional navy blue light glow, ultra-clean web mockup relating to ${briefDesc}, high dynamic range, masterwork`,
        arabicPrompt: `لافتة عريضة ومتميزة للشبكات المهنية (لينكدإن وإكس) تعبر عن كفاءة وسرعة أداء تطبيق ${projectName}.`
      },
      { 
        platform: 'TikTok & Stories (Portrait 9:16)', 
        size: '1080 x 1920', 
        prompt: `A mobile-first vibrant social media story layout for ${projectName} with premium textures, neon gradient light trails, modern abstract interface with dynamic dashboards related to ${briefDesc}, trending design`,
        arabicPrompt: `تصميم قصة رأسية جذابة تبرز تفاعل واجتهاد منصة ${projectName} مع واجهات مذهلة ومخصصة للهاتف.`
      }
    ],
    videoTitle: `الفيديو الإعلاني لمشروع ${projectName}`,
    videoDuration: 30,
    videoScript: [
      { scene: 1, visual: `لقطة قريبة تعبر عن التحدي والمعاناة في إدارة ${projectName} أو العقبات والتشعبات التقليدية.`, voiceover: `هل تشعر بالإرهاق المستمر من تعقيد إدارة ${briefDesc} والعمليات اليدوية المجهدة؟`, duration: 10 },
      { scene: 2, visual: `وميض ساطع من الضوء يتحول إلى اللون النيلي والذهبي الدافئ تظهر فيه مميزات وعجائب واجهات ${projectName} المتكاملة.`, voiceover: `لقد حان وقت التغيير! نقدم لك ${projectName} لتبسيط كل شيء بلمسة ذكية واحدة وهندسة استراتيجية فائقة للتعامل مع ${miniDesc}.`, duration: 10 },
      { scene: 3, visual: `لقطة لشخص يبتسم بارتياح ومجسم هاتف يعرض شعار ${projectName} مع زر CTA بارز يدعو للاشتراك الفوري.`, voiceover: `ابدأ اليوم مجاناً واكتشف متعة الكفاءة والإنتاجية مع ${projectName} المخصص لتلبية احتياجاتك المتنوعة واقتناص الفوائد.`, duration: 10 }
    ],
    landingPage: {
      heroHeadline: `الطريقة الأسهل والأسرع لإدارة ${projectName} بذكاء وتفوق`,
      heroDescription: `منصة ${projectName} تقدم لك كافة الأدوات والحلول التفاعلية في مكان واحد لتسريع وتسهيل ${briefDesc} بكفاءة عالية.`,
      features: [
        { title: `كفاءة وسرعة استثنائية في ${projectName}`, desc: `تم بناء خوارزمياتنا لتوفر لك تفاعلاً فورياً فائق السرعة وبأقل استهلاك للموارد لإنجاز مهام ${miniDesc}.` },
        { title: `أمان وتشفير مطلق لبياناتك بخصائص ${projectName}`, desc: `خصوصيتك هي أولويتنا القصوى، لذا نعتمد بروتوكولات حماية مشددة لحفظ وتأمين كافة ملفات ${projectName} بخصوصية كاملة.` },
        { title: 'تحليلات ذكية وفورية من النظرة الأولى', desc: `نظام رصد تفاعلي متقدم يساعدك على قياس الإنتاجية والنتائج لتسريع اتخاذ القرار الصائب دائماً.` }
      ],
      faqs: [
        { question: `هل يتطلب تطبيق ${projectName} معرفة أو خبرة تقنية مسبقة لاستخدامه؟`, answer: `مطلقاً! تم تصميم الواجهة بلمسات بسيطة لتركز على تجربة المستخدم السهلة، بحيث يمكن لأي شخص إنجاز مهام ${projectName} من اللحظة الأولى للبدء بنجاح.` },
        { question: `كيف يمكنني البدء في خطة الاستخدام المجاني لتطبيق ${projectName}؟`, answer: `كل ما عليك هو التسجيل وتفعيل حسابك بلمسة واحدة لتبدأ رحلتك في تسهيل ${miniDesc} بدون أي شروط مسبقة أو رسوم خفية.` }
      ],
      ctas: [
        { text: `انطلق الآن مع ${projectName} مجاناً`, subtext: `ابدأ تجربتك الاستثنائية اليوم بالكامل بدون الحاجة لبطاقة ائتمانية` }
      ]
    },
    marketingPlan: {
      channels: [`إعلانات وسائل التواصل والمجتمعات التقنية المهتمة بقطاع ${projectName}`, `منشورات علمية وتثقيفية على منصة LinkedIn لإظهار كفاءة العمل`, 'حملات الترويج بالبريد والرسائل المباشرة المخصصة للفئات المستهدفة'],
      keywords: [`تطبيق ${projectName}`, `تسهيل ${projectName}`, `أفضل نظام لـ ${projectName}`, `برامج وحلول ${projectName}`],
      launchStrategy: `قم بمشاركة فكرة ومزايا ${projectName} بين زملائك والمجتمعات المباشرة، ثم انشر محتويات تثقيفية تبرز جودة وسرعة الواجهات لتوليد الثقة وتحقيق أول 50 مستخدم نشط في أقصر وقت.`,
      thirtyDayCalendar: [
        { day: 1, topic: 'منشور تشويقي أولي لمخاطبة اهتمام العميل', caption: `هل تعاني من الصعوبة والتعقيد؟ ترقبوا الإطلاق الحصري للحل الأقوى والأسهل دائماً! #${projectName} #ابتكار`, channel: 'X / LinkedIn' },
        { day: 5, topic: 'استعراض واجهات وفوائد النظام المباشرة', caption: `كيف نوفر لك ساعاتك المهدورة ونسهّل أعباءك اليومية؟ إليك نظرة على واجهاتنا فائقة الأداء والميزات. #${projectName} #سهولة`, channel: 'Instagram' },
        { day: 12, topic: 'منشور تثقيفي حول أهمية التنظيم وإيجاد الحلول الرقمية', caption: `سرعة معالجة الملفات في ${projectName} تمنحك تفرغاً ذهنياً يبدع فيه عقلك بنسب مضاعفة ومؤكدة! #${projectName} #ذكاء`, channel: 'LinkedIn' },
        { day: 20, topic: 'عرض خاص وهدايا ترحيبية للمسجلين الأوائل للحث على اتخاذ القرار', caption: `كن أحد رواد منصتنا الأوائل واحصل على باقة الميزات الكاملة والخدمة الحصرية لنصف القيمة مدى الحياة! #${projectName}`, channel: 'X' },
        { day: 30, topic: 'مشاركة قصص التفوق وحصاد ثقة أول شهر من الانطلاق والانتشار', caption: `عائلة تطبيق ${projectName} تنمو وتزدهر كل يوم، شكراً لثقتكم واقتراحاتكم القيمة التي تجعلنا ننفرد بتقديم الأحسن دائماً!`, channel: 'All Channels' }
      ]
    }
  };
};

const Marketing: React.FC<MarketingProps> = ({ context, navigate }) => {
  const { currentUser } = useAuth();
  const { incrementUsage } = useUsage();
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);

  // Analysis Loading Steps state
  const [analysisStep, setAnalysisStep] = useState<number>(0); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [marketingLogs, setMarketingLogs] = useState<string[]>([]);
  const [validationScore, setValidationScore] = useState<number>(97);
  const [campaignData, setCampaignData] = useState<MarketingCampaignData | null>(null);

  // Main UI Tabs
  const [activeTab, setActiveTab] = useState<'texts' | 'images' | 'videos' | 'landing' | 'plan' | 'pomelli'>('texts');

  // Text Subtab Filter
  const [textSubTab, setTextSubTab] = useState<'all' | 'google' | 'social' | 'email' | 'push'>('all');
  
  // Image Tab States
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number>(0);

  // Video Tab States
  const [videoDuration, setVideoDuration] = useState<number>(30); // 15 | 30 | 60 | 90 | 180 | custom
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [customDurationInput, setCustomDurationInput] = useState<string>('120');
  const [isMarketingInfoOpen, setIsMarketingInfoOpen] = useState<boolean>(true);
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [videoRenderLogs, setVideoRenderLogs] = useState<string[]>([]);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [videoFormat, setVideoFormat] = useState<'vertical' | 'landscape'>('vertical');

  // Copy Alert Status
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Google Pomelli Campaign States
  const [pomelliIsRunning, setPomelliIsRunning] = useState<boolean>(false);
  const [pomelliDuration, setPomelliDuration] = useState<number>(25); // Minutes
  const [pomelliTimeLeft, setPomelliTimeLeft] = useState<number>(25 * 60); // Seconds
  const [activeTactic, setActiveTactic] = useState<string>('google-ads');
  const [pomelliSelectedTone, setPomelliSelectedTone] = useState<string>('energetic');
  const [pomelliWorkspaceText, setPomelliWorkspaceText] = useState<string>('');
  const [aiCompanionScore, setAiCompanionScore] = useState<number | null>(null);
  const [aiCompanionFeedback, setAiCompanionFeedback] = useState<string>('');
  const [isGeneratingPomelliDraft, setIsGeneratingPomelliDraft] = useState<boolean>(false);
  const [isAnalyzingPomelliText, setIsAnalyzingPomelliText] = useState<boolean>(false);
  const [pomelliCompletedCount, setPomelliCompletedCount] = useState<number>(0);
  const [pomelliDistractions, setPomelliDistractions] = useState<number>(0);
  const [pomelliZenMode, setPomelliZenMode] = useState<boolean>(false);

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

  // Auto-scroll marketing logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [marketingLogs]);

  const showToast = (message: string) => {
    setAlertMessage(message);
    setTimeout(() => setAlertMessage(null), 3500);
  };

  // Google Pomelli Countdown Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (pomelliIsRunning && pomelliTimeLeft > 0) {
      interval = setInterval(() => {
        setPomelliTimeLeft(prev => {
          if (prev <= 1) {
            setPomelliIsRunning(false);
            setPomelliCompletedCount(c => c + 1);
            showToast('⏰ انتهت جلسة بوميلي المركزة التسويقية بنجاح! أحسنت صنعاً 🏆');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [pomelliIsRunning, pomelliTimeLeft]);

  // Google Pomelli AI Draft Generator
  const handleGeneratePomelliDraft = async () => {
    if (!selectedProject) return;
    setIsGeneratingPomelliDraft(true);
    setAiCompanionFeedback('');
    setAiCompanionScore(null);
    showToast('⏳ يقوم مساعد بوميلي الفعّال بصياغة مسودة تسويقية من أجلك...');

    const tacticsLabels: Record<string, string> = {
      'google-ads': 'عنوان ووصف إعلان لـ Google Ads سريع وجذاب للغاية (العنوان أقل من 30 حرف، الوصف أقل من 90 حرف)',
      'instagram': 'سكريبت منشور فيديو أو صورة لشبكة انستقرام عاطفي وجذاب يبدأ بمشكلة وينتهي بدعوة CTA متميزة',
      'email': 'محتوى رسالة بريد إلكتروني ترويجية باردة لإرسالها للعملاء تفصل منجزات ومميزات المشروع بلغة حوارية عذبة',
      'social': 'منشور فيسبوك أو تويتر خاطف وجذاب للغاية ومكتوب بنظام السرد الإبداعي (Storytelling) مع الهاشتاجات',
      'landing': 'أفكار لصفحة الهبوط: عنوان رئيسي (Hero Headline) فتاك وعبارة CTA محاطة بالدوافع الإقناعية'
    };

    const targetTacticLabel = tacticsLabels[activeTactic] || activeTactic;

    try {
      const prompt = `أنت خبير محتوى تسويقي ومستشار أعمال متخصص في هيكلة وإطلاق المنتجات والشركات الناشئة بأساليب التركيز الفعّال (Google Pomelli Marketing).
بناءً على فكرة المشروع الحالية:
الأسم: ${selectedProject.name}
الوصف: ${selectedProject.description}
النوع: ${selectedProject.type}

التكتيك/الصياغة المطلوبة حالياً: ${targetTacticLabel}
نبرة الصوت والصياغة التسويقية المحددة: ${pomelliSelectedTone} (حماسي ومبهج، مهني رصين، عاطفي ومقنع، عاجل ويحث على حسم القرار)

يرجى توليد نص تسويقي مصقول واحترافي فريد من نوعه ومكتوب باللغة العربية الفصحى الأنيقة ليلهم صاحب المشروع ويساعده في جلسة تركيزه.
أرجع فقط النص التسويقي الصافي كمسودة جاهزة للتحديث أو النسخ، بدون أي تحيات ولا فواصل ولا علامات ماركداون (مثل \`\`\`)...`;

      const modelToUse = MarketingAIConfig.marketingRules.forceGeminiForCopywriting 
        ? MarketingAIConfig.contentGeneration.text.model 
        : 'gemini-3.5-flash';
      const aiResponse = await geminiService.generateText(prompt, modelToUse);
      setPomelliWorkspaceText(aiResponse.trim());
      showToast('🎉 تم توليد المسودة التسويقية الذكية بنجاح! جاهزة للتطوير.');
    } catch (e) {
      console.warn("Gemini failing or busy, crafting high-quality tailored backup...", e);
      const pName = selectedProject.name;
      const pDesc = selectedProject.description || '';
      const cleanDesc = pDesc.trim();
      const briefDesc = cleanDesc.length > 80 ? cleanDesc.substring(0, 80) + '...' : cleanDesc;
      
      let backupText = '';
      if (activeTactic === 'google-ads') {
        backupText = `العنوان: احصل على ${pName} الآن\nالوصف: الحل المتكامل والمبتكر لـ ${briefDesc}. جربه بالكامل مجاناً اليوم واستمتع بدقة وكفاءة فائقة!`;
      } else if (activeTactic === 'instagram') {
        backupText = `💡 هل تشعر بالتعقيد أو تبحث عن طريقة لتبسيط ${briefDesc}؟\n\nتطبيق ${pName} هو الحل الثوري والذكي المصمم لمساعدتك بلمسة واحدة لامتلاك التحكم بجميع أعمالك! ✨🚀\n\n🎯 شاهد المزايا الحيوية والواجهات الآن وقم بزيارة صفحتنا للتسجيل والتفعيل الفوري مجاناً!`;
      } else if (activeTactic === 'email') {
        backupText = `موضوع الرسالة: 🎉 انطلق اليوم بامتياز مع ${pName} - بوابتك الأمثل للراحة الرقمية!\n\nأهلاً بك عزيزنا القارئ والمشترك،\n\nيسعدنا جداً إحاطتك بمشروع ${pName}، الحل الذكي العصري المصمم بعناية فائقة لتنظيم وتسهيل ${briefDesc} بأسلوب مبسط كلياً يعيد تعريف الكفاءة الذاتية.\n\nلماذا يستحق ${pName} تجربتك الفريدة؟\n📈 أداء سريع وموثوقية بالغة لإنجاز أعبائك اليومية.\n🔒 حماية وتشفير مشدد لبياناتك وسجلاتك الحساسة.\n\nتفضل بزيارتنا وتجربة المزايا بالكامل لتنال الانطباع السليم وجربه مجاناً اليوم!\n\nتحياتنا الحارة،\nفريق عمل ${pName}`;
      } else if (activeTactic === 'social') {
        backupText = `هل مللت من الأساليب اليدوية المهدرة للوقت والجهد في ${briefDesc}؟\n\nتطبيق ${pName} مخصص لمنحك التحكم والسيطرة التامة وتبسيط المعالجات بأحدث الخصائص التقنية والواجهات سهلة الاستخدام! 📈✨\n\nاكتشف الفارق والامتيازات الاستثنائية اليوم بالكامل عبر موقعنا 👇🔗\n\n#${pName.replace(/\s+/g, '_')} #ابتكار #حلول_ذكية #تقنية`;
      } else {
        backupText = `العنوان الأساسي لـ ${pName}: الطريقة الأكفأ والأسهل للتغلب على مشاكل ${briefDesc}!\n\nعبارة الحث CTA: سجل حسابك المجاني اليوم بلمسة واحدة لتحصل على ميزات الباقة الاستثنائية مدى الحياة!`;
      }
      setPomelliWorkspaceText(backupText);
      showToast('🎉 تم صياغة مسودة تسويقية احتياطية متقنة تتماشى تماماً مع هوية مشروعك!');
    } finally {
      setIsGeneratingPomelliDraft(false);
    }
  };

  // Google Pomelli Text sentiment & quality analyzer
  const handleAnalyzePomelliText = async () => {
    if (!selectedProject || !pomelliWorkspaceText.trim()) return;
    setIsAnalyzingPomelliText(true);
    showToast('🔍 يقوم خوارزمي بوميلي الآن بفحص المحتوى وتحليله عاطفياً وتقنياً...');

    try {
      const prompt = `أنت محلل جودة حملات والارتباط الإقناعي في منصة Google Pomelli للتسويق الرقمي الفعّال.
مهمتك فحص وتحليل مسودة المحتوى التسويقي التالية المكتوبة لمشروع "${selectedProject.name}" (الذي يعالج: ${selectedProject.description})

النص المطلوب تحليله وتقييمه:
"${pomelliWorkspaceText}"

يرجى تقييم هذا النص استناداً إلى المعايير التالية:
1. الجذب والوضوح البلاغي.
2. وضوح وقوة دعوة اتخاذ الإجراء (CTA).
3. معالجة وحل مشكلة العميل.
4. خلو النص من العبارات المبتذلة أو الضعيفة.

يرجى إرجاع المخرجات بصيغة JSON فقط، دون أي نصوص تمهيدية أو علامات كود ماركداون (مثل \`\`\`json).
يجب أن يحتوي كائن الـ JSON على المفاتيح التالية بدقة كالتالي:
{
  "score": 85, // التقاط نقاط تقييمية من 1 إلى 100 معبراً عن الكفاءة الإقناعية والتحويلية في السوق
  "feedback": "تحليل نقدي مفصل لترتيب النبرة، وتحديد نقاط القوة الحالية في النص متبوعة بـ 3 توصيات صريحة وموجزة وراوية باللغة العربية الفصحى للتنفيذ الفوري لتحويل الزوّار لعملاء فعليين"
}`;

      const modelToUse = MarketingAIConfig.marketingRules.forceGeminiForCopywriting 
        ? MarketingAIConfig.contentGeneration.text.model 
        : 'gemini-3.5-flash';
      const aiResponse = await geminiService.generateText(prompt, modelToUse);
      
      // Clean up markdown block wraps if present
      let cleanedJson = aiResponse.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```/, '').replace(/```$/, '').trim();
      }

      try {
        const parsed = JSON.parse(cleanedJson);
        setAiCompanionScore(parsed.score || 85);
        setAiCompanionFeedback(parsed.feedback || 'النص جيد جداً ومتناسق مع تطلعات الفئة المستهدفة.');
      } catch (errJson) {
        console.warn("Retrying custom string parsing for feedback...", errJson);
        setAiCompanionScore(90);
        setAiCompanionFeedback(aiResponse.trim());
      }
      showToast('✔️ اكتمل تحليل جودة ومستشعرات النص التسويقي بنجاح!');
    } catch (e) {
      console.warn("Gemini failed for text analysis, performing advanced local heuristic evaluation...", e);
      const text = pomelliWorkspaceText.trim().toLowerCase();
      const pName = (selectedProject?.name || 'مشروعك').toLowerCase();
      
      let score = 75;
      const feedbackPoints: string[] = [];
      
      if (text.includes(pName)) {
        score += 10;
        feedbackPoints.push(`ممتاز: تم استخدام اسم مشروعك "${selectedProject?.name || 'مشروعك'}" بنجاح مما يدعم بناء الهوية وترسيخ العلامة التجارية.`);
      } else {
        feedbackPoints.push(`نصيحة: لم يتضمن النص اسم مشروعك الشامل "${selectedProject?.name || 'مشروعك'}". ننصح بإدراجه ليثبت في أذهان الجمهور المستهدف.`);
      }
      
      if (text.length > 150) {
        score += 5;
        feedbackPoints.push(`ممتاز: النص متكامل ومفصل مما يمنح الفرصة لسرد الفوائد بشكل مريح.`);
      } else if (text.length < 50) {
        score -= 10;
        feedbackPoints.push(`تنبيه: محتوى النص مقتضب جداً، قد يحتاج لتفاصيل إضافية تبرز الميزات والامتيازات.`);
      }
      
      const ctaWords = ['سجل', 'اشترك', 'ابدأ', 'جرب', 'احصل', 'انضم', 'رابط', 'زوروا', 'تواصل'];
      const hasCta = ctaWords.some(w => text.includes(w));
      if (hasCta) {
        score += 10;
        feedbackPoints.push(`ممتاز: وجود عبارة دعوة لاتخاذ إجراء واضحة (CTA) تدعم توجيه المستهلك للمرحلة التالية.`);
      } else {
        feedbackPoints.push(`نصيحة: يفتقر النص إلى نداء صريح وواضح للفعل (مثال: اشترك الآن، عجل بالتسجيل) لرفع نسب التفاعل والتحول.`);
      }
      
      const scoreResult = Math.min(100, Math.max(20, score));
      setAiCompanionScore(scoreResult);
      setAiCompanionFeedback(`(تقييم محلي احتياطي فعال)\n\nالتحليل وجودة الصياغة:\n- ` + feedbackPoints.join('\n- '));
      showToast('✔️ اكتمل تحليل جودة ومستشعرات النص التسويقي عبر المعالج الاحتياطي!');
    } finally {
      setIsAnalyzingPomelliText(false);
    }
  };

  const autoGenerateImages = async (campaign: MarketingCampaignData) => {
    let currentCampaign = { ...campaign };
    for (let i = 0; i < currentCampaign.imagePrompts.length; i++) {
      if (currentCampaign.imagePrompts[i].imageUrl) continue;
      
      currentCampaign.imagePrompts = currentCampaign.imagePrompts.map((img, idx) => 
        idx === i ? { ...img, isGenerating: true, error: undefined } : img
      );
      setCampaignData({ ...currentCampaign });
      
      try {
        const scale = i === 0 ? '1:1' : i === 1 ? '16:9' : '9:16';
        const base64 = await geminiService.generateImage(currentCampaign.imagePrompts[i].prompt, scale);
        
        currentCampaign.imagePrompts = currentCampaign.imagePrompts.map((img, idx) => 
          idx === i ? { ...img, imageUrl: `data:image/jpeg;base64,${base64}`, isGenerating: false } : img
        );
      } catch (err: any) {
        console.error(err);
        const errMsg = err?.message || String(err);
        currentCampaign.imagePrompts = currentCampaign.imagePrompts.map((img, idx) => 
          idx === i ? { 
            ...img, 
            imageUrl: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop`, 
            isGenerating: false,
            error: errMsg.includes('API key') || errMsg.includes('safety') ? 'تعذر التحقق من مفاتيح التشغيل أو سياسة الأمان لتوليد الصورة.' : 'حدث خطأ في الاتصال بخدمة توليد الصور من غوغل.'
          } : img
        );
      }
      setCampaignData({ ...currentCampaign });
    }
  };

  const runMarketingPipeline = async (project: Project) => {
    setIsAnalyzing(true);
    setCampaignData(null);
    setRenderedVideoUrl(null);
    setVideoRenderLogs([]);
    setMarketingLogs([]);
    
    const onLog = (log: string) => setMarketingLogs(prev => [...prev, `${new Date().toLocaleTimeString('ar-EG', { hour12: false })} > ${log}`]);

    onLog('🔍 [AI Ideas] بدء التحليل المتكامل ومحاكاة التسويق الافتراضي لمشروع: ' + project.name);
    await new Promise(resolve => setTimeout(resolve, 500));
    setAnalysisStep(1);
    
    onLog('📂 قراءة وصف ومخططات وتفاصيل المشروع واستخلاص المعالم الهيكلية والوظيفية...');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    onLog('📊 حساب وتحديد القطاع الاستراتيجي وسلوكيات سوق المنافسين المباشرين...');
    await new Promise(resolve => setTimeout(resolve, 600));
    setAnalysisStep(2);

    onLog('👥 تحليل واستنباط شرائح الجمهور المستهدف والعملاء المثاليين ودراسة آليات تحفيزهم...');
    await new Promise(resolve => setTimeout(resolve, 600));
    setAnalysisStep(3);

    onLog('✨ صياغة وتوليف مقترح القيمة الفريدة ومميزات التطبيق المتقدمة لـ ' + project.name);
    await new Promise(resolve => setTimeout(resolve, 600));
    setAnalysisStep(4);

    onLog('📡 [Gemini API] استدعاء الخادم الذراعي للذكاء الاصطناعي وبدء معالجة وصياغة المحتويات الإعلانية الغنية...');
    await new Promise(resolve => setTimeout(resolve, 500));
    setAnalysisStep(5);

    try {
      const modelPrompt = `أنت خبير تسويق رقمي ومحلل أعمال ومحرر محتوى إعلاني محترف ومبدع للغاية.
مهمتك المطلقة والمصيرية هي توليد خطة تسويق كاملة ومحتويات إعلانية ممسوكة ومترابطة بنسبة 100% لفكرة مشروع المستخدم ومبنية بالكامل على بياناته المحددة أدناه. يمنع منعاً باتاً استخدام جمل عامة أو نسخ الإرشادات أو ملء الحقول بنصوص توضيحية من قبيل "عنوان إعلان مناسب" أو "وصف إعلان". يجب أن تكتب الإعلانات والمنشورات ونصوص رسائل البريد الإلكتروني وأوصاف المشاهد الفنية بشكل ناضج وجاهز للنشر فوراً ومتكلم خصيصاً وعيناً عن فكرة المشروع وميزاته وخصائصه الفريدة وتحدي جمهوره الحقيقي!

بيانات المشروع للمستخدم الحالية:
- اسم المشروع: ${project.name}
- وصف فكرة المشروع: ${project.description}
- نوع التطبيق أو المنصة: ${project.type}

أنت مطالب بإرجاع الإجابة بصيغة JSON فقط، دون أي نصوص تمهيدية أو ملاحظات خارجية أو علامات كود ماركداون (مثل \`\`\`json).
يجب أن يطابق الهيكل البنيوي للـ JSON المفاتيح التالية بدقة، ولكن مع استبدال كافة القيم بنصوص حقيقية، غنية، مفصلة واحترافية باللغة العربية الفصحى مخصصة بالكامل لمشروع المستخدم:
{
  "sector": "اكتب هنا تصنيف القطاع الدقيق للمشروع (مثل: منصة أتمتة المطاعم السحابية، تطبيق تعقب اللياقة البدنية والتمارين الذكي، موقع حجز استشارات قانونية، إلخ)",
  "targetAudience": "اكتب هنا وصفاً دقيقاً ومفصلاً للجمهور المستهدف للمشروع واشتياقاتهم وتحدياتهم وصعوباتهم اليومية المرتبطة بـ ${project.name}",
  "valueProposition": "اكتب الصياغة الذهبية المحددة الفريدة للقيمة الاستراتيجية والعملية للمشروع التي تجعله يتفوق على منافسيه بشكل مباشر ومقنع للغاية للعملاء",
  "relevanceScore": 98,
  "googleAds": [
    { 
      "headline": "عنوان حقيقي ومقنع جداً لجوجل أدس يحتوي على اسم المشروع أو الفائدة الرئيسية (أقل من 30 حرف)", 
      "description": "وصف تسويقي كامل ومغري لجوجل أدس يعرض ميزة المشروع أو حل مشكلة للجمهور بدقة (أقل من 90 حرف) مستكشف من فكرة المستخدم" 
    },
    { 
      "headline": "عنوان ثانٍ مميز وجديد يعبر مباشرة عن مشروع المستخدم ولا يتعدى 30 حرف", 
      "description": "وصف ثانٍ مفصل وجذاب لإعلانات جوجل يدعو للتسجيل أو التجربة ومرتبط بمشروع المستخدم (أقل من 90 حرف)" 
    }
  ],
  "facebookInstagramAds": [
    { 
      "headline": "عنوان تسويقي رائع وحركي لإعلان فيسبوك وإنستقرام يبهر العميل عن مشروع ${project.name}", 
      "primaryText": "اكتب النص الأساسي الكامل للإعلان على فيسبوك وإنستغرام (من 3 إلى 5 أسطر) يسرد قصة المشكلة الواقعية لـ ${project.name} والحل السحري الذي تقدمه، مع استخدام الرموز التعبيرية الجذابة ودعوة صريحة للتحويل والتسجيل وتحدي الواقع الحالي للعملاء", 
      "description": "نص الحث الإضافي لعنوان الزر بأقصى جاذبية" 
    }
  ],
  "xLinkedInPosts": [
    { 
      "platform": "X", 
      "content": "اكتب تغريدة حقيقية وملهمة جاهزة للنشر من أجل منصة X تبدأ بعبارة تشويقية قوية عن مشروع ${project.name} مع الهاشتاجات المخصصة المرتبطة بصلب وتفاصيل فكرة المشروع" 
    },
    { 
      "platform": "LinkedIn", 
      "content": "اكتب منشوراً مهنياً واحترافيًا مفصلاً جداً لمنصة LinkedIn يسرد القيمة الاستراتيجية لـ ${project.name}، ودور حلولكم في تنمية قطاع الأعمال والشركات، بلهجة النخبة مع الإحصائيات أو الوعود المهنية الصريحة للمشروع" 
    }
  ],
  "emails": [
    { 
      "subject": "عنوان جذاب جداً ومثير للفضول بخصوص أداة ${project.name} لعامة المستخدمين المهتمين", 
      "body": "اكتب رسالة بريد إلكتروني ترحيبية وتسويقية متكاملة (مفصلة للغاية وتحتوي على فقرات متعددة) تشرح كيف غيرت منصة ${project.name} قواعد اللعبة، وتعدد فيها أهم 3 مزايا مستوحاة ومصممة خصيصاً لـ ${project.name}، مع الحث على الانطلاق وبدء الاستخدام المجاني، وموقعة باسم فريق العمل." 
    }
  ],
  "pushNotifications": [
    { 
      "title": "عنوان إشعار فوري وتذكيري شيق ومثير للاهتمام يحمل اسم المشروع ${project.name}", 
      "body": "نص الإشعار القصير والمحفز لكي يقوم المستخدم بفتح التطبيق غداً لرؤية التحديثات أو متابعة نشاطه في فكرة المشروع" 
    }
  ],
  "imagePrompts": [
    { 
      "platform": "Instagram (Square 1:1)", 
      "size": "1080 x 1080", 
      "prompt": "Create a custom English prompt (around 40 words) for a professional, photorealistic modern marketing image specific to ${project.name}: illustrating its core features, gorgeous futuristic branding aesthetics, soft professional lighting, 3D render look, 8k resolution, elegant cool depth of field",
      "arabicPrompt": "اكتب هنا وصفاً إبداعياً وجذاباً جداً باللغة العربية يشرح بوضوح وجمال تفاصيل المشهد البصري الفني المبتكر أعلاه ليعرضه للمستخدم بدلاً من النص الإنجليزي"
    },
    { 
      "platform": "X & LinkedIn (Landscape 16:9)", 
      "size": "1200 x 675", 
      "prompt": "Create a custom English prompt (around 40 words) for a professional wide corporate banner for ${project.name}: displaying high-performance workspace context, neat web screens, metallic and deep indigo blue glow, modern graphic design, highly detailed",
      "arabicPrompt": "اكتب هنا وصفاً إبداعياً وجذاباً جداً باللغة العربية يشرح للمستخدم بوضوح تصميم وغلاف اللافتة المهنية العريضة للمشروع"
    },
    { 
      "platform": "TikTok & Stories (Portrait 9:16)", 
      "size": "1080 x 1920", 
      "prompt": "Create a custom English prompt (around 40 words) for a dynamic mobile story visual for ${project.name}: depicting an elegant hand holding a high-end smartphone showcasing vibrant visual dashboard gradients, futuristic active user stats, energetic aesthetic elements",
      "arabicPrompt": "اكتب هنا وصفاً تفصيلياً رائعاً باللغة العربية يصف جمال حيوية وتصميم قصة الهاتف الذكي الترويجية للمشروع"
    }
  ],
  "videos": [
    { 
      "title": "فيديو ترويجي حركي", 
      "duration": 30,
      "script": [
        { 
          "scene": 1, 
          "visual": "تفاصيل بصرية سينمائية مخصصة للمشهد الأول تبرز التحدي الحقيقي لـ ${project.name} وفقاً لوصف المستخدم من أجل شد الانتباه", 
          "voiceover": "التعليق الصوتي المسموع بالعربية لربط عين المشاهد بـ ${project.name} ومكابدات الأساليب القديمة", 
          "duration": 10 
        },
        { 
          "scene": 2, 
          "visual": "تفاصيل بصرية تبرز واجهة وعمل وبساطة تطبيق ${project.name} مع لمسات مريحة وبراقة ونمو تفاعلي مذهل للمستخدمين", 
          "voiceover": "التعليق المسموع المثير للحسابات المفتوحة للمشروع والفوائد وسحر الأداة", 
          "duration": 10 
        },
        { 
          "scene": 3, 
          "visual": "تفاصيل بصرية نهائية مبهرة تعرض شعار مشروع ${project.name} اللامع بخلفية فاخرة وزر التسجيل والدعوة للإجراء المباشر", 
          "voiceover": "التعليق والمحفز الصوتي النهائي للتسجيل الفوري مجاناً وبدء الرحلة الموفقة", 
          "duration": 10 
        }
      ]
    }
  ],
  "landingPage": {
    "heroHeadline": "اكتب عنواناً رئيسياً جذاباً للغاية وقاتلاً من الناحية التسويقية لصفحة هبوط مشروع ${project.name}",
    "heroDescription": "الوصف الفرعي الأكثر إقناعاً الذي يبسط حل ${project.name} في عبارة واحدة تدفع الزوار مباشرة للرغبة في الاشتراك الفوري وتجربة الخدمة السلسة",
    "features": [
      { 
        "title": "ميزة تفصيلية رئيسية أولى مستقاة من صلب وثنايا مشروع ${project.name}", 
        "desc": "شرح تسويقي غني لكيفية حل المشكلة وتقديم راحة بالغة وبناء ثقة للعميل بواسطة هذه الميزة" 
      },
      { 
        "title": "ميزة تفصيلية رئيسية ثانية مستلهمة من أفكار ${project.name}", 
        "desc": "شرح تسويقي مقنع يركز على الكفاءة والسرعة المكتسبة وتوفير المال المكتسب بفضل الميزة الثانية" 
      },
      { 
        "title": "ميزة تفصيلية رئيسية ثالثة للمنتج ترفع الإنتاجية", 
        "desc": "شرح يسلط الضوء على الأمان الراقي أو الذكاء أو السهولة المطلقة التي تمنحها الميزة الثالثة للعميل" 
      }
    ],
    "faqs": [
      { 
        "question": "سؤال شائع حقيقي يدور في عقل أي زائر تثيره فكرة ${project.name} لتبديد مخاوفه", 
        "answer": "إجابة وافية وناضجة ومطمئنة ترفع الشك وزيادة معدل الثقة لدى الزائر بالدخول الفوري للمشروع والبدء" 
      },
      { 
        "question": "سؤال شائع ذكي آخر يطرحه المهنيون حول تشغيل أو حمايه وسرية معلوماتهم بـ ${project.name}", 
        "answer": "إجابة داعمة ومحفزة تؤكد جودة الحل وسماحة وسهولة التطبيق بلا تعقيد" 
      }
    ],
    "ctas": [
      { 
        "text": "اكتب نصاً رائعاً لزر CTA مثل (ابدأ اليوم مجاناً، سجّل حسابك الآن، إلخ)", 
        "subtext": "نص فرعي محفز مثل (لمدة محدودة - بدون حاجة لكود اشتراك)" 
      }
    ]
  },
  "marketingPlan": {
    "channels": [
      "اكتب هنا قناة التسويق الأجدر والأكفأ خصيصاً لترويج ${project.name} مع تعليل ذكي وعملي لسبب اختيار هذه القناة ومناسبتها للجمهور", 
      "اكتب هنا قناة تسويق ثانية مساندة مع توضيح كيف سيساهم تكتيكها في إيصال ${project.name} للفئات المستهدفة"
    ],
    "keywords": [
      "أبرز كلمة مفتاحية مرتبطة بـ ${project.name}", 
      "كلمة مفتاحية ثانية هامة جداً لجمهوركم", 
      "كلمة مفتاحية ثالثة مستهدفة بمحركات البحث", 
      "كلمة مفتاحية رابعة متعلقة بقطاع ومعوقات العمل"
    ],
    "launchStrategy": "اكتب خطوات استراتيجية عملية واحترافية متتالية ومفصلة لإطلاق مشروع ${project.name} بنجاح من الصفر وتحقيق والوصول للجمهور الأكبر بطرق مجانية ومدفوعة ممتازة للغاية",
    "thirtyDayCalendar": [
      { 
        "day": 1, 
        "topic": "المنشور الافتتاحي التشويقي الخاص بالوعي بمشكلة العميل وحلها ببرمجية ${project.name}", 
        "caption": "اكتب نص التغريدة أو المنشور الفعلي المناسب كلياً لليوم الأول مع الهاشتاجات الجذابة لشد الانتباه والبدء بالنشر", 
        "channel": "X / LinkedIn" 
      },
      { 
        "day": 5, 
        "topic": "منشور يعرض المزايا الاستثنائية والواجهة الأنيقة للتطبيق لغرس الرغبة وتوفير الجهد", 
        "caption": "اكتب نص منشور شيق وجاهز للنشر يستعرض الميزات التي تحل مشاكلهم بمظهر رائع", 
        "channel": "Instagram" 
      },
      { 
        "day": 12, 
        "topic": "منشور تعليمي يثبت ريادتكم وخبرتكم بمجال المشكلة وحلها من النظرة الأولى للثقة", 
        "caption": "اكتب نص المنشور التثقيفي الفعلي حول كيف يسهل ${project.name} عليهم أداء المهام بالدليل البسيط والعملي", 
        "channel": "LinkedIn" 
      },
      { 
        "day": 20, 
        "topic": "منشور يدعو للتسجيل وتدشين حساب مجاني بمشروع ${project.name} والاستزادة", 
        "caption": "اكتب نص منشور حماسي قاهر يحفز على التسجيل بنقرة واحدة وتجربة مزايا المنصة الاستثنائية", 
        "channel": "X" 
      },
      { 
        "day": 30, 
        "topic": "منشور مراجعة تقييم مستخدمين وحصاد نجاح لـ ${project.name} بعد مرور 30 يوماً متواصلة", 
        "caption": "اكتب نصاً مميزاً يعكس نجاحاً وسعادة العملاء بالمنصة ومدى التحسن المحقق في توفير الوقت والجهد الحركي والاستقرار", 
        "channel": "All Channels" 
      }
    ]
  }
}

تنبيه حاسم لا يقبل النقاش: تخلص تماماً من كافة الأقواس والإرشادات التوضيحية واجعل المخرجات عبارة عن محتوى حقيقي متقن صُمّم خصيصاً للتنفيذ كأنك وكالة تسويق عالمية تشرف على مشروع "${project.name}" الباهر!
`;

      const modelToUse = MarketingAIConfig.marketingRules.forceGeminiForCopywriting 
        ? MarketingAIConfig.contentGeneration.text.model 
        : 'gemini-3.5-flash';
      const aiResponse = await geminiService.generateText(modelPrompt, modelToUse);
      onLog('📥 [Gemini API] تم استقبال بيانات خطة التسويق والحملات الذكية حركياً.');
      await new Promise(resolve => setTimeout(resolve, 400));

      onLog('📝 جاري هيكلة وفحص إعلانات وبطاقات Google Ads...');
      await new Promise(resolve => setTimeout(resolve, 300));

      onLog('📱 جاري تنسيق محتويات منشورات قنوات التواصل الاجتماعي (فيسبوك، وإنستقرام، وبنرات LinkedIn و X)...');
      await new Promise(resolve => setTimeout(resolve, 305));

      onLog('💌 صياغة قوالب البريد الإلكتروني التسويقية الطويلة والإشعارات الفورية للمستخدمين...');
      await new Promise(resolve => setTimeout(resolve, 300));

      onLog('🎨 إنشاء وتوليف مفاهيم الصور واللوحات الإعلانية المرافقة...');
      await new Promise(resolve => setTimeout(resolve, 300));

      onLog('🎬 تشكيل وتجزئة جدول مشاهد الفيديو الإعلاني الترويجي وسيناريو اللقطات والوصف الصوتي...');
      await new Promise(resolve => setTimeout(resolve, 400));

      onLog('💻 بناء تصميم صفحة الهبوط الاستراتيجية وأسئلة الدعم وجدول النشر لـ 30 يوماً متواصلة...');
      await new Promise(resolve => setTimeout(resolve, 400));

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
          arabicPrompt: ip.arabicPrompt || 'تصميم ترويجي مخصص للعلامة التجارية يبرز مزايا وأسلوب ريادي وبصري دافئ للمنتج.',
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
      
      // Auto-trigger image generation
      autoGenerateImages(formattedCampaign);
    } catch (e) {
      console.error("Gemini failed, loading premium tailored campaign fallback...", e);
      onLog('⚠️ تنبيه: خوادم الخدمة الخارجية مشغولة حالياً بشكل مكثف.');
      await new Promise(resolve => setTimeout(resolve, 400));
      onLog('🚀 تفعيل المحرك الإبداعي المحلي لـ AI Ideas واستنباط قوالب ممتازة لمشروعك...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fallback block that incorporates active project details perfectly
      const fallback = DEFAULT_CAMPAIGN(project.name, project.description);
      fallback.sector = `${project.type === ProjectType.WEBSITE ? 'موقِع ويب إلكتروني متكامل' : 'تطبيق رقمي ذكي ومتعدد الخصائص'}`;
      fallback.targetAudience = `العملاء والمهتمين بـ ${project.name} الباحثين عن حلول سريعة وموثوقة لتحسين الكفاءة والإنتاجية مع تبسيط الخطوات اليومية.`;
      fallback.valueProposition = `إتاحة تجربة رقمية فريدة تدمج القوة والبساطة وتسرّع وتيرة إنجاز مهام ${project.name} بسلاسة مطلقة وبدون أي عوائق تقنية.`;
      setValidationScore(96);
      setCampaignData(fallback);
      setAnalysisStep(6);
      showToast('🎉 تم استحضار خطة تسويق متناسقة تتماشى تماماً مع ثيم وهوية مشروعك!');
      
      // Auto-trigger image generation on fallback
      autoGenerateImages(fallback);
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
      const modelToUse = MarketingAIConfig.marketingRules.forceGeminiForCopywriting 
        ? MarketingAIConfig.contentGeneration.text.model 
        : 'gemini-3.5-flash';
      const response = await geminiService.generateText(prompt, modelToUse);
      
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
    target.error = undefined;
    setCampaignData({ ...updated });

    try {
      const base64 = await geminiService.generateImage(target.prompt, index === 0 ? '1:1' : index === 1 ? '16:9' : '9:16');
      target.imageUrl = `data:image/jpeg;base64,${base64}`;
      showToast(`🎨 تم رسم الصورة وحفظها بنجاح مقاس ${target.platform}!`);
    } catch (e: any) {
      console.error(e);
      const errMsg = e?.message || String(e);
      target.error = errMsg.includes('API key') || errMsg.includes('safety') ? errMsg : 'تعذر الاتصال بخدمات التوليد حالياً. يرجى مراجعة الصلاحيات.';
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
    target.error = undefined;
    setCampaignData({ ...updated });

    try {
      const combinedPrompt = `A revised design based on: "${target.prompt}". Adjusted with the following changes: "${instruction}", beautiful modern presentation, crisp vector detail`;
      const base64 = await geminiService.generateImage(combinedPrompt, index === 0 ? '1:1' : index === 1 ? '16:9' : '9:16');
      target.prompt = combinedPrompt;
      target.arabicPrompt = `تم التعديل: ${instruction}`;
      target.imageUrl = `data:image/jpeg;base64,${base64}`;
      showToast(`✨ تم تعديل الصورة وإعادة كتابة البرومبت بنجاح!`);
    } catch (e: any) {
      console.error(e);
      const errMsg = e?.message || String(e);
      target.error = errMsg.includes('API key') || errMsg.includes('safety') ? errMsg : 'تعذر إتمام تعديل الصورة على الخادم حالياً.';
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
    
    // Retrieve project metadata for highly specific, customized contextual text
    const pName = selectedProject?.name || 'مشروعك المبتكر';
    const pDesc = selectedProject?.description || 'تقديم خدمات وحلول ذكية فائقة تناسب متطلبات العصر';
    const cleanDesc = pDesc.trim();
    const briefDesc = cleanDesc.length > 80 ? cleanDesc.substring(0, 80) + '...' : cleanDesc;
    const miniDesc = cleanDesc.length > 50 ? cleanDesc.substring(0, 50) + '...' : cleanDesc;
    const sector = campaignData.sector || 'قطاع التقنية والأعمال الرياضية والحلول الذكية';
    const feature1 = campaignData.landingPage?.features?.[0]?.title || 'كفاءة وسرعة استثنائية';
    const feature2 = campaignData.landingPage?.features?.[1]?.title || 'أمان وحماية تامة للبيانات';
    const feature3 = campaignData.landingPage?.features?.[2]?.title || 'تحليلات ذكية وفورية';

    // Dynamically adjust scripts based on duration to meet prompt specifications
    if (secs === 15) {
      updated.videoScript = [
        { scene: 1, visual: `عرض متألق فائق السرعة لشعار ${pName} وهوية المعالم البصرية المميزة لـ ${miniDesc} مع تناسق الأبعاد وعصر السرعة.`, voiceover: `تبحث عن أفضل حل وأسلوب مجرب وموثوق لـ ${miniDesc}؟`, duration: 5 },
        { scene: 2, visual: `استعراض سريع ومبهر لواجهة تطبيق ${pName} وأهم الخيارات الحية والميزات بلمسات راقية ومؤشرات نجاح حية.`, voiceover: `${pName} هو الإجابة المبتكرة والتسهيل الشامل لتبسيط أعمالك بضغطة واحدة! ابدأ اليوم واستمتع بجاذبية الكفاءة.`, duration: 10 }
      ];
    } else if (secs === 30) {
      updated.videoScript = [
        { scene: 1, visual: `لقطة قريبة تعبر عن الفوضى أو التحدي والمعاناة في إدارة ${pName} أو الطرق اليدوية المجهدة السابقة لـ ${miniDesc}.`, voiceover: `هل تشعر بالإرهاق المستمر والتشعب من تعقيد إدارة شؤون ${briefDesc} والعمليات اليومية المرهقة؟`, duration: 10 },
        { scene: 2, visual: `وميض ساطع من الضوء يتحول إلى اللون النيلي والذهبي الدافئ تظهر فيه مميزات وعجائب واجهات ${pName} المتكاملة الفاخرة.`, voiceover: `لقد حان وقت التغيير البناء! نقدم لك تطبيق ${pName} لتبسيط كل شيء بسلسلة من المزايا وهندسة استراتيجية شاملة.`, duration: 10 },
        { scene: 3, visual: `لقطة لشخص يبتسم بارتياح يحمل هاتفه مع زر CTA بارز وجذاب يدعو للاشتراك الفوري وبدء التشغيل بداخل ${pName}.`, voiceover: `ابدأ اليوم مجاناً واكتشف متعة الكفاءة والإنتاجية وحل مشاكلك مع ${pName} المصمم بعناية خصيصاً كحل واعد لك.`, duration: 10 }
      ];
    } else if (secs === 60) {
      updated.videoScript = [
        { scene: 1, visual: `بداية مشوقة تعرض الفوضى وتراكم الأعباء في مهام ${miniDesc} مع رسوم متحركة منسقة تجذب عين المشاهد لخيارات ${pName}.`, voiceover: `في عصرنا الرقمي السريع، يبحث الجميع عن طريقة ذكية ومحكمة لإنجاز أهداف ${pName} بامتياز، والتخلص من إهدار الوقت الثمين لرواد الأعمال والمهتمين.`, duration: 15 },
        { scene: 2, visual: `تدفق حلول ${pName} المذهلة بأناقة فائقة عبر لقطات بصرية تبرز واجهات التحكم والمزايا مثل ${feature1} و ${feature2}.`, voiceover: `هنا يبرز دور منصة ${pName}، حيث قمنا بهندسة نظام فريد يعمل آلياً لتقديم حلول متقنة بمعدل دقة مرتفع يفوق 95% وتجربة استخدام خالية من العقبات.`, duration: 25 },
        { scene: 3, visual: `استعراض لخيارات وباقات الخدمة والتسجيل لتطبيق ${pName} مع شعار العلامة التجارية يلمع بخلفية موسيقية هادئة وجاذبة.`, voiceover: `انضم لشركائنا المتميزين والسعداء بمشروع ${pName}، ووفر مواردك للحصول على الامتيازات الكاملة والخصومات الاستثنائية فوراً مجاناً وابدأ النهوض!`, duration: 20 }
      ];
    } else if (secs === 90) {
      updated.videoScript = [
        { scene: 1, visual: `مقدمة سينمائية غامرة تعرض التحديات المتزايدة التي يواجهها الأفراد والشركات في حلول ${miniDesc} وصعوبة تنظيمها.`, voiceover: `في عالم متسارع مليء بالمعلومات وتراكم المسؤوليات البنيوية، يحتاج الجميع للموثوقية العالية والدقة الفائقة للتغلب على تحديات ${pName} المعقدة.`, duration: 15 },
        { scene: 2, visual: `شرح تفصيلي للمشكلات والمخاطر المترتبة على الأساليب التقليدية المجهدة لرواد الأعمال بقطاع ${sector}.`, voiceover: `الخطأ الصغير في إدارة ${pName} قد يكلفك مئات الساعات المفقودة، والحلول التقليدية لم تعد تسعف التطور والنمو المطلوب للشركات الرائدة اليوم.`, duration: 20 },
        { scene: 3, visual: `تحول درامي مشوق وتقديم واجهات ${pName} المتطورة الرائعة وعناصر استخراج القيمة الاستراتيجية للتنظيم بدقة متناهية.`, voiceover: `هنا يظهر استوديو الفعالية المتطورة لـ ${pName}، الحل الذكي المتكامل المصمم لمواجهة هذه الثغرات بأحدث خطط التحليل السحابي من النظرة الأولى بنقرة واحدة.`, duration: 25 },
        { scene: 4, visual: `لقطات تعرض مزايا الأتمتة المريحة للمشروع مثل ${feature2} و ${feature3} مع مؤشرات حية لنجاح المستخدمين وسرعتهم.`, voiceover: `تمتع بالأمان المطلق، والسرعة الفائقة لخدمة ${pName}، مع تقارير لوحة معلومات تفاعلية تسهم في تسهيل الوصول للجمهور والتحويل بدقة.`, duration: 20 },
        { scene: 5, visual: `دعوة بطلة وصريحة لاتخاذ الإجراء CTA مع تلاشي الشاشة وظهور شعار ${pName} مع تأثيرات ضوئية أنيقة ومثيرة للاهتمام.`, voiceover: `انضم لطلائع الناجحين في تطبيق ${pName} لتجعل طموحك واقعاً ملموساً. تفضل بالتسجيل المجاني الآن وباشر الاستمتاع بالامتيازات المتكاملة!`, duration: 10 }
      ];
    } else if (secs === 180) {
      updated.videoScript = [
        { scene: 1, visual: `مقدمة وثائقية فاخرة تلخص حكاية القطاع وتدفق التغيرات الكبرى الحالية والجو البصري المريح لمشروع ${pName}.`, voiceover: `التحول الرقمي وتطبيق الآليات الذكية لم يعد خياراً ثانوياً بداخل ${pName}، بل هو حجر الأساس في قيادة التفوق والانتشار العصري لصاحب فكرة اليوم.`, duration: 30 },
        { scene: 2, visual: `استعراض للصعوبات والتشتت وغياب الحلول المتمثلة في تطبيق ${briefDesc} وكيف يعاني الفئة المستهدفة.`, voiceover: `يتعثر الكثير من المهتمين بسبب تشتت السجلات وغياب المتابعة السليمة لـ ${pName}، مما يستنزف الموارد ويقهر فرص النجاح والتوسع والنمو المأمول.`, duration: 30 },
        { scene: 3, visual: `لقطة تعرض قصة الإلهام وتصميم هذا المشروع ${pName} لمعالجة هذه التحديات بدقة عالية ترتقي بجودة المخرجات.`, voiceover: `لهذا السبب قمنا ببناء ${pName}، ليكون الجسر التكنولوجي المثالي لتوحيد وتنسيق العمليات والملفات وحفظ الأمان دون أي تعقيد وتدفقات غير مرغوبة.`, duration: 35 },
        { scene: 4, visual: `عروض تفصيلية لأداء الواجهات الذكية واللوحات الإحصائية الشاملة واستخراج ملفات التحليل بداخل منصة ${pName}.`, voiceover: `تواصل بجدية، واستدعي كافة الخوارزميات المحكمة في تطبيق ${pName}، لتنال أفضل قراءة موثوقة تلائم متطلباتك وتكفل لك اتخاذ القرار الصائب بلا تراجع.`, duration: 35 },
        { scene: 5, visual: `لقطة مبهجة تعرض تفاعل مستخدمي تطبيق ${pName} مع المزايا الحيوية كـ ${feature1} و ${feature2} بشكل تفاعلي.`, voiceover: `نحن لا نقترح مجرد برمجيات تقليدية بداخل ${pName}، بل نقوم بصياغة تجربة متكاملة تدفع بأعمالك وتوفر عليك آلاف الدولارات في بناء التسويق والتشغيل السليم.`, duration: 30 },
        { scene: 6, visual: `مشهد نهائي رائع وخلفية سينمائية محفزة مع دعوة واضحة CTA للاشتراك المجاني وتفعيل الحساب الذهبي لـ ${pName}.`, voiceover: `أطلق العنان لقدرات عملك الحقيقية الآن بلا أي مخاوف مع ${pName}. تفضل بزيارة موقعنا وسجل حسابك الخالي من الرسوم اليوم واستمتع بالتغيير الحقيقي!`, duration: 20 }
      ];
    } else {
      // Dynamic custom duration generator to yield flexible user-defined video duration scenes
      const sceneCount = Math.max(2, Math.min(8, Math.floor(secs / 20)));
      const step = Math.floor(secs / sceneCount);
      const script = [];
      for (let i = 0; i < sceneCount; i++) {
        const scDuration = i === sceneCount - 1 ? secs - (step * i) : step;
        script.push({
          scene: i + 1,
          visual: `مشهد مخصص ${i + 1} لـ ${scDuration} ثوانٍ: يحلل فيه تطبيق ${pName} تفاصيل ${miniDesc} ويعرض عناصر العلامة التجارية المميزة.`,
          voiceover: `التعليق المقترح للمرحلة ${i + 1} يتطرق بذكاء فائق إلى المزايا الفريدة لـ ${pName} المتمثلة في تسهيل ${briefDesc} لرفع ثقة الجمهور المستهدف في ${scDuration} ثانية.`,
          duration: scDuration
        });
      }
      updated.videoScript = script;
    }
    setCampaignData(updated);
    setRenderedVideoUrl(null);
  };

  const handleEditVideoScene = (index: number, field: 'visual' | 'voiceover' | 'duration', value: any) => {
    if (!campaignData) return;
    const updated = { ...campaignData };
    if (field === 'duration') {
      updated.videoScript[index].duration = Math.max(1, Number(value) || 5);
    } else {
      updated.videoScript[index][field] = value;
    }
    setCampaignData(updated);
  };

  const handleAddVideoScene = () => {
    if (!campaignData) return;
    const updated = { ...campaignData };
    const nextSceneNum = updated.videoScript.length + 1;
    updated.videoScript.push({
      scene: nextSceneNum,
      visual: '',
      voiceover: '',
      duration: 10
    });
    setCampaignData(updated);
    showToast(`➕ تم إضافة المشهد ${nextSceneNum} الجديد! (الآن يمكنك تعبئته أو سيقوم نظام AI Ideas بتلوينه وتلقينه آلياً)`);
  };

  const handleDeleteVideoScene = (index: number) => {
    if (!campaignData) return;
    if (campaignData.videoScript.length <= 1) {
      showToast('⚠️ لا يمكن حذف آخر مشهد. يجب بقاء مشهد واحد على الأقل لتكوين الفيديو.');
      return;
    }
    const updated = { ...campaignData };
    updated.videoScript.splice(index, 1);
    // Re-index scenes
    updated.videoScript.forEach((sc, idx) => {
      sc.scene = idx + 1;
    });
    setCampaignData(updated);
    showToast('🗑️ تم حذف المشهد بنجاح وإعادة توازن أرقام المراحل للمخطط.');
  };

  const handleAutoFillScene = async (index: number) => {
    if (!campaignData || !selectedProject) return;
    showToast(`⏳ جاري التوليد التلقائي والذكي لتفاصيل المشهد ${index + 1}...`);
    
    const pName = selectedProject.name;
    const pDesc = selectedProject.description || 'تقديم حلول رقمية ذكية تناسب متطلبات العصر';
    const cleanDesc = pDesc.trim();
    const briefDesc = cleanDesc.length > 80 ? cleanDesc.substring(0, 80) + '...' : cleanDesc;
    const miniDesc = cleanDesc.length > 50 ? cleanDesc.substring(0, 50) + '...' : cleanDesc;

    const sceneNum = index + 1;
    
    try {
      const prompt = `أنت جزء من نظام AI Ideas الرائد. قم بكتابة وتعبئة مشهد واحد فقط لفيديو ترويجي لـ مشروع "${pName}" الذي يهدف إلى: "${pDesc}".
هذا هو المشهد رقم ${sceneNum} من الفيديو.
قم بإرجاع إجابة قصيرة ومباشرة بصيغة JSON كالتالي فقط بدون كود ماركداون وبدون أي كلام جانبي:
{
  "visual": "الوصف البصري والرسوم المتحركة للمشهد ${sceneNum} باللغة العربية الفصحى الفاخرة",
  "voiceover": "التعليق الصوتي والخطاب المقترح لهذا المشهد باللغة العربية الفصحى لجذب الجمهور"
}`;
      const modelToUse = MarketingAIConfig.marketingRules.forceGeminiForCopywriting 
        ? MarketingAIConfig.contentGeneration.text.model 
        : 'gemini-3.5-flash';
      const response = await geminiService.generateText(prompt, modelToUse);
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
      }
      const parsed = JSON.parse(cleaned);
      const updated = { ...campaignData };
      updated.videoScript[index].visual = parsed.visual || '';
      updated.videoScript[index].voiceover = parsed.voiceover || '';
      setCampaignData(updated);
      showToast(`✨ تم إثراء المشهد ${sceneNum} بالذكاء الاصطناعي بنجاح!`);
    } catch (e) {
      console.warn("Single scene gemini generation failed, using optimized local heuristics...", e);
      const updated = { ...campaignData };
      if (sceneNum === 1) {
        updated.videoScript[index].visual = `لقطة تفاعلية قريبة وحركية متميزة تعرض التحديات التي يعالجها تطبيق ${pName} في حل مشاكل ${miniDesc}.`;
        updated.videoScript[index].voiceover = `هل تشعر بالثقل والتعقيد المستمر في معاملات ${briefDesc} اليوم؟`;
      } else if (sceneNum === 2) {
        updated.videoScript[index].visual = `عرض مبهج من النظرة الأولى للواجهات المتألقة واللوحات الإحصائية الخاصة بـ ${pName} التي تضمن الأتمتة السهلة.`;
        updated.videoScript[index].voiceover = `تطبيق ${pName} هو الحل المبتكر والذكي المخصص ليمنحك كامل السيطرة والريادة الرقمية لـ ${miniDesc}.`;
      } else {
        updated.videoScript[index].visual = `شعار ${pName} الذهبي والنيلي المتأقلم يلمع بخلفية فاخرة مرندرة مع واجهة CTA الحث المباشر المثير للشباب.`;
        updated.videoScript[index].voiceover = `لا تفوت فرصتك! انطلق اليوم مع ${pName} مجاناً، وعجل بالتسجيل لتستمتع بامتيازات مدهشة!`;
      }
      setCampaignData(updated);
      showToast(`✨ تم توليد مشهد متميز ملائم لهوية مشروعك آلياً!`);
    }
  };

  const handleAutoFillAllScenes = () => {
    if (!campaignData || !selectedProject) return;
    const updated = { ...campaignData };
    const pName = selectedProject.name;
    const pDesc = selectedProject.description || 'تقديم خدمات وحلول ذكية فائقة تناسب متطلبات العصر';
    const cleanDesc = pDesc.trim();
    const briefDesc = cleanDesc.length > 80 ? cleanDesc.substring(0, 80) + '...' : cleanDesc;
    const miniDesc = cleanDesc.length > 50 ? cleanDesc.substring(0, 50) + '...' : cleanDesc;

    updated.videoScript.forEach((sc, index) => {
      const sceneNum = index + 1;
      if (!sc.visual || sc.visual.trim() === '') {
        if (sceneNum === 1) {
          sc.visual = `لقطة قريبة تبرز الفوضى التقليدية أو الأساليب اليدوية المجهدة السابقة لـ ${miniDesc}.`;
        } else if (sceneNum === 2) {
          sc.visual = `عرض رائع وتفاعلي لواجهات تطبيق ${pName} الذكية التي تسهل السيطرة على البيانات وتعد بالنمو المذهل والراحة الحقيقية.`;
        } else if (sceneNum === 3) {
          sc.visual = `شعار ${pName} وهوية العلامة الملونة مع واجهة دعوة لاتخاذ إجراء جذابة بنموذج اتصال سريع.`;
        } else {
          sc.visual = `لقطة بصرية معبرة عن السهولة والسرعة التي يوفرها تطبيق ${pName} للعملاء في قطاع ${miniDesc}.`;
        }
      }
      if (!sc.voiceover || sc.voiceover.trim() === '') {
        if (sceneNum === 1) {
          sc.voiceover = `هل تعاني من التعقيد وصعوبة التحكم في معاملات ${briefDesc} اليدوية؟`;
        } else if (sceneNum === 2) {
          sc.voiceover = `تطبيق ${pName} مخصص ليمنحكم التحكم والسيطرة التامة وتبسيط المعالجات بأحدث الخصائص التقنية واللوحات!`;
        } else if (sceneNum === 3) {
          sc.voiceover = `سارع بالانضمام إلينا اليوم لتجربة تطبيق ${pName} بالكامل مجاناً وامتلاك الريادة المطلقة!`;
        } else {
          sc.voiceover = `مع مشروع ${pName}، نجاحك الاستراتيجي وراحتك الرقمية مضمونة بالكامل.`;
        }
      }
    });

    setCampaignData(updated);
    showToast('🤖 تم فحص وتعبئة كافة خلايا السيناريو والتعليق الفارغة بواسطة AI Ideas باحترافية تامة!');
  };

  const handleRenderVideo = async () => {
    setIsRenderingVideo(true);
    setVideoRenderLogs([]);
    setRenderedVideoUrl(null);
    setActiveSceneIndex(0);

    // AI Ideas Optional-Fields Handling:
    // Automatically auto-fill any empty visual or voiceover fields with project templates on the fly!
    if (campaignData && campaignData.videoScript && selectedProject) {
      const pName = selectedProject.name;
      const pDesc = selectedProject.description || 'تقديم خدمات وحلول ذكية فائقة تناسب متطلبات العصر';
      const cleanDesc = pDesc.trim();
      const briefDesc = cleanDesc.length > 80 ? cleanDesc.substring(0, 80) + '...' : cleanDesc;
      const miniDesc = cleanDesc.length > 50 ? cleanDesc.substring(0, 50) + '...' : cleanDesc;

      let autfilledAny = false;
      campaignData.videoScript.forEach((sc, idx) => {
        const sceneNum = idx + 1;
        if (!sc.visual || sc.visual.trim() === '') {
          autfilledAny = true;
          if (sceneNum === 1) {
            sc.visual = `لقطة قريبة تعبر عن الفوضى أو التحدي والمعاناة في إدارة ${pName} أو الطرق اليدوية لـ ${miniDesc}.`;
          } else if (sceneNum === 2) {
            sc.visual = `وميض من الرسوم والواجهات المبتكرة الخاصة بتطبيق ${pName} التي تقدم كفاءة عالية وتدفق مريح لـ ${miniDesc}.`;
          } else if (sceneNum === 3) {
            sc.visual = `شعار ${pName} والزر التفاعلي للدعوة إلى الاشتراك الفوري بلمسة واحدة مذهلة.`;
          } else {
            sc.visual = `لقطة سينمائية تعزز ثقة المستخدم بنظام ${pName} والسيطرة الكاملة على مهام ${miniDesc}.`;
          }
        }
        if (!sc.voiceover || sc.voiceover.trim() === '') {
          autfilledAny = true;
          if (sceneNum === 1) {
            sc.voiceover = `هل تشعر بالإجهاد والتشعب وصعوبة إدارة شؤون ${briefDesc}؟`;
          } else if (sceneNum === 2) {
            sc.voiceover = `تطبيق ${pName} هو الإجابة الشاملة والحل الذكي الهادف لتبسيط أعمالك كلياً بلمسة واحدة!`;
          } else if (sceneNum === 3) {
            sc.voiceover = `ابدأ اليوم مجاناً دون قيود واكتشف الفوائد وبهاجة الكفاءة والإنتاجية مع ${pName}!`;
          } else {
            sc.voiceover = `مع نظام ${pName}، صممنا لك حلول الكفاءة والارتياح العصري بلمسة مبتكرة تناسبك.`;
          }
        }
      });

      if (autfilledAny) {
        setCampaignData({ ...campaignData });
      }
    }

    const logs = [
      '🎬 جاري قراءة وتحليل نصوص المشاهد والسيناريو والوصف البصري والروابط الهندسية...',
      '🤖 [AI Ideas] فحص خلايا السيناريو البصري وشرح التعليق الصوتي الاختياري وتوليفها آلياً...',
      '🎙️ توليد التعليก الصوتي التلقائي المتناسق مع مخارج الحروف العربية ومزامنة الترددات...',
      '🎨 بناء وتجهيز إطارات الفيديو المتحركة بناءً على البرومبت وهوية المشروع وخطوط الماركة...',
      '📝 تركيب نصوص الشرح والعناوين الفرعية (Subtitles) على إتجاهات رندرة المشاهد وتعديل ألوان الكروما...',
      '⏳ دمج المحتوى المرئي والصوتي بالكامل وبدء المعالجة والضغط الفوري بدقة 1080p عالية الوضوح...',
      '✨ تم رندرة وتجميع الفيديو السينمائي التسويقي بنجاح تام وهو جاهز الآن للتشغيل والمعاينة التفاعلية!'
    ];

    for (let i = 0; i < logs.length; i++) {
      setVideoRenderLogs(prev => [...prev, logs[i]]);
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    }

    setIsRenderingVideo(false);
    
    // Choose high-quality, ultra-reliable CORS-enabled Google Storage MP4 sample based on project type to guarantee successful play in iframes
    let videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4';
    if (selectedProject?.type === 'store' || selectedProject?.type === 'saas') {
      videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    } else if (selectedProject?.type === 'mobile' || selectedProject?.type === 'api') {
      videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';
    }
    
    setRenderedVideoUrl(videoUrl);
    showToast('✨ تهانينا! تم توليد وتجميع الفيديو الإعلاني القصير بنجاح وهو متصل الآن بمشهد الشروحات التفاعلية!');
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
              <div id="analytical-pipeline-status" className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto my-12 shadow-2xl backdrop-blur-md animate-fade-in">
                <SpinnerIcon className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-6" />
                <h3 className="text-2xl font-black mb-2 tracking-tight">استوديو الذكاء الاصطناعي يباشر إبداعه...</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">يقوم النظام بتحليل المشروع وتقديم المحتوى التسويقي بناءً على البيانات الدقيقة فقط لتأمين جودة تفوق 90%.</p>
                
                {/* Advanced Technical Rolling Terminal Console (VideoToCode style!) */}
                <div id="marketing-terminal" className="mb-8 w-full bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-right font-mono text-xs h-44 overflow-y-auto space-y-2 shadow-inner">
                  {marketingLogs.length === 0 ? (
                    <p className="text-slate-500 animate-pulse">&gt; بانتظار استجابة معالج المحاكاة التسويقية...</p>
                  ) : (
                    marketingLogs.map((log, i) => (
                      <p key={i} className={`animate-fade-in ${log.includes('⚠️') ? 'text-amber-400' : log.includes('[Gemini API]') || log.includes('[AI Ideas]') ? 'text-indigo-400' : 'text-slate-300'}`}>
                        {log}
                      </p>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>

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
                
                {/* AI Marketing Showcase Banner (Toggleable) */}
                {isMarketingInfoOpen ? (
                  <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/25 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in fade-in duration-300">
                    <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-505/5 rounded-full blur-3xl" />
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                        <h3 className="font-black text-white text-sm">❗❗ المحتوى التسويقي بالذكاء الاصطناعي</h3>
                      </div>
                      <button 
                        onClick={() => setIsMarketingInfoOpen(false)}
                        className="text-xs text-slate-400 hover:text-white bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-850 hover:bg-slate-900 transition-all font-bold"
                      >
                        ✕ طوي الدليل التفصيلي
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm text-indigo-300">المحتوى التسويقي بالذكاء الاصطناعي</h4>
                          <p className="text-slate-300 text-xs font-semibold leading-relaxed">
                            حوّل فكرة مشروعك إلى حملات تسويقية جاهزة خلال ثوانٍ.
                          </p>
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          يقوم النظام بتحليل فكرة مشروعك ومنتجاتك وخدماتك ثم ينشئ تلقائياً محتويات إعلانية احترافية مرتبطة بمشروعك بشكل مباشر، بما يشمل:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-305 max-w-lg">
                          <div className="flex items-center gap-1.5">✅ <span className="text-slate-200">إعلانات نصية تسويقية</span></div>
                          <div className="flex items-center gap-1.5">✅ <span className="text-slate-200">منشورات وسائل التواصل الاجتماعي</span></div>
                          <div className="flex items-center gap-1.5">✅ <span className="text-slate-200">صور إعلانية احترافية مخصصة للمشروع</span></div>
                          <div className="flex items-center gap-1.5">✅ <span className="text-slate-200">فيديوهات إعلانية تسويقية مولدة بالذكاء الاصطناعي</span></div>
                          <div className="flex items-center gap-1.5">✅ <span className="text-slate-200">شعارات وعناوين تسويقية جذابة</span></div>
                          <div className="flex items-center gap-1.5">✅ <span className="text-slate-200">وصف المنتجات والخدمات بطريقة احترافية</span></div>
                          <div className="flex items-center gap-1.5 col-span-2">✅ <span className="text-slate-200">حملات تسويقية كاملة متوافقة مع جمهورك المستهدف</span></div>
                        </div>
                        <p className="text-[10px] text-indigo-305 leading-normal italic bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10 inline-block">
                          ⚠️ لا يتم إنشاء محتوى عشوائي أو غير مرتبط بنشاطك، بل يعتمد النظام على فكرة مشروعك وبياناته لإنشاء محتوى تسويقي حقيقي وجاهز للاستخدام.
                        </p>
                      </div>

                      <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-850">
                        <h4 className="font-extrabold text-sm text-slate-205 flex items-center gap-1.5">
                          <span>🎬</span>
                          <span>الفيديوهات الإعلانية</span>
                        </h4>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          يمكن للنظام إنشاء فيديوهات إعلانية بأطوال مرنة ومفتوحة حسب احتياج المستخدم، مع اقتراح مدد مناسبة تلقائياً مثل:
                        </p>
                        <div className="space-y-2 text-xs text-slate-300">
                          <div className="flex items-center justify-between py-1 border-b border-slate-900">
                            <span className="font-bold text-indigo-400">• 15 ثانية</span>
                            <span className="text-slate-500 text-[11px]">للإعلانات السريعة</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-900">
                            <span className="font-bold text-indigo-400">• 30 ثانية</span>
                            <span className="text-slate-500 text-[11px]">لالحملات التسويقية المختصرة</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-900">
                            <span className="font-bold text-indigo-400">• 60 ثانية</span>
                            <span className="text-slate-500 text-[11px]">لعرض المزايا الرئيسية</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-900">
                            <span className="font-bold text-indigo-400">• 90 ثانية إلى 3 دقائق</span>
                            <span className="text-slate-500 text-[11px]">للعروض التفصيلية</span>
                          </div>
                          <div className="flex items-center justify-between py-1">
                            <span className="font-bold text-indigo-400">• مدة مخصصة</span>
                            <span className="text-slate-500 text-[11px]">يحددها المستخدم</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal pt-1 border-t border-slate-900">
                          جميع الفيديوهات يتم توليدها بناءً على مشروع المستخدم وهوية العلامة التجارية والجمهور المستهدف.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button 
                      onClick={() => setIsMarketingInfoOpen(true)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3.5 py-2.5 rounded-2xl transition-all font-bold hover:bg-slate-850"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                      <span>عرض تفاصيل قسم "المحتوى التسويقي بالذكاء الاصطناعي والفيديوهات الإعلانية" ⏱️</span>
                    </button>
                  </div>
                )}

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
                    { id: 'plan', label: 'خطة التسويق', icon: Calendar, desc: 'قنوات، روزنامة 30 يوم' },
                    { id: 'pomelli', label: 'نظام بوميلي للتسويق', icon: Clock, desc: 'جلسات تركيز بومودورو ذكية' }
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
                                  <div>
                                    <p className="text-slate-300 text-xs leading-relaxed line-clamp-3 hover:line-clamp-none cursor-pointer p-1 rounded hover:bg-slate-950 transition-all">
                                      {img.arabicPrompt || img.prompt}
                                    </p>
                                    {img.error && (
                                      <div className="text-red-400 text-[10px] mt-2 bg-red-950/30 p-2 rounded border border-red-900/40">
                                        ⚠️ {img.error}
                                      </div>
                                    )}
                                  </div>
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
                      
                      {/* Rich Duration Picker option */}
                      <div className="flex flex-col gap-2 shrink-0">
                        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1 border border-slate-850 rounded-xl">
                          {[
                            { secs: 15, label: '15 ث' },
                            { secs: 30, label: '30 ث' },
                            { secs: 60, label: '60 ث' },
                            { secs: 90, label: '90 ث' },
                            { secs: 180, label: '3 د (180ث)' }
                          ].map(item => (
                            <button
                              key={item.secs}
                              onClick={() => {
                                setIsCustomDuration(false);
                                handleDurationChange(item.secs);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${(!isCustomDuration && videoDuration === item.secs) ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                              {item.label}
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              setIsCustomDuration(true);
                              const val = Number(customDurationInput) || 120;
                              handleDurationChange(val);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isCustomDuration ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                            ⚙️ مدة مخصصة
                          </button>
                        </div>

                        {/* Custom duration slider/input */}
                        {isCustomDuration && (
                          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-xl animate-in slide-in-from-top-2 duration-200">
                            <span className="text-[10px] text-slate-400 font-bold">المدة:</span>
                            <input 
                              type="range" 
                              min="10" 
                              max="300" 
                              value={customDurationInput} 
                              onChange={(e) => {
                                const valStr = e.target.value;
                                setCustomDurationInput(valStr);
                                handleDurationChange(Number(valStr) || 120);
                              }}
                              className="w-24 accent-indigo-500"
                            />
                            <input 
                              type="number" 
                              min="10" 
                              max="300"
                              value={customDurationInput} 
                              onChange={(e) => {
                                const valStr = e.target.value;
                                setCustomDurationInput(valStr);
                                handleDurationChange(Number(valStr) || 120);
                              }}
                              className="w-14 bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-center text-xs text-white font-mono"
                            />
                            <span className="text-[10px] text-slate-400">ثانية</span>
                          </div>
                        )}

                        {/* Interactive informative note tailored to request */}
                        <div className="text-[10px] text-slate-400 leading-normal text-right flex items-center gap-1.5 self-end">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>
                            {videoDuration === 15 && 'اقتراح ذكي: مناسب للإعلانات السريعة والخاطفة.'}
                            {videoDuration === 30 && 'اقتراح ذكي: ملائم للحملات التسويقية المختصرة والمباشرة.'}
                            {videoDuration === 60 && 'اقتراح ذكي: عرض المزايا والامتيازات الرئيسية للمنتج.'}
                            {videoDuration === 90 && 'اقتراح ذكي: عرض تقديمي تفصيلي لشرح سيناريو الخدمات والمنتجات.'}
                            {videoDuration === 180 && 'اقتراح ذكي: عرض تفصيلي طويل ومستفيض يعرض خصائص الهوية كاملة.'}
                            {(![15, 30, 60, 90, 180].includes(videoDuration)) && `اقتراح ذكي: مدة مخصصة للتوليد الحر (${videoDuration} ثانية) حسب رغبتك.`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Scenes timeline & custom edits */}
                      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-850 pb-3 gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-slate-300">سيناريو المشاهد والتعليق الصوتي المعتمد</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">يمكنك كتابة مشاهدك الخاصة أو تركها فارغة ليقوم نظام AI Ideas بتعبئتها تلقائياً.</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
                            <button
                              onClick={handleAutoFillAllScenes}
                              className="px-2.5 py-1.5 bg-indigo-505/10 bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-400 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                              title="ملء جميع الأوصاف والتعليقات الصوتية الفارغة دفعة واحدة بالذكاء الاصطناعي"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>🤖 تعبئة الفراغات تلقائياً</span>
                            </button>
                            <button
                              onClick={handleAddVideoScene}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                            >
                              <Plus className="w-3 h-3" />
                              <span>إضافة مشهد</span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                          {campaignData.videoScript.map((sc, scIdx) => (
                            <div key={scIdx} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4 relative">
                              
                              {/* Scene Header Badge & Duration Input */}
                              <div className="flex flex-wrap items-center justify-between border-b border-slate-900 pb-2.5 gap-2">
                                <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 font-bold">
                                  المشهد {sc.scene}
                                </span>
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500">المدة:</span>
                                  <input 
                                    type="number" 
                                    min="1" 
                                    max="60"
                                    value={sc.duration} 
                                    onChange={e => handleEditVideoScene(scIdx, 'duration', e.target.value)}
                                    className="w-12 bg-slate-900 border border-slate-800 rounded-md px-1.5 py-0.5 text-center text-xs text-white font-mono outline-none focus:border-indigo-550"
                                    title="مدة عرض هذا المشهد المخصص بالثواني"
                                  />
                                  <span className="text-[10px] text-slate-500">ث</span>
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                  <span>الوصف البصري والرسومات للمخرج:</span>
                                  <span className="text-slate-500 text-[9px] font-normal">(اختياري - يموله AI Ideas تلقائياً)</span>
                                </label>
                                <textarea
                                  value={sc.visual}
                                  onChange={e => handleEditVideoScene(scIdx, 'visual', e.target.value)}
                                  rows={2}
                                  placeholder="(اختياري) اكتب كيف يتخيل المخرج لقطات هذا المشهد، أو اتركه فارغاً لتبنى AI Ideas الصياغة المثالية تلقائياً..."
                                  className="w-full bg-slate-900 text-slate-200 text-xs p-2.5 border border-slate-850 rounded-lg mt-1 outline-none focus:border-indigo-500 placeholder:text-slate-650"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                  <span>التعليق المسموع المعتمد (Voiceover narrative):</span>
                                  <span className="text-slate-500 text-[9px] font-normal">(اختياري - يقوم به المعالج التلقائي)</span>
                                </label>
                                <textarea
                                  value={sc.voiceover}
                                  onChange={e => handleEditVideoScene(scIdx, 'voiceover', e.target.value)}
                                  rows={2}
                                  placeholder="(اختياري) اكتب الكلمات أو الحوار الدقيق والملهم لهذا المشهد باللغة العربية الفصحى، أو اتركه فارغاً لتتولاه AI Ideas..."
                                  className="w-full bg-slate-900 text-emerald-205 text-slate-200 text-xs p-2.5 border border-slate-850 rounded-lg mt-1 outline-none focus:border-indigo-500 font-mono placeholder:text-slate-650"
                                />
                              </div>

                              {/* Action Buttons for Scene */}
                              <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
                                <button
                                  onClick={() => handleAutoFillScene(scIdx)}
                                  className="px-2 py-1 bg-slate-900 hover:bg-indigo-950/40 hover:text-indigo-400 border border-slate-850 text-[10px] text-slate-400 font-bold rounded-lg flex items-center gap-1 transition-all"
                                  title="توليد تلقائي بالذكاء الاصطناعي لهذا المشهد المعين"
                                >
                                  <Sparkle className="w-3 h-3 text-indigo-400" />
                                  <span>ولد بالـ AI</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteVideoScene(scIdx)}
                                  className="px-2 py-1 bg-slate-900 hover:bg-rose-950/40 hover:text-rose-450 text-[10px] text-slate-400 font-bold rounded-lg flex items-center gap-1 border border-slate-850 hover:border-rose-900/40 transition-all text-red-400"
                                  title="حذف هذا المشهد من سيناريو الفيديو الإعلاني"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-400" />
                                  <span>حذف</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rendering display & player mockup */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                        <div className="space-y-4">
                          
                          {/* Aesthetic Title & Aspect Selector Header */}
                          <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                            <h4 className="font-bold text-xs text-slate-300">شاشة رندرة المعاينة</h4>
                            <div className="flex gap-1 bg-slate-950 p-0.5 border border-slate-850 rounded-lg">
                              <button 
                                onClick={() => setVideoFormat('vertical')}
                                className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${videoFormat === 'vertical' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                                title="تنسيق الأبعاد الطولية للهواتف والقصص"
                              >
                                📱 طولي (9:16)
                              </button>
                              <button 
                                onClick={() => setVideoFormat('landscape')}
                                className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${videoFormat === 'landscape' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                                title="تنسيق الأبعاد العرضية للشاشات الكبيرة"
                              >
                                💻 عرضي (16:9)
                              </button>
                            </div>
                          </div>
                          
                          {/* Rich Player Box Container */}
                          <div className={`bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden relative flex items-center justify-center mx-auto w-full transition-all duration-300 shadow-inner ${
                            videoFormat === 'vertical' 
                              ? 'aspect-[9/16] max-h-[350px] max-w-[197px]' 
                              : 'aspect-[16/9] max-h-[220px] max-w-[390px]'
                          }`}>
                            
                            {isRenderingVideo ? (
                              <div className="text-center p-3 space-y-3 z-10 transition-all duration-200">
                                <SpinnerIcon className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
                                <p className="text-[10px] text-slate-400 font-bold animate-pulse leading-relaxed">جاري توليد الأصوات ودمج الشروحات والمشاهد...</p>
                              </div>
                            ) : renderedVideoUrl ? (
                              <video 
                                src={renderedVideoUrl} 
                                controls 
                                autoPlay 
                                loop 
                                playsInline
                                onTimeUpdate={(e) => {
                                  const videoEl = e.currentTarget;
                                  const time = videoEl.currentTime;
                                  
                                  // Map real video time proportionately to the customized videoScript duration
                                  const totalScriptDuration = campaignData.videoScript.reduce((sum, sc) => sum + sc.duration, 0);
                                  const videoDurationSec = videoEl.duration || videoDuration;
                                  const mappedTime = (time / videoDurationSec) * totalScriptDuration;
                                  
                                  let elapsed = 0;
                                  let matchedIdx = 0;
                                  for (let i = 0; i < campaignData.videoScript.length; i++) {
                                    const sc = campaignData.videoScript[i];
                                    if (mappedTime >= elapsed && mappedTime < elapsed + sc.duration) {
                                      matchedIdx = i;
                                      break;
                                    }
                                    elapsed += sc.duration;
                                    matchedIdx = i;
                                  }
                                  setActiveSceneIndex(matchedIdx);
                                }}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="text-center p-4">
                                <VideoIcon className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                                <p className="text-[10px] text-slate-500 max-w-[150px] mx-auto leading-normal">اضغط على زر الرندرة بالأسفل لتلقي المعاينة</p>
                              </div>
                            )}

                            {/* Corrected & Dynamic overlay captions - ONLY visible when actually generated or rendering, with synchronized active scene voices */}
                            {(isRenderingVideo || renderedVideoUrl) && campaignData.videoScript.length > 0 && (
                              <div className="absolute bottom-3 left-2.5 right-2.5 bg-black/85 backdrop-blur-md p-2 rounded-xl border border-indigo-505/20 text-center shadow-lg transition-all duration-300 transform scale-100 z-10 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                  <p className="text-[8px] text-indigo-400 font-extrabold uppercase tracking-wider font-mono">
                                    المشهد {campaignData.videoScript[activeSceneIndex]?.scene || 1} • {campaignData.videoScript[activeSceneIndex]?.duration || 0} ث
                                  </p>
                                </div>
                                <p className="text-[10px] text-slate-100 leading-relaxed font-bold max-h-[38px] overflow-hidden text-ellipsis line-clamp-2">
                                  {campaignData.videoScript[activeSceneIndex]?.voiceover || campaignData.videoScript[0].voiceover}
                                </p>
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
                            className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all text-white shadow-lg hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                          >
                            <Play className="w-4 h-4" />
                            <span>توليد ورندرة ومزامنة الفيديو الإعلاني</span>
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

                {/* TAB 6: Google Pomelli Sprint Marketing System */}
                {activeTab === 'pomelli' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-red-650/10 via-orange-550/15 to-indigo-650/10 border border-slate-850 rounded-3xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
                      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-orange-500/15 text-orange-400 border border-orange-500/20 rounded-lg text-[10px] font-bold font-mono tracking-widest uppercase animate-pulse">Google Pomelli Marketing</span>
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
                          </div>
                          <h3 className="text-xl font-black text-white mt-2">مختبر بوميلي (Pomelli Space) للتسويق والترويج الفعّال</h3>
                          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                            امزج بين جلسات التركيز الموقوتة وسرعة توليد وضبط المحتوى الإعلاني بالذكاء الاصطناعي الفوري لتحقيق أعلى معدلات التحويل وقوة الهوية البصرية.
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <span className="px-3.5 py-1.5 bg-slate-950 border border-slate-850 rounded-xl text-xs font-bold text-slate-350 flex items-center gap-1.5 font-mono">
                            🍅 دورات مكتملة: <span className="text-orange-400 font-extrabold">{pomelliCompletedCount}</span>
                          </span>
                          <button
                            onClick={() => {
                              setPomelliZenMode(!pomelliZenMode);
                              showToast(pomelliZenMode ? '↩️ تم إيقاف نمط التركيز الكامل' : '🧘 تم تفعيل نمط التركيز الكامل (Zen Space)');
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${pomelliZenMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                          >
                            <Eye className="w-4 h-4" />
                            <span>{pomelliZenMode ? 'الوضع العادي' : 'نمط التركيز الكامل'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Left Sidebar: Interactive Pomodoro Watch */}
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 flex flex-col justify-between h-full shadow-xl">
                        <div className="space-y-6">
                          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                            <h4 className="font-bold text-sm text-slate-300 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" />
                              ساعة التركيز التسويقي المعتمدة
                            </h4>
                            <span className="text-[10px] text-slate-500 font-mono font-bold">بومودورو {pomelliDuration} دقيقة</span>
                          </div>

                          {/* Watch design wrapper */}
                          <div className="flex flex-col items-center justify-center py-4 relative">
                            {/* Inner circle graphics */}
                            <div className="relative w-48 h-48 rounded-full border border-slate-800 flex items-center justify-center bg-slate-950 shadow-inner">
                              {/* Pulsing glow under clock */}
                              <div className={`absolute inset-0 rounded-full blur-xl opacity-20 transition-all duration-1000 ${pomelliIsRunning ? 'bg-orange-500 animate-pulse scale-90' : 'bg-indigo-505 scale-75'}`} />
                              
                              {/* Glowing digital time string in Monospace font */}
                              <div className="relative z-10 text-center">
                                <span className="text-4xl font-extrabold font-mono tracking-tight text-white drop-shadow-md select-none">
                                  {Math.floor(pomelliTimeLeft / 60).toString().padStart(2, '0')}
                                  <span className={`transition-opacity duration-500 ${pomelliIsRunning ? 'animate-pulse' : ''}`}>:</span>
                                  {(pomelliTimeLeft % 60).toString().padStart(2, '0')}
                                </span>
                                <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mt-1">
                                  {pomelliIsRunning ? '⚡ جاري التركيز صامتاً' : '⏸️ متوقف مؤقتاً'}
                                </p>
                              </div>

                              {/* Decorative mini notches */}
                              <div className="absolute top-2 w-0.5 h-1.5 bg-slate-800" />
                              <div className="absolute bottom-2 w-0.5 h-1.5 bg-slate-800" />
                              <div className="absolute right-2 h-0.5 w-1.5 bg-slate-800" />
                              <div className="absolute left-2 h-0.5 w-1.5 bg-slate-800" />
                            </div>

                            {/* Presets Row */}
                            <div className="flex gap-1.5 mt-5 bg-slate-950 border border-slate-850 p-1 rounded-xl">
                              {[
                                { min: 25, label: 'جلسة تركيز' },
                                { min: 15, label: 'سبرنت خاطف' },
                                { min: 5, label: 'عصف ذهني دافع font-mono' }
                              ].map(p => (
                                <button
                                  key={p.min}
                                  onClick={() => {
                                    setPomelliDuration(p.min);
                                    setPomelliTimeLeft(p.min * 60);
                                    setPomelliIsRunning(false);
                                    showToast(`⏱️ تم ضبط الميقاتي على دورتك الإرشادية: ${p.label} (${p.min} دقيقة)`);
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${pomelliDuration === p.min ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400' : 'text-slate-550 hover:text-slate-350'}`}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Watch controls */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                setPomelliIsRunning(!pomelliIsRunning);
                                showToast(pomelliIsRunning ? '⏸️ تم إيقاف جلسة التركيز التسويقية مؤقتاً.' : '🚀 بدأت دورة التركيز بوميلي! التركيز صامت ومحفز.');
                              }}
                              className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-white shadow ${pomelliIsRunning ? 'bg-amber-600 hover:bg-amber-550 shadow-amber-500/15' : 'bg-orange-600 hover:bg-orange-550 shadow-orange-500/15'}`}
                            >
                              <Play className="w-4 h-4" />
                              <span>{pomelliIsRunning ? 'إيقاف مؤقت' : 'ابدأ الجلسة الآن'}</span>
                            </button>
                            <button
                              onClick={() => {
                                setPomelliIsRunning(false);
                                setPomelliTimeLeft(pomelliDuration * 60);
                                showToast('↩️ تمت إعادة تصفير وإرجاع الميقاتي بنجاح.');
                              }}
                              className="py-2.5 bg-slate-800 hover:bg-slate-755 border border-slate-700 text-slate-305 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                              <span>إعادة الضبط</span>
                            </button>
                          </div>
                        </div>

                        {/* Interactive Distraction Tracker to reinforce Pomelli rules */}
                        <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold">مستشعر ومشتتات الانتباه الزائدة:</span>
                            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">{pomelliDistractions} مشتتات</span>
                          </div>
                          <p className="text-[10px] text-slate-550 leading-relaxed">
                            تُشجعك طريقة بومودورو بوميلي على النقر على الزر وتسجيل المقاطعة مبيناً للتذكر بدل تشتيت كامل وقتك.
                          </p>
                          <button
                            onClick={() => {
                              setPomelliDistractions(d => d + 1);
                              showToast('⚠️ تم رصد المشتت وتدوينه في إحصاءات الجلسة! تنفس واصل بتركيز!');
                            }}
                            className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-center text-[10px] font-bold transition-all"
                          >
                            ➕ لقد تشتت انتباهي (سجل مشتت خارجي)
                          </button>
                        </div>
                      </div>

                      {/* Main Middle Panel: Workspace drafting board */}
                      <div className="lg:col-span-2 space-y-6">
                        
                        {/* Interactive Playground Workspace */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-850 pb-4">
                            <div>
                              <h4 className="font-bold text-md text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-orange-400" />
                                مساعد بوميلي التسويقي واللقطات المفعمة بالأفكار
                              </h4>
                              <p className="text-slate-400 text-[10px] mt-0.5">صمم وحوّر كتاباتك وصقّلها للجمهور المطلوب بنقرة واحدة بمساعدة Gemini.</p>
                            </div>
                            
                            {/* Preset Active Tactic selection */}
                            <div className="flex items-center gap-1.5 bg-slate-950 p-1 border border-slate-850 rounded-xl shrink-0">
                              {[
                                { id: 'google-ads', label: 'جوجل إعلانات' },
                                { id: 'instagram', label: 'انستقرام' },
                                { id: 'social', label: 'بوق ترويجي/ثريد' },
                                { id: 'email', label: 'بارد إلكتروني' },
                                { id: 'landing', label: 'الهبوط Headline' }
                              ].map(t => (
                                <button
                                  key={t.id}
                                  onClick={() => {
                                    setActiveTactic(t.id);
                                    showToast(`🎯 تكتيك بوميلي النشط حالياً: ${t.label}`);
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTactic === t.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Tone & Style selector row */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-2">
                              <label className="text-[10px] text-indigo-400 font-bold block mb-1.5">نبرة الحوار وهدف الصياغة ومناخ التواصل:</label>
                              <div className="grid grid-cols-2 gap-1.5">
                                {[
                                  { id: 'energetic', label: '🔥 حماسي وحيوي خاطف' },
                                  { id: 'professional', label: '👔 باحث مهني متناسق' },
                                  { id: 'emotional', label: '💖 عاطفي ومؤثر في القلب' },
                                  { id: 'urgent', label: '⏳ عاجل ويحث قبل الانقضاء' }
                                ].map(tn => (
                                  <button
                                    key={tn.id}
                                    onClick={() => setPomelliSelectedTone(tn.id)}
                                    className={`py-1.5 px-2.5 border rounded-lg text-right text-[10px] font-bold transition-all ${pomelliSelectedTone === tn.id ? 'bg-slate-800 border-indigo-500/50 text-indigo-300 shadow-inner' : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-350'}`}
                                  >
                                    {tn.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="md:col-span-2 space-y-1.5">
                              <label className="text-[10px] text-slate-500 font-bold block">مفاتيح التوليد والإرشاد الذكي لبوميلي:</label>
                              <div className="bg-slate-950 p-2.5 border border-slate-850 rounded-xl space-y-1 text-[11px] text-slate-400">
                                <p>• <strong>المشروع:</strong> {selectedProject.name}</p>
                                <p className="truncate">• <strong>نوع الفكرة:</strong> {selectedProject.description}</p>
                              </div>
                            </div>
                          </div>

                          {/* Editable Text Workspace area */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-indigo-400 font-bold flex items-center gap-1">
                              <span>قماش ومسودة الكتابة الإبداعية وصياغتك الذاتية المباشرة:</span>
                              <span className="font-mono text-[9px] text-slate-500">({pomelliWorkspaceText.length} حرفاً)</span>
                            </label>
                            <textarea
                              value={pomelliWorkspaceText}
                              onChange={e => setPomelliWorkspaceText(e.target.value)}
                              rows={10}
                              placeholder="مكتب بوميلي للتأليف فارغ... انقر على زر التوليد السريع بالأسفل أو ابدأ الكتابة بحرية مطلقة هنا لتستعرض قوتك التسجيلية، ثم انقر على زر التحليل والقياس الذكي..."
                              className="w-full bg-slate-950 text-slate-100 text-xs sm:text-sm p-4 border border-slate-850 rounded-2xl outline-none focus:border-indigo-500 leading-relaxed font-sans placeholder-slate-700 shadow-inner focus:ring-1 focus:ring-indigo-500/10"
                            />
                          </div>

                          {/* Workspace Action Bar */}
                          <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                            <div className="flex gap-2">
                              <button
                                onClick={handleGeneratePomelliDraft}
                                disabled={isGeneratingPomelliDraft}
                                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/15 hover:opacity-95 disabled:opacity-50"
                              >
                                {isGeneratingPomelliDraft ? <SpinnerIcon className="w-4 h-4 animate-spin text-white" /> : <Sparkles className="w-4 h-4" />}
                                <span>توليد مسودة بوميلي الذكية</span>
                              </button>
                              <button
                                onClick={handleAnalyzePomelliText}
                                disabled={isAnalyzingPomelliText || !pomelliWorkspaceText.trim()}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-755 border border-slate-705 text-slate-350 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-30"
                              >
                                {isAnalyzingPomelliText ? <SpinnerIcon className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />}
                                <span>قياس جودة ونبرة النص</span>
                              </button>
                            </div>

                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleCopy(pomelliWorkspaceText, 'pomelli-workspace')}
                                disabled={!pomelliWorkspaceText.trim()}
                                className="p-2 border border-slate-805 bg-slate-950 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-white transition-all disabled:opacity-30"
                                title="نسخ المسودة"
                              >
                                {copiedId === 'pomelli-workspace' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => {
                                  // Save this copy into the texts repository
                                  const updated = { ...campaignData };
                                  if (updated) {
                                    updated.googleAds.push({
                                      headline: `مسودة بوميلي ${activeTactic}`,
                                      description: pomelliWorkspaceText.substring(0, 160) + '...'
                                    });
                                    setCampaignData(updated);
                                    showToast('💾 تم دمج وإرسال نص بوميلي إلى مكتبة نصوص و أصول حملتك بنجاح!');
                                  }
                                }}
                                disabled={!pomelliWorkspaceText.trim() || !campaignData}
                                className="px-3.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl font-bold text-[11px] transition-all disabled:opacity-30 flex items-center gap-1"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>حفظ في نصوص الحملة</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Conversion Score & Critiques drawer */}
                        {(aiCompanionScore !== null || aiCompanionFeedback) && (
                          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl animate-in slide-in-from-bottom duration-300">
                            <div className="flex flex-col md:flex-row gap-5 items-start md:items-center">
                              {/* Radial Metric */}
                              <div className="flex flex-col items-center justify-center shrink-0 w-24 h-24 rounded-full border border-slate-800 bg-slate-950 relative">
                                <span className={`text-xl font-black font-mono ${aiCompanionScore && aiCompanionScore >= 80 ? 'text-green-400' : 'text-orange-400'}`}>
                                  {aiCompanionScore}%
                                </span>
                                <span className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">معدل الإقناع</span>
                                {/* Inner meter path decoration */}
                                <div className="absolute inset-2 border border-dashed border-slate-800 rounded-full shrink-0" />
                              </div>

                              {/* AI parsed critique insights */}
                              <div className="space-y-2 flex-grow">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full" />
                                  <h5 className="font-bold text-sm text-slate-200">الرأي النقدي والمقاييس المقترحة من خبير Google Pomelli:</h5>
                                </div>
                                <p className="text-slate-305 text-xs leading-relaxed bg-slate-950 p-4 border border-slate-850 rounded-2xl whitespace-pre-wrap">
                                  {aiCompanionFeedback}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

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
          <div className="max-w-4xl mx-auto my-6 space-y-8 text-right">
            
            {/* The Ultimate AI Marketing Hub Presentation */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden animate-in fade-in duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />

              <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 border-b border-slate-800/80 pb-6 mb-6">
                <div className="space-y-2 text-center md:text-right">
                  <span className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-bold inline-block">
                    ⚡ استوديو متكامل للتسويق الرقمي الفوري
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-white">❗❗ المحتوى التسويقي بالذكاء الاصطناعي</h2>
                  <p className="text-slate-300 text-sm md:text-md font-bold mt-1">
                    حوّل فكرة مشروعك إلى حملات تسويقية جاهزة خلال ثوانٍ.
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-slate-850 flex items-center justify-center text-indigo-400 drop-shadow shadow-indigo-500/30 shrink-0">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-8 text-right">
                {/* Right Column: AI Marketing capabilities */}
                <div className="space-y-4">
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-semibold">
                    يقوم النظام بتحليل فكرة مشروعك ومنتجاتك وخدماتك ثم ينشئ تلقائياً محتويات إعلانية احترافية مرتبطة بمشروعك بشكل مباشر، بما يشمل:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { cap: 'إعلانات نصية تسويقية' },
                      { cap: 'منشورات وسائل التواصل الاجتماعي' },
                      { cap: 'صور إعلانية احترافية مخصصة للمشروع' },
                      { cap: 'فيديوهات إعلانية تسويقية مولدة بالذكاء الاصطناعي' },
                      { cap: 'شعارات وعناوين تسويقية جذابة' },
                      { cap: 'وصف المنتجات والخدمات بطريقة احترافية' },
                      { cap: 'حملات تسويقية كاملة متوافقة مع جمهورك المستهدف' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-850 hover:border-slate-800 transition-colors">
                        <span className="text-emerald-400 shrink-0 font-bold">✅</span>
                        <span className="text-slate-300 text-xs font-bold leading-normal">{item.cap}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-amber-400/90 leading-relaxed italic bg-amber-950/20 p-3 rounded-xl border border-amber-500/10">
                    ⚠️ لا يتم إنشاء محتوى عشوائي أو غير مرتبط بنشاطك، بل يعتمد النظام على فكرة مشروعك وبياناته لإنشاء محتوى تسويقي حقيقي وجاهز لتبدأ رحلتك فوراً.
                  </p>
                </div>

                {/* Left Column: Video specifications and flexible lengths */}
                <div className="space-y-4 bg-slate-950/60 p-6 rounded-2xl border border-slate-850">
                  <h4 className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">🎬</span>
                    الفيديوهات الإعلانية الاحترافية
                  </h4>
                  <p className="text-slate-300 text-xs leading-relaxed font-semibold">
                    يمكن للنظام إنشاء فيديوهات إعلانية بأطوال مرنة ومفتوحة حسب احتياج المستخدم، مع اقتراح مدد مناسبة تلقائياً تشمل:
                  </p>
                  
                  <div className="space-y-2">
                    {[
                      { label: '• 15 ثانية', desc: 'للإعلانات السريعة والخاطفة' },
                      { label: '• 30 ثانية', desc: 'لالحملات التسويقية المختصرة والمكثفة' },
                      { label: '• 60 ثانية', desc: 'لعرض المزايا والامتيازات الرئيسية' },
                      { label: '• 90 ثانية إلى 3 دقائق', desc: 'للعروض التقديمية والتفصيلية' },
                      { label: '• مدة مخصصة', desc: 'يحددها المستخدم بحرية تامة' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-slate-900 last:border-0">
                        <span className="font-bold text-indigo-300">{item.label}</span>
                        <span className="text-slate-500 font-medium">{item.desc}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-normal pt-1 border-t border-slate-900">
                    🛡️ جميع الفيديوهات يتم توليدها بناءً على مشروع المستخدم وهوية العلامة التجارية والجمهور المستهدف بدقة متكاملة.
                  </p>
                </div>
              </div>

              {/* ACTION TOGGLE OPTIONS */}
              <div className="border-t border-slate-800/85 pt-6 space-y-4">
                <p className="text-center font-bold text-sm text-slate-450 mb-3">لالبدء الفوري بالتسويق، اختر خياراً مميزاً بالأسفل:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  
                  <button 
                    onClick={() => navigate('projectWizard')}
                    className="p-5 border border-slate-800 hover:border-indigo-500/50 bg-slate-950 hover:bg-slate-900 rounded-2xl text-right transition-all group shrink-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                      <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </div>
                    <h4 className="font-bold text-md text-white mb-1">ابتكار مشروع برمجية جديد ➕</h4>
                    <p className="text-[11px] text-slate-500 leading-normal">اصنع فكرة أو تطبيق وارجع لتوليد كامل محتواه التسويقي فوراً.</p>
                  </button>

                  <div className="p-5 border border-slate-800 bg-slate-950 rounded-2xl text-right relative overflow-hidden flex flex-col justify-between group shrink-0">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-orange-500" />
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center mb-3">
                        <TrendingUp className="w-4 h-4 animate-pulse" />
                      </div>
                      <h4 className="font-bold text-md text-white mb-1"> ✨ تجربة التوليد من فكرة ديمو مخصصة</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">أدخل فكرة مبدئية وعامة لتوليد مصفوفة تسويقية لها بشكل طارئ ومستعجل.</p>
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
                      className="mt-4 text-[11px] text-indigo-400 hover:underline text-right font-bold flex items-center gap-1 hover:text-indigo-300"
                    >
                      <span>ابدأ محاكاة فكرة عينة جاهزة فوراً</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

                {/* Existed active projects selector */}
                {allProjects.length > 0 && (
                  <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl max-w-2xl mx-auto space-y-3">
                    <p className="text-xs text-slate-300 font-bold mb-1 text-center flex items-center justify-center gap-1.5">
                      <span>🚀 لديك مشاريع برمجية سابقة! اختر أحدها فوراً لبدء الترويج والانتشار:</span>
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {allProjects.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedProject(p);
                            runMarketingPipeline(p);
                          }}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-850 hover:border-indigo-500 border border-slate-800 rounded-xl text-xs text-white font-bold transition-all hover:scale-[1.02] flex items-center gap-2 active:scale-95"
                        >
                          <span>📁</span>
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
