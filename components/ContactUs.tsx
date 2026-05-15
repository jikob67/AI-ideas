import React from 'react';
import { EXTERNAL_LINKS } from '../constants';

const ContactUs: React.FC = () => {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-100 mb-6 text-center">اتصل بنا</h1>
            <p className="text-center text-slate-400 mb-10">
                نحن هنا للمساعدة! إذا كان لديك أي أسئلة أو اقتراحات، فلا تتردد في التواصل معنا.
            </p>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 space-y-8">
                <div>
                    <h2 className="text-xl font-semibold text-indigo-400 mb-2">عبر البريد الإلكتروني</h2>
                    <p className="text-slate-300">
                        للاستفسارات العامة والدعم الفني، يمكنك مراسلتنا على:
                        <a href="mailto:jikob67@gmail.com" className="font-mono text-sky-400 hover:underline mr-2">
                            jikob67@gmail.com
                        </a>
                    </p>
                </div>
                
                <div>
                    <h2 className="text-xl font-semibold text-indigo-400 mb-2">تابعنا</h2>
                    <p className="text-slate-300 mb-4">
                        ابق على اطلاع بآخر التحديثات والميزات من خلال متابعة مدوناتنا:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <a href={EXTERNAL_LINKS.wordpress} target="_blank" rel="noopener noreferrer" className="bg-slate-700 hover:bg-slate-600 transition-colors p-4 rounded-lg flex-1 text-center font-semibold">
                            WordPress
                        </a>
                        <a href={EXTERNAL_LINKS.blogspot} target="_blank" rel="noopener noreferrer" className="bg-slate-700 hover:bg-slate-600 transition-colors p-4 rounded-lg flex-1 text-center font-semibold">
                            Blogspot
                        </a>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-indigo-400 mb-2">نموذج التواصل</h2>
                     <form className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-400 mb-1">الاسم</label>
                            <input type="text" id="name" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        </div>
                         <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1">البريد الإلكتروني</label>
                            <input type="email" id="email" className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-slate-400 mb-1">رسالتك</label>
                            <textarea id="message" rows={4} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"></textarea>
                        </div>
                         <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                            إرسال الرسالة
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;