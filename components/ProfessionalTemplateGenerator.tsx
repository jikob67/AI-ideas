
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, ProjectType, SectionType, View } from '../types';
import { geminiService } from '../services/geminiService';
import {
    SparklesIcon, SpinnerIcon, CheckIcon, CopyIcon, CodeIcon, ArrowDownTrayIcon, LightBulbIcon,
    BriefcaseIcon, RocketLaunchIcon, NewspaperIcon, ShoppingCartIcon, SaveIcon, Share2Icon, PlusIcon, ArrowLeftIcon, TrashIcon,
    WrenchScrewdriverIcon, UsersGroupIcon, DevicePhoneMobileIcon, UserCircleIcon, ArrowPathIcon, MagnifyingGlassIcon, UploadIcon
} from './Icons';
import { SECTION_DEFINITIONS } from '../constants';
// FIX: Changed to named import as ProjectCard does not have a default export.
import { ProjectCard } from './ProjectCard';
import { useAuth } from '../hooks/useAuth';

// --- New Definitions ---
const templateCategories = [
    { id: 'Landing Page', name: 'صفحة هبوط', icon: <RocketLaunchIcon className="w-6 h-6" /> },
    { id: 'Portfolio', name: 'معرض أعمال', icon: <BriefcaseIcon className="w-6 h-6" /> },
    { id: 'Blog', name: 'مدونة', icon: <NewspaperIcon className="w-6 h-6" /> },
    { id: 'E-commerce', name: 'منتج متجر', icon: <ShoppingCartIcon className="w-6 h-6" /> },
    { id: 'SaaS Website', name: 'موقع SaaS', icon: <WrenchScrewdriverIcon className="w-6 h-6" /> },
    { id: 'Agency', name: 'وكالة إبداعية', icon: <UsersGroupIcon className="w-6 h-6" /> },
    { id: 'App Showcase', name: 'عرض تطبيق جوال', icon: <DevicePhoneMobileIcon className="w-6 h-6" /> },
    { id: 'Personal CV', name: 'سيرة ذاتية', icon: <UserCircleIcon className="w-6 h-6" /> },
];

const fontPairings = [
    { name: 'Cairo & Tajawal', value: { heading: 'Cairo', body: 'Tajawal' } },
    { name: 'Poppins & Inter', value: { heading: 'Poppins', body: 'Inter' } },
    { name: 'Oswald & Lato', value: { heading: 'Oswald', body: 'Lato' } },
    { name: 'Playfair Display & Source Sans Pro', value: { heading: 'Playfair Display', body: 'Source Sans Pro' } },
    { name: 'Roboto Slab & Roboto', value: { heading: 'Roboto Slab', body: 'Roboto' } },
    { name: 'Montserrat & Lora', value: { heading: 'Montserrat', body: 'Lora' } },
    { name: 'Raleway & Open Sans', value: { heading: 'Raleway', body: 'Open Sans' } },
    { name: 'Nunito & Merriweather', value: { heading: 'Nunito', body: 'Merriweather' } },
];
// --- End New Definitions ---

interface ProfessionalTemplateGeneratorProps {
    navigate: (view: View, context?: any) => void;
    context?: any;
}

