
import React, { useState, useEffect } from 'react';
// FIX: Corrected import path for types
import { Project } from '../types';
// FIX: Corrected import path for geminiService
import { geminiService } from '../services/geminiService';
// FIX: Corrected import path for Icons
import { CloseIcon, SpinnerIcon, ShieldCheckIcon, CodeIcon, RocketLaunchIcon, GlobeAltIcon, LockClosedIcon, UsersGroupIcon } from './Icons';

interface CategoryReport {
    score: number;
    feedback: string;
    suggestions: string[];
}

interface AnalysisReport {
    overallScore: number;
    report: {
        codeOrganization?: CategoryReport;
        performance?: CategoryReport;
        compatibility?: CategoryReport;
        security?: CategoryReport;
        ux?: CategoryReport;
    };
}

const CircularProgress: React.FC<{ score: number }> = ({ score }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const [offset, setOffset] = useState(circumference);

    useEffect(() => {
        // Trigger the animation after the component mounts
        const progressOffset = circumference - (score / 100) * circumference;
        setOffset(progressOffset);
    }, [score, circumference]);


    let colorClass = 'stroke-green-500';
    if (score < 75) colorClass = 'stroke-yellow-500';
    if (score < 50) colorClass = 'stroke-red-500';

    return (
        <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle className="text-slate-700" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
                <circle
                    className={`${colorClass}`}
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                    transform="rotate(-90 60 60)"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white">{score}</span>
        </div>
    );
};

const ReportCategory: React.FC<{ title: string; icon: React.ReactNode; data: CategoryReport }> = ({ title, icon, data }) => {
    let scoreColor = 'text-green-400';
    if (data.score < 75) scoreColor = 'text-yellow-400';
    if (data.score < 50) scoreColor = 'text-red-400';

    return (
        <div className="bg-slate-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white flex items-center gap-2">{icon} {title}</h4>
                <span className={`font-bold text-lg ${scoreColor}`}>{data.score}/100</span>
            </div>
            <p className="text-sm text-slate-300 mb-3">{data.feedback}</p>
            {data.suggestions && data.suggestions.length > 0 && (
                <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase mb-2">اقتراحات للتحسين</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                        {data.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};

const QualityAnalysisModal: React.FC<{ isOpen: boolean; onClose: () => void; project: Project; }> = ({ isOpen, onClose, project }) => {
    const [report, setReport] = useState<AnalysisReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            const fetchAnalysis = async () => {
                setIsLoading(true);
                setError('');
                setReport(null);
                try {
                    const analysisResult = await geminiService.analyzeProjectQuality(project);
                    setReport(analysisResult);
                } catch (e) {
                    setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAnalysis();
        }
    }, [isOpen, project]);

    const CATEGORY_MAP = [
        { key: 'codeOrganization', title: 'تنظيم الكود', icon: <CodeIcon className="w-5 h-5 text-indigo-400" /> },
        { key: 'performance', title: 'الأداء والكفاءة', icon: <RocketLaunchIcon className="w-5 h-5 text-green-400" /> },
        { key: 'ux', title: 'تجربة المستخدم والوصولية', icon: <UsersGroupIcon className="w-5 h-5 text-sky-400" /> },
        { key: 'security', title: 'أمان البيانات', icon: <LockClosedIcon className="w-5 h-5 text-red-400" /> },
        { key: 'compatibility', title: 'التوافق', icon: <GlobeAltIcon className="w-5 h-5 text-amber-400" /> },
    ];

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <SpinnerIcon className="w-12 h-12 animate-spin text-indigo-400" />
                    <p className="mt-4 text-slate-300">جاري تحليل المشروع بواسطة الذكاء الاصطناعي...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <h3 className="text-lg font-bold text-red-400">فشل التحليل</h3>
                    <p className="mt-2 text-slate-400">{error}</p>
                    <button onClick={onClose} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg">إغلاق</button>
                </div>
            );
        }
        if (report) {
            return (
                <div className="h-full flex flex-col">
                    <div className="flex flex-col md:flex-row items-center gap-6 p-4 border-b border-slate-700">
                        <CircularProgress score={report.overallScore} />
                        <div>
                            <h3 className="text-2xl font-bold text-white">تقرير جودة المشروع</h3>
                            <p className="text-slate-400 mt-1">
                                حصل مشروعك على درجة <span className="font-bold">{report.overallScore} من 100</span>. إليك التفاصيل.
                            </p>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {CATEGORY_MAP.map(({ key, title, icon }) => {
                            const reportData = report.report[key as keyof AnalysisReport['report']];
                            if (!reportData) return null;
                            return <ReportCategory key={key} title={title} icon={icon} data={reportData} />;
                        })}
                    </div>
                    <div className="p-4 border-t border-slate-700 text-center">
                        <button disabled className="w-full bg-slate-600 text-white font-bold py-2 px-4 rounded-lg cursor-not-allowed" title="قريبًا!">
                            تطبيق التحسينات المقترحة (قريبًا)
                        </button>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl h-full max-h-[90vh] flex flex-col relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
                 <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full bg-slate-700/50 hover:bg-slate-700 z-10"><CloseIcon className="w-5 h-5"/></button>
                 {renderContent()}
            </div>
        </div>
    );
};

export default QualityAnalysisModal;
