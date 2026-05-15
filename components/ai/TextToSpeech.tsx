import React, { useState, useEffect } from 'react';
import { geminiService } from '../../services/geminiService';
import { ProjectType } from '../../types';
import { SpeakerWaveIcon, SpinnerIcon, PlayIcon } from '../Icons';
import { useUsage } from '../../hooks/useUsage';
import UpgradeModal from '../UpgradeModal';

// Base64 decoding function
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Raw PCM to AudioBuffer decoding function
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


const TextToSpeech: React.FC = () => {
    const [text, setText] = useState('مرحباً بالعالم! هذا اختبار لميزة تحويل النص إلى كلام.');
    const [isLoading, setIsLoading] = useState(false);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [error, setError] = useState('');
    const { isLimitReached, incrementUsage } = useUsage();
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

    useEffect(() => {
        // Initialize AudioContext on user interaction to comply with browser policies
        const initAudioContext = () => {
            if (!audioContext) {
                const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                setAudioContext(context);
            }
            window.removeEventListener('click', initAudioContext);
        };
        window.addEventListener('click', initAudioContext);
        return () => window.removeEventListener('click', initAudioContext);
    }, [audioContext]);
    
    const handleGenerate = async () => {
        if (!text.trim()) {
            setError('الرجاء إدخال نص أولاً.');
            return;
        }
        if (isLimitReached(ProjectType.TTS)) {
            setUpgradeModalOpen(true);
            return;
        }
        if (!audioContext) {
            setError('لم يتم تهيئة سياق الصوت. يرجى التفاعل مع الصفحة أولاً.');
            return;
        }

        setIsLoading(true);
        setError('');
        setAudioBuffer(null);

        try {
            const base64Audio = await geminiService.generateSpeech(text);
            const decodedBytes = decode(base64Audio);
            const buffer = await decodeAudioData(decodedBytes, audioContext, 24000, 1);
            setAudioBuffer(buffer);
            incrementUsage(ProjectType.TTS);
        } catch (e) {
            console.error(e);
            setError(`فشل في إنشاء الصوت: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setIsLoading(false);
        }
    };

    const playAudio = () => {
        if (!audioBuffer || !audioContext) return;
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
    };

    return (
        <div className="p-4 h-full flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-bold text-white mb-4">تحويل النص إلى صوت</h2>
            
            <div className="w-full max-w-lg space-y-4">
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={6}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white"
                    placeholder="اكتب النص الذي تريد تحويله هنا..."
                />

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-500"
                >
                    {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SpeakerWaveIcon className="w-5 h-5" />}
                    {isLoading ? 'جاري الإنشاء...' : 'أنشئ الصوت'}
                </button>
                
                {audioBuffer && (
                    <div className="mt-4 p-4 bg-slate-800/50 rounded-lg flex items-center justify-center animate-fade-in">
                        <button onClick={playAudio} className="flex items-center gap-2 text-lg font-semibold text-green-400">
                            <PlayIcon className="w-8 h-8"/>
                            تشغيل الصوت
                        </button>
                    </div>
                )}
            </div>
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
        </div>
    );
};


export default TextToSpeech;