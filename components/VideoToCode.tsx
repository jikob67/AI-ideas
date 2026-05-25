import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Project, View, ProjectType, ProjectFile, Message } from '../types';
import { geminiService } from '../services/geminiService';
import { useUsage } from '../hooks/useUsage';
import { useAuth } from '../hooks/useAuth';
import {
    SparklesIcon, SpinnerIcon, ArrowLeftIcon, CodeIcon, PlusIcon, TrashIcon,
    VideoIcon, StopIcon, UploadIcon, ArrowDownTrayIcon, MagnifyingGlassIcon,
    CheckIcon, CloseIcon, CameraIcon
} from './Icons';
import UpgradeModal from './UpgradeModal';
import { ProjectCard } from './ProjectCard';
import { SoftwareProjectBuilder } from './SoftwareProjectBuilder';

const LoadingScreen: React.FC<{ logs: string[] }> = ({ logs }) => {
    const isFailed = logs.some(log => log.toLowerCase().includes('فشل'));
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in bg-slate-900">
            {isFailed ? <CloseIcon className="w-12 h-12 text-red-400 mb-6"/> : <SpinnerIcon className="w-12 h-12 text-indigo-400 animate-spin mb-6" />}
            <h2 className="text-2xl font-bold text-white">{isFailed ? 'حدث خطأ' : 'جاري تحليل لقطات الفيديو وتصميم الأكواد...'}</h2>
            <p className="text-slate-400 mt-2">{isFailed ? 'لم نتمكن من إكمال بناء المشروع.' : 'نقوم الآن بسحب لقطات التصميم الإطارية وبناء ملفات التطبيق التفاعلي.'}</p>
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

const VideoToCode: React.FC<{ navigate: (view: View, context?: any) => void; context?: any; }> = ({ navigate, context }) => {
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
    const [projectName, setProjectName] = useState('موقع تحليل واجهات الفيديو الذكي');
    const [projectIconUrl, setProjectIconUrl] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const videoChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const webcamStreamRef = useRef<MediaStream | null>(null);
    const webcamVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (screen === 'list' && currentUser?.email) {
            const allProjects: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
            const videoProjects = allProjects.filter(p => p.creationMode === 'videoToCode');
            setProjects(videoProjects);
        }
    }, [screen, currentUser]);

    useEffect(() => {
        if (context?.project) {
            setProject(context.project);
            setScreen('editor');
        }
    }, [context]);

    // Timer logic
    const startTimer = () => {
        setRecordingTime(0);
        recordingIntervalRef.current = setInterval(() => {
            setRecordingTime(prev => {
                // Auto stop recording at 30 seconds max duration
                if (prev >= 30) {
                    handleStopRecording();
                    return 30;
                }
                return prev + 1;
            });
        }, 1000);
    };

    const stopTimer = () => {
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
        }
    };

    const formatTime = (seconds: number) => {
        return `00:${seconds.toString().padStart(2, '0')}`;
    };

    // Recording functions
    const handleStartRecording = async () => {
        setError('');
        setVideoBlob(null);
        setVideoUrl(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            webcamStreamRef.current = stream;
            videoChunksRef.current = [];

            // Show webcam preview
            if (webcamVideoRef.current) {
                webcamVideoRef.current.srcObject = stream;
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    videoChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
                
                // Enforce 10 second minimum for recorded video
                if (recordingTime < 10) {
                    setError('عذراً، مدة الفيديو المسجل قصيرة جداً! يجب تسجيل 10 ثوانٍ كحد أدنى.');
                    setVideoBlob(null);
                    setVideoUrl(null);
                } else {
                    setVideoBlob(blob);
                    setVideoUrl(URL.createObjectURL(blob));
                }

                setUploadedFile(null); // Clear manual uploaded file
                
                // Stop webcam preview and stream tracks
                if (webcamVideoRef.current) {
                    webcamVideoRef.current.srcObject = null;
                }
                stream.getTracks().forEach(track => track.stop());
                webcamStreamRef.current = null;
            };

            mediaRecorder.start();
            setIsRecording(true);
            startTimer();
        } catch (err) {
            console.error('Webcam permission access failed:', err);
            setError('فشل الوصول إلى الكاميرا. يرجى إعطاء صلاحيات الكاميرا والميكروفون.');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            stopTimer();
        }
    };

    // Video manual file upload and validation
    const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError('');
        
        // Setup a temporary video element to validate the duration
        const tempVideo = document.createElement('video');
        tempVideo.preload = 'metadata';
        
        tempVideo.onloadedmetadata = () => {
            window.URL.revokeObjectURL(tempVideo.src);
            const duration = tempVideo.duration;
            
            // Limit checks: Min 10s, Max 30s
            if (duration < 10 || duration > 30) {
                setError(`خطأ في مدة الفيديو: يجب أن يكون طول الفيديو بين 10 ثوانٍ كحد أدنى و 30 ثانية كحد أقصى. (مدة الملف الحالي: ${Math.round(duration)} ثانية)`);
                setUploadedFile(null);
                setVideoBlob(null);
                setVideoUrl(null);
            } else {
                setUploadedFile(file);
                setVideoBlob(file);
                setVideoUrl(URL.createObjectURL(file));
                setError('');
            }
        };

        tempVideo.src = URL.createObjectURL(file);
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

    // Frame Extraction on Frontend using Canvas
    const extractFrames = (blob: Blob): Promise<{ base64: string; mimeType: string }[]> => {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(blob);
            const video = document.createElement('video');
            video.src = url;
            video.crossOrigin = 'anonymous';
            video.preload = 'auto';

            const frames: { base64: string; mimeType: string }[] = [];
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            video.onloadeddata = async () => {
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 360;
                
                const duration = video.duration || 15;
                // Capture at 10%, 50%, and 90%
                const timesToCapture = [duration * 0.1, duration * 0.5, duration * 0.9];

                for (let i = 0; i < timesToCapture.length; i++) {
                    video.currentTime = timesToCapture[i];
                    await new Promise((res) => {
                        video.onseeked = () => {
                            if (ctx) {
                                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                                frames.push({
                                    base64: dataUrl.split(',')[1],
                                    mimeType: 'image/jpeg'
                                });
                            }
                            res(null);
                        };
                    });
                }

                URL.revokeObjectURL(url);
                resolve(frames);
            };

            video.onerror = () => {
                URL.revokeObjectURL(url);
                resolve([]); // return empty if extraction fails
            };
        });
    };

    const handleAnalyzeAndBuild = async () => {
        if (!videoBlob) {
            setError('الرجاء تسجيل فيديو، أو رفع ملف فيديو من جهازك (10 إلى 30 ثانية).');
            return;
        }

        setIsGenerating(true);
        setLogs([]);
        setError('');

        const onLog = (log: string) => setLogs(prev => [...prev, log]);

        try {
            onLog("تحضير وبدء استخلاص المقاطع البصرية...");
            const mediaFrames = await extractFrames(videoBlob);
            onLog(`تم استخلاص عدد (${mediaFrames.length}) لقطات إطارية بنجاح للواجهة.`);

            onLog("تحليل هندسة الواجهات التفاعلية والحركات...");
            
            const finalPrompt = `
            Analyze the following sequence of frames containing user interface screens and flow mockups extracted from a brief product demo video.
            Recreate a working, fully responsive template styled perfectly with Tailwind CSS based on those frames.
            
            **Video Context / User Notes:**
            "${additionalNotes || 'Recreate the elegant web application showcased in this video design.'}"
            
            **Task guidelines:**
            1. **Reconstruct Interface:** Look at the screenshots, recognize elements (buttons, inputs, cards, layouts) and write code that closely patterns them.
            2. **Perfect Interaction:** In 'script.js', register appropriate event listeners to make widgets clickable, showing mock transactions or responses as appropriate.
            3. Use the placeholder '{{PROJECT_ICON_URL}}' for logo components.
            
            **Project Name:** ${projectName}
            `;

            onLog("جاري البرمجة والبناء باستخدام Gemini Pro Multimodal...");
            const newProject = await geminiService.buildProjectFromSpec({
                projectName,
                prompt: finalPrompt,
                projectType: ProjectType.WEBSITE,
                files: mediaFrames,
                iconUrl: projectIconUrl
            }, onLog);

            newProject.creationMode = 'videoToCode';
            newProject.id = `video-${Date.now()}`;

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
            setError(err.message || 'فشل تحليل الفيديو والتحويل لكود. يرجى محاولة استخدام فيديو بجودة ولقطات أوضح.');
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
            setProjects(updatedProjects.filter(p => p.creationMode === 'videoToCode'));
        }
    };

    const handleCreateNew = () => {
        setProjectName('مشروع فيديو ذكي - ' + new Date().toLocaleDateString('ar-EG'));
        setProjectIconUrl(null);
        setVideoBlob(null);
        setVideoUrl(null);
        setUploadedFile(null);
        setAdditionalNotes('');
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
                        <VideoIcon className="w-6 h-6 text-amber-500" />
                        فيديو إلى كود
                    </h2>
                    <p className="text-slate-400">({projects.length}) مشاريع مبنية بالفيديو</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleCreateNew} className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-amber-600/10">
                        <PlusIcon className="w-5 h-5"/>
                        توليد بالفيديو جديد
                    </button>
                </div>
            </header>

            <div className="relative mb-6">
                <input type="search" placeholder="ابحث في مشاريعك المبنية بالفيديو..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-4 pr-10 text-white focus:outline-none" />
                <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {filteredProjects.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/30 py-16">
                    <VideoIcon className="w-16 h-16 mb-4 text-slate-600"/>
                    <h3 className="text-lg font-semibold text-slate-300">لا توجد مشاريع بالفيديو حالياً</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-md text-center">انقر على "توليد بالفيديو جديد" لرفع أو تسجيل فيديو لواجهة مصممة بطول (10 - 30 ثانية)، وسيتولى الذكاء الاصطناعي برمجتها بشكل ديناميكي.</p>
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
                        <h2 className="text-2xl font-bold text-white">توليد الأكواد بالتسجيل وتحليل الفيديو</h2>
                        <p className="text-sm text-slate-400">سجل تصميم واجهتك أو تصفح منتجك بالفيديو (من 10إلى 30 ثانية) وسنبرمجها لك</p>
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
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 text-right"
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

                    {/* Camera / Video Recorder Sections */}
                    <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center py-8 space-y-5 text-center relative overflow-hidden">
                        <div className="flex items-center justify-between w-full">
                            <h3 className="text-base font-bold text-slate-100">تسجيل أو رفع فيديو واجهة العمل</h3>
                            <span className="text-xs bg-slate-700 px-3 py-1 rounded-full text-slate-300">المدة المطلوبة: 10ث - 30ث</span>
                        </div>

                        {isRecording ? (
                            <div className="w-full max-w-md aspect-video bg-black rounded-xl overflow-hidden relative border border-slate-750">
                                <video ref={webcamVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                                <div className="absolute top-3 right-3 bg-red-600 px-3 py-1 rounded-full text-white text-xs font-mono font-bold animate-pulse flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                                    <span>تسجيل: {formatTime(recordingTime)} / 30ث</span>
                                </div>
                            </div>
                        ) : videoUrl ? (
                            <div className="w-full max-w-md aspect-video bg-black rounded-xl overflow-hidden border border-slate-750">
                                <video src={videoUrl} controls className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-full max-w-md aspect-video bg-slate-900 border border-slate-750 rounded-xl flex flex-col items-center justify-center text-slate-600">
                                <VideoIcon className="w-12 h-12 mb-3 text-slate-700" />
                                <p className="text-xs text-slate-400">سجل مباشرة من المتصفح أو ارفع ملفك</p>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            {isRecording ? (
                                <button
                                    onClick={handleStopRecording}
                                    className="bg-red-650 hover:bg-red-500 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 text-sm shadow-md"
                                >
                                    <StopIcon className="w-4 h-4" />
                                    <span>إنهاء التسجيل</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleStartRecording}
                                    className="bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 text-sm shadow-md hover:scale-[1.02] transition-transform"
                                >
                                    <CameraIcon className="w-4 h-4 text-white" />
                                    <span>تسجيل بالكاميرا 🎥</span>
                                </button>
                            )}

                            <button onClick={() => fileInputRef.current?.click()} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-6 rounded-lg flex items-center gap-2 text-sm border border-slate-650">
                                <UploadIcon className="w-4 h-4" />
                                <span>رفع ملف فيديو</span>
                            </button>
                            <input type="file" accept="video/*" ref={fileInputRef} className="hidden" onChange={handleVideoFileUpload} />
                        </div>

                        {videoUrl && !error && (
                            <div className="text-xs text-green-400 border border-green-500/20 bg-green-500/5 px-4 py-1.5 rounded-full">
                                تم تجهيز الفيديو والتأكد من صلاحه (المدة مناسبة ومطابقة للشروط)
                            </div>
                        )}
                    </div>

                    {/* Additional Notes Column */}
                    <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
                        <label className="block text-sm font-semibold text-slate-300 mb-2">ملاحظات وطلبات إضافية تريد تواجدها بالمشروع:</label>
                        <textarea
                            value={additionalNotes}
                            onChange={e => setAdditionalNotes(e.target.value)}
                            placeholder="مثال: يرجى إضافة شريط تصفح متكامل وشاشات تسجيل للواجهات المتواجدة..."
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 text-right text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Error & Next Actions */}
            <div className="mt-8 space-y-4">
                {error && <p className="text-red-400 text-sm font-semibold text-center">{error}</p>}
                <button
                    onClick={handleAnalyzeAndBuild}
                    disabled={isGenerating || !videoBlob}
                    className="w-full py-3 bg-gradient-to-l from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 disabled:opacity-50"
                >
                    {isGenerating ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                    <span>{isGenerating ? 'جاري تحليل الرسوم وبناء الأكواد بالتفصيل...' : 'تحليل وتوليد الكود بالفيديو الآن'}</span>
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
                    mode="screen" 
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

export default VideoToCode;
