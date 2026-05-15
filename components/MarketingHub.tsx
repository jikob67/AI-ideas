import React, { useState, useEffect } from 'react';
import { Project, MarketingSuggestion, MarketingAsset, SectionType } from '../types';
import { geminiService } from '../services/geminiService';
import { useAuth } from '../hooks/useAuth';
import UpgradeModal from './UpgradeModal';
import {
    StormIcon, SparklesIcon, BeakerIcon, ChatIcon, SpinnerIcon, CopyIcon,
    CheckIcon, SaveIcon, InstagramIcon, TwitterIcon, LinkedInIcon, FacebookIcon, ArrowPathIcon,
    DollarSignIcon
} from './Icons';

interface MarketingHubProps {
  project: Project;
  onUpdateProject: (updatedProject: Project) => void;
}

const SuggestionIcon: React.FC<{ type: MarketingSuggestion['type'] }> = ({ type }) => {
    switch (type) {
        case 'strategy': return <StormIcon className="w-5 h-5 text-indigo-400" />;
        case 'design': return <BeakerIcon className="w-5 h-5 text-green-400" />;
        case 'content': return <ChatIcon className="w-5 h-5 text-amber-400" />;
        default: return <SparklesIcon className="w-5 h-5 text-slate-400" />;
    }
};

const PlatformIcon: React.FC<{ platform: string }> = ({ platform }) => {
    switch (platform.toLowerCase()) {
        case 'instagram': return <InstagramIcon className="w-5 h-5" />;
        case 'facebook': return <FacebookIcon className="w-5 h-5" />;
        case 'twitter': return <TwitterIcon className="w-5 h-5" />;
        case 'linkedin': return <LinkedInIcon className="w-5 h-5" />;
        default: return null;
    }
};

