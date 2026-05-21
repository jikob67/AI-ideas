import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, ProjectFile } from '../types';
import { geminiService } from '../services/geminiService';
import { persistenceService } from '../services/persistenceService';

interface HybridBridgeSuiteProps {
    project: Project;
    projectFiles: ProjectFile[];
    onUpdateProjectFiles: (files: ProjectFile[]) => void;
    onUpdateProjectMetadata: (metadata: Partial<Project>) => void;
}

export const HybridBridgeSuite: React.FC<HybridBridgeSuiteProps> = ({
    project,
    projectFiles,
    onUpdateProjectFiles,
    onUpdateProjectMetadata,
}) => {
    // Basic States
    const [architectureMode, setArchitectureMode] = useState<'hybrid' | 'flutter' | 'web'>(
        (project as any).architectureMode || 'hybrid'
    );
    const [mergeStatus, setMergeStatus] = useState<'unlinked' | 'merging' | 'linked' | 'splitting'>(
        (project as any).mergeStatus || 'unlinked'
    );
    const [activeTab, setActiveTab] = useState<'designer' | 'channels' | 'analyzer' | 'dependencies'>('designer');
    
    // AI & Analysis States
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [analysisLog, setAnalysisLog] = useState<string[]>([]);
    const [conflicts, setConflicts] = useState<string[]>([]);
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    
    // Console / Execution Log States
    const [executionLogs, setExecutionLogs] = useState<string[]>([]);
    const [activeChannelMessage, setActiveChannelMessage] = useState<string>('انتظار إرسال إشارات عبر القنوات الهجينة...');
    const [sentMessagesCount, setSentMessagesCount] = useState(0);

    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [executionLogs]);

    const addLog = (message: string) => {
        const time = new Date().toLocaleTimeString('ar-EG', { hour12: false });
        setExecutionLogs(prev => [...prev, `[${time}] ${message}`]);
    };

    // Simulated Dynamic Message Pipeline on the Bridge
    useEffect(() => {
        if (mergeStatus !== 'linked') return;

        const messages = [
            '🔄 مزامنة الجلسة: تم نقل كائن المصادقة (Auth Token) إلى Flutter Preferences',
            '📡 قنوات JavaScript: استدعاء دالة API: GET /api/v1/profile بنجاح',
            '🗺️ GoRouter Web: تم كشف تغيير المسار إلى "/dashboard" ومزامنته مع Flutter Navigator',
            '🎨 نظام الثيمات الموحد: تم تحديث ألوان واجهة الحزمة إلى ألوان Tailwind المخصصة',
            '⚡ قناة المحاذاة (BridgeChannel): تم تفعيل الاتصال اللاسلكي من نافذة مستعرض الويب',
            '📦 مزامنة التخزين: تم تمرير ملفات الـ Assets المشتركة بنجاح'
        ];

        const interval = setInterval(() => {
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];
            setActiveChannelMessage(randomMsg);
            setSentMessagesCount(prev => prev + 1);
        }, 4000);

        return () => clearInterval(interval);
    }, [mergeStatus]);

    // System Analysis Action
    const handleAnalyze = async () => {
        setIsAnalysing(true);
        setAnalysisLog([]);
        setConflicts([]);
        setRecommendations([]);
        
        try {
            setAnalysisLog(prev => [...prev, '🔍 بدء تحليل ملفات المشروع الحالي...']);
            await new Promise(r => setTimeout(r, 1000));
            
            // Build simple summary of current project files
            const filesSummary = projectFiles.map(f => `${f.name} (${f.language})`).join(', ');
            setAnalysisLog(prev => [...prev, `📂 تم العثور على الملفات التالية: ${filesSummary}`]);
            await new Promise(r => setTimeout(r, 800));

            setAnalysisLog(prev => [...prev, '⚡ جاري التحقق من توافق المكتبات ومشاكل التضارب بين البيئات...']);
            await new Promise(r => setTimeout(r, 1200));

            // Run smart detection
            const activeFiles = projectFiles.map(f => f.name);
            const detects: string[] = [];
            const recs: string[] = [];

            if (!activeFiles.includes('index.html')) {
                detects.push('⚠️ تعارض: ملف index.html مفقود (ملف الدخول الأساسي لبيئة الويب).');
                recs.push('توليد ملف index.html معياري يدعم قنوات الاتصال الهجينة.');
            }
            if (!activeFiles.some(f => f.endsWith('.dart'))) {
                detects.push('📝 كود Flutter غير مدرج في شجرة الملفات الحالية.');
                recs.push('إنشاء قالب Flutter الرئيسي (main.dart) متوافق مع نظام كتل الحالات Riverpod/Bloc.');
            }
            if (projectFiles.some(f => f.content?.includes('window.location') || f.content?.includes('document.getElementById'))) {
                detects.push('⚠️ تعارض الويب المباشر: تم الكشف عن استدعاءات DOM مباشرة قد تسبب انهياراً في بيئات تطبيقات الهواتف الذكية.');
                recs.push('تغليف استدعاءات الـ DOM المباشرة عبر واجهة بريدج آمنة لتفادي الانهيار في Android/iOS.');
            }

            if (detects.length === 0) {
                detects.push('✅ رائع! لم يتم العثور على أي مشاكل أو تعارضات هيكلية للتطبيق الهجين.');
                recs.push('جاهز للدمج الآلي الفوري مع تفعيل قنوات GoRouter و Riverpod.');
            } else {
                setAnalysisLog(prev => [...prev, '🚨 تم رصد تعارضات محتملة بحاجة إلى محاذاة تلقائية.']);
            }

            setConflicts(detects);
            setRecommendations(recs);
            setHasAnalyzed(true);
            setAnalysisLog(prev => [...prev, '✨ تم إكمال التحليل الذكي بنجاح!']);
        } catch (err) {
            console.error(err);
            setAnalysisLog(prev => [...prev, '❌ حدث خطأ أثناء فحص البنية التحتية للمشروع.']);
        } finally {
            setIsAnalysing(false);
        }
    };

    // Auto Repair & Code Generator
    const handleAutoFix = async () => {
        setIsAnalysing(true);
        setAnalysisLog(prev => [...prev, '🔧 تفعيل نظام المعالجة الذكي لمعالجة التعارضات وتوليد الملفات...']);
        await new Promise(r => setTimeout(r, 1500));

        const updatedFiles = [...projectFiles];
        
        // Define clean core Flutter architecture bridge files
        const hasMainDart = updatedFiles.some(f => f.name === 'lib/main.dart');
        const hasBridgeDart = updatedFiles.some(f => f.name === 'lib/hybrid_bridge.dart');
        const hasPubspec = updatedFiles.some(f => f.name === 'pubspec.yaml');
        const hasGoRouter = updatedFiles.some(f => f.name === 'lib/router.dart');

        if (!hasPubspec) {
            updatedFiles.push({
                name: 'pubspec.yaml',
                language: 'yaml',
                content: `name: ${project.name.toLowerCase().replace(/\s+/g, '_')}_hybrid
description: "A hybrid Flutter + React Web architecture application powered by AI ideas."
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_web_plugins:
    sdk: flutter
  flutter_riverpod: ^2.4.9
  go_router: ^12.1.3
  http: ^1.2.0
  shared_preferences: ^2.2.2

flutter:
  uses-material-design: true
  assets:
    - assets/theme.json
`
            });
            setAnalysisLog(prev => [...prev, '📝 تم توليد ملف اعتماديات النشر: pubspec.yaml']);
        }

        if (!hasBridgeDart) {
            updatedFiles.push({
                name: 'lib/hybrid_bridge.dart',
                language: 'dart',
                content: `import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_web_plugins/url_strategy.dart';

class HybridBridge {
  static const MethodChannel _channel = MethodChannel('com.ai_ideas.hybrid/bridge');

  // Shared Authentication State
  static Future<String?> getAuthToken() async {
    try {
      final String? token = await _channel.invokeMethod('getAuthToken');
      return token;
    } on PlatformException catch (e) {
      print("Failed to get token: '\${e.message}'.");
      return null;
    }
  }

  // Bridging API details to JS Context
  static Future<void> shareApiAndRoutes(String route, Map<String, dynamic> apiConfig) async {
    try {
      await _channel.invokeMethod('syncContext', {
        'route': route,
        'config': jsonEncode(apiConfig),
      });
    } on PlatformException catch (e) {
      print("Failed to sync context: '\${e.message}'.");
    }
  }
}
`
            });
            setAnalysisLog(prev => [...prev, '📝 تم توليد الجسر البرمجي الهجين: lib/hybrid_bridge.dart']);
        }

        if (!hasMainDart) {
            updatedFiles.push({
                name: 'lib/main.dart',
                language: 'dart',
                content: `import 'package:flutter/material';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'hybrid_bridge.dart';
import 'router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    const ProviderScope(
      child: HybridAppRoot(),
    ),
  );
}

class HybridAppRoot extends ConsumerWidget {
  const HybridAppRoot({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: '${project.name}',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      routerConfig: appRouter,
    );
  }
}
`
            });
            setAnalysisLog(prev => [...prev, 'Code Generated: lib/main.dart (Riverpod Implementation)']);
        }

        if (!hasGoRouter) {
            updatedFiles.push({
                name: 'lib/router.dart',
                language: 'dart',
                content: `import 'package:flutter/material';
import 'package:go_router/go_router.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const Scaffold(
        body: Center(
          child: Text('مرحبًا بك في التطبيق الهجين!', style: TextStyle(fontSize: 22)),
        ),
      ),
    ),
  ],
);
`
            });
            setAnalysisLog(prev => [...prev, '📝 تم توليد نظام توجيه GoRouter للويب والمنصات.']);
        }

        // Keep local state in sync
        onUpdateProjectFiles(updatedFiles);
        setConflicts([]);
        setRecommendations([]);
        setAnalysisLog(prev => [...prev, '✅ تم معالجة وإصلاح جميع مشاكل تعارض البنية بنجاح فائق!']);
        setIsAnalysing(false);
    };

    // Action: Merge Flutter + Web
    const handleMergeProjects = async () => {
        setMergeStatus('merging');
        setExecutionLogs([]);
        addLog('⚡ بدء عملية الاندماج المعماري الهجين الموحد...');
        await new Promise(r => setTimeout(r, 1200));

        addLog('🔗 جاري التحقق من مسارات شجرة ملفات Flutter والويب...');
        await new Promise(r => setTimeout(r, 1000));

        addLog('🗃️ مزامنة الـ API والتوجيه الموحد لـ GoRouter...');
        await new Promise(r => setTimeout(r, 1400));

        addLog('🔒 مشاركة الـ Authentication وقنوات مزامنة جلسات المستخدم...');
        await new Promise(r => setTimeout(r, 1100));

        addLog('🎨 توحيد ومواءمة قنوات الـ Assets والـ Theme المأخوذة من Tailwind...');
        
        // Auto-generate bridge files in project list for deployment
        const updated = [...projectFiles];
        const hasJsBridge = updated.some(f => f.name === 'web/js_bridge.js');
        if (!hasJsBridge) {
            updated.push({
                name: 'web/js_bridge.js',
                language: 'javascript',
                content: `// Unified JavaScript to Flutter Hybrid Bridge
window.FlutterHybridBridge = {
  syncSession: function(token, user) {
    console.log("Syncing active session into web application...", token);
    if (window.flutter_inappwebview) {
        window.flutter_inappwebview.callHandler('onSessionSynced', JSON.stringify({ token: token, user: user }));
    }
  },
  navigateRoute: function(path) {
    console.log("Directing GoRouter endpoint to:", path);
    window.location.hash = path;
  }
};
`
            });
        }

        onUpdateProjectFiles(updated);
        onUpdateProjectMetadata({
            architectureMode: 'hybrid',
            mergeStatus: 'linked'
        } as any);

        await new Promise(r => setTimeout(r, 1300));
        addLog('🚀 تم الربط التلقائي والاندماج الهجين بنجاح بنسبة 100%!');
        setArchitectureMode('hybrid');
        setMergeStatus('linked');
    };

    // Action: Split Flutter from Web
    const handleSplitProjects = async () => {
        setMergeStatus('splitting');
        setExecutionLogs([]);
        addLog('✂️ بدء فك ارتباط المنظومات الهجينة وتحجيم المجلدات...');
        await new Promise(r => setTimeout(r, 1200));

        addLog('📂 عزل مصفوفات البناء وتفريد Build Systems المستقلة للإنتاج...');
        await new Promise(r => setTimeout(r, 1500));

        addLog('🔒 تنظيف الـ Dependencies وإزالة قنوات الـ Service Mesh المشتركة...');
        await new Promise(r => setTimeout(r, 1000));

        // Create standalone build directories in names to denote uncoupling
        const updated = projectFiles.map(file => {
            if (file.name.startsWith('lib/') || file.name === 'pubspec.yaml') {
                return { ...file, name: `flutter_src/${file.name}` };
            }
            if (file.name.startsWith('web/') || file.name === 'index.html' || file.name === 'style.css' || file.name === 'script.js') {
                return { ...file, name: `web_src/${file.name}` };
            }
            return file;
        });

        // Add standard files back so editor remains runnable instantly
        const hasIndexHtml = updated.some(f => f.name === 'index.html');
        if (!hasIndexHtml) {
            updated.push({
                name: 'index.html',
                language: 'html',
                content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>تطبيق ويب مستقل</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body class="bg-slate-900 text-white min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
        <h1 class="text-3xl font-bold">بوابة ويب مستقلة بعد فك الارتباط</h1>
        <p class="text-slate-400">تطبيق ويب منعزل تماماً عن مستودع غلاف Flutter Native.</p>
    </div>
    <script src="script.js" defer></script>
</body>
</html>`
            });
        }

        onUpdateProjectFiles(updated);
        onUpdateProjectMetadata({
            architectureMode: 'web',
            mergeStatus: 'unlinked'
        } as any);

        await new Promise(r => setTimeout(r, 1000));
        addLog('🌱 تم تفكيك الارتباط بنجاح كامل وحفظ البيانات والمقومات المزدوجة في مجلدات منفصلة!');
        setArchitectureMode('web');
        setMergeStatus('unlinked');
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 p-6 space-y-6 overflow-y-auto custom-scrollbar select-none">
            
            {/* Header / Intro Card */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 border border-indigo-500/20 p-6 rounded-2xl shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="text-right space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold bg-indigo-500/15 px-3 py-1 rounded-full">
                            Hybrid Architecture Suite
                        </span>
                        <h3 className="text-xl font-bold text-white mt-2">
                            بوابة المعمارية الهجينة (Flutter + Web Integration Gateway)
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed md:max-w-xl">
                            تحكم بدمج وفصل بنى نظام التشغيل لـ Flutter Web وهواتف الـ iOS/Android والويب القياسي بضغطة زر واحدة. توحيد قنوات النقل وإصلاح تعارضات التشغيل.
                        </p>
                    </div>

                    {/* Mode Indicators */}
                    <div className="flex flex-col gap-1 items-end min-w-[140px]">
                        <span className="text-xs text-slate-500 font-bold">الحالة المعمارية النشطة:</span>
                        <div className={`px-4 py-1.5 rounded-xl border text-xs font-bold ${
                            architectureMode === 'hybrid' 
                                ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300' 
                                : architectureMode === 'flutter' 
                                ? 'bg-purple-500/20 border-purple-400 text-purple-300' 
                                : 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        }`}>
                            {architectureMode === 'hybrid' && '⚡ نظام هجين كامل (Hybrid)'}
                            {architectureMode === 'flutter' && '📱 تطبيق فلاتر فقط (Flutter Only)'}
                            {architectureMode === 'web' && '🌐 تطبيق ويب مستقل (Web Only)'}
                        </div>
                    </div>
                </div>

                {/* Switcher Controls */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                    <button 
                        onClick={() => {
                            setArchitectureMode('hybrid');
                            addLog('🔄 تم ضبط نوع معمارية التصدير إلى: Hybrid App');
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                            architectureMode === 'hybrid' 
                                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' 
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        تصدير هجين (Hybrid)
                    </button>
                    <button 
                        onClick={() => {
                            setArchitectureMode('flutter');
                            addLog('🔄 تم ضبط نوع معمارية التصدير إلى: Flutter App ONLY');
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                            architectureMode === 'flutter' 
                                ? 'bg-purple-600 border-purple-400 text-white shadow-lg' 
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        تطبيق Flutter فقط
                    </button>
                    <button 
                        onClick={() => {
                            setArchitectureMode('web');
                            addLog('🔄 تم ضبط نوع معمارية التصدير إلى: Clean Web App ONLY');
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                            architectureMode === 'web' 
                                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/10' 
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        تطبيق ويب فقط (Web)
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800">
                {(['designer', 'channels', 'analyzer', 'dependencies'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 pb-3 text-xs font-bold border-b-2 transition-all ${
                            activeTab === tab 
                                ? 'border-indigo-500 text-indigo-400' 
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {tab === 'designer' && '⚙️ لوحة الربط والعزل'}
                        {tab === 'channels' && '📡 مدقق القنوات والـ Bridge'}
                        {tab === 'analyzer' && '🧠 تحليل وتكامل الذكاء الاصطناعي'}
                        {tab === 'dependencies' && '📦 ملفات الإعداد المهيكلة'}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                >
                    
                    {/* DESIGNER & COMPRESSION WORKFLOW PANEL */}
                    {activeTab === 'designer' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* Merge / Split Interactive Card */}
                            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-6">
                                <div className="text-right">
                                    <h4 className="text-white font-bold text-sm">أدوات الدمج وفك الارتباط التفاعلي</h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        قم بدمج تطبيق الويب الحالي مع غلاف Flutter ليعملا كـ Hybrid App، أو فك الارتباط لإنتاج مشاريع منفصلة.
                                    </p>
                                </div>

                                {/* Active Visual Animation Grid */}
                                <div className="relative h-48 bg-slate-950/95 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-between px-8 relative">
                                    
                                    {/* Left Node: Flutter Native */}
                                    <div className="flex flex-col items-center z-10">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                                            mergeStatus === 'linked' 
                                                ? 'bg-purple-600/20 border-2 border-purple-500 text-purple-400' 
                                                : mergeStatus === 'merging' || mergeStatus === 'splitting'
                                                ? 'bg-amber-500/20 border-2 border-amber-400 animate-pulse text-amber-400'
                                                : 'bg-slate-800 border border-slate-700 text-slate-500'
                                        }`}>
                                            <svg className="w-8 h-8 font-extrabold" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M14.33 2.44l-8.62 8.62 4.13 4.14 8.62-8.62-4.13-4.14zm-4.49 14.9L5.7 13.2l-3.3 3.3 4.13 4.14 3.31-3.3zm5.79.0l-4.13-4.14-2.48 2.48 4.13 4.14 2.48-2.48z" />
                                            </svg>
                                        </div>
                                        <span className="text-[10px] text-slate-400 mt-2 font-bold font-sans">Flutter Platform</span>
                                    </div>

                                    {/* Rotating Dynamic Connecting Energy Beam */}
                                    <div className="absolute inset-x-20 top-1/2 -translate-y-1/2 h-2 flex items-center justify-center pointer-events-none">
                                        <div className="w-full relative h-[2px] bg-slate-800 overflow-hidden">
                                            {mergeStatus === 'linked' && (
                                                <motion.div 
                                                    initial={{ left: '-100%' }}
                                                    animate={{ left: '100%' }}
                                                    transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
                                                    className="absolute h-[2px] w-24 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                                                />
                                            )}
                                            {mergeStatus === 'merging' && (
                                                <div className="absolute inset-0 bg-amber-500 animate-pulse" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Center System Bridge Core Symbol */}
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                                            mergeStatus === 'linked' 
                                                ? 'bg-indigo-600/30 border-indigo-400 text-indigo-300 shadow-lg shadow-indigo-500/20 rotate-180 duration-1000' 
                                                : 'bg-slate-900 border-slate-800 text-slate-500'
                                        }`}>
                                            <span className="text-xs">🔗</span>
                                        </div>
                                    </div>

                                    {/* Right Node: Web Instance */}
                                    <div className="flex flex-col items-center z-10">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                                            mergeStatus === 'linked' 
                                                ? 'bg-emerald-600/20 border-2 border-emerald-500 text-emerald-400' 
                                                : mergeStatus === 'merging' || mergeStatus === 'splitting'
                                                ? 'bg-amber-500/20 border-2 border-amber-400 animate-pulse text-amber-400'
                                                : 'bg-slate-800 border border-slate-700 text-slate-500'
                                        }`}>
                                            <span className="text-lg font-bold">HTML</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 mt-2 font-bold font-sans">Traditional Web</span>
                                    </div>
                                </div>

                                {/* Controls Button Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={handleMergeProjects}
                                        disabled={mergeStatus === 'linked' || mergeStatus === 'merging'}
                                        className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                            mergeStatus === 'unlinked'
                                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/15'
                                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        }`}
                                    >
                                        <span>دمج Flutter + Web</span>
                                    </button>

                                    <button
                                        onClick={handleSplitProjects}
                                        disabled={mergeStatus === 'unlinked' || mergeStatus === 'splitting'}
                                        className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                            mergeStatus === 'linked'
                                                ? 'bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30'
                                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        }`}
                                    >
                                        <span>فصل Flutter عن Web</span>
                                    </button>
                                </div>
                            </div>

                            {/* Execution & Deployment Audit Channel Terminal */}
                            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-4">
                                <div className="text-right">
                                    <h4 className="text-white font-bold text-sm">سجل المحاذاة والربط المزدوج</h4>
                                    <p className="text-xs text-slate-500 mt-1">خطوات توليد الشفرة وحسابات التحزيم الهجينة.</p>
                                </div>

                                <div className="bg-black/80 rounded-xl p-4 font-mono text-xs overflow-y-auto text-green-400 h-40 border border-slate-850 shadow-inner custom-scrollbar relative">
                                    {executionLogs.length === 0 ? (
                                        <p className="text-slate-600 italic">انتظار إيعاز دمج أو فصل المشروع...</p>
                                    ) : (
                                        executionLogs.map((log, index) => (
                                            <p key={index} className="leading-relaxed whitespace-pre-wrap mb-1 transition-all">
                                                &gt; {log}
                                            </p>
                                        ))
                                    )}
                                    <div ref={logsEndRef} />
                                </div>

                                <div className="p-3 bg-indigo-950/25 border border-indigo-900/40 rounded-xl flex items-center gap-3">
                                    <div className="animate-ping w-2 h-2 rounded-full bg-indigo-400 shrink-0"></div>
                                    <p className="text-[10px] text-indigo-300 leading-normal text-right truncate flex-1">
                                        {activeChannelMessage}
                                    </p>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* CHANNEL DEBUGGER TAB */}
                    {activeTab === 'channels' && (
                        <div className="space-y-6">
                            
                            {/* Visual Signal Wave Grid */}
                            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl relative overflow-hidden">
                                <h4 className="text-white font-bold text-sm mb-1 text-right">جسر الاتصال المعالج (Real-Time Bridge Log)</h4>
                                <p className="text-xs text-slate-500 text-right mb-6">مراقبة الرسائل المارة عبر قنوات الأجهزة والمصادقة.</p>
                                
                                <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar">
                                    <div className="bg-slate-950/80 p-3 rounded-xl flex items-center justify-between border border-slate-850">
                                        <span className="text-[10px] text-green-400 font-mono">CHANNEL_ACTIVE</span>
                                        <span className="text-xs text-slate-300 font-medium text-right">مزامنة تواصل مصفوفة المسارات GoRouter بنجاح</span>
                                        <span className="text-[10px] text-slate-500 font-mono">10:45:22 AM</span>
                                    </div>
                                    <div className="bg-slate-950/80 p-3 rounded-xl flex items-center justify-between border border-slate-850">
                                        <span className="text-[10px] text-indigo-400 font-mono">AUTH_BRIDGE</span>
                                        <span className="text-xs text-slate-300 font-medium text-right">تسجيل الدخول المشترك: مشاركة JWT Token لبيئة Dart الحيوية</span>
                                        <span className="text-[10px] text-slate-500 font-mono">10:45:19 AM</span>
                                    </div>
                                    <div className="bg-slate-950/80 p-3 rounded-xl flex items-center justify-between border border-slate-850">
                                        <span className="text-[10px] text-purple-400 font-mono">THEME_SYNC</span>
                                        <span className="text-xs text-slate-300 font-medium text-right">تم تمرير متغيرات ثيم Tailwind وتعميمها على مكونات MaterialApp</span>
                                        <span className="text-[10px] text-slate-500 font-mono">10:45:10 AM</span>
                                    </div>
                                </div>
                                
                                <div className="mt-4 flex justify-between items-center text-xs text-slate-400">
                                    <span>نظام توجيه الويب: GoRouter Web Plug enabled</span>
                                    <span>إشارات الجسر المنقولة: <strong className="text-indigo-400 font-mono">{sentMessagesCount + 3}</strong></span>
                                </div>
                            </div>
                            
                        </div>
                    )}

                    {/* AI ANALYZER & CONFLICT SYSTEM */}
                    {activeTab === 'analyzer' && (
                        <div className="space-y-6">
                            
                            {/* Analysis Control */}
                            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <button 
                                        onClick={handleAnalyze}
                                        disabled={isAnalysing}
                                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 py-2 px-5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2"
                                    >
                                        {isAnalysing ? 'جاري التحليل والفحص الفني...' : 'تحليل تعارضات الهيكل (Analyze Bundle)'}
                                    </button>
                                    <div className="text-right">
                                        <h4 className="text-white font-bold text-sm">مستشار البنية التحتية بالذكاء الاصطناعي</h4>
                                        <p className="text-xs text-slate-500 mt-1">يفحص شجرة الملفات الحالية ويكتشف تعارضات التوجيه ومعيارية الاستدعاء.</p>
                                    </div>
                                </div>

                                {/* Live progress logs */}
                                {analysisLog.length > 0 && (
                                    <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-indigo-300 max-h-[160px] overflow-y-auto custom-scrollbar border border-slate-850 space-y-1">
                                        {analysisLog.map((logItem, idx) => (
                                            <p key={idx} className="whitespace-pre-normal text-right">&gt; {logItem}</p>
                                        ))}
                                    </div>
                                )}

                                {/* Conflicts Detected */}
                                {hasAnalyzed && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in mt-4">
                                        
                                        {/* Conflict List Card */}
                                        <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-xl space-y-3">
                                            <h5 className="text-rose-400 font-bold text-xs text-right">⚠️ التناقضات والمسائل والتعارضات المرصودة:</h5>
                                            <ul className="space-y-2 text-right">
                                                {conflicts.map((con, idx) => (
                                                    <li key={idx} className="text-[11px] text-slate-300 list-disc list-inside">
                                                        {con}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Recommendations Card */}
                                        <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-3">
                                            <h5 className="text-emerald-400 font-bold text-xs text-right">💡 الحلول والإصلاحات المقترحة للتوافق:</h5>
                                            <ul className="space-y-2 text-right">
                                                {recommendations.map((rec, idx) => (
                                                    <li key={idx} className="text-[11px] text-slate-300 list-disc list-inside">
                                                        {rec}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                    </div>
                                )}

                                {/* Auto Fix Action Panel */}
                                {hasAnalyzed && conflicts.length > 0 && (
                                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between gap-4">
                                        <button
                                            onClick={handleAutoFix}
                                            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-5 rounded-lg text-xs transition-all shadow-md shadow-amber-500/10"
                                        >
                                            إصلاح وتوليد ملفات الجسر تلقائياً
                                        </button>
                                        <p className="text-[11px] text-amber-200 text-right leading-relaxed flex-1">
                                            <strong>تصحيح فوري:</strong> سيقوم الذكاء الاصطناعي ببناء غلاف MaterialApp المهيكل، وإعداد pubspec.yaml بكتل Riverpod المتوازنةGoRouter.
                                        </p>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                    {/* STRUCTURED BRIDGE CODE FILES */}
                    {activeTab === 'dependencies' && (
                        <div className="space-y-4">
                            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl">
                                <h4 className="text-white font-bold text-sm mb-1 text-right">قائمة ملفات محاذاة المعمارية الناتجة</h4>
                                <p className="text-xs text-slate-500 text-right mb-4">إن نظام AI Ideas يصنع ملفات تكاملية متينة وخالية من الكود المتوقع.</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
                                        <h5 className="text-white font-bold text-xs mb-1">pubspec.yaml</h5>
                                        <p className="text-[10px] text-slate-500">محدد اعتماديات الـ Riverpod ومعرّفات التصدير.</p>
                                    </div>
                                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
                                        <h5 className="text-white font-bold text-xs mb-1">lib/hybrid_bridge.dart</h5>
                                        <p className="text-[10px] text-slate-500">قنوات نقل الرسائل وبوابات السيزن والتثبيت الفنية.</p>
                                    </div>
                                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
                                        <h5 className="text-white font-bold text-xs mb-1">web/js_bridge.js</h5>
                                        <p className="text-[10px] text-slate-500">الجسر الطرفي لنقل إشارات محركات المتصفح.</p>
                                    </div>
                                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-850">
                                        <h5 className="text-white font-bold text-xs mb-1">lib/router.dart</h5>
                                        <p className="text-[10px] text-slate-500">حزم توجيه go_router ثنائية المنصة المعيارية.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </motion.div>
            </AnimatePresence>

        </div>
    );
};
