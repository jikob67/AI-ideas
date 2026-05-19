import React, { useState, useEffect, useMemo } from 'react';
import { geminiService } from '../../services/geminiService';
import { ProjectType } from '../../types';
import { VideoIcon, SpinnerIcon, PlusIcon, TrashIcon, UploadIcon, ArrowDownTrayIcon, SparklesIcon } from '../Icons';
import { useUsage } from '../../hooks/useUsage';
import { useAuth } from '../../hooks/useAuth';
import UpgradeModal from '../UpgradeModal';

const GenerationProgress: React.FC<{ progressLogs: string[] }> = ({ progressLogs }) => {
    const lastMessage = progressLogs[progressLogs.length - 1] || "جاري الاتصال بـ AI الفيديو...";
    
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <SpinnerIcon className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
            <p className="font-semibold text-white text-lg">{lastMessage}</p>
            <p className="text-sm text-slate-400 mt-2">قد يستغرق إنشاء الفيديو عدة دقائق. يرجى عدم إغلاق هذه النافذة.</p>
            <div className="w-full bg-slate-700 rounded-full h-2.5 mt-4">
                <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (progressLogs.length / 5) * 100)}%` }}></div>
            </div>
        </div>
    );
};

const VideoGenerator: React.FC<{ initialPrompt?: string }> = ({ initialPrompt }) => {
    const [prompt, setPrompt] = useState(initialPrompt || '');
    const [image, setImage] = useState<{file: File, url: string, base64: string} | null>(null);
    const [videoResolution, setVideoResolution] = useState<'720p' | '1080p'>('720p');
    const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');

    const [progress, setProgress] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const { isLimitReached, incrementUsage } = useUsage();
    const [error, setError] = useState('');
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
    
    const [hasSelectedApiKey, setHasSelectedApiKey] = useState(false);
    const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio) {
                try {
                    const hasKey = await window.aistudio.hasSelectedApiKey();
                    setHasSelectedApiKey(hasKey);
                } catch (e) {
                    console.error("Error checking API key:", e);
                    setHasSelectedApiKey(false); // Assume no key on error
                }
            } else {
                // Fallback for environments where aistudio is not available
                setHasSelectedApiKey(!!process.env.API_KEY);
            }
            setIsCheckingApiKey(false);
        };
        checkApiKey();
    }, []);

    const handleSelectKey = async () => {
        if (!window.aistudio) {
            setError("بيئة التشغيل لا تدعم اختيار مفتاح API.");
            return;
        }
        await window.aistudio.openSelectKey();
        setHasSelectedApiKey(true);
        setError('');
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setImage({
                    file, 
                    url: URL.createObjectURL(file),
                    base64: (reader.result as string).split(',')[1]
                });
            };
        }
    };
    
    const removeImage = () => setImage(null);

    const handleGenerate = async () => {
        if (!hasSelectedApiKey) {
            setError('يجب اختيار مفتاح API أولاً لاستخدام هذه الميزة.');
            handleSelectKey();
            return;
        }
        if (isLimitReached(ProjectType.GENERATE_VIDEO)) {
            setUpgradeModalOpen(true);
            return;
        }
        if (!prompt.trim() && !image) {
            setError("الرجاء إدخال وصف أو رفع صورة.");
            return;
        }

        setIsGenerating(true);
        setProgress([]);
        setVideoUrl(null);
        setError('');

        try {
            const url = await geminiService.generateVideo(
                prompt,
                image ? { base64: image.base64, mimeType: image.file.type } : null,
                videoResolution,
                videoAspectRatio,
                (log) => setProgress(prev => [...prev, log])
            );
            setVideoUrl(url);
            incrementUsage(ProjectType.GENERATE_VIDEO);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            if (errorMessage.includes("Requested entity was not found")) {
                setError("فشل التحقق من مفتاح API. يرجى اختيار مفتاح صالح.");
                setHasSelectedApiKey(false);
            } else {
                setError(`فشل إنشاء الفيديو: ${errorMessage}`);
            }
        } finally {
            setIsGenerating(false);
        }
    };
    
    if (isCheckingApiKey) {
        return <div className="flex items-center justify-center h-full"><SpinnerIcon className="w-8 h-8 animate-spin"/></div>
    }

    if (!hasSelectedApiKey) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <h3 className="text-lg font-semibold text-white">مطلوب مفتاح API</h3>
                <p className="text-sm text-slate-400 mt-2 mb-4 max-w-md">
                    ميزة إنشاء الفيديو تتطلب منك اختيار مفتاح API الخاص بك. 
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline mx-1">
                        معلومات حول الفوترة
                    </a>
                </p>
                <button onClick={handleSelectKey} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg">
                    اختيار مفتاح API
                </button>
                 {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
            </div>
        );
    }
    

    return (
        <div className="p-4 h-full flex flex-col md:flex-row gap-4 overflow-y-auto">
            <div className="w-full md:w-1/3 flex-shrink-0 space-y-4">
                 <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="صف الفيديو الذي تريد إنشاؤه..."
                    rows={6}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"
                />
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">صورة البداية (اختياري)</label>
                    {image ? (
                        <div className="relative group">
                            <img src={image.url} alt="Start frame" className="w-full h-32 object-cover rounded-md"/>
                            <button onClick={removeImage} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    ) : (
                        <label htmlFor="video-image-upload" className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-indigo-500">
                            <UploadIcon className="w-6 h-6 text-slate-500" />
                            <span className="text-xs text-slate-400 mt-1">ارفع صورة</span>
                        </label>
                    )}
                     <input id="video-image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <select value={videoResolution} onChange={e => setVideoResolution(e.target.value as any)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white">
                        <option value="720p">720p</option>
                        <option value="1080p">1080p</option>
                    </select>
                    <select value={videoAspectRatio} onChange={e => setVideoAspectRatio(e.target.value as any)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white">
                        <option value="16:9">16:9</option>
                        <option value="9:16">9:16</option>
                    </select>
                </div>
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-500"
                >
                    {isGenerating ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                    {isGenerating ? 'جاري الإنشاء...' : 'أنشئ الفيديو'}
                </button>
            </div>
            <div className="flex-grow bg-slate-800/50 border border-slate-700 rounded-xl p-2 flex flex-col items-center justify-center min-h-[300px]">
                {isGenerating ? (
                    <GenerationProgress progressLogs={progress} />
                ) : videoUrl ? (
                    <div className="w-full h-full relative group">
                        <video controls autoPlay loop src={videoUrl} className="w-full h-full object-contain rounded-lg">
                            Your browser does not support the video tag.
                        </video>
                         <a href={videoUrl} download={`ai_video_${Date.now()}.mp4`} className="absolute bottom-3 right-3 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100">
                            <ArrowDownTrayIcon className="w-5 h-5" />
                        </a>
                    </div>
                ) : (
                    <div className="text-center text-slate-500">
                        <VideoIcon className="w-16 h-16 mx-auto mb-4" />
                        <p>سيظهر الفيديو الذي تم إنشاؤه هنا.</p>
                    </div>
                )}
            </div>
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
        </div>
    );
};

export default VideoGenerator;
