import React, { useState, useEffect, useRef } from 'react';
import { Project, Message } from '../../types';
import { geminiService } from '../../services/geminiService';
import { SendIcon, SparklesIcon, SpinnerIcon } from '../Icons';

interface AiPanelProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
}

const AiPanel: React.FC<AiPanelProps> = ({ project, onUpdateProject }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Local state for messages
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Sync local message state with the project prop when it changes
    useEffect(() => {
        setMessages(project.builderChat || [{ id: 'init', sender: 'ai', text: 'مرحباً! أنا مساعدك الذكي. اطلب مني أي تعديل على مشروعك.' }]);
    }, [project.builderChat]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        const command = input.trim();
        if (!command || isLoading) return;

        const userMessage: Message = { id: `user-${Date.now()}`, sender: 'user', text: command };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);

        setInput('');
        setIsLoading(true);

        try {
            const { updatedProject, aiResponse } = await geminiService.modifyProjectWithAI(project, command);

            const aiMessage: Message = {
                id: `ai-${Date.now()}`,
                sender: 'ai',
                text: aiResponse,
            };

            const finalMessages = [...newMessages, aiMessage];
            // Persist the full chat history and the modified project state
            onUpdateProject({ ...updatedProject, builderChat: finalMessages });
            // Update local state to reflect the new chat messages
            setMessages(finalMessages);

        } catch (e) {
             console.error(e);
             const errorMessage: Message = { id: `ai-err-${Date.now()}`, sender: 'ai', text: 'عذرًا, حدث خطأ ما.' };
             const finalMessagesOnError = [...newMessages, errorMessage];
             setMessages(finalMessagesOnError);
             onUpdateProject({ ...project, builderChat: finalMessagesOnError });
        } finally {
            setIsLoading(false);
        }
    };
    
    // This function is no longer needed as the new AI service handles actions directly.
    const handleAction = (action: any) => {
        console.warn("handleAction is deprecated.", action);
    };


    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} className="fixed bottom-4 left-4 z-50 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-500 transition-transform transform hover:scale-110">
                <SparklesIcon className="w-6 h-6"/>
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 left-4 z-50 w-96 h-[60vh] bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl flex flex-col animate-fade-in-up">
            <header className="flex-shrink-0 p-3 border-b border-slate-700 flex items-center justify-between">
                <h3 className="font-bold text-white">المساعد الذكي</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
            </header>
            <div className="flex-1 overflow-y-auto">
                 <div className="ai-chat-container p-3">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`ai-message-block ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                            <div className={`ai-message ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                {msg.actions && (
                                    <div className="flex gap-2 mt-2">
                                        {msg.actions.map((action, i) => (
                                            <button key={i} onClick={() => handleAction(action)} className={`text-xs py-1 px-3 rounded-full ${action.type === 'accept' ? 'bg-green-500/80' : 'bg-slate-600'}`}>
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="ai-message-block bot animate-pulse">
                            <div className="ai-message bot flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-300">جاري تنفيذ التعديلات</span>
                                <div className="typing-indicator text-indigo-400">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
             <div className="flex-shrink-0 p-3 border-t border-slate-700">
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
    );
};

export default AiPanel;