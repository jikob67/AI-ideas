import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Project, ProjectFile, View, Message, ProjectType, SectionType, ComponentTreeNode } from '../types';
import DevicePreview from './DevicePreview';
import { persistenceService } from '../services/persistenceService';
import { geminiService } from '../services/geminiService';
import {
  CodeIcon as FileCodeIcon,
  CssIcon,
  JsIcon,
  SpinnerIcon,
  SparklesIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  CloseIcon,
  SendIcon,
  UploadIcon,
  ArrowLeftOnRectangleIcon,
  CodeIcon,
  CameraIcon,
  LightBulbIcon,
  BeakerIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  SaveIcon,
  CopyIcon,
  CheckIcon,
  Share2Icon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ShoppingCartIcon,
  UsersGroupIcon,
  BriefcaseIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  FireIcon,
  PlusIcon,
  RocketLaunchIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  InformationCircleIcon,
  ShieldCheckIcon as ShieldIcon,
  CommandLineIcon,
  TypeIcon,
  FileTextIcon,
  ImageIcon,
  GlobeIcon,
  GlobeAltIcon,
  LoaderIcon,
  PaintBrushIcon,
  ChartPieIcon,
  AcademicCapIcon,
  UploadIcon as UploadIcon_v2,
  AlignLeftIcon
} from './Icons';
import { motion, AnimatePresence } from 'motion/react';
import { useUsage } from '../hooks/useUsage';
import { BuildModal } from './builder/modals/BuildModal';
import { BuildInstructionsModal } from './builder/modals/BuildInstructionsModal';
import { BuildInstructions } from './BuildInstructions';
import UpgradeModal from './UpgradeModal';
import { useAuth } from '../hooks/useAuth';
import QualityAnalysisModal from './builder/modals/QualityAnalysisModal';
import { ProjectCard } from './ProjectCard';
import ProjectDetailModal from './ProjectDetailModal';
import { HybridBridgeSuite } from './HybridBridgeSuite';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  setDoc,
  serverTimestamp,
  getDocs,
  getDoc
} from 'firebase/firestore';


declare global {
  interface Window {
    JSZip: any;
  }
}

const HtmlIcon: React.FC<React.SVGProps<SVGSVGElement>> = FileCodeIcon;
type GenerationMode = 'idea' | 'text' | 'screen' | 'recognizer' | 'draw' | 'wizard' | 'url';
type Screen = 'list' | 'generator' | 'editor';
type SuggestionStep = 'category' | 'ideas' | 'refine';

interface ProjectIdea {
  name: string;
  description: string;
  type: ProjectType;
  suggestedFeatures: string[];
}

const ideaCategories = [
    { id: 'E-commerce', name: 'تجارة إلكترونية', icon: <ShoppingCartIcon className="w-8 h-8" /> },
    { id: 'Social & Community', name: 'اجتماعي', icon: <UsersGroupIcon className="w-8 h-8" /> },
    { id: 'Education & Content', name: 'تعليمي', icon: <LightBulbIcon className="w-8 h-8" /> },
    { id: 'Portfolio & Business', name: 'أعمال', icon: <BriefcaseIcon className="w-8 h-8" /> },
    { id: 'Productivity & Tools', name: 'أدوات', icon: <WrenchScrewdriverIcon className="w-8 h-8" /> },
    { id: 'Games & Entertainment', name: 'ترفيهي', icon: <SparklesIcon className="w-8 h-8" /> },
    { id: 'Health & Wellness', name: 'صحة', icon: <ShieldCheckIcon className="w-8 h-8" /> },
    { id: 'Other', name: 'أخرى', icon: <BeakerIcon className="w-8 h-8" /> },
];


// --- Helper Components ---

const FileIcon: React.FC<{ lang: ProjectFile['language'] }> = ({ lang }) => {
    const iconProps = { className: "w-4 h-4 flex-shrink-0" };
    if (lang === 'html') return <HtmlIcon {...iconProps} style={{ color: '#e34c26' }} />;
    if (lang === 'css') return <CssIcon {...iconProps} style={{ color: '#2965f1' }} />;
    if (lang === 'javascript') return <JsIcon {...iconProps} style={{ color: '#f0db4f' }} />;
    return <FileCodeIcon {...iconProps} />;
};

const LoadingScreen: React.FC<{ logs: string[]; projectType: ProjectType; }> = ({ logs, projectType }) => {
    const isFailed = logs.some(log => log.toLowerCase().includes('فشل'));
    const [currentTip, setCurrentTip] = useState('');
    
    const tips = useMemo(() => {
        const commonTips = [
            'تأكد من أن أسماء الملفات والأقسام وصفية.',
            'استخدم الألوان المتباينة لتحسين إمكانية الوصول.',
            'يمكنك دائمًا طلب تعديلات من الذكاء الاصطناعي بعد الإنشاء.',
        ];
        switch(projectType) {
            case ProjectType.STORE:
                return [...commonTips, 'فكر في بوابات الدفع التي ستوفر سهولة وأمَانًا لعملائك.', 'الصور عالية الجودة والواضحة للمنتجات تزيد من فرصة إتمام الشراء.'];
            case ProjectType.BLOG:
                return [...commonTips, 'المحتوى المنتظم والمفيد هو مفتاح نجاح المدونة وجذب القراء.', 'استخدم الكلمات المفتاحية الذكية لتحسين ترتيبك في محركات البحث (SEO).'];
            case ProjectType.WEBSITE:
                return [...commonTips, 'تأكد من أن التنقل بين الصفحات سهل وواضح للمستخدم.', 'توافق الموقع مع جميع مقاسات الشاشات والجوالات أمر أساسي لنجاحه.'];
            case ProjectType.WEB_APP:
                return [...commonTips, 'ركز على سرعة تحميل البيانات وتجربة المستخدم السلسة.', 'استمرارية حفظ بيانات المستخدم تلقائيًا يمنع فقدان التقدم.'];
            case ProjectType.MOBILE_APP:
                return [...commonTips, 'صمم عناصر تفاعلية يسهل الضغط عليها بإصبع الإبهام.', 'العمل دون اتصال بالإنترنت يعطي تجربة مستخدم أفضل.'];
            case ProjectType.GAME:
                return [...commonTips, 'اجعل اللعبة ممتعة وسهلة الفهم في البداية مع مستويات تدريجية في الصعوبة.', 'استعن بمؤثرات صوتية وحركية جذابة لزيادة الحماس والتفاعل.'];
            case ProjectType.API:
                return [...commonTips, 'احرص على توفير توثيق (Documentation) واضح ومفصل لسهولة الاستخدام.', 'الاهتمام بالحماية والتحقق من الصلاحيات يحمي بيانات مشروعك من الاختراقات.'];
            case ProjectType.LANDING_PAGE:
                return [...commonTips, 'ضع زر الدعوة للإجراء (CTA) بشكل بارز وواضح لزيادة التحويلات.', 'العنوان الرئيسي القصير والجذاب هو أول ما يشد انتباه الزائر.'];
            case ProjectType.ADMIN_SYSTEM:
                return [...commonTips, 'احرص على توفير لوحات تحكم وتقارير بيانية تسهل اتخاذ القرارات.', 'تنظيم الصلاحيات والمستخدمين بدقة يضمن سلامة البيانات الإدارية.'];
            case ProjectType.EDUCATIONAL_PLATFORM:
                return [...commonTips, 'توفير طرق تقييم ذكية واختبارات تفاعلية يزيد من حماس الطلاب.', 'سهولة تصفح الدروس والمحاضرات تجعل عملية التعلم أكثر متعة.'];
            case ProjectType.SOCIAL_NETWORK:
                return [...commonTips, 'توفير غرف تواصل وتعليقات فورية يزيد من تفاعل المستخدمين.', 'حماية خصوصية المستخدمين تزيد من ثقة المجتمع في شبكتك.'];
            case ProjectType.CHARITY_WEBSITE:
                return [...commonTips, 'الشفافية في عرض المشاريع والمستجدات تبني الثقة مع المتبرعين.', 'تسهيل عملية التبرع بلمسة واحدة يساهم في دعم وازدهار المشاريع.'];
            case ProjectType.IOT_DEVICE:
                return [...commonTips, 'استجابة الأجهزة في الوقت الحقيقي هي العامل الأهم لكفاءة النظام.', 'تصميم واجهة تحكم بسيطة يسهل متابعة قراءات وحالة المستشعرات.'];
            case ProjectType.DESKTOP_APP:
                return [...commonTips, 'استغلال اختصارات لوحة المفاتيح يجعل تجربة المحترفين أسرع بكثير.', 'تأكد من توافق التطبيق واستهلاكه المعتدل لموارد نظام التشغيل.'];
            case ProjectType.AI_MODEL:
                return [...commonTips, 'جودة ونظافة بيانات التدريب تحدد بشكل كبير دقة وجودة النموذج.', 'تقديم تفسيرات واضحة للمخرجات يسهل على المستخدم فهم توقعات النموذج.'];
            case ProjectType.DATA_VISUALIZATION:
                return [...commonTips, 'استخدم الأشكال التفاعلية والرسوم البيانية الملونة لتسهيل قراءة الأرقام المعقدة.', 'توفير فلاتر ذكية يتيح للمستخدم استكشاف البيانات حسب رغبته.'];
            case ProjectType.VR_AR_APP:
                return [...commonTips, 'تحسين الأداء ومعدل الإطارات يحمي المستخدمين من الشعور بالدوار.', 'توفير إرشادات تفاعلية واضحة يساعد في دمج المستخدم بداخل البيئة الافتراضية.'];
            case ProjectType.BLOCKCHAIN_APP:
                return [...commonTips, 'تأمين العقود الذكية يحمي الأصول الرقمية للمستخدمين من الثغرات.', 'توفير توثيق واضح وفوري للعمليات يعزز مصداقية النظام اللا مركزي.'];
            default:
                return [...commonTips, 'ضع خريطة طريق واضحة لمشروعك المستقبلي.'];
        }
    }, [projectType]);

    useEffect(() => {
        if (tips.length > 0) {
            setCurrentTip(tips[0]);
            const interval = setInterval(() => {
                setCurrentTip(prev => {
                    const currentIndex = tips.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % tips.length;
                    return tips[nextIndex];
                });
            }, 4000); // Change tip every 4 seconds
            return () => clearInterval(interval);
        }
    }, [tips]);

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in bg-slate-900">
            {isFailed ? <CloseIcon className="w-12 h-12 text-red-400 mb-6"/> : <SpinnerIcon className="w-12 h-12 text-indigo-400 animate-spin mb-6" />}
            <h2 className="text-2xl font-bold text-white">{isFailed ? 'حدث خطأ' : 'مهندس الذكاء الاصطناعي يعمل بجد...'}</h2>
            <p className="text-slate-400 mt-2">{isFailed ? 'لم نتمكن من إكمال بناء المشروع.' : 'لحظات ويصبح مشروعك جاهزًا.'}</p>
            <div className="mt-6 w-full max-w-md bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-left font-mono text-sm h-48 overflow-y-auto">
                {logs.map((log, i) => (
                    <p key={i} className={`animate-fade-in ${log.toLowerCase().includes('فشل') ? 'text-red-400' : 'text-slate-300'}`} style={{ animationDelay: `${i * 100}ms` }}>
                       &gt; {log}
                    </p>
                ))}
            </div>
             <div className="mt-4 w-full max-w-md p-3 bg-slate-800 rounded-lg text-center">
                <p className="text-sm font-semibold text-amber-300">نصيحة سريعة:</p>
                <p className="text-xs text-slate-400 mt-1 transition-opacity duration-500">{currentTip}</p>
             </div>
        </div>
    );
};

