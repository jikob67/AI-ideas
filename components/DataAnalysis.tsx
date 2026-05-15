import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { Message, Project, ProjectSection, SectionType, StoreProduct, BlogPost, View } from '../types';
import { ChartPieIcon, SpinnerIcon, SparklesIcon, UploadIcon, ArrowDownTrayIcon, CrownIcon, TrashIcon, CopyIcon, CheckIcon, SaveIcon, Share2Icon, CodeIcon } from './Icons';
import { useAuth } from '../hooks/useAuth';
import UpgradeModal from './UpgradeModal';

interface DataAnalysisProps {
    onComplete?: (message: Message) => void;
    navigate: (view: View, context?: any) => void;
}

interface AnalysisResult {
    summary: string;
    insights: string[];
    followUpQuestions: string[];
    visualization?: { type: 'bar' | 'line' | 'pie', data: { label: string, value: number }[] }
}

const SimpleBarChart: React.FC<{ data: { label: string, value: number }[] }> = ({ data }) => {
    if (!data || data.length === 0) return null;
    const maxValue = Math.max(...data.map(d => d.value), 0);
    if (maxValue === 0) return <p className="text-xs text-slate-500">لا يمكن عرض الرسم البياني لأن جميع القيم صفر.</p>;
    
    return (
        <div className="w-full h-64 bg-slate-800 p-4 rounded-lg flex items-end gap-2 border border-slate-700">
            {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div
                        className="w-full bg-indigo-500 rounded-t-md hover:bg-indigo-400"
                        style={{ height: `${(item.value / maxValue) * 100}%` }}
                        title={`${item.label}: ${item.value}`}
                    ></div>
                    <p className="text-xs text-slate-400 truncate">{item.label}</p>
                </div>
            ))}
        </div>
    );
};


