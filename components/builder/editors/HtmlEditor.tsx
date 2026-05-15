import React, { useState, useRef, useEffect } from 'react';
import { Project, ProjectSection, Message } from '../../../types';
import { geminiService } from '../../../services/geminiService';
import { SendIcon, SparklesIcon, SpinnerIcon } from '../../Icons';

interface HtmlEditorProps {
    section: ProjectSection;
    onUpdate: (s: ProjectSection) => void;
    project: Project;
    onUpdateProject: (p: Project) => void;
}


const HtmlEditor: React.FC<HtmlEditorProps> = ({ section, onUpdate, project, onUpdateProject }) => {
    const [messages, setMessages] = useState<Message[]>([
        { id: 'init', sender: 'ai', text: 'اطلب مني أي تعديل على محتوى HTML لهذا القسم. مثال: "غير لون الخلفية إلى الأسود" أو "أضف زرًا باسم إرسال".' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        const command = input.trim();
        if (!command || isLoading) return;

        const userMessage: Message = { id: `user-${Date.now()}`, sender: 'user', text: command };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const currentHtml = section.config.htmlContent || '';
            const { html: newHtml, userMessage: aiResponse } = await geminiService.modifyHtmlWithAI(currentHtml, command);
            onUpdate({ ...section, config: { ...section.config, htmlContent: newHtml } });

            const aiMessage: Message = {
                id: `ai-${Date.now()}`,
                sender: 'ai',
                text: aiResponse,
            };
            setMessages(prev => [...prev, aiMessage]);

        } catch (e) {
             console.error(e);
             const errorMessage: Message = { id: `ai-err-${Date.now()}`, sender: 'ai', text: 'عذرًا, حدث خطأ ما أثناء تعديل الكود.' };
             setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-sm font-medium text-slate-300 mb-2">محتوى HTML</label>
                <textarea
                    value={section.config.htmlContent || ''}
                    onChange={e => onUpdate({ ...section, config: { ...section.config, htmlContent: e.target.value } })}
                    className="w-full h-full bg-slate-900 font-mono text-sm p-2 rounded-md border border-slate-600 resize-y"
                    spellCheck="false"
                />
            </div>
            
            <div className="flex-1 flex flex-col min-h-0 border-t border-slate-700 pt-4">
                <h3 className="text-md font-semibold text-slate-200 mb-2 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-indigo-400" />
                    مساعد HTML الذكي
                </h3>
                <div className="ai-chat-container flex-grow -mx-1">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`ai-message-block ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                            <div className={`ai-message ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="ai-message-block bot">
                            <div className="ai-message bot">
                                <div className="typing-indicator"><span></span><span></span><span></span></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="mt-auto pt-2">
                    <div className="bg-slate-700 rounded-lg flex items-center p-1 gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="اطلب تعديلاً..."
                            className="flex-1 bg-transparent focus:outline-none px-2 text-white text-sm"
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={!input.trim() || isLoading} className="bg-indigo-600 text-white rounded-md p-2 disabled:bg-slate-500">
                            {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <SendIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HtmlEditor;
