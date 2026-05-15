import React, { useState, useCallback, useRef, useEffect } from 'react';
import { geminiService } from '../../services/geminiService';
import { Message, ProjectType } from '../../types';
import { SendIcon, UploadIcon, SparklesIcon } from '../Icons';
import { useUsage } from '../../hooks/useUsage';

const ImageAnalyzer: React.FC = () => {
    const [image, setImage] = useState<{file: File, url: string} | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { incrementUsage, isLimitReached } = useUsage();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setImage({file, url: URL.createObjectURL(file)});
            setMessages([{id: 'init', sender: 'ai', text: 'تم رفع الصورة بنجاح. ما الذي تريد معرفته عنها؟'}]);
        }
    };

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if (!text || isLoading || !image) return;

        if (isLimitReached(ProjectType.AI_CHAT_MESSAGE)) {
            alert('لقد وصلت إلى الحد اليومي للمحادثات. قم بالترقية للمتابعة.');
            return;
        }

        const userMessage: Message = { id: Date.now().toString(), text, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        incrementUsage(ProjectType.AI_CHAT_MESSAGE);
        setInput('');
        setIsLoading(true);

        const reader = new FileReader();
        reader.readAsDataURL(image.file);
        reader.onload = async () => {
            try {
                const base64Data = (reader.result as string).split(',')[1];
                const responseText = await geminiService.analyzeImage(base64Data, image.file.type, text);
                const aiMessage: Message = { id: (Date.now() + 1).toString(), text: responseText, sender: 'ai' };
                setMessages(prev => [...prev, aiMessage]);
            } catch (error) {
                console.error(error);
                const aiMessage: Message = { id: (Date.now() + 1).toString(), text: 'عذرًا، حدث خطأ أثناء تحليل الصورة.', sender: 'ai' };
                setMessages(prev => [...prev, aiMessage]);
            } finally {
                setIsLoading(false);
            }
        };
        reader.onerror = () => {
            console.error("Failed to read file for analysis");
            const aiMessage: Message = { id: (Date.now() + 1).toString(), text: 'عذرًا، فشل في قراءة ملف الصورة.', sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);
            setIsLoading(false);
        };
    }, [input, isLoading, image, incrementUsage, isLimitReached]);

    return (
        <div className="flex flex-col h-full">
            {!image ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <label htmlFor="image-upload" className="cursor-pointer border-2 border-dashed border-slate-600 rounded-lg p-12 text-center hover:border-indigo-500 hover:bg-slate-800 transition-colors">
                        <UploadIcon className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                        <h3 className="font-semibold text-white">ارفع صورة لبدء التحليل</h3>
                        <p className="text-sm text-slate-400 mt-1">اطرح أسئلة حول محتوى صورتك.</p>
                    </label>
                    <input id="image-upload" ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
            ) : (
                <>
                    <div className="h-48 flex-shrink-0 p-2 border-b border-slate-700 flex items-center justify-center gap-4 bg-slate-900">
                        <img src={image.url} alt="Uploaded for analysis" className="max-h-full h-full object-contain rounded-md" />
                         <button onClick={() => { setImage(null); setMessages([]); }} className="text-sm text-slate-400 hover:text-red-400">تغيير الصورة</button>
                    </div>
                    <div className="ai-chat-container flex-1">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`ai-message-block ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                                <div className={`ai-message ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && <div className="ai-message-block bot"><div className="ai-message bot"><div className="typing-indicator"><span></span><span></span><span></span></div></div></div>}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="w-full px-4 pb-4 mt-auto">
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl flex items-center p-2 gap-2 shadow-lg">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="اسأل عن الصورة..."
                                className="flex-1 bg-transparent focus:outline-none px-2 text-white"
                                disabled={isLoading}
                            />
                            <button onClick={handleSend} disabled={!input.trim() || isLoading} className="bg-indigo-600 text-white rounded-md p-2 disabled:bg-slate-500">
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ImageAnalyzer;