const DataAnalysis: React.FC<DataAnalysisProps> = ({ onComplete, navigate }) => {
    const [data, setData] = useState('');
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { currentUser } = useAuth();
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

    const [projects, setProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Project[]>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<string>(''); // Keep this to know which project is loaded
    const [searchError, setSearchError] = useState('');

    const [loadedProjectSections, setLoadedProjectSections] = useState<ProjectSection[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [copied, setCopied] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');

    useEffect(() => {
        if (currentUser?.email) {
            const savedProjects = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
            setProjects(savedProjects);
        }
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;
        const savedSession = localStorage.getItem(`dataAnalysisSession_${currentUser.email}`);
        if (savedSession) {
            try {
                const { data: savedData, query: savedQuery } = JSON.parse(savedSession);
                setData(savedData || '');
                setQuery(savedQuery || '');
            } catch (e) { console.error('Failed to parse saved data analysis session'); }
        }
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

    const convertToCsv = (headers: string[], items: any[]): string => {
        const headerRow = headers.join(',');
        const itemRows = items.map(item =>
            headers.map(header => {
                const value = item[header] || '';
                // Escape commas and quotes
                const escapedValue = `"${String(value).replace(/"/g, '""')}"`;
                return escapedValue;
            }).join(',')
        );
        return [headerRow, ...itemRows].join('\n');
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.trim()) {
            const filtered = projects.filter((p: Project) => 
                p.name.toLowerCase().includes(query.toLowerCase())
            );
            setSearchResults(filtered);
            setShowResults(true);
            setSearchError('');
        } else {
            setSearchResults([]);
            setSelectedProjectId('');
            setLoadedProjectSections([]);
            setData('');
        }
    };

    const handleSelectProject = (project: Project) => {
        setSelectedProjectId(project.id);
        setSearchQuery(project.name);
        setShowResults(false);

        const compatibleSections = project.sections.filter(s =>
            [SectionType.STORE, SectionType.BLOG, SectionType.USERS, SectionType.FORM].includes(s.type)
        );
        setLoadedProjectSections(compatibleSections);

        if (compatibleSections.length > 0) {
            const firstSection = compatibleSections[0];
            setSelectedSectionId(firstSection.id);
            setSearchError('');
            handleLoadSectionData(firstSection.id, compatibleSections);
        } else {
            setSearchError('هذا المشروع لا يحتوي على أقسام بيانات متوافقة (متجر, مدونة, إلخ).');
            setLoadedProjectSections([]);
            setData('');
        }
    };

    const handleLoadSectionData = (sectionId: string, sectionsToUse?: ProjectSection[]) => {
        setSelectedSectionId(sectionId);
        const sections = sectionsToUse || loadedProjectSections;
        const section = sections.find(s => s.id === sectionId);
        if (!section) return;

        let csvData = '';
        switch (section.type) {
            case SectionType.STORE:
                csvData = convertToCsv(['id', 'name', 'price', 'description'], (section.config.products as StoreProduct[]) || []);
                break;
            case SectionType.BLOG:
                csvData = convertToCsv(['id', 'title', 'author', 'date'], (section.config.posts as BlogPost[]) || []);
                break;
            // Add other cases for USERS, FORM etc.
            default:
                csvData = `لا يوجد محول بيانات لهذا النوع من الأقسام (${section.type}).`;
        }
        setData(csvData);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setData(text);
        };
        reader.onerror = () => {
            setError('فشل في قراءة الملف.');
        }
        reader.readAsText(file);
    };

    const handleAnalyze = async (queryToAnalyze?: string) => {
        const currentQuery = queryToAnalyze || query;
        if (!data.trim() || !currentQuery.trim()) {
            setError('الرجاء إدخال البيانات والسؤال لبدء التحليل.');
            return;
        }
        setIsLoading(true);
        setError('');
        // Do not clear previous result for a smoother UX when using follow-up questions
        // setResult(null);

        try {
            const analysis = await geminiService.analyzeData(data, currentQuery);
            setResult(analysis);
        } catch (e) {
            console.error(e);
            setError('حدث خطأ أثناء التحليل. يرجى التحقق من بياناتك والمحاولة مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadData = () => {
        if (!data.trim()) {
            setError('لا توجد بيانات لتنزيلها.');
            return;
        }
        const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'analysis_data.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadResults = () => {
        if (!result) {
            setError('لا توجد نتائج لتحليلها.');
            return;
        }
        const jsonString = JSON.stringify(result, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'analysis_result.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleShareReport = async () => {
        if (!result) {
            alert('لا توجد نتائج للمشاركة.');
            return;
        }
        if (!navigator.share) {
            alert('متصفحك لا يدعم ميزة المشاركة.');
            return;
        }

        const reportText = `تقرير تحليل البيانات:\n\n*الملخص:*\n${result.summary}\n\n*أهم الرؤى:*\n- ${result.insights.join('\n- ')}`;
        
        try {
            await navigator.share({
                title: 'تقرير تحليل البيانات',
                text: reportText,
            });
        } catch (err: any) {
            console.error('Share failed:', err);
            if (err && err.name === 'AbortError') {
                // User cancelled the share dialog, do nothing.
            } else if (err && err.name === 'NotAllowedError') {
                alert('فشلت المشاركة: تم رفض الإذن. قد يكون هذا بسبب قيود الأمان في المتصفح أو بيئة التشغيل.');
            } else {
                alert('فشلت المشاركة. قد لا يدعم متصفحك أو بيئة التشغيل هذه الميزة.');
            }
        }
    };
    
    const handleClear = () => {
        if (window.confirm('هل أنت متأكد من مسح جميع البيانات والنتائج؟')) {
            setData('');
            setQuery('');
            setResult(null);
            setError('');
            setSearchQuery('');
            setSelectedProjectId('');
            setSearchError('');
            setLoadedProjectSections([]);
        }
    };

    const handleCopySummary = () => {
        if (!result?.summary) return;
        navigator.clipboard.writeText(result.summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveSession = () => {
        if (!currentUser) return;
        if (!data.trim() && !query.trim()) {
            setError('لا توجد بيانات للحفظ.');
            return;
        }
        const session = { data, query };
        localStorage.setItem(`dataAnalysisSession_${currentUser.email}`, JSON.stringify(session));
        setSaveStatus('تم حفظ الجلسة!');
        setTimeout(() => setSaveStatus(''), 3000);
    };

    const handleBuildDashboard = () => {
        if (!result) return;
        const generatedPrompt = `أنشئ لوحة تحكم إدارية تفاعلية بناءً على تحليل البيانات التالي.
ملخص التحليل: ${result.summary}
أهم الرؤى المستخلصة:
${result.insights.map(i => `- ${i}`).join('\n')}
        
يجب أن تعرض لوحة التحكم بشكل بارز رسمًا بيانيًا للبيانات التالية:
${JSON.stringify(result.visualization?.data, null, 2)}
        
يجب أن تكون واجهة المستخدم نظيفة واحترافية ومناسبة لعرض البيانات. قم بتضمين بطاقات لعرض الرؤى الرئيسية.`;
        
        navigate('textToCode', { prefillPrompt: generatedPrompt });
    };

    return (
        <div className="p-4 flex-grow overflow-y-auto space-y-4">
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-2">
                <label className="text-sm font-semibold text-slate-300">استيراد بيانات من مشروع</label>
                <div className="relative" ref={searchRef}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => { if (searchQuery.trim()) setShowResults(true); }}
                        placeholder="ابحث عن مشروع بالاسم..."
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white text-sm"
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
                {searchError && <p className="text-red-400 text-xs">{searchError}</p>}
                {projects.length === 0 && <p className="text-amber-400 text-sm mt-2">لا توجد مشاريع محفوظة. يرجى إنشاء مشروع أولاً.</p>}
                {loadedProjectSections.length > 0 && (
                    <select value={selectedSectionId} onChange={e => handleLoadSectionData(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 mt-2 text-sm">
                        {loadedProjectSections.map(s => <option key={s.id} value={s.id}>{s.title} ({s.type})</option>)}
                    </select>
                )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <textarea
                        value={data}
                        onChange={e => setData(e.target.value)}
                        placeholder="ألصق بياناتك هنا (مثل CSV)..."
                        rows={8}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white font-mono text-sm"
                    />
                    <div className="flex gap-2 mt-2">
                        <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg text-sm">
                            <UploadIcon className="w-5 h-5" />
                            رفع
                        </button>
                        <button onClick={handleDownloadData} className="flex-1 flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg text-sm">
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            تنزيل
                        </button>
                        <button onClick={handleSaveSession} className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm" title="حفظ الجلسة">
                           <SaveIcon className="w-5 h-5" />
                        </button>
                         <button onClick={handleClear} title="مسح الكل" className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg text-sm">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                    {saveStatus && <p className="text-green-400 text-xs mt-2 text-center">{saveStatus}</p>}
                    <input ref={fileInputRef} type="file" accept=".txt,.csv,.json" className="hidden" onChange={handleFileChange} />
                </div>
                <textarea
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="ماذا تريد أن تعرف عن هذه البيانات؟"
                    rows={8}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"
                />
            </div>
            <div className="space-y-2">
                <button
                    onClick={() => handleAnalyze()}
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-500"
                >
                    {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                    {isLoading ? 'جاري التحليل...' : 'تحليل البيانات'}
                </button>
                <div className="relative group">
                    <button
                        disabled={isLoading || currentUser?.plan === 'free'}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-500 disabled:cursor-not-allowed"
                    >
                        <CrownIcon className="w-5 h-5" />
                        {isLoading ? 'جاري...' : 'تحليل تنبؤي (Pro)'}
                    </button>
                    {currentUser?.plan === 'free' && (
                        <div onClick={() => setUpgradeModalOpen(true)} className="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-white text-xs font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            الترقية للوصول
                        </div>
                    )}
                </div>
            </div>

            {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}

            {isLoading && !result && (
                 <div className="mt-4 p-4 text-center">
                    <SpinnerIcon className="w-8 h-8 mx-auto animate-spin text-indigo-400"/>
                    <p className="mt-2 text-slate-400">يقوم الذكاء الاصطناعي بتحليل بياناتك...</p>
                 </div>
            )}

            {result && (
                <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl animate-fade-in space-y-4">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        <h3 className="text-lg font-semibold text-white">نتائج التحليل</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={handleBuildDashboard} className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold py-1.5 px-3 rounded-lg">
                                <CodeIcon className="w-4 h-4" />
                                بناء لوحة تحكم
                            </button>
                            <button onClick={handleShareReport} className="flex items-center gap-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold py-1.5 px-3 rounded-lg">
                                <Share2Icon className="w-4 h-4" />
                                مشاركة
                            </button>
                            <button onClick={handleDownloadResults} className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg">
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                تنزيل
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center">
                            <h4 className="text-md font-semibold text-slate-300">ملخص</h4>
                            <button onClick={handleCopySummary} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                               {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                               {copied ? 'تم' : 'نسخ'}
                            </button>
                        </div>
                        <p className="text-slate-300 bg-slate-800 p-2 rounded-md mt-1">{result.summary}</p>
                    </div>
                    {result.visualization && result.visualization.data && result.visualization.data.length > 0 && (
                        <div>
                            <h4 className="text-md font-semibold text-slate-300 mb-2">تصور مرئي للبيانات</h4>
                            <SimpleBarChart data={result.visualization.data} />
                        </div>
                    )}
                    <div>
                        <h4 className="text-md font-semibold text-slate-300">رؤى رئيسية</h4>
                        <ul className="list-disc list-inside text-slate-300 space-y-1 mt-1 bg-slate-800 p-2 rounded-md">
                            {result.insights.map((insight, i) => <li key={i}>{insight}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-md font-semibold text-slate-300">أسئلة متابعة مقترحة</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {result.followUpQuestions.map((q, i) => (
                                <button key={i} onClick={() => { setQuery(q); handleAnalyze(q); }} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-full">{q}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
        </div>
    );
};

export default DataAnalysis;