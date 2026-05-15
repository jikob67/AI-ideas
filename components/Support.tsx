
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, Message, View, ProjectType } from '../types';
import { useAuth } from '../hooks/useAuth';
import { geminiService } from '../services/geminiService';
import { SendIcon, SparklesIcon, SpinnerIcon, UploadIcon, TrashIcon, CloseIcon, MagnifyingGlassIcon, BriefcaseIcon, ArrowLeftIcon, PlusIcon, SupportIcon } from './Icons';

interface SupportProps {
    navigate: (view: View, context?: any) => void;
}

const EmailEscalationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    summary: string;
    currentUser: any;
}> = ({ isOpen, onClose, project, summary, currentUser }) => {
    const [email, setEmail] = useState(currentUser?.email || '');
    const [phone, setPhone] = useState('');
    const [details, setDetails] = useState(summary);
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (isOpen) {
             setEmail(currentUser?.email || '');
             setDetails(summary);
        }
    }, [isOpen, currentUser, summary]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            alert('الرجاء إدخال البريد الإلكتروني.');
            return;
        }
        setIsSending(true);
        setStatus('idle');
        try {
            const payload = {
                userEmail: email,
                phone,
                projectName: project?.name,
                projectId: project?.id,
                projectType: project?.type,
                problemSection: 'غير محدد', 
                details,
            };
            await geminiService.sendSupportEmail(payload); // Mocked API call
            setStatus('success');
        } catch {
            setStatus('error');
        } finally {
            setIsSending(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">تصعيد الطلب إلى الدعم البشري</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><CloseIcon className="w-5 h-5"/></button>
                </div>
                {status === 'success' ? (
                     <div className="text-center p-8">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                             <SupportIcon className="w-8 h-8 text-green-400" />
                        </div>
                        <h4 className="text-xl font-bold text-green-400">تم إرسال طلبك بنجاح!</h4>
                        <p className="text-slate-300 mt-2">سيتواصل معك فريق الدعم عبر البريد الإلكتروني ({email}) في أقرب وقت ممكن.</p>
                        <button onClick={onClose} className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg w-full">إغلاق</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-sm text-slate-400">لم يتمكن المساعد الذكي من حل مشكلتك. يرجى ملء التفاصيل أدناه لإرسالها إلى فريقنا.</p>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">البريد الإلكتروني للتواصل</label>
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    placeholder="example@domain.com" 
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                                    required 
                                />
                            </div>
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="block text-xs text-slate-400 mb-1">رقم الهاتف (اختياري)</label>
                                   <input 
                                    type="tel" 
                                    value={phone} 
                                    onChange={e => setPhone(e.target.value)} 
                                    placeholder="+966..." 
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                                   />
                               </div>
                               <div>
                                   <label className="block text-xs text-slate-400 mb-1">اسم المشروع</label>
                                   <input 
                                    type="text" 
                                    readOnly 
                                    value={project?.name || 'عام'} 
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-2.5 text-slate-400 text-sm cursor-not-allowed" 
                                   />
                               </div>
                           </div>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">تفاصيل المشكلة</label>
                            <textarea 
                                value={details} 
                                onChange={e => setDetails(e.target.value)} 
                                rows={5} 
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" 
                                placeholder="صف مشكلتك بالتفصيل..."
                            />
                        </div>
                        {status === 'error' && <p className="text-red-400 text-sm text-center">فشل إرسال الطلب. يرجى المحاولة مرة أخرى.</p>}
                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={isSending} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-lg disabled:bg-slate-600 flex items-center justify-center gap-2">
                                {isSending ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'إرسال الطلب'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const SmartSupport: React.FC<SupportProps> = ({ navigate }) => {
    const { currentUser } = useAuth();
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [images, setImages] = useState<{ name: string; base64: string; mimeType: string; url: string }[]>([]);
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', text: 'مرحباً بك في الدعم الفني الذكي. كيف يمكنني مساعدتك اليوم؟', sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEscalationModalOpen, setIsEscalationModalOpen] = useState(false);
    const [escalationSummary, setEscalationSummary] = useState('');
    const [screen, setScreen] = useState<'start' | 'chat'>('start');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser?.email) {
            const projects: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
            setAllProjects(projects);
        }
    }, [currentUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        if (images.length + files.length > 3) {
            alert('يمكنك رفع 3 صور كحد أقصى.');
            return;
        }

        const newFilesPromises = Array.from(files).map((f: File) => {
             return new Promise<{ name: string; base64: string; mimeType: string; url: string }>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(f);
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve({ name: f.name, base64: result.split(',')[1], mimeType: f.type, url: result });
                };
                reader.onerror = () => reject(new Error(`Failed to read file: ${f.name}`));
            });
        });

        try {
             const newFiles = await Promise.all(newFilesPromises);
             setImages(prev => [...prev, ...newFiles]);
        } catch (error) {
             console.error(error);
             alert("حدث خطأ أثناء رفع الصور.");
        }
        
        if (event.target) event.target.value = '';
    };

    const handleRemoveImage = (name: string) => {
        setImages(prev => prev.filter(img => img.name !== name));
    };
    
    const handleSend = async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        const userMessage: Message = { id: Date.now().toString(), text, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await geminiService.getSupportResponseWithContext(text, selectedProject, images);

            if (response.functionCalls && response.functionCalls.length > 0) {
                const call = response.functionCalls[0];
                if (call.name === 'escalateToEmailSupport') {
                    setEscalationSummary(call.args.summary || text);
                    setIsEscalationModalOpen(true);
                    const aiMessage: Message = { id: (Date.now() + 1).toString(), text: 'يبدو أنني لا أستطيع حل هذه المشكلة. هل تود تصعيد الطلب إلى فريق الدعم البشري؟', sender: 'ai' };
                    setMessages(prev => [...prev, aiMessage]);
                }
            } else {
                const aiMessage: Message = { id: (Date.now() + 1).toString(), text: response.text, sender: 'ai' };
                setMessages(prev => [...prev, aiMessage]);
            }

        } catch (e) {
            console.error(e);
            const aiMessage: Message = { id: (Date.now() + 1).toString(), text: 'عذراً، حدث خطأ أثناء معالجة طلبك.', sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartSupport = () => {
        if (!input.trim() && images.length === 0) {
            alert('الرجاء وصف المشكلة أو رفع صورة.');
            return;
        }
        setScreen('chat');
        handleSend();
    };

    const renderStartScreen = () => (
        <div className="p-4 md:p-8 h-full flex flex-col items-center justify-center animate-fade-in">
             <header className="flex-shrink-0 flex justify-between items-center w-full max-w-xl mb-8">
                 <div className="flex items-center gap-4">
                     <div className="flex items-center gap-3">
                        <SupportIcon className="w-12 h-12 text-indigo-400"/>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-100">الدعم الفني الذكي</h2>
                            <p className="text-slate-400 text-sm">صف مشكلتك وسيقوم الذكاء الاصطناعي بتحليلها وحلها.</p>
                        </div>
                     </div>
                 </div>
            </header>

             <div className="w-full max-w-xl mx-auto space-y-6">
                {/* File Upload Section */}
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                        ارفع لقطة شاشة (اختياري)
                    </label>
                    {images.length > 0 && (
                         <div className="grid grid-cols-3 gap-2">
                            {images.map(img => (
                                <div key={img.name} className="relative group aspect-square bg-slate-800 rounded-md border border-slate-700 overflow-hidden">
                                    <img src={img.url} alt={img.name} className="w-full h-full object-cover rounded-md"/>
                                    <button onClick={() => handleRemoveImage(img.name)} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                    )}
                    {images.length < 3 && (
                        <label htmlFor="support-file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2 text-sm w-full p-4 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-lg hover:border-indigo-500 hover:bg-slate-700/50 transition-all group">
                            <UploadIcon className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 transition-colors"/>
                            <span className="text-slate-400 group-hover:text-slate-200">انقر لرفع الصور أو اسحبها هنا</span>
                        </label>
                    )}
                    <input id="support-file-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                 </div>

                {/* Project Selector */}
                <div className="space-y-2">
                     <label className="text-sm font-medium text-slate-300">المشروع المتعلق بالمشكلة (اختياري)</label>
                     <div className="relative">
                        <select
                            value={selectedProject?.id || ''}
                            onChange={(e) => setSelectedProject(allProjects.find(p => p.id === e.target.value) || null)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white appearance-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                            <option value="">-- مشكلة عامة / لا يوجد مشروع --</option>
                            {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <BriefcaseIcon className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                     </div>
                </div>

                {/* Description Input */}
                 <div className="space-y-2">
                     <label className="text-sm font-medium text-slate-300">وصف المشكلة</label>
                     <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        rows={5}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
                        placeholder="اشرح ما الذي تحاول فعله، وما الخطأ الذي يظهر لك..."
                    />
                </div>

                <div className="pt-4 border-t border-slate-700">
                    <button onClick={handleStartSupport} disabled={(!input.trim() && images.length === 0)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                        <SparklesIcon className="w-5 h-5"/>
                        بدء التحليل
                    </button>
                </div>
             </div>
        </div>
    );

    const renderChatScreen = () => (
         <div className="flex flex-col h-full">
            <header className="flex-shrink-0 p-3 border-b border-slate-700 flex items-center justify-between bg-slate-800/90 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => setScreen('start')} className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white">
                        <ArrowLeftIcon className="w-5 h-5"/>
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-white">الدعم الفني</h2>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                           {selectedProject ? `مشروع: ${selectedProject.name}` : 'استشارة عامة'}
                        </p>
                    </div>
                </div>
                <button onClick={() => setIsEscalationModalOpen(true)} className="text-xs bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors">
                    تصعيد للدعم البشري
                </button>
            </header>
            
            <div className="flex-grow flex flex-col overflow-hidden bg-slate-900">
                 <div className="ai-chat-container flex-1 p-4 space-y-4 overflow-y-auto">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`ai-message-block ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                            <div className={`ai-message ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="ai-message-block bot"><div className="ai-message bot"><div className="typing-indicator"><span/><span/><span/></div></div></div>}
                    <div ref={messagesEndRef} />
                 </div>
                 
                 <div className="p-3 border-t border-slate-700 bg-slate-800">
                    {images.length > 0 && (
                        <div className="flex gap-2 mb-2 px-1 overflow-x-auto">
                            {images.map(img => (
                                <div key={img.name} className="relative w-12 h-12 flex-shrink-0 group">
                                    <img src={img.url} className="w-full h-full object-cover rounded-md border border-slate-600" alt="preview" />
                                    <button onClick={() => handleRemoveImage(img.name)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><CloseIcon className="w-3 h-3"/></button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="bg-slate-700 rounded-lg flex items-center p-1 gap-2">
                         <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-md" title="إرفاق صورة" disabled={images.length >= 3}>
                            <UploadIcon className="w-5 h-5"/>
                        </button>
                        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                        
                        <input 
                            type="text" 
                            value={input} 
                            onChange={e => setInput(e.target.value)} 
                            onKeyPress={e => e.key === 'Enter' && handleSend()} 
                            placeholder="اكتب رسالتك هنا..." 
                            className="flex-1 bg-transparent focus:outline-none px-2 text-white text-sm" 
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-md p-2 disabled:bg-slate-600 disabled:cursor-not-allowed">
                            <SendIcon className="w-5 h-5"/>
                        </button>
                    </div>
                 </div>
            </div>
         </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white">
            {screen === 'start' ? renderStartScreen() : renderChatScreen()}
            {currentUser && (
                <EmailEscalationModal 
                    isOpen={isEscalationModalOpen}
                    onClose={() => setIsEscalationModalOpen(false)}
                    project={selectedProject}
                    summary={escalationSummary}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};

export default SmartSupport;
