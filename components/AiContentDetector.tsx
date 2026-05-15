import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { ProjectType } from '../types';
import { useUsage } from '../hooks/useUsage';
import { useAuth } from '../hooks/useAuth';
import { SparklesIcon, SpinnerIcon, BeakerIcon, UploadIcon, TrashIcon, ArrowDownTrayIcon, CopyIcon, CheckIcon, SaveIcon, Share2Icon } from './Icons';
import UpgradeModal from './UpgradeModal';

interface AnalysisResult {
    aiScore: number;
    summary: string;
    keyIndicators: string[];
}

const ScoreMeter: React.FC<{ score: number }> = ({ score }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const [offset, setOffset] = useState(circumference);
    
    useEffect(() => {
        const progressOffset = circumference - (score / 100) * circumference;
        setOffset(progressOffset);
    }, [score, circumference]);

    let scoreColorClass = 'text-green-400';
    let meterColorClass = 'stroke-green-500';
    if (score >= 50) {
        scoreColorClass = 'text-yellow-400';
        meterColorClass = 'stroke-yellow-500';
    }
    if (score >= 75) {
        scoreColorClass = 'text-red-400';
        meterColorClass = 'stroke-red-500';
    }
    
    return (
        <div className="relative w-40 h-40">
            <svg className="w-full h-full" viewBox="0 0 140 140">
                <circle className="text-slate-700" strokeWidth="12" stroke="currentColor" fill="transparent" r={radius} cx="70" cy="70" />
                <circle
                    className={meterColorClass}
                    style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx="70"
                    cy="70"
                    transform="rotate(-90 70 70)"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${scoreColorClass}`}>{score}%</span>
                <span className="text-sm text-slate-400">محتوى ذكاء اصطناعي</span>
            </div>
        </div>
    );
};


const AiContentDetector: React.FC = () => {
    const [text, setText] = useState('');
    const [file, setFile] = useState<{ data: string; mimeType: string; url: string; type: 'image' | 'video' } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const { isLimitReached, incrementUsage } = useUsage();
    const { currentUser } = useAuth();
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');

    useEffect(() => {
        if (!currentUser?.email) return;
        const savedSession = localStorage.getItem(`aiDetectorSession_${currentUser.email}`);
        if (savedSession) {
            try {
                const { text: savedText } = JSON.parse(savedSession);
                setText(savedText || '');
            } catch (e) { console.error(e); }
        }
    }, [currentUser]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
            setError('الرجاء رفع ملف صورة أو فيديو.');
            return;
        }
        
        setResult(null);
        setError('');

        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = () => {
            const result = reader.result as string;
            setFile({
                data: result.split(',')[1],
                mimeType: selectedFile.type,
                url: URL.createObjectURL(selectedFile),
                type: selectedFile.type.startsWith('image/') ? 'image' : 'video'
            });
        };
        reader.onerror = () => {
            setError('فشل في قراءة الملف.');
        };
    };

    const handleAnalyze = async () => {
        if (!text.trim() && !file) {
            setError('الرجاء إدخال نص أو رفع ملف للتحليل.');
            return;
        }
        if (isLimitReached(ProjectType.AI_CONTENT_DETECTION)) {
            setUpgradeModalOpen(true);
            return;
        }

        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const media = file ? { data: file.data, mimeType: file.mimeType } : undefined;
            const analysis = await geminiService.analyzeAiContent(text, media);
            setResult(analysis);
            incrementUsage(ProjectType.AI_CONTENT_DETECTION);
        } catch (e) {
            console.error(e);
            setError('حدث خطأ أثناء التحليل. حاول مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClear = () => {
        setText('');
        setFile(null);
        setResult(null);
        setError('');
    };

    const handleDownloadReport = () => {
        if (!result) return;
        const reportText = `AI Content Analysis Report\n\nAI Score: ${result.aiScore}%\n\nSummary:\n${result.summary}\n\nKey Indicators:\n- ${result.keyIndicators.join('\n- ')}\n`;
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai_content_report.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    
    const handleCopySummary = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareReport = async () => {
        if (!result) return;
        if (!navigator.share) {
            alert('متصفحك لا يدعم ميزة المشاركة.');
            return;
        }
        const reportText = `تقرير كاشف المحتوى الذكي:\n\n*النتيجة: ${result.aiScore}%* محتوى AI\n\n*الملخص:*\n${result.summary}`;
        try {
            await navigator.share({
                title: 'تقرير كاشف المحتوى الذكي',
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

    const handleSave = () => {
        if (!currentUser?.email) return;
        if (!text.trim() && !file) {
            setError('لا يوجد محتوى للحفظ.');
            return;
        }
        localStorage.setItem(`aiDetectorSession_${currentUser.email}`, JSON.stringify({ text }));
        setSaveStatus('تم حفظ النص!');
        setTimeout(() => setSaveStatus(''), 3000);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white animate-fade-in p-4 lg:p-8">
            <header className="text-center mb-8">
                <BeakerIcon className="w-12 h-12 mx-auto text-indigo-400 mb-2" />
                <h1 className="text-3xl font-bold text-slate-100">كاشف المحتوى الذكي</h1>
                <p className="text-slate-400 mt-2 max-w-2xl mx-auto">
                    ألصق أي نص أو ارفع صورة/فيديو لمعرفة احتمالية أن يكون قد تم إنشاؤه بواسطة الذكاء الاصطناعي.
                </p>
            </header>

            <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col gap-6">
                {!file ? (
                    <label htmlFor="content-upload" className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-indigo-500 hover:bg-slate-800/50 transition-colors h-48">
                        <UploadIcon className="w-8 h-8 text-slate-500 mb-2"/>
                        <span className="font-semibold text-slate-300">ارفع صورة أو فيديو</span>
                        <span className="text-sm text-slate-400 mt-1">أو ألصق النص في الأسفل</span>
                    </label>
                ) : (
                    <div className="relative group bg-slate-800 rounded-lg p-2 h-48 flex items-center justify-center">
                        {file.type === 'image' ? (
                            <img src={file.url} className="max-h-full max-w-full object-contain rounded" alt="Preview"/>
                        ) : (
                            <video src={file.url} controls className="max-h-full max-w-full object-contain rounded"/>
                        )}
                        <button onClick={() => setFile(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                )}
                <input id="content-upload" type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={file ? 'أضف ملاحظات أو أسئلة حول الملف (اختياري)' : 'ألصق النص هنا...'}
                    rows={file ? 4 : 8}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white text-base leading-relaxed resize-y focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
                
                {error && <p className="text-red-400 text-sm text-center -mt-2">{error}</p>}
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 text-lg disabled:bg-slate-500"
                    >
                        {isLoading ? <SpinnerIcon className="w-6 h-6 animate-spin" /> : <SparklesIcon className="w-6 h-6" />}
                        {isLoading ? 'جاري التحليل...' : 'تحليل المحتوى'}
                    </button>
                    <button onClick={handleSave} className="w-full sm:w-auto bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                        <SaveIcon className="w-5 h-5"/>
                        <span>حفظ النص</span>
                    </button>
                </div>
                {saveStatus && <p className="text-xs text-center text-green-400 -mt-2">{saveStatus}</p>}

                <div className="flex-grow min-h-[200px]">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <SpinnerIcon className="w-10 h-10 animate-spin text-indigo-400" />
                            <p className="mt-3">يقوم الذكاء الاصطناعي بفحص المحتوى...</p>
                        </div>
                    )}
                    {result && !isLoading && (
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-fade-in flex flex-col md:flex-row items-center gap-8 relative">
                            <div className="absolute top-3 right-3 flex gap-2">
                                <button onClick={handleShareReport} title="مشاركة التقرير" className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md"><Share2Icon className="w-4 h-4"/></button>
                                <button onClick={handleDownloadReport} title="تنزيل التقرير" className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md"><ArrowDownTrayIcon className="w-4 h-4"/></button>
                                <button onClick={handleCopySummary} title="نسخ الملخص" className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md">{copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4"/>}</button>
                                <button onClick={handleClear} title="مسح" className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                            <div className="flex-shrink-0">
                                <ScoreMeter score={result.aiScore} />
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-xl font-bold text-white mb-2">الخلاصة</h3>
                                <p className="text-slate-300 mb-4">{result.summary}</p>
                                <h4 className="text-md font-semibold text-slate-200 mb-2">المؤشرات الرئيسية:</h4>
                                <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm">
                                    {result.keyIndicators.map((indicator, index) => (
                                        <li key={index}>{indicator}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
        </div>
    );
};

export default AiContentDetector;