// --- Main Component ---
export const SoftwareProjectBuilder: React.FC<{
    navigate: (view: View, context?: any) => void;
    mode: GenerationMode;
    context?: any;
    onNewProject?: () => void;
}> = ({ navigate, mode, context, onNewProject }) => {
    
    // --- State ---
    const [screen, setScreen] = useState<Screen>('list');
    const [projects, setProjects] = useState<Project[]>([]);
    const [project, setProject] = useState<Project | null>(null); // The project being edited/viewed
    const [categories, setCategories] = useState<string[]>(['عام', 'تجريبي', 'تجاري', 'شخصي']);
    const [logs, setLogs] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [saveStatus, setSaveStatus] = useState('');
    
    // Project Update Mode States
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [updateProjectTargetId, setUpdateProjectTargetId] = useState<string>('');
    const [allUserProjects, setAllUserProjects] = useState<Project[]>([]);
    
    // --- Automatic Repair System States & Intelligence ---
    const [iframeErrors, setIframeErrors] = useState<{message: string; lineno?: number; colno?: number; type?: string}[]>([]);
    const [isAutoRepairing, setIsAutoRepairing] = useState(false);
    const [showDetailedIssues, setShowDetailedIssues] = useState(false);

    // Wizard state
    const [wizardStep, setWizardStep] = useState(1);
    const [wizardData, setWizardData] = useState({
        icon: context?.initialProject?.iconUrl || null as string | null,
        name: context?.initialProject?.name || '',
        description: context?.initialProject?.description || '',
        url: context?.initialProject?.url || ''
    });

    // List View State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const importFileRef = useRef<HTMLInputElement>(null);

    // Shared UI State
    const [activeFile, setActiveFile] = useState<string>('index.html');
    const [isTrinityMultiView, setIsTrinityMultiView] = useState<boolean>(false);
    const [sidebarTab, setSidebarTab] = useState<'files' | 'chat' | 'snapshots' | 'roadmap' | 'build' | 'hybrid'>('chat');
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
    const [isBuildInstructionsModalOpen, setIsBuildInstructionsModalOpen] = useState(false);
    const [buildPlatform, setBuildPlatform] = useState<'web' | 'android' | 'ios' | 'api'>('web');
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [projectToPublish, setProjectToPublish] = useState<Project | null>(null);
    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
    const shareMenuRef = useRef<HTMLDivElement>(null);
    const [isConvertMenuOpen, setIsConvertMenuOpen] = useState(false);
    const convertMenuRef = useRef<HTMLDivElement>(null);
    const [isVisualEditMode, setIsVisualEditMode] = useState(false);
    const [commandBarState, setCommandBarState] = useState<{ top: number, left: number, width: number, selector: string, tagName: string } | null>(null);
    const [visualEditCommand, setVisualEditCommand] = useState('');
    const [isProcessingVisualEdit, setIsProcessingVisualEdit] = useState(false);
    const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);


    // AI Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [chatImages, setChatImages] = useState<{ name: string; base64: string; mimeType: string; url: string }[]>([]);
    const chatFileInputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll chat to bottom when messages or typing status updates
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isChatLoading]);

    const handleScrollChatToTop = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleScrollChatToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    // Mode-specific state
    const [prompt, setPrompt] = useState('');
    const [files, setFiles] = useState<{ name: string, base64: string; mimeType: string, url: string }[]>([]);
    const [projectType, setProjectType] = useState<ProjectType>(ProjectType.WEBSITE);
    const [suggestionStep, setSuggestionStep] = useState<SuggestionStep>('category');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);
    const [selectedIdea, setSelectedIdea] = useState<ProjectIdea | null>(null);
    const [refinementRequest, setRefinementRequest] = useState('');
    const [recognitionResult, setRecognitionResult] = useState<{ name: string; type: ProjectType; description: string; originalAppName?: string; suggestedName?: string; ipModifications?: string[] } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectIconUrl, setProjectIconUrl] = useState<string | null>(null);
    const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
    const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSuggestingFeatures, setIsSuggestingFeatures] = useState(false);
    const [isAnalyzingUrl, setIsAnalyzingUrl] = useState(false);

    const staticIssues = useMemo(() => {
        const issues: { id: string; type: 'html' | 'css' | 'js'; text: string; severity: 'error' | 'vulnerability' | 'warning' }[] = [];
        const hasStyleFile = (projectFiles || []).some(f => f.name === 'style.css');
        const hasScriptFile = (projectFiles || []).some(f => f.name === 'script.js');

        (projectFiles || []).forEach(f => {
            if (f.name === 'index.html') {
                if (hasStyleFile && !f.content.includes('style.css')) {
                    issues.push({
                        id: 'html-style-unlinked',
                        type: 'html',
                        text: 'ملف التنسيق style.css موجود ولكنه غير مربوط بملف index.html باستعمال <link>.',
                        severity: 'warning'
                    });
                }
                if (hasScriptFile && !f.content.includes('script.js')) {
                    issues.push({
                        id: 'html-script-unlinked',
                        type: 'html',
                        text: 'ملف التحكم والبرمجة script.js موجود ولكنه غير مربوط بملف index.html وباستعمال <script>.',
                        severity: 'warning'
                    });
                }
                if (f.content.includes('<script') && !f.content.includes('</script>')) {
                    issues.push({
                        id: 'html-script-unclosed',
                        type: 'html',
                        text: 'وسم برمجيات التفاعل <script> مفتوح ولكن غير مغلق بـ </script> بشكل سليم.',
                        severity: 'error'
                    });
                }
                if (f.content.includes('<style') && !f.content.includes('</style>')) {
                    issues.push({
                        id: 'html-style-unclosed',
                        type: 'html',
                        text: 'وسم أنماط التنسيق <style> مفتوح ولكن غير مغلق بـ </style> بشكل سليم.',
                        severity: 'error'
                    });
                }
                if (!f.content.includes('viewport')) {
                    issues.push({
                        id: 'html-viewport-missing',
                        type: 'html',
                        text: 'غياب وسم التجاوب والـ viewport يعيق ضبط الهيكل ليتناسب تلقائياً مع حجم الشاشات والهواتف.',
                        severity: 'warning'
                    });
                }
                if (f.content.includes('<html') && !f.content.includes('</html>')) {
                    issues.push({
                        id: 'html-tag-unclosed',
                        type: 'html',
                        text: 'وسم البداية للهيكل <html> مفتوح ولكن غير مغلق بـ </html> في نهاية الملف.',
                        severity: 'error'
                    });
                }
                if (f.content.includes('<body') && !f.content.includes('</body>')) {
                    issues.push({
                        id: 'html-body-unclosed',
                        type: 'html',
                        text: 'وسم <body> غير مغلق بالكامل بـ </body>.',
                        severity: 'error'
                    });
                }
            }
            if (f.name === 'style.css') {
                const openBraces = (f.content.match(/\{/g) || []).length;
                const closeBraces = (f.content.match(/\}/g) || []).length;
                if (openBraces !== closeBraces) {
                    issues.push({
                        id: 'css-braces-mismatch',
                        type: 'css',
                        text: `عدم تطابق الأقواس التنسيقية المنشأة { و } (${openBraces} مقابل ${closeBraces}) بملف الأنماط والتنسيق.`,
                        severity: 'error'
                    });
                }
                if (f.content.includes('width: 1000px') || f.content.includes('width: 1200px') || f.content.includes('width: 800px')) {
                    issues.push({
                        id: 'css-responsiveness-static',
                        type: 'css',
                        text: 'تثبيت عرض الصفحة بـ px بدلاً من المئوية % أو الحجم المرن يكسر تجاوب المظهر مع الشاشات المتنقلة.',
                        severity: 'warning'
                    });
                }
            }
            if (f.name === 'script.js') {
                if (f.content.includes('innerHTML') && !f.content.includes('textContent') && (f.content.includes('input.value') || f.content.includes('search') || f.content.includes('URL'))) {
                    issues.push({
                        id: 'js-xss-vulnerability',
                        type: 'js',
                        text: 'ثغرة حقن برمجية (XSS) باستخدام غير آمن لـ innerHTML لعرض المدخلات بدلاً من textContent الآمن.',
                        severity: 'vulnerability'
                    });
                }
                if (f.content.includes('fetch(') && !f.content.includes('catch')) {
                    issues.push({
                        id: 'js-fetch-unhandled',
                        type: 'js',
                        text: 'عقبات استرداد البيانات: نداء fetch يرسل طلبات ويب دون معالجة أخطاء try/catch أو catch دائم للإصدار.',
                        severity: 'warning'
                    });
                }
                const openBraces = (f.content.match(/\{/g) || []).length;
                const closeBraces = (f.content.match(/\}/g) || []).length;
                if (openBraces !== closeBraces) {
                    issues.push({
                        id: 'js-braces-mismatch',
                        type: 'js',
                        text: `عدم تطابق الأقواس البرمجية المعرفة للوظائف والأزرار { و } (${openBraces} مقابل ${closeBraces}) بملف البرمجة التفاعلية.`,
                        severity: 'error'
                    });
                }
                const openParens = (f.content.match(/\(/g) || []).length;
                const closeParens = (f.content.match(/\)/g) || []).length;
                if (openParens !== closeParens) {
                    issues.push({
                        id: 'js-parens-mismatch',
                        type: 'js',
                        text: `عدم تطابق الأقواس التمهيدية والدائرية ( و ) (${openParens} مقابل ${closeParens}) بملف البرمجة التفاعلية.`,
                        severity: 'error'
                    });
                }
            }
        });
        return issues;
    }, [projectFiles]);

    const { incrementUsage, isLimitReached } = useUsage();
    const { currentUser, updateUser } = useAuth();

    const isOwner = useMemo(() => {
        if (!project) return true; // Handling generator state or new projects
        if (!currentUser) return false;
        return project.ownerUid === currentUser.uid;
    }, [currentUser, project]);

    const creationModeForThisView = useMemo(() => {
        switch(mode) {
            case 'idea': return 'ideaToCode';
            case 'text': return 'textToCode';
            case 'screen': return 'screenToCode';
            case 'recognizer': return 'uiRecognizer';
            case 'draw': return 'drawToCode';
            case 'wizard': return 'projectWizard';
            case 'url': return 'urlToCode';
            default: return undefined;
        }
    }, [mode]);

    // --- Data & Session Management ---
    useEffect(() => {
        if (!currentUser) return;
        
        // 1. Load from localStorage
        const email = currentUser.email;
        const key = `appProjects_${email}`;
        const localProjs: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
        
        // 2. Load from Firestore if user has uid
        if (currentUser.uid) {
            const q = query(
                collection(db, 'projects'),
                where('ownerUid', '==', currentUser.uid)
            );
            getDocs(q).then((snap) => {
                const fsProjs = snap.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                })) as Project[];
                
                // Merge local and firestore uniquely
                const merged = [...localProjs];
                fsProjs.forEach(fp => {
                    if (!merged.some(mp => mp.id === fp.id)) {
                        merged.push(fp);
                    }
                });
                setAllUserProjects(merged);
            }).catch(err => {
                console.error("Failed to load firestore projects for update selection:", err);
                setAllUserProjects(localProjs);
            });
        } else {
            setAllUserProjects(localProjs);
        }
    }, [currentUser, screen, project]);

    // Sync active project state to localStorage so sidebar/header transfer always gets the full latest data
    useEffect(() => {
        if (project && currentUser?.email) {
            const key = `appProjects_${currentUser.email}`;
            const savedApps: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
            const updatedProject = {
                ...project,
                files: projectFiles,
                builderChat: messages,
                updatedAt: Date.now()
            };
            const updatedApps = savedApps.map(p => p.id === project.id ? updatedProject : p);
            if (!savedApps.some(p => p.id === project.id)) {
                updatedApps.unshift(updatedProject);
            }
            localStorage.setItem(key, JSON.stringify(updatedApps));
            localStorage.setItem(`active_editing_project_${currentUser.email}`, JSON.stringify(updatedProject));
        }
    }, [project, projectFiles, messages, currentUser]);

    useEffect(() => {
        if (screen === 'list' && currentUser?.uid) {
            const q = query(
                collection(db, 'projects'),
                where('ownerUid', '==', currentUser.uid),
                where('creationMode', '==', creationModeForThisView)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const projectList = snapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                })) as Project[];
                setProjects(projectList);
            }, (err) => {
                console.error("Error fetching projects:", err);
            });

            return () => unsubscribe();
        }
    }, [screen, creationModeForThisView, currentUser]);


    useEffect(() => {
        if (context?.initialProject) {
            const proj = context.initialProject;
            setProjectName(proj.name || '');
            setProjectIconUrl(proj.iconUrl || null);
            setPrompt(proj.description || '');
            setProjectType(proj.type || ProjectType.WEBSITE);
            setScreen('generator');
            return;
        }

        if (context?.project) {
            // Handle navigation from another tool
            if (screen === 'generator') {
                const proj = context.project;
                setProjectName(proj.name || '');
                setProjectIconUrl(proj.iconUrl || null);
                setPrompt(proj.description || '');
                setProjectType(proj.type || ProjectType.WEBSITE);
                setIsUpdateMode(true);
                setUpdateProjectTargetId(proj.id);
                // Simple file handling for now - look for a primary image if in screen mode
                if ((mode === 'screen' || mode === 'recognizer') && proj.files && proj.files.length > 0) {
                     // In a real app, you might find the most relevant image. Here, we just take the first.
                    // This part is complex due to different file formats. For simplicity, we just prefill text.
                }

            } else { // Navigating to editor
                const proj = context.project;
                setProject(proj);
                
                // Fetch subcollections if needed
                if (currentUser?.uid) {
                    const projDocRef = doc(db, 'projects', proj.id);
                    getDoc(projDocRef).then((docSnap) => {
                        if (docSnap.exists()) {
                            persistenceService.getProjectFiles(proj.id).then(files => {
                                setProjectFiles(files);
                                if (files.length > 0) {
                                    const trinity = ['index.html', 'style.css', 'script.js'];
                                    const primary = trinity.find(name => files.some(f => f.name === name)) || files[0].name;
                                    setActiveFile(primary);
                                } else {
                                    setActiveFile('index.html');
                                }
                            });
                            persistenceService.getProjectMessages(proj.id).then(msgs => {
                                setMessages(msgs.length > 0 ? msgs : [{ id: 'init', sender: 'ai', text: 'مرحباً! أنا مساعدك الذكي. اطلب مني أي تعديل على مشروعك.' }]);
                            });
                        } else {
                            // If it does not exist in Firestore, initialize and save it
                            const newProj = {
                                ...proj,
                                ownerUid: currentUser.uid,
                                updatedAt: Date.now()
                            };
                            setProject(newProj);
                            
                            const generatedFiles = proj.files || [];
                            const generatedMessages = proj.builderChat || [{ 
                                id: 'init', 
                                sender: 'ai', 
                                text: 'مرحباً! أنا مساعدك الذكي. اطلب مني أي تعديل على مشروعك.',
                                timestamp: Date.now() 
                            }];
                            
                            setProjectFiles(generatedFiles);
                            setMessages(generatedMessages);
                            if (generatedFiles.length > 0) {
                                const trinity = ['index.html', 'style.css', 'script.js'];
                                const primary = trinity.find(name => generatedFiles.some(f => f.name === name)) || generatedFiles[0].name;
                                setActiveFile(primary);
                            } else {
                                setActiveFile('index.html');
                            }
                            
                            persistenceService.saveProjectMetadata(newProj).then(() => {
                                Promise.all([
                                    ...generatedFiles.map(file => persistenceService.saveFile(proj.id, file)),
                                    ...generatedMessages.map(msg => persistenceService.saveMessage(proj.id, msg))
                                ]).catch(err => {
                                    console.error("Error saving new project subcollections to Firestore:", err);
                                });
                            }).catch(err => {
                                console.error("Error saving new project metadata to Firestore:", err);
                            });
                        }
                    }).catch((error) => {
                        console.log("getDoc failed or does not exist, initializing new project in Firestore:", error);
                        const newProj = {
                            ...proj,
                            ownerUid: currentUser.uid,
                            updatedAt: Date.now()
                        };
                        setProject(newProj);
                        
                        const generatedFiles = proj.files || [];
                        const generatedMessages = proj.builderChat || [{ 
                            id: 'init', 
                            sender: 'ai', 
                            text: 'مرحباً! أنا مساعدك الذكي. اطلب مني أي تعديل على مشروعك.',
                            timestamp: Date.now() 
                        }];
                        
                        setProjectFiles(generatedFiles);
                        setMessages(generatedMessages);
                        if (generatedFiles.length > 0) {
                            const trinity = ['index.html', 'style.css', 'script.js'];
                            const primary = trinity.find(name => generatedFiles.some(f => f.name === name)) || generatedFiles[0].name;
                            setActiveFile(primary);
                        } else {
                            setActiveFile('index.html');
                        }
                        
                        persistenceService.saveProjectMetadata(newProj).then(() => {
                            Promise.all([
                                ...generatedFiles.map(file => persistenceService.saveFile(proj.id, file)),
                                ...generatedMessages.map(msg => persistenceService.saveMessage(proj.id, msg))
                            ]).catch(err => {
                                    console.error("Error saving new project subcollections to Firestore:", err);
                            });
                        }).catch(err => {
                            console.error("Error saving new project metadata to Firestore:", err);
                        });
                    });
                } else {
                    setMessages(proj.builderChat || [{ id: 'init', sender: 'ai', text: 'مرحباً! أنا مساعدك الذكي. اطلب مني أي تعديل على مشروعك.' }]);
                    const files = proj.files || [];
                    setProjectFiles(files);
                    if (files.length > 0) {
                      const trinity = ['index.html', 'style.css', 'script.js'];
                      const primary = trinity.find(name => files.some(f => f.name === name)) || files[0].name;
                      setActiveFile(primary);
                    } else {
                      setActiveFile('index.html');
                    }
                }
                
                setScreen('editor');
            }
            return;
        }


        if (context?.prefillPrompt) {
            setPrompt(context.prefillPrompt);
            setScreen('generator');
            return;
        }
        
        if (context?.prefillImage) {
            setFiles(prev => {
                if (!prev.some(f => f.name === context.prefillImage.name)) {
                    return [...prev, context.prefillImage];
                }
                return prev;
            });
            setScreen('generator');
            return;
        }
    
        if (!currentUser) return;
    
        const key = `swb_session_${currentUser.email}_${mode}`;
        const savedSession = localStorage.getItem(key);
    
        if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                if (parsed.projectName) setProjectName(parsed.projectName);
                if (parsed.projectIconUrl) setProjectIconUrl(parsed.projectIconUrl);
                
                if (mode === 'idea') {
                    if (parsed.suggestionStep) setSuggestionStep(parsed.suggestionStep);
                    if (parsed.selectedCategory) setSelectedCategory(parsed.selectedCategory);
                    if (parsed.projectIdeas) setProjectIdeas(parsed.projectIdeas);
                    if (parsed.selectedIdea) {
                        setSelectedIdea(parsed.selectedIdea);
                        setProjectType(parsed.selectedIdea.type);
                    }
                } else if (mode === 'recognizer') {
                     if (parsed.files) setFiles(parsed.files);
                     if (parsed.recognitionResult) setRecognitionResult(parsed.recognitionResult);
                } else { // text, screen
                    if (parsed.prompt) setPrompt(parsed.prompt);
                    if (parsed.projectType) setProjectType(parsed.projectType);
                    if (parsed.files) setFiles(parsed.files);
                }
            } catch (e) {
                console.error('Failed to restore session:', e);
                localStorage.removeItem(key);
            }
        }
    }, [currentUser, mode, context]);

    const roadmapSteps = useMemo(() => [
        { id: 'creation', label: 'التأسيس والبناء', icon: <RocketLaunchIcon className="w-5 h-5" />, status: 'completed', description: 'تم إنشاء الهيكل الأساسي للمشروع.' },
        { id: 'design', label: 'الهوية والتصميم', icon: <PaintBrushIcon className="w-5 h-5" />, status: 'pending', target: 'assetStudio', description: 'إنشاء الأصول المرئية والأيقونات.' },
        { id: 'data', label: 'تحليل البيانات', icon: <ChartPieIcon className="w-5 h-5" />, status: 'pending', target: 'dataAnalysis', description: 'تنظيم وتحليل بيانات المستخدمين.' },
        { id: 'seo', label: 'تحسين المحركات', icon: <MagnifyingGlassIcon className="w-5 h-5" />, status: 'pending', target: 'seoOptimizer', description: 'تحسين ظهور مشروعك في البحث.' },
        { id: 'marketing', label: 'التسويق والانتشار', icon: <SparklesIcon className="w-5 h-5" />, status: 'pending', target: 'marketing', description: 'خطة تسويقية شاملة لمشروعك.' },
        { id: 'launch', label: 'النشر في المعرض', icon: <GlobeAltIcon className="w-5 h-5" />, status: 'pending', target: 'showroom', description: 'اعرض مشروعك للعالم واجمع الآراء.' },
    ], []);

    const renderRoadmapTab = () => (
        <div className="flex flex-col h-full bg-slate-900/30 font-sans p-4 space-y-6 overflow-y-auto">
            <div className="text-right">
                <h4 className="text-white font-bold text-lg mb-1">خارطة الطريق</h4>
                <p className="text-slate-400 text-xs">اتبع هذه الخطوات لتحويل فكرتك إلى مشروع ناجح متكامل.</p>
            </div>

            <div className="relative space-y-8 pr-2">
                {/* Connecting Line */}
                <div className="absolute top-2 bottom-2 right-4 w-[2px] bg-slate-800" />

                {roadmapSteps.map((step, index) => (
                    <motion.div 
                        key={step.id} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative pr-10 group"
                    >
                        {/* Step Marker */}
                        <div className={`absolute top-0 right-1.5 w-6 h-6 rounded-full border-4 border-slate-900 z-10 flex items-center justify-center transition-all ${
                            step.status === 'completed' ? 'bg-green-500 scale-110 shadow-lg shadow-green-500/20' : 'bg-slate-700 group-hover:bg-indigo-500'
                        }`}>
                            {step.status === 'completed' && <CheckIcon className="w-3 h-3 text-white" />}
                        </div>

                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all text-right group/card">
                            <div className="flex items-center gap-3 justify-end mb-2">
                                <span className={`text-xs font-bold ${step.status === 'completed' ? 'text-green-400' : 'text-slate-500'}`}>
                                    {step.status === 'completed' ? 'مكتمل' : 'بانتظارك'}
                                </span>
                                <div className={`${step.status === 'completed' ? 'text-green-400' : 'text-indigo-400 opacity-70 group-hover/card:opacity-100 transition-opacity'}`}>
                                    {step.id === 'creation' ? pageConfig.icon : step.icon}
                                </div>
                            </div>
                            <h5 className="text-white font-bold text-sm mb-1">{step.label}</h5>
                            <p className="text-slate-400 text-[10px] leading-relaxed mb-3">{step.description}</p>
                            
                            {step.target && (
                                <button 
                                    onClick={() => navigate(step.target as View, { project })}
                                    className="w-full py-1.5 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-indigo-400 hover:text-white rounded-lg text-[10px] font-bold transition-all"
                                >
                                    انتقل للقسم
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);

    useEffect(() => {
        if (sidebarTab === 'snapshots' && project?.id) {
            setIsLoadingSnapshots(true);
            const q = query(collection(db, 'projects', project.id, 'snapshots'), where('timestamp', '!=', null));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setSnapshots(list.sort((a: any, b: any) => b.timestamp?.seconds - a.timestamp?.seconds));
                setIsLoadingSnapshots(false);
            }, (err) => {
                console.error("Error fetching snapshots:", err);
                setIsLoadingSnapshots(false);
            });
            return () => unsubscribe();
        }
    }, [sidebarTab, project?.id]);

    const handleRestoreSnapshot = (snap: any) => {
        if (!window.confirm('هل أنت متأكد من استعادة هذه النسخة؟ سيتم استبدال الملفات الحالية.')) return;
        setProjectFiles(snap.projectFiles);
        if (snap.projectFiles.length > 0) setActiveFile(snap.projectFiles[0].name);
        setSaveStatus('تم استعادة النسخة الاحتياطية!');
        setTimeout(() => setSaveStatus(''), 2000);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
                setIsShareMenuOpen(false);
            }
            if (convertMenuRef.current && !convertMenuRef.current.contains(event.target as Node)) {
                setIsConvertMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSaveSnapshot = async () => {
        if (!project || !currentUser?.uid) return;
        setIsSavingSnapshot(true);
        try {
            const snapshotData = {
                name: `نسخة احتياطية - ${new Date().toLocaleString('ar-EG')}`,
                timestamp: serverTimestamp(),
                projectFiles: projectFiles,
                description: project.description
            };
            await addDoc(collection(db, 'projects', project.id, 'snapshots'), snapshotData);
            setSaveStatus('تم حفظ النسخة الاحتياطية بنجاح!');
            setTimeout(() => setSaveStatus(''), 3000);
        } catch (err) {
            console.error("Error saving snapshot:", err);
            setError('فشل حفظ النسخة الاحتياطية.');
        } finally {
            setIsSavingSnapshot(false);
        }
    };

    const handleSaveSession = () => {
        if (!currentUser) return;
        const key = `swb_session_${currentUser.email}_${mode}`;
        
        let sessionData = {};
        if (mode === 'idea') {
            sessionData = { suggestionStep, selectedCategory, projectIdeas, selectedIdea, projectName, projectIconUrl };
        } else if (mode === 'recognizer') {
            sessionData = { files, recognitionResult, projectName, projectIconUrl };
        } else {
            sessionData = { prompt, projectType, files, projectName, projectIconUrl };
        }

        localStorage.setItem(key, JSON.stringify(sessionData));
        setSaveStatus('تم الحفظ!');
        setTimeout(() => setSaveStatus(''), 2000);
    };

    const handleClearSession = () => {
        if (!currentUser) return;
        if (!window.confirm('هل أنت متأكد من مسح الجلسة؟ سيتم حذف المدخلات الحالية.')) return;
        
        const key = `swb_session_${currentUser.email}_${mode}`;
        localStorage.removeItem(key);

        setProject(null);
        setProjectFiles([]);
        setPrompt('');
        setFiles([]);
        setProjectType(ProjectType.WEBSITE);
        setSuggestionStep('category');
        setSelectedCategory('');
        setProjectIdeas([]);
        setSelectedIdea(null);
        setRefinementRequest('');
        setRecognitionResult(null);
        setProjectName('');
        setProjectIconUrl(null);
        setError('');
        setLogs([]);
        setMessages([]);
        setSaveStatus('تم المسح!');
        setTimeout(() => setSaveStatus(''), 2000);
    };

    const handleImportProjects = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser?.email) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);
                const projectsToImport = Array.isArray(parsed) ? parsed : [parsed];

                const validProjects: Project[] = projectsToImport.map((p: any) => ({
                    ...p,
                    id: `proj-imp-${Date.now()}-${Math.random()}`,
                    timestamp: Date.now(),
                    creationMode: creationModeForThisView,
                    ownerEmail: currentUser.email,
                }));

                const key = `appProjects_${currentUser.email}`;
                const savedApps: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
                const updatedApps = [...validProjects, ...savedApps];
                localStorage.setItem(key, JSON.stringify(updatedApps));

                setProjects(updatedApps.filter(p => p.creationMode === creationModeForThisView));
                alert(`تم استيراد ${validProjects.length} مشروع بنجاح.`);

            } catch (error) {
                alert('فشل استيراد الملف. تأكد من أنه ملف JSON صالح.');
            } finally {
                if (importFileRef.current) importFileRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleExportProjects = () => {
        if (projects.length === 0) {
            alert('لا توجد مشاريع لتصديرها.');
            return;
        }
        const jsonString = JSON.stringify(projects, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${creationModeForThisView}-projects.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // --- Memos ---
    const pageConfig = useMemo(() => {
        switch(mode) {
            case 'idea': return { title: 'فكرة إلى كود', icon: <LightBulbIcon className="w-8 h-8"/>, usageType: ProjectType.PROJECT_GENERATION };
            case 'text': return { title: 'نص إلى كود', icon: <CodeIcon className="w-8 h-8"/>, usageType: ProjectType.PROJECT_GENERATION };
            case 'screen': return { title: 'شاشة إلى كود', icon: <CameraIcon className="w-8 h-8"/>, usageType: ProjectType.SCREENSHOT_TO_CODE };
            case 'recognizer': return { title: 'محلل الواجهات', icon: <BeakerIcon className="w-8 h-8"/>, usageType: ProjectType.UI_ANALYSIS };
            case 'draw': return { title: 'من المخطط للكود', icon: <PencilSquareIcon className="w-8 h-8"/>, usageType: ProjectType.DRAW_TO_CODE };
            case 'wizard': return { title: 'بناء مشروع جديد', icon: <RocketLaunchIcon className="w-8 h-8"/>, usageType: ProjectType.PROJECT_GENERATION };
            case 'url': return { title: 'بناء مشروع من رابط', icon: <GlobeAltIcon className="w-8 h-8"/>, usageType: ProjectType.PROJECT_GENERATION };
            default: return { title: 'بناء مشروع', icon: <CodeIcon className="w-8 h-8"/>, usageType: ProjectType.PROJECT_GENERATION };
        }
    }, [mode]);

    const srcDoc = useMemo(() => {
        if (!project) return '';
        if (projectFiles.length === 0) {
            return `
            <html lang="ar" dir="rtl">
            <body style="background:#111; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; text-align:center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;">📂</div>
                <h2 style="margin-bottom: 10px;">لا توجد ملفات حالياً</h2>
                <p style="color: #888; max-width: 300px; margin-bottom: 20px;">لم نتمكن من العثور على ملفات لهذا المشروع. اضغط على زر "إصلاح المشروع" لإنشاء الملفات الأساسية.</p>
                <button onclick="parent.postMessage('repair-project', '*')" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 16px;">إصلاح المشروع الآن</button>
            </body>
            </html>`;
        }

        const htmlFile = projectFiles.find(f => f.name === 'index.html') || projectFiles.find(f => f.name.endsWith('.html'));
        const cssFiles = projectFiles.filter(f => f.name.endsWith('.css'));
        const jsFiles = projectFiles.filter(f => f.name.endsWith('.js'));

        if (!htmlFile) {
            return `
            <html lang="ar" dir="rtl">
            <body style="background:#111; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; text-align:center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <h2 style="margin-bottom: 10px;">ملف HTML مفقود</h2>
                <p style="color: #888; max-width: 300px; margin-bottom: 20px;">ليتم عرض المعاينة، يجب وجود ملف باسم index.html.</p>
                <button onclick="parent.postMessage('repair-project', '*')" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 16px;">إضافة الملفات الأساسية</button>
            </body>
            </html>`;
        }

        let htmlContent = htmlFile.content;
        
        // If it's just a fragment, wrap it
        if (!htmlContent.includes('<html') && !htmlContent.includes('<body')) {
            htmlContent = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${htmlContent}</body></html>`;
        }

        const styles = cssFiles.map(f => `<style data-filename="${f.name}">${f.content}</style>`).join('\n');
        const scripts = jsFiles.map(f => `<script data-filename="${f.name}">${f.content}</script>`).join('\n');

        // Inject styles and scripts
        if (htmlContent.includes('</head>')) {
            htmlContent = htmlContent.replace('</head>', `${styles}\n</head>`);
        } else if (htmlContent.includes('<body>')) {
             htmlContent = htmlContent.replace('<body>', `<body>\n${styles}`);
        } else {
            htmlContent = `${styles}\n${htmlContent}`;
        }

        if (htmlContent.includes('</body>')) {
            htmlContent = htmlContent.replace('</body>', `${scripts}\n</body>`);
        } else {
            htmlContent = `${htmlContent}\n${scripts}`;
        }

        return htmlContent;
    }, [project, projectFiles]);

    // Listener for messages from iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data === 'repair-project') {
                handleRepairProject();
            } else if (event.data.type === 'IFRAME_ERROR_DETECTED') {
                const errorPayload = event.data.payload;
                if (errorPayload && errorPayload.message) {
                    setIframeErrors(prev => {
                        // Avoid duplicates of same error messages
                        if (prev.some(err => err.message === errorPayload.message)) return prev;
                        return [...prev, errorPayload];
                    });
                }
            } else if (event.data.type === 'VISUAL_EDITOR_ELEMENT_CLICKED' && isVisualEditMode) {
                const { rect, selector, tagName } = event.data.payload;
                if (selector) {
                    // Coordinates relative to the preview container
                    setCommandBarState({ 
                        top: rect.top + rect.height, 
                        left: rect.left, 
                        width: Math.max(280, rect.width), 
                        selector, 
                        tagName 
                    });
                    setVisualEditCommand('');
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [projectFiles, project, isVisualEditMode]);

    const handleVisualEditSubmit = async () => {
        if (!commandBarState || !visualEditCommand || !project) return;
        setIsProcessingVisualEdit(true);
        onLog(`جاري تنفيذ التعديل المرئي على: <${commandBarState.tagName.toLowerCase()}>...`);
        try {
            const tempProjectWithFiles = { ...project, files: projectFiles };
            const { updatedProject, aiResponse } = await geminiService.modifyProjectWithAI(tempProjectWithFiles as any, `Visual Edit for ${commandBarState.selector} (${commandBarState.tagName}): ${visualEditCommand}`);
            
            setProject(updatedProject);
            setProjectFiles((updatedProject as any).files);
            setMessages((updatedProject as any).builderChat || []);
            onLog(aiResponse);
        } catch (error) {
            console.error("Visual edit failed:", error);
            setError(`فشل التعديل المرئي: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsProcessingVisualEdit(false);
            setCommandBarState(null);
        }
    };

    const handleAutoRepair = async () => {
        if (!project || !projectFiles || projectFiles.length === 0) return;
        setIsAutoRepairing(true);
        onLog("🚀 جاري بدء نظام الإصلاح التلقائي الشامل للمشروع...");
        onLog("🔍 تحليل الأخطاء، وحل ثغرات الأمن وتأمين الكود من جذوره نهائياً...");
        
        try {
            const allDetectedIssues = [
                ...staticIssues.map(issue => `[كود ${issue.type.toUpperCase()}]: ${issue.text} (مستوى الخطورة: ${issue.severity})`),
                ...iframeErrors.map(e => `خطأ وقت التشغيل: ${e.message}`)
            ];

            const issuesList = allDetectedIssues.length > 0 
                ? allDetectedIssues.map((msg, i) => `${i + 1}. ${msg}`).join('\n') 
                : "أخطاء عامة، مشاكل ومخاطر تقنية غير معروفة، أو فجوات أداء برمجية.";

            const codeSnapshot = projectFiles.map(f => `=== اسم الملف: ${f.name} ===\n${f.content}\n=== نهاية الملف ===`).join('\n\n');

            const prompt = `أنت مهندس برمجيات محترف وخبير في نظام الحماية والأمان الذاتي.
لقد تم تفعيل نظام الإصلاح التلقائي المتقدم (Auto-Repair) لحل الأخطاء والمشاكل والثغرات التالية المكتشفة في مشروع المستخدم النهائي:
${issuesList}

إليك الأكواد البرمجية الحالية للمشروع:
${codeSnapshot}

المطلوب منك هو إصلاح كامل جذري ونهائي وشامل وتلقائي دون نقصان لأي مشكلة من المشاكل المذكورة أعلاه:
1. تصحيح جميع أخطاء وقت التشغيل وأخطاء الترجمة وبنية الأكواد (JavaScript Syntax, logic errors, missing parameters).
2. تأمين الأكواد بالكامل ضد أي ثغرة أمنية (مثل ثغرات XSS، وسد واستبدال innerHTML بأكواد آمنة مثل textContent أو استخدام طرق تصفية المدخلات الآمنة تماماً).
3. معالجة كافة الأخطاء البرمجية المحتملة في طلبات الشبكة (fetch requests) بإحاطتها بكتل try-catch مخصصة لمعالجة الاستثناءات بشكل دائم.
4. تحسين تصميم الواجهة وكود CSS لتكون الصفحة متجاوبة بشكل رائع مع جميع مقاسات الشاشات والهواتف (Responsive layout).
5. يرجى تزويدنا بكود كامل للملفات المعدلة دون حذف أو اختصار، ويجب أن تحتوي دائماً على الملفات الأساسية للمشروع (index.html, style.css, script.js).`;

            const tempProjectWithFiles = { ...project, files: projectFiles };
            const { updatedProject, aiResponse } = await geminiService.modifyProjectWithAI(tempProjectWithFiles as any, prompt);
            
            const newFiles = (updatedProject as any).files || [];
            if (newFiles && newFiles.length > 0) {
                if (currentUser?.uid) {
                    for (const file of newFiles) {
                        await persistenceService.saveFile(project.id, file);
                    }
                }
                setProjectFiles(newFiles);
                setIframeErrors([]); // Clear errors
                onLog("✨ تم نجاح نظام الإصلاح التلقائي! تم حل المشاكل وتأمين الأكواد بالكامل من الجذور وبشكل نهائي.");
            } else {
                onLog("⚠️ لم يتم استرجاع ملفات مصححة جديدة، قد يكون الكود خالياً من الأخطاء العميقة.");
            }
        } catch (error: any) {
            console.error("Auto Repair failed", error);
            const errMsg = error?.message || "يرجى المحاولة مرة أخرى.";
            onLog(`✗ فشل تفعيل نظام الإصلاح التلقائي: ${errMsg}`);
        } finally {
            setIsAutoRepairing(false);
        }
    };

    const handleRepairProject = async () => {
        if (!project) return;
        setIsGenerating(true);
        onLog("جاري إصلاح ملفات المشروع...");
        
        try {
            const repairResponse = await geminiService.buildProjectFromSpec({
                projectName: project.name,
                prompt: `Please regenerate the base files (index.html, style.css, script.js) for this project: ${project.description || project.name}. Ensure they follow the AI Ideas Trinity standard.`,
                projectType: project.type,
                files: [],
                iconUrl: project.icon,
            }, onLog);

            const newFiles = (repairResponse as any).files || [];
            
            if (currentUser?.uid) {
                // Remove old files if any (optional, setDoc merge: false usually handles this for same names)
                for (const file of newFiles) {
                    await persistenceService.saveFile(project.id, file);
                }
            }
            
            setProjectFiles(newFiles);
            setActiveFile('index.html');
            onLog("تم إصلاح المشروع بنجاح!");
        } catch (error) {
            console.error("Repair failed", error);
            onLog("فشل إصلاح المشروع. حاول مرة أخرى.");
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        // Only fetch projects if we are in list screen
    }, [screen]);

    const projectTypesInView = useMemo(() => (
        ['all', ...Array.from(new Set(projects.map(p => p.type)))]
    ), [projects]);

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterType === 'all' || p.type === filterType;
            return matchesSearch && matchesFilter;
        });
    }, [projects, searchQuery, filterType]);
    
    // --- Handlers ---
    const onLog = (log: string) => setLogs(prev => [...prev, log]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (!selectedFiles) return;

        let isUsageLimited = true;
        let usageType = ProjectType.UPLOAD_IMAGE_CONTEXT;

        if (mode === 'text') {
            if (files.length > 0 || selectedFiles.length > 1) {
                setError('يمكن رفع صورة واحدة فقط في قسم نص إلى كود.');
                if (event.target) event.target.value = '';
                return;
            }
            isUsageLimited = false; // This upload is free
        } else if (mode === 'recognizer') {
            if (files.length > 0 || selectedFiles.length > 1) {
                setError('يمكن رفع صورة واحدة فقط في وضع محلل الواجهات.');
                if (event.target) event.target.value = '';
                return;
            }
            usageType = pageConfig.usageType;
        } else if (mode === 'screen') {
            usageType = pageConfig.usageType;
        }

        if (isUsageLimited) {
            if (isLimitReached(usageType, selectedFiles.length)) {
                setUpgradeModalOpen(true);
                if (event.target) event.target.value = '';
                return;
            }
        }

        const newFilesPromises = Array.from(selectedFiles).map(file => {
            const f = file as File;
            return new Promise<{ name: string; base64: string; mimeType: string; url: string }>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(f);
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve({
                        name: f.name,
                        base64: result.split(',')[1],
                        mimeType: f.type,
                        url: result,
                    });
                };
                reader.onerror = reject;
            });
        });

        Promise.all(newFilesPromises)
            .then(newFiles => {
                setFiles(prev => [...prev, ...newFiles]);
                if (isUsageLimited) {
                    incrementUsage(usageType, newFiles.length);
                }
            })
            .catch(() => setError('فشل في قراءة الملف.'));
        
        if (event.target) event.target.value = ''; // Reset input
    };

    const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProjectIconUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        // Clear the input value to allow re-uploading the same file
        if(e.target) e.target.value = '';
    };

    const removeFile = (fileName: string) => {
        setFiles(prev => prev.filter(f => f.name !== fileName));
    };
    
    const handleGenerate = async () => {
        let finalPrompt = prompt;
        let finalName = projectName;
        let finalIcon = projectIconUrl;
        let finalType = projectType;

        if (mode === 'wizard') {
            finalName = wizardData.name;
            finalPrompt = wizardData.description;
            finalIcon = wizardData.icon;
            finalType = ProjectType.WEB_APP;
        } else if (mode === 'url') {
            finalName = wizardData.name;
            finalPrompt = wizardData.description;
            finalIcon = wizardData.icon;
            finalType = ProjectType.WEBSITE;
        }

        if (!finalPrompt && files.length === 0 && mode !== 'wizard' && mode !== 'url') {
            setError('الرجاء تقديم وصف أو رفع ملف للبدء.');
            return;
        }
        if (!finalName) {
            setError('الرجاء إدخال اسم للمشروع.');
            return;
        }
        if (isLimitReached(pageConfig.usageType)) {
            setUpgradeModalOpen(true);
            return;
        }

        setIsGenerating(true);
        setLogs([]);
        setError('');

        try {
            let actualPrompt = finalPrompt;

            if (mode === 'url') {
                onLog('جاري جلب محتوى الرابط...');
                const proxyRes = await fetch(`/api/proxy?url=${encodeURIComponent(wizardData.url)}`);
                if (!proxyRes.ok) throw new Error('فشل جلب محتوى الرابط. تأكد من صحة الرابط.');
                const htmlContent = await proxyRes.text();
                
                onLog('تم جلب المحتوى بنجاح. جاري تحليل البيانات...');
                
                actualPrompt = `
                    بناء مشروع جديد بناءً على الرابط التالي: ${wizardData.url}
                    اسم المشروع: ${finalName}
                    وصف المشروع: ${finalPrompt}
                    محتوى الصفحة المرجعية (HTML):
                    ${htmlContent.substring(0, 10000)}
                    
                    المطلوب: إنشاء مشروع متكامل (HTML, CSS, JS) مستوحى من هذا الرابط ولكن بتصميم عصري وفريد.
                `;
            } else if (mode === 'idea' && selectedIdea) {
                actualPrompt = `اسم المشروع: ${finalName}. نوع المشروع: ${selectedIdea.type}. وصف المشروع: ${selectedIdea.description}. الميزات المقترحة: ${selectedIdea.suggestedFeatures.join(', ')}.`;
            } else if (mode === 'recognizer' && recognitionResult) {
                actualPrompt = recognitionResult.description;
            }

            let newProject: Project;
            if (isUpdateMode && updateProjectTargetId) {
                onLog('جاري جلب بيانات وبنية الملفات للمشروع القائم للتحديث...');
                let existingProject: Project | undefined = allUserProjects.find(p => p.id === updateProjectTargetId);
                
                if (!existingProject && currentUser?.email) {
                    const key = `appProjects_${currentUser.email}`;
                    const savedApps: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
                    existingProject = savedApps.find(p => p.id === updateProjectTargetId);
                }
                
                if (!existingProject) {
                    throw new Error('لم نتمكن من العثور على المشروع المحدد لتحديثه.');
                }
                
                let existingProjectFiles = existingProject.files || [];
                if (existingProjectFiles.length === 0 && currentUser?.uid) {
                    onLog('جاري استرداد الكود المصدري من قاعدة البيانات السحابية...');
                    try {
                        existingProjectFiles = await persistenceService.getProjectFiles(updateProjectTargetId);
                    } catch (e) {
                        console.error("Failed to load files from db, fallback to empty", e);
                    }
                }
                
                existingProject.files = existingProjectFiles;
                
                if (existingProject.files.length === 0) {
                    existingProject.files = [
                        { name: 'index.html', language: 'html', content: '<h1>' + existingProject.name + '</h1>' },
                        { name: 'style.css', language: 'css', content: 'body { font-family: sans-serif; }' },
                        { name: 'script.js', language: 'javascript', content: 'console.log("Loaded");' }
                    ];
                }
                
                onLog('جاري تقديم طلب التحديث لذكاء الاصطناعي (Gemini)...');
                
                const convertedImages = files.map(f => ({
                    base64: f.url.split(',')[1] || '',
                    mimeType: f.type || 'image/png'
                })).filter(img => img.base64);
                
                const response = await geminiService.modifyProjectWithAI(
                    existingProject,
                    actualPrompt,
                    convertedImages
                );
                
                newProject = response.updatedProject;
                newProject.creationMode = creationModeForThisView;
                newProject.description = finalPrompt || existingProject.description;
                
                // Add modification notice to log
                onLog('تم استلام الرد. جاري تطبيق وتحديث الملفات بنجاح...');
                
                if (currentUser?.uid) {
                    await persistenceService.saveProjectMetadata(newProject);
                    for (const file of newProject.files || []) {
                        await persistenceService.saveFile(newProject.id, file);
                    }
                    const updateMsg = {
                        id: `update-${Date.now()}`,
                        sender: 'ai' as const,
                        text: response.aiResponse,
                        timestamp: Date.now()
                    };
                    await persistenceService.saveMessage(newProject.id, updateMsg);
                    
                    const allMsgs = await persistenceService.getProjectMessages(newProject.id);
                    // Force state update of messages
                    (newProject as any).builderChat = allMsgs;
                } else {
                    const updateMsg = {
                        id: `update-${Date.now()}`,
                        sender: 'ai' as const,
                        text: response.aiResponse,
                        timestamp: Date.now()
                    };
                    const updatedChat = [...(existingProject.builderChat || []), updateMsg];
                    newProject.builderChat = updatedChat;
                }
            } else {
                const ipProtection = (mode === 'screen' || mode === 'recognizer');
                newProject = await geminiService.buildProjectFromSpec({
                    projectName: finalName,
                    prompt: actualPrompt,
                    projectType: finalType,
                    files,
                    iconUrl: finalIcon,
                }, onLog, ipProtection);
                
                // Add creationMode to project for routing
                newProject.creationMode = creationModeForThisView;
            }

            if (currentUser?.uid) {
                newProject.ownerUid = currentUser.uid;
                
                // Extract files and messages before saving metadata
                const generatedFiles = (newProject as any).files || [];
                const generatedMessages = (newProject as any).builderChat || [{ 
                    id: 'init', 
                    sender: 'ai', 
                    text: 'مرحباً! أنا مساعدك الذكي. اطلب مني أي تعديل على مشروعك.',
                    timestamp: Date.now() 
                }];
                
                // Save everything granularly
                await persistenceService.saveProjectMetadata(newProject);
                for (const file of generatedFiles) {
                    await persistenceService.saveFile(newProject.id, file);
                }
                for (const msg of generatedMessages) {
                    await persistenceService.saveMessage(newProject.id, msg);
                }
                
                // Update local state immediately
                setProject(newProject);
                setMessages(generatedMessages);
                setProjectFiles(generatedFiles);
                if (generatedFiles.length > 0) setActiveFile(generatedFiles[0].name);
            } else {
                setProject(newProject);
                setProjectFiles((newProject as any).files || []);
                setMessages((newProject as any).builderChat || []);
                if ((newProject as any).files?.[0]) setActiveFile((newProject as any).files[0].name);
            }

            incrementUsage(pageConfig.usageType);
            onLog("تم بناء المشروع بنجاح!");
            
            // Wait a moment then transition to editor
            setTimeout(() => {
                setScreen('editor');
            }, 1500);

        } catch (e) {
            const msg = e instanceof Error ? e.message : 'فشل بناء المشروع.';
            setError(msg);
            onLog(`✗ فشل: ${msg}`);
        } finally {
            // Let the loading screen stay until transition
            // setIsGenerating(false);
        }
    };
    
    const handleSaveProject = async () => {
        if (!project || !currentUser?.uid) return;

        try {
            await persistenceService.saveProjectMetadata({
                ...project,
                updatedAt: Date.now()
            });
            setSaveStatus('تم الحفظ!');
            setTimeout(() => setSaveStatus(''), 2000);
        } catch (err) {
            console.error("Error saving project:", err);
            setError('فشل حفظ المشروع في السحابة.');
        }
    };

    const handleOpenBuildModal = (platform: 'web' | 'android' | 'ios' | 'api') => {
        setBuildPlatform(platform);
        setIsBuildModalOpen(true);
    };

    const updateProjectLocal = (updates: Partial<Project>) => {
        if (!project) return;
        const updated = { ...project, ...updates };
        setProject(updated);
        // Also update Firestore if we have a user
        if (currentUser?.uid) {
            updateDoc(doc(db, 'projects', project.id), updates).catch(err => console.error("Auto-sync update failed:", err));
        }
    };

    useEffect(() => {
        // Project life-cycle effects
    }, [projectFiles]);

    const handleChatFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (!selectedFiles) return;

        if (chatImages.length + selectedFiles.length > 3) {
            alert('يمكنك رفع 3 صور كحد أقصى للمحادثة.');
            return;
        }

        const newFilesPromises = Array.from(selectedFiles).map(file => {
            const f = file as File;
            return new Promise<{ name: string; base64: string; mimeType: string; url: string }>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(f);
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve({ name: f.name, base64: result.split(',')[1], mimeType: f.type, url: result });
                };
                reader.onerror = reject;
            });
        });

        Promise.all(newFilesPromises)
            .then(newFiles => setChatImages(prev => [...prev, ...newFiles]))
            .catch(() => alert('فشل في قراءة الملف.'));
        
        if (event.target) event.target.value = '';
    };

    const removeChatImage = (fileName: string) => {
        setChatImages(prev => prev.filter(f => f.name !== fileName));
    };
    
    const handleChatSend = async () => {
        if ((!input.trim() && chatImages.length === 0) || isChatLoading || !project) return;
        if (isLimitReached(ProjectType.AI_CHAT_MESSAGE)) {
             setUpgradeModalOpen(true);
             return;
        }

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            text: input,
            sender: 'user',
            timestamp: Date.now(),
            attachments: chatImages.map(img => ({ url: img.url, name: img.name }))
        };
        
        // Save user message immediately
        if (currentUser?.uid) {
            await persistenceService.saveMessage(project.id, userMessage);
        }

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        incrementUsage(ProjectType.AI_CHAT_MESSAGE);
        
        const command = input;
        setInput('');
        const imagesToSend = [...chatImages];
        setChatImages([]);
        setIsChatLoading(true);

        try {
            // We need to provide the files to Gemini
            const tempProjectWithFiles = { ...project, files: projectFiles };
            const { updatedProject, aiResponse } = await geminiService.modifyProjectWithAI(tempProjectWithFiles as any, command, imagesToSend) as { updatedProject: any, aiResponse: string };
            
            const aiMessage: Message = { 
                id: `ai-${Date.now()}`, 
                text: aiResponse, 
                sender: 'ai',
                timestamp: Date.now()
            };
            setMessages([...newMessages, aiMessage]);

            if (currentUser?.uid) {
                // Save AI message
                await persistenceService.saveMessage(project.id, aiMessage);
                
                // Save changed files
                const changedFiles = updatedProject.files.filter((f: any) => {
                    const existing = projectFiles.find(ef => ef.name === f.name);
                    return !existing || existing.content !== f.content;
                });

                for (const file of changedFiles) {
                    await persistenceService.saveFile(project.id, file);
                }

                // Update metadata if name or description changed
                await persistenceService.saveProjectMetadata(updatedProject);
            }
            
            setProject(updatedProject); 
            setProjectFiles(updatedProject.files);
        } catch (e: any) {
            const apiError = e?.message || 'عذرًا، حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.';
            const errorMessage: Message = { id: `err-${Date.now()}`, text: apiError, sender: 'ai' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleShare = async (type: 'link' | 'files') => {
        if (!project) {
            alert('لا يوجد مشروع لمشاركته.');
            return;
        }
        if (!navigator.share && type === 'files') {
            alert('متصفحك لا يدعم ميزة المشاركة.');
            return;
        }
        setIsShareMenuOpen(false);

        try {
            if (type === 'link') {
                let shareId = project.publicShareId;
                if (!shareId) {
                    shareId = Math.random().toString(36).substring(2, 15);
                    await updateDoc(doc(db, 'projects', project.id), {
                        publicShareId: shareId
                    });
                    setProject((prev: any) => prev ? { ...prev, publicShareId: shareId } : prev);
                }
                const shareUrl = `${window.location.origin}/share/${shareId}`;
                
                if (navigator.share) {
                    await navigator.share({
                        title: project.name,
                        text: `تحقق من مشروعي "${project.name}" الذي أنشأته باستخدام AI Studio!`,
                        url: shareUrl, 
                    });
                } else {
                    navigator.clipboard.writeText(shareUrl);
                    alert("تم نسخ رابط المشاركة إلى الحافظة!");
                }
            } else { // type === 'files'
                if (!window.JSZip) {
                    alert('مكتبة الضغط غير متاحة للمشاركة.');
                    return;
                }
                const zip = new window.JSZip();
                projectFiles.forEach(file => zip.file(file.name, file.content));
                const blob = await zip.generateAsync({ type: 'blob' });
                const file = new File([blob], `${project.name.replace(/\s+/g, '_')}.zip`, { type: 'application/zip' });
                
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: project.name,
                    });
                } else {
                    alert("متصفحك لا يدعم مشاركة الملفات مباشرة.");
                }
            }
             if(currentUser) {
                updateUser({ points: (currentUser.points || 0) + 10 });
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
                alert('فشلت المشاركة.');
            }
        }
    };

    const handleDeleteProject = async (projectId: string, skipConfirm = false) => {
        if (!currentUser?.uid) return;
        if (!skipConfirm && !window.confirm("هل أنت متأكد؟ سيتم نقل المشروع إلى سلة المهملات.")) return;

        try {
            // Find project metadata
            const projMetadata = projects.find(p => p.id === projectId) || (project?.id === projectId ? project : null);
            
            if (projMetadata) {
                // Fetch files and messages for the trash
                const [projectFiles, projectMessages] = await Promise.all([
                    persistenceService.getProjectFiles(projectId),
                    persistenceService.getProjectMessages(projectId)
                ]);

                const fullProject = { 
                    ...projMetadata, 
                    files: projectFiles, 
                    builderChat: projectMessages,
                    deletedAt: Date.now() 
                };

                // Move to Trash (localStorage to match Trash.tsx component)
                const trashKey = `deletedProjects_${currentUser.email}`;
                const deletedApps = JSON.parse(localStorage.getItem(trashKey) || '[]');
                localStorage.setItem(trashKey, JSON.stringify([fullProject, ...deletedApps]));
            }

            // Permanently delete from Firebase
            await deleteDoc(doc(db, 'projects', projectId));
            
            if(project && project.id === projectId) {
                setProject(null);
                setScreen('list');
            }
        } catch (err) {
            console.error("Error deleting project:", err);
            setError('فشل حذف المشروع.');
        }
    };
    
    // --- Idea to Code Specific Handlers ---
    const handleSelectCategory = async (category: string) => {
        setSelectedCategory(category);
        setIsGenerating(true);
        setError('');
        try {
            const ideas = await geminiService.generateProjectIdeas(category);
            setProjectIdeas(ideas);
            setSuggestionStep('ideas');
        } catch(e) {
            setError('فشل في توليد الأفكار. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelectIdea = (idea: ProjectIdea) => {
        setSelectedIdea(idea);
        setProjectName(idea.name);
        setProjectType(idea.type);
        setSuggestionStep('refine');
    };

    const handleRefineIdea = async () => {
        if (!selectedIdea || !refinementRequest.trim()) return;
        setIsGenerating(true);
        setError('');
        try {
            const refinedData = await geminiService.refineProjectIdea(selectedIdea, refinementRequest);
            setSelectedIdea(prev => prev ? { ...prev, ...refinedData } : null);
            setRefinementRequest(''); // Clear input after refinement
        } catch (e) {
            setError('فشل في تحسين الفكرة.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRequestMoreFeatures = async () => {
        if (!selectedIdea) return;
        setIsSuggestingFeatures(true);
        setError('');
        try {
            const newFeatures = await geminiService.suggestMoreFeatures(selectedIdea);
            setSelectedIdea(prev => {
                if (!prev) return null;
                const existingFeatures = new Set(prev.suggestedFeatures);
                const uniqueNewFeatures = newFeatures.filter(f => !existingFeatures.has(f));
                return {
                    ...prev,
                    suggestedFeatures: [...prev.suggestedFeatures, ...uniqueNewFeatures]
                };
            });
        } catch (e) {
            setError('فشل في اقتراح ميزات إضافية.');
        } finally {
            setIsSuggestingFeatures(false);
        }
    };

    const handleIdeaFinalize = () => {
        if (selectedIdea) {
            setProjectName(selectedIdea.name);
            setProjectType(selectedIdea.type);
            handleGenerate();
        }
    };
    
    const handleGenerateIcon = async () => {
        if (isLimitReached(ProjectType.GENERATE_ICON)) {
            setUpgradeModalOpen(true);
            return;
        }
        let nameForIcon = projectName;
        let descForIcon = prompt;
        if (mode === 'idea' && selectedIdea) {
            nameForIcon = selectedIdea.name;
            descForIcon = selectedIdea.description;
        } else if (mode === 'recognizer' && recognitionResult) {
            nameForIcon = recognitionResult.name;
            descForIcon = recognitionResult.description;
        }
        if (!nameForIcon || !descForIcon) {
            setError("الرجاء إدخال اسم ووصف للمشروع أولاً لإنشاء أيقونة.");
            return;
        }
        setIsGeneratingIcon(true);
        try {
            const imageBase64 = await geminiService.generateProjectIcon(nameForIcon, descForIcon);
            const dataUrl = `data:image/jpeg;base64,${imageBase64}`;
            setProjectIconUrl(dataUrl);
            incrementUsage(ProjectType.GENERATE_ICON);
        } catch (error) {
            setError("فشل إنشاء الأيقونة. يرجى المحاولة مرة أخرى.");
        } finally {
            setIsGeneratingIcon(false);
        }
    };

    const handleAnalyzeUrl = async () => {
        if (!wizardData.url) return;
        setIsAnalyzingUrl(true);
        try {
            onLog('جاري تحليل الرابط واستخراج البيانات...');
            const result = await geminiService.analyzeUrlForMarketing(wizardData.url);
            if (result) {
                setWizardData(prev => ({
                    ...prev,
                    name: result.name || prev.name,
                    description: result.description || prev.description,
                    icon: result.iconUrl || prev.icon
                }));
                onLog(`تم التعرف على: ${result.name}`);
                setWizardStep(2); // Move to next step if successful
            }
        } catch (e) {
            console.error('URL Analysis failed:', e);
            onLog('فشل تحليل الرابط تلقائياً، يمكنك إدخال البيانات يدوياً.');
            setWizardStep(2); // Still move forward
        } finally {
            setIsAnalyzingUrl(false);
        }
    };
    
    // UI Recognizer handler
    const handleAnalyzeUI = async () => {
        if (files.length === 0) {
            setError('الرجاء رفع صورة واجهة مستخدم أولاً.');
            return;
        }
        if (isLimitReached(pageConfig.usageType)) {
            setUpgradeModalOpen(true);
            return;
        }
        setIsAnalyzing(true);
        setError('');
        try {
            const file = files[0];
            const result = await geminiService.analyzeAndCategorizeUI(file.base64, file.mimeType);
            setRecognitionResult(result);
            setProjectName(result.name); // Will be the suggested name
            setProjectType(result.type);
            incrementUsage(pageConfig.usageType);
        } catch (e) {
            setError(e instanceof Error ? e.message : "فشل تحليل الواجهة.");
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const conversionTargets: { view: View; label: string }[] = [
        { view: 'ideaToCode', label: 'فكرة إلى كود' },
        { view: 'textToCode', label: 'نص إلى كود' },
        { view: 'screenToCode', label: 'شاشة إلى كود' },
        { view: 'uiRecognizer', label: 'محلل الواجهات' },
        { view: 'drawToCode', label: 'تصميم إلى كود' },
        { view: 'fileConverter', label: 'محول الملفات' },
    ];


    // --- Render Methods ---
    const renderListView = () => (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <header className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">{pageConfig.title}</h2>
                    <p className="text-slate-400">({projects.length}) مشاريع</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => importFileRef.current?.click()} className="text-sm bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded-lg flex items-center gap-2"><UploadIcon className="w-4 h-4"/> استيراد</button>
                    <button onClick={handleExportProjects} className="text-sm bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded-lg flex items-center gap-2"><ArrowDownTrayIcon className="w-4 h-4"/> تصدير</button>
                    <button onClick={onNewProject ? onNewProject : () => setScreen('generator')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                        <PlusIcon className="w-5 h-5"/> مشروع جديد
                    </button>
                    <input type="file" accept=".json" ref={importFileRef} className="hidden" onChange={handleImportProjects} />
                </div>
            </header>
            <div className="relative mb-4">
                <input type="search" placeholder="ابحث عن مشروع..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4" />
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
                {projectTypesInView.length > 2 && projectTypesInView.map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            filterType === type 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        {type === 'all' ? 'الكل' : type}
                    </button>
                ))}
            </div>

            {filteredProjects.length === 0 ? (
                 <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-500">
                    <div className="mb-4">{React.cloneElement(pageConfig.icon, {className: "w-16 h-16 text-slate-600"})}</div>
                    <h3 className="text-lg font-semibold">{projects.length > 0 ? 'لم يتم العثور على نتائج' : 'لا توجد مشاريع بعد'}</h3>
                    <p>{projects.length > 0 ? 'جرّب كلمة بحث مختلفة أو فلتر آخر.' : 'انقر على "مشروع جديد" للبدء.'}</p>
                </div>
            ) : (
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                    {filteredProjects.map(p => (
                         <ProjectCard
                            key={p.id}
                            project={p}
                            onDelete={handleDeleteProject}
                            onEdit={async (proj) => {
                                setProject(proj);
                                // Ensure projectFiles and messages are loaded
                                let files = proj.files || [];
                                let chat = proj.builderChat || [{ id: 'init', sender: 'ai', text: 'مرحباً! أنا مساعدك الذكي. اطلب مني أي تعديل على مشروعك.' }];

                                if (currentUser?.uid) {
                                    onLog("تحميل ملفات المشروع...");
                                    const savedFiles = await persistenceService.getProjectFiles(proj.id);
                                    if (savedFiles.length > 0) files = savedFiles;
                                    
                                    const savedMsgs = await persistenceService.getProjectMessages(proj.id);
                                    if (savedMsgs.length > 0) chat = savedMsgs;
                                }

                                setProjectFiles(files);
                                setMessages(chat);
                                setActiveFile(files[0]?.name || 'index.html');
                                setScreen('editor');
                            }}
                            onUpdate={(updatedMetadata) => {
                                setProjects(projects.map(pj => pj.id === updatedMetadata.id ? updatedMetadata : pj));
                                if (currentUser?.uid) {
                                    persistenceService.saveProjectMetadata(updatedMetadata);
                                }
                            }}
                            categories={categories}
                            onAddCategory={(name) => {
                                if (!categories.includes(name)) {
                                    setCategories([...categories, name]);
                                }
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
    
    const renderUpdateModeCard = () => {
        return (
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-xl text-right w-full max-w-xl mx-auto">
                <div className="flex items-center justify-between">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={isUpdateMode} 
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setIsUpdateMode(checked);
                                if (!checked) {
                                    setUpdateProjectTargetId('');
                                } else if (allUserProjects.length > 0) {
                                    // Auto-select first project
                                    const firstProj = allUserProjects[0];
                                    setUpdateProjectTargetId(firstProj.id);
                                    setProjectName(firstProj.name);
                                }
                            }}
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <h3 className="text-sm font-bold text-white">وضع تحديث المشروع</h3>
                            <p className="text-[11px] text-slate-400">تحديث وتطوير الأكواد والميزات في مشروع قائم تلقائياً</p>
                        </div>
                        <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                            <SparklesIcon className="w-5 h-5 animate-pulse" />
                        </span>
                    </div>
                </div>

                {isUpdateMode && (
                    <div className="space-y-3 pt-2 border-t border-slate-800 animate-fade-in text-right">
                        <label className="text-xs font-semibold text-slate-300 block mb-1">اختر المشروع المُراد تحديثه:</label>
                        {allUserProjects.length > 0 ? (
                            <select 
                                value={updateProjectTargetId} 
                                onChange={(e) => {
                                    const pid = e.target.value;
                                    setUpdateProjectTargetId(pid);
                                    const selected = allUserProjects.find(p => p.id === pid);
                                    if (selected) {
                                        setProjectName(selected.name);
                                        // Pre-fill prompt if empty
                                        if (!prompt) setPrompt(selected.description || '');
                                    }
                                }}
                                className="w-full bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right font-sans"
                            >
                                {allUserProjects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.creationMode || p.type || 'ملفات أكواد مصدريّة'})</option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-xs text-amber-400 font-sans">لا توجد مشاريع سابقة مفعّلة لتحديثها حالياً.</p>
                        )}

                        {updateProjectTargetId && (
                            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xs text-indigo-300 flex items-center justify-end gap-2 font-sans">
                                <span>وضع التحديث نشط حالياً للمشروع المختار. سيقوم النظام بتطوير وبناء ملفاته.</span>
                                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping flex-shrink-0" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderIdeaWizard = () => {
        if (suggestionStep === 'category') {
            return (
                <div className="animate-fade-in text-center space-y-6 max-w-2xl mx-auto">
                    {renderUpdateModeCard()}
                    <div className="pt-4">
                        <h3 className="text-2xl font-bold text-white mb-2">لنبدأ بفكرتك!</h3>
                        <p className="text-slate-400 mb-6">اختر فئة لمشروعك، وسيقوم الذكاء الاصطناعي باقتراح بعض الأفكار الملهمة.</p>
                        {isGenerating && <SpinnerIcon className="w-8 h-8 mx-auto animate-spin text-indigo-400 mb-4"/>}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {ideaCategories.map(cat => (
                                <button key={cat.id} onClick={() => handleSelectCategory(cat.id)} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-700/50 hover:border-indigo-500 transition-all text-center group">
                                    <div className="text-indigo-400 mx-auto">{cat.icon}</div>
                                    <p className="font-semibold text-white text-sm mt-3">{cat.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
        if (suggestionStep === 'ideas') {
            return (
                <div className="animate-fade-in w-full max-w-3xl mx-auto">
                    <button onClick={() => setSuggestionStep('category')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4">
                        <ArrowLeftIcon className="w-4 h-4" /> العودة للفئات
                    </button>
                    <h3 className="text-2xl font-bold text-white mb-2">أفكار مقترحة لفئة "{selectedCategory}"</h3>
                    <p className="text-slate-400 mb-6">اختر فكرة للبدء بها أو عد لاختيار فئة أخرى.</p>
                    {error && <p className="text-red-400 text-sm my-2">{error}</p>}
                    <div className="space-y-4">
                        {projectIdeas.map((idea, index) => (
                            <button key={index} onClick={() => handleSelectIdea(idea)} className="w-full text-right p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-700/50 hover:border-indigo-500 transition-all group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-100">{idea.name}</h4>
                                        <p className="text-sm text-slate-400 mt-1">{idea.description}</p>
                                    </div>
                                    <ArrowRightIcon className="w-5 h-5 text-slate-500 mt-1 mr-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            );
        }
        if (suggestionStep === 'refine' && selectedIdea) {
             return (
                <div className="animate-fade-in w-full max-w-3xl mx-auto space-y-6">
                    <button onClick={() => setSuggestionStep('ideas')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-2">
                        <ArrowLeftIcon className="w-4 h-4" /> العودة للأفكار
                    </button>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                        <h3 className="text-2xl font-bold text-white">{selectedIdea.name}</h3>
                        <p className="text-slate-400 mt-2">{selectedIdea.description}</p>
                        <div className="mt-4">
                            <h4 className="text-sm font-semibold text-slate-300 mb-2">الميزات المقترحة:</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedIdea.suggestedFeatures.map((feature, i) => <span key={i} className="text-xs bg-slate-700 px-2 py-1 rounded-full">{feature}</span>)}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-white">صقل الفكرة (اختياري)</h3>
                            <button onClick={handleRequestMoreFeatures} disabled={isSuggestingFeatures} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50">
                                {isSuggestingFeatures ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <SparklesIcon className="w-4 h-4"/>}
                                اقتراح ميزات إضافية
                            </button>
                        </div>
                        <textarea 
                            value={refinementRequest}
                            onChange={(e) => setRefinementRequest(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3"
                            placeholder="مثال: أضف ميزة نظام نقاط للمستخدمين، واجعل التصميم بسيطًا وعصريًا."
                        />
                        <button onClick={handleRefineIdea} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 text-sm py-2 bg-slate-600 hover:bg-slate-500 rounded-lg disabled:bg-slate-500">
                             {isGenerating ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                            صقل بواسطة AI
                        </button>
                    </div>
                     <div className="border-t border-slate-700 pt-6">
                         <div className="flex items-center gap-4">
                           <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 relative group">
                                {projectIconUrl ? <img src={projectIconUrl} alt="Icon" className="w-full h-full object-cover rounded-lg" /> : <BriefcaseIcon className="w-8 h-8 text-slate-500"/>}
                                 <label htmlFor="icon-upload-idea" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg">
                                    <UploadIcon className="w-6 h-6 text-white" />
                                </label>
                                <input id="icon-upload-idea" type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
                            </div>
                            <div className="flex-grow">
                                <label htmlFor="project-name-final" className="text-sm text-slate-300">الخطوة النهائية: اسم المشروع</label>
                                <input id="project-name-final" type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 mt-1"/>
                            </div>
                             <button onClick={handleGenerateIcon} disabled={isGeneratingIcon} className="self-end p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg disabled:bg-slate-500" title="إنشاء أيقونة بالذكاء الاصطناعي">
                                {isGeneratingIcon ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                            </button>
                        </div>
                        <button onClick={handleIdeaFinalize} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-4">
                            <RocketLaunchIcon className="w-5 h-5" />
                            ابنِ المشروع الآن
                        </button>
                     </div>
                </div>
            );
        }
        return null;
    };
    
    const handleWizardIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setWizardData(prev => ({ ...prev, icon: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const renderGeneratorInputs = () => {
        if (mode === 'wizard' || mode === 'url') {
            const isUrlMode = mode === 'url';
            return (
                <div className="max-w-2xl mx-auto py-8 space-y-6">
                    {renderUpdateModeCard()}
                    <div className="mb-8 font-sans">
                        <div className="flex items-center justify-between mb-4">
                            {[1, 2, 3, 4].map((s) => (
                                <div key={s} className="flex flex-col items-center flex-1 relative">
                                    <div 
                                        className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                                            s <= wizardStep ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-500'
                                        }`}
                                    >
                                        {s < wizardStep ? <CheckIcon className="w-6 h-6" /> : s}
                                    </div>
                                    <span className={`text-xs mt-2 font-medium transition-colors ${s <= wizardStep ? 'text-indigo-400' : 'text-slate-600'}`}>
                                        {isUrlMode ? (
                                            s === 1 ? 'الرابط' : s === 2 ? 'الهوية' : s === 3 ? 'التأكيد' : ''
                                        ) : (
                                            s === 1 ? 'الأيقونة' : s === 2 ? 'الاسم' : s === 3 ? 'المتطلبات' : 'التأكيد'
                                        )}
                                    </span>
                                    {(isUrlMode ? s < 3 : s < 4) && (
                                        <div className={`absolute top-5 left-1/2 w-full h-[2px] -z-0 transition-all duration-500 ${
                                            s < wizardStep ? 'bg-indigo-600' : 'bg-slate-800'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 opacity-50" />
                        
                        <div className="flex-grow">
                            <AnimatePresence mode="wait">
                                {isUrlMode ? (
                                    <>
                                        {wizardStep === 1 && (
                                            <motion.div key="url-step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                                <div className="text-center font-sans">
                                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                        <GlobeIcon className="w-8 h-8 text-emerald-400" />
                                                    </div>
                                                    <h2 className="text-2xl font-bold text-white mb-2">رابط الموقع المرجعي</h2>
                                                    <p className="text-slate-400">أدخل رابط الموقع الذي تريد استلهام التصميم منه</p>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="url"
                                                        value={wizardData.url}
                                                        onChange={(e) => setWizardData(prev => ({ ...prev, url: e.target.value }))}
                                                        placeholder="https://example.com"
                                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder:text-slate-600 font-sans"
                                                        autoFocus
                                                        onKeyDown={(e) => e.key === 'Enter' && wizardData.url && handleAnalyzeUrl()}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                        {wizardStep === 2 && (
                                            <motion.div key="url-step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                                <div className="text-center font-sans">
                                                    <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                        <SparklesIcon className="w-8 h-8 text-blue-400" />
                                                    </div>
                                                    <h2 className="text-2xl font-bold text-white mb-2 font-sans">هوية المشروع</h2>
                                                    <p className="text-slate-400">راجع البيانات المستخرجة من الرابط</p>
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    <div className="flex gap-4">
                                                        <div className="w-24 h-24 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex-shrink-0 cursor-pointer hover:border-indigo-500 transition-colors" onClick={() => fileInputRef.current?.click()}>
                                                            {wizardData.icon ? <img src={wizardData.icon} className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-6 text-slate-600" />}
                                                            <input type="file" ref={fileInputRef} onChange={handleWizardIconUpload} className="hidden" accept="image/*" />
                                                        </div>
                                                        <div className="flex-grow space-y-2">
                                                            <label className="text-xs text-slate-500 block">اسم المشروع</label>
                                                            <input
                                                                type="text"
                                                                value={wizardData.name}
                                                                onChange={(e) => setWizardData(prev => ({ ...prev, name: e.target.value }))}
                                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs text-slate-500 block">وصف مختصر</label>
                                                        <textarea
                                                            value={wizardData.description}
                                                            onChange={(e) => setWizardData(prev => ({ ...prev, description: e.target.value }))}
                                                            rows={3}
                                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                        {wizardStep === 3 && (
                                            <motion.div key="url-step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                                <div className="text-center font-sans">
                                                    <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                        <RocketLaunchIcon className="w-8 h-8 text-purple-400" />
                                                    </div>
                                                    <h2 className="text-2xl font-bold text-white mb-2">تأكيد البناء</h2>
                                                    <p className="text-slate-400">أنت على وشك بناء مشروع متكامل مستوحى من {new URL(wizardData.url).hostname}</p>
                                                </div>
                                                <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-400">اسم المشروع:</span>
                                                        <span className="text-white font-bold">{wizardData.name}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-400">الرابط المرجعي:</span>
                                                        <span className="text-indigo-400 text-sm">{wizardData.url}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {wizardStep === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <ImageIcon className="w-8 h-8 text-indigo-400" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white mb-2 font-sans">رفع آيقونة المشروع</h2>
                                            <p className="text-slate-400 font-sans">اختر صورة تعبر عن هوية مشروعك الجديد</p>
                                        </div>

                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-slate-700 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all group"
                                        >
                                            {wizardData.icon ? (
                                                <div className="relative">
                                                    <img src={wizardData.icon} alt="Icon Preview" className="w-32 h-32 rounded-2xl object-cover shadow-2xl border-4 border-slate-800 font-sans" />
                                                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 shadow-lg">
                                                        <CheckIcon className="w-5 h-5 text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                        <UploadIcon_v2 className="w-10 h-10 text-slate-400 group-hover:text-indigo-400" />
                                                    </div>
                                                    <span className="text-slate-300 font-medium font-sans">اضغط هنا لرفع الصورة</span>
                                                    <span className="text-slate-500 text-sm mt-2 font-sans text-center">PNG, JPG (أقصى حجم 2MB)</span>
                                                </>
                                            )}
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                onChange={handleWizardIconUpload} 
                                                className="hidden" 
                                                accept="image/*"
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {wizardStep === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="text-center font-sans">
                                            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <TypeIcon className="w-8 h-8 text-blue-400" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white mb-2">تسمية المشروع</h2>
                                            <p className="text-slate-400">ما هو الاسم الذي اخترته لمشروعك؟</p>
                                        </div>

                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={wizardData.name}
                                                onChange={(e) => setWizardData(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="مثال: متجر السعادة، تطبيق اللياقة..."
                                                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder:text-slate-600 font-sans"
                                                autoFocus
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {wizardStep === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="text-center font-sans">
                                            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                {isUrlMode ? <GlobeIcon className="w-8 h-8 text-emerald-400" /> : <FileTextIcon className="w-8 h-8 text-emerald-400" />}
                                            </div>
                                            <h2 className="text-2xl font-bold text-white mb-2">{isUrlMode ? 'رابط الموقع المرجعي' : 'وصف المشروع'}</h2>
                                            <p className="text-slate-400">{isUrlMode ? 'أدخل الرابط الذي تريد بناء المشروع بناءً عليه' : 'اشرح فكرة مشروعك وما الذي ترغب في بنائه'}</p>
                                        </div>

                                        <div className="relative">
                                            {isUrlMode ? (
                                                <input
                                                    type="url"
                                                    value={wizardData.url}
                                                    onChange={(e) => setWizardData(prev => ({ ...prev, url: e.target.value }))}
                                                    placeholder="https://example.com"
                                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder:text-slate-600 font-sans"
                                                    autoFocus
                                                />
                                            ) : (
                                                <textarea
                                                    value={wizardData.description}
                                                    onChange={(e) => setWizardData(prev => ({ ...prev, description: e.target.value }))}
                                                    placeholder="اكتب وصفاً تفصيلياً هنا..."
                                                    rows={5}
                                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder:text-slate-600 resize-none font-sans"
                                                    autoFocus
                                                />
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {wizardStep === 4 && (
                                    <motion.div
                                        key="step4"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="text-center font-sans">
                                            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <RocketLaunchIcon className="w-8 h-8 text-purple-400" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white mb-2">تأكيد البيانات</h2>
                                            <p className="text-slate-400">راجع البيانات قبل البدء في عملية البناء الذكي</p>
                                        </div>

                                        <div className="bg-slate-800/30 rounded-2xl p-6 space-y-4 border border-slate-800 font-sans text-right">
                                            <div className="flex items-center gap-4 justify-end">
                                                <div className="text-right">
                                                    <div className="text-slate-500 text-xs text-right">اسم المشروع</div>
                                                    <div className="text-white font-bold">{wizardData.name}</div>
                                                </div>
                                                <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden border border-slate-700">
                                                    {wizardData.icon ? <img src={wizardData.icon} className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-3 text-slate-600 font-sans" />}
                                                </div>
                                            </div>
                                            {isUrlMode && (
                                                <div>
                                                    <div className="text-slate-500 text-xs">الرابط المرجعي</div>
                                                    <div className="text-indigo-400 text-sm truncate">{wizardData.url}</div>
                                                </div>
                                            )}
                                            {!isUrlMode && (
                                                <div>
                                                    <div className="text-slate-500 text-xs">وصف المشروع</div>
                                                    <div className="text-white text-sm line-clamp-2">{wizardData.description}</div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </AnimatePresence>
                        </div>

                        <div className="mt-8 flex items-center justify-between gap-4 font-sans">
                            <button
                                onClick={() => setWizardStep(prev => prev - 1)}
                                disabled={wizardStep === 1 || isGenerating}
                                className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-medium transition-all ${
                                    wizardStep === 1 ? 'opacity-0 pointer-events-none' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                <ArrowRightIcon className="w-5 h-5 font-sans" />
                                السابق
                            </button>

                            <button
                                onClick={() => {
                                    if (isUrlMode) {
                                        if (wizardStep === 1) handleAnalyzeUrl();
                                        else if (wizardStep < 3) setWizardStep(prev => prev + 1);
                                        else handleGenerate();
                                    } else {
                                        if (wizardStep < 4) setWizardStep(prev => prev + 1);
                                        else handleGenerate();
                                    }
                                }}
                                disabled={isGenerating || isAnalyzingUrl || (isUrlMode ? (wizardStep === 1 && !wizardData.url) : ((wizardStep === 2 && !wizardData.name) || (wizardStep === 3 && !wizardData.description)))}
                                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all shadow-xl ${
                                    isGenerating || isAnalyzingUrl || (isUrlMode ? (wizardStep === 1 && !wizardData.url) : ((wizardStep === 2 && !wizardData.name) || (wizardStep === 3 && !wizardData.description)))
                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:-translate-y-0.5 active:translate-y-0 shadow-indigo-500/20'
                                }`}
                            >
                                {isGenerating || isAnalyzingUrl ? (
                                    <>
                                        <LoaderIcon className="w-5 h-5 animate-spin font-sans" />
                                        {isAnalyzingUrl ? 'جاري التحليل...' : 'جاري البناء...'}
                                    </>
                                ) : (
                                    <>
                                        {(isUrlMode ? wizardStep === 3 : wizardStep === 4) ? `ابدأ بناء المشروع` : 'التالي'}
                                        {(isUrlMode ? wizardStep === 3 : wizardStep === 4) ? <RocketLaunchIcon className="w-5 h-5 font-sans" /> : <ArrowLeftIcon className="w-5 h-5 font-sans" />}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        if (mode === 'idea') return renderIdeaWizard();

        const showFileUpload = mode === 'screen' || mode === 'recognizer' || mode === 'text';

        return (
            <div className="w-full max-w-xl mx-auto space-y-6 animate-fade-in">
                {renderUpdateModeCard()}

                {showFileUpload && (
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            {mode === 'recognizer' ? 'ارفع صورة الواجهة للتحليل' : 'ارفع صورًا للمساعدة (اختياري)'}
                        </label>
                        {files.length > 0 && (
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {files.map(file => (
                                    <div key={file.name} className="relative group aspect-square bg-slate-800 rounded-md">
                                        <img src={file.url} alt={file.name} className="w-full h-full object-cover rounded-md"/>
                                        <button onClick={() => removeFile(file.name)} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {mode === 'recognizer' ? (
                            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 text-sm p-3 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-lg hover:border-indigo-500 hover:bg-slate-700/50">
                               <UploadIcon className="w-5 h-5"/> <span>اختر صورة لتحليلها</span>
                            </button>
                        ) : (
                            <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center gap-2 text-sm w-full p-3 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-lg hover:border-indigo-500 hover:bg-slate-700/50">
                               <UploadIcon className="w-5 h-5"/> <span>انقر للرفع أو اسحب الملفات هنا</span>
                            </label>
                        )}
                        <input id="file-upload" ref={fileInputRef} type="file" multiple={mode !== 'recognizer' && mode !== 'text'} accept="image/*,.zip,application/zip" className="hidden" onChange={handleFileChange} />
                     </div>
                )}
                
                {mode === 'recognizer' && (
                    <div className="space-y-4">
                        <button onClick={handleAnalyzeUI} disabled={isAnalyzing || files.length === 0} className="w-full bg-purple-600 hover:bg-purple-500 font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-500">
                             {isAnalyzing ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                             {isAnalyzing ? 'جاري التحليل...' : 'تحليل الواجهة'}
                        </button>
                        {recognitionResult && (
                            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 animate-fade-in space-y-3">
                                {recognitionResult.originalAppName && (
                                    <div className="flex items-center gap-2 text-amber-400 bg-amber-900/20 p-2 rounded-md border border-amber-500/30">
                                        <ShieldIcon className="w-5 h-5" />
                                        <p className="text-sm"><strong>تم اكتشاف تطبيق:</strong> {recognitionResult.originalAppName}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs text-slate-400">الاسم المقترح (آمن للاستخدام):</label>
                                    <input 
                                        type="text" 
                                        value={projectName} 
                                        onChange={e => setProjectName(e.target.value)} 
                                        className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white text-sm mt-1"
                                    />
                                </div>
                                {recognitionResult.ipModifications && recognitionResult.ipModifications.length > 0 && (
                                    <div className="bg-indigo-900/20 p-3 rounded-md border border-indigo-500/30">
                                        <h5 className="text-xs font-bold text-indigo-300 mb-2">تعديلات مقترحة للملكية الفكرية:</h5>
                                        <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                                            {recognitionResult.ipModifications.map((mod, i) => <li key={i}>{mod}</li>)}
                                        </ul>
                                    </div>
                                )}
                                <p className="text-sm text-slate-300 mt-2"><strong>الوصف:</strong> "{recognitionResult.description}"</p>
                            </div>
                        )}
                    </div>
                )}

                {(mode === 'text' || mode === 'screen') && (
                     <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-300">صف مشروعك</label>
                            {mode === 'screen' && (
                                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                                    <UploadIcon className="w-4 h-4" />
                                    رفع الصور
                                </button>
                            )}
                        </div>
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            rows={mode === 'screen' ? 4 : 8}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3"
                            placeholder={mode === 'screen' ? 'مثال: حوّل هذه الواجهة إلى موقع تفاعلي. يجب أن يكون الزر قابلاً للنقر...' : 'مثال: أنشئ صفحة هبوط لمنتج جديد لبيع القهوة المختصة...'}
                        />
                     </div>
                )}
                
                <div className="border-t border-slate-700 pt-6 space-y-4">
                    {/* Only show project name input if NOT in recognizer mode (since recognizer handles it differently) */}
                    {mode !== 'recognizer' && (
                        <div className="grid grid-cols-1 gap-4">
                             <div className="space-y-2">
                                 <label className="text-sm font-medium text-slate-300">اسم المشروع</label>
                                 <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5"/>
                             </div>
                        </div>
                    )}
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">أيقونة المشروع (اختياري)</label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                {projectIconUrl ? (
                                    <img src={projectIconUrl} alt="Icon Preview" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <BriefcaseIcon className="w-8 h-8 text-slate-500"/>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="icon-upload-generator" className="cursor-pointer bg-slate-600 hover:bg-slate-500 text-sm py-2 px-3 rounded-lg flex items-center justify-center gap-2">
                                    <UploadIcon className="w-4 h-4" />
                                    <span>رفع أيقونة</span>
                                </label>
                                <input id="icon-upload-generator" type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
                                <button onClick={handleGenerateIcon} disabled={isGeneratingIcon} className="bg-indigo-600 hover:bg-indigo-500 text-sm py-2 px-3 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-500">
                                    {isGeneratingIcon ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                                    <span>إنشاء بواسطة AI</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleGenerate} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                        <RocketLaunchIcon className="w-5 h-5"/>
                        {isUpdateMode ? 'تحديث وتطوير كود المشروع 🔄' : (mode === 'recognizer' ? 'بناء المشروع (النسخة الآمنة)' : 'ابنِ المشروع')}
                    </button>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                </div>
            </div>
        )
    };
    
    const renderGeneratorView = () => (
        <div className="p-4 md:p-8 h-full flex flex-col items-center justify-center">
             {isGenerating ? <LoadingScreen logs={logs} projectType={projectType}/> : (
                <>
                    <header className="flex-shrink-0 flex justify-between items-center w-full max-w-3xl mb-8">
                         <div className="flex items-center gap-4">
                             {screen === 'generator' && mode !== 'draw' && <button onClick={() => setScreen('list')} className="p-2 rounded-full hover:bg-slate-700">
                                <ArrowLeftIcon className="w-5 h-5"/>
                            </button>}
                             <div className="flex items-center gap-3">
                                {pageConfig.icon}
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-100">{pageConfig.title}</h2>
                                    <p className="text-slate-400 text-sm">ابدأ مشروعك التالي الآن.</p>
                                </div>
                             </div>
                         </div>
                          <div className="flex items-center gap-2">
                            <button onClick={handleSaveSession} title="حفظ الجلسة الحالية" className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">
                                <SaveIcon className="w-5 h-5" />
                            </button>
                             <button onClick={handleClearSession} title="مسح وبدء جديد" className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                         </div>
                    </header>
                    <div className="flex-grow w-full overflow-y-auto pr-2 flex flex-col items-center">
                        <div className="w-full flex justify-center">
                            {renderGeneratorInputs()}
                        </div>
                        
                        <div className="mt-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl p-6 w-full max-w-3xl">
                            <p className="text-slate-500 text-[13px] mb-4">هل تواجه صعوبة في وصف فكرتك؟ تعلم أسرار الهندسة الوصفية في أكاديميتنا.</p>
                            <button 
                                onClick={() => navigate('guide')}
                                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold px-6 py-2 border border-indigo-500/30 rounded-xl hover:bg-indigo-500/10 transition-all text-sm"
                            >
                                <AcademicCapIcon className="w-4 h-4" />
                                زيارة الأكاديمية التعليمية
                            </button>
                        </div>
                    </div>
                    {saveStatus && <p className="text-xs text-green-400 text-center mt-2 fixed bottom-4">{saveStatus}</p>}
                </>
            )}
        </div>
    );
    
    const renderEditorView = () => (
        <div className="side-ide-main">
            <div className="flex-shrink-0 flex items-center justify-between p-2 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <button onClick={() => {
                        // If an override is provided (e.g., by DrawToCode), use it.
                        // Otherwise, default behavior: go back to list
                        if (onNewProject && mode === 'draw') {
                            onNewProject();
                        } else {
                            setScreen('list');
                        }
                    }} className="p-2 rounded-full hover:bg-slate-700">
                        <ArrowLeftIcon className="w-5 h-5"/>
                    </button>
                    <h3 className="font-bold text-white truncate max-w-xs">{project?.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <div ref={shareMenuRef} className="relative">
                        <button onClick={() => setIsShareMenuOpen(prev => !prev)} title="مشاركة" className="p-2 rounded-full hover:bg-slate-700">
                           <Share2Icon className="w-5 h-5"/>
                        </button>
                        {isShareMenuOpen && (
                            <div className="kebab-menu-dropdown text-right z-50">
                                <button onClick={() => handleShare('link')} className="w-full text-sm flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-slate-700">مشاركة الرابط</button>
                                <button onClick={() => handleShare('files')} className="w-full text-sm flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-slate-700">مشاركة الملفات</button>
                                {project?.publicShareId && (
                                    <button onClick={async () => {
                                        setIsShareMenuOpen(false);
                                        await updateDoc(doc(db, 'projects', project.id), {
                                            publicShareId: ''
                                        });
                                        setProject((prev: any) => prev ? { ...prev, publicShareId: '' } : prev);
                                    }} className="w-full text-sm flex items-center gap-3 px-3 py-1.5 rounded-md text-red-500 hover:bg-slate-700">إلغاء الرابط العام</button>
                                )}
                            </div>
                        )}
                    </div>
                     <div ref={convertMenuRef} className="relative">
                        <button onClick={() => setIsConvertMenuOpen(prev => !prev)} title="تحويل المشروع" className="p-2 rounded-full hover:bg-slate-700">
                           <ArrowPathIcon className="w-5 h-5"/>
                        </button>
                        {isConvertMenuOpen && (
                            <div className="absolute left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg py-1 z-20">
                                <p className="px-3 py-1 text-xs text-slate-400">تحويل إلى...</p>
                                {conversionTargets
                                    .filter(t => t.view !== creationModeForThisView)
                                    .map(target => (
                                    <button
                                        key={target.view}
                                        onClick={() => {
                                            navigate(target.view, { project });
                                            setIsConvertMenuOpen(false);
                                        }}
                                        className="w-full text-right block px-3 py-1.5 text-sm hover:bg-slate-700"
                                    >
                                        {target.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={() => handleOpenBuildModal('web')} title="تحميل المشروع" className="p-2 rounded-full hover:bg-slate-700">
                        <ArrowDownTrayIcon className="w-5 h-5"/>
                    </button>
                    <button 
                         onClick={() => navigate('preview', { project, projectFiles })} 
                         className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        نقل للمعاينة
                    </button>
                    <button onClick={() => setIsBuildInstructionsModalOpen(true)} title="تعليمات البناء" className="p-2 rounded-full hover:bg-slate-700 text-indigo-400 hover:text-indigo-300">
                        <InformationCircleIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => setIsAnalysisModalOpen(true)} title="تحليل الجودة" className="p-2 rounded-full hover:bg-slate-700">
                        <ShieldCheckIcon className="w-5 h-5"/>
                    </button>
                    {isOwner && (
                        <button 
                            onClick={() => {
                                setIsVisualEditMode(!isVisualEditMode);
                                setCommandBarState(null);
                            }} 
                            title="المحرر المرئي" 
                            className={`p-2 rounded-full transition-all ${isVisualEditMode ? 'bg-indigo-600 text-white animate-pulse' : 'hover:bg-slate-700 text-slate-300'}`}
                        >
                            <CommandLineIcon className="w-5 h-5"/>
                        </button>
                    )}
                    {isOwner && (
                        <button onClick={handleSaveSnapshot} disabled={isSavingSnapshot} title="حفظ نسخة احتياطية (Snapshot)" className="p-2 rounded-full hover:bg-slate-700 text-amber-400">
                            {isSavingSnapshot ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <CameraIcon className="w-5 h-5"/>}
                        </button>
                    )}
                    {isOwner && (
                        <button onClick={() => handleDeleteProject(project!.id)} title="حذف المشروع" className="p-2 rounded-full hover:bg-slate-700 text-red-400 hover:text-red-300">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    )}
                </div>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <div className={`w-full ${sidebarTab === 'hybrid' ? 'md:w-[50%] lg:w-[600px]' : 'md:w-[320px]'} flex flex-col min-h-0 border-r border-slate-700 bg-slate-800/20 transition-all duration-300`}>
                    <div className="flex bg-slate-800/40 border-b border-slate-700 overflow-x-auto custom-scrollbar">
                        <button onClick={() => setSidebarTab('chat')} className={`flex-shrink-0 px-3 py-3 text-[11px] font-bold transition-all ${sidebarTab === 'chat' ? 'text-indigo-400 bg-indigo-500/5 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}>الدردشة</button>
                        <button onClick={() => setSidebarTab('files')} className={`flex-shrink-0 px-3 py-3 text-[11px] font-bold transition-all ${sidebarTab === 'files' ? 'text-indigo-400 bg-indigo-500/5 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}>الملفات</button>
                        <button onClick={() => setSidebarTab('snapshots')} className={`flex-shrink-0 px-3 py-3 text-[11px] font-bold transition-all ${sidebarTab === 'snapshots' ? 'text-indigo-400 bg-indigo-500/5 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}>النسخ</button>
                        <button onClick={() => setSidebarTab('build')} className={`flex-shrink-0 px-3 py-3 text-[11px] font-bold transition-all ${sidebarTab === 'build' ? 'text-indigo-400 bg-indigo-500/5 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}>بناء</button>
                        <button onClick={() => setSidebarTab('hybrid')} className={`flex-shrink-0 px-3 py-3 text-[11px] font-bold transition-all ${sidebarTab === 'hybrid' ? 'text-indigo-400 bg-indigo-500/5 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}>المعمارية الهجينة ⚡</button>
                        <button onClick={() => setSidebarTab('roadmap')} className={`flex-shrink-0 px-3 py-3 text-[11px] font-bold transition-all ${sidebarTab === 'roadmap' ? 'text-indigo-400 bg-indigo-500/5 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}>الخطة</button>
                    </div>
                    
                    <div className="flex-grow overflow-hidden relative">
                        {sidebarTab === 'roadmap' && renderRoadmapTab()}
                        {sidebarTab === 'chat' && (
                            <div className="flex flex-col h-full bg-slate-900/30 relative">
                                <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                    {messages.map(msg => (
                                        <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                                                {msg.text}
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="mt-2 grid grid-cols-2 gap-1">
                                                        {msg.attachments.map((att, i) => (
                                                            <img key={i} src={att.url} alt={att.name} className="w-full aspect-square object-cover rounded-lg" />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {isChatLoading && (
                                        <div className="flex flex-col items-start pb-2">
                                            <div className="max-w-[90%] p-3 rounded-2xl rounded-tl-none bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-2 shadow-lg">
                                                <span className="text-xs font-semibold text-slate-300">جاري تنفيذ التعديلات</span>
                                                <div className="typing-indicator text-indigo-400">
                                                    <span></span>
                                                    <span></span>
                                                    <span></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* أزرار الانتقال للأعلى والأسفل */}
                                <div className="absolute right-4 bottom-22 flex flex-col gap-2 z-30">
                                    <button 
                                        onClick={handleScrollChatToTop} 
                                        title="انتقال لأعلى الدردشة" 
                                        className="w-8 h-8 rounded-full bg-slate-800/95 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700/60 backdrop-blur-md transition-all shadow-lg active:scale-95 group hover:border-slate-600 hover:shadow-indigo-500/10 hover:shadow-md"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-y-0.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={handleScrollChatToBottom} 
                                        title="انتقال لأسفل الدردشة" 
                                        className="w-8 h-8 rounded-full bg-slate-800/95 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700/60 backdrop-blur-md transition-all shadow-lg active:scale-95 group hover:border-slate-600 hover:shadow-indigo-500/10 hover:shadow-md"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:translate-y-0.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </button>
                                </div>
                                
                                <div className="p-3 border-t border-slate-800 bg-slate-900/50">
                                    {!isOwner && (
                                        <div className="absolute inset-x-0 bottom-0 top-0 bg-slate-900/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4 text-center">
                                            <ShieldIcon className="w-8 h-8 text-indigo-400 mb-2" />
                                            <p className="text-[10px] text-slate-300 leading-relaxed font-bold">هذا المشروع في وضع القراءة فقط.<br/>لا يمكنك الدردشة مع مساعد الذكاء الاصطناعي لتعديله.</p>
                                        </div>
                                    )}
                                    {chatImages.length > 0 && (
                                        <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                                            {chatImages.map(img => (
                                                <div key={img.name} className="relative flex-shrink-0">
                                                    <img src={img.url} className="w-10 h-10 object-cover rounded-lg border border-slate-700" alt="attachment preview" />
                                                    <button onClick={() => removeChatImage(img.name)} className="absolute -top-1 -right-1 p-0.5 bg-red-600 rounded-full shadow-lg border border-slate-900"><CloseIcon className="w-2 h-2 text-white"/></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="bg-slate-800 rounded-xl flex items-center p-1.5 gap-2 border border-slate-700 shadow-inner">
                                        <button 
                                            onClick={() => chatFileInputRef.current?.click()} 
                                            className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-700 rounded-lg transition-all"
                                            disabled={chatImages.length >= 3}
                                        >
                                            <UploadIcon className="w-4.5 h-4.5" />
                                        </button>
                                        <input ref={chatFileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleChatFileChange} />
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                                            placeholder={isOwner ? "اطلب تعديلاً..." : "عرض فقط..."}
                                            className="flex-1 bg-transparent focus:outline-none px-1 text-slate-100 placeholder:text-slate-600 text-[13px]"
                                            disabled={isChatLoading || !isOwner}
                                        />
                                        <button onClick={handleChatSend} disabled={(!input.trim() && chatImages.length === 0) || isChatLoading || !isOwner} className="bg-indigo-600 text-white rounded-lg p-2 disabled:bg-slate-700 transition-all shadow-md active:scale-95">
                                            {isChatLoading ? <SpinnerIcon className="w-4.5 h-4.5 animate-spin"/> : <SendIcon className="w-4.5 h-4.5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {sidebarTab === 'files' && (
                            <div className="flex flex-col h-full bg-slate-900/30 p-2 space-y-1 overflow-y-auto custom-scrollbar">
                                {[...projectFiles].sort((a, b) => {
                                    const trinity = ['index.html', 'style.css', 'script.js'];
                                    const aIdx = trinity.indexOf(a.name);
                                    const bIdx = trinity.indexOf(b.name);
                                    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                                    if (aIdx !== -1) return -1;
                                    if (bIdx !== -1) return 1;
                                    return a.name.localeCompare(b.name);
                                }).map(file => (
                                    <button 
                                        key={file.name} 
                                        onClick={() => setActiveFile(file.name)} 
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs transition-all ${activeFile === file.name ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <FileIcon lang={file.language}/> {file.name}
                                        </span>
                                        {activeFile === file.name && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                    </button>
                                ))}

                                {projectFiles.length < 3 && (
                                    <div className="mt-6 px-2 py-4 border-t border-slate-800/50">
                                        <p className="text-[10px] text-slate-500 mb-2 text-center">يبدو أن ملفات البرمجة الأساسية مفقودة</p>
                                        <button 
                                            onClick={handleRepairProject}
                                            disabled={isGenerating}
                                            className="w-full flex items-center justify-center gap-2 py-2 pr-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl text-[10px] font-bold hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-50"
                                        >
                                            {isGenerating ? <SpinnerIcon className="w-3 h-3 animate-spin" /> : <ArrowPathIcon className="w-3 h-3" />}
                                            إنشاء ملفات HTML/CSS/JS المفقودة
                                        </button>
                                    </div>
                                )}

                                <div className="mt-4 p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl relative space-y-2 text-right">
                                    <div className="flex items-center gap-2 justify-end text-emerald-400">
                                        <h5 className="font-bold text-xs font-sans">نظام الإصلاح ومكافحة الثغرات</h5>
                                        <WrenchScrewdriverIcon className="w-4 h-4" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">
                                        يكتشف هذا النموذج المشاكل، والخلل البنيوي بالأكواد، وثغرات XSS الأمنية، والمشاكل التقنية، ويعيد حلها بالكامل وبشكل جذري وتلقائي.
                                    </p>
                                    <button 
                                        onClick={handleAutoRepair}
                                        disabled={isAutoRepairing}
                                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600/15 hover:bg-emerald-600/35 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-inner"
                                    >
                                        {isAutoRepairing ? (
                                            <>
                                                <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
                                                <span>جاري الإصلاح وتأمين الأكواد...</span>
                                            </>
                                        ) : (
                                            <>
                                                <SparklesIcon className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                                                <span>تفعيل الإصلاح التلقائي</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                        {sidebarTab === 'snapshots' && (
                            <div className="flex flex-col h-full bg-slate-900/30 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                                {isLoadingSnapshots ? (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                        <SpinnerIcon className="w-6 h-6 animate-spin mb-2" />
                                        <p className="text-xs">جاري تحميل النسخ الاحتياطية...</p>
                                    </div>
                                ) : snapshots.length === 0 ? (
                                    <div className="text-center py-10 opacity-40">
                                        <CameraIcon className="w-10 h-10 mx-auto mb-2" />
                                        <p className="text-xs">لا توجد نسخ احتياطية بعد.</p>
                                    </div>
                                ) : snapshots.map(snap => (
                                    <button 
                                        key={snap.id} 
                                        onClick={() => handleRestoreSnapshot(snap)}
                                        className="w-full text-right p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] text-indigo-400 font-bold">{snap.projectFiles?.length || 0} ملف</span>
                                            <span className="text-[9px] text-slate-500">{new Date(snap.timestamp?.seconds * 1000).toLocaleTimeString('ar-EG')}</span>
                                        </div>
                                        <p className="text-xs text-white group-hover:text-amber-400 transition-colors truncate">{snap.name}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                        {sidebarTab === 'build' && (
                            <div className="flex flex-col h-full bg-slate-900/30 p-4 space-y-6 overflow-y-auto custom-scrollbar">
                                <div className="text-right">
                                    <h4 className="text-white font-bold text-lg mb-1">مركز البناء والتصدير</h4>
                                    <p className="text-slate-400 text-xs">قم بتحويل مشروعك إلى تطبيق حقيقي بضغطة زر واحدة.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl space-y-4">
                                        <div className="flex items-center gap-3 justify-end mb-2">
                                            <div className="text-right">
                                                <h5 className="text-white font-bold text-sm">تطبيق الويب (Live)</h5>
                                                <p className="text-[10px] text-slate-500">نشر مباشر برابط https://</p>
                                            </div>
                                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                                <GlobeAltIcon className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleOpenBuildModal('web')}
                                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <RocketLaunchIcon className="w-4 h-4" />
                                            نشر المشروع وطلب الرابط
                                        </button>
                                    </div>

                                    <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl space-y-4">
                                        <div className="flex items-center gap-3 justify-end mb-2">
                                            <div className="text-right">
                                                <h5 className="text-white font-bold text-sm">تطبيقات الهاتف (Native)</h5>
                                                <p className="text-[10px] text-slate-500">توليد ملفات APK و IPA</p>
                                            </div>
                                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                                <DevicePhoneMobileIcon className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            <button 
                                                onClick={() => handleOpenBuildModal('android')}
                                                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all border border-slate-600 flex items-center justify-center gap-2"
                                            >
                                                <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center"><CheckIcon className="w-3 h-3 text-green-400" /></div>
                                                إنشاء ملف Android (APK)
                                            </button>
                                            <button 
                                                onClick={() => handleOpenBuildModal('ios')}
                                                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all border border-slate-600 flex items-center justify-center gap-2"
                                            >
                                                <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center"><CheckIcon className="w-3 h-3 text-blue-400" /></div>
                                                إنشاء ملف iOS (IPA)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl space-y-4">
                                        <div className="flex items-center gap-3 justify-end mb-2">
                                            <div className="text-right">
                                                <h5 className="text-white font-bold text-sm">المصدر المفتوح (ZIP)</h5>
                                                <p className="text-[10px] text-slate-500">تجميع كافة الملفات</p>
                                            </div>
                                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                                <ArrowDownTrayIcon className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                const zip = new (window as any).JSZip();
                                                projectFiles.forEach(f => zip.file(f.name, f.content));
                                                const content = await zip.generateAsync({ type: 'blob' });
                                                const url = URL.createObjectURL(content);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `${project?.name || 'project'}.zip`;
                                                document.body.appendChild(a);
                                                a.click();
                                                document.body.removeChild(a);
                                                URL.revokeObjectURL(url);
                                            }}
                                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <ArrowDownTrayIcon className="w-4 h-4" />
                                            تنزيل المشروع (ZIP)
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                                    <p className="text-[10px] text-amber-200 text-right leading-relaxed font-sans">
                                        <strong>ملاحظة:</strong> يتم تجميع ملفات HTML و CSS و JavaScript تلقائياً لتعمل كأداة متكاملة فور التحميل أو النشر.
                                    </p>
                                </div>
                            </div>
                        )}
                        {sidebarTab === 'hybrid' && (
                            <div className="h-full bg-slate-900/30 overflow-hidden">
                                <HybridBridgeSuite
                                    project={project!}
                                    projectFiles={projectFiles}
                                    onUpdateProjectFiles={(updatedFiles) => {
                                        setProjectFiles(updatedFiles);
                                        updatedFiles.forEach(async (f) => {
                                            await persistenceService.saveFile(project!.id, f);
                                        });
                                    }}
                                    onUpdateProjectMetadata={async (updatedMetadata) => {
                                        const newProj = { ...project!, ...updatedMetadata };
                                        setProject(newProj);
                                        await persistenceService.saveProjectMetadata(newProj);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
                    <div className="w-full md:w-1/2 flex flex-col min-h-0 border-r border-slate-800/80">
                        {/* Interactive File Selector Tabs */}
                        <div className="bg-slate-900/95 border-b border-slate-800/60 p-1.5 flex flex-wrap items-center justify-between gap-1.5 font-sans">
                            <div className="flex flex-wrap items-center gap-1">
                                {[...projectFiles].sort((a, b) => {
                                    const trinity = ['index.html', 'style.css', 'script.js'];
                                    const aIdx = trinity.indexOf(a.name);
                                    const bIdx = trinity.indexOf(b.name);
                                    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                                    if (aIdx !== -1) return -1;
                                    if (bIdx !== -1) return 1;
                                    return a.name.localeCompare(b.name);
                                }).map(file => (
                                    <button
                                        key={file.name}
                                        onClick={() => {
                                            setActiveFile(file.name);
                                            setIsTrinityMultiView(false);
                                        }}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${(!isTrinityMultiView && activeFile === file.name) ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
                                    >
                                        <FileIcon lang={file.language}/>
                                        <span>{file.name}</span>
                                    </button>
                                ))}
                            </div>
                            
                            {/* Trinity View Toggle Tab */}
                            <button
                                onClick={() => {
                                    setIsTrinityMultiView(!isTrinityMultiView);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isTrinityMultiView ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white shadow-md shadow-indigo-500/10' : 'text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-300'}`}
                            >
                                <SparklesIcon className="w-3.5 h-3.5" />
                                <span>العرض الثلاثي المدمج 🌟</span>
                            </button>
                        </div>

                        {/* Banner for Single View index.html inviting to Multi View */}
                        {!isTrinityMultiView && activeFile === 'index.html' && (
                            <div className="bg-indigo-500/5 border-b border-indigo-500/10 px-4 py-2 text-right flex items-center justify-between gap-2 text-xs">
                                <span className="text-indigo-300 font-sans flex items-center gap-1.5">
                                    <SparklesIcon className="w-3.5 h-3.5 text-indigo-400" />
                                    متاح الآن: عرض وتعديل الأكواد الثلاثة (HTML, CSS, JS) معاً في نفس الوقت!
                                </span>
                                <button
                                    onClick={() => setIsTrinityMultiView(true)}
                                    className="px-2.5 py-1 bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all rounded-md font-bold text-[10px]"
                                >
                                    تفعيل العرض الثلاثي المشترك ⚡
                                </button>
                            </div>
                        )}

                        {/* Editor workspace pane */}
                        {isTrinityMultiView ? (
                            <div className="flex-grow flex flex-col overflow-y-auto bg-slate-950 p-3 space-y-3.5 custom-scrollbar text-right">
                                {[
                                    { name: 'index.html', title: 'HTML (index.html)', lang: 'html', color: 'border-orange-500/20 hover:border-orange-500/40' },
                                    { name: 'style.css', title: 'CSS (style.css)', lang: 'css', color: 'border-cyan-500/20 hover:border-cyan-500/40' },
                                    { name: 'script.js', title: 'JavaScript (script.js)', lang: 'javascript', color: 'border-yellow-500/20 hover:border-yellow-500/40' }
                                ].map((trinityFile) => {
                                    const fileData = projectFiles.find(f => f.name === trinityFile.name);
                                    const content = fileData?.content || '';
                                    return (
                                        <div key={trinityFile.name} className={`flex flex-col border rounded-xl bg-slate-900/40 overflow-hidden transition-all ${trinityFile.color}`}>
                                            <div className="bg-slate-900/80 px-4 py-1.5 flex items-center justify-between border-b border-slate-800/80">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(content);
                                                    }}
                                                    className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-slate-300 rounded transition-colors font-sans"
                                                >
                                                    نسخ الكود
                                                </button>
                                                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-2">
                                                    <FileIcon lang={trinityFile.lang as any} />
                                                    {trinityFile.title}
                                                </span>
                                            </div>
                                            <textarea
                                                className="w-full h-48 bg-slate-950 p-4 font-mono text-[12px] leading-relaxed resize-none focus:outline-none text-slate-300 custom-scrollbar focus:ring-1 focus:ring-indigo-500/30 selection:bg-indigo-500/20"
                                                spellCheck="false"
                                                value={content}
                                                onChange={(e) => {
                                                    const newContent = e.target.value;
                                                    setProjectFiles(prev => prev.map(f => f.name === trinityFile.name ? { ...f, content: newContent } : f));
                                                }}
                                                placeholder={`أدخل كود ${trinityFile.title} هنا...`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <textarea
                                className="flex-grow bg-slate-950 p-6 font-mono text-[13px] leading-relaxed resize-none focus:outline-none text-slate-300 custom-scrollbar selection:bg-indigo-500/30"
                                spellCheck="false"
                                value={projectFiles.find(f => f.name === activeFile)?.content || ''}
                                onChange={(e) => {
                                    const newContent = e.target.value;
                                    setProjectFiles(prev => prev.map(f => f.name === activeFile ? { ...f, content: newContent } : f));
                                }}
                            />
                        )}
                    </div>
                    
                    <div className="w-full md:w-1/2 flex flex-col min-h-0 relative">
                        <div className="bg-slate-900/80 px-4 py-2 flex items-center justify-between border-b border-slate-800/50">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">المعاينة الحية</span>
                            <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-lg">
                                <button onClick={() => setDevice('desktop')} className={`p-1 rounded-md transition-all ${device === 'desktop' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><ComputerDesktopIcon className="w-3.5 h-3.5"/></button>
                                <button onClick={() => setDevice('mobile')} className={`p-1 rounded-md transition-all ${device === 'mobile' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><DevicePhoneMobileIcon className="w-3.5 h-3.5"/></button>
                            </div>
                        </div>

                        {/* نظام الإصلاح ومكافحة الثغرات التلقائي الذكي */}
                        {(staticIssues.length > 0 || iframeErrors.length > 0 || isAutoRepairing) && (
                            <div className="bg-rose-950/25 border-b border-rose-500/20 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in text-right">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 animate-pulse flex-shrink-0">
                                        <WrenchScrewdriverIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h5 className="text-white text-xs font-bold font-sans">تم رصد أخطاء أو ثغرات برمجية في مشروعك!</h5>
                                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                                            المشاكل المكتشفة: {staticIssues.length + iframeErrors.length} (تشمل {staticIssues.length} عيوب هيكلية/تأمين و {iframeErrors.length} أخطاء تشغيلية)
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                    <button
                                        onClick={() => setShowDetailedIssues(!showDetailedIssues)}
                                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg transition-all"
                                    >
                                        <span>{showDetailedIssues ? 'إخفاء التفاصيل' : 'استعراض التفاصيل'}</span>
                                    </button>
                                    <button
                                        onClick={handleAutoRepair}
                                        disabled={isAutoRepairing}
                                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg shadow-lg active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {isAutoRepairing ? (
                                            <>
                                                <SpinnerIcon className="w-3 h-3 animate-spin" />
                                                <span>جاري الإصلاح والتحصين...</span>
                                            </>
                                        ) : (
                                            <>
                                                <SparklesIcon className="w-3 h-3 text-amber-300 animate-pulse" />
                                                <span>إصلاح تلقائي للثغرات والأعطال فوراً</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {showDetailedIssues && (staticIssues.length > 0 || iframeErrors.length > 0) && (
                            <div className="bg-slate-900 border-b border-slate-800/80 p-3.5 space-y-2.5 animate-fade-in text-right">
                                <span className="text-[10px] font-bold text-slate-400 block mb-1">تفاصيل الثغرات وعناصر الخلل المكتشفة في الكود (HTML و CSS و JavaScript):</span>
                                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                    {staticIssues.map((issue, idx) => {
                                        const typeStyles = {
                                            html: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                                            css: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                                            js: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        };
                                        const typeLabels = {
                                            html: 'هيكل HTML',
                                            css: 'تنسيقات CSS',
                                            js: 'تفاعل JS'
                                        };
                                        const severityLabels = {
                                            error: 'خطأ برمجي',
                                            vulnerability: 'ثغرة أمنية ⚠️',
                                            warning: 'تنبيه/تحسين'
                                        };
                                        const severityColors = {
                                            error: 'text-red-400 font-semibold',
                                            vulnerability: 'text-rose-400 font-extrabold animate-pulse',
                                            warning: 'text-amber-400'
                                        };
                                        return (
                                            <div key={`static-${idx}`} className="flex items-start sm:items-center justify-between gap-3 bg-slate-800/30 border border-slate-800 rounded-xl p-2.5 transition-all hover:bg-slate-800/50">
                                                <div className="flex items-start gap-2.5 text-[11px] justify-start">
                                                    <span className="text-amber-500 mt-0.5">⚡</span>
                                                    <div className="text-right">
                                                        <span className="text-slate-200 leading-relaxed block">{issue.text}</span>
                                                        <p className="flex items-center gap-1.5 mt-1">
                                                            <span className="text-[10px] text-slate-500">حالة الخلل:</span>
                                                            <span className={`text-[10px] ${severityColors[issue.severity]}`}>{severityLabels[issue.severity]}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold border flex-shrink-0 ${typeStyles[issue.type]}`}>
                                                    {typeLabels[issue.type]}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {iframeErrors.map((err, idx) => (
                                        <div key={`inline-${idx}`} className="flex items-start justify-between gap-3 bg-rose-500/5 border border-rose-500/10 rounded-xl p-2.5">
                                            <div className="flex items-start gap-2.5 text-[11px] justify-start text-rose-400">
                                                <span>❌</span>
                                                <div className="text-right">
                                                    <span className="leading-relaxed block font-semibold">خطأ تشغيلي (Runtime Error): {err.message}</span>
                                                    {err.lineno ? <span className="text-[9px] text-rose-300/60 block mt-0.5">السطر: {err.lineno} | العمود: {err.colno}</span> : null}
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold border bg-rose-500/10 text-rose-400 border-rose-500/20 flex-shrink-0">
                                                برمجة JS
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={`flex-grow flex items-center justify-center p-3 relative ${device === 'mobile' ? 'bg-slate-900/20' : ''}`}>
                            <div className={`transition-all duration-500 shadow-2xl overflow-hidden ${device === 'mobile' ? 'w-[320px] h-[580px] border-8 border-slate-800 rounded-[35px] relative' : 'w-full h-full rounded-xl border border-slate-800 bg-white relative'}`}>
                                <DevicePreview 
                                    srcDoc={srcDoc} 
                                    device={device} 
                                    isVisualEditMode={isVisualEditMode} 
                                />
                                {isVisualEditMode && commandBarState && (
                                    <div
                                        className="absolute bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-2xl flex items-center gap-2 animate-fade-in z-50 border-t-indigo-500"
                                        style={{ 
                                            top: Math.min(commandBarState.top + 5, 500), // Constraint it to stay in view
                                            left: Math.max(10, Math.min(commandBarState.left, device === 'mobile' ? 20 : 500)), 
                                            width: Math.min(commandBarState.width, device === 'mobile' ? 300 : 400)
                                        }}
                                    >
                                        <span className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded text-indigo-400 border border-slate-700"><span className="text-slate-500">&lt;</span>{commandBarState.tagName.toLowerCase()}<span className="text-slate-500">&gt;</span></span>
                                        <input
                                            type="text"
                                            value={visualEditCommand}
                                            onChange={e => setVisualEditCommand(e.target.value)}
                                            placeholder={`اطلب تعديلاً لهذا العنصر...`}
                                            className="flex-1 bg-slate-800 border border-slate-700 rounded-md p-1.5 text-white text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                            autoFocus
                                            onKeyPress={e => e.key === 'Enter' && handleVisualEditSubmit()}
                                        />
                                        <button onClick={handleVisualEditSubmit} disabled={isProcessingVisualEdit || !visualEditCommand} className="p-1.5 bg-indigo-600 rounded-md disabled:bg-slate-700 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                                            {isProcessingVisualEdit ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    
    if (isGenerating) return <LoadingScreen logs={logs} projectType={projectType}/>;

    return (
        <>
            {(() => {
                switch(screen) {
                    case 'list': return renderListView();
                    case 'generator': return renderGeneratorView();
                    case 'editor': return project ? (
                        <>
                            {renderEditorView()}
                            <BuildModal isOpen={isBuildModalOpen} onClose={() => setIsBuildModalOpen(false)} project={{ ...project, files: projectFiles }} platform={buildPlatform} onUpdateProject={updateProjectLocal} />
                            <BuildInstructionsModal isOpen={isBuildInstructionsModalOpen} onClose={() => setIsBuildInstructionsModalOpen(false)} />
                            <QualityAnalysisModal 
                                isOpen={isAnalysisModalOpen} 
                                onClose={() => setIsAnalysisModalOpen(false)} 
                                project={project}
                                onUpdateProject={(updatedProject) => {
                                    setProject(updatedProject);
                                    if (updatedProject.builderChat) {
                                        setMessages(updatedProject.builderChat);
                                    }
                                    if (currentUser?.email) {
                                        const key = `appProjects_${currentUser.email}`;
                                        const savedApps: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
                                        const updatedApps = savedApps.map(p => p.id === updatedProject.id ? updatedProject : p);
                                        localStorage.setItem(key, JSON.stringify(updatedApps));
                                    }
                                }}
                            />
                        </>
                    ) : renderListView();
                    default: return renderListView();
                }
            })()}
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
        </>
    );
};

export default SoftwareProjectBuilder;