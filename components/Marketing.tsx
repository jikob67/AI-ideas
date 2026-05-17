
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MarketingAsset, Project, ProjectType, View } from '../types';
import { geminiService } from '../services/geminiService';
import { useAuth } from '../hooks/useAuth';
import { useUsage } from '../hooks/useUsage';
import UpgradeModal from './UpgradeModal';
// FIX: Changed to named import as ProjectCard does not have a default export.
import { ProjectCard } from './ProjectCard';
import {
    SparklesIcon, SpinnerIcon, CopyIcon,
    CheckIcon, TrashIcon, UploadIcon, Share2Icon, ArrowDownTrayIcon, CodeIcon, GlobeEuropeAfricaIcon, VideoIcon, PhotoIcon, LightBulbIcon,
    ChatBubbleBottomCenterTextIcon, TwitterIcon, FacebookIcon, LinkedInIcon,
    InstagramIcon,
    SaveIcon,
    BriefcaseIcon,
    FilmIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    ArrowLeftIcon,
    FireIcon,
    RocketLaunchIcon,
    CloseIcon
} from './Icons';
import { resolveBlobUrlToDataUrl } from '../contexts/AuthContext';


interface MarketingProps {
    context?: any;
    navigate: (view: View, context?: any) => void;
}

type Screen = 'list' | 'generator' | 'editor';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

const PlatformIcon: React.FC<{ platform?: string }> = ({ platform }) => {
    if (!platform) return null;
    switch (platform.toLowerCase()) {
        case 'instagram': return <InstagramIcon className="w-5 h-5" />;
        case 'facebook': return <FacebookIcon className="w-5 h-5" />;
        case 'twitter': return <TwitterIcon className="w-5 h-5" />;
        case 'linkedin': return <LinkedInIcon className="w-5 h-5" />;
        default: return <GlobeEuropeAfricaIcon className="w-5 h-5" />;
    }
};

