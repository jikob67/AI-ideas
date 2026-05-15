import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { SparklesIcon, SpinnerIcon } from './Icons';

const AppealPage: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const [appealText, setAppealText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!appealText.trim()) {
            alert('الرجاء كتابة سبب الطعن.');
            return;
        }
        setIsSubmitting(true);
        // Simulate AI review process
        setTimeout(() => {
            console.log("Submitting appeal for:", currentUser?.email);
            console.log("Reason:", appealText);
            // In a real app, this would be a backend call.
            // We'll randomly decide the outcome for simulation.
            if (Math.random() > 0.3) { // 70% chance of success for demo
                setSubmissionStatus('success');
            } else {
                setSubmissionStatus('error');
            }
            setIsSubmitting(false);
        }, 2000);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4 text-white">
            <div className="w-full max-w-2xl mx-auto bg-slate-800/50 border border-red-500/50 rounded-2xl shadow-2xl p-8 relative">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-red-400">تم حظر حسابك</h1>
                    <p className="text-slate-400 mt-2">تم تعليق حسابك بسبب انتهاكات متكررة لشروط الخدمة.</p>
                </div>

                {submissionStatus === 'success' ? (
                    <div className="text-center p-8">
                        <h2 className="text-2xl font-bold text-green-400">تم استلام الطعن</h2>
                        <p className="text-slate-300 mt-2">يقوم نظام الذكاء الاصطناعي بمراجعة طلبك. سيتم إعلامك بالقرار عبر البريد الإلكتروني خلال 24-48 ساعة.</p>
                        <button onClick={logout} className="mt-6 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-lg">
                           العودة لصفحة تسجيل الدخول
                        </button>
                    </div>
                ) : submissionStatus === 'error' ? (
                     <div className="text-center p-8">
                        <h2 className="text-2xl font-bold text-red-400">فشل المراجعة التلقائية</h2>
                        <p className="text-slate-300 mt-2">للأسف، بعد المراجعة الأولية، تم تأييد قرار الحظر. إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الدعم مباشرة.</p>
                         <button onClick={logout} className="mt-6 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-lg">
                           العودة لصفحة تسجيل الدخول
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-slate-200">معلومات القضية (للتوضيح)</h3>
                            <div className="mt-2 p-4 bg-slate-700/50 rounded-lg text-sm space-y-2">
                                <p><strong className="text-slate-400">بريدك الإلكتروني:</strong> {currentUser?.email}</p>
                                <p><strong className="text-slate-400">عدد التحذيرات:</strong> {currentUser?.warnings || 2}/2</p>
                                <p><strong className="text-slate-400">آخر بلاغ:</strong> مشروع "تصميم غير لائق" (تم الإبلاغ عنه بواسطة ********)</p>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="appealText" className="block text-sm font-medium text-slate-300 mb-2">
                                تقديم طعن
                            </label>
                            <textarea
                                id="appealText"
                                value={appealText}
                                onChange={(e) => setAppealText(e.target.value)}
                                rows={6}
                                required
                                placeholder="اشرح لماذا تعتقد أن قرار الحظر كان خاطئًا. قدم أي أدلة أو توضيحات لدعم قضيتك."
                                className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                             <button onClick={logout} type="button" className="text-sm text-slate-400 hover:text-white">
                                تسجيل الخروج
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                                {isSubmitting ? 'جاري المراجعة بواسطة AI...' : 'إرسال الطعن للمراجعة'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AppealPage;