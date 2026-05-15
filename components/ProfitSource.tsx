import React, { useState, useEffect, useRef } from 'react';
import { DollarSignIcon, SparklesIcon, SpinnerIcon, BriefcaseIcon, WrenchScrewdriverIcon, Share2Icon } from './Icons';
import { Project, ProjectSection, SectionType, User, View } from '../types';
import { geminiService } from '../services/geminiService';
import { useAuth } from '../hooks/useAuth';
import { SECTION_DEFINITIONS } from '../constants';

// Ad settings management component
const AdSettingsManager: React.FC<{
  projects: Project[];
  selectedProjectId: string;
  setProjects: (p: Project[]) => void;
  currentUser: User | null;
}> = ({ projects, selectedProjectId, setProjects, currentUser }) => {
  const [adConfig, setAdConfig] = useState({
    admob: { enabled: false, bannerId: '' },
    unity: { enabled: false, gameId: '' },
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    const project = projects.find(p => p.id === selectedProjectId);
    if (project) {
      const adsSection = project.sections.find(
        s => s.type === SectionType.ADS
      );
      if (adsSection && adsSection.config) {
        setAdConfig({
             admob: { enabled: false, bannerId: '', ...adsSection.config.admob },
             unity: { enabled: false, gameId: '', ...adsSection.config.unity },
        });
      } else {
        // Default config if no ads section exists
        setAdConfig({
          admob: { enabled: false, bannerId: '' },
          unity: { enabled: false, gameId: '' },
        });
      }
    }
  }, [selectedProjectId, projects]);

  const handleChange = (
    platform: 'admob' | 'unity',
    key: string,
    value: string | boolean
  ) => {
    setAdConfig(prev => ({
      ...prev,
      [platform]: { ...(prev[platform] || {}), [key]: value },
    }));
  };

  const handleSave = () => {
    const updatedProjects = projects.map(p => {
      if (p.id === selectedProjectId) {
        let adsSection = p.sections.find(s => s.type === SectionType.ADS);
        let updatedSections: ProjectSection[];
        if (adsSection) {
          updatedSections = p.sections.map(s =>
            s.type === SectionType.ADS ? { ...s, config: adConfig } : s
          );
        } else {
          const newAdsSection: ProjectSection = {
            id: `sec-ads-${Date.now()}`,
            type: SectionType.ADS,
            title: 'الإعلانات',
            config: adConfig,
          };
          updatedSections = [...p.sections, newAdsSection];
        }
        return { ...p, sections: updatedSections };
      }
      return p;
    });
    setProjects(updatedProjects);
    if (currentUser?.email) {
        localStorage.setItem(`appProjects_${currentUser.email}`, JSON.stringify(updatedProjects));
    }
    setStatus('تم الحفظ بنجاح!');
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <div className="bg-slate-800/70 border border-indigo-500 rounded-xl p-6 shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
      <h3 className="text-lg font-bold text-slate-200 mb-2">
        إدارة رموز الإعلانات
      </h3>
      <p className="text-sm text-slate-400 mb-4">
        أضف رموز الإعلانات الخاصة بك هنا لحفظها في مشروعك المحدد. يمكنك تفعيلها
        لاحقًا من محرر المشروع.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AdMob Settings */}
        <div className="space-y-3 p-4 bg-slate-700/50 rounded-lg">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-white">Google AdMob</label>
            <input
              type="checkbox"
              className="toggle-switch"
              checked={adConfig.admob?.enabled || false}
              onChange={e => handleChange('admob', 'enabled', e.target.checked)}
            />
          </div>
          {adConfig.admob?.enabled && (
            <div className="animate-fade-in">
              <label className="text-xs text-slate-400">
                معرف إعلان البانر
              </label>
              <input
                type="text"
                value={adConfig.admob?.bannerId || ''}
                onChange={e =>
                  handleChange('admob', 'bannerId', e.target.value)
                }
                className="w-full bg-slate-600 p-2 rounded-md text-sm mt-1"
                placeholder="ca-app-pub-..."
              />
            </div>
          )}
        </div>
        {/* Unity Ads Settings */}
        <div className="space-y-3 p-4 bg-slate-700/50 rounded-lg">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-white">Unity Ads</label>
            <input
              type="checkbox"
              className="toggle-switch"
              checked={adConfig.unity?.enabled || false}
              onChange={e => handleChange('unity', 'enabled', e.target.checked)}
            />
          </div>
          {adConfig.unity?.enabled && (
            <div className="animate-fade-in">
              <label className="text-xs text-slate-400">معرف اللعبة</label>
              <input
                type="text"
                value={adConfig.unity?.gameId || ''}
                onChange={e =>
                  handleChange('unity', 'gameId', e.target.value)
                }
                className="w-full bg-slate-600 p-2 rounded-md text-sm mt-1"
                placeholder="1234567"
              />
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-end items-center gap-4">
        {status && <p className="text-sm text-green-400">{status}</p>}
        <button
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg"
        >
          حفظ الإعدادات
        </button>
      </div>
    </div>
  );
};

interface MonetizationStrategy {
  summary: string;
  recommendations: { method: string; reason: string; implementationSteps: string[] }[];
}

const AiStrategyAnalyzer: React.FC<{ 
    project: Project;
    projects: Project[];
    setProjects: (projects: Project[]) => void;
    navigate: (view: View, context?: any) => void;
}> = ({ project, projects, setProjects, navigate }) => {
    const { currentUser } = useAuth();
    const [strategy, setStrategy] = useState<MonetizationStrategy | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isMerging, setIsMerging] = useState(false);
    const [mergeStatus, setMergeStatus] = useState('');
    const [mergedProject, setMergedProject] = useState<Project | null>(null);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError('');
        setStrategy(null);
        try {
            const result = await geminiService.getMonetizationStrategy(project);
            setStrategy(result);
        } catch (e) {
            setError('فشل في الحصول على توصيات. حاول مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleShareStrategy = async () => {
        if (!strategy) return;
        if (!navigator.share) {
            alert('متصفحك لا يدعم ميزة المشاركة.');
            return;
        }
        const shareText = `استراتيجيات الربح لمشروع "${project.name}":\n\n${strategy.summary}\n\nالتوصيات:\n${strategy.recommendations.map((rec, i) => `${i+1}. ${rec.method}: ${rec.reason}`).join('\n')}`;
        try {
            await navigator.share({
                title: `استراتيجيات الربح لـ ${project.name}`,
                text: shareText,
            });
        } catch (err: any) {
            console.error('Share failed:', err);
            if (err && err.name === 'AbortError') {
            } else if (err && err.name === 'NotAllowedError') {
                alert('فشلت المشاركة: تم رفض الإذن.');
            } else {
                alert('فشلت المشاركة.');
            }
        }
    };


    const handleMergeRecommendations = () => {
        if (!strategy || !project) return;
        
        setIsMerging(true);
        setMergeStatus('');
        setMergedProject(null);
    
        setTimeout(() => {
            try {
                let updatedProject = JSON.parse(JSON.stringify(project));
                const existingSectionTypes = new Set(updatedProject.sections.map((s: ProjectSection) => s.type));
                let sectionsAdded = 0;
    
                const recommendationMap: { [key: string]: SectionType } = {
                    'إعلانات': SectionType.ADS,
                    'اشتراكات': SectionType.PAYMENTS,
                    'مدفوعات': SectionType.PAYMENTS,
                    'متجر': SectionType.STORE,
                    'نقاط': SectionType.POINTS_REWARDS,
                    'مكافآت': SectionType.POINTS_REWARDS,
                };
    
                strategy.recommendations.forEach(rec => {
                    for (const keyword in recommendationMap) {
                        if (rec.method.includes(keyword)) {
                            const sectionTypeToAdd = recommendationMap[keyword];
                            if (!existingSectionTypes.has(sectionTypeToAdd)) {
                                const sectionDef = SECTION_DEFINITIONS.find(d => d.type === sectionTypeToAdd);
                                if (sectionDef) {
                                    const newSection: ProjectSection = {
                                        id: `sec-merged-${sectionTypeToAdd.toLowerCase()}-${Date.now()}`,
                                        type: sectionDef.type,
                                        title: sectionDef.name,
                                        config: sectionDef.defaultConfig,
                                    };
                                    updatedProject.sections.push(newSection);
                                    existingSectionTypes.add(sectionTypeToAdd);
                                    sectionsAdded++;
                                }
                            }
                        }
                    }
                });
    
                if (sectionsAdded > 0) {
                    const updatedProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
                    setProjects(updatedProjects);
                    if (currentUser?.email) {
                        localStorage.setItem(`appProjects_${currentUser.email}`, JSON.stringify(updatedProjects));
                    }
                    setMergeStatus(`تم دمج التوصيات! تمت إضافة ${sectionsAdded} أقسام جديدة.`);
                    setMergedProject(updatedProject);
                } else {
                    setMergeStatus('جميع الأقسام الموصى بها موجودة بالفعل في مشروعك.');
                }
    
            } catch (e) {
                console.error("Merge failed", e);
                setMergeStatus('فشل دمج التوصيات.');
            } finally {
                setIsMerging(false);
                setTimeout(() => {
                    setMergeStatus('');
                    setMergedProject(null);
                }, 7000);
            }
        }, 1000);
    };

    return (
        <div className="bg-slate-800/70 border border-purple-500/50 rounded-xl p-6 shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-purple-400"/> توصيات الربح الذكية</h3>
                    <p className="text-sm text-slate-400 mt-1">دع الذكاء الاصطناعي يحلل مشروعك ويقترح أفضل طرق تحقيق الدخل.</p>
                </div>
                <button onClick={handleAnalyze} disabled={isLoading} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-lg w-full md:w-auto">
                    {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'تحليل الآن'}
                </button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            {strategy && (
                <div className="mt-4 border-t border-slate-700 pt-4 animate-fade-in space-y-4">
                    <div className="flex justify-between items-start">
                        <p className="text-slate-300 italic flex-grow">{strategy.summary}</p>
                        <button onClick={handleShareStrategy} className="flex-shrink-0 ml-4 p-2 bg-slate-700 hover:bg-slate-600 rounded-md" title="مشاركة التقرير">
                            <Share2Icon className="w-5 h-5"/>
                        </button>
                    </div>
                    {strategy.recommendations.map((rec, i) => (
                        <div key={i} className="bg-slate-700/50 p-4 rounded-lg">
                            <h4 className="font-semibold text-indigo-300">{i+1}. {rec.method}</h4>
                            <p className="text-xs text-slate-400 mt-1 mb-2">{rec.reason}</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                                {rec.implementationSteps.map((step, j) => <li key={j}>{step}</li>)}
                            </ul>
                        </div>
                    ))}
                    <div className="mt-4 pt-4 border-t border-slate-700 text-center">
                        <button
                            onClick={handleMergeRecommendations}
                            disabled={isMerging}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 w-full md:w-auto mx-auto disabled:bg-slate-500"
                        >
                            {isMerging ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                            {isMerging ? 'جاري الدمج...' : 'دمج التوصيات المقترحة'}
                        </button>
                        {mergeStatus && (
                            <div className="mt-2 text-sm text-green-400 animate-fade-in">
                                {mergeStatus}
                                {mergedProject && (
                                    <button 
                                        onClick={() => navigate('editApp', { project: mergedProject, originView: 'profitSource' })}
                                        className="ml-2 underline hover:text-white font-semibold"
                                    >
                                        الانتقال للمحرر
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


const ProfitSource: React.FC<{ navigate: (view: View, context?: any) => void }> = ({ navigate }) => {
    const { currentUser } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Project[]>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!currentUser?.email) return;
        const savedProjects: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]') as Project[];
        setProjects(savedProjects);
    }, [currentUser]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.trim()) {
            const filtered = projects.filter((p: Project) => 
                p.name.toLowerCase().includes(query.toLowerCase())
            );
            setSearchResults(filtered);
            if (!showResults) setShowResults(true);
        } else {
            setSearchResults([]);
            setSelectedProjectId(''); // Clear selection if search is cleared
        }
    };
    
    const handleSelectProject = (project: Project) => {
        setSelectedProjectId(project.id);
        setSearchQuery(project.name);
        setShowResults(false);
    };

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    const handleEditProject = (project: Project) => {
        navigate('editApp', { project, originView: 'profitSource' });
    };

    const profitMethods = [
        {
            title: 'الاشتراكات الشهرية/السنوية',
            description: 'قدم ميزات حصرية للمستخدمين مقابل اشتراك دوري. مثالي للتطبيقات الخدمية والمحتوى المتجدد.',
            difficulty: 'متوسط',
            potential: 'مرتفع',
        },
        {
            title: 'عمليات الشراء داخل التطبيق',
            description: 'بع منتجات رقمية مثل "العملات" في الألعاب، أو "الفلاتر" في تطبيقات الصور، أو "المقالات" الإضافية.',
            difficulty: 'متوسط',
            potential: 'مرتفع',
        },
        {
            title: 'التسويق بالعمولة',
            description: 'اعرض منتجات أو خدمات من شركات أخرى واحصل على عمولة عن كل عملية بيع تتم من خلال تطبيقك.',
            difficulty: 'سهل',
            potential: 'متغير',
        },
        {
            title: 'بيع التطبيق (نسخة مدفوعة)',
            description: 'اطلب من المستخدمين دفع مبلغ لمرة واحدة لتنزيل تطبيقك. أفضل للتطبيقات ذات القيمة العالية والمحددة.',
            difficulty: 'سهل',
            potential: 'منخفض إلى متوسط',
        },
        {
            title: 'بيع البيانات (بشكل مجهول)',
            description: 'جمع بيانات استخدام غير شخصية وبيعها لشركات الأبحاث. يتطلب شفافية تامة مع المستخدمين.',
            difficulty: 'متقدم',
            potential: 'مرتفع',
        },
    ];

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <header className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-100">مصادر الربح لمشروعك</h2>
                <p className="text-slate-400 mt-2">استكشف طرقًا مختلفة لتحويل مشروعك إلى مصدر دخل.</p>
            </header>

            <div className="mb-8" ref={searchRef}>
                 <label htmlFor="project-search" className="block text-sm font-medium text-slate-300 mb-2">
                    ابحث عن مشروع لتحليل مصادر الربح:
                </label>
                <div className="relative">
                    <input
                        id="project-search"
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => { if(searchQuery.trim()) setShowResults(true) }}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white text-sm"
                        placeholder="ابحث بالاسم..."
                        autoComplete="off"
                        disabled={projects.length === 0}
                    />
                    {showResults && searchResults.length > 0 && (
                        <div className="absolute top-full mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg z-10 max-h-48 overflow-y-auto shadow-lg">
                            {searchResults.map(p => (
                                <button 
                                    key={p.id} 
                                    onClick={() => handleSelectProject(p)}
                                    className="w-full text-right p-3 hover:bg-slate-700 text-left"
                                >
                                    <p className="font-semibold text-sm text-white">{p.name}</p>
                                    <p className="text-xs text-slate-400">{p.type}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {projects.length === 0 && <p className="text-amber-400 text-sm mt-2">لا توجد مشاريع محفوظة. يرجى إنشاء مشروع أولاً.</p>}
            </div>

            {selectedProjectId && selectedProject && (
                <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg animate-fade-in flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {selectedProject.iconUrl ? <img src={selectedProject.iconUrl} alt="icon" className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center"><BriefcaseIcon className="w-6 h-6 text-indigo-400"/></div>}
                        <div>
                            <h4 className="font-semibold text-white">{selectedProject.name}</h4>
                            <p className="text-xs text-slate-400 font-mono" dir="ltr">
                                ID: {selectedProjectId}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => handleEditProject(selectedProject)} className="text-sm bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2">
                        <WrenchScrewdriverIcon className="w-4 h-4" />
                        تعديل المشروع
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:col-span-2 lg:col-span-3 gap-6">
                {selectedProject && <AiStrategyAnalyzer project={selectedProject} projects={projects} setProjects={setProjects} navigate={navigate} />}
                {projects.length > 0 && selectedProjectId && (
                    <AdSettingsManager projects={projects} selectedProjectId={selectedProjectId} setProjects={setProjects} currentUser={currentUser} />
                )}
                {profitMethods.map((method, index) => (
                    <div key={index} className="bg-slate-800/70 border border-slate-700 rounded-xl p-6 flex flex-col shadow-lg hover:shadow-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300">
                        <div className="flex-shrink-0 mb-4">
                            <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                <DollarSignIcon className="w-7 h-7 text-indigo-400" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-200 mb-2">{method.title}</h3>
                        <p className="text-sm text-slate-400 flex-grow">{method.description}</p>
                        <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between text-xs text-slate-500">
                            <span>الصعوبة: <span className="font-semibold text-slate-300">{method.difficulty}</span></span>
                            <span>الأرباح: <span className="font-semibold text-slate-300">{method.potential}</span></span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProfitSource;