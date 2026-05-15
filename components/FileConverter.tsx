
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Project, ProjectFile, View, Message, ProjectType } from '../types';
import { geminiService } from '../services/geminiService';
import {
  CodeIcon as FileCodeIcon, CssIcon, JsIcon, SpinnerIcon, SparklesIcon,
  ComputerDesktopIcon, DevicePhoneMobileIcon, CloseIcon, SendIcon, UploadIcon,
  CodeIcon, ArrowDownTrayIcon, SaveIcon, CopyIcon,
  CheckIcon, Share2Icon, TrashIcon, ArrowLeftIcon, PlusIcon, WrenchScrewdriverIcon,
  RocketLaunchIcon, FireIcon, ShieldCheckIcon, ArrowPathIcon, MagnifyingGlassIcon,
  BriefcaseIcon, FlutterIcon
} from './Icons';
import { useUsage } from '../hooks/useUsage';
import { BuildModal } from './builder/modals/BuildModal';
import UpgradeModal from './UpgradeModal';
import { useAuth } from '../hooks/useAuth';
import QualityAnalysisModal from './builder/modals/QualityAnalysisModal';
import { simulateFullBuild } from '../services/flutterService';
import { saveBlob, getBlob } from '../services/storageService';
// FIX: Changed to named import as ProjectCard does not have a default export.
import { ProjectCard } from './ProjectCard';
import { SoftwareProjectBuilder } from './SoftwareProjectBuilder';

declare global {
  interface Window {
    JSZip: any;
  }
}

const HtmlIcon: React.FC<React.SVGProps<SVGSVGElement>> = FileCodeIcon;

type Screen = 'list' | 'generator' | 'editor';

const FileIcon: React.FC<{ lang?: string, name?: string }> = ({ lang, name }) => {
    const iconProps = { className: "w-4 h-4 flex-shrink-0" };
    const extension = name?.split('.').pop()?.toLowerCase();
    const finalLang = lang?.toLowerCase() || extension;

    switch(finalLang) {
        case 'html': return <HtmlIcon {...iconProps} style={{ color: '#e34c26' }} />;
        case 'css': return <CssIcon {...iconProps} style={{ color: '#2965f1' }} />;
        case 'javascript':
        case 'js':
        case 'jsx':
        case 'tsx':
            return <JsIcon {...iconProps} style={{ color: '#f0db4f' }} />;
        default: return <FileCodeIcon {...iconProps} />;
    }
};

const LoadingScreen: React.FC<{ logs: string[] }> = ({ logs }) => {
    const isFailed = logs.some(log => log.toLowerCase().includes('فشل'));
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in bg-slate-900">
            {isFailed ? <CloseIcon className="w-12 h-12 text-red-400 mb-6"/> : <SpinnerIcon className="w-12 h-12 text-indigo-400 animate-spin mb-6" />}
            <h2 className="text-2xl font-bold text-white">{isFailed ? 'حدث خطأ' : 'مهندس الذكاء الاصطناعي يعمل على طلبك...'}</h2>
            <p className="text-slate-400 mt-2">{isFailed ? 'لم نتمكن من إكمال عملية التحويل.' : 'لحظات ويصبح مشروعك جاهزًا.'}</p>
            <div className="mt-6 w-full max-w-md bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-left font-mono text-sm h-48 overflow-y-auto">
                {logs.map((log, i) => (
                    <p key={i} className={`animate-fade-in ${log.toLowerCase().includes('فشل') ? 'text-red-400' : 'text-slate-300'}`} style={{ animationDelay: `${i * 100}ms` }}>
                       &gt; {log}
                    </p>
                ))}
            </div>
        </div>
    );
};

const FileConverter: React.FC<{ navigate: (view: View, context?: any) => void; context?: any; }> = ({ navigate, context }) => {
    const [screen, setScreen] = useState<Screen>('list');
    const [projects, setProjects] = useState<Project[]>([]);
    const [project, setProject] = useState<Project | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const importFileRef = useRef<HTMLInputElement>(null);


    const [inputFiles, setInputFiles] = useState<ProjectFile[]>([]);
    const [rawFile, setRawFile] = useState<File | null>(null);
    const [conversionGoal, setConversionGoal] = useState<'code' | 'app'>('code');
    const [appResult, setAppResult] = useState<{ 
        apkUrl: string; 
        ipaUrl: string; 
        isSimulated: boolean;
        apkName: string;
        ipaName: string;
    } | null>(null);
    const [progress, setProgress] = useState(0);
    const [prompt, setPrompt] = useState('');
    const [projectName, setProjectName] = useState('مشروع محوّل');
    const [projectIconUrl, setProjectIconUrl] = useState<string | null>(null);

    const [activeFile, setActiveFile] = useState<string>('');
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const { incrementUsage, isLimitReached } = useUsage();
    const { currentUser, updateUser } = useAuth();
    
    const [isConvertMenuOpen, setIsConvertMenuOpen] = useState(false);
    const convertMenuRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (screen === 'list' && currentUser?.email) {
            const allProjects: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
            const converterProjects = allProjects.filter(p => p.creationMode === 'fileConverter');
            setProjects(converterProjects);
        }
    }, [screen, currentUser]);

    useEffect(() => {
        if (context?.project) {
            if (screen === 'generator') {
                setInputFiles(context.project.files || []);
                setProjectName(context.project.name || 'مشروع محوّل');
                setPrompt(context.project.description || '');
                setProjectIconUrl(context.project.iconUrl || null);
            } else {
                 setProject(context.project);
                 setMessages(context.project.builderChat || []);
                 setActiveFile(context.project.files.find(f => f.name.includes('html'))?.name || context.project.files[0]?.name || '');
                 setScreen('editor');
            }
        }
    }, [context, screen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (convertMenuRef.current && !convertMenuRef.current.contains(event.target as Node)) {
                setIsConvertMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const onLog = (log: string) => setLogs(prev => [...prev, log]);

    const handleFiles = async (files: FileList) => {
        const file = files[0];
        setRawFile(file);
        setAppResult(null);
        
        if (file.type === 'application/zip') {
            await handleZipUpload(file);
        } else {
            const newFilesPromises = Array.from(files).map(f => {
                return new Promise<ProjectFile>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => resolve({ name: f.name, content: e.target?.result as string, language: f.name.split('.').pop() || 'text' });
                    reader.onerror = reject;
                    reader.readAsText(f);
                });
            });
            const newFiles = await Promise.all(newFilesPromises);
            setInputFiles(prev => {
                const existingNames = new Set(prev.map(f => f.name));
                return [...prev, ...newFiles.filter(f => !existingNames.has(f.name))];
            });
        }
    };

    const handleZipUpload = async (file: File) => {
        if (!window.JSZip) {
            setError("مكتبة ZIP غير متاحة.");
            return;
        }
        onLog("جارٍ فك ضغط ملف ZIP...");
        const zip = await window.JSZip.loadAsync(file);
        const newFiles: ProjectFile[] = [];
        for (const filename in zip.files) {
            if (!zip.files[filename].dir) {
                const content = await zip.files[filename].async('string');
                newFiles.push({ name: filename, content: content, language: filename.split('.').pop() || 'text' });
            }
        }
        onLog(`تم العثور على ${newFiles.length} ملفات.`);
        setInputFiles(prev => {
             const existingNames = new Set(prev.map(f => f.name));
             return [...prev, ...newFiles.filter(f => !existingNames.has(f.name))];
        });
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
        if(e.target) e.target.value = '';
    };

    const handleConvert = async () => {
        if (conversionGoal === 'code') {
            if (inputFiles.length === 0 || !prompt.trim()) {
                setError('الرجاء رفع الملفات وكتابة طلب التحويل.');
                return;
            }
            if (isLimitReached(ProjectType.CODE_CONVERSION)) {
                setUpgradeModalOpen(true);
                return;
            }

            setIsGenerating(true);
            setLogs([]);
            setError('');

            try {
                const resultFiles = await geminiService.convertProjectFiles(inputFiles, prompt, onLog);
                const newProject: any = {
                    id: `proj-conv-${Date.now()}`,
                    name: projectName || "مشروع محوّل",
                    description: `تم تحويله بناءً على: "${prompt}"`,
                    type: ProjectType.CODE_CONVERSION,
                    creationMode: 'fileConverter',
                    files: resultFiles,
                    sections: [],
                    timestamp: Date.now(),
                    ownerEmail: currentUser?.email,
                    iconUrl: projectIconUrl || undefined,
                    builderChat: [{ id: 'init', sender: 'ai', text: 'تم تحويل مشروعك بنجاح! يمكنك الآن طلب تعديلات إضافية.' }]
                };

                if (currentUser?.email) {
                    const key = `appProjects_${currentUser.email}`;
                    const savedApps: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
                    savedApps.unshift(newProject);
                    localStorage.setItem(key, JSON.stringify(savedApps));
                }

                incrementUsage(ProjectType.CODE_CONVERSION);
                onLog("تم بناء المشروع بنجاح!");
                
                setProject(newProject);
                setMessages(newProject.builderChat || []);
                setActiveFile(newProject.files.find(f => f.name === 'index.html')?.name || newProject.files[0]?.name || '');
                setScreen('editor');

            } catch (e) {
                const msg = e instanceof Error ? e.message : 'فشل التحويل.';
                setError(msg);
                onLog(`✗ فشل: ${msg}`);
            } finally {
                setIsGenerating(false);
            }
        } else {
            // App Extraction Logic
            if (!rawFile || rawFile.type !== 'application/zip') {
                setError('الرجاء رفع ملف ZIP لاستخراج التطبيقات.');
                return;
            }
            
            setIsGenerating(true);
            setProgress(10);
            setLogs([]);
            onLog("بدء عملية استخراج التطبيقات...");

            try {
                const zip = new window.JSZip();
                const zipContent = await zip.loadAsync(rawFile);
                
                let foundApk: Blob | null = null;
                let foundIpa: Blob | null = null;
                let apkName = 'app-release.apk';
                let ipaName = 'app-release.ipa';
                let extractedProjectName = projectName || 'تطبيقي';

                setProgress(40);
                onLog("البحث عن ملفات APK و IPA داخل الأرشيف...");

                const fileKeys = Object.keys(zipContent.files);
                for (const key of fileKeys) {
                    const lowerKey = key.toLowerCase();
                    if (lowerKey.endsWith('.apk')) {
                        foundApk = await zipContent.files[key].async('blob');
                        apkName = key.split('/').pop() || apkName;
                        onLog(`تم العثور على ملف APK: ${apkName}`);
                    }
                    if (lowerKey.endsWith('.ipa')) {
                        foundIpa = await zipContent.files[key].async('blob');
                        ipaName = key.split('/').pop() || ipaName;
                        onLog(`تم العثور على ملف IPA: ${ipaName}`);
                    }
                    if (lowerKey.endsWith('pubspec.yaml') || lowerKey.endsWith('package.json')) {
                        const content = await zipContent.files[key].async('text');
                        const nameMatch = content.match(/name:\s*["']?([^"'\s]+)["']?/) || content.match(/"name":\s*"([^"]+)"/);
                        if (nameMatch && nameMatch[1]) {
                            extractedProjectName = nameMatch[1];
                        }
                    }
                }

                setProgress(70);

                let isSimulated = false;
                if (!foundApk && !foundIpa) {
                    onLog("لم يتم العثور على تطبيقات جاهزة. بدء عملية بناء محاكاة...");
                    const buildResult = await simulateFullBuild();
                    foundApk = buildResult.apkBlob;
                    foundIpa = buildResult.ipaBlob;
                    apkName = `${extractedProjectName}_v1.0.apk`;
                    ipaName = `${extractedProjectName}_v1.0.ipa`;
                    isSimulated = true;
                    onLog("تم إنشاء تطبيقات تجريبية بنجاح.");
                }

                const apkBlobId = foundApk ? `apk-${Date.now()}` : undefined;
                const ipaBlobId = foundIpa ? `ipa-${Date.now()}` : undefined;

                if (foundApk && apkBlobId) await saveBlob(apkBlobId, foundApk);
                if (foundIpa && ipaBlobId) await saveBlob(ipaBlobId, foundIpa);

                const newProject: any = {
                    id: `proj-app-${Date.now()}`,
                    name: extractedProjectName,
                    description: isSimulated ? "تطبيق مستخرج (محاكاة)" : "تطبيق مستخرج من ملف ZIP",
                    type: ProjectType.MOBILE_APP,
                    creationMode: 'fileConverter',
                    files: [],
                    sections: [],
                    timestamp: Date.now(),
                    ownerEmail: currentUser?.email,
                    apkBlobId,
                    ipaBlobId,
                    apkUrl: foundApk ? URL.createObjectURL(foundApk) : undefined,
                    ipaUrl: foundIpa ? URL.createObjectURL(foundIpa) : undefined,
                };

                if (currentUser?.email) {
                    const key = `appProjects_${currentUser.email}`;
                    const savedApps: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
                    savedApps.unshift(newProject);
                    localStorage.setItem(key, JSON.stringify(savedApps));
                }

                setAppResult({
                    apkUrl: newProject.apkUrl || '',
                    ipaUrl: newProject.ipaUrl || '',
                    isSimulated,
                    apkName,
                    ipaName
                });
                
                onLog("تم حفظ التطبيق في مشاريعك بنجاح!");
                setProgress(100);
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'فشل الاستخراج.';
                setError(msg);
                onLog(`✗ فشل: ${msg}`);
            } finally {
                setIsGenerating(false);
            }
        }
    };
    
    const handleDeleteProject = (appId: string) => {
        if (currentUser?.email) {
            const allProjects: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
            const appToDelete = allProjects.find(p => p.id === appId);
            if (!appToDelete) return;

            const deletedApps = JSON.parse(localStorage.getItem(`deletedProjects_${currentUser.email}`) || '[]');
            localStorage.setItem(`deletedProjects_${currentUser.email}`, JSON.stringify([appToDelete, ...deletedApps]));
            
            const updatedProjects = allProjects.filter(p => p.id !== appId);
            localStorage.setItem(`appProjects_${currentUser.email}`, JSON.stringify(updatedProjects));
            setProjects(updatedProjects.filter(p => p.creationMode === 'fileConverter'));
        }
    };
    
    const srcDoc = useMemo(() => {
        if (!project) return '';
        const htmlFile = project.files.find(f => f.name.endsWith('.html'));
        const cssFiles = project.files.filter(f => f.name.endsWith('.css'));
        const jsFiles = project.files.filter(f => f.name.endsWith('.js'));

        if (!htmlFile) return '<html><body>ملف HTML الرئيسي غير موجود.</body></html>';

        let finalHtml = htmlFile.content;
        const styleTags = cssFiles.map(f => `<style>${f.content}</style>`).join('');
        const scriptTags = jsFiles.map(f => `<script>${f.content}</script>`).join('');

        finalHtml = finalHtml.replace('</head>', `${styleTags}</head>`);
        finalHtml = finalHtml.replace('</body>', `${scriptTags}</body>`);
            
        return finalHtml;
    }, [project]);
    
    const handleChatSend = async () => {
        if (!chatInput.trim() || isChatLoading || !project) return;
        if (isLimitReached(ProjectType.AI_CHAT_MESSAGE)) {
             setUpgradeModalOpen(true);
             return;
        }

        const userMessage: Message = { id: `user-${Date.now()}`, text: chatInput, sender: 'user' };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        incrementUsage(ProjectType.AI_CHAT_MESSAGE);
        
        const command = chatInput;
        setChatInput('');
        setIsChatLoading(true);

        try {
            const { updatedProject, aiResponse } = await geminiService.modifyProjectWithAI(project, command) as { updatedProject: any, aiResponse: string };
            (updatedProject as any).builderChat = [...newMessages, { id: `ai-${Date.now()}`, text: aiResponse, sender: 'ai' }];
            setProject(updatedProject); // Update main project state
            setMessages((updatedProject as any).builderChat);
        } catch (e) {
            const errorMessage: Message = { id: `err-${Date.now()}`, text: 'عذرًا, حدث خطأ.', sender: 'ai' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
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
                    creationMode: 'fileConverter',
                    ownerEmail: currentUser.email,
                }));

                const key = `appProjects_${currentUser.email}`;
                const savedApps: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
                const updatedApps = [...validProjects, ...savedApps];
                localStorage.setItem(key, JSON.stringify(updatedApps));

                setProjects(updatedApps.filter(p => p.creationMode === 'fileConverter'));
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
        a.download = 'file-converter-projects.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const renderListView = () => (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <header className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">محول الملفات</h2>
                    <p className="text-slate-400">({projects.length}) مشاريع محوّلة</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => importFileRef.current?.click()} className="text-sm bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded-lg flex items-center gap-2"><UploadIcon className="w-4 h-4"/> استيراد</button>
                    <button onClick={handleExportProjects} className="text-sm bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded-lg flex items-center gap-2"><ArrowDownTrayIcon className="w-4 h-4"/> تصدير</button>
                    <button onClick={() => setScreen('generator')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                        <PlusIcon className="w-5 h-5"/> تحويل جديد
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
                    <WrenchScrewdriverIcon className="w-16 h-16 mb-4"/>
                    <h3 className="text-lg font-semibold">{projects.length > 0 ? 'لم يتم العثور على نتائج' : 'لا توجد مشاريع محوّلة بعد'}</h3>
                    <p>{projects.length > 0 ? 'جرّب كلمة بحث مختلفة أو فلتر آخر.' : 'انقر على "تحويل جديد" للبدء.'}</p>
                </div>
            ) : (
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                    {filteredProjects.map(p => (
                         <ProjectCard
                            key={p.id}
                            project={p}
                            onDelete={handleDeleteProject}
                            onEdit={(proj) => {
                                setProject(proj);
                                setMessages(proj.builderChat || [{ id: 'init', sender: 'ai', text: 'مرحباً! أنا مساعدك الذكي. اطلب مني أي تعديل على مشروعك.' }]);
                                setActiveFile(proj.files.find(f => f.name.includes('html'))?.name || proj.files[0]?.name || '');
                                setScreen('editor');
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
    
    const renderGeneratorView = () => (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <header className="flex items-center gap-4 mb-6">
                 <button onClick={() => { setScreen('list'); setInputFiles([]); setPrompt(''); setError(''); setProjectIconUrl(null); setAppResult(null); setRawFile(null); }} className="p-2 rounded-full hover:bg-slate-700">
                    <ArrowLeftIcon className="w-5 h-5"/>
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">تحويل مشروع جديد</h2>
                    <p className="text-slate-400">ارفع ملفاتك واطلب من الذكاء الاصطناعي تعديلها أو استخرج تطبيقات الهاتف.</p>
                </div>
            </header>

            {isGenerating ? <LoadingScreen logs={logs} /> : (
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
                    <div className="space-y-6">
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><UploadIcon className="w-5 h-5 text-indigo-400"/> الملفات المصدر</h3>
                            
                            {inputFiles.length > 0 || rawFile ? (
                                <div className="space-y-2 mb-4">
                                    {rawFile && rawFile.type === 'application/zip' ? (
                                        <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                                            <div className="flex items-center gap-2 truncate">
                                                <ArrowDownTrayIcon className="w-5 h-5 text-indigo-400"/>
                                                <span className="text-sm text-slate-300 truncate">{rawFile.name}</span>
                                            </div>
                                            <span className="text-xs text-slate-500">{(rawFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    ) : (
                                        inputFiles.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-slate-700/50 p-2 rounded-lg">
                                                <div className="flex items-center gap-2 truncate">
                                                    <FileIcon lang={file.language} name={file.name}/>
                                                    <span className="text-sm text-slate-300 truncate">{file.name}</span>
                                                </div>
                                                <span className="text-xs text-slate-500">{(file.content.length / 1024).toFixed(1)} KB</span>
                                            </div>
                                        ))
                                    )}
                                    <button onClick={() => { setInputFiles([]); setRawFile(null); setAppResult(null); }} className="text-xs text-red-400 hover:underline">إزالة الكل</button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
                                    <UploadIcon className="w-10 h-10 text-slate-500 mx-auto mb-2"/>
                                    <p className="text-slate-400 text-sm">ارفع ملفات المشروع (HTML, CSS, JS) أو ملف ZIP</p>
                                    <input type="file" multiple accept=".html,.css,.js,.txt,.json,.zip" onChange={(e) => e.target.files && handleFiles(e.target.files)} className="hidden" id="file-upload-conv"/>
                                    <label htmlFor="file-upload-conv" className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm cursor-pointer">استعراض الملفات</label>
                                </div>
                            )}
                        </div>

                        {appResult && (
                            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 animate-fade-in">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><CheckIcon className="w-5 h-5 text-green-400"/> التطبيقات المستخرجة</h3>
                                {appResult.isSimulated && (
                                    <p className="text-xs text-amber-400 mb-4 bg-amber-400/10 p-2 rounded border border-amber-400/20">ملف ZIP لا يحتوي على تطبيقات جاهزة، تم إنشاء نسخ تجريبية للعرض.</p>
                                )}
                                <div className="grid grid-cols-1 gap-3">
                                    {appResult.apkUrl && (
                                        <a href={appResult.apkUrl} download={appResult.apkName} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-lg hover:border-indigo-500 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center text-green-400 font-bold text-xs">APK</div>
                                                <span className="text-sm text-white truncate max-w-[150px]">{appResult.apkName}</span>
                                            </div>
                                            <ArrowDownTrayIcon className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                                        </a>
                                    )}
                                    {appResult.ipaUrl && (
                                        <a href={appResult.ipaUrl} download={appResult.ipaName} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-lg hover:border-indigo-500 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center text-blue-400 font-bold text-xs">IPA</div>
                                                <span className="text-sm text-white truncate max-w-[150px]">{appResult.ipaName}</span>
                                            </div>
                                            <ArrowDownTrayIcon className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                                        </a>
                                    )}
                                </div>
                                <div className="mt-6 flex justify-center">
                                    <button
                                        onClick={() => setScreen('projects')}
                                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium"
                                    >
                                        <BriefcaseIcon className="w-4 h-4" />
                                        الذهاب إلى قائمة المشاريع
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><WrenchScrewdriverIcon className="w-5 h-5 text-green-400"/> إعدادات التحويل</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-300 mb-2">ما هو هدفك من التحويل؟</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => setConversionGoal('code')}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${conversionGoal === 'code' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}
                                        >
                                            تحويل لمشروع برمجيم
                                        </button>
                                        <button 
                                            onClick={() => setConversionGoal('app')}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${conversionGoal === 'app' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}
                                        >
                                            استخراج تطبيقات (APK/IPA)
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-300 mb-1">اسم المشروع</label>
                                    <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500"/>
                                </div>
                                
                                {conversionGoal === 'code' && (
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">تعليمات التحويل</label>
                                        <textarea 
                                            value={prompt} 
                                            onChange={e => setPrompt(e.target.value)} 
                                            rows={5} 
                                            placeholder="مثال: حول هذا الكود لاستخدام Tailwind CSS، أصلح الأخطاء، واجعل التصميم متجاوباً..."
                                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                                        />
                                    </div>
                                )}

                                {conversionGoal === 'code' && (
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">أيقونة المشروع (اختياري)</label>
                                        <div className="flex items-center gap-3">
                                            {projectIconUrl ? <img src={projectIconUrl} className="w-10 h-10 rounded object-cover"/> : <div className="w-10 h-10 bg-slate-700 rounded"/>}
                                            <input type="file" accept="image/*" onChange={handleIconUpload} className="text-sm text-slate-400"/>
                                        </div>
                                    </div>
                                )}

                                {error && <p className="text-red-400 text-sm">{error}</p>}

                                <button onClick={handleConvert} disabled={isGenerating} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2">
                                    {isGenerating ? (
                                        <>
                                            <SpinnerIcon className="w-5 h-5 animate-spin"/>
                                            <span>{conversionGoal === 'app' ? `جاري الاستخراج (${progress}%)...` : 'جاري التحويل...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            {conversionGoal === 'app' ? <FlutterIcon className="w-5 h-5"/> : <SparklesIcon className="w-5 h-5"/>}
                                            <span>{conversionGoal === 'app' ? 'بدء استخراج التطبيقات' : 'بدء التحويل الذكي'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    if (screen === 'editor' && project) {
        return (
             <div className="flex flex-col h-full bg-slate-900 text-white">
                <SoftwareProjectBuilder 
                    navigate={navigate} 
                    mode="text" // Using 'text' mode as base for editor features
                    context={{ project: project }}
                    onNewProject={() => setScreen('generator')}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white">
            <main className="flex-grow overflow-hidden relative">
                {screen === 'list' && renderListView()}
                {screen === 'generator' && renderGeneratorView()}
            </main>
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
        </div>
    );
};

export default FileConverter;
