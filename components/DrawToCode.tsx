
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Project, View, ProjectType, ProjectFile, Message } from '../types';
import { geminiService } from '../services/geminiService';
import { useUsage } from '../hooks/useUsage';
import { useAuth } from '../hooks/useAuth';
import {
    SparklesIcon, SpinnerIcon, ArrowLeftIcon, CodeIcon, PlusIcon, TrashIcon,
    PaintBrushIcon, PhotoIcon, StopIcon, ChatBubbleBottomCenterTextIcon,
    HandRaisedIcon, CursorArrowRaysIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, DocumentDuplicateIcon,
    UploadIcon, ArrowDownTrayIcon, MagnifyingGlassIcon,
    CodeIcon as FileCodeIcon, CssIcon, JsIcon, ComputerDesktopIcon, DevicePhoneMobileIcon,
    Share2Icon, ArrowPathIcon, ShieldCheckIcon, SendIcon, CheckIcon, CopyIcon, CloseIcon,
    BellIcon
} from './Icons';
import UpgradeModal from './UpgradeModal';
import { ProjectCard } from './ProjectCard';
// IMPORT SOFTWARE PROJECT BUILDER
import { SoftwareProjectBuilder } from './SoftwareProjectBuilder';

// --- Helper Components ---

const LoadingScreen: React.FC<{ logs: string[] }> = ({ logs }) => {
    const isFailed = logs.some(log => log.toLowerCase().includes('فشل'));
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in bg-slate-900">
            {isFailed ? <CloseIcon className="w-12 h-12 text-red-400 mb-6"/> : <SpinnerIcon className="w-12 h-12 text-indigo-400 animate-spin mb-6" />}
            <h2 className="text-2xl font-bold text-white">{isFailed ? 'حدث خطأ' : 'مهندس الذكاء الاصطناعي يحول تصميمك...'}</h2>
            <p className="text-slate-400 mt-2">{isFailed ? 'لم نتمكن من إكمال بناء المشروع.' : 'يتم الآن تحويل الرسم إلى كود تفاعلي مع أزرار حية.'}</p>
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

// --- Types ---
type ElementType = 'rect' | 'circle' | 'text' | 'button' | 'input' | 'image' | 'icon' | 'emoji';

interface DrawElement {
    id: string;
    type: ElementType;
    content?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    fontSize?: number;
    zIndex: number;
}

const DEFAULT_ELEMENTS: Record<ElementType, Partial<DrawElement>> = {
    rect: { width: 200, height: 150, backgroundColor: '#e2e8f0', borderRadius: 4 },
    circle: { width: 100, height: 100, backgroundColor: '#3b82f6', borderRadius: 50 },
    button: { width: 120, height: 40, backgroundColor: '#4f46e5', content: 'زر جديد', textColor: '#ffffff', borderRadius: 8 },
    input: { width: 200, height: 40, backgroundColor: '#ffffff', content: 'أدخل النص...', textColor: '#64748b', borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 6 },
    text: { width: 150, height: 30, content: 'نص توضيحي', textColor: '#1e293b', fontSize: 16, backgroundColor: 'transparent' },
    image: { width: 150, height: 150, backgroundColor: '#94a3b8', content: 'صورة' },
    icon: { width: 48, height: 48, content: '★', textColor: '#f59e0b', backgroundColor: 'transparent', fontSize: 32 },
    emoji: { width: 48, height: 48, content: '🔔', textColor: '#000000', backgroundColor: 'transparent', fontSize: 32 }
};

const DrawToCode: React.FC<{ navigate: (view: View, context?: any) => void; context?: any; }> = ({ navigate, context }) => {
    const { currentUser, updateUser } = useAuth();
    const { incrementUsage, isLimitReached } = useUsage();

    // --- State ---
    const [screen, setScreen] = useState<'list' | 'generator' | 'editor'>('list');
    const [projects, setProjects] = useState<Project[]>([]);
    const [project, setProject] = useState<Project | null>(null); // For Editor View
    
    // List View State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const importFileRef = useRef<HTMLInputElement>(null);

    // Generator (Canvas) State
    const [history, setHistory] = useState<DrawElement[][]>([[]]);
    const [historyStep, setHistoryStep] = useState(0);
    const elements = history[historyStep] || [];
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [projectName, setProjectName] = useState('مشروع رسم جديد');
    const [projectIconUrl, setProjectIconUrl] = useState<string | null>(null); // Added icon state
    const [activeTool, setActiveTool] = useState<ElementType | 'select'>('select');
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isGenerating, setIsGenerating] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    // --- Effects ---
    useEffect(() => {
        if (screen === 'list' && currentUser?.email) {
            const allProjects: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
            const drawProjects = allProjects.filter(p => p.creationMode === 'drawToCode');
            setProjects(drawProjects);
        }
    }, [screen, currentUser]);

    useEffect(() => {
        if (context?.project) {
            setProject(context.project);
            // Directly switch to editor view, SoftwareProjectBuilder will handle the rest
            setScreen('editor');
        }
    }, [context]);

    // --- List View Logic ---
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterType === 'all' || p.type === filterType;
            return matchesSearch && matchesFilter;
        });
    }, [projects, searchQuery, filterType]);

    const projectTypesInView = useMemo(() => (
        ['all', ...Array.from(new Set(projects.map(p => p.type)))]
    ), [projects]);

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
                    creationMode: 'drawToCode',
                    ownerEmail: currentUser.email,
                }));

                const key = `appProjects_${currentUser.email}`;
                const savedApps: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
                const updatedApps = [...validProjects, ...savedApps];
                localStorage.setItem(key, JSON.stringify(updatedApps));

                setProjects(updatedApps.filter(p => p.creationMode === 'drawToCode'));
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
        a.download = 'draw-to-code-projects.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
            
            if (project && project.id === appId) {
                setProject(null);
                setScreen('list');
            } else {
                setProjects(updatedProjects.filter(p => p.creationMode === 'drawToCode'));
            }
        }
    };

    const handleShare = async (type: 'link' | 'files', projectToShare?: Project) => {
        const p = projectToShare || project;
        if (!p || !navigator.share) {
            alert('متصفحك لا يدعم ميزة المشاركة.');
            return;
        }

        // Specific URL requested for sharing logic
        const platformUrl = 'https://ai.studio/apps/drive/185Fbm07Ss2VEtCX0im7ab0fo0bjDfylW';

        try {
            if (type === 'link') {
                await navigator.share({
                    title: p.name,
                    text: `مشروع "${p.name}" تم تصميمه بواسطة AI ideas.\n\nرابط المنصة: ${platformUrl}`,
                    url: platformUrl, 
                });
            } else { // type === 'files'
                if (!window.JSZip) {
                    alert('مكتبة الضغط غير متاحة للمشاركة.');
                    return;
                }
                const zip = new window.JSZip();
                p.files.forEach(file => zip.file(file.name, file.content));
                const blob = await zip.generateAsync({ type: 'blob' });
                const file = new File([blob], `${p.name.replace(/\s+/g, '_')}.zip`, { type: 'application/zip' });
                
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: p.name,
                        text: `ملفات مشروع "${p.name}".\n\nرابط المنصة: ${platformUrl}`,
                        url: platformUrl
                    });
                } else {
                    // Fallback to text share with URL if file sharing fails/unsupported
                    await navigator.share({
                        title: p.name,
                        text: `مشروع "${p.name}" (ملفات).\n\nرابط المنصة: ${platformUrl}`,
                        url: platformUrl
                    });
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

    // --- Canvas/Generator Logic ---
    const pushToHistory = (newElements: DrawElement[]) => {
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(newElements);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (historyStep > 0) {
            setHistoryStep(prev => prev - 1);
            setSelectedIds([]);
        }
    };

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            setHistoryStep(prev => prev + 1);
            setSelectedIds([]);
        }
    };

    const handleCreateNew = () => {
        setHistory([[]]);
        setHistoryStep(0);
        setProjectName(`تصميم ${new Date().toLocaleDateString('ar-EG')}`);
        setProjectIconUrl(null);
        setScreen('generator');
        setActiveTool('select');
    };

    const addElement = (type: ElementType) => {
        const defaults = DEFAULT_ELEMENTS[type];
        const newEl: DrawElement = {
            id: `el-${Date.now()}`,
            type,
            x: 100 + elements.length * 20,
            y: 100 + elements.length * 20,
            width: defaults.width || 100,
            height: defaults.height || 100,
            zIndex: elements.length + 1,
            backgroundColor: defaults.backgroundColor,
            textColor: defaults.textColor,
            borderColor: defaults.borderColor,
            borderWidth: defaults.borderWidth,
            borderRadius: defaults.borderRadius,
            content: defaults.content,
            fontSize: defaults.fontSize,
        };
        pushToHistory([...elements, newEl]);
        setSelectedIds([newEl.id]);
        setActiveTool('select');
    };

    const updateSelectedElement = (updates: Partial<DrawElement>) => {
        if (selectedIds.length === 0) return;
        const newElements = elements.map(el => selectedIds.includes(el.id) ? { ...el, ...updates } : el);
        const newHistory = [...history];
        newHistory[historyStep] = newElements;
        setHistory(newHistory);
    };

    const commitChange = () => {
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push([...elements]); 
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    const handleDeleteSelected = () => {
        const newElements = elements.filter(el => !selectedIds.includes(el.id));
        pushToHistory(newElements);
        setSelectedIds([]);
    };
    
    const handleDuplicateSelected = () => {
        if (selectedIds.length === 0) return;
        const selectedEls = elements.filter(el => selectedIds.includes(el.id));
        const newEls = selectedEls.map(el => ({
            ...el,
            id: `el-${Date.now()}-${Math.random()}`,
            x: el.x + 20,
            y: el.y + 20,
            zIndex: elements.length + 1
        }));
        pushToHistory([...elements, ...newEls]);
        setSelectedIds(newEls.map(e => e.id));
    };

    const handleBringToFront = () => {
        if (selectedIds.length === 0) return;
        const maxZ = Math.max(...elements.map(e => e.zIndex), 0);
        updateSelectedElement({ zIndex: maxZ + 1 });
        commitChange();
    };

    const handleSendToBack = () => {
        if (selectedIds.length === 0) return;
        const minZ = Math.min(...elements.map(e => e.zIndex), 0);
        updateSelectedElement({ zIndex: minZ - 1 });
        commitChange();
    };

    const handleMouseDown = (e: React.MouseEvent, id: string, type: 'drag' | 'resize') => {
        e.stopPropagation();
        setSelectedIds([id]);
        const el = elements.find(e => e.id === id);
        if (!el) return;
        if (type === 'drag') {
            setIsDragging(true);
            setDragOffset({ x: e.clientX - el.x, y: e.clientY - el.y });
        } else {
            setIsResizing(true);
            setDragOffset({ x: e.clientX, y: e.clientY }); 
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (selectedIds.length === 0) return;
        const id = selectedIds[0];
        if (isDragging) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            const snappedX = Math.round(newX / 10) * 10;
            const snappedY = Math.round(newY / 10) * 10;
            const newElements = elements.map(el => el.id === id ? { ...el, x: snappedX, y: snappedY } : el);
            const newHistory = [...history];
            newHistory[historyStep] = newElements;
            setHistory(newHistory);
        } else if (isResizing) {
            const el = elements.find(e => e.id === id);
            if (!el) return;
            const deltaX = e.clientX - dragOffset.x;
            const deltaY = e.clientY - dragOffset.y;
            setDragOffset({ x: e.clientX, y: e.clientY });
            const newElements = elements.map(item => {
                if (item.id === id) {
                    return {
                        ...item,
                        width: Math.max(20, item.width + deltaX),
                        height: Math.max(20, item.height + deltaY)
                    };
                }
                return item;
            });
            const newHistory = [...history];
            newHistory[historyStep] = newElements;
            setHistory(newHistory);
        }
    };

    const handleMouseUp = () => {
        if (isDragging || isResizing) {
            setIsDragging(false);
            setIsResizing(false);
            commitChange();
        }
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (e.target === canvasRef.current) {
            setSelectedIds([]);
        }
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
        if (elements.length === 0) {
            setError('اللوحة فارغة! أضف بعض العناصر أولاً.');
            return;
        }
        // Use the specific daily limit for Draw to Code (default 3/day for free)
        if (isLimitReached(ProjectType.DRAW_TO_CODE)) {
            setUpgradeModalOpen(true);
            return;
        }

        setIsGenerating(true);
        setLogs([]);
        setError('');

        try {
            const sceneDescription = elements.map(el => {
                let desc = `- Type: ${el.type}, Position: (${el.x},${el.y}), Size: ${el.width}x${el.height}`;
                if (el.backgroundColor) desc += `, Background: ${el.backgroundColor}`;
                if (el.content) desc += `, Content/Text: "${el.content}"`;
                if (el.textColor) desc += `, Text Color: ${el.textColor}`;
                if (el.borderRadius) desc += `, Radius: ${el.borderRadius}`;
                return desc;
            }).join('\n');

            const prompt = `
            I have drawn a UI design on a canvas. Convert this visual layout into a fully functional, interactive, responsive HTML/TailwindCSS web page.
            
            **Design Elements:**
            ${sceneDescription}
            
            **Instructions:**
            1. **Layout:** Create a clean, modern layout using Tailwind CSS Flexbox/Grid. Avoid absolute positioning unless absolutely necessary. Match colors, dimensions, and border radii from the design.
            2. **Interactivity (CRITICAL):**
               - **EVERY BUTTON MUST WORK.** Do not generate static buttons.
               - Generate a robust 'script.js' that attaches event listeners to all interactive elements.
               - For 'Submit' buttons: Prevent default form submission, show a loading state (change text to 'Sending...'), wait 1 second, then show a success alert or message.
               - For Navigation/Menu buttons: Implement smooth scrolling to sections or toggle a mobile menu/modal.
               - For specific actions (e.g., "Calculate", "Buy"): Implement the logic (e.g., math calculation, cart increment).
               - For EMOJI/ICON elements (like '🔔'): Treat them as interactive buttons or functional icons. For example, a '🔔' should simulate a notification alert when clicked.
               - **Inputs:** Add validation or real-time character counting.
            3. **Components:**
               - 'rect': Container/Card/Section background.
               - 'input': Functional HTML input field with focus states.
               - 'button': <button> tag with hover effects and JS click handler.
               - 'image': <img> tag with object-cover.
               - 'emoji': Treat as an icon/button.
            
            **Project Name:** ${projectName}
            **Project Icon:** Use the placeholder '{{PROJECT_ICON_URL}}' for the logo/icon in the header if needed.
            
            Output valid JSON with 'files' array containing:
            - index.html (Structure & Tailwind classes)
            - style.css (Custom animations/overrides)
            - script.js (All interactivity logic)
            `;

            const onLog = (log: string) => setLogs(prev => [...prev, log]);

            const newProject = await geminiService.buildProjectFromSpec({
                projectName,
                prompt,
                projectType: ProjectType.WEBSITE,
                files: [],
                iconUrl: projectIconUrl
            }, onLog);

            newProject.creationMode = 'drawToCode';
            newProject.id = `draw-${Date.now()}`;

            if (currentUser?.email) {
                const key = `appProjects_${currentUser.email}`;
                const savedApps: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
                savedApps.unshift(newProject);
                localStorage.setItem(key, JSON.stringify(savedApps));
            }

            incrementUsage(ProjectType.DRAW_TO_CODE);
            
            // Navigate to Editor
            setProject(newProject);
            setScreen('editor');

        } catch (e) {
            setError('فشل التحويل. حاول مرة أخرى.');
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Render Methods ---

    const renderListView = () => (
        <div className="p-4 md:p-8 h-full flex flex-col animate-fade-in">
            <header className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">تصميم إلى كود</h2>
                    <p className="text-slate-400">({projects.length}) مشاريع</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => importFileRef.current?.click()} className="text-sm bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded-lg flex items-center gap-2"><UploadIcon className="w-4 h-4"/> استيراد</button>
                    <button onClick={handleExportProjects} className="text-sm bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded-lg flex items-center gap-2"><ArrowDownTrayIcon className="w-4 h-4"/> تصدير</button>
                    <button onClick={handleCreateNew} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                        <PlusIcon className="w-5 h-5"/> تصميم جديد
                    </button>
                    <input type="file" accept=".json,.zip,application/zip" ref={importFileRef} className="hidden" onChange={handleImportProjects} />
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
                <div className="flex-grow flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/30">
                    <PaintBrushIcon className="w-16 h-16 mb-4 opacity-50"/>
                    <h3 className="text-lg font-semibold">{projects.length > 0 ? 'لم يتم العثور على نتائج' : 'لا توجد تصميمات محفوظة'}</h3>
                    <p>{projects.length > 0 ? 'جرّب كلمة بحث مختلفة أو فلتر آخر.' : 'انقر على "تصميم جديد" للبدء.'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                    {filteredProjects.map(p => (
                        <ProjectCard 
                            key={p.id}
                            project={p}
                            onDelete={handleDeleteProject}
                            onEdit={(proj) => {
                                setProject(proj);
                                setScreen('editor');
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );

    const renderGeneratorView = () => {
        const selectedElement = elements.find(el => selectedIds.includes(el.id));
        
        return (
            <div className="flex flex-col h-full bg-slate-900 text-white animate-fade-in overflow-hidden">
                {/* HEADER */}
                <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 flex-shrink-0 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setScreen('list')} className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white">
                            <ArrowLeftIcon className="w-5 h-5"/>
                        </button>
                        <input 
                            type="text" 
                            value={projectName} 
                            onChange={e => setProjectName(e.target.value)}
                            className="bg-transparent border-b border-transparent hover:border-slate-500 focus:border-indigo-500 outline-none font-bold text-lg px-2 py-1 w-64"
                        />
                        
                        {/* Project Icon Upload Trigger */}
                        <div className="relative group w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center cursor-pointer">
                            {projectIconUrl ? (
                                <img src={projectIconUrl} alt="Icon" className="w-full h-full object-cover rounded-md" />
                            ) : (
                                <UploadIcon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                            )}
                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleIconUpload} title="رفع أيقونة المشروع" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isGenerating && <span className="text-xs text-indigo-400 animate-pulse">جاري التحويل والذكاء...</span>}
                        <button onClick={handleConvert} disabled={isGenerating} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 shadow-lg transition-all disabled:opacity-50">
                            {isGenerating ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <CodeIcon className="w-5 h-5"/>}
                            تحويل إلى كود
                        </button>
                    </div>
                </header>

                {/* TOOLBAR */}
                <div className="h-14 bg-slate-800/50 border-b border-slate-700 flex items-center px-4 gap-2 overflow-x-auto flex-shrink-0">
                    <ToolButton icon={<CursorArrowRaysIcon className="w-5 h-5"/>} label="تحديد" active={activeTool === 'select'} onClick={() => setActiveTool('select')} />
                    <div className="w-px h-8 bg-slate-700 mx-2"></div>
                    <ToolButton icon={<StopIcon className="w-5 h-5"/>} label="صندوق" onClick={() => addElement('rect')} />
                    <ToolButton icon={<div className="w-4 h-4 rounded-full border-2 border-current"/>} label="دائرة" onClick={() => addElement('circle')} />
                    <ToolButton icon={<ChatBubbleBottomCenterTextIcon className="w-5 h-5"/>} label="نص" onClick={() => addElement('text')} />
                    <ToolButton icon={<div className="w-5 h-2.5 bg-current rounded-sm"/>} label="زر" onClick={() => addElement('button')} />
                    <ToolButton icon={<div className="w-5 h-3 border border-current rounded-sm text-[6px] flex items-center px-0.5">|</div>} label="إدخال" onClick={() => addElement('input')} />
                    <ToolButton icon={<PhotoIcon className="w-5 h-5"/>} label="صورة" onClick={() => addElement('image')} />
                    <ToolButton icon={<SparklesIcon className="w-5 h-5"/>} label="أيقونة" onClick={() => addElement('icon')} />
                    <ToolButton icon={<BellIcon className="w-5 h-5"/>} label="أوموجي" onClick={() => addElement('emoji')} />
                    
                    <div className="flex-grow"></div>
                    
                    <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
                        <button onClick={handleUndo} disabled={historyStep === 0} className="p-2 text-slate-400 hover:text-white disabled:opacity-30" title="تراجع"><ArrowUturnRightIcon className="w-5 h-5 transform -scale-x-100"/></button>
                        <button onClick={handleRedo} disabled={historyStep === history.length - 1} className="p-2 text-slate-400 hover:text-white disabled:opacity-30" title="إعادة"><ArrowUturnLeftIcon className="w-5 h-5 transform -scale-x-100"/></button>
                    </div>
                </div>

                {/* CANVAS */}
                <main 
                    className="flex-grow bg-[#1e1e2e] relative overflow-hidden select-none"
                    ref={canvasRef}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onClick={handleCanvasClick}
                >
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    
                    {elements.map(el => {
                        const isSelected = selectedIds.includes(el.id);
                        return (
                            <div
                                key={el.id}
                                onMouseDown={(e) => handleMouseDown(e, el.id, 'drag')}
                                style={{
                                    position: 'absolute',
                                    left: el.x,
                                    top: el.y,
                                    width: el.width,
                                    height: el.height,
                                    backgroundColor: el.backgroundColor,
                                    color: el.textColor,
                                    borderColor: el.borderColor,
                                    borderWidth: el.borderWidth ? `${el.borderWidth}px` : undefined,
                                    borderStyle: el.borderWidth ? 'solid' : undefined,
                                    borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
                                    fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
                                    zIndex: el.zIndex,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: activeTool === 'select' ? 'move' : 'default',
                                    boxShadow: isSelected ? '0 0 0 2px #6366f1, 0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap'
                                }}
                                className="transition-shadow"
                            >
                                {el.type === 'image' ? (
                                    <div className="flex flex-col items-center justify-center text-slate-400/50 w-full h-full bg-slate-200/10">
                                        <PhotoIcon className="w-1/3 h-1/3"/>
                                        <span className="text-xs mt-1">صورة</span>
                                    </div>
                                ) : (
                                    el.content
                                )}

                                {isSelected && (
                                    <div 
                                        onMouseDown={(e) => handleMouseDown(e, el.id, 'resize')}
                                        className="absolute bottom-0 right-0 w-4 h-4 bg-indigo-600 cursor-nwse-resize z-50"
                                        style={{ borderRadius: '4px 0 4px 0' }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </main>

                {/* PROPERTIES PANEL */}
                {selectedElement ? (
                    <div className="h-auto min-h-[120px] bg-slate-800 border-t border-slate-700 p-4 flex flex-col gap-2 flex-shrink-0 overflow-y-auto animate-fade-in-up">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-slate-200 text-sm">خصائص العنصر</h3>
                            <div className="flex gap-2">
                                <button onClick={handleBringToFront} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-300">للأمام</button>
                                <button onClick={handleSendToBack} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-300">للخلف</button>
                                <button onClick={handleDuplicateSelected} className="text-xs bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 px-2 py-1 rounded flex items-center gap-1"><DocumentDuplicateIcon className="w-3 h-3"/> تكرار</button>
                                <button onClick={handleDeleteSelected} className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 px-2 py-1 rounded flex items-center gap-1"><TrashIcon className="w-3 h-3"/> حذف</button>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 block">النص</label>
                                <input 
                                    type="text" 
                                    value={selectedElement.content || ''} 
                                    onChange={(e) => updateSelectedElement({ content: e.target.value })}
                                    className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm w-40"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 block">الأبعاد (W x H)</label>
                                <div className="flex gap-1">
                                    <input type="number" value={selectedElement.width} onChange={(e) => updateSelectedElement({ width: parseInt(e.target.value) })} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm w-20" />
                                    <span className="text-slate-500 self-center">x</span>
                                    <input type="number" value={selectedElement.height} onChange={(e) => updateSelectedElement({ height: parseInt(e.target.value) })} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm w-20" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 block">الخلفية</label>
                                <div className="flex gap-1 items-center">
                                    <input type="color" value={selectedElement.backgroundColor || '#ffffff'} onChange={(e) => updateSelectedElement({ backgroundColor: e.target.value })} className="w-8 h-8 p-0 border-0 rounded cursor-pointer" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 block">لون النص</label>
                                <div className="flex gap-1 items-center">
                                    <input type="color" value={selectedElement.textColor || '#000000'} onChange={(e) => updateSelectedElement({ textColor: e.target.value })} className="w-8 h-8 p-0 border-0 rounded cursor-pointer" />
                                </div>
                            </div>

                            <div className="space-y-1 flex-grow max-w-xs">
                                <label className="text-xs text-slate-400 block">حجم الخط ({selectedElement.fontSize}px)</label>
                                <input 
                                    type="range" min="10" max="100" 
                                    value={selectedElement.fontSize || 16} 
                                    onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="space-y-1 flex-grow max-w-xs">
                                <label className="text-xs text-slate-400 block">تدوير الحواف ({selectedElement.borderRadius}px)</label>
                                <input 
                                    type="range" min="0" max="50" 
                                    value={selectedElement.borderRadius || 0} 
                                    onChange={(e) => updateSelectedElement({ borderRadius: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-12 bg-slate-800 border-t border-slate-700 flex items-center justify-center text-slate-500 text-xs flex-shrink-0">
                        <HandRaisedIcon className="w-4 h-4 mr-2"/> حدد عنصرًا لتعديل خصائصه
                    </div>
                )}
                
                {error && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg z-50">
                        {error}
                    </div>
                )}
            </div>
        );
    };

    if (isGenerating) return <LoadingScreen logs={logs} />;

    if (screen === 'editor' && project) {
        return (
            <div className="flex flex-col h-full bg-slate-900 text-white">
               <SoftwareProjectBuilder 
                    navigate={navigate} 
                    mode="draw" 
                    context={{ project: project }}
                    onNewProject={() => setScreen('generator')}
                />
                <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
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

const ToolButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }> = ({ icon, label, onClick, active }) => (
    <button 
        onClick={onClick} 
        className={`p-2 rounded-lg flex items-center justify-center transition-colors ${active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
        title={label}
    >
        {icon}
    </button>
);

export default DrawToCode;
