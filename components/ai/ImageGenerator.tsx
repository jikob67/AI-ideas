import React, { useState } from 'react';
import { geminiService } from '../../services/geminiService';
import { Message, ProjectType } from '../../types';
import { SparklesIcon, SpinnerIcon, ArrowDownTrayIcon, CrownIcon } from '../Icons';
import { useUsage } from '../../hooks/useUsage';
import { useAuth } from '../../hooks/useAuth';
import UpgradeModal from '../UpgradeModal';

const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [isGenerating, setIsGenerating] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState('');
    const { isLimitReached, incrementUsage } = useUsage();
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const { currentUser } = useAuth();
    
    const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('الرجاء إدخال وصف للصورة.');
            return;
        }
        if (isLimitReached(ProjectType.GENERATE_IMAGE)) {
            setError('لقد وصلت إلى الحد اليومي لإنشاء الصور. قم بالترقية للمتابعة.');
            setUpgradeModalOpen(true);
            return;
        }

        setIsGenerating(true);
        setImageUrl(null);
        setError('');

        try {
            const imageBase64 = await geminiService.generateImage(prompt, aspectRatio);
            setImageUrl(`data:image/jpeg;base64,${imageBase64}`);
            incrementUsage(ProjectType.GENERATE_IMAGE);
        } catch (e) {
            console.error(e);
            setError(`فشل إنشاء الصورة: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <div className="p-4 h-full flex flex-col md:flex-row gap-4 overflow-y-auto">
            {/* Left: Inputs */}
            <div className="w-full md:w-1/3 flex-shrink-0 space-y-4">
                 <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="صف الصورة التي تريد إنشاءها..."
                    rows={6}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"
                />
                 <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white">
                    {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                </select>
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-500"
                >
                    {isGenerating ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                    {isGenerating ? 'جاري الإنشاء...' : 'أنشئ الصورة'}
                </button>
            </div>
            {/* Right: Output */}
            <div className="flex-grow bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center min-h-[300px]">
                {isGenerating ? (
                     <div className="text-center text-slate-400">
                        <SpinnerIcon className="w-12 h-12 animate-spin text-indigo-400" />
                        <p className="mt-2">الذكاء الاصطناعي يرسم...</p>
                    </div>
                ) : imageUrl ? (
                    <div className="w-full h-full relative group">
                        <img src={imageUrl} alt={prompt} className="w-full h-full object-contain rounded-lg" />
                        {currentUser?.plan === 'free' && <div className="watermark-overlay">AI ideas</div>}
                         <a href={imageUrl} download={`ai_image_${Date.now()}.jpg`} className="absolute bottom-3 right-3 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowDownTrayIcon className="w-5 h-5" />
                        </a>
                    </div>
                ) : (
                    <div className="text-center text-slate-500">
                        <p>ستظهر الصورة التي تم إنشاؤها هنا.</p>
                    </div>
                )}
            </div>
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
        </div>
    );
};

export default ImageGenerator;
