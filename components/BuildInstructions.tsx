import React from 'react';
import { InformationCircleIcon } from './Icons';

export const BuildInstructions: React.FC = () => {
    return (
        <div className="bg-slate-800 p-4 rounded-xl text-sm text-slate-300 border border-slate-700 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
                <InformationCircleIcon className="w-5 h-5 text-indigo-400" /> تعليمات بناء التطبيق (APK / IPA)
            </h3>
            
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-white">1. بيئة Android Studio</h4>
                    <p>تستخدم لإنشاء ملفات APK / AAB</p>
                    <p className="font-mono bg-slate-900 p-2 rounded mt-1">./gradlew assembleRelease</p>
                    <p className="text-xs text-slate-400 mt-1">أو من داخل البرنامج: Build → Generate Signed Bundle / APK</p>
                </div>

                <div>
                    <h4 className="font-semibold text-white">2. بيئة Xcode (iOS فقط)</h4>
                    <p>تنتج ملفات IPA</p>
                    <p className="text-xs text-slate-400 mt-1">من خلال: Product → Archive → Distribute App</p>
                    <p className="text-xs text-slate-400 mt-1">❗ تحتاج جهاز Mac</p>
                </div>

                <div>
                    <h4 className="font-semibold text-white">3. Flutter</h4>
                    <p>تبني تطبيق واحد وتصدر APK + IPA</p>
                    <p className="font-mono bg-slate-900 p-2 rounded mt-1">flutter build apk</p>
                    <p className="font-mono bg-slate-900 p-2 rounded mt-1">flutter build ios</p>
                </div>
            </div>
        </div>
    );
};
