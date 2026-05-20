
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { Project, ProjectType, SectionType, View } from '../types';
import { SparklesIcon, SpinnerIcon, UploadIcon, PhotoIcon, PaintBrushIcon, SaveIcon, ArrowDownTrayIcon, TrashIcon, CodeIcon, Share2Icon, PlusIcon, ArrowLeftIcon, BriefcaseIcon, FilmIcon } from './Icons';
import { useUsage } from '../hooks/useUsage';
import UpgradeModal from './UpgradeModal';
// FIX: Changed to named import as ProjectCard does not have a default export.
import { ProjectCard } from './ProjectCard';
import { useAuth } from '../hooks/useAuth';

interface ArtConverterProps {
    navigate: (view: View, context?: any) => void;
}

const presetStyles = [
    { name: 'لوحة زيتية', prompt: 'An oil painting with thick, textured brushstrokes, in the style of impressionism.', icon: '🎨' },
    { name: 'ألوان مائية', prompt: 'A soft watercolor painting with bleeding colors and a dreamy atmosphere.', icon: '💧' },
    { name: 'فن البكسل', prompt: '8-bit pixel art, retro video game style, vibrant color palette.', icon: '👾' },
    { name: 'سايبربانك', prompt: 'A futuristic cyberpunk city scene with glowing neon lights, rain, and high-tech details.', icon: '🌃' },
    { name: 'أنمي', prompt: 'Vibrant and detailed Japanese anime style, cinematic lighting.', icon: '🌸' },
    { name: 'رسم كرتوني', prompt: 'A bold, colorful 2D cartoon illustration style with thick outlines.', icon: '✏️' },
    { name: 'نموذج ثلاثي الأبعاد', prompt: 'A polished 3D model render, smooth surfaces, cinematic lighting, trending on ArtStation.', icon: '🧊' },
    { name: 'فن تجريدي', prompt: 'An abstract expressionist painting with chaotic energy and bold colors.', icon: '🌀' },
];

const completionPresets = [
    { name: 'إكمال واقعي', prompt: 'Complete with realistic details, professional lighting, and high-quality textures.', icon: '✨' },
    { name: 'إضافة خلفية', prompt: 'Add a beautiful, detailed background that matches the subject.', icon: '🏞️' },
    { name: 'تلوين احترافي', prompt: 'Colorize the sketch with a professional and vibrant color palette.', icon: '🎨' },
    { name: 'تحويل لتحفة', prompt: 'Transform this sketch into a finished masterpiece with intricate details.', icon: '🏆' },
    { name: 'نمط خيالي', prompt: 'Complete with a magical, fantasy atmosphere and glowing effects.', icon: '🪄' },
    { name: 'رسم رقمي', prompt: 'Finish as a clean, modern digital illustration.', icon: '💻' },
];


const ArtConverter: React.FC<ArtConverterProps> = ({ navigate }) => {
    const [screen, setScreen] = useState<'gallery' | 'generator'>('gallery');
    const [mode, setMode] = useState<'style' | 'completion'>('style');
    const [projects, setProjects] = useState<Project[]>([]);
    const [baseImage, setBaseImage] = useState<{file: File, url: string} | null>(null);
    const [styleImage, setStyleImage] = useState<{file: File, url: string} | null>(null);
    const [styleText, setStyleText] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [error, setError] = useState('');
    const { isLimitReached, incrementUsage } = useUsage();
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [styleMode, setStyleMode] = useState<'text' | 'image'>('text');
    const { currentUser, updateUser } = useAuth();
    const [isGeneratingFormula, setIsGeneratingFormula] = useState<string | null>(null);

    // ... (Effect and Handlers remain same as original file, simplified here for brevity) ...
    useEffect(() => {
        if (screen === 'gallery' && currentUser?.email) {
            const allProjects: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
            const artProjects = allProjects.filter(p => p.creationMode === 'artConverter');
            setProjects(artProjects);
        }
    }, [screen, currentUser]);

    const handleFileChange = (type: 'base' | 'style') => (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const fileData = { file, url: URL.createObjectURL(file) };
            if (type === 'base') setBaseImage(fileData);
            else setStyleImage(fileData);
            setError('');
        }
    };

    const handleConvert = async () => {
        if (!baseImage) {
            setError('الرجاء رفع صورة أساسية.');
            return;
        }
        
        if (mode === 'style') {
            if (styleMode === 'text' && !styleText.trim()) {
                setError('الرجاء إدخال وصف للنمط.');
                return;
            }
            if (styleMode === 'image' && !styleImage) {
                setError('الرجاء رفع صورة للنمط.');
                return;
            }
        }

        if (isLimitReached(ProjectType.DRAW_TO_DIGITAL)) {
            setUpgradeModalOpen(true);
            return;
        }

        setIsGenerating(true);
        setResultImage(null);
        setError('');

        const fileToB64 = (file: File) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });

        try {
            const base64Data = await fileToB64(baseImage.file);
            
            let resultBase64 = '';
            if (mode === 'style') {
                let style: string | { imageBase64: string } = styleText;
                if (styleMode === 'image' && styleImage) {
                    const styleBase64 = await fileToB64(styleImage.file);
                    style = { imageBase64: styleBase64 };
                }
                resultBase64 = await geminiService.convertArt(base64Data, style);
            } else {
                resultBase64 = await geminiService.completeArt(base64Data, styleText || 'Complete this drawing beautifully.');
            }

            setResultImage(`data:image/png;base64,${resultBase64}`);
            incrementUsage(ProjectType.DRAW_TO_DIGITAL);

        } catch (e) {
            console.error(e);
            setError(`فشل العملية: ${e instanceof Error ? e.message : 'فشل في قراءة الملف أو إنشاء الصورة.'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateFormula = async (stylePresetName: string, stylePresetPrompt: string) => {
        if (!baseImage) {
            setError('الرجاء رفع الصورة الأساسية أو الرسمة أولاً ليقوم الذكاء الاصطناعي بتحليلها وتوليد الصيغة المناسبة.');
            return;
        }

        setIsGeneratingFormula(stylePresetName);
        setError('');

        const fileToB64 = (file: File) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });

        try {
            const base64Data = await fileToB64(baseImage.file);
            const isStyleMode = mode === 'style';
            
            const prompt = isStyleMode 
                ? `قم بتحليل الصورة أو الرسمة المرفقة وموضوعها، واكتب صيغة ووصفاً تحويلياً دقيقاً واحترافياً باللغة العربية (والإنجليزية المرفقة كمصطلحات دقيقة) لتحويل هذه الرسمة/الصورة بالكامل إلى أسلوب "${stylePresetName}" (${stylePresetPrompt}). 
                   صف كيف سيتم تحوير الخطوط الأصلية، وتوزيع الألوان والخلفية بطريقة مخصصة تناسب تفاصيل وموضوع عناصر صورتي بدقة وبراعة فنية.
                   أرجع فقط النص النهائي المباشر للوصف الفني (الصيغة التحويلية) مخصصاً لإرساله كمدخل لنموذج توليد وتعديل الصور وبدون أي مقدمات أو شروحات جانبية وبدون تحيات.`
                : `قم بتحليل السكتش أو الرسمة غير المكتملة المرفقة وموضوعها الأساسي، واكتب صيغة ووصفاً تفصيلياً واحترافياً باللغة العربية لإكمال هذه الرسمة وتلوينها وإعدادها كتحفة فنية متكاملة بأسلوب "${stylePresetName}".
                   قم بوصف العناصر الإضافية المناسبة، الخلفية، والظلال والإضاءة بطريقة ذكية تجتاز خصائص وخطوط وتفاصيل السكتش الخاص بي بدقة.
                   أرجع فقط النص النهائي المباشر للوصف الفني (الصيغة التحويلية) دون أي ترحيب أو مقدمات.`;

            const generatedPrompt = await geminiService.analyzeImage(base64Data, baseImage.file.type, prompt);
            setStyleText(generatedPrompt.trim());
            setStyleMode('text');
        } catch (e) {
            console.error(e);
            setError(`فشل توليد الصيغة التلقائية لأسلوب ${stylePresetName}: ${e instanceof Error ? e.message : 'حدث خطأ.'}`);
        } finally {
            setIsGeneratingFormula(null);
        }
    };
    
    const handleSaveAsProject = () => {
        if (!resultImage || !currentUser?.email) return;
        const projectName = prompt('الرجاء إدخال اسم للمشروع الجديد:', `${mode === 'style' ? 'لوحة فنية' : 'إكمال رسمة'} - ${styleText || 'نمط مخصص'}`);
        if (projectName) {
            const newProject: any = {
                id: `proj-art-${Date.now()}`,
                name: projectName,
                description: `مشروع تم إنشاؤه من محول الفنون (${mode === 'style' ? 'تحويل نمط' : 'إكمال رسم'}). الإرشادات: ${styleText || 'تلقائي'}.`,
                type: ProjectType.DIGITAL_DRAWING,
                creationMode: 'artConverter',
                files: [],
                sections: [
                    {
                        id: `sec-html-${Date.now()}`,
                        type: SectionType.HTML,
                        title: 'اللوحة الفنية',
                        config: {
                            htmlContent: `
    <style>
        body { margin: 0; background: #111827; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; color: #f3f4f6; font-family: sans-serif; text-align: center; padding: 1rem; }
        img { max-width: 90%; max-height: 80%; object-fit: contain; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        h1 { margin-top: 1.5rem; color: #e5e7eb; }
    </style>
    <img src="${resultImage}" alt="${projectName}" />
    <h1>${projectName}</h1>
                            `
                        }
                    }
                ],
                timestamp: Date.now(),
                isPublished: false,
                isShared: false,
            };
    
            const savedApps: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]' );
            const updatedApps = [newProject, ...savedApps];
            localStorage.setItem(`appProjects_${currentUser.email}`, JSON.stringify(updatedApps));
            setScreen('gallery');
        }
    };
    
    const handleDownload = () => {
        if (!resultImage) return;
        const a = document.createElement('a');
        a.href = resultImage;
        a.download = `ai-art-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleShare = async () => {
        if (!resultImage || !navigator.share) {
            alert('متصفحك لا يدعم ميزة المشاركة أو لا توجد صورة لمشاركتها.');
            return;
        }
        try {
            const response = await fetch(resultImage);
            const blob = await response.blob();
            const file = new File([blob], 'ai-art.png', { type: blob.type });

            await navigator.share({
                files: [file],
                title: 'عمل فني تم إنشاؤه بواسطة AI ideas',
                text: 'تحقق من هذه الصورة التي تم إنشاؤها بواسطة الذكاء الاصطناعي!',
            });
            if (currentUser) {
                updateUser({ points: (currentUser.points || 0) + 5 });
            }
        } catch (err: any) {
            if (err && err.name === 'AbortError') {
                // User cancelled, do nothing
            } else {
                console.error('Share failed:', err);
                alert('فشلت المشاركة. يمكنك محاولة تنزيل الصورة ومشاركتها يدويًا.');
            }
        }
    };

    const handleConvertToProject = () => {
        if (resultImage) {
            navigate('screenToCode', { 
                prefillImage: { 
                    base64: resultImage.split(',')[1], 
                    mimeType: 'image/png', 
                    name: 'art_conversion.png',
                    url: resultImage,
                }
            });
        }
    };
    
    const handleUseInMarketing = () => {
        if (resultImage) {
            navigate('marketing', { 
                prefillImage: { 
                    dataUrl: resultImage,
                }
            });
        }
    };

    const handleClear = () => {
        setBaseImage(null);
        setStyleImage(null);
        setStyleText('');
        setResultImage(null);
        setError('');
    };
    
    const handleDeleteProject = (appId: string) => {
        if (currentUser?.email) {
            const allProjects: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
            const appToDelete = allProjects.find(p => p.id === appId);
            if (!appToDelete) return;

            const deletedApps = JSON.parse(localStorage.getItem(`deletedProjects_${currentUser.email}`) || '[]');
            localStorage.setItem(`deletedProjects_${currentUser.email}`, JSON.stringify([appToDelete, ...deletedApps]));
            
            const updatedProjects = allProjects.filter(p => p.id !== appId);
            localStorage.setItem(`appProjects_${currentUser.email}`, JSON.stringify(updatedProjects));
            setProjects(updatedProjects.filter(p => p.creationMode === 'artConverter'));
        }
    };

    if (screen === 'gallery') {
        return (
            <div className="p-4 h-full flex flex-col animate-fade-in space-y-6">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">معرضي الفني</h1>
                        <p className="text-slate-400">({projects.length}) أعمال فنية</p>
                    </div>
                    <button onClick={() => setScreen('generator')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><PlusIcon className="w-5 h-5"/> عمل فني جديد</button>
                </header>
                {projects.length === 0 ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-500">
                        <PaintBrushIcon className="w-16 h-16 mb-4"/>
                        <h3 className="text-lg font-semibold">لا توجد أعمال فنية بعد</h3>
                        <p>انقر على "عمل فني جديد" لبدء تحويل صورك.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                        {projects.map(p => (
                            <ProjectCard 
                                key={p.id}
                                project={p}
                                onDelete={handleDeleteProject}
                                onEdit={(proj) => navigate('editApp', { project: proj })}
                            />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white animate-fade-in">
             <header className="flex-shrink-0 p-3 border-b border-slate-700 flex items-center gap-3">
                 <button onClick={() => setScreen('gallery')} className="p-2 rounded-full hover:bg-slate-700"><ArrowLeftIcon className="w-5 h-5"/></button>
                 <h1 className="text-xl font-bold text-white">إنشاء عمل فني جديد</h1>
             </header>

            <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                <aside className="w-full md:w-[400px] flex-shrink-0 bg-slate-800/50 border-b md:border-r md:border-b-0 border-slate-700 p-4 flex flex-col gap-4 overflow-y-auto">
                    {/* Mode Selector */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">اختر الوضع</h3>
                        <div className="flex bg-slate-700 p-1 rounded-xl">
                            <button 
                                onClick={() => { setMode('style'); setStyleText(''); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'style' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                <SparklesIcon className="w-4 h-4" />
                                تحويل النمط
                            </button>
                            <button 
                                onClick={() => { setMode('completion'); setStyleText(''); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'completion' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                <PaintBrushIcon className="w-4 h-4" />
                                إكمال الرسم
                            </button>
                        </div>
                    </div>

                    {/* Base Image */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{mode === 'style' ? '1. الصورة الأساسية' : '1. الرسمة غير المكتملة'}</h3>
                        <label htmlFor="base-image-upload" className="cursor-pointer block border-2 border-dashed border-slate-600 rounded-xl p-4 text-center hover:border-indigo-500 h-40 flex items-center justify-center transition-colors bg-slate-800/30">
                            {baseImage ? <img src={baseImage.url} alt="Base" className="max-h-full max-w-full object-contain rounded-lg" /> : <div className="text-slate-500"><UploadIcon className="w-8 h-8 mx-auto mb-2" /><span>{mode === 'style' ? 'ارفع الصورة الأصلية' : 'ارفع السكتش أو الرسمة'}</span></div>}
                        </label>
                        <input id="base-image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange('base')} />
                    </div>

                    {/* Style / Completion Options */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{mode === 'style' ? '2. النمط الفني' : '2. خيارات الإكمال'}</h3>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-slate-400">الاقتراحات السريعة والتوليد الذكي</h4>
                                {baseImage && (
                                    <span className="text-[10px] text-indigo-400 animate-pulse flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                        ● يحلل فنك الحالي
                                    </span>
                                )}
                            </div>

                            {/* زر التوليد الذكي بحسب فن ورسمة المستخدم */}
                            <button
                                type="button"
                                onClick={() => handleGenerateFormula('صيغة فنية مخصصة بحسب رسمي', 'الأسلوب الأنسب للرسمة')}
                                disabled={isGeneratingFormula !== null || !baseImage}
                                className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 border transition-all ${
                                    baseImage 
                                        ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-indigo-400 text-white shadow-lg cursor-pointer transform hover:-translate-y-0.5' 
                                        : 'bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed'
                                }`}
                            >
                                {isGeneratingFormula === 'صيغة فنية مخصصة بحسب رسمي' ? (
                                    <SpinnerIcon className="w-4 h-4 animate-spin text-white" />
                                ) : (
                                    <SparklesIcon className="w-4 h-4 text-amber-300 animate-pulse" />
                                )}
                                <span className="text-xs font-bold font-sans">
                                    {isGeneratingFormula === 'صيغة فنية مخصصة بحسب رسمي' ? 'جاري تحليل العمل الفني وتوليد الصيغة...' : '✨ توليد الصيغة التحويلية المناسبة لرسوم وفنون المستخدم ذكياً'}
                                </span>
                            </button>
                            
                            {!baseImage && (
                                <p className="text-[11px] text-slate-500 text-center">
                                    💡 ارفع صورة أو رسمة أولاً لتفعيل زر التوليد الذكي للجماليات الفنية المناسبة لها تلقائياً.
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {(mode === 'style' ? presetStyles : completionPresets).map(style => {
                                    const isCurrentPending = isGeneratingFormula === style.name;
                                    return (
                                        <button 
                                            key={style.name} 
                                            type="button"
                                            onClick={() => {
                                                if (baseImage) {
                                                    handleGenerateFormula(style.name, style.prompt);
                                                } else {
                                                    setStyleText(style.prompt);
                                                    setStyleMode('text');
                                                }
                                            }} 
                                            disabled={isGeneratingFormula !== null}
                                            className={`relative overflow-hidden flex items-center gap-2 p-2 rounded-xl border text-right transition-all cursor-pointer ${
                                                styleText === style.prompt || (styleText && styleText.includes(style.name))
                                                    ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                                                    : 'bg-slate-700/40 border-slate-700/60 hover:bg-slate-700/80 text-slate-300'
                                            }`}
                                            title={style.name}
                                        >
                                            <span className="text-lg bg-slate-800/80 p-1.5 rounded-lg flex-shrink-0">{style.icon}</span>
                                            <div className="flex flex-col text-right w-full min-w-0">
                                                <span className="text-[11px] font-bold truncate">{style.name}</span>
                                                <span className="text-[9px] text-slate-500 truncate">
                                                    {isCurrentPending ? 'جاري الصياغة...' : (baseImage ? 'تحليل وصياغة ذكية' : 'صيغة جاهزة')}
                                                </span>
                                            </div>
                                            {isCurrentPending && (
                                                <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                                                    <SpinnerIcon className="w-4 h-4 animate-spin text-indigo-400" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {mode === 'style' && (
                            <div className="flex bg-slate-700 p-1 rounded-xl">
                                <button onClick={() => setStyleMode('text')} className={`flex-1 text-xs py-2 rounded-lg transition-all ${styleMode==='text' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>وصف نصي</button>
                                <button onClick={() => setStyleMode('image')} className={`flex-1 text-xs py-2 rounded-lg transition-all ${styleMode==='image' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>صورة مرجعية</button>
                            </div>
                        )}

                        {mode === 'style' && styleMode === 'image' ? (
                            <label htmlFor="style-image-upload" className="cursor-pointer block border-2 border-dashed border-slate-600 rounded-xl p-4 text-center hover:border-indigo-500 h-24 flex items-center justify-center transition-colors bg-slate-800/30">
                                {styleImage ? <img src={styleImage.url} alt="Style" className="max-h-full max-w-full object-contain rounded-lg" /> : <div className="text-slate-500 text-xs"><PhotoIcon className="w-6 h-6 mx-auto mb-1" /><span>ارفع صورة النمط</span></div>}
                            </label>
                        ) : (
                            <textarea 
                                value={styleText} 
                                onChange={e => setStyleText(e.target.value)} 
                                rows={3} 
                                className="w-full bg-slate-700/50 border border-slate-600 p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                                placeholder={mode === 'style' ? "مثال: لوحة زيتية بأسلوب فان جوخ..." : "صف كيف تريد إكمال الرسمة (مثال: أضف خلفية غابة سحرية وتفاصيل واقعية)..."}
                            />
                        )}
                        <input id="style-image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange('style')} />
                    </div>
                    
                    {/* Action */}
                    <div className="mt-auto space-y-3 pt-4 border-t border-slate-700">
                        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs p-3 rounded-lg text-center">{error}</div>}
                        <button 
                            onClick={handleConvert} 
                            disabled={isGenerating || !baseImage} 
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 disabled:bg-slate-700 disabled:text-slate-500 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            {isGenerating ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                            {isGenerating ? 'جاري المعالجة...' : (mode === 'style' ? 'تحويل النمط' : 'إكمال الرسمة')}
                        </button>
                    </div>
                </aside>

                <main className="flex-grow flex flex-col items-center justify-center bg-slate-900 p-6 relative">
                     {isGenerating ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <SpinnerIcon className="w-16 h-16 animate-spin text-indigo-500"/>
                                <SparklesIcon className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-300 animate-pulse"/>
                            </div>
                            <p className="text-indigo-300 font-medium animate-pulse">يقوم الذكاء الاصطناعي بإبداع عملك الفني...</p>
                        </div>
                     ) : resultImage ? (
                        <div className="w-full h-full flex flex-col gap-6 items-center animate-fade-in">
                            <div className="flex-grow w-full relative group bg-slate-800/20 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                                <img src={resultImage} alt="Result" className="w-full h-full object-contain" />
                                {currentUser?.plan === 'free' && <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-white/70 border border-white/10">⚡ AI ideas</div>}
                            </div>
                            <div className="flex-shrink-0 flex flex-wrap justify-center gap-3 p-4 bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-xl">
                                <button onClick={handleDownload} className="flex items-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 px-4 py-2.5 rounded-xl transition-all"><ArrowDownTrayIcon className="w-4 h-4"/>تنزيل</button>
                                <button onClick={handleShare} className="flex items-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 px-4 py-2.5 rounded-xl transition-all"><Share2Icon className="w-4 h-4"/>مشاركة</button>
                                <button onClick={handleSaveAsProject} className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-500 px-4 py-2.5 rounded-xl transition-all"><SaveIcon className="w-4 h-4"/>حفظ</button>
                                <button onClick={handleConvertToProject} className="flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-500 px-4 py-2.5 rounded-xl transition-all"><CodeIcon className="w-4 h-4"/>تحويل لكود</button>
                                <button onClick={handleUseInMarketing} className="flex items-center gap-2 text-sm bg-rose-600 hover:bg-rose-500 px-4 py-2.5 rounded-xl transition-all"><FilmIcon className="w-4 h-4"/>تسويق</button>
                                <button onClick={handleClear} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all" title="مسح"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                     ) : (
                        <div className="text-center space-y-4">
                            <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto border border-slate-700">
                                <PhotoIcon className="w-12 h-12 text-slate-600" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-slate-300">جاهز للإبداع؟</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto">ارفع صورتك واختر النمط أو وضع الإكمال لترى سحر الذكاء الاصطناعي</p>
                            </div>
                        </div>
                     )}
                </main>
            </div>
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
        </div>
    );
};

export default ArtConverter;
