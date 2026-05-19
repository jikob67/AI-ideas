import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SparklesIcon, SendIcon, SpinnerIcon, RocketLaunchIcon } from './Icons';

const FlowDemo: React.FC = () => {
  const [prompt, setPrompt] = useState('أعطني فكرة لمشروع بسيط');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTriggerFlow = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      // Step 1: Button trigger -> Call Netlify Function (Mock endpoint)
      const response = await fetch('/api/netlify-function-mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'فشل الاتصال بالخادم');
      }

      // Step 2: Receive result back
      const data = await response.json();
      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="flow-demo-container" className="max-w-2xl mx-auto p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-600 rounded-lg">
          <RocketLaunchIcon className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">تجربة تدفق البيانات</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">النص المرسل (Prompt)</label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="أدخل سؤالك هنا..."
          />
        </div>

        <button
          id="trigger-flow-button"
          onClick={handleTriggerFlow}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-bold transition-all ${
            loading 
              ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98]'
          }`}
        >
          {loading ? (
            <>
              <SpinnerIcon className="w-5 h-5 animate-spin" />
              جاري معالجة الطلب...
            </>
          ) : (
            <>
              <SendIcon className="w-5 h-5" />
              تشغيل التدفق (Trigger Flow)
            </>
          )}
        </button>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3 text-slate-400">
            <SparklesIcon className="w-4 h-4" />
            <span className="text-sm font-medium">النتيجة المستلمة:</span>
          </div>
          <div 
            id="result-display"
            className="w-full min-h-[150px] bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-slate-200 whitespace-pre-wrap relative overflow-hidden"
          >
            {!result && !loading && (
              <span className="text-slate-600 italic">بانتظار تشغيل التدفق...</span>
            )}
            {result}
            {loading && (
              <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-700">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">مسار العملية الحالية:</h4>
        <div className="flex flex-col gap-2">
          <Step label="1. ضغطة الزر في الواجهة" active={loading || !!result} completed={!!result || loading} />
          <div className="w-px h-4 bg-slate-700 ml-3" />
          <Step label="2. إرسال الطلب إلى الخادم (Netlify Function Mock)" active={loading} completed={!!result} />
          <div className="w-px h-4 bg-slate-700 ml-3" />
          <Step label="3. استدعاء Google AI Studio (Gemini)" active={loading} completed={!!result} />
          <div className="w-px h-4 bg-slate-700 ml-3" />
          <Step label="4. رجوع النتيجة وعرضها للواجهة" active={!!result} completed={!!result} />
        </div>
      </div>
    </div>
  );
};

const Step: React.FC<{ label: string; active: boolean; completed: boolean }> = ({ label, active, completed }) => (
  <div className="flex items-center gap-3">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
      completed ? 'bg-green-600 border-green-500 text-white' : 
      active ? 'bg-indigo-600 border-indigo-500 text-white animate-pulse' : 
      'bg-slate-800 border-slate-700 text-slate-500'
    }`}>
      {completed ? '✓' : ''}
    </div>
    <span className={`text-xs ${completed ? 'text-green-400' : active ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>
      {label}
    </span>
  </div>
);

export default FlowDemo;