const ProfessionalTemplateGenerator: React.FC<ProfessionalTemplateGeneratorProps> = ({ navigate, context }) => {
    const [screen, setScreen] = useState<'list' | 'generator'>('list');
    const [templateProjects, setTemplateProjects] = useState<Project[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [error, setError] = useState('');
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const { currentUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const importFileRef = useRef<HTMLInputElement>(null);

    // --- New State ---
    const [templateCategory, setTemplateCategory] = useState<string>('Landing Page');
    const [fontPair, setFontPair] = useState(fontPairings[0].value);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isConvertMenuOpen, setIsConvertMenuOpen] = useState(false);
    const convertMenuRef = useRef<HTMLDivElement>(null);
    // --- End New State ---
    
    const [theme, setTheme] = useState({
        primary: '#6366f1',
        secondary: '#a855f7',
        background: '#111827',
        text: '#f3f4f6'
    });

    const [generatedCode, setGeneratedCode] = useState<{ html: string; css: string; js: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'css' | 'js'>('preview');
    const [copied, setCopied] = useState(false);

     useEffect(() => {
        if (!currentUser?.email) return;
        const allProjects: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
        if (screen === 'list') {
            const professionalTemplates = allProjects.filter(p => p.creationMode === 'professionalTemplateGenerator');
            setTemplateProjects(professionalTemplates);
        } else {
            setProjects(allProjects);
            let projectIdToSelect = selectedProjectId;
            if (context?.project?.id && allProjects.some(p => p.id === context.project.id)) {
                projectIdToSelect = context.project.id;
            } else if (!selectedProjectId && allProjects.length > 0) {
                projectIdToSelect = allProjects[0].id;
            }
            setSelectedProjectId(projectIdToSelect);
        }
    }, [screen, selectedProjectId, currentUser, context]);
    
     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (convertMenuRef.current && !convertMenuRef.current.contains(event.target as Node)) {
                setIsConvertMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

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
                    creationMode: 'professionalTemplateGenerator',
                    ownerEmail: currentUser.email,
                }));

                const key = `appProjects_${currentUser.email}`;
                const savedApps: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
                const updatedApps = [...validProjects, ...savedApps];
                localStorage.setItem(key, JSON.stringify(updatedApps));

                setTemplateProjects(updatedApps.filter(p => p.creationMode === 'professionalTemplateGenerator'));
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
        if (templateProjects.length === 0) {
            alert('لا توجد مشاريع لتصديرها.');
            return;
        }
        const jsonString = JSON.stringify(templateProjects, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'professional-template-projects.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const projectTypesInView = useMemo(() => (
        ['all', ...Array.from(new Set(templateProjects.map(p => p.type)))]
    ), [templateProjects]);

    const filteredProjects = useMemo(() => {
        return templateProjects.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterType === 'all' || p.type === filterType;
            return matchesSearch && matchesFilter;
        });
    }, [templateProjects, searchQuery, filterType]);

    const ApplyToProjectModal: React.FC<{
        isOpen: boolean;
        onClose: () => void;
        projects: Project[];
        onApply: (projectId: string, method: 'replace' | 'add') => void;
    }> = ({ isOpen, onClose, projects, onApply }) => {
        const [targetProjectId, setTargetProjectId] = useState<string>(projects[0]?.id || '');
        const [applyMethod, setApplyMethod] = useState<'replace' | 'add'>('replace');

        useEffect(() => {
            if (projects.length > 0 && !targetProjectId) {
                setTargetProjectId(projects[0].id);
            }
        }, [projects, targetProjectId]);
        
        const targetProject = useMemo(() => projects.find(p => p.id === targetProjectId), [targetProjectId, projects]);
        const hasHtmlSection = useMemo(() => targetProject?.sections.some(s => s.type === SectionType.HTML), [targetProject]);
        
        useEffect(() => {
            setApplyMethod(hasHtmlSection ? 'replace' : 'add');
        }, [hasHtmlSection]);
    
        if (!isOpen) return null;
    
        const handleSubmit = () => {
            if (targetProjectId) {
                onApply(targetProjectId, applyMethod);
            }
        };
    
        return (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-white mb-4">تطبيق القالب على مشروع حالي</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="project-select" className="text-sm text-slate-300">اختر المشروع:</label>
                            <select
                                id="project-select"
                                value={targetProjectId}
                                onChange={e => setTargetProjectId(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2.5 text-white mt-1"
                            >
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-slate-300">طريقة التطبيق:</label>
                            <div className="mt-2 space-y-2">
                                {hasHtmlSection && (
                                    <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer ${applyMethod === 'replace' ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-700/50 border-transparent'}`}>
                                        <input type="radio" name="applyMethod" value="replace" checked={applyMethod === 'replace'} onChange={() => setApplyMethod('replace')} className="mt-1" />
                                        <div>
                                            <p className="font-semibold text-white">استبدال قسم HTML الرئيسي</p>
                                            <p className="text-xs text-slate-400">سيتم تحديث المحتوى الحالي لأول قسم HTML في مشروعك.</p>
                                        </div>
                                    </label>
                                )}
                                <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer ${applyMethod === 'add' ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-700/50 border-transparent'}`}>
                                    <input type="radio" name="applyMethod" value="add" checked={applyMethod === 'add'} onChange={() => setApplyMethod('add')} className="mt-1" />
                                    <div>
                                        <p className="font-semibold text-white">إضافة كقسم HTML جديد</p>
                                        <p className="text-xs text-slate-400">سيتم إضافة القالب كقسم جديد في مشروعك دون المساس بالمحتوى الحالي.</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={onClose} className="text-sm py-2 px-4 rounded-lg bg-slate-600 hover:bg-slate-500">إلغاء</button>
                        <button onClick={handleSubmit} disabled={!targetProjectId} className="text-sm py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-500">
                            تطبيق وفتح
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const handleApplyToProject = (targetProjectId: string, method: 'replace' | 'add') => {
        if (!generatedCode || !currentUser?.email) return;
    
        const allProjects: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
        let projectToNavigate: Project | undefined;
    
        const updatedProjects = allProjects.map(p => {
            if (p.id === targetProjectId) {
                let fullHtml = generatedCode.html.replace('<link rel="stylesheet" href="style.css">', `<style>${generatedCode.css}</style>`);
                const scriptTag = `<script>${generatedCode.js}</script>`;
                if (fullHtml.includes('</body>')) {
                    fullHtml = fullHtml.replace('</body>', `${scriptTag}</body>`);
                } else {
                    fullHtml += scriptTag;
                }

                let updatedSections = [...p.sections];
                const designSectionIndex = updatedSections.findIndex(s => s.type === SectionType.DESIGN);

                if (designSectionIndex !== -1) {
                    updatedSections[designSectionIndex] = {
                        ...updatedSections[designSectionIndex],
                        config: {
                            ...updatedSections[designSectionIndex].config,
                            colors: theme
                        }
                    };
                } else {
                    updatedSections.unshift({
                        id: `sec-design-${Date.now()}`,
                        type: SectionType.DESIGN,
                        title: 'التصميم العام',
                        config: { colors: theme, layout: SECTION_DEFINITIONS.find(s => s.type === SectionType.DESIGN)!.defaultConfig.layout }
                    });
                }
    
                if (method === 'replace') {
                    const htmlSectionIndex = updatedSections.findIndex(s => s.type === SectionType.HTML);
                    if (htmlSectionIndex !== -1) {
                        updatedSections[htmlSectionIndex] = {
                            ...updatedSections[htmlSectionIndex],
                            title: `قالب: ${templateCategory}`,
                            config: { ...updatedSections[htmlSectionIndex].config, htmlContent: fullHtml }
                        };
                    } else {
                        updatedSections.push({
                            id: `sec-html-tmpl-${Date.now()}`,
                            type: SectionType.HTML,
                            title: `قالب: ${templateCategory}`,
                            config: { htmlContent: fullHtml }
                        });
                    }
                } else { // method === 'add'
                    updatedSections.push({
                        id: `sec-html-tmpl-${Date.now()}`,
                        type: SectionType.HTML,
                        title: `قالب: ${templateCategory}`,
                        config: { htmlContent: fullHtml }
                    });
                }
    
                projectToNavigate = { ...p, sections: updatedSections };
                return projectToNavigate;
            }
            return p;
        });
    
        localStorage.setItem(`appProjects_${currentUser.email}`, JSON.stringify(updatedProjects));
        setIsApplyModalOpen(false);
    
        if (projectToNavigate) {
            alert('تم تطبيق القالب بنجاح! جاري فتح المحرر...');
            navigate('editApp', { project: projectToNavigate, originView: 'professionalTemplateGenerator' });
        }
    };

    const handleGenerate = async () => {
        if (!selectedProject) {
            setError('الرجاء اختيار مشروع أولاً.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedCode(null);
        try {
            const code = await geminiService.generateProfessionalTemplate(selectedProject, theme, templateCategory, fontPair);
            setGeneratedCode(code);
            setActiveTab('preview');
        } catch (e) {
            setError('فشل في إنشاء القالب. حاول مرة أخرى.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleThemeSuggestion = async () => {
        setIsSuggesting(true);
        try {
            const suggested = await geminiService.getTemplateThemeSuggestion();
            setTheme({
                primary: suggested.primary,
                secondary: suggested.secondary,
                background: suggested.background,
                text: suggested.text,
            });
            setFontPair(suggested.fontPair);
        } catch (e) {
            setError('فشل في اقتراح السمات.');
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleDownload = () => {
        if (!generatedCode || !selectedProject) return;
        const fullHtml = generatedCode.html.replace('<link rel="stylesheet" href="style.css">', `<style>${generatedCode.css}</style>`);

        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedProject.name.replace(/\s+/g, '_')}-template.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleShare = async () => {
        if (!generatedCode || !selectedProject) return;
        if (!navigator.share) {
            alert('متصفحك لا يدعم ميزة المشاركة.');
            return;
        }

        try {
            const fullHtml = generatedCode.html.replace('<link rel="stylesheet" href="style.css">', `<style>${generatedCode.css}</style>`);
            const blob = new Blob([fullHtml], { type: 'text/html' });
            const file = new File([blob], `${selectedProject.name.replace(/\s+/g, '_')}.html`, { type: 'text/html' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `قالب ${selectedProject.name}`,
                    text: `تحقق من هذا القالب الذي تم إنشاؤه بواسطة AI ideas!`,
                });
            } else {
                // Fallback to text share
                await navigator.share({
                    title: `قالب ${selectedProject.name}`,
                    text: `تحقق من هذا القالب الذي تم إنشاؤه بواسطة AI ideas! يمكنك تنزيل ملف HTML لرؤيته.`,
                });
            }
        } catch (err: any) {
            console.error('Share failed:', err);
            if (err && err.name === 'AbortError') {
                // User cancelled the share dialog, do nothing.
            } else if (err && err.name === 'NotAllowedError') {
                alert('فشلت المشاركة: تم رفض الإذن. قد يكون هذا بسبب قيود الأمان في المتصفح أو بيئة التشغيل.');
            } else {
                alert('فشلت المشاركة. قد لا يدعم متصفحك أو بيئة التشغيل هذه الميزة. يمكنك محاولة تنزيل الملف ومشاركته يدويًا.');
            }
        }
    };

    const handleSaveAsProject = () => {
        if (!generatedCode || !selectedProject || !currentUser?.email) return;
        const newProjectName = prompt('أدخل اسمًا للمشروع الجديد:', `${selectedProject.name} - قالب`);
        if (!newProjectName) return;
    
        const newProject: any = {
            id: `proj-tmpl-${Date.now()}`,
            name: newProjectName,
            description: `قالب تم إنشاؤه لمشروع '${selectedProject.name}' بفئة '${templateCategory}'.`,
            type: ProjectType.WEBSITE,
            creationMode: 'professionalTemplateGenerator',
            files: [
                { name: 'index.html', language: 'html', content: generatedCode.html },
                { name: 'style.css', language: 'css', content: generatedCode.css },
                { name: 'script.js', language: 'javascript', content: generatedCode.js }
            ],
            sections: [],
            timestamp: Date.now(),
            isPublished: false,
            isShared: false,
            iconUrl: selectedProject.iconUrl,
        };
    
        const savedApps: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]' );
        localStorage.setItem(`appProjects_${currentUser.email}`, JSON.stringify([newProject, ...savedApps]));
        setScreen('list');
    };

    const srcDoc = useMemo(() => {
        if (!generatedCode) return '';
        const { html, css, js } = generatedCode;

        const liveUpdateScript = `
            <script>
                window.addEventListener('message', (event) => {
                    if (event.data.type === 'UPDATE_STYLE') {
                        const { theme, fontPair } = event.data.payload;
                        const root = document.documentElement;
                        const styleId = 'live-style-sheet';
                        let styleSheet = document.getElementById(styleId);
                        if (!styleSheet) {
                            styleSheet = document.createElement('style');
                            styleSheet.id = styleId;
                            document.head.appendChild(styleSheet);
                        }
                        
                        const headingFont = fontPair.heading.replace(/ /g, '+');
                        const bodyFont = fontPair.body.replace(/ /g, '+');
                        const fontId = 'google-font-live';
                        let fontLink = document.getElementById(fontId);
                        if (!fontLink) {
                            fontLink = document.createElement('link');
                            fontLink.id = fontId;
                            fontLink.rel = 'stylesheet';
                            document.head.appendChild(fontLink);
                        }
                        fontLink.href = \`https://fonts.googleapis.com/css2?family=\${headingFont}:wght@700&family=\${bodyFont}:wght@400;700&display=swap\`;

                        styleSheet.innerHTML = \`
                            :root {
                                --primary-color: \${theme.primary};
                                --secondary-color: \${theme.secondary};
                                --background-color: \${theme.background};
                                --text-color: \${theme.text};
                                --font-heading: '\${fontPair.heading}', sans-serif;
                                --font-body: '\${fontPair.body}', sans-serif;
                            }
                        \`;
                    }
                });
            </script>
        `;
        let finalHtml = html
            .replace('</head>', `${liveUpdateScript}</head>`)
            .replace('<link rel="stylesheet" href="style.css">', `<style>${css}</style>`);
            
        const scriptTagRegex = /<script\s+src="script.js"\s*(defer)?\s*><\/script>/;
        if (scriptTagRegex.test(finalHtml)) {
            finalHtml = finalHtml.replace(scriptTagRegex, `<script>${js}</script>`);
        } else if (finalHtml.includes('</body>')) {
            finalHtml = finalHtml.replace('</body>', `<script>${js}</script></body>`);
        } else {
            finalHtml += `<script>${js}</script>`;
        }
            
        return finalHtml;
    }, [generatedCode, theme, fontPair]);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow && generatedCode) {
            setTimeout(() => {
                iframe.contentWindow.postMessage({
                    type: 'UPDATE_STYLE',
                    payload: { theme, fontPair }
                }, '*');
            }, 100);
        }
    }, [theme, fontPair, generatedCode]);

    const handleCopy = () => {
        if (!generatedCode) return;
        const codeToCopy = activeTab === 'html' ? generatedCode.html : activeTab === 'css' ? generatedCode.css : generatedCode.js;
        navigator.clipboard.writeText(codeToCopy.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

     const handleDeleteProject = (appId: string) => {
        if (currentUser?.email) {
            const allProjects: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]' );
            const appToDelete = allProjects.find(p => p.id === appId);
            if (!appToDelete) return;

            const deletedApps = JSON.parse(localStorage.getItem(`deletedProjects_${currentUser.email}`) || '[]');
            localStorage.setItem(`deletedProjects_${currentUser.email}`, JSON.stringify([appToDelete, ...deletedApps]));
            
            const updatedProjects = allProjects.filter(p => p.id !== appId);
            localStorage.setItem(`appProjects_${currentUser.email}`, JSON.stringify(updatedProjects));
            setTemplateProjects(updatedProjects.filter(p => p.creationMode === 'professionalTemplateGenerator'));
        }
    };
    
    const handleClear = () => {
        if (window.confirm('هل أنت متأكد أنك تريد مسح جميع الإعدادات والنتائج؟')) {
            setSelectedProjectId(projects.length > 0 ? projects[0].id : '');
            setTemplateCategory('Landing Page');
            setFontPair(fontPairings[0].value);
            setTheme({
                primary: '#6366f1',
                secondary: '#a855f7',
                background: '#111827',
                text: '#f3f4f6'
            });
            setGeneratedCode(null);
            setError('');
        }
    };

    const conversionTargets: { view: View; label: string }[] = [
        { view: 'ideaToCode', label: 'فكرة إلى كود' },
        { view: 'textToCode', label: 'نص إلى كود' },
        { view: 'screenToCode', label: 'شاشة إلى كود' },
        { view: 'uiRecognizer', label: 'محلل الواجهات' },
        { view: 'fileConverter', label: 'محول الملفات' },
        { view: 'drawToCode', label: 'تصميم إلى كود' },
    ];

    if (screen === 'list') {
         return (
            <div className="p-4 h-full flex flex-col animate-fade-in space-y-6">
                <header className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">مشاريع القوالب الاحترافية</h1>
                        <p className="text-slate-400">({templateProjects.length}) مشاريع</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => importFileRef.current?.click()} className="text-sm bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded-lg flex items-center gap-2"><UploadIcon className="w-4 h-4"/> استيراد</button>
                        <button onClick={handleExportProjects} className="text-sm bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded-lg flex items-center gap-2"><ArrowDownTrayIcon className="w-4 h-4"/> تصدير</button>
                        <button onClick={() => setScreen('generator')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><PlusIcon className="w-5 h-5"/> إنشاء قالب جديد</button>
                        <input type="file" accept=".json,.zip,application/zip" ref={importFileRef} className="hidden" onChange={handleImportProjects} />
                    </div>
                </header>
                 <div className="relative">
                    <input type="search" placeholder="ابحث عن قالب..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4" />
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                        <CodeIcon className="w-16 h-16 mb-4"/>
                        <h3 className="text-lg font-semibold">{templateProjects.length > 0 ? 'لم يتم العثور على نتائج' : 'لا توجد قوالب محفوظة'}</h3>
                        <p>{templateProjects.length > 0 ? 'جرّب كلمة بحث مختلفة أو فلتر آخر.' : 'انقر على "إنشاء قالب جديد" لتصميم قالب احترافي لمشاريعك.'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                        {filteredProjects.map(p => (
                             <ProjectCard 
                                key={p.id}
                                project={p}
                                onDelete={handleDeleteProject}
                                onEdit={(proj) => navigate('editApp', { project: proj })}
                            />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row h-full bg-slate-900 text-white animate-fade-in">
            <aside className="w-full lg:w-[30%] flex-shrink-0 bg-slate-800/50 border-b lg:border-r lg:border-b-0 border-slate-700 p-4 flex flex-col gap-6 overflow-y-auto">
                <div>
                     <button onClick={() => setScreen('list')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4">
                        <ArrowLeftIcon className="w-4 h-4" /> العودة إلى القائمة
                    </button>
                    <h2 className="text-xl font-bold text-slate-100">مولّد القوالب الاحترافية</h2>
                </div>
                
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">1. اختر مشروعًا</label>
                    <div className="flex items-center gap-2">
                        <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2.5 text-white">
                            {projects.length > 0 ? projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>) : <option>لا توجد مشاريع</option>}
                        </select>
                        {selectedProject && (
                            <button onClick={() => navigate('editApp', { project: selectedProject, originView: 'professionalTemplateGenerator' })} className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg" title="تعديل المشروع المحدد">
                                <WrenchScrewdriverIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    {selectedProject?.iconUrl && (
                        <div className="mt-2 flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg">
                            <img src={selectedProject.iconUrl} alt="icon" className="w-8 h-8 rounded-md object-cover" />
                            <p className="text-xs text-slate-400">أيقونة المشروع المحدد</p>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">2. اختر نمط القالب</label>
                    <div className="grid grid-cols-2 gap-2">
                        {templateCategories.map(cat => (
                            <button key={cat.id} onClick={() => setTemplateCategory(cat.id)} className={`p-3 rounded-lg border-2 transition-colors ${templateCategory === cat.id ? 'bg-indigo-600/30 border-indigo-500' : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'}`}>
                                <div className={`mx-auto ${templateCategory === cat.id ? 'text-indigo-300' : 'text-slate-400'}`}>{cat.icon}</div>
                                <p className="text-xs font-semibold mt-2">{cat.name}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="font-select" className="block text-sm font-medium text-slate-300">3. اختر الخطوط</label>
                    <select id="font-select" value={JSON.stringify(fontPair)} onChange={e => setFontPair(JSON.parse(e.target.value))} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2.5 text-white">
                       {fontPairings.map(fp => <option key={fp.name} value={JSON.stringify(fp.value)} style={{fontFamily: fp.value.body}}>{fp.name}</option>)}
                    </select>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-slate-300">4. خصص الألوان</label>
                        <button onClick={handleThemeSuggestion} disabled={isSuggesting} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50">
                            {isSuggesting ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <LightBulbIcon className="w-4 h-4"/>}
                            اقترح
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(theme).map(([key, value]) => (
                            <div key={key}>
                                <label className="text-xs text-slate-400 capitalize">{key}</label>
                                <input type="color" value={value} onChange={e => setTheme(t => ({...t, [key]: e.target.value}))} className="w-full h-10 p-1 bg-slate-700 rounded-md border border-slate-600 cursor-pointer"/>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-auto space-y-2">
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <div className="flex gap-2">
                        <button onClick={handleGenerate} disabled={isLoading || !selectedProjectId} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-500">
                            {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                            {isLoading ? 'جاري الإنشاء...' : 'إنشاء القالب'}
                        </button>
                        <button onClick={handleClear} title="مسح" className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/40">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Output Panel */}
            <main className="w-full lg:flex-1 flex flex-col min-w-0">
                {!generatedCode && !isLoading && (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 flex-col text-center p-8">
                        <CodeIcon className="w-12 h-12 mb-4 text-slate-600" />
                        <h3 className="font-semibold text-slate-300">معاينة القالب</h3>
                        <p>ستظهر المعاينة والأكواد هنا بعد الإنشاء.</p>
                    </div>
                )}
                 {isLoading && (
                    <div className="w-full h-full flex items-center justify-center"><SpinnerIcon className="w-10 h-10 animate-spin text-indigo-400"/></div>
                )}
                {generatedCode && !isLoading && (
                    <div className="flex h-full w-full flex-col">
                        <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 flex items-center justify-between p-2 flex-wrap gap-2">
                            <div className="flex items-center gap-1">
                                <button onClick={() => setActiveTab('preview')} className={`px-3 py-1 text-xs rounded-md ${activeTab === 'preview' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-600'}`}>المعاينة</button>
                                <button onClick={() => setActiveTab('html')} className={`px-3 py-1 text-xs rounded-md ${activeTab === 'html' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-600'}`}>HTML</button>
                                <button onClick={() => setActiveTab('css')} className={`px-3 py-1 text-xs rounded-md ${activeTab === 'css' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-600'}`}>CSS</button>
                                <button onClick={() => setActiveTab('js')} className={`px-3 py-1 text-xs rounded-md ${activeTab === 'js' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-600'}`}>JS</button>
                            </div>
                            <div className="flex items-center gap-2">
                                {activeTab !== 'preview' && (
                                    <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-md">
                                        {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                                        {copied ? 'تم النسخ' : 'نسخ'}
                                    </button>
                                )}
                                <div ref={convertMenuRef} className="relative">
                                    <button onClick={() => setIsConvertMenuOpen(prev => !prev)} title="تحويل المشروع" className="flex items-center gap-1.5 text-xs bg-slate-600 hover:bg-slate-500 px-3 py-1 rounded-md"><ArrowPathIcon className="w-4 h-4"/>تحويل</button>
                                    {isConvertMenuOpen && (
                                        <div className="absolute left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg py-1 z-20">
                                            {conversionTargets.filter(t => t.view !== 'professionalTemplateGenerator').map(target => (
                                                <button
                                                    key={target.view}
                                                    onClick={() => {
                                                        const tempProject = { ...selectedProject, id: `temp-${Date.now()}`, files: [ { name: 'index.html', language: 'html', content: generatedCode.html }, { name: 'style.css', language: 'css', content: generatedCode.css }, { name: 'script.js', language: 'javascript', content: generatedCode.js } ] };
                                                        navigate(target.view, { project: tempProject });
                                                        setIsConvertMenuOpen(false);
                                                    }}
                                                    className="w-full text-right block px-3 py-1.5 text-sm hover:bg-slate-700"
                                                >{target.label}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setIsApplyModalOpen(true)} className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-500 px-3 py-1 rounded-md">
                                    <BriefcaseIcon className="w-4 h-4"/>
                                    تطبيق
                                </button>
                                <button onClick={handleSaveAsProject} className="flex items-center gap-1.5 text-xs bg-slate-600 hover:bg-slate-500 px-3 py-1 rounded-md">
                                    <SaveIcon className="w-4 h-4"/>
                                    حفظ
                                </button>
                                <button onClick={handleDownload} className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-md">
                                    <ArrowDownTrayIcon className="w-4 h-4"/>
                                    تحميل
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow bg-[#0d1117] relative">
                            {activeTab === 'preview' && <iframe ref={iframeRef} title="Preview" srcDoc={srcDoc} className="w-full h-full border-0" sandbox="allow-scripts"/>}
                            {activeTab === 'html' && (
                                <textarea
                                    value={generatedCode.html}
                                    readOnly
                                    className="w-full h-full p-4 bg-[#0d1117] font-mono text-sm text-slate-300 border-none focus:outline-none resize-none leading-relaxed"
                                    spellCheck="false"
                                />
                            )}
                            {activeTab === 'css' && (
                                <textarea
                                    value={generatedCode.css}
                                    readOnly
                                    className="w-full h-full p-4 bg-[#0d1117] font-mono text-sm text-slate-300 border-none focus:outline-none resize-none leading-relaxed"
                                    spellCheck="false"
                                />
                            )}
                            {activeTab === 'js' && (
                                <textarea
                                    value={generatedCode.js}
                                    readOnly
                                    className="w-full h-full p-4 bg-[#0d1117] font-mono text-sm text-slate-300 border-none focus:outline-none resize-none leading-relaxed"
                                    spellCheck="false"
                                />
                            )}
                        </div>
                    </div>
                )}
            </main>
            <ApplyToProjectModal
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                projects={projects.filter(p => p.creationMode !== 'professionalTemplateGenerator')}
                onApply={handleApplyToProject}
            />
        </div>
    );
};

export default ProfessionalTemplateGenerator;
