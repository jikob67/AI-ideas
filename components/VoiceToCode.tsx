import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Project, View, ProjectType, ProjectFile, Message } from '../types';
import { geminiService } from '../services/geminiService';
import { useUsage } from '../hooks/useUsage';
import { useAuth } from '../hooks/useAuth';
import {
    SparklesIcon, SpinnerIcon, ArrowLeftIcon, CodeIcon, PlusIcon, TrashIcon,
    MicrophoneIcon, StopIcon, UploadIcon, ArrowDownTrayIcon, MagnifyingGlassIcon,
    CheckIcon, CloseIcon, PlayIcon
} from './Icons';
import UpgradeModal from './UpgradeModal';
import { ProjectCard } from './ProjectCard';
import { SoftwareProjectBuilder } from './SoftwareProjectBuilder';

const LoadingScreen: React.FC<{ logs: string[] }> = ({ logs }) => {
    const isFailed = logs.some(log => log.toLowerCase().includes('فشل'));
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in bg-slate-900">
            {isFailed ? <CloseIcon className="w-12 h-12 text-red-400 mb-6"/> : <SpinnerIcon className="w-12 h-12 text-indigo-400 animate-spin mb-6" />}
            <h2 className="text-2xl font-bold text-white">{isFailed ? 'حدث خطأ' : 'جاري معالجة الصوت والبرمجة بذكاء...'}</h2>
            <p className="text-slate-400 mt-2">{isFailed ? 'لم نتمكن من إكمال بناء المشروع.' : 'نقوم الآن بتحويل الوصف الصوتي إلى أكواد وصفحات تفاعلية بالكامل.'}</p>
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

const VoiceToCode: React.FC<{ navigate: (view: View, context?: any) => void; context?: any; }> = ({ navigate, context }) => {
    const { currentUser } = useAuth();
    const { incrementUsage, isLimitReached } = useUsage();

    // --- State ---
    const [screen, setScreen] = useState<'list' | 'generator' | 'editor'>('list');
    const [projects, setProjects] = useState<Project[]>([]);
    const [project, setProject] = useState<Project | null>(null);

    // List View State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const importFileRef = useRef<HTMLInputElement>(null);

    // Generator View State
    const [projectName, setProjectName] = useState('موقع الأوامر الصوتية الذكية');
    const [projectIconUrl, setProjectIconUrl] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [transcription, setTranscription] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const iconInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (screen === 'list' && currentUser?.email) {
            const allProjects: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
            const voiceProjects = allProjects.filter(p => p.creationMode === 'voiceToCode');
            setProjects(voiceProjects);
        }
    }, [screen, currentUser]);

    useEffect(() => {
        if (context?.project) {
            setProject(context.project);
            setScreen('editor');
        }
    }, [context]);

    // Cleanup recording timer
    useEffect(() => {
        return () => {
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        };
    }, []);

    // Timer Logic for recording
    const startTimer = () => {
        setRecordingTime(0);
        recordingIntervalRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Recording Functions
    const handleStartRecording = async () => {
        setError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunksRef.current = [];
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                setUploadedFile(null); // Clear manual uploaded file
                
                // Stop all tracks on the stream to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            startTimer();
        } catch (err) {
            console.error('Microphone permission access failed:', err);
            setError('فشل الوصول إلى الميكروفون. يرجى إعطاء صلاحيات الميكروفون للموقع المحاكي.');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            stopTimer();
        }
    };

    // Manual upload handling
    const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFile(file);
            setAudioBlob(file);
            setAudioUrl(URL.createObjectURL(file));
            setTranscription('');
            setError('');
        }
    };

    const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProjectIconUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Convert Blob to Base64
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                resolve(base64String.split(',')[1] || base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleTranscribeAndBuild = async () => {
        if (!audioBlob && !transcription.trim()) {
            setError('الرجاء تسجيل صوت، أو رفع ملف صوتي، أو كتابة وصف مشروعك البرمجي.');
            return;
        }

        setIsGenerating(true);
        setLogs([]);
        setError('');

        const onLog = (log: string) => setLogs(prev => [...prev, log]);

        try {
            let projectDesc = transcription.trim();

            if (audioBlob) {
                onLog("جاري معالجة الصوت المرفوع...");
                setIsTranscribing(true);
                try {
                    const base64Audio = await blobToBase64(audioBlob);
                    const fileMimeType = audioBlob.type || 'audio/wav';
                    onLog("جاري تفريغ الصوت وتحويله إلى نص...");
                    const speechText = await geminiService.transcribeAudio(base64Audio, fileMimeType);
                    
                    if (speechText) {
                        onLog(`تم استخراج الوصف الصوتي بنجاح: "${speechText}"`);
                        projectDesc = speechText;
                        setTranscription(speechText);
                    } else {
                        onLog("تنبيه: لم يتمكن الذكاء الاصطناعي من قراءة الصوت، سنعتمد على الوصف اليدوي في حال وجوده.");
                    }
                } catch (err) {
                    onLog("فشل التفريغ التلقائي للملف، جاري الاعتماد على الوصف الاحتياطي...");
                } finally {
                    setIsTranscribing(false);
                }
            }

            if (!projectDesc) {
                throw new Error("لم نتمكن من الحصول على تفريغ صوتي، يرجى ملء الوصف بصوت أكثر وضوحاً.");
            }

            onLog("بدء هندسة وبناء التطبيق...");
            const finalPrompt = `
            Build a highly professional, interactive and fully functional web application using HTML and Tailwind CSS based on the following voice command or instruction:
            
            **Voice/Prompt Transcript:**
            "${projectDesc}"
            
            **Requirements:**
            1. **Layout & UI:** Create a modern design using elegant layout patterns, customized fonts and icons.
            2. **Interactivity:**
               - Provide a complete JS file ('script.js') with logical click handlers and form operations.
               - Ensure beautiful UI interactions (like button animations, alerts on click, functional calculations if described).
            3. **Connectivity:** Connect index.html, style.css and script.js cleanly.
            
            **Project Name:** ${projectName}
            `;

            const newProject = await geminiService.buildProjectFromSpec({
                projectName,
                prompt: finalPrompt,
                projectType: ProjectType.WEBSITE,
                files: [],
                iconUrl: projectIconUrl
            }, onLog);

            newProject.creationMode = 'voiceToCode';
            newProject.id = `voice-${Date.now()}`;

            if (currentUser?.email) {
                const key = `appProjects_${currentUser.email}`;
                const savedApps: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
                savedApps.unshift(newProject);
                localStorage.setItem(key, JSON.stringify(savedApps));
            }

            incrementUsage(ProjectType.DRAW_TO_CODE);

            setProject(newProject);
            setScreen('editor');

        } catch (err: any) {
            setError(err.message || 'فشلت معالجة الصوت والتحويل إلى كود. يرجى المحاولة بصوت أوضح.');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteProject = (appId: string) => {
        if (currentUser?.email && window.confirm('هل تريد حذف هذا المشروع بشكل دائم؟')) {
            const allProjects: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
            const updatedProjects = allProjects.filter(p => p.id !== appId);
            localStorage.setItem(`appProjects_${currentUser.email}`, JSON.stringify(updatedProjects));
            setProjects(updatedProjects.filter(p => p.creationMode === 'voiceToCode'));
        }
    };

    const handleCreateNew = () => {
        setProjectName('مشروع صوتي جديد - ' + new Date().toLocaleDateString('ar-EG'));
        setProjectIconUrl(null);
        setAudioBlob(null);
        setAudioUrl(null);
        setUploadedFile(null);
        setTranscription('');
        setError('');
        setScreen('generator');
    };

    // Clean search filters
    const filteredProjects = useMemo(() => {
        return projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [projects, searchQuery]);

    const renderListView = () => (
        <div className="p-4 md:p-8 h-full flex flex-col animate-fade-in text-right" dir="rtl">
            <header className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-105 flex items-center gap-2">
                        <MicrophoneIcon className="w-6 h-6 text-rose-400" />
                        صوت إلى كود
                    </h2>
                    <p className="text-slate-400">({projects.length}) مشاريع مبنية بالصوت</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleCreateNew} className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-rose-600/10">
                        <PlusIcon className="w-5 h-5"/>
                        توليد بالصوت جديد
                    </button>
                </div>
            </header>

            <div className="relative mb-6">
                <input type="search" placeholder="ابحث في مشاريعك الصوتية..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-4 pr-10 text-white focus:outline-none focus:border-rose-500" />
                <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {filteredProjects.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/30 py-16">
                    <MicrophoneIcon className="w-16 h-16 mb-4 text-slate-600"/>
                    <h3 className="text-lg font-semibold text-slate-300">لا توجد مشاريع صوتية حالياً</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-md text-center">انقر على "توليد بالصوت جديد" لبدء تسجيل صوتك ووصف المشروع، وسيقوم الذكاء الاصطناعي ببناء الأكواد مباشرة.</p>
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
        <div className="p-4 md:p-8 h-full max-w-4xl mx-auto flex flex-col justify-between animate-fade-in text-right" dir="rtl">
            <div>
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => setScreen('list')} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white">
                        <ArrowLeftIcon className="w-5 h-5 transform rotate-180"/>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white">توليد الأكواد بالأوامر الصوتية</h2>
                        <p className="text-sm text-slate-400">صف فكرتك أو واجهة تطبيقك باللغة العربية وسنتولى كتابة الأكواد بالكامل</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Project Name & Icon Row */}
                    <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">اسم المشروع المعرف:</label>
                            <input 
                                type="text"
                                value={projectName}
                                onChange={e => setProjectName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-rose-500 text-right"
                            />
                        </div>

                        {/* Project Icon Selector */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">أيقونة المشروع (اختياري):</label>
                            <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 bg-slate-750 rounded-lg flex items-center justify-center cursor-pointer border border-slate-650 overflow-hidden">
                                    {projectIconUrl ? (
                                        <img src={projectIconUrl} alt="Icon" className="w-full h-full object-cover" />
                                    ) : (
                                        <UploadIcon className="w-5 h-5 text-slate-450" />
                                    )}
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleIconUpload} />
                                </div>
                                <span className="text-xs text-slate-400">ستعرض هذه الأيقونة في ترويسة التطبيق وفي المعاينة الحية.</span>
                            </div>
                        </div>
                    </div>

                    {/* Microphone Section with Ripples */}
                    <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center py-10 space-y-5 text-center relative overflow-hidden">
                        <h3 className="text-lg font-bold text-slate-100">تسجيل وصف تفاعلي بالصوت</h3>
                        <p className="text-sm text-slate-400 max-w-md">تحدث بوضوح واشرح ما يجب أن يحتوي عليه مشروعك بحدود 1-2 دقيقة</p>

                        <div className="relative flex items-center justify-center my-4">
                            {isRecording && (
                                <div className="absolute w-24 h-24 bg-rose-500/20 rounded-full animate-ping pointer-events-none" />
                            )}
                            {isRecording && (
                                <div className="absolute w-20 h-20 bg-rose-500/40 rounded-full animate-pulse pointer-events-none" />
                            )}
                            <button
                                onClick={isRecording ? handleStopRecording : handleStartRecording}
                                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all z-10 shadow-lg ${isRecording ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 hover:scale-105'}`}
                            >
                                {isRecording ? <StopIcon className="w-7 h-7" /> : <MicrophoneIcon className="w-7 h-7" />}
                            </button>
                        </div>

                        {isRecording ? (
                            <div className="text-rose-400 font-mono text-lg font-bold">
                                جاري التسجيل: {formatTime(recordingTime)}
                            </div>
                        ) : audioUrl ? (
                            <div className="flex flex-col items-center gap-3 w-full max-w-md">
                                <audio src={audioUrl} controls className="w-full" />
                                <span className="text-xs text-green-400 border border-green-500/20 bg-green-500/5 px-3 py-1 rounded-full flex items-center gap-1">
                                    <CheckIcon className="w-3.5 h-3.5"/>
                                    تم تسجيل/رفع الصوت وجاهز للبرمجة
                                </span>
                            </div>
                        ) : (
                            <div className="text-slate-450 font-semibold text-sm">مستعد للبدء.. انقر للتسجيل</div>
                        )}

                        {/* File Upload as backup */}
                        <div className="pt-4 border-t border-slate-700/50 w-full flex items-center justify-center gap-2">
                            <span className="text-xs text-slate-400">أو يمكنك</span>
                            <button onClick={() => fileInputRef.current?.click()} className="text-xs text-rose-400 hover:underline flex items-center gap-1 font-semibold">
                                <UploadIcon className="w-3.5 h-3.5"/>
                                رفع ملف صوتي (.wav, .mp3, .m4a)
                            </button>
                            <input type="file" accept="audio/*" ref={fileInputRef} className="hidden" onChange={handleAudioFileUpload} />
                        </div>
                    </div>

                    {/* Additional Details fallback input */}
                    <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
                        <label className="block text-sm font-semibold text-slate-300 mb-2">النص المفرغ أو وصف إضافي (اختياري لو تود التعديل عليه):</label>
                        <textarea
                            value={transcription}
                            onChange={e => setTranscription(e.target.value)}
                            placeholder="يمكنك كتابة تفاصيل مشروعك هنا لو تحب كمدخل بديل أو تعديل تفريغ الصوت..."
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-rose-500 text-right text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Error & Next Actions */}
            <div className="mt-8 space-y-4">
                {error && <p className="text-red-400 text-sm font-semibold text-center">{error}</p>}
                <button
                    onClick={handleTranscribeAndBuild}
                    disabled={isGenerating || (!audioBlob && !transcription.trim())}
                    className="w-full py-3 bg-gradient-to-l from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-50"
                >
                    {isGenerating ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                    <span>{isGenerating ? 'جاري البرمجة واستخلاص الأكواد...' : 'إنشاء الأكواد البرمجية الآن'}</span>
                </button>
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
                    context={{ project: project }}
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

export default VoiceToCode;