const LoadingScreen: React.FC<{ logs: string[]; }> = ({ logs }) => {
    const isFailed = logs.some(log => log.toLowerCase().includes('فشل'));
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in bg-slate-900">
            {isFailed ? <CloseIcon className="w-12 h-12 text-red-400 mb-6"/> : <SpinnerIcon className="w-12 h-12 text-indigo-400 animate-spin mb-6" />}
            <h2 className="text-2xl font-bold text-white">{isFailed ? 'حدث خطأ' : 'مهندس التسويق الذكي يبدع...'}</h2>
            <p className="text-slate-400 mt-2">{isFailed ? 'لم نتمكن من إنشاء أصول حملتك.' : 'لحظات وتصبح حملتك جاهزة للانطلاق.'}</p>
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

const Marketing: React.FC<MarketingProps> = ({ context, navigate }) => {
    const { currentUser } = useAuth();
    const { incrementUsage, isLimitReached } = useUsage();
    
    const [screen, setScreen] = useState<Screen>('list');
    const [projects, setProjects] = useState<Project[]>([]); // For list view
    const [currentCampaign, setCurrentCampaign] = useState<Project | null>(null); // For editor view

    // Generator State
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [campaignName, setCampaignName] = useState('');
    const [marketingGoals, setMarketingGoals] = useState('');
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [error, setError] = useState('');

    // List View State
    const [searchQuery, setSearchQuery] = useState('');

    // Editor State
    const [activeTab, setActiveTab] = useState<'image' | 'video' | 'text'>('image');
    const [assetPrompt, setAssetPrompt] = useState('');
    const [isGeneratingAsset, setIsGeneratingAsset] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [copiedContentId, setCopiedContentId] = useState<string | null>(null);
    
    const [hasSelectedApiKey, setHasSelectedApiKey] = useState(false);
    const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);

    const onLog = (log: string) => setLogs(prev => [...prev, log]);

    useEffect(() => {
        if (!currentUser?.email) return;

        const allUserProjects: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
        
        if (screen === 'list') {
            const marketingCampaigns = allUserProjects.filter(p => p.creationMode === 'marketing');
            setProjects(marketingCampaigns);
        } else if (screen === 'generator') {
            const nonMarketingProjects = allUserProjects.filter(p => p.creationMode !== 'marketing');
            setAllProjects(nonMarketingProjects);
            if (nonMarketingProjects.length > 0 && !selectedProjectId) {
                setSelectedProjectId(nonMarketingProjects[0].id);
            }
        }

    }, [currentUser, screen, selectedProjectId]);
    
    useEffect(() => {
        if (context?.project) {
            setCurrentCampaign(context.project);
            setScreen('editor');
        }
    }, [context]);

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio) {
                try {
                    const hasKey = await window.aistudio.hasSelectedApiKey();
                    setHasSelectedApiKey(hasKey);
                } catch (e) { console.error("Error checking API key:", e); }
            }
            setIsCheckingApiKey(false);
        };
        checkApiKey();
    }, []);

    const filteredCampaigns = useMemo(() => {
        return projects.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [projects, searchQuery]);

    const resetGeneratorState = () => {
        setSelectedProjectId(allProjects.length > 0 ? allProjects[0].id : '');
        setCampaignName('');
        setMarketingGoals('');
        setError('');
        setLogs([]);
    };

    const handleNewCampaign = () => {
        resetGeneratorState();
        setScreen('generator');
    };
    
    const handleGenerateCampaign = async () => {
        const projectToMarket = allProjects.find(p => p.id === selectedProjectId);
        if (!projectToMarket) {
            setError('الرجاء اختيار مشروع صالح.');
            return;
        }
        if (!campaignName.trim()) {
            setError('الرجاء إدخال اسم للحملة.');
            return;
        }
        if (isLimitReached(ProjectType.MARKETING_GENERATION)) {
            // Upgrade modal will be handled by the specific generator function
        }

        setIsGenerating(true);
        onLog('بدء إنشاء الحملة...');

        try {
            // For simplicity, let's generate a few assets. A real app might use a more complex service call.
            onLog('إنشاء صورة إعلانية...');
            const imagePrompt = `صورة إعلانية جذابة لمشروع "${projectToMarket.name}"، وهو ${projectToMarket.description}. الهدف: ${marketingGoals}`;
            const imageBase64 = await geminiService.generateImage(imagePrompt, '1:1');
            const imageAsset: MarketingAsset = {
                id: `asset-img-${Date.now()}`, type: 'image', dataUrl: `data:image/jpeg;base64,${imageBase64}`,
                timestamp: Date.now(), title: 'صورة إعلانية أولية'
            };
            onLog('✓ تم إنشاء الصورة.');
            
            onLog('إنشاء منشور اجتماعي...');
            const textPrompt = `اكتب منشورًا لـ Twitter للإعلان عن مشروعنا "${projectToMarket.name}". الهدف: ${marketingGoals}`;
            const textContent = await geminiService.generateText(textPrompt, 'gemini-2.5-flash');
            const textAsset: MarketingAsset = {
                id: `asset-text-${Date.now()}`, type: 'text', content: textContent,
                platform: 'Twitter', timestamp: Date.now(), title: 'منشور إعلان أولي'
            };
            onLog('✓ تم إنشاء المنشور.');

            const newCampaign: any = {
                id: `proj-mktg-${Date.now()}`,
                name: campaignName,
                description: marketingGoals,
                type: ProjectType.MARKETING_GENERATION,
                creationMode: 'marketing',
                iconUrl: projectToMarket.iconUrl,
                files: [],
                sections: [],
                marketingAssets: [imageAsset, textAsset],
                ownerEmail: currentUser?.email,
                timestamp: Date.now(),
            };
            
            if (currentUser?.email) {
                const key = `appProjects_${currentUser.email}`;
                const allUserProjects: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
                allUserProjects.unshift(newCampaign);
                localStorage.setItem(key, JSON.stringify(allUserProjects));
            }
            
            incrementUsage(ProjectType.MARKETING_GENERATION, 2); // Count as 2 usages
            onLog('✓ تم حفظ الحملة بنجاح!');
            
            setTimeout(() => {
                setCurrentCampaign(newCampaign);
                setScreen('editor');
            }, 1500);

        } catch (e) {
            const msg = e instanceof Error ? e.message : 'فشل إنشاء الحملة.';
            setError(msg);
            onLog(`✗ فشل: ${msg}`);
        } finally {
            // Let loading screen stay until transition
        }
    };
    
    const handleGenerateAssetInEditor = async () => {
        if (!currentCampaign || !assetPrompt.trim()) {
            setError('الرجاء إدخال وصف للأصل.');
            return;
        }
        
        let usageType: ProjectType;
        switch(activeTab) {
            case 'image': usageType = ProjectType.GENERATE_IMAGE; break;
            case 'video': usageType = ProjectType.GENERATE_VIDEO; break;
            case 'text': usageType = ProjectType.MARKETING_GENERATION; break;
            default: return;
        }

        if (isLimitReached(usageType)) {
            // setUpgradeModalOpen(true);
            return;
        }

        setIsGeneratingAsset(true);
        setError('');

        try {
            let newAsset: MarketingAsset | null = null;
            if (activeTab === 'image') {
                const imageBase64 = await geminiService.generateImage(assetPrompt, '1:1');
                newAsset = {
                    id: `asset-img-${Date.now()}`, type: 'image', dataUrl: `data:image/jpeg;base64,${imageBase64}`,
                    timestamp: Date.now(), title: assetPrompt.substring(0, 50) + '...'
                };
            } else if (activeTab === 'video') {
                if (!hasSelectedApiKey) { await handleSelectKey(); return; }
                const url = await geminiService.generateVideo(assetPrompt, null, '720p', '16:9', (log) => console.log(log));
                newAsset = { id: `asset-vid-${Date.now()}`, type: 'video', dataUrl: url, timestamp: Date.now(), title: assetPrompt.substring(0, 50) + '...' };
            } else if (activeTab === 'text') {
                const textContent = await geminiService.generateText(assetPrompt, 'gemini-2.5-flash');
                newAsset = {
                    id: `asset-text-${Date.now()}`, type: 'text', content: textContent,
                    platform: 'Twitter', timestamp: Date.now(), title: assetPrompt.substring(0, 50) + '...'
                };
            }

            if (newAsset) {
                const updatedCampaign = { ...currentCampaign, marketingAssets: [newAsset, ...(currentCampaign.marketingAssets || [])] };
                setCurrentCampaign(updatedCampaign);
                incrementUsage(usageType);
                setAssetPrompt('');
            }

        } catch (e) {
            setError(`فشل إنشاء الأصل: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setIsGeneratingAsset(false);
        }
    };
    
    const handleSaveCampaign = () => {
        if (!currentUser?.email || !currentCampaign) return;
        
        const key = `appProjects_${currentUser.email}`;
        const allProjects: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
        const updatedProjects = allProjects.map(p => p.id === currentCampaign.id ? currentCampaign : p);
        localStorage.setItem(key, JSON.stringify(updatedProjects));
        
        setSaveStatus('تم الحفظ بنجاح!');
        setTimeout(() => setSaveStatus(''), 2000);
    };

    const handleDeleteCampaign = (campaignId: string) => {
        if (!currentUser?.email) return;
        if (!window.confirm("هل أنت متأكد من نقل هذه الحملة إلى سلة المحذوفات؟")) return;

        const key = `appProjects_${currentUser.email}`;
        const allProjects: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
        const campaignToDelete = allProjects.find(p => p.id === campaignId);
        
        if (campaignToDelete) {
            const deletedKey = `deletedProjects_${currentUser.email}`;
            const deletedProjects = JSON.parse(localStorage.getItem(deletedKey) || '[]');
            deletedProjects.unshift(campaignToDelete);
            localStorage.setItem(deletedKey, JSON.stringify(deletedProjects));
        }

        const updatedProjects = allProjects.filter(p => p.id !== campaignId);
        localStorage.setItem(key, JSON.stringify(updatedProjects));
        
        if (screen === 'list') {
            setProjects(updatedProjects.filter(p => p.creationMode === 'marketing'));
        } else if (currentCampaign?.id === campaignId) {
            setCurrentCampaign(null);
            setScreen('list');
        }
    };
    
    const handleSelectKey = async () => {
        if (!window.aistudio) { setError("بيئة التشغيل لا تدعم اختيار مفتاح API."); return; }
        await window.aistudio.openSelectKey();
        setHasSelectedApiKey(true);
        setError('');
    };
    
    const renderListView = () => (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <header className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">المحتوى التسويقي</h2>
                    <p className="text-slate-400">({projects.length}) حملات</p>
                </div>
                <button onClick={handleNewCampaign} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                    <PlusIcon className="w-5 h-5"/> حملة جديدة
                </button>
            </header>
            <div className="relative mb-4">
                <input type="search" placeholder="ابحث عن حملة..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4" />
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            
            {filteredCampaigns.length === 0 ? (
                 <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-500">
                    <FireIcon className="w-16 h-16 mb-4"/>
                    <h3 className="text-lg font-semibold">{projects.length > 0 ? 'لم يتم العثور على نتائج' : 'لا توجد حملات بعد'}</h3>
                    <p>{projects.length > 0 ? 'جرّب كلمة بحث مختلفة.' : 'انقر على "حملة جديدة" للبدء.'}</p>
                </div>
            ) : (
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                    {filteredCampaigns.map(c => (
                        <ProjectCard 
                            key={c.id}
                            project={c}
                            onDelete={handleDeleteCampaign}
                            onEdit={(campaign) => { setCurrentCampaign(campaign); setScreen('editor'); }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
    
    const renderGeneratorView = () => (
         <div className="p-4 md:p-8 h-full flex flex-col items-center justify-center">
             {isGenerating ? <LoadingScreen logs={logs}/> : (
                <div className="w-full max-w-lg">
                    <header className="flex items-center gap-4 mb-8">
                         <button onClick={() => setScreen('list')} className="p-2 rounded-full hover:bg-slate-700">
                            <ArrowLeftIcon className="w-5 h-5"/>
                        </button>
                         <div className="flex items-center gap-3">
                            <FireIcon className="w-8 h-8 text-rose-400"/>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-100">إنشاء حملة جديدة</h2>
                                <p className="text-slate-400 text-sm">لنبدأ بالتخطيط لحملتك التسويقية.</p>
                            </div>
                         </div>
                    </header>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-300">1. اختر مشروعًا</label>
                            <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 mt-1">
                                {allProjects.length > 0 ? allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>) : <option>لا توجد مشاريع</option>}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-300">2. اسم الحملة</label>
                            <input value={campaignName} onChange={e => setCampaignName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 mt-1"/>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-300">3. صف أهدافك التسويقية</label>
                            <textarea value={marketingGoals} onChange={e => setMarketingGoals(e.target.value)} rows={4} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 mt-1" placeholder="مثال: زيادة الوعي بالعلامة التجارية، جذب مستخدمين جدد للتطبيق..."/>
                        </div>
                        <button onClick={handleGenerateCampaign} disabled={isGenerating} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                            <RocketLaunchIcon className="w-5 h-5"/>
                            إنشاء أصول الحملة
                        </button>
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    </div>
                </div>
             )}
        </div>
    );
    
    const renderEditorView = () => {
        if (!currentCampaign) return renderListView(); // Fallback
        
        return (
            <div className="flex flex-col h-full p-4 gap-4">
                <header className="flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setScreen('list')} className="p-2 rounded-full hover:bg-slate-700"><ArrowLeftIcon className="w-5 h-5"/></button>
                        {currentCampaign.iconUrl && <img src={currentCampaign.iconUrl} alt="icon" className="w-10 h-10 rounded-lg"/>}
                        <div>
                            <h2 className="text-xl font-bold">{currentCampaign.name}</h2>
                            <p className="text-xs text-slate-400">{currentCampaign.description}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <p className="text-xs text-green-400">{saveStatus}</p>
                        <button onClick={handleSaveCampaign} className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg">
                            <SaveIcon className="w-4 h-4"/> حفظ
                        </button>
                        <button onClick={() => handleDeleteCampaign(currentCampaign.id)} className="p-1.5 bg-red-500/20 text-red-300 rounded-lg"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                </header>

                <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
                    {/* Asset Gallery */}
                    <div className="lg:col-span-2 flex flex-col min-h-0 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <h3 className="text-lg font-bold flex-shrink-0">أصول الحملة</h3>
                        <div className="flex-grow overflow-y-auto pr-2 space-y-3 mt-4">
                            {(currentCampaign.marketingAssets || []).length === 0 ? (
                                <p className="text-slate-500 text-center py-8">لم يتم إنشاء أي أصول بعد.</p>
                            ) : (
                                (currentCampaign.marketingAssets || []).map(asset => (
                                    <div key={asset.id} className="bg-slate-800 rounded-lg p-3">
                                         {/* Asset content rendering */}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Control Panel */}
                    <div className="flex flex-col min-h-0 bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-4">
                        <h3 className="text-lg font-bold">إنشاء أصل جديد</h3>
                         <div className="flex bg-slate-800 rounded-md p-1">
                            <button onClick={() => setActiveTab('image')} className={`flex-1 text-sm py-2 rounded ${activeTab === 'image' ? 'bg-indigo-600' : ''}`}><PhotoIcon className="w-5 h-5 mx-auto"/></button>
                            <button onClick={() => setActiveTab('video')} className={`flex-1 text-sm py-2 rounded ${activeTab === 'video' ? 'bg-indigo-600' : ''}`}><VideoIcon className="w-5 h-5 mx-auto"/></button>
                            <button onClick={() => setActiveTab('text')} className={`flex-1 text-sm py-2 rounded ${activeTab === 'text' ? 'bg-indigo-600' : ''}`}><ChatBubbleBottomCenterTextIcon className="w-5 h-5 mx-auto"/></button>
                        </div>
                        <textarea value={assetPrompt} onChange={e => setAssetPrompt(e.target.value)} rows={4} className="w-full bg-slate-700 p-2 rounded-md" placeholder={`وصف ${activeTab === 'image' ? 'الصورة' : activeTab === 'video' ? 'الفيديو' : 'المنشور'}...`}/>
                        <button onClick={handleGenerateAssetInEditor} disabled={isGeneratingAsset} className="w-full bg-green-600 hover:bg-green-500 font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-500">
                             {isGeneratingAsset ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                             {isGeneratingAsset ? 'جاري...' : 'إنشاء'}
                        </button>
                    </div>
                </main>
            </div>
        )
    };
    
    if (isGenerating) return <LoadingScreen logs={logs} />;

    switch(screen) {
        case 'list': return renderListView();
        case 'generator': return renderGeneratorView();
        case 'editor': return renderEditorView();
        default: return renderListView();
    }
};

export default Marketing;
