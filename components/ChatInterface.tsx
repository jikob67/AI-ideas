import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Message, Feature, ProjectType } from '../types';
import { geminiService } from '../services/geminiService';
import { SendIcon, SparklesIcon, LinkIcon, GlobeAltIcon, MapIcon, SaveIcon, Share2Icon, TrashIcon } from './Icons';
import { useUsage } from '../hooks/useUsage';
import { useAuth } from '../hooks/useAuth';

const ChatInterface: React.FC<{ 
    feature: Feature, 
    model: string, 
    title: string, 
    systemInstruction?: string, 
    config?: any,
    initialMessage?: string
}> = ({ feature, model, title, systemInstruction, config, initialMessage }) => {
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome-1', text: `تم اختيار مهمة: ${title}. كيف يمكنني مساعدتك؟`, sender: 'ai' }
    ]);

    useEffect(() => {
        if (initialMessage) {
            setInput(initialMessage);
        }
    }, [initialMessage]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { incrementUsage, isLimitReached } = useUsage();
    const { currentUser, updateUser } = useAuth();
    const [saveStatus, setSaveStatus] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

    useEffect(() => {
        if (!currentUser?.email) return;
        const key = `chatHistory_${currentUser.email}_${feature}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch(e) { console.error("Failed to parse chat history"); }
        } else {
             setMessages([ { id: 'welcome-1', text: `تم اختيار مهمة: ${title}. كيف يمكنني مساعدتك؟`, sender: 'ai' } ]);
        }
    }, [feature, title, currentUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (feature === Feature.MAPS_SEARCH) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.warn("Geolocation permission denied.", error);
                    // Add a message to inform the user
                    setMessages(prev => [...prev, {
                        id: 'geo-error',
                        sender: 'ai',
                        text: 'للحصول على أفضل النتائج، يرجى تمكين الوصول إلى موقعك.'
                    }]);
                }
            );
        }
    }, [feature]);
    
    const handleSaveHistory = () => {
        if (!currentUser?.email || messages.length <= 1) return;
        const key = `chatHistory_${currentUser.email}_${feature}`;
        localStorage.setItem(key, JSON.stringify(messages));
        setSaveStatus('تم الحفظ!');
        setTimeout(() => setSaveStatus(''), 2000);
    };

    const handleShareHistory = async () => {
        if (messages.length <= 1) return;
        if (!navigator.share) {
            alert('متصفحك لا يدعم ميزة المشاركة.');
            return;
        }
        const transcript = messages.map(msg => `${msg.sender === 'user' ? 'أنت' : 'AI'}: ${msg.text}`).join('\n\n');
        try {
            await navigator.share({
                title: `محادثة مع ${title}`,
                text: transcript,
            });
            if (currentUser) {
                updateUser({ points: (currentUser.points || 0) + 5 });
            }
        } catch (err: any) {
            if (err && err.name === 'AbortError') {
                // User cancelled the share dialog, do nothing.
            } else {
                console.error('Share failed:', err);
                alert('فشلت المشاركة. قد لا يدعم متصفحك أو بيئة التشغيل هذه الميزة.');
            }
        }
    };

    const handleClearHistory = () => {
        if (window.confirm('هل أنت متأكد أنك تريد مسح سجل هذه المحادثة؟')) {
            const initialMessage = { id: 'welcome-1', text: `تم اختيار مهمة: ${title}. كيف يمكنني مساعدتك؟`, sender: 'ai' as const };
            setMessages([initialMessage]);
            if(currentUser?.email) {
                const key = `chatHistory_${currentUser.email}_${feature}`;
                localStorage.removeItem(key);
            }
        }
    };

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        const usageType = ProjectType.AI_CHAT_MESSAGE;

        if (isLimitReached(usageType)) {
            alert(`لقد وصلت إلى الحد اليومي لهذه الميزة: ${feature}. قم بالترقية للمتابعة.`);
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            text: text,
            sender: 'user',
            taskType: feature
        };
        
        setMessages(prev => [...prev, userMessage]);
        incrementUsage(usageType);
        
        setInput('');
        setIsLoading(true);

        const aiMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai', status: 'generating' }]);
        
        const finalConfig = { ...config };
        if (feature === Feature.MAPS_SEARCH && userLocation) {
            finalConfig.toolConfig = {
                retrievalConfig: { latLng: userLocation }
            };
        }

        const isGroundedSearch = feature === Feature.WEB_SEARCH || feature === Feature.MAPS_SEARCH;

        if (isGroundedSearch) {
             try {
                const response = await geminiService.generateContent(text, model, finalConfig);
                const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => {
                    const source = chunk.web || chunk.maps;
                    return { uri: source.uri, title: source.title };
                }).filter(Boolean) || [];

                setMessages(prev => prev.map(m => m.id === aiMessageId ? {
                    ...m,
                    text: response.text,
                    status: 'completed',
                    sources,
                } : m));
            } catch (e) {
                 console.error(e);
                 setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: `عذرًا, حدث خطأ: ${e instanceof Error ? e.message : ''}`, status: 'error' } : m));
            } finally {
                setIsLoading(false);
            }
        } else {
            let fullResponseText = '';
            geminiService.generateTextStream({
                prompt: text,
                model,
                systemInstruction,
                config: finalConfig,
                onChunk: (chunk) => {
                    fullResponseText += chunk;
                    setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: fullResponseText } : m));
                },
                onComplete: () => {
                    setIsLoading(false);
                    setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, status: 'completed' } : m));
                }
            });
        }
        
    }, [input, isLoading, feature, incrementUsage, isLimitReached, model, systemInstruction, config, userLocation, currentUser, updateUser]);

    const getIconForSource = (uri: string) => {
        if (uri.includes('google.com/maps')) {
            return <MapIcon className="w-3 h-3"/>;
        }
        if (uri.startsWith('http')) {
            return <GlobeAltIcon className="w-3 h-3"/>
        }
        return <LinkIcon className="w-3 h-3"/>;
    };

    return (
        <>
            <div className="ai-chat-container flex-1">
                {messages.map((msg) => (
                    <div key={msg.id} className={`ai-message-block ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                        <div className={`ai-message ${msg.sender === 'user' ? 'user' : 'bot'} ${msg.status === 'error' ? '!bg-red-500/50' : ''}`}>
                            {msg.status === 'generating' && !msg.text ? (
                                <div className="typing-indicator"><span></span><span></span><span></span></div>
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            )}
                            {msg.content}
                        </div>
                         {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && (
                            <div className="mt-2">
                                <h4 className="text-xs font-semibold text-slate-400 mb-1">المصادر:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {msg.sources.map((source, index) => (
                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" key={index} className="flex items-center gap-1.5 bg-slate-600/50 hover:bg-slate-600 text-xs text-sky-300 px-2 py-1 rounded-full">
                                            {getIconForSource(source.uri)}
                                            <span>{source.title || new URL(source.uri).hostname}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="w-full px-4 pb-4 mt-auto">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl flex items-center p-2 gap-2 shadow-lg">
                    <button onClick={handleSaveHistory} title="حفظ المحادثة" className="text-slate-400 p-2 hover:bg-slate-700 rounded-md">
                        <SaveIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={handleShareHistory} title="مشاركة المحادثة" className="text-slate-400 p-2 hover:bg-slate-700 rounded-md">
                        <Share2Icon className="w-5 h-5"/>
                    </button>
                    <button onClick={handleClearHistory} title="مسح المحادثة" className="text-slate-400 p-2 hover:bg-slate-700 rounded-md">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={`إرسال رسالة إلى (${title})...`}
                        className="flex-1 bg-transparent focus:outline-none px-2 text-white"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="bg-indigo-600 text-white rounded-md p-2 disabled:bg-slate-500 disabled:cursor-not-allowed hover:bg-indigo-500 transition-colors"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
                 {saveStatus && <p className="text-xs text-green-400 text-center mt-1">{saveStatus}</p>}
            </div>
        </>
    );
};

export default ChatInterface;