import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenaiBlob } from '@google/genai';
import { MicrophoneIcon, StopIcon, SpinnerIcon, ArrowDownTrayIcon, CopyIcon, TrashIcon, CheckIcon, Share2Icon } from './Icons';
import { useAuth } from '../hooks/useAuth';

// --- Audio Helper Functions from Docs ---
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

type ConversationState = 'idle' | 'connecting' | 'active' | 'error';
type Transcript = { user: string; bot: string };

const LiveConversation: React.FC = () => {
  const [state, setState] = useState<ConversationState>('idle');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState<Transcript>({ user: '', bot: '' });
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const nextStartTimeRef = useRef(0);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const { currentUser, updateUser } = useAuth();

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, currentTranscript]);

  const cleanup = useCallback(() => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close();
        outputAudioContextRef.current = null;
    }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const connect = async () => {
    setState('connecting');
    setError(null);
    setTranscripts([]);
    setCurrentTranscript({ user: '', bot: '' });
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    const inputAudioContext = inputAudioContextRef.current!;
                    const source = inputAudioContext.createMediaStreamSource(streamRef.current!);
                    const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        const pcmBlob: GenaiBlob = {
                            data: encode(new Uint8Array(int16.buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        
                        sessionPromiseRef.current?.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContext.destination);
                    setState('active');
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.outputTranscription) {
                        const text = message.serverContent.outputTranscription.text;
                        setCurrentTranscript(prev => ({ ...prev, bot: prev.bot + text }));
                    } else if (message.serverContent?.inputTranscription) {
                        const text = message.serverContent.inputTranscription.text;
                        setCurrentTranscript(prev => ({ ...prev, user: prev.user + text }));
                    }

                    if (message.serverContent?.turnComplete) {
                        setTranscripts(prev => [...prev, currentTranscript]);
                        setCurrentTranscript({ user: '', bot: '' });
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio) {
                        const outputAudioContext = outputAudioContextRef.current!;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                        
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                        const source = outputAudioContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAudioContext.destination);
                        
                        source.addEventListener('ended', () => sourcesRef.current.delete(source));
                        
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }
                    
                    if (message.serverContent?.interrupted) {
                        sourcesRef.current.forEach(source => {
                            source.stop();
                            sourcesRef.current.delete(source);
                        });
                        nextStartTimeRef.current = 0;
                    }
                },
                onerror: (e: ErrorEvent) => {
                    setError('حدث خطأ في الاتصال.');
                    console.error('Live session error:', e);
                    setState('error');
                    cleanup();
                },
                onclose: (e: CloseEvent) => {
                    setState('idle');
                    cleanup();
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                outputAudioTranscription: {},
                inputAudioTranscription: {},
                systemInstruction: 'You are a friendly and helpful AI assistant.',
            },
        });

    } catch (err) {
        setError(err instanceof Error ? err.message : 'فشل في بدء المحادثة.');
        setState('error');
        cleanup();
    }
  };

  const disconnect = () => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
    } else {
        cleanup();
        setState('idle');
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