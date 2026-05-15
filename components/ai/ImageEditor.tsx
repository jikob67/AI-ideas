import React, { useState } from 'react';
import { geminiService } from '../../services/geminiService';
import { ProjectType } from '../../types';
import { SparklesIcon, SpinnerIcon, ArrowDownTrayIcon, UploadIcon } from '../Icons';
import { useUsage } from '../../hooks/useUsage';
import UpgradeModal from '../UpgradeModal';

const ImageEditor: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<{file: File, url: string} | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [error, setError] = useState('');
    const { isLimitReached, incrementUsage } = useUsage();
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setOriginalImage({file, url: URL.createObjectURL(file)});
            setEditedImageUrl(null);
            setError('');
        }
    };

    const handleGenerate = async () => {
        if (!originalImage) {
            setError('الرجاء رفع صورة أولاً.');
            return;
        }
        if (!prompt.trim()) {
            setError('الرجاء إدخال وصف للتعديل.');
            return;
        }
        if (isLimitReached(ProjectType.GENERATE_IMAGE)) { // Uses same limit as generation
            setUpgradeModalOpen(true);
            return;
        }

        setIsGenerating(true);
        setEditedImageUrl(null);
        setError('');

        const reader = new FileReader();
        reader.readAsDataURL(originalImage.file);
        reader.onload = async () => {
            try {
                const base64Data = (reader.result as string).split(',')[1];
                const editedBase64 = await geminiService.editImage(base64Data, originalImage.file.type, prompt);
                setEditedImageUrl(`data:image/png;base64,${editedBase64}`);
                incrementUsage(ProjectType.GENERATE_IMAGE);
            } catch (e) {
                console.error(e);
                setError(`فشل تعديل الصورة: ${e instanceof Error ? e.message : String(e)}`);
            } finally {
                setIsGenerating(false);
            }
        };
        reader.onerror = () => {
            setError("Failed to read file.");
            setIsGenerating(false);
        };
    };
    
    return (
        <div className="p-4 h-full flex flex-col md:flex-row gap-4 overflow-y-auto">
            {/* Left: Inputs */}
            <div className="w-full md:w-1/3 flex-shrink-0 space-y-4">
                 <label htmlFor="image-upload" className="cursor-pointer block border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-indigo-500 hover:bg-slate-800 transition-colors h-48 flex items-center justify-center">
                    {originalImage ? (
                        <img src={originalImage.url} alt="Original" className="max-h-full max-w-full object-contain" />
                    ) : (
                        <div className="text-slate-500">
                            <UploadIcon className="w-8 h-8 mx-auto mb-2" />
                            <span className="text-sm">ارفع صورة لتعديلها</span>
                        </div>
                    )}
                </label>
                <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                 <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="صف التعديل الذي تريده، مثال: أضف نظارة شمسية..."
                    rows={4}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"
                />
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !originalImage}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-500"
                >
                    {isGenerating ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                    {isGenerating ? 'جاري التعديل...' : 'نفذ التعديل'}
                </button>
            </div>
            {/* Right: Output */}
            <div className="flex-grow bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center min-h-[300px]">
                {isGenerating ? (
                     <div className="text-center text-slate-400">
                        <SpinnerIcon className="w-12 h-12 animate-spin text-indigo-400" />
                        <p className="mt-2">الذكاء الاصطناعي يطبق لمسته...</p>
                    </div>
                ) : editedImageUrl ? (
                    <div className="w-full h-full relative group">
                        <img src={editedImageUrl} alt={prompt} className="w-full h-full object-contain rounded-lg" />
                         <a href={editedImageUrl} download={`ai_edited_image_${Date.now()}.png`} className="absolute bottom-3 right-3 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowDownTrayIcon className="w-5 h-5" />
                        </a>
                    </div>
                ) : (
                    <div className="text-center text-slate-500">
                        <p>ستظهر الصورة المعدلة هنا.</p>
                    </div>
                )}
            </div>
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
        </div>
    );
};

export default ImageEditor;