import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MicrophoneIcon, StopIcon, SpinnerIcon, ArrowDownTrayIcon, CopyIcon, TrashIcon, CheckIcon, Share2Icon } from './Icons';
import { useAuth } from '../hooks/useAuth';

type ConversationState = 'idle' | 'connecting' | 'active' | 'processing' | 'error';
type Transcript = { user: string; bot: string };

const LiveConversation: React.FC = () => {
  const [state, setState] = useState<ConversationState>('idle');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState<Transcript>({ user: '', bot: '' });
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const { currentUser, updateUser } = useAuth();

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, currentTranscript]);

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
            mediaRecorderRef.current.stop();
        } catch (e) {}
    }
    mediaRecorderRef.current = null;
    
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }

    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const processVoiceInteraction = async (base64Audio: string) => {
    setState('processing');
    try {
        const response = await fetch('/api/gemini/audio-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Audio, history: transcripts })
        });

        if (!response.ok) {
            throw new Error('فشل نظام الصوت في الاستجابة.');
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        const newTranscript = { 
            user: data.userTranscription || 'صوت مسموع', 
            bot: data.assistantTranscription || 'أهلاً بك!' 
        };

        // Update real time UI matching standard transcripts
        setCurrentTranscript(newTranscript);
        setTranscripts(prev => [...prev, newTranscript]);

        if (data.assistantAudio) {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            const snd = new Audio("data:audio/mp3;base64," + data.assistantAudio);
            audioRef.current = snd;
            
            snd.onended = () => {
                setState('idle');
                setCurrentTranscript({ user: '', bot: '' });
            };
            
            await snd.play();
        } else {
            setState('idle');
            setCurrentTranscript({ user: '', bot: '' });
        }
    } catch (err: any) {
        console.error("Audio transaction failed:", err);
        setError(err.message || 'حدث خطأ أثناء معالجة الصوت.');
        setState('error');
        setTimeout(() => setState('idle'), 3000);
    }
  };

  const connect = async () => {
    setState('connecting');
    setError(null);
    audioChunksRef.current = [];
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Chrome/Firefox compatible recording mime types
        let options = {};
        if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
        }

        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = (reader.result as string).split(',')[1];
                if (base64Audio) {
                    await processVoiceInteraction(base64Audio);
                } else {
                    setState('idle');
                }
            };
        };

        mediaRecorder.start();
        setState('active');
    } catch (err: any) {
        console.error("Failed to start media device capture:", err);
        setError('فشل في الوصول للميكروفون أو تسجيل الصوت. يرجى التحقق من الصلاحيات.');
        setState('error');
        setTimeout(() => setState('idle'), 4000);
    }
  };

  const disconnect = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const getFullTranscriptText = useCallback(() => {
    return transcripts.map(t => `أنت: ${t.user}\nAI ideas: ${t.bot}`).join('\n\n');
  }, [transcripts]);
  
  const handleCopy = () => {
      navigator.clipboard.writeText(getFullTranscriptText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownload = () => {
      const blob = new Blob([getFullTranscriptText()], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `live-transcript-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (!navigator.share) {
        alert('متصفحك لا يدعم ميزة المشاركة.');
        return;
    }
    try {
        await navigator.share({
            title: 'محادثة مباشرة مع AI ideas',
            text: getFullTranscriptText(),
        });
        if (currentUser) {
            updateUser({ points: (currentUser.points || 0) + 5 });
        }
    } catch (err: any) {
        if (err.name !== 'AbortError') {
            console.error('Share failed:', err);
            alert('فشلت المشاركة.');
        }
    }
  };
  
  const handleClear = () => {
      setTranscripts([]);
      setCurrentTranscript({ user: '', bot: '' });
  };
  
  const TranscriptDisplay: React.FC<{ transcript: Transcript, isInterim: boolean }> = ({ transcript, isInterim }) => (
    <div className={`py-2 ${isInterim ? 'opacity-70' : ''}`}>
        {transcript.user && <p><strong className="text-indigo-300">أنت:</strong> {transcript.user}</p>}
        {transcript.bot && <p><strong className="text-sky-300">AI ideas:</strong> {transcript.bot}</p>}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white animate-fade-in p-4 lg:p-8">
        <header className="text-center mb-6">
            <MicrophoneIcon className="w-12 h-12 mx-auto text-indigo-400 mb-2" />
            <h1 className="text-3xl font-bold text-slate-100">محادثة مباشرة</h1>
            <p className="text-slate-400 mt-2 max-w-2xl mx-auto">تحدث مباشرة مع AI ideas واستمع إلى الردود الصوتية في الوقت الفعلي.</p>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center gap-6">
            <button
                onClick={state === 'active' || state === 'connecting' ? disconnect : connect}
                disabled={state === 'connecting'}
                className="w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-wait relative ring-4 ring-slate-700 hover:ring-indigo-500"
            >
                {state === 'connecting' && <SpinnerIcon className="w-16 h-16 text-indigo-400 animate-spin" />}
                {state === 'idle' && <MicrophoneIcon className="w-16 h-16 text-slate-300" />}
                {state === 'error' && <MicrophoneIcon className="w-16 h-16 text-red-400" />}
                {state === 'active' && <StopIcon className="w-16 h-16 text-red-400" />}

                {state === 'active' && <div className="absolute inset-0 border-4 border-green-400 rounded-full animate-pulse"></div>}
            </button>
            <p className="text-slate-300 h-6">
                {state === 'idle' && 'انقر لبدء المحادثة'}
                {state === 'connecting' && 'جاري الاتصال...'}
                {state === 'active' && 'المحادثة نشطة... انقر للإيقاف'}
                {state === 'error' && `خطأ: ${error}`}
            </p>

            <div className="w-full max-w-3xl flex flex-col">
                <div className="flex justify-end gap-2 mb-2">
                    <button onClick={handleShare} disabled={transcripts.length === 0} className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-md disabled:opacity-50"><Share2Icon className="w-4 h-4"/>مشاركة</button>
                    <button onClick={handleDownload} disabled={transcripts.length === 0} className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-md disabled:opacity-50"><ArrowDownTrayIcon className="w-4 h-4"/>تنزيل</button>
                    <button onClick={handleCopy} disabled={transcripts.length === 0} className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-md disabled:opacity-50">
                        {copied ? <CheckIcon className="w-4 h-4 text-green-400"/> : <CopyIcon className="w-4 h-4"/>}
                        {copied ? 'تم النسخ' : 'نسخ'}
                    </button>
                    <button onClick={handleClear} disabled={transcripts.length === 0 && currentTranscript.user === ''} className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-md disabled:opacity-50"><TrashIcon className="w-4 h-4"/>مسح</button>
                </div>
                <div className="h-64 bg-slate-800/50 border border-slate-700 rounded-xl p-4 overflow-y-auto font-sans text-right">
                    {transcripts.length === 0 && currentTranscript.user === '' && currentTranscript.bot === '' && <p className="text-slate-500 text-center">سيظهر النص هنا...</p>}
                    {transcripts.map((t, i) => <TranscriptDisplay key={i} transcript={t} isInterim={false} />)}
                    <TranscriptDisplay transcript={currentTranscript} isInterim={true} />
                    <div ref={conversationEndRef}></div>
                </div>
            </div>
        </main>
    </div>
  );
};

export default LiveConversation;