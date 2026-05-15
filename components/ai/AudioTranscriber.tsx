import React, { useState, useRef } from 'react';
import { geminiService } from '../../services/geminiService';
import { ProjectType } from '../../types';
import { MicrophoneIcon, SpinnerIcon, StopIcon, CopyIcon, CheckIcon } from '../Icons';
import { useUsage } from '../../hooks/useUsage';
import UpgradeModal from '../UpgradeModal';

type RecordingState = 'idle' | 'recording' | 'processing' | 'finished';

const AudioTranscriber: React.FC = () => {
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const [transcribedText, setTranscribedText] = useState('');
    const [error, setError] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const { isLimitReached, incrementUsage } = useUsage();
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const startRecording = async () => {
        if (isLimitReached(ProjectType.AUDIO_TRANSCRIPTION)) {
            setUpgradeModalOpen(true);
            return;
        }
        setError('');
        setTranscribedText('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = handleStop;
            mediaRecorderRef.current.start();
            setRecordingState('recording');
        } catch (err) {
            setError('فشل الوصول إلى المايكروفون. يرجى التحقق من الأذونات.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recordingState === 'recording') {
            mediaRecorderRef.current.stop();
            setRecordingState('processing');
        }
    };

    const handleStop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            try {
                const text = await geminiService.transcribeAudio(base64Audio, 'audio/webm');
                setTranscribedText(text);
                incrementUsage(ProjectType.AUDIO_TRANSCRIPTION);
                setRecordingState('finished');
            } catch (e) {
                setError('فشل في تحويل الصوت إلى نص.');
                setRecordingState('idle');
            }
        };
    };
    
    const handleCopy = () => {
        if (!transcribedText) return;
        navigator.clipboard.writeText(transcribedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-4 h-full flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-bold text-white mb-4">تحويل الصوت إلى نص</h2>
            
            <div className="w-full max-w-lg">
                {recordingState === 'idle' && <button onClick={startRecording} className="w-24 h-24 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center shadow-lg transition-transform transform hover:scale-105"><MicrophoneIcon className="w-10 h-10 text-white" /></button>}
                {recordingState === 'recording' && <button onClick={stopRecording} className="w-24 h-24 bg-slate-600 hover:bg-slate-500 rounded-full flex items-center justify-center animate-pulse"><StopIcon className="w-10 h-10 text-white" /></button>}
                {recordingState === 'processing' && <div className="w-24 h-24 flex items-center justify-center"><SpinnerIcon className="w-16 h-16 animate-spin text-indigo-400"/></div>}
                
                <p className="text-slate-400 mt-4 h-6">
                    {recordingState === 'idle' && "انقر لبدء التسجيل"}
                    {recordingState === 'recording' && "جاري التسجيل..."}
                    {recordingState === 'processing' && "جاري المعالجة..."}
                </p>
            </div>

            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
            
            {transcribedText && recordingState === 'finished' && (
                <div className="mt-6 w-full max-w-2xl bg-slate-800/50 border border-slate-700 rounded-xl p-4 animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-white">النص المحول:</h3>
                        <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-md">
                            {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                            {copied ? 'تم النسخ' : 'نسخ'}
                        </button>
                    </div>
                    <p className="text-slate-300 text-right whitespace-pre-wrap bg-slate-900 p-3 rounded-md max-h-48 overflow-y-auto">{transcribedText}</p>
                </div>
            )}
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
        </div>
    );
};

export default AudioTranscriber;
