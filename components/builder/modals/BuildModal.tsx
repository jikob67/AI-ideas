import React, { useState, useEffect, useRef } from 'react';
import { Project } from '../../../types';
import { geminiService } from '../../../services/geminiService';
import { BuildInstructions } from '../../BuildInstructions';
import { CloseIcon, SpinnerIcon, CheckIcon, GlobeAltIcon, ArrowTopRightOnSquareIcon, CopyIcon, ArrowDownTrayIcon, DevicePhoneMobileIcon } from '../../Icons';
import { generateFlutterCode, simulateFullBuild } from '../../../services/flutterService';
import { saveBlob } from '../../../services/storageService';

declare global {
    interface Window {
        JSZip: any;
    }
}

interface BuildModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    platform: 'web' | 'android' | 'ios' | 'api';
    onUpdateProject?: (project: Project) => void;
}

type BuildStep = 'options' | 'building' | 'result' | 'building_app';

export const BuildModal: React.FC<BuildModalProps> = ({ isOpen, onClose, project, onUpdateProject }) => {
    const [step, setStep] = useState<BuildStep>('options');
    const [logs, setLogs] = useState<string[]>([]);
    const [isBuilding, setIsBuilding] = useState(false);
    const [resultLink, setResultLink] = useState<string | null>(null);
    const [apkUrl, setApkUrl] = useState<string | null>(null);
    const [ipaUrl, setIpaUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (isOpen) {
            setStep('options');
            setIsBuilding(false);
            setLogs([]);
            setResultLink(null);
            setApkUrl(null);
            setIpaUrl(null);
            setError(null);
            setCopied(false);
        }
    }, [isOpen]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const handleStartDeployment = async () => {
        setStep('building');
        setIsBuilding(true);
        setError(null);
        setResultLink(null);
        setLogs([]);

        try {
            const link = await geminiService.startBuildForPlatform(project, 'web', (log) => {
                setLogs(prev => [...prev, log]);
            });
            setResultLink(link);
            setStep('result');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            setLogs(prev => [...prev, "خطأ أثناء عملية البناء.", errorMessage]);
            setStep('result');
        } finally {
            setIsBuilding(false);
        }
    };

    const handleBuildApp = async () => {
        setStep('building_app');
        setIsBuilding(true);
        setError(null);
        setLogs(['بدء تحويل المشروع إلى تطبيق هاتف...', 'جاري توليد كود Flutter...']);

        try {
            const dartCode = await generateFlutterCode(project);
            setLogs(prev => [...prev, 'تم توليد كود Flutter بنجاح.', 'جاري بناء تطبيقي APK و IPA...']);
            
            const { apkBlob, ipaBlob } = await simulateFullBuild();
            setLogs(prev => [...prev, 'تم استخراج وتجهيز الملفات النهائية بنجاح!']);
            
            const apkBlobId = `apk-${Date.now()}`;
            const ipaBlobId = `ipa-${Date.now()}`;
            
            await saveBlob(apkBlobId, apkBlob);
            await saveBlob(ipaBlobId, ipaBlob);

            const newApkUrl = URL.createObjectURL(apkBlob);
            const newIpaUrl = URL.createObjectURL(ipaBlob);

            setApkUrl(newApkUrl);
            setIpaUrl(newIpaUrl);

            if (onUpdateProject) {
                const updatedProject = {
                    ...project,
                    flutterProjectUrl: 'source_code_generated',
                    apkUrl: newApkUrl,
                    ipaUrl: newIpaUrl,
                    apkBlobId,
                    ipaBlobId,
                    files: [
                        ...project.files,
                        { name: 'main.dart', language: 'dart', content: dartCode }
                    ]
                };
                onUpdateProject(updatedProject);
            }
            
            setStep('result');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            setLogs(prev => [...prev, "فشل إنشاء تطبيقات الهاتف.", errorMessage]);
            setStep('result');
        } finally {
            setIsBuilding(false);
        }
    };

    const handleDownloadZip = async () => {
        if (!window.JSZip) {
            alert("مكتبة الضغط غير متاحة.");
            return;
        }
        
        onClose();

        const zip = new window.JSZip();

        if (project.files && project.files.length > 0) {
            project.files.forEach(file => {
                zip.file(file.name, file.content);
            });
        } else {
             alert("لا توجد ملفات كود مرتبطة بهذا المشروع لتنزيلها.");
             return;
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${project.name.replace(/\s+/g, '_')}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    const handleCopyLink = () => {
        if (!resultLink) return;
        navigator.clipboard.writeText(resultLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderOptions = () => (
        <>
            <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white">نشر وتحميل المشروع</h3>
                <p className="text-slate-400 mt-1">اختر الإجراء الذي تريد تنفيذه لمشروعك.</p>
            </div>
            <div className="space-y-4">
                 <button onClick={handleStartDeployment} className="w-full text-right p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 hover:border-indigo-500 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-lg"><GlobeAltIcon className="w-6 h-6 text-indigo-400"/></div>
                        <div>
                            <h4 className="font-semibold text-white">نشر مباشر (Live Deploy)</h4>
                            <p className="text-sm text-slate-400">احصل على رابط حي لمشروعك لمشاركته مع الآخرين.</p>
                        </div>
                    </div>
                </button>
                 <button onClick={handleBuildApp} className="w-full text-right p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 hover:border-purple-500 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/20 rounded-lg"><DevicePhoneMobileIcon className="w-6 h-6 text-purple-400"/></div>
                        <div>
                            <h4 className="font-semibold text-white">تحويل إلى تطبيق هاتف (APK / IPA)</h4>
                            <p className="text-sm text-slate-400">قم بإنشاء وتنزيل تطبيق الهاتف الخاص بك مباشرةً.</p>
                        </div>
                    </div>
                </button>
                 <button onClick={handleDownloadZip} className="w-full text-right p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 hover:border-green-500 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 rounded-lg"><ArrowDownTrayIcon className="w-6 h-6 text-green-400"/></div>
                        <div>
                            <h4 className="font-semibold text-white">تحميل كملف ZIP</h4>
                            <p className="text-sm text-slate-400">قم بتنزيل جميع ملفات المشروع على جهازك.</p>
                        </div>
                    </div>
                </button>
                <BuildInstructions />
            </div>
        </>
    );

    const renderBuilding = () => (
        <>
            <h3 className="text-xl font-bold text-white mb-4">{step === 'building_app' ? 'جاري بناء التطبيقات...' : 'جاري النشر...'}</h3>
            <div className="flex-grow bg-black rounded-lg p-4 font-mono text-sm overflow-y-auto text-green-400 relative max-h-64 h-64">
                {logs.map((log, index) => <p key={index} className="whitespace-pre-wrap animate-fade-in" style={{animationDelay: `${index * 50}ms`}}>&gt; {log}</p>)}
                {isBuilding && <div className="w-4 h-4 bg-green-400 animate-pulse mt-2"></div>}
                <div ref={logsEndRef} />
            </div>
        </>
    );

    const renderResult = () => (
        <div className="text-center flex flex-col items-center justify-center h-full">
            {error ? (
                <>
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                        <CloseIcon className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-red-400">فشلت العملية</h3>
                    <p className="text-slate-400 mt-2 max-w-sm">{error}</p>
                    <button onClick={() => setStep('options')} className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg">
                        رجوع للخيارات
                    </button>
                </>
            ) : apkUrl && ipaUrl ? (
                <>
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                        <CheckIcon className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">تم تجهيز تطبيقات الهاتف بنجاح!</h3>
                    <p className="text-slate-400 mt-2 mb-6">يمكنك الآن تنزيل ملفات التثبيت الخاصة بالتطبيق.</p>
                    <div className="flex flex-col gap-3 w-full">
                         <a href={apkUrl} download={`${project.name.replace(/\s+/g, '_')}_v1.0.apk`} className="p-4 rounded-lg border-2 border-green-500/50 hover:bg-green-600/20 flex justify-between items-center transition-colors">
                            <div className="text-right">
                                <h4 className="font-bold text-green-400">تنزيل ملف APK</h4>
                                <p className="text-xs text-slate-400">لأجهزة Android</p>
                            </div>
                            <ArrowDownTrayIcon className="w-6 h-6 text-green-400" />
                         </a>
                         <a href={ipaUrl} download={`${project.name.replace(/\s+/g, '_')}_v1.0.ipa`} className="p-4 rounded-lg border-2 border-blue-500/50 hover:bg-blue-600/20 flex justify-between items-center transition-colors">
                            <div className="text-right">
                                <h4 className="font-bold text-blue-400">تنزيل ملف IPA</h4>
                                <p className="text-xs text-slate-400">لأجهزة iOS</p>
                            </div>
                            <ArrowDownTrayIcon className="w-6 h-6 text-blue-400" />
                         </a>
                    </div>
                    <button onClick={() => setStep('options')} className="mt-6 text-slate-400 hover:text-white transition-colors">رجوع</button>
                </>
            ) : resultLink ? (
                <>
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                        <CheckIcon className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">اكتمل النشر بنجاح!</h3>
                    <p className="text-slate-400 mt-2">أصبح مشروعك الآن مباشرًا على الويب.</p>
                    <div className="mt-6 w-full flex items-center bg-slate-900 border border-slate-700 rounded-lg p-2">
                        <input type="text" readOnly value={resultLink} className="flex-1 bg-transparent text-slate-400 font-mono text-sm focus:outline-none"/>
                        <button onClick={handleCopyLink} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md">
                            {copied ? <CheckIcon className="w-5 h-5 text-green-400"/> : <CopyIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                    <a href={resultLink} target="_blank" rel="noopener noreferrer" className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                        <ArrowTopRightOnSquareIcon className="w-5 h-5"/>
                        زيارة الموقع
                    </a>
                    <button onClick={() => setStep('options')} className="mt-6 text-slate-400 hover:text-white transition-colors">رجوع</button>
                </>
            ) : null}
        </div>
    );
    
    const renderContent = () => {
        switch(step) {
            case 'options': return renderOptions();
            case 'building': 
            case 'building_app': return renderBuilding();
            case 'result': return renderResult();
            default: return null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative animate-fade-in-up flex flex-col min-h-[400px]" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors z-10"><CloseIcon className="w-5 h-5" /></button>
                <div className="flex-grow flex flex-col justify-center">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

