import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Project, View, ProjectType, ProjectFile, Message } from '../types';
import { geminiService } from '../services/geminiService';
import { useUsage } from '../hooks/useUsage';
import { useAuth } from '../hooks/useAuth';
import {
    SparklesIcon, SpinnerIcon, ArrowLeftIcon, CodeIcon, PlusIcon, TrashIcon,
    GlobeIcon, LinkIcon, CloseIcon, CheckIcon, SquaresPlusIcon, MagnifyingGlassIcon
} from './Icons';
import UpgradeModal from './UpgradeModal';
import { ProjectCard } from './ProjectCard';
import { SoftwareProjectBuilder } from './SoftwareProjectBuilder';

const LoadingScreen: React.FC<{ logs: string[] }> = ({ logs }) => {
    const isFailed = logs.some(log => log.toLowerCase().includes('فشل'));
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in bg-slate-900">
            {isFailed ? (
                <CloseIcon className="w-12 h-12 text-red-400 mb-6" />
            ) : (
                <SpinnerIcon className="w-12 h-12 text-teal-400 animate-spin mb-6" />
            )}
            <h2 className="text-2xl font-bold text-white">
                {isFailed ? 'حدث خطأ في الدمج' : 'جاري سحب المحتويات والدمج الذكي...'}
            </h2>
            <p className="text-slate-400 mt-2">
                {isFailed 
                    ? 'لم نتمكن من الوصول للمواقع أو إتمام عملية دمج الكود.' 
                    : 'نقوم الآن بسحب المحتويات، تحليل الهوية البصرية، وتوليد كود هجين متكامل للموقعين.'
                }
            </p>
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

const MergeToCode: React.FC<{ navigate: (view: View, context?: any) => void; context?: any; }> = ({ navigate, context }) => {
    const { currentUser } = useAuth();
    const { incrementUsage, isLimitReached } = useUsage();

    // --- State ---
    const [screen, setScreen] = useState<'list' | 'generator' | 'editor'>('list');
    const [projects, setProjects] = useState<Project[]>([]);
    const [project, setProject] = useState<Project | null>(null);

    // List View State
    const [searchQuery, setSearchQuery] = useState('');

    // Generator View State
    const [projectName, setProjectName] = useState('رابطة المواقع المدمجة');
    const [url1, setUrl1] = useState('');
    const [desc1, setDesc1] = useState('');
    const [url2, setUrl2] = useState('');
    const [desc2, setDesc2] = useState('');
    const [mergeStrategy, setMergeStrategy] = useState<'hybrid' | 'design_and_func' | 'fusion'>('hybrid');
    const [isGenerating, setIsGenerating] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

    useEffect(() => {
        if (screen === 'list' && currentUser?.email) {
            const allProjects: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
            const mergeProjects = allProjects.filter(p => p.creationMode === 'mergeToCode');
            setProjects(mergeProjects);
        }
    }, [screen, currentUser]);

    useEffect(() => {
        if (context?.project) {
            setProject(context.project);
            setScreen('editor');
        }
    }, [context]);

    const handleCreateNew = () => {
        setProjectName('دمج ذكي - ' + new Date().toLocaleDateString('ar-EG'));
        setUrl1('');
        setUrl2('');
        setDesc1('');
        setDesc2('');
        setMergeStrategy('hybrid');
        setError('');
        setScreen('generator');
    };

    const handleDeleteProject = (appId: string) => {
        if (currentUser?.email && window.confirm('هل تريد حذف هذا المشروع المدمج بشكل دائم؟')) {
            const allProjects: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
            const updatedProjects = allProjects.filter(p => p.id !== appId);
            localStorage.setItem(`appProjects_${currentUser.email}`, JSON.stringify(updatedProjects));
            setProjects(updatedProjects.filter(p => p.creationMode === 'mergeToCode'));
        }
    };

    const handleMergeAndBuild = async () => {
        setError('');
        if (!url1.trim() || !url2.trim()) {
            setError('يرجى إدخال رابطي الموقعين للبدء.');
            return;
        }

        const logsList: string[] = [];
        const onLog = (msg: string) => {
            console.log(msg);
            logsList.push(msg);
            setLogs([...logsList]);
        };

        setIsGenerating(true);
        setLogs([]);

        try {
            onLog('جاري تحضير المحرك الذكي للدمج...');
            await new Promise(r => setTimeout(r, 600));

            onLog(`تحليل الرابط الأول: ${url1}`);
            await new Promise(r => setTimeout(r, 800));
            onLog('استخلاص الهوية البصرية والعناصر للموقع الأول عبر Grounding...');
            await new Promise(r => setTimeout(r, 900));

            onLog(`تحليل الرابط الثاني: ${url2}`);
            await new Promise(r => setTimeout(r, 800));
            onLog('تحليل هيكلية البيانات والميزات للموقع الثاني...');
            await new Promise(r => setTimeout(r, 700));

            const strategyTexts = {
                hybrid: 'توليد موقع هجين احترافي يمزج أفضل أجزاء الموقعين بالتساوي',
                design_and_func: 'تطبيق الهوية والتصميم الخاص بالموقع الأول مع تعزيزه بميزات ووظائف الموقع الثاني',
                fusion: 'دمج كلي متكامل للمحتوى، الألوان، والأقسام لكلا الرابطين'
            };

            onLog(`إعداد استراتيجية الدمج: [${strategyTexts[mergeStrategy]}]`);
            await new Promise(r => setTimeout(r, 800));

            const promptText = `
[طلب برمجة ودمج ذكي لموقعين إلكترونيين مختلفين]
اسم المشروع المطلوب: "${projectName}"

رابط الموقع الأول: "${url1}"
سياق/وصف الموقع الأول: "${desc1 || 'تحليل ذكي تلقائي للموقع ومحتوياته بالكامل'}"

رابط الموقع الثاني: "${url2}"
سياق/وصف الموقع الثاني: "${desc2 || 'تحليل ذكي تلقائي للموقع ومحتوياته بالكامل'}"

استراتيجية وتنسيق الدمج البرمجي المطلوب: "${strategyTexts[mergeStrategy]}"

المخرجات والمواصفات اللازمة:
1. صمم واجهة موقع إنترنت استثنائي، تفاعلي بالكامل، ذو تصميم عصري وجذاب، يجمع بين هوية ومكونات وتصميمات ومقالات/تفاصيل الموقعين المطروحين وبصورة متوازنة.
2. الكود البرمجي يجب أن يحتوي على هيكل كامل وبدون أي أجزاء فارغة أو تعليقات ناقصة.
3. قم بوضع علامة مائية صغيرة "AI ideas" في أسفل موقع الرائد كدليل على الجودة والاحترافية.
4. استخدم Tailwind CSS للتنسيقات الأنيقة وقم بكتابة منطق تفاعلي واضح لإقناع المستخدم بكامل الوظائف.
            `;

            onLog('جاري الاتصال بمهندس الذكاء الاصطناعي AI ideas وتدشين الدمج...');
            const results = await geminiService.buildProjectFromSpec({
                projectName,
                prompt: promptText,
                projectType: ProjectType.WEBSITE,
                files: []
            }, onLog);

            onLog('تم استلام الكود البرمجي بنجاح!');
            await new Promise(r => setTimeout(r, 500));
            onLog('جاري إعداد بيئة المعاينة والتجربة المباشرة...');

            const newProject: Project = {
                id: `merge-${Date.now()}`,
                name: projectName,
                description: `موقع مدمج ذكي بين (${url1}) و (${url2})`,
                type: ProjectType.WEBSITE,
                creationMode: 'mergeToCode',
                files: results.files || [],
                sections: [],
                timestamp: Date.now()
            };

            if (currentUser?.email) {
                const key = `appProjects_${currentUser.email}`;
                const savedApps: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
                savedApps.unshift(newProject);
                localStorage.setItem(key, JSON.stringify(savedApps));
            }

            incrementUsage(ProjectType.CODE_CONVERSION);

            setProject(newProject);
            setScreen('editor');

        } catch (err: any) {
            console.error(err);
            onLog(`فشل: ${err.message || 'حدث خطأ غير متوقع أثناء معالجة الدمج.'}`);
            setError(err.message || 'فشلت معالجة ودمج الروابط. يرجى مراجعة الروابط والمحاولة مجدداً.');
        } finally {
            setIsGenerating(false);
        }
    };

    const filteredProjects = useMemo(() => {
        return projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [projects, searchQuery]);

    const renderListView = () => (
        <div className="p-4 md:p-8 h-full flex flex-col animate-fade-in text-right" dir="rtl">
            <header className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-teal-100 flex items-center gap-2">
                        <SquaresPlusIcon className="w-8 h-8 text-teal-400" />
                        دمج إلى كود
                    </h2>
                    <p className="text-slate-400">({projects.length}) مشاريع دمج روابط ذكية</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleCreateNew} className="bg-gradient-to-l from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-teal-500/10">
                        <PlusIcon className="w-5 h-5" />
                        توليد بالدمج جديد
                    </button>
                </div>
            </header>

            <div className="relative mb-6">
                <input 
                    type="search" 
                    placeholder="ابحث في مشاريع الدمج الخاصة بك..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-4 pr-10 text-white focus:outline-none focus:border-teal-500 text-right" 
                />
                <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {filteredProjects.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/30 py-16">
                    <SquaresPlusIcon className="w-16 h-16 mb-4 text-slate-600" />
                    <h3 className="text-lg font-semibold text-slate-300">لا توجد مشاريع دمج حالياً</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-md text-center">
                        انقر على "توليد بالدمج جديد" لإدخال رابطي موقعين إلكترونيين ودمجهما ذكياً في كود تطبيقي رائع مباشرة.
                    </p>
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

    const renderGeneratorView = () => (
        <div className="p-4 md:p-8 h-full max-w-4xl mx-auto overflow-y-auto animate-fade-in text-right" dir="rtl">
            <button onClick={() => setScreen('list')} className="mb-6 py-1.5 px-3 bg-slate-800 text-slate-300 rounded-lg flex items-center gap-1 hover:text-white transition-colors">
                <ArrowLeftIcon className="w-4 h-4 ml-1" />
                الرجوع للقائمة
            </button>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 md:p-8 space-y-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-teal-400" />
                        دمج رابطين إلى كود برمجي متكامل
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        أدخل رابطين لموقعين برمجين مختلفين تماماً وسيقوم AI ideas باستخراج تفاصيلهما وصناعة تصميم موحد ومدهش متوازن الميزات.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Project Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1.5">اسم المشروع الجديد المدمج</label>
                        <input 
                            type="text" 
                            value={projectName} 
                            onChange={e => setProjectName(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-750 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-teal-500 focus:outline-none text-right"
                            placeholder="مثال: منصة التسوق والتوظيف المدمجة"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* URL 1 */}
                        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/60 space-y-3">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 bg-teal-400/10 px-2 py-1 rounded">
                                <GlobeIcon className="w-3.5 h-3.5" />
                                الموقع الإلكتروني الأول (أصل الهوية أو الهجين)
                            </span>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">رابط الموقع (URL)</label>
                                <input 
                                    type="url" 
                                    value={url1} 
                                    onChange={e => setUrl1(e.target.value)} 
                                    placeholder="https://example1.com" 
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-teal-500 text-left ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">ملاحظات/محتويات محددة للتركيز عليها (اختياري)</label>
                                <textarea 
                                    value={desc1} 
                                    onChange={e => setDesc1(e.target.value)} 
                                    rows={2} 
                                    placeholder="شريط التنقل، ألوان العلامة التجارية، الهيدر البصري..." 
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-teal-500 text-right"
                                />
                            </div>
                        </div>

                        {/* URL 2 */}
                        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/60 space-y-3">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">
                                <GlobeIcon className="w-3.5 h-3.5" />
                                الموقع الإلكتروني الثاني (أصل الوظائف أو الميزات)
                            </span>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">رابط الموقع (URL)</label>
                                <input 
                                    type="url" 
                                    value={url2} 
                                    onChange={e => setUrl2(e.target.value)} 
                                    placeholder="https://example2.com" 
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-teal-500 text-left ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">ملاحظات/محتويات محددة للتركيز عليها (اختياري)</label>
                                <textarea 
                                    value={desc2} 
                                    onChange={e => setDesc2(e.target.value)} 
                                    rows={2} 
                                    placeholder="النماذج التفاعلية، شاشة معالجة البيانات، معرض الصور..." 
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-teal-500 text-right"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Merge Strategy */}
                    <div className="pt-2">
                        <label className="block text-sm font-semibold text-slate-300 mb-2">استراتيجية الدمج الذكي</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button 
                                onClick={() => setMergeStrategy('hybrid')}
                                className={`p-3 rounded-lg border text-right transition-all flex flex-col justify-between ${mergeStrategy === 'hybrid' ? 'border-teal-500 bg-teal-500/10 text-white' : 'border-slate-700 bg-slate-900/30 text-slate-400 hover:border-slate-650'}`}
                            >
                                <span className="font-bold text-sm">دمج هجين متكافئ</span>
                                <span className="text-xs text-slate-400 mt-1">مزج كلا الموقعين بشكل متزن بالتساوي</span>
                            </button>
                            <button 
                                onClick={() => setMergeStrategy('design_and_func')}
                                className={`p-3 rounded-lg border text-right transition-all flex flex-col justify-between ${mergeStrategy === 'design_and_func' ? 'border-teal-500 bg-teal-500/10 text-white' : 'border-slate-700 bg-slate-900/30 text-slate-400 hover:border-slate-650'}`}
                            >
                                <span className="font-bold text-sm">تصميم الأول + ميزات الثاني</span>
                                <span className="text-xs text-slate-400 mt-1">أخذ هوية الموقع الأول ووظائف الثاني</span>
                            </button>
                            <button 
                                onClick={() => setMergeStrategy('fusion')}
                                className={`p-3 rounded-lg border text-right transition-all flex flex-col justify-between ${mergeStrategy === 'fusion' ? 'border-teal-500 bg-teal-500/10 text-white' : 'border-slate-700 bg-slate-900/30 text-slate-400 hover:border-slate-650'}`}
                            >
                                <span className="font-bold text-sm">اندماج كلي متكامل (Fusion)</span>
                                <span className="text-xs text-slate-400 mt-1">دمج شامل للهوية، الأقسام، والألوان</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error & Generate Button */}
                <div className="pt-4 space-y-3">
                    {error && <p className="text-red-400 text-sm font-semibold text-center">{error}</p>}
                    <button
                        onClick={handleMergeAndBuild}
                        disabled={isGenerating || !url1.trim() || !url2.trim()}
                        className="w-full py-3.5 bg-gradient-to-l from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 disabled:opacity-50 transition-all"
                    >
                        {isGenerating ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                        <span>{isGenerating ? 'جاري التحضير واستخلاص الموقعين...' : 'ابدأ الدمج الذكي للرابطين وتوليد الكود الآن'}</span>
                    </button>
                </div>
            </div>
        </div>
    );

    if (isGenerating) return <LoadingScreen logs={logs} />;

    if (screen === 'editor' && project) {
        return (
            <div className="flex flex-col h-full bg-slate-900 text-white">
                <SoftwareProjectBuilder 
                    navigate={navigate} 
                    mode="text" 
                    context={{ project }}
                    onNewProject={handleCreateNew}
                    onBack={() => setScreen('list')}
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
        </div>
    );
};

export default MergeToCode;
