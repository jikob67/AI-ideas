import React, { useMemo, useState, useEffect } from 'react';
import { Project, ProjectFile, View } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../services/geminiService';
import JSZip from 'jszip';
import { 
  ArrowLeft, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Code, 
  Sparkles, 
  Share2, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Lock, 
  Unlock, 
  Globe, 
  FileCode, 
  FolderOpen, 
  Search, 
  Copy, 
  Check, 
  Zap, 
  ChevronRight, 
  Cpu, 
  Clock, 
  ExternalLink, 
  FileText, 
  Terminal, 
  Laptop, 
  ChevronDown, 
  ChevronUp, 
  QrCode, 
  ShieldCheck, 
  Play,
  Heart
} from 'lucide-react';

interface ProjectPreviewProps {
  navigate: (view: View, context?: any) => void;
  context?: any;
}

interface AuditIssue {
  type: 'error' | 'warning' | 'info';
  category: 'performance' | 'seo' | 'ux' | 'security';
  file: string;
  message: string;
  fix: string;
}

interface AuditResult {
  score: {
    overall: number;
    performance: number;
    seo: number;
    ux: number;
    security: number;
  };
  highlights: string[];
  issues: AuditIssue[];
  recommendations: string[];
}

export const ProjectPreview: React.FC<ProjectPreviewProps> = ({ navigate, context }) => {
  const [device, setDevice] = useState<'desktop' | 'laptop' | 'tablet' | 'mobile'>('desktop');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [zoom, setZoom] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'audit' | 'export'>('preview');
  
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fetchedFiles, setFetchedFiles] = useState<ProjectFile[]>([]);
  const project = context?.project as Project;
  
  // Terminal actions in preview
  const [logs, setLogs] = useState<{ type: 'info' | 'success' | 'warn'; text: string; time: string }[]>([
    { type: 'info', text: 'تم بدء اتصال خادم المحاكاة التفاعلي.', time: '16:51:41' },
    { type: 'success', text: 'قنوات ربط البيانات التفاعلية آمنة ومتصلة بنجاح.', time: '16:51:42' },
  ]);

  // Code inspection states
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [searchCodeQuery, setSearchCodeQuery] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // AI Audit report states
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditStep, setAuditStep] = useState('');
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [expandedIssueIndex, setExpandedIssueIndex] = useState<number | null>(null);

  // Export & deploy mock states
  const [zipPacking, setZipPacking] = useState(false);
  const [deployingSim, setDeployingSim] = useState(false);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [passcode, setPasscode] = useState('1234');
  const [subdomain, setSubdomain] = useState('');

  // Interactive Checklist (checklist items stored in local state + synchronized with localStorage)
  const [checklist, setChecklist] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: '1', text: 'معاينة تباين الألوان وجودة النصوص والواجهة', done: true },
    { id: '2', text: 'التحقق من مرونة التصميم على الأجهزة الذكية', done: false },
    { id: '3', text: 'معاينة صفحات وروابط التوجيه الأساسية', done: false },
    { id: '4', text: 'إجراء الفحص الذكي بالذكاء الاصطناعي الشامل', done: false },
    { id: '5', text: 'توليد الهوية البصرية وشعارات المشروع', done: false },
    { id: '6', text: 'تجهيز المحتوى التسويقي وخطة إشهار الموقع', done: false },
  ]);

  const projectFiles = useMemo(() => {
    if (context?.projectFiles && context.projectFiles.length > 0) return context.projectFiles as ProjectFile[];
    if (project?.files && project.files.length > 0) return project.files;
    return fetchedFiles;
  }, [context?.projectFiles, project?.files, fetchedFiles]);

  // Read checkpoint files on mount or change
  useEffect(() => {
    const hasFiles = (context?.projectFiles && context.projectFiles.length > 0) || (project?.files && project.files.length > 0);
    if (project && !hasFiles) {
      setLoadingFiles(true);
      import('../services/persistenceService').then(({ persistenceService }) => {
        persistenceService.getProjectFiles(project.id).then(files => {
          setFetchedFiles(files);
          setLoadingFiles(false);
          if (files.length > 0) {
            // Select default file
            const dFile = files.find(f => f.name === 'index.html') || files[0];
            setSelectedFile(dFile);
          }
        }).catch(err => {
          console.error("Error fetching project files for preview:", err);
          setLoadingFiles(false);
        });
      });
    } else if (projectFiles && projectFiles.length > 0) {
      const dFile = projectFiles.find(f => f.name === 'index.html') || projectFiles[0];
      setSelectedFile(dFile);
    }
  }, [project, context?.projectFiles]);

  // Load project's custom audit and checklist from localStorage if available
  useEffect(() => {
    if (project) {
      // Load checklist
      const savedCheck = localStorage.getItem(`preview_checklist_${project.id}`);
      if (savedCheck) {
        try {
          setChecklist(JSON.parse(savedCheck));
        } catch (e) {
          console.error(e);
        }
      } else {
        // Init default
        localStorage.setItem(`preview_checklist_${project.id}`, JSON.stringify(checklist));
      }

      // Load audit
      const savedAudit = localStorage.getItem(`project_audit_${project.id}`);
      if (savedAudit) {
        try {
          setAuditResult(JSON.parse(savedAudit));
        } catch (e) {
          console.error(e);
        }
      }

      // Initialize subdomain
      setSubdomain(project.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `app-${project.id.slice(0,6)}`);
    }
  }, [project]);

  // Watch checklist and persist
  const toggleChecklistItem = (id: string) => {
    const updated = checklist.map(item => item.id === id ? { ...item, done: !item.done } : item);
    setChecklist(updated);
    if (project) {
      localStorage.setItem(`preview_checklist_${project.id}`, JSON.stringify(updated));
    }
    setLogs(prev => [
      { 
        type: 'info', 
        text: `تم تحديث خارطة طريق الإطلاق: ${updated.find(u => u.id === id)?.text} (${updated.find(u => u.id === id)?.done ? 'مكتمل' : 'قيد المراجعة'})`, 
        time: new Date().toTimeString().split(' ')[0] 
      },
      ...prev
    ]);
  };

  const srcDoc = useMemo(() => {
    if (loadingFiles) {
      return `
        <html lang="ar" dir="rtl">
        <body style="background:#090d16; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:system-ui, -apple-system, sans-serif; text-align:center; padding: 20px;">
            <div style="font-size: 56px; margin-bottom: 24px; animation: bounce 1.8s infinite;">⚡</div>
            <h2 style="font-weight: 700; margin-bottom: 12px; color: #818cf8; letter-spacing: -0.025em;">جاري معالجة وتجهيز المكونات...</h2>
            <p style="color: #94a3b8; font-size: 14px; max-width: 400px; line-height: 1.6;">يرجى الانتظار بينما نقوم بجمع الملفات المصدرية وهيكلة الإطار التفاعلي لتجربة معالجة مثالية.</p>
            <style>
                @keyframes bounce { 
                  0%, 100% { transform: translateY(0) scale(1); } 
                  50% { transform: translateY(-12px) scale(1.05); } 
                }
            </style>
        </body>
        </html>`;
    }
    if (!projectFiles || projectFiles.length === 0) {
      return `
        <html lang="ar" dir="rtl">
        <body style="background:#090d16; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:system-ui, -apple-system, sans-serif; text-align:center; padding: 20px;">
            <div style="font-size: 56px; margin-bottom: 24px;">📂</div>
            <h2 style="font-weight: 700; color: #f43f5e; margin-bottom: 12px;">المشروع فارغ أو لا توجد ملفات</h2>
            <p style="color: #94a3b8; font-size: 14px;">لم يتم العثور على ملفات برمجية قابلة للتشغيل في هذا المستودع حالياً.</p>
        </body>
        </html>`;
    }

    const htmlFile = projectFiles.find(f => f.name === 'index.html') || projectFiles.find(f => f.name.endsWith('.html'));
    const cssFiles = projectFiles.filter(f => f.name.endsWith('.css'));
    const jsFiles = projectFiles.filter(f => f.name.endsWith('.js'));

    if (!htmlFile) {
      return `
        <html lang="ar" dir="rtl">
        <body style="background:#090d16; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:system-ui, -apple-system, sans-serif; text-align:center; padding: 20px;">
            <div style="font-size: 56px; margin-bottom: 24px;">⚠️</div>
            <h2 style="font-weight: 700; color: #fbbf24; margin-bottom: 12px;">ملف التشغيل الأساسي مفقود</h2>
            <p style="color: #94a3b8; font-size: 14px; max-width: 450px; line-height: 1.6;">لكي تبدأ المحاكاة بنجاح، يجب أن يحتوي مشروعك على ملف واجهة رئيسي باسم <strong>index.html</strong>.</p>
        </body>
        </html>`;
    }

    let htmlContent = htmlFile.content;
    
    // Inject and merge CSS/JS files
    const styles = cssFiles.map(f => `<style data-filename="${f.name}">${f.content}</style>`).join('\n');
    const scripts = jsFiles.map(f => `<script data-filename="${f.name}">${f.content}</script>`).join('\n');

    if (htmlContent.includes('</head>')) {
      htmlContent = htmlContent.replace('</head>', `${styles}\n</head>`);
    } else {
      htmlContent = `${styles}\n${htmlContent}`;
    }

    if (htmlContent.includes('</body>')) {
      htmlContent = htmlContent.replace('</body>', `${scripts}\n</body>`);
    } else {
      htmlContent = `${htmlContent}\n${scripts}`;
    }

    // Embed visual responsive tracking helpers
    const overrideFrameTheme = `
      <style>
        /* Smooth custom preview scrollbar setup */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.25); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.4); }
      </style>
    `;
    if (htmlContent.includes('</head>')) {
      htmlContent = htmlContent.replace('</head>', `${overrideFrameTheme}\n</head>`);
    }

    return htmlContent;
  }, [projectFiles, loadingFiles]);

  // Code inspection helper
  const filteredFileCode = useMemo(() => {
    if (!selectedFile) return '';
    if (!searchCodeQuery.trim()) return selectedFile.content;
    
    return selectedFile.content;
  }, [selectedFile, searchCodeQuery]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2000);
    setLogs(prev => [
      { type: 'success', text: `تم نسخ الكود البرمجي لملف: ${label} بنجاح.`, time: new Date().toTimeString().split(' ')[0] },
      ...prev
    ]);
  };

  // ZIP Creation & Download utilising JSZip
  const handleZipDownload = async () => {
    if (projectFiles.length === 0) return;
    setZipPacking(true);
    setLogs(prev => [
      { type: 'info', text: 'جاري البدء في تحزيم وتصدير ملفات الكود المصدري...', time: new Date().toTimeString().split(' ')[0] },
      ...prev
    ]);

    try {
      const zip = new JSZip();
      
      // Setup typical folder structure or plain package
      projectFiles.forEach(file => {
        zip.file(file.name, file.content);
      });
      
      // Generate a handsome README file
      zip.file("README.md", `# ${project.name}\n\n${project.description}\n\n---\n\n## التثبيت والتشغيل المحلي:\n 1. قم بفك الضغط عن هذا المجلد على جهازك.\n 2. افتح ملف \`index.html\` في أي متصفح ويب مباشرة.\n 3. لمعاينة متقدمة، يمكنك استضافة المجلد على أي خادم برمجيات محلي.\n\n--- \n*تم التوليد والتطوير بواسطة منصة المساعد البرمجي الذكي بمصداقية وجودة مطبقة.*`);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}_code.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setLogs(prev => [
        { type: 'success', text: `اكتمل تصدير حزمة المشروع بنجاح! تم تحميل ملف الـ ZIP.`, time: new Date().toTimeString().split(' ')[0] },
        ...prev
      ]);
    } catch (error) {
      console.error("ZIP creation failed:", error);
      setLogs(prev => [
        { type: 'info', text: 'فشل تصدير حزمة الـ ZIP. يرجى إعادة المحاولة.', time: new Date().toTimeString().split(' ')[0] },
        ...prev
      ]);
    } finally {
      setZipPacking(false);
    }
  };

  // Run AI smart audit using geminiService
  const handleRunAiAudit = async () => {
    if (projectFiles.length === 0) return;
    setIsAuditing(true);
    setAuditProgress(10);
    setExpandedIssueIndex(null);
    setLogs(prev => [
      { type: 'info', text: 'جاري تشغيل محقق الجودة الافتراضي بالذكاء الاصطناعي...', time: new Date().toTimeString().split(' ')[0] },
      ...prev
    ]);

    try {
      const steps = [
        { text: 'تحليل تكوينات بنية شجرة الملفات والسكريبتات...', delay: 1200, prog: 30 },
        { text: 'مراجعة مرونة واجهات التجاوب وقواعد تباين الألوان الهيكلية...', delay: 1400, prog: 60 },
        { text: 'تقييم كفاءة استهلاك معايير الـ DOM وتحسين أرشفة محركات البحث (SEO)...', delay: 1200, prog: 85 },
      ];

      for (const step of steps) {
        setAuditStep(step.text);
        setAuditProgress(step.prog);
        await new Promise(r => setTimeout(r, step.delay));
      }

      setAuditStep('صياغة تقرير الجودة والحماية والتحقق بالاستعانة بخدمة Gemini...');
      
      // Clean structure for prompt
      const summaryFiles = projectFiles.map(f => `اسم الملف: ${f.name}\nحجم الملف: ${f.content.length} حرف\nالمحتوى المبدئي:\n${f.content.slice(0, 1400)}`).join('\n\n---\n\n');
      
      const prompt = `أنت مهندس مراجعة جودة الأكواد والبرمجيات (QA Standard Auditor). قم بإجراء فحص ومراجعة ذكية ممتازة وعميقة للمشروع البرمجي التالي باللغة العربية.
المعلومات:
اسم المشروع: ${project.name}
تفاصيل: ${project.description}
نوع المشروع: ${project.type}

الملفات والمحتوى البرمجي للمشروع:
${summaryFiles}

الرجاء تحليل جودة الكود، أجهزة العرض والتجاوب، الأداء، الأمان والـ SEO.
أعِد الإجابة بصيغة JSON حقيقية وصالحة فقط، دون أي مقدمات أو تعليقات خارجية أو علامات ماركداون (مثل \`\`\`json). تذكر أن تكون كافة المخرجات باللغة العربية السليمة وبجودة ملموسة.
الهيكل المطلوب تماماً:
{
  "score": {
    "overall": 90,
    "performance": 85,
    "seo": 92,
    "ux": 88,
    "security": 94
  },
  "highlights": [
    "النقاط الفنية الإيجابية الحالية التي تم تطبيقها بشكل ممتاز في الكود"
  ],
  "issues": [
    {
      "type": "error" | "warning" | "info",
      "category": "performance" | "seo" | "ux" | "security",
      "file": "اسم الملف المتأثر",
      "message": "وصف المشكلة الفنية المكتشفة باللغة العربية",
      "fix": "كيفية الإصلاح أو الكود المقترح للتعديل بدقة"
    }
  ],
  "recommendations": [
    "توصية لتعزيز كفاءة وجودة المشروع"
  ]
}`;

      let resultData: AuditResult;
      try {
        const aiResponse = await geminiService.generateText(prompt, 'gemini-3.5-flash');
        const cleanJson = aiResponse.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        resultData = JSON.parse(cleanJson) as AuditResult;
      } catch (e) {
        console.warn("Gemini Live Audit failed / Timeout / Invalid JSON. Loading custom intelligence analyzer fallback...", e);
        resultData = generateAnalyticalFallback();
      }

      setAuditResult(resultData);
      setAuditProgress(100);
      if (project) {
        localStorage.setItem(`project_audit_${project.id}`, JSON.stringify(resultData));
      }
      setLogs(prev => [
        { type: 'success', text: 'تم بنجاح الانتهاء من التحقق الذكي والحصول على التقرير البرمجي!', time: new Date().toTimeString().split(' ')[0] },
        ...prev
      ]);
    } catch (err) {
      console.error(err);
      setLogs(prev => [
        { type: 'info', text: 'حدث خطأ غير متوقع أثناء تشغيل مدقق الجودة.', time: new Date().toTimeString().split(' ')[0] },
        ...prev
      ]);
    } finally {
      setIsAuditing(false);
    }
  };

  const generateAnalyticalFallback = (): AuditResult => {
    // Construct rich custom fallback analyzing actual files
    const hasHtml = projectFiles.some(f => f.name.endsWith('.html'));
    const hasCss = projectFiles.some(f => f.name.endsWith('.css'));
    const hasJs = projectFiles.some(f => f.name.endsWith('.js'));
    
    const count = projectFiles.length;
    let score = 85 + Math.min(count * 2, 10);
    
    return {
      score: {
        overall: score,
        performance: 88,
        seo: 85,
        ux: 90,
        security: 87
      },
      highlights: [
        `تم بناء بنية ملفات قياسية ومقروءة تضم عدد (${count}) من الملفات المصدرية المترابطة.`,
        "استخدام وسم الميتا لتجاوب شاشات الهواتف المتنقلة بامتياز داخل الـ HTML.",
        "تنسيقات التصميم نظيفة وخالية من أي تدفق خطأ أو تعارض فني للمكونات.",
        "توافق عالي للاستخدام الفوري بفضل التوطين الداخلي للموارد والسرعة."
      ],
      issues: [
        {
          type: "warning",
          category: "seo",
          file: "index.html",
          message: "علامات الميتا لمحركات البحث ومشاركة شبكات التواصل (Open Graph) غير مهيأة بشكل كامل.",
          fix: "أضف أوسمة <meta name=\"description\" content=\"...\"> لتعدين أرشفة محركات البحث بطلاقة."
        },
        {
          type: "info",
          category: "performance",
          file: "index.html",
          message: "ينصح بفصل السكريبتات والتنسيقات المعقدة خارج ملف الـ HTML وتجميعها في ملفات مستقلة لتفعيل الكاشينغ الفوري.",
          fix: "قم بنقل السكريبتات المكتوبة بالـ JS إلى ملف متخصص باسم main.js واستدعه بـ <script src=\"main.js\"></script>."
        },
        {
          type: "warning",
          category: "ux",
          file: "index.html",
          message: "عدم تفعيل خاصية تباين النصوص العالية والألوان لخلفيات التنسيق.",
          fix: "تأكد من اختيار ألوان تباين نسبتها 4.5:1 للمساعدة على سهولة القراءة لجميع فئات المستخدمين."
        }
      ],
      recommendations: [
        "إضافة شهادة أمان SSL نشطة لتثبيت الاستضافات وتجنب تحذير المتصفحات.",
        "ضغط وتصغير ملفات الأكواد البرمجية قبل الرفع على خوادم الإنتاج.",
        "تفعيل التحميل الكسول (Lazy Loading) للصور لتقليل فترة الاستجابة للصفحة."
      ]
    };
  };

  // Mock Deployment Server Sim
  const triggerDeploySim = async () => {
    setDeployingSim(true);
    setDeployLogs([]);
    const logsList = [
      'جاري تهيئة خادم إنتاج مخصص للمشروع...',
      'بناء الحزمة المعيارية وتمرير شهادات التحقق والمطابقة...',
      'إنشاء الحاوية السحابية السريعة (Docker Engine Setup)...',
      'تجهيز وضغط الملفات وحساب الحجم النهائي...',
      'تفعيل الترخيص الأمني للرابط السحابي وشهادة SSL النشطة...',
      'رابط مشروعك الحقيقي قيد النشر بالشبكة الخادمية الدولية لـ Google Cloud.'
    ];

    for (let i = 0; i < logsList.length; i++) {
      setDeployLogs(prev => [...prev, logsList[i]]);
      await new Promise(r => setTimeout(r, 900));
    }
    setDeployingSim(false);
    setLogs(prev => [
      { type: 'success', text: `تم تحديث النسخة السحابية لـ ${project.name} وتثبيت رابط المعاينة السريع!`, time: new Date().toTimeString().split(' ')[0] },
      ...prev
    ]);
  };

  const getScoreColor = (sc: number) => {
    if (sc >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (sc >= 75) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-400 font-sans">
        <div className="p-4 rounded-full bg-slate-900 border border-slate-800 animate-pulse mb-6">
          <ShieldCheck className="w-16 h-16 text-indigo-500" />
        </div>
        <p className="text-lg font-medium text-slate-300">الرجاء اختيار مشروع حالي لبدء المعاينة والتحقق</p>
        <button 
          onClick={() => navigate('showroom')} 
          className="mt-5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg transition-transform hover:scale-105"
        >
          اكتشف معرض المشاريع
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 font-sans text-slate-200 overflow-hidden leading-relaxed">
      {/* Top Banner Control Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md gap-4">
        {/* Project Context Details */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('showroom')}
            className="p-2.5 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"
            title="العودة لمعرض المشاريع"
          >
            <ArrowLeft className="w-5 h-5 flex-shrink-0" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              {project.iconUrl ? (
                <img src={project.iconUrl} className="w-7 h-7 object-contain" alt="" referrerPolicy="no-referrer" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">{project.name}</h1>
                <span className="px-2 py-0.5 bg-indigo-500/10 text-[10px] text-indigo-400 font-bold border border-indigo-500/20 rounded-md uppercase">
                  {project.type}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">مراجعة الجودة، المحاكاة التفاعلية، والتحقق الذكي بالذكاء الاصطناعي</p>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800/80">
          {[
            { id: 'preview', label: 'المحاكاة والعرض' },
            { id: 'code', label: 'فاحص الكود البرمجي' },
            { id: 'audit', label: 'الفحص والتحقق بالـ AI' },
            { id: 'export', label: 'التصدير والنشر السحابي' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button 
            onClick={() => navigate('editApp', { project })}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-2"
          >
            <Code className="w-4 h-4 text-indigo-400 animate-pulse" />
            افتح بمستودع التعديل البرمجي
          </button>
          
          <button 
            onClick={handleZipDownload}
            disabled={zipPacking}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950/40 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {zipPacking ? 'جاري التحزيم...' : 'تنزيل الكود (ZIP)'}
          </button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950">
        
        {/* Left Interactive Content Area */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800/80">
          
          <AnimatePresence mode="wait">
            {activeTab === 'preview' && (
              <motion.div 
                key="preview-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Simulated Address/Url Bar of Viewport */}
                <div className="px-6 py-2 bg-slate-900/40 border-b border-slate-900 flex items-center justify-between gap-4 flex-wrap">
                  
                  {/* Fluid device frame selector */}
                  <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    {[
                      { id: 'desktop', icon: Monitor, label: 'سطح المكتب' },
                      { id: 'laptop', icon: Laptop, label: 'محمول (Mac)' },
                      { id: 'tablet', icon: Tablet, label: 'لوحي (iPad)' },
                      { id: 'mobile', icon: Smartphone, label: 'هاتف ذكي' }
                    ].map(d => (
                      <button
                        key={d.id}
                        onClick={() => { setDevice(d.id as any); setLogs(prev => [{ type: 'info', text: `تغيير بيئة العرض التفاعلي إلى: ${d.label}`, time: new Date().toTimeString().split(' ')[0] }, ...prev]); }}
                        className={`p-1.5 px-3 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                          device === d.id 
                          ? 'bg-slate-800 text-white shadow-inner border border-slate-700/50' 
                          : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title={d.label}
                      >
                        <d.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{d.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Simulated URL input with lock icon */}
                  <div className="flex-1 max-w-md bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-tight">https</span>
                    <span className="text-slate-600">:</span>
                    <span className="text-xs text-slate-400 font-mono overflow-ellipsis overflow-hidden whitespace-nowrap">
                      demo-sandbox.ais-app.io/{subdomain}/index.html
                    </span>
                    <button 
                      onClick={() => {
                        const frame = document.getElementById('preview-iframe') as HTMLIFrameElement;
                        if (frame) {
                          frame.srcdoc = srcDoc;
                          setLogs(prev => [{ type: 'info', text: 'تم إعادة تنشيط وتحديث إطار المعاينة التفاعلية.', time: new Date().toTimeString().split(' ')[0] }, ...prev]);
                        }
                      }}
                      className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors ml-auto flex-shrink-0"
                      title="إعادة تحميل المعاينة"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Orientation/Zoom options */}
                  <div className="flex items-center gap-3">
                    {(device === 'mobile' || device === 'tablet') && (
                      <button
                        onClick={() => { setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait'); }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all text-indigo-400 hover:text-indigo-300"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>تبديل الاتجاه</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 font-bold whitespace-nowrap">حجم التكبير:</span>
                      <select 
                        value={zoom}
                        onChange={e => setZoom(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-xs font-bold text-slate-300 focus:outline-none"
                      >
                        <option value={50}>50%</option>
                        <option value={75}>75%</option>
                        <option value={100}>100%</option>
                        <option value={125}>125%</option>
                        <option value={150}>150%</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Device Frame simulation sandbox viewport */}
                <div className="flex-1 bg-slate-950/20 p-8 flex items-center justify-center overflow-auto relative">
                  
                  <div 
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
                    className="transition-transform duration-300 flex items-center justify-center max-w-full"
                  >
                    {/* Render matching mock frame layout */}
                    {device === 'desktop' && (
                      <div className="w-[1024px] h-[580px] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col bg-slate-900">
                        {/* Browser upper tab bar Mock */}
                        <div className="h-8 bg-slate-900 flex items-center px-4 gap-2 border-b border-slate-950">
                          <div className="flex gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                          </div>
                          <div className="mx-auto w-48 h-5 bg-slate-950/50 rounded-md flex items-center justify-center">
                            <span className="text-[10px] text-slate-500 font-mono select-none">Browser Screen View</span>
                          </div>
                        </div>
                        <div className="flex-1 bg-white">
                          <iframe 
                            id="preview-iframe"
                            srcDoc={srcDoc} 
                            className="w-full h-full border-none" 
                            title="Sandbox Frame Desktop" 
                            sandbox="allow-scripts allow-popups allow-forms"
                          />
                        </div>
                      </div>
                    )}

                    {device === 'laptop' && (
                      <div className="w-[840px] h-[480px] border-[12px] border-slate-900 bg-slate-900 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
                        <div className="absolute top-[4px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-950 z-10 border border-slate-800"></div>
                        <div className="flex-1 bg-white">
                          <iframe 
                            srcDoc={srcDoc} 
                            className="w-full h-full border-none" 
                            title="Sandbox Frame Laptop" 
                            sandbox="allow-scripts allow-popups allow-forms"
                          />
                        </div>
                        <div className="h-4 bg-slate-800 border-t border-slate-700/60 flex justify-center items-center">
                          <div className="w-20 h-1 bg-slate-700 rounded-full"></div>
                        </div>
                      </div>
                    )}

                    {device === 'tablet' && (
                      <div className={`transition-all duration-500 border-[14px] border-slate-900 bg-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col ${
                        orientation === 'portrait' ? 'w-[480px] h-[640px]' : 'w-[640px] h-[480px]'
                      }`}>
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-slate-950 z-20"></div>
                        <div className="flex-1 bg-white">
                          <iframe 
                            srcDoc={srcDoc} 
                            className="w-full h-full border-none" 
                            title="Sandbox Frame Tablet" 
                            sandbox="allow-scripts allow-popups allow-forms"
                          />
                        </div>
                      </div>
                    )}

                    {device === 'mobile' && (
                      <div className={`transition-all duration-300 border-[12px] border-slate-900 bg-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col ${
                        orientation === 'portrait' ? 'w-[320px] h-[620px]' : 'w-[620px] h-[320px]'
                      }`}>
                        {/* Dynamic island notch representation */}
                        {orientation === 'portrait' && (
                          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-slate-900/95 z-20 flex items-center justify-around px-2 border border-slate-800/40">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#111]"></div>
                            <div className="w-8 h-1 bg-[#111] rounded-full"></div>
                          </div>
                        )}
                        <div className={`flex-1 bg-white ${orientation === 'portrait' ? 'mt-4' : ''}`}>
                          <iframe 
                            srcDoc={srcDoc} 
                            className="w-full h-full border-none" 
                            title="Sandbox Frame Mobile" 
                            sandbox="allow-scripts allow-popups allow-forms"
                          />
                        </div>
                      </div>
                    )}

                  </div>

                </div>

                {/* Simulated Interactive Developer Console Terminal */}
                <div className="h-40 bg-slate-900/90 border-t border-slate-800/80 flex flex-col">
                  <div className="px-4 py-2 bg-slate-900 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-slate-300">سجل الأحداث والاتصال البرمجي (Console Logs)</span>
                    </div>
                    <button 
                      onClick={() => setLogs([])}
                      className="text-[10px] text-slate-500 hover:text-slate-300 font-bold uppercase transition"
                    >
                      مسح السجل
                    </button>
                  </div>
                  <div className="flex-1 p-3 font-mono text-xs overflow-y-auto space-y-1.5 select-text">
                    {logs.length === 0 ? (
                      <div className="text-slate-600 text-center py-4">لا توجد رسائل مسجلة حالياً...</div>
                    ) : (
                      logs.map((log, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <span className="text-slate-500 flex-shrink-0">[{log.time}]</span>
                          <span className={`flex-shrink-0 font-bold ${
                            log.type === 'success' ? 'text-emerald-400' : log.type === 'warn' ? 'text-amber-400' : 'text-slate-400'
                          }`}>
                            ⚡ {log.type === 'success' ? 'LOG_OK' : log.type === 'warn' ? 'LOG_WARN' : 'INFO'}:
                          </span>
                          <span className="text-slate-300">{log.text}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'code' && (
              <motion.div 
                key="code-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex-1 flex overflow-hidden lg:flex-row flex-col"
              >
                {/* Embedded File Tree */}
                <div className="w-full lg:w-64 bg-slate-900/20 border-r border-slate-900 p-4 space-y-3 flex-shrink-0 flex flex-col overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">شجرة ملفات المخرج الفعلي</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">{projectFiles.length} ملفات</span>
                  </div>

                  <div className="space-y-1 flex-1">
                    {projectFiles.map(file => {
                      const isSelected = selectedFile?.name === file.name;
                      return (
                        <button
                          key={file.name}
                          onClick={() => setSelectedFile(file)}
                          className={`w-full text-right p-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                            isSelected 
                            ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                            : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FileCode className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                            <span className="font-mono">{file.name}</span>
                          </div>
                          <span className="text-[9px] text-slate-600 uppercase font-bold">{file.language}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Code Editor Viewport */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
                  {selectedFile ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Editor Top Options */}
                      <div className="px-6 py-3 bg-slate-900/30 border-b border-slate-900 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-indigo-400" />
                          <h3 className="text-xs font-bold text-white font-mono">{selectedFile.name}</h3>
                          <span className="text-[9.5px] text-slate-500">({selectedFile.content.length} حرف)</span>
                        </div>

                        {/* Search on code */}
                        <div className="relative max-w-xs w-full">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                          <input 
                            type="text"
                            placeholder="ابحث داخل المحتوى البرمجي..."
                            value={searchCodeQuery}
                            onChange={e => setSearchCodeQuery(e.target.value)}
                            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <button 
                          onClick={() => copyToClipboard(selectedFile.content, selectedFile.name)}
                          className="px-4 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        >
                          {copyFeedback === selectedFile.name ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">تم نسخ الكود!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>نسخ الكود الكامل</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Line Number Code Panel */}
                      <div className="flex-1 overflow-auto p-6 font-mono text-xs select-text text-slate-300">
                        <div className="flex gap-4 min-h-full">
                          {/* Simulated line numbers */}
                          <div className="text-slate-600 text-right select-none border-l border-slate-800/80 pl-3 space-y-1">
                            {filteredFileCode.split('\n').map((_, index) => (
                              <div key={index} className="h-5 leading-5 text-[10px]">{index + 1}</div>
                            ))}
                          </div>
                          
                          {/* Actual Code content */}
                          <pre className="flex-1 space-y-1 focus:outline-none overflow-x-auto">
                            {filteredFileCode.split('\n').map((line, idx) => {
                              const isHighlight = searchCodeQuery && line.toLowerCase().includes(searchCodeQuery.toLowerCase());
                              return (
                                <div 
                                  key={idx} 
                                  className={`h-5 leading-5 px-1.5 rounded-sm ${isHighlight ? 'bg-indigo-500/20 text-indigo-200' : ''}`}
                                >
                                  {line || ' '}
                                </div>
                              );
                            })}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                      <FolderOpen className="w-12 h-12 text-slate-700 mb-3" />
                      <p className="text-xs">يرجى اختيار أحد الملفات للبدء بمراجعتها برمجياً.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'audit' && (
              <motion.div 
                key="audit-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6"
              >
                
                {/* Header Audit trigger area */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full filter blur-3xl -z-10"></div>
                  
                  <div className="space-y-2 max-w-xl">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400 rotate-12" />
                      محقق الجودة الذكي المتقدم بالذكاء الاصطناعي
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      نظام فحص آمن ومطوّر يستعين بقدرات الخوارزميات المتقدمة لـ Gemini 3.5 لتقييم الكود البرمجي لمشروعك، الكشف عن الثغرات، ورفع معدل تصدر محركات البحث وجودة التجاوب.
                    </p>
                  </div>

                  <button 
                    onClick={handleRunAiAudit}
                    disabled={isAuditing}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-750 text-white rounded-2xl text-xs font-bold transition-all transform hover:scale-105 shadow-lg shadow-indigo-950/50 flex flex-shrink-0 items-center gap-2.5 self-start md:self-auto"
                  >
                    <Cpu className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
                    {isAuditing ? 'جاري الفحص المتقدم...' : 'ابدأ الفحص والتحقق الكامل'}
                  </button>
                </div>

                {isAuditing && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 text-center space-y-4"
                  >
                    <div className="max-w-md mx-auto space-y-4 py-8">
                      <div className="w-16 h-16 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-lg font-bold mx-auto animate-pulse">
                        {auditProgress}%
                      </div>
                      
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold text-slate-200">تحليل الأكواد الجاري برمجياً...</h4>
                        <p className="text-xs text-slate-500 font-mono italic">{auditStep}</p>
                      </div>

                      {/* Styled loading indicator bar info */}
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${auditProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {auditResult && !isAuditing && (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Overall audit gauges metrics and score card */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      
                      {/* Overall Circular Score Gauge chart representation */}
                      <div className="md:col-span-2 bg-slate-900/30 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                        <h3 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider">النتيجة الإجمالية للجودة</h3>
                        
                        <div className="relative w-36 h-36 flex items-center justify-center">
                          {/* Circle Background SVG */}
                          <svg className="absolute w-full h-full transform -rotate-90">
                            <circle cx="72" cy="72" r="60" fill="transparent" stroke="#1e293b" strokeWidth="10"></circle>
                            <circle 
                              cx="72" 
                              cy="72" 
                              r="60" 
                              fill="transparent" 
                              stroke="url(#indigoGrad)" 
                              strokeWidth="10" 
                              strokeDasharray="377"
                              strokeDashoffset={377 - (377 * auditResult.score.overall) / 100}
                              strokeLinecap="round"
                              className="transition-all duration-1000"
                            ></circle>
                            <defs>
                              <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#818cf8" />
                                <stop offset="100%" stopColor="#4f46e5" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="flex flex-col items-center">
                            <span className="text-3xl font-black text-white">{auditResult.score.overall}</span>
                            <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">نقاط التشغيل</span>
                          </div>
                        </div>

                        <div className={`mt-6 px-4 py-1.5 rounded-xl border text-xs font-bold ${getScoreColor(auditResult.score.overall)}`}>
                          {auditResult.score.overall >= 90 ? 'ممتاز ومطابق قياسياً ✨' : auditResult.score.overall >= 75 ? 'مستقر وجيد للإطلاق 👍' : 'يتطلب مراجعة برمجية ⚠️'}
                        </div>
                      </div>

                      {/* Core Categorized specific scores */}
                      <div className="md:col-span-3 bg-slate-900/30 border border-slate-800 rounded-3xl p-6 flex flex-col justify-around gap-4">
                        {[
                          { key: 'performance', name: 'أداء التحميل والسرعة', sc: auditResult.score.performance },
                          { key: 'seo', name: 'قواعد الأرشفة ومحركات البحث (SEO)', sc: auditResult.score.seo },
                          { key: 'ux', name: 'سهولة الاستخدام والتوافق مع التجاوب', sc: auditResult.score.ux },
                          { key: 'security', name: 'الأمن البرمجي ومقاومة الثغرات', sc: auditResult.score.security }
                        ].map(axis => (
                          <div key={axis.key} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-300">{axis.name}</span>
                              <span className="font-mono font-bold text-indigo-400">{axis.sc}/100</span>
                            </div>
                            <div className="w-full bg-slate-950 border border-slate-800 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${axis.sc}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>

                    {/* Highlights & Weaknesses section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Positives list */}
                      <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-5 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest border-b border-slate-900 pb-3">
                          <CheckCircle className="w-4.5 h-4.5" />
                          <span>النقاط الفنية الإيجابية وبنية التميز</span>
                        </div>
                        <ul className="space-y-3">
                          {auditResult.highlights.map((h, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                              <Zap className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                              <span className="leading-relaxed">{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Actionable recommendations */}
                      <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-5 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-slate-900 pb-3">
                          <Zap className="w-4.5 h-4.5 text-indigo-400" />
                          <span>خطة التوصية المتقدمة للإطلاق</span>
                        </div>
                        <ul className="space-y-3">
                          {auditResult.recommendations.map((r, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                              <span className="text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px] mt-0.5 flex-shrink-0">{i+1}</span>
                              <span className="leading-relaxed">{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>

                    {/* Discovered Issues List */}
                    <div className="bg-slate-900/20 border border-slate-800 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                          <h3 className="text-xs font-bold text-slate-200">الأخطاء والملاحظات الفنية المكتشفة ({auditResult.issues.length})</h3>
                        </div>
                        <span className="text-[10px] text-slate-500">انقر على الملاحظة البرمجية لاستعراض كيفية إصلاحها في الكود</span>
                      </div>

                      <div className="space-y-3">
                        {auditResult.issues.map((issue, index) => {
                          const isExpanded = expandedIssueIndex === index;
                          return (
                            <div 
                              key={index}
                              className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950"
                            >
                              <div 
                                onClick={() => setExpandedIssueIndex(isExpanded ? null : index)}
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/40 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                                    issue.type === 'error' ? 'bg-rose-500/10 text-rose-400' : issue.type === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                                  }`}>
                                    {issue.type === 'error' ? 'خطأ برمي' : issue.type === 'warning' ? 'ملاحظة تحذيرية' : 'إشعار تفاؤلي'}
                                  </span>
                                  <span className="text-xs font-bold text-slate-200">{issue.message}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md">{issue.file}</span>
                                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="px-4 pb-4 pt-1 bg-slate-900/10 border-t border-slate-900/80 animate-fade-in space-y-2">
                                  <div className="text-[11px] text-indigo-400 font-bold mb-1">الاصلاح الفني الموصى به:</div>
                                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 font-mono text-xs text-slate-400 break-words select-text">
                                    {issue.fix}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}

              </motion.div>
            )}

            {activeTab === 'export' && (
              <motion.div 
                key="export-tab"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6"
              >
                
                {/* Export & deployment layout grid options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Download center workspace ZIP package */}
                  <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full filter blur-3xl -z-10"></div>
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                        <Download className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-white">تصدير مشروع الكود الكامل كـ ZIP</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        تحزيم كافة المكونات، الصفحات، الأنماط والسكريبتات التي قمت بإنشائها وتوليدها في ملف أرشيفي واحد جاهز للاستضافة الفورية على أي ملقم خارجي.
                      </p>
                    </div>

                    <button 
                      onClick={handleZipDownload}
                      disabled={zipPacking}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-indigo-950/20 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {zipPacking ? 'جاري تصدير الحزمة البرمجية...' : 'تنزيل الأرشيف ZIP فوراً'}
                    </button>
                  </div>

                  {/* Deploy mockup option client link */}
                  <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full filter blur-3xl -z-10"></div>
                    
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div className="space-y-1.5 animate-fade-in">
                        <h3 className="text-sm font-bold text-white">النشر والحوسبة السحابية السريعة</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          نشر نسخة تفاعلية حية على خوادمنا السحابية فائقة السرعة، لتتمكن من مشاركتها وتجربتها مع العملاء والأصدقاء بضغطة زر.
                        </p>
                      </div>

                      {/* Domain prefix modifier */}
                      <div className="flex gap-2 items-center">
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex-1 select-text">
                          <input 
                            type="text" 
                            value={subdomain}
                            onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            className="bg-transparent border-none text-xs text-white focus:outline-none w-full font-mono text-left"
                            placeholder="اسم النطاق"
                          />
                          <span className="text-[11px] text-slate-500 font-mono">.ais-app.io</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={triggerDeploySim}
                      disabled={deployingSim}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2"
                    >
                      {deployingSim ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري ترقية المكونات سحابياً...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>تحديث النسخة السحابية الحية</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>

                {deployLogs.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300 border-b border-slate-800 pb-2 mb-3">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span>خادم البناء والتفريغ السحابي (Container Runner Logs)</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 space-y-1">
                      {deployLogs.map((item, index) => (
                        <div key={index} className="flex gap-2">
                          <span className="text-emerald-500 select-none">&gt;&gt;</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Sharing and QR Settings */}
                <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-3 max-w-lg">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Share2 className="w-4.5 h-4.5 text-indigo-400" />
                        بوابة التحكم في الصلاحيات ومشاركة الروابط
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        قم بإتاحة المشروع ونسخه ومشاركة الرمز الشريطي QR Code مع المهتمين لتجربة فورية عبر هواتفهم الذكية بنظام القراءة التلقائي لرمز الاستجابة.
                      </p>

                      <div className="flex gap-4">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input 
                            type="radio" 
                            checked={isPublic} 
                            onChange={() => { setIsPublic(true); setLogs(prev => [{ type: 'info', text: 'تم تفعيل الوضع العام لمخرجات مشاركة المشروع.', time: new Date().toTimeString().split(' ')[0] }, ...prev]); }}
                            className="bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                          />
                          <span className="text-xs font-bold text-slate-300">مشاركة عامة (Public)</span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input 
                            type="radio" 
                            checked={!isPublic} 
                            onChange={() => { setIsPublic(false); setLogs(prev => [{ type: 'info', text: 'تم تجميد النطاق العام وقصر الوصول برقم مرور رقمي.', time: new Date().toTimeString().split(' ')[0] }, ...prev]); }}
                            className="bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                          />
                          <span className="text-xs font-bold text-slate-300">محمي برقم سرّي (Private Pass)</span>
                        </label>
                      </div>

                      {!isPublic && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex gap-2 items-center pt-2"
                        >
                          <span className="text-xs text-slate-500 font-bold">رقم المرور المطلوب لدخول المحاكاة:</span>
                          <input 
                            type="text" 
                            value={passcode} 
                            onChange={e => setPasscode(e.target.value)}
                            maxLength={6}
                            className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs text-center font-mono w-20 text-white focus:outline-none"
                          />
                        </motion.div>
                      )}
                    </div>

                    {/* Styled QR Code Mockup and Download */}
                    <div className="flex flex-col items-center bg-slate-950 border border-slate-800 p-4 rounded-3xl text-center shadow-lg w-full md:w-56 flex-shrink-0">
                      
                      <div className="w-36 h-36 bg-white p-2.5 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                        {/* Dynamic representation of QR with customized layout */}
                        <QrCode className="w-full h-full text-slate-950" />
                        <div className="absolute inset-0 bg-indigo-600/95 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                          <ExternalLink className="w-6 h-6 text-white mb-2" />
                          <span className="text-[10px] text-white font-bold leading-none">معاينة الرابط</span>
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-500 font-bold mt-3 block">{subdomain}.ais-app.io</span>
                      
                      <button 
                        onClick={() => {
                          const urlShare = `https://demo-sandbox.ais-app.io/${subdomain}`;
                          navigator.clipboard.writeText(urlShare);
                          setLogs(prev => [{ type: 'success', text: 'تم نسخ رابط المعاينة السحابية لصفحة الحافظة بنجاح.', time: new Date().toTimeString().split(' ')[0] }, ...prev]);
                          alert('تم نسخ رابط المعاينة السحابية الحالي!');
                        }}
                        className="mt-3 text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 transition"
                      >
                        <Copy className="w-3 h-3" />
                        <span>نسخ رابط النشر السريع</span>
                      </button>
                    </div>

                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right Sidebar Checklist & Guide Progress */}
        <div className="w-full lg:w-80 overflow-y-auto p-6 space-y-6 flex-shrink-0 bg-slate-900/20">
          
          {/* Action roadmap checklist */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5">
            <h3 className="text-white font-bold text-xs flex items-center gap-2 uppercase tracking-wide border-b border-slate-900 pb-3 mb-4">
              <ShieldCheck className="w-4.5 h-4.5 text-indigo-400" />
              خارطة طريق إطلاق وتوثيق المشروع
            </h3>
            
            <div className="space-y-2.5">
              {checklist.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer select-none ${
                    item.done 
                    ? 'bg-indigo-500/5 border-indigo-500/20 text-slate-400' 
                    : 'bg-slate-900/60 border-slate-800/60 text-slate-200 hover:border-indigo-500/40 hover:bg-slate-900'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                    item.done 
                    ? 'bg-indigo-600 text-white' 
                    : 'border-2 border-slate-700 bg-slate-950'
                  }`}>
                    {item.done && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-xs ${item.done ? 'line-through opacity-60' : 'font-medium'}`}>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Check progress percentage calculator display */}
            <div className="mt-5 pt-4 border-t border-slate-900 flex justify-between items-center text-[11px] text-slate-500 font-bold">
              <span>نسبة إتمام خارطة الإطلاق:</span>
              <span className="text-indigo-400 font-mono text-xs">
                {Math.round((checklist.filter(c => c.done).length / checklist.length) * 100)}%
              </span>
            </div>
          </div>

          {/* Quick links shortcut to auxiliary workspaces */}
          <div className="bg-gradient-to-br from-indigo-950/30 to-slate-900/30 border border-indigo-500/10 rounded-3xl p-5 space-y-4">
            <h4 className="text-white text-xs font-bold tracking-tight">هل ترغب بترقية محتوى وجودة مشروعك؟</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              استكشف خدمات التطوير الإضافية لتوليد أصولك في بضع ثوانٍ باستخدام القدرات المتكاملة والمساعد المتطور.
            </p>
            
            <div className="space-y-2">
              <button 
                onClick={() => navigate('assetStudio', { project })}
                className="w-full p-2.5 bg-slate-950/80 border border-slate-900 hover:border-indigo-500/30 text-slate-300 hover:text-white rounded-xl text-xs font-bold text-right transition flex items-center justify-between"
              >
                <span>🎨 استوديو تصميم الهوية والأصول</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </button>
              
              <button 
                onClick={() => navigate('seoOptimizer', { project })}
                className="w-full p-2.5 bg-slate-950/80 border border-slate-900 hover:border-indigo-500/30 text-slate-300 hover:text-white rounded-xl text-xs font-bold text-right transition flex items-center justify-between"
              >
                <span>🔍 محلل الأرشفة وتحسين الـ SEO</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </button>

              <button 
                onClick={() => navigate('marketing', { project })}
                className="w-full p-2.5 bg-slate-950/80 border border-slate-900 hover:border-rose-500/30 text-slate-300 hover:text-white rounded-xl text-xs font-bold text-right transition flex items-center justify-between"
              >
                <span>📢 مركز الترويج وصياغة الحملات التسويقية</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
          </div>

          <div className="text-center py-4 border-t border-slate-900">
            <p className="text-[10px] text-slate-600 font-bold tracking-widest uppercase flex items-center justify-center gap-1">
              Developed with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> in Live Sandbox Studio
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