const MarketingHub: React.FC<MarketingHubProps> = ({ project, onUpdateProject }) => {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'generator'>('suggestions');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorError, setGeneratorError] = useState('');
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const [suggestions, setSuggestions] = useState<MarketingSuggestion[] | undefined>(project.marketingSuggestions);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [importProjectId, setImportProjectId] = useState('');

  const { currentUser, updateUser } = useAuth();
  const freeUses = currentUser?.freeMarketingContentUsed || 0;
  const freeUsesLimit = 2;

  const handleRegenerateSuggestions = () => {
    setIsLoadingSuggestions(true);
    geminiService.generateMarketingSuggestions(project)
      .then(newSuggestions => {
        setSuggestions(newSuggestions);
        onUpdateProject({ ...project, marketingSuggestions: newSuggestions });
      })
      .catch(err => {
          console.error("Failed to fetch marketing suggestions:", err);
      })
      .finally(() => setIsLoadingSuggestions(false));
  };

  useEffect(() => {
    if (!suggestions && !isLoadingSuggestions) {
      handleRegenerateSuggestions();
    }
  }, [project, suggestions, onUpdateProject, isLoadingSuggestions]);
  
  const handlePrefillTopic = () => {
    setTopic(`${project.name}: ${project.description}`);
  };

  const handleGenerateContent = async () => {
    if (!topic.trim()) {
        setGeneratorError('الرجاء إدخال موضوع لإنشاء المحتوى.');
        return;
    }
    
    if (currentUser?.plan === 'free' && freeUses >= freeUsesLimit) {
        setGeneratorError('لقد استهلكت المحاولات المجانية. قم بالترقية للاستمرار.');
        setUpgradeModalOpen(true);
        return;
    }

    setIsGenerating(true);
    setGeneratorError('');
    try {
        const result = await geminiService.generateMarketingContent(topic);
        const newAsset: MarketingAsset = {
            id: `asset-${Date.now()}`,
            timestamp: Date.now(),
            ...result,
        };
        
        const updatedAssets = [...(project.marketingAssets || []), newAsset];
        onUpdateProject({ ...project, marketingAssets: updatedAssets });

        if (currentUser?.plan === 'free') {
            await updateUser({ freeMarketingContentUsed: freeUses + 1 });
        }
    } catch (err) {
        console.error("Content generation failed:", err);
        setGeneratorError('حدث خطأ أثناء إنشاء المحتوى.');
    } finally {
        setIsGenerating(false);
    }
  };

    const handleAutoGenerate = async (sourceProject: Project) => {
        if (currentUser?.plan === 'free' && freeUses >= freeUsesLimit) {
            setGeneratorError('لقد استهلكت المحاولات المجانية للإنشاء التلقائي. قم بالترقية للمتابعة.');
            setUpgradeModalOpen(true);
            return;
        }

        setIsGenerating(true);
        setGeneratorError('');
        try {
            const newAssets = await geminiService.convertProjectToMarketing(sourceProject);
            
            if(newAssets.length > 0) {
                const updatedAssets = [...(project.marketingAssets || []), ...newAssets];
                onUpdateProject({ ...project, marketingAssets: updatedAssets });
                setImportProjectId('');

                if (currentUser?.plan === 'free') {
                    await updateUser({ freeMarketingContentUsed: freeUses + 1 });
                }
            } else {
                setGeneratorError('لم يتمكن الذكاء الاصطناعي من إنشاء محتوى. حاول مرة أخرى.');
            }

        } catch (err) {
            console.error("Auto-generation failed:", err);
            setGeneratorError('حدث خطأ أثناء الإنشاء التلقائي.');
        } finally {
            setIsGenerating(false);
        }
    };
  
    const handleImportAndGenerate = () => {
        if (!importProjectId.trim()) {
            setGeneratorError('الرجاء إدخال رمز المشروع للاستيراد.');
            return;
        }
        const allProjects: Project[] = JSON.parse(localStorage.getItem('appProjects') || '[]');
        const foundProject = allProjects.find(p => p.id === importProjectId.trim());

        if (foundProject) {
            handleAutoGenerate(foundProject);
        } else {
            setGeneratorError('لم يتم العثور على مشروع بهذا الرمز.');
        }
    };

  const handleCopy = (text: string) => {
    let contentToCopy = text;
    if (currentUser?.plan === 'free') {
        contentToCopy += "\n\nتم إنشاء هذا المحتوى التسويقي من قبل AI ideas";
    }
    navigator.clipboard.writeText(contentToCopy);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDescriptionChange = (id: string, newDescription: string) => {
      const updatedSuggestions = suggestions?.map(s => s.id === id ? {...s, description: newDescription} : s);
      setSuggestions(updatedSuggestions);
  };

  const handleSaveChanges = () => {
      onUpdateProject({ ...project, marketingSuggestions: suggestions });
      alert("تم حفظ التغييرات!");
  };

  const renderSuggestionsTab = () => {
    const renderSuggestions = (type: MarketingSuggestion['type'], title: string) => {
        const filtered = suggestions?.filter(s => s.type === type) || [];
        if (filtered.length === 0) return null;
        
        return (
            <div className="space-y-3">
                <h4 className="text-md font-semibold text-slate-300 flex items-center gap-2"><SuggestionIcon type={type} /> {title}</h4>
                {filtered.map(item => (
                    <div key={item.id} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
                        <h5 className="font-semibold text-slate-200 text-sm">{item.title} {item.platform && <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full ml-2">{item.platform}</span>}</h5>
                        <textarea
                          value={item.description}
                          onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
                          className="w-full bg-transparent text-slate-400 text-sm mt-1 p-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-md resize-y min-h-[60px]"
                        />
                        <div className="text-right mt-1">
                            <button onClick={() => handleCopy(item.description)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                                {copiedText === item.description ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <h3 className="text-lg font-semibold text-slate-200">اقتراحات الذكاء الاصطناعي</h3>
                <div className="flex items-center gap-2">
                    {suggestions && (
                        <button onClick={handleSaveChanges} disabled={isLoadingSuggestions} className="flex items-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg transition-colors disabled:opacity-50">
                            <SaveIcon className="w-4 h-4" />
                            حفظ التعديلات
                        </button>
                    )}
                    <button onClick={handleRegenerateSuggestions} disabled={isLoadingSuggestions} className="flex items-center justify-center gap-2 text-xs bg-slate-600 hover:bg-slate-500 text-white font-bold py-1.5 px-3 rounded-lg transition-colors disabled:opacity-50 w-28">
                        {isLoadingSuggestions ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <><ArrowPathIcon className="w-4 h-4" /><span>توليد جديد</span></>}
                    </button>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                {isLoadingSuggestions && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <SpinnerIcon className="w-10 h-10 animate-spin text-indigo-400 mb-4" />
                        <p className="font-semibold">الذكاء الاصطناعي يبتكر أفكارًا تسويقية لمشروعك...</p>
                        <p className="text-sm">قد يستغرق هذا بضع لحظات.</p>
                    </div>
                )}
                {!isLoadingSuggestions && suggestions && suggestions.length > 0 && (
                    <>
                        {renderSuggestions('strategy', 'استراتيجيات التسويق')}
                        {renderSuggestions('design', 'أفكار التصاميم')}
                        {renderSuggestions('content', 'المحتوى التسويقي')}
                    </>
                )}
                 {!isLoadingSuggestions && (!suggestions || suggestions.length === 0) && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                         <p className="font-semibold">لم يتم العثور على اقتراحات.</p>
                    </div>
                )}
            </div>
        </div>
    );
  };
  
  const renderGeneratorTab = () => (
    <div className="h-full flex flex-col">
        <h3 className="text-lg font-semibold text-slate-200 flex-shrink-0">مولّد المحتوى التسويقي</h3>
        <div className="flex-grow flex flex-col md:flex-row gap-4 pt-4 overflow-hidden">
            {/* Left: Generator Form */}
            <div className="w-full md:w-1/2 flex flex-col gap-3">
                <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <button onClick={() => handleAutoGenerate(project)} disabled={isGenerating} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                        {isGenerating ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <ArrowPathIcon className="w-5 h-5"/>}
                        إنشاء محتوى من بيانات هذا المشروع
                    </button>
                    <div className="relative my-1">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
                        <div className="relative flex justify-center text-sm"><span className="bg-slate-900 px-2 text-slate-500">أو</span></div>
                    </div>
                    <div>
                        <label htmlFor="import-id" className="block text-sm font-medium text-slate-300 mb-2">استيراد مشروع آخر</label>
                        <div className="flex gap-2">
                            <input id="import-id" value={importProjectId} onChange={(e) => setImportProjectId(e.target.value)} placeholder="ألصق رمز المشروع هنا..." className="flex-grow bg-slate-700 border border-slate-600 rounded-lg p-2 text-white text-sm font-mono"/>
                            <button onClick={handleImportAndGenerate} disabled={isGenerating} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold p-2 rounded-lg disabled:bg-slate-500">
                                <SparklesIcon className="w-5 h-5"/>
                            </button>
                        </div>
                         <p className="text-xs text-slate-500 mt-1">يمكنك العثور على رمز المشروع في أعلى هذه النافذة.</p>
                    </div>
                </div>
                
                 <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div>
                        <label htmlFor="marketing-topic" className="block text-sm font-medium text-slate-300 mb-2">إنشاء محتوى مخصص</label>
                        <textarea 
                            id="marketing-topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                            placeholder="مثال: إعلان عن إطلاق مجموعة أزياء صيفية..."
                        />
                    </div>
                    <button onClick={handlePrefillTopic} className="text-xs text-indigo-400 hover:underline text-right w-full">ملء تلقائي من بيانات المشروع</button>
                    <button onClick={handleGenerateContent} disabled={isGenerating} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-500">
                        {isGenerating ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                        {isGenerating ? 'جاري الإنشاء...' : 'إنشاء محتوى'}
                    </button>
                </div>
                 {currentUser?.plan === 'free' && (
                     <p className="text-xs text-slate-500 text-center">
                        المحاولات المجانية المستخدمة: {freeUses} / {freeUsesLimit}
                     </p>
                )}
                {generatorError && <p className="text-red-400 text-sm text-center">{generatorError}</p>}
            </div>
            {/* Right: Generated Assets List */}
            <div className="w-full md:w-1/2 flex flex-col">
                <h4 className="text-md font-semibold text-slate-300 mb-2">المحتوى الذي تم إنشاؤه</h4>
                <div className="flex-grow bg-slate-800/50 border border-slate-700 rounded-lg overflow-y-auto p-2 space-y-2">
                    {(project.marketingAssets || []).length === 0 ? (
                        <p className="text-center text-slate-500 text-sm p-4">لم يتم إنشاء أي محتوى بعد.</p>
                    ) : (
                        [...project.marketingAssets].reverse().map(asset => (
                            <div key={asset.id} className="bg-slate-800 p-3 rounded-md">
                                <div className="relative p-4 rounded-md overflow-hidden mb-2" style={{ background: asset.design }}>
                                    <p className="font-bold text-white text-lg drop-shadow-md">{asset.title}</p>
                                    <p className="text-white text-sm mt-1 drop-shadow-md">{asset.content}</p>
                                    {currentUser?.plan === 'free' && 
                                        <div className="absolute bottom-2 right-2 text-xs text-white/50 bg-black/30 px-2 py-1 rounded">
                                            Made with ⚡ AI ideas
                                        </div>
                                    }
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <PlatformIcon platform={asset.platform} />
                                        <span className="text-xs font-semibold text-slate-300">{asset.platform}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                         <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                                            <span title={asset.id}>ID: ...{asset.id.slice(-6)}</span>
                                            <button onClick={() => handleCopy(asset.id)} className="p-1 rounded-md hover:bg-slate-700" title="نسخ الرمز الفريد">
                                                 {copiedText === asset.id ? <CheckIcon className="w-3 h-3 text-green-400"/> : <CopyIcon className="w-3 h-3"/>}
                                            </button>
                                        </div>
                                        <button onClick={() => handleCopy(`${asset.title}\n\n${asset.content}`)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700 hover:text-white transition-colors" title="نسخ المحتوى">
                                            {copiedText === `${asset.title}\n\n${asset.content}` ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
        <div className="flex border-b border-slate-700 mb-4 flex-shrink-0">
            <button onClick={() => setActiveTab('suggestions')} className={`flex-1 py-2 text-center font-semibold transition-colors ${activeTab === 'suggestions' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}>
                اقتراحات
            </button>
             <button onClick={() => setActiveTab('generator')} className={`flex-1 py-2 text-center font-semibold transition-colors ${activeTab === 'generator' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}>
                إنشاء محتوى
            </button>
        </div>
        
        <div className="flex-grow overflow-hidden px-1">
            {activeTab === 'suggestions' && renderSuggestionsTab()}
            {activeTab === 'generator' && renderGeneratorTab()}
        </div>

        <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
    </div>
  );
};

export default MarketingHub;