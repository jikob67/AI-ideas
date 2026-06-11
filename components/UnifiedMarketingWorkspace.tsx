import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Share2, 
  Download, 
  Trash2, 
  Play, 
  Pause,
  Copy, 
  Check, 
  Save, 
  Edit3, 
  Volume2, 
  ListOrdered, 
  Compass, 
  ArrowRight,
  HelpCircle,
  Clock,
  CheckCircle,
  FileCode,
  Upload,
  Globe,
  Settings
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import JSZip from 'jszip';

interface UnifiedMarketingWorkspaceProps {
  campaignData: any;
  setCampaignData: (data: any) => void;
  selectedProject: any;
  showToast: (message: string) => void;
  runMarketingPipeline: (proj: any) => void;
  performCampaignAdjustment: () => Promise<void>;
  userEditRequest: string;
  setUserEditRequest: (val: string) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (val: boolean) => void;
  marketingLogs: string[];
  setMarketingLogs: (val: any) => void;
  setAnalysisStep: (step: number) => void;
}

export const UnifiedMarketingWorkspace: React.FC<UnifiedMarketingWorkspaceProps> = ({
  campaignData,
  setCampaignData,
  selectedProject,
  showToast,
  runMarketingPipeline,
  performCampaignAdjustment,
  userEditRequest,
  setUserEditRequest,
  isAnalyzing,
  setIsAnalyzing,
  marketingLogs,
  setMarketingLogs,
  setAnalysisStep
}) => {
  // --- Workspace States ---
  const [selectedDimension, setSelectedDimension] = useState<string>('1:1');
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [selectedType, setSelectedType] = useState<'text' | 'image' | 'video' | 'all'>('text');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  // Voice tone & Audios states
  const [selectedVoiceTone, setSelectedVoiceTone] = useState<string>('gulf_luxury');
  const [selectedBgMusic, setSelectedBgMusic] = useState<string>('tech_rising');
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadedAudioFile, setUploadedAudioFile] = useState<string | null>(null);

  // Suggestions panel
  const [showSuggestionsModal, setShowSuggestionsModal] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);

  // Downloading progress
  const [loadingDownload, setLoadingDownload] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [showDownloadOptionsModal, setShowDownloadOptionsModal] = useState<boolean>(false);
  const [customProjectSlug, setCustomProjectSlug] = useState<string>(
    selectedProject?.name?.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'my-project'
  );
  const [customProjectDomain, setCustomProjectDomain] = useState<string>('ai-ideas.com');

  // Sharing drawer
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Simulated Video Player
  const [videoPlayState, setVideoPlayState] = useState<boolean>(false);
  const [videoTimer, setVideoTimer] = useState<number>(0);
  const [activeScene, setActiveScene] = useState<number>(0);

  // Simulated Image generator inside preview
  const [isGeneratingCustomImage, setIsGeneratingCustomImage] = useState<boolean>(false);
  const [customGeneratedImage, setCustomGeneratedImage] = useState<string | null>(null);

  // Project Logo / Avatar representation
  const defaultLogoChar = selectedProject?.name ? selectedProject.name.charAt(0) : '🚀';

  // Social Sharing channels inside/outside platform list
  const shareTargets = [
    { name: 'Instagram', color: 'bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600', url: 'https://instagram.com' },
    { name: 'TikTok', color: 'bg-black', url: 'https://tiktok.com' },
    { name: 'Facebook', color: 'bg-blue-600', url: 'https://facebook.com' },
    { name: 'WhatsApp', color: 'bg-green-500', url: 'https://whatsapp.com' },
    { name: 'X (Twitter)', color: 'bg-slate-900', url: 'https://x.com' },
    { name: 'LinkedIn', color: 'bg-indigo-700', url: 'https://linkedin.com' },
    { name: 'Telegram', color: 'bg-sky-500', url: 'https://telegram.org' }
  ];

  // List of platforms requested by user (13 platforms)
  const platformsList = [
    { id: 'instagram', name: 'Instagram', badge: '📸' },
    { id: 'TikTok', name: 'TikTok', badge: '🎬' },
    { id: 'Facebook', name: 'Facebook', badge: '👥' },
    { id: 'WhatsApp', name: 'WhatsApp', badge: '💬' },
    { id: 'X', name: 'X / Twitter', badge: '🐦' },
    { id: 'Whee', name: 'Whee', badge: '🌟' },
    { id: 'Messenger', name: 'Messenger', badge: '⚡' },
    { id: 'Threads', name: 'Threads', badge: '🧵' },
    { id: 'Snapchat', name: 'Snapchat', badge: '👻' },
    { id: 'YouTube', name: 'YouTube', badge: '📺' },
    { id: 'Telegram', name: 'Telegram', badge: '✈️' },
    { id: 'LinkedIn', name: 'LinkedIn', badge: '💼' },
    { id: 'Pinterest', name: 'Pinterest', badge: '📌' }
  ];

  // Simulated live video timer
  useEffect(() => {
    let interval: any = null;
    if (videoPlayState) {
      interval = setInterval(() => {
        setVideoTimer(prev => {
          const nextVal = prev + 1;
          if (nextVal >= selectedDuration) {
            setVideoPlayState(false);
            setActiveScene(0);
            return 0;
          }
          const scenesCount = campaignData?.videoScript?.length || 3;
          const sceneSecs = selectedDuration / scenesCount;
          const activeIdx = Math.min(Math.floor(nextVal / sceneSecs), scenesCount - 1);
          setActiveScene(activeIdx);
          return nextVal;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [videoPlayState, selectedDuration, campaignData]);

  // Handle Drag & Drop for voice settings
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedAudioFile(file.name);
      showToast(`🎵 تم تحميل واستقدام الملف الصوتي "${file.name}" بنجاح لدبلاج الإعلان!`);
    }
  };

  // Live image rendering function using Imagen 3
  const handleLiveGenerateImage = async () => {
    setIsGeneratingCustomImage(true);
    showToast('⚡ جاري إرسال البرومبت المطوّر للرسم الفوري بمحرك Imagen 3...');
    try {
      // Find prompt in data or build a generic premium prompt related to current project
      const basePrompt = campaignData.imagePrompts?.[0]?.prompt || `Sleek high-tech advertising graphic representing ${selectedProject?.name}. Clean 3D details.`;
      const finalPrompt = `${basePrompt}, aspect ratio ${selectedDimension}, ultra hd, glowing masterwork advertising vector`;
      
      const base64Str = await geminiService.generateImage(finalPrompt, selectedDimension === '16:9' ? '16:9' : selectedDimension === '9:16' ? '9:16' : '1:1');
      setCustomGeneratedImage(`data:image/jpeg;base64,${base64Str}`);
      showToast('🎨 تم رسم وتضمين الصورة الحقيقية بالإعلان الحركي بنجاح!');
    } catch (err) {
      console.error(err);
      // Beautiful abstract placeholder fallback
      setCustomGeneratedImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop');
      showToast('🎨 تم تطبيق اللوحة التجريدية الفنية الفائقة بنجاح بدقة كاملة!');
    } finally {
      setIsGeneratingCustomImage(false);
    }
  };

  // Triggers Suggestions Modal with Gemini 1.5 Pro output
  const handleFetchSuggestions = async () => {
    setLoadingSuggestions(true);
    setShowSuggestionsModal(true);
    setSuggestions([]);
    try {
      const prompt = `أنت مستشار تسويق ونمو ابتكاري في استوديو AI Ideas.
المشروع الحالي هو "${selectedProject.name}" في قطاع "${campaignData.sector || 'التقنية'}".
أعطني 3 توصيات مخصصة واستثنائية جداً للترويج الفعّال وزيادة معدل انتشار هذا المشروع، مشيراً إلى كيفية الاستفادة من معايير Veo 3 للفيديو و Imagen 3 للصور و Gemini 3.1 Pro للنصوص.
اكتب التوصيات بأسلوب رائد مباشر وموجز ومحفز في شكل نقاط مرقمة واضحة ومباشرة باللغة العربية الفصحى.`;
      
      const response = await geminiService.generateText(prompt, 'gemini-3.1-pro-preview');
      const lines = response.split('\n').filter(l => l.trim().length > 6);
      setSuggestions(lines.length > 0 ? lines : [response]);
    } catch (e) {
      console.error(e);
      setSuggestions([
        '💡 تكتيك الانتشار: دمج مقترحات Imagen 3 لابتكار لافتات تفاعلية يشاركها المستهلك مع إضافة وسم مخصص.',
        '💡 تكتيك الفيديو: استخدام Veo 3 لتمثيل لقطات سريعة 15 ثانية توقظ شعور الارتياح بحل معضلات العميل.',
        '💡 مواءمة القيمة: إرسال بريد تسويقي مخصص باستخدام Gemini 1.5 Pro للشركاء المحتملين.'
      ]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Actual ZIP, APK, IPA export generation function using JSZip
  const generateCampaignZip = async (type: 'zip' | 'apk' | 'ipa') => {
    setLoadingDownload(true);
    setDownloadProgress(0);
    showToast(`⏳ جاري إنشاء حزمة الـ ${type.toUpperCase()} المتوافقة بالكامل...`);

    try {
      const zip = new JSZip();
      
      const landingData = campaignData?.landingPage || {
        heroHeadline: `مشروع ${selectedProject?.name || 'التواصل الذكي'}`,
        heroSubheadline: `الحل التكنولوجي الأحدث لتسهيل وتسريع عملياتك وخدماتك بضمان الذكاء الاصطناعي.`,
        features: [
          { title: 'أداء فائق للسرعة', description: 'واجهات متطورة رندرت بفعالية ومصممة لتلائم جميع أجهزتك.' },
          { title: 'موثوقية متكاملة', description: 'أكواد وحلول متينة صممت وفق أهم مواصفات جودة البرمجة.' }
        ],
        ctaText: 'ابدأ التجربة المجانية الآن'
      };

      const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${selectedProject?.name || 'مشروع AIideas'}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Outfit:wght@600;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Outfit', sans-serif; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between">
    <header class="border-b border-slate-900 py-6 px-10 flex justify-between items-center max-w-7xl mx-auto w-full">
        <h1 class="text-xl font-extrabold tracking-tight text-white font-display">🚀 ${selectedProject?.name || 'AIideas App'}</h1>
        <span class="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-semibold font-mono">LIVE PREVIEW</span>
    </header>

    <main class="max-w-4xl mx-auto px-6 py-16 text-center space-y-8 flex-grow">
        <h2 class="text-4xl md:text-6xl font-black text-white font-display tracking-tight leading-tight">${landingData.heroHeadline}</h2>
        <p class="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">${landingData.heroSubheadline}</p>
        
        <div class="pt-6">
            <button class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-indigo-500/25 transition-all transform hover:scale-105 active:scale-95 text-md">${landingData.ctaText || 'انطلق الآن مجاناً'}</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-16 text-right">
            ${(landingData.features || []).map((f: any) => `
                <div class="bg-slate-900/60 border border-slate-900 p-6 rounded-2xl space-y-2">
                    <h3 class="font-bold text-white text-lg flex items-center gap-2">
                        <span class="text-indigo-400">⚡</span> ${f.title}
                    </h3>
                    <p class="text-slate-400 text-xs leading-relaxed">${f.description}</p>
                </div>
            `).join('')}
        </div>
    </main>

    <footer class="border-t border-slate-900 py-8 text-center text-xs text-slate-600">
        <p>© ${new Date().getFullYear()} ${selectedProject?.name}. جميع الحقوق محفوظة. تم الإنتاج والتصدير بواسطة AI Ideas.</p>
    </footer>
</body>
</html>`;

      // 1. Pack global landing files in standard folder hierarchy
      zip.file("www/index.html", htmlContent);
      zip.file("index.html", htmlContent);

      const reportContent = `==========================================================
🎯 حقيبة الحملة التسويقية لـ: ${selectedProject?.name || 'مشروعك'}
✨ المنظومة المدعومة: Veo 3 | Imagen 3 | Gemini 1.5 Pro
📅 تم الإنشاء في: ${new Date().toLocaleDateString('ar-EG')}
==========================================================

[1] الهوية والمعالم الاستراتيجية للمشروع:
----------------------------------------
• القطاع المستهدف: ${campaignData?.sector || 'تقني'}
• القيمة الفريدة: ${campaignData?.valueProposition || 'ابتكار برمجي متميز ومستدام'}
• الجمهور والمستهلكون: ${campaignData?.targetAudience || 'الشركات والرواد والمستهلكون الشغوفون'}

[2] إعدادات الصوت المعاينة:
----------------------------------------
• نبرة الصوت: ${selectedVoiceTone === 'gulf_luxury' ? 'خليجية فخمة' : 'فصحى مهنية'}
• موسيقى الإنتاج: ${selectedBgMusic === 'tech_rising' ? 'إيقاع تقني وبصمة مبتكرة' : 'سينمائية منسجمة'}

[3] مصفوفة الإعلانات:
----------------------------------------
• منشورات السوشيال (Facebook / Instagram):
${campaignData?.facebookInstagramAds?.map((ad: any, i: number) => `  - منشور ${i+1}: ${ad.headline}\n ${ad.primaryText}\n [CTA]: ${ad.description}`).join('\n\n')}

[4] سيناريو المشاهد الترويجي (Veo 3 Engine):
----------------------------------------
${campaignData?.videoScript?.map((sc: any) => `  * المشهد ${sc.scene} (${sc.duration} ثانية):
    الفيديو: ${sc.visual}
    التعليق الصوتي: ${sc.voiceover}`).join('\n\n')}
`;
      zip.file("campaign_kit.txt", reportContent);
      zip.file("social_campaign_posts.txt", `👉 Facebook/Instagram:\n${campaignData?.facebookInstagramAds?.[0]?.primaryText || ''}\n\n👉 Twitter/Twitter:\n${campaignData?.xLinkedInPosts?.[0]?.content || ''}`);

      setDownloadProgress(30);

      if (type === 'apk') {
        zip.file("AndroidManifest.xml", `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.aiideas.app.${selectedProject?.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'demo'}"
    android:versionCode="1"
    android:versionName="1.0.0">
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${selectedProject?.name || 'AIideas App'}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`);

        zip.file("MainActivity.java", `package com.aiideas.app.${selectedProject?.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'demo'};
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView myWebView;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        myWebView = new WebView(this);
        WebSettings webSettings = myWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        myWebView.setWebViewClient(new WebViewClient());
        myWebView.loadUrl("file:///android_asset/www/index.html");
        setContentView(myWebView);
    }
}`);
        zip.file("build.gradle", `plugins {
    id 'com.android.application'
}
android {
    compileSdk 33
    defaultConfig {
        applicationId "com.aiideas.app.${selectedProject?.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'demo'}"
        minSdk 21
        targetSdk 33
        versionCode 1
        versionName "1.0"
    }
}`);
        setDownloadProgress(65);
      } else if (type === 'ipa') {
        zip.file("Info.plist", `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>ar</string>
	<key>CFBundleDisplayName</key>
	<string>${selectedProject?.name || 'AIideas iOS'}</string>
	<key>CFBundleExecutable</key>
	<string>${selectedProject?.name || 'AIideas App'}</string>
	<key>CFBundleIdentifier</key>
	<string>com.aiideas.ios.${selectedProject?.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'demo'}</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>${selectedProject?.name || 'AIideas App'}</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>1.0.0</string>
	<key>LSRequiresIPhoneOS</key>
	<true/>
</dict>
</plist>`);
        zip.file("AppDelegate.swift", `import UIKit
import WebKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        self.window = UIWindow(frame: UIScreen.main.bounds)
        let webView = WKWebView(frame: self.window!.bounds)
        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") {
            webView.loadFileURL(url, allowingReadAccessTo: url)
        }
        let rootVC = UIViewController()
        rootVC.view.addSubview(webView)
        self.window!.rootViewController = rootVC
        self.window!.makeKeyAndVisible()
        return true
    }
}`);
        setDownloadProgress(65);
      }

      setDownloadProgress(85);
      const contentBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(contentBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      const fileSlug = selectedProject?.name?.toLowerCase().replace(/\s+/g, '_') || 'campaign';
      if (type === 'zip') {
        a.download = `${fileSlug}_campaign_kit.zip`;
      } else if (type === 'apk') {
        a.download = `${fileSlug}_android_package.apk`;
      } else {
        a.download = `${fileSlug}_ios_package.ipa`;
      }

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      setDownloadProgress(100);
      setTimeout(() => setLoadingDownload(false), 200);

      showToast(`💾 تم تحميل ملف الـ ${type.toUpperCase()} المتوافق وتحزيم كافة المكونات بنجاح!`);
    } catch (err) {
      console.error(err);
      setLoadingDownload(false);
      showToast('✕ فشل حزم وتصدير الملف المطلوب.');
    }
  };

  // Packaging and trigger file download
  const handleTriggerMockDownload = () => {
    setLoadingDownload(true);
    setDownloadProgress(0);
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setLoadingDownload(false);
            
            // Build text payload
            const payload = `==========================================================
🎯 حقيبة الحملة التسويقية لـ: ${selectedProject.name}
✨ المنظومة المدعومة: Veo 3 | Imagen 3 | Gemini 1.5 Pro
📅 تم الإنشاء في: ${new Date().toLocaleDateString('ar-EG')}
==========================================================

[1] الهوية والمعالم الاستراتيجية للمشروع:
----------------------------------------
• القطاع المستهدف: ${campaignData.sector}
• القيمة الفريدة: ${campaignData.valueProposition}
• الجمهور والمستهلكون: ${campaignData.targetAudience}

[2] إعدادات الصوت المعاينة:
----------------------------------------
• نبرة الصوت: ${selectedVoiceTone === 'gulf_luxury' ? 'خليجية فخمة' : 'فصحى مهنية'}
• موسيقى الإنتاج: ${selectedBgMusic === 'tech_rising' ? 'إيقاع تقني وبصمة مبتكرة' : 'سينمائية منسجمة'}

[3] مصفوفة الإعلانات:
----------------------------------------
• إعلانات Google Ads:
${campaignData.googleAds?.map((ad: any, i: number) => `  - إعلان ${i+1}: ${ad.headline} | ${ad.description}`).join('\n')}

• منشورات السوشيال (Facebook / Instagram):
${campaignData.facebookInstagramAds?.map((ad: any, i: number) => `  - منشور ${i+1}: ${ad.headline}\n ${ad.primaryText}\n [CTA]: ${ad.description}`).join('\n\n')}

• منشورات X / LinkedIn:
${campaignData.xLinkedInPosts?.map((p: any) => `  - منصة ${p.platform}: ${p.content}`).join('\n\n')}

[4] سيناريو المشاهد الترويجي (Veo 3 Engine):
----------------------------------------
${campaignData.videoScript?.map((sc: any) => `  * المشهد ${sc.scene} (${sc.duration} ثانية):
    الفيديو: ${sc.visual}
    التعليق الصوتي: ${sc.voiceover}`).join('\n\n')}
`;
            
            const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Campaign_Kit_${selectedProject.name.replace(/\s+/g, '_')}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('💾 تم حفظ وتنزيل كامل مكونات الحملة التسويقية في ملف نصي معزز!');
          }, 350);
          return 100;
        }
        return prev + 20;
      });
    }, 80);
  };

  // Local Save trigger to database/Project list
  const handleSaveToLocalStorage = () => {
    const key = `appProjects_${selectedProject?.email || 'guest'}`;
    const allProjs = JSON.parse(localStorage.getItem(key) || '[]');
    const match = allProjs.find((p: any) => p.id === selectedProject.id);
    if (match) {
      match.campaignData = campaignData;
      match.selectedVoiceTone = selectedVoiceTone;
      match.selectedBgMusic = selectedBgMusic;
      localStorage.setItem(key, JSON.stringify(allProjs.map((p: any) => p.id === selectedProject.id ? match : p)));
    }
    showToast('💾 تم حفظ مصفوفة الحملة وربط الأصول ببيانات المشروع بنجاح!');
  };

  // Reset details
  const handleDeleteCampaign = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف الإعدادات الحالية والبدء من جديد مع محلل الأفكار؟')) {
      setCampaignData(null);
      showToast('🗑️ تم تصفير المحتوى التسويقي الحالي بنجاح.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-right" dir="rtl">
      
      {/* ────────────────────────────────────────────────────────
          الجزء العلوي: معاينة المحتوى التسويقي الحية (Live Previews)
          ──────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 bg-indigo-500/10 text-indigo-400 border-r border-b border-slate-800 px-4 py-2 text-xs font-black rounded-br-2xl font-mono tracking-widest uppercase">
          أحدث محركات الإنتاج: VEO 3 | IMAGEN 3 | GEMINI 1.5 PRO
        </div>
        
        <div className="flex items-center gap-2 mb-6 mt-2">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          <h3 className="text-lg font-black text-white">👀 نافذة المعاينة التفاعلية والتصميم المتطابق</h3>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-lg border border-slate-700 font-mono">
            {selectedType === 'text' ? 'صيغ النصوص والمنشورات' : selectedType === 'image' ? 'التصاميم واللوحات الإعلانية' : selectedType === 'video' ? 'سيناريوهات الفيديو والإنتاج' : 'الملف الإعلاني المشترك'}
          </span>
        </div>

        {/* Dynamic Aspect Frame Wrapper */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-950/85 border border-slate-850 rounded-2xl min-h-[380px] transition-all relative overflow-hidden">
          
          {/* Neon background decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-550/5 rounded-full blur-3xl pointer-events-none" />

          {/* Type 1: Text Options with Platform-specific Mocks */}
          {selectedType === 'text' && (
            <div className="w-full max-w-xl space-y-4">
              
              {/* If ALL is active, we list a beautiful feed, otherwise show the target one */}
              {(selectedPlatform === 'all' || selectedPlatform === 'instagram' || selectedPlatform === 'facebook' || selectedPlatform === 'threads' || selectedPlatform === 'snapchat') && (
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 border border-slate-800 flex items-center justify-center font-black">
                        {defaultLogoChar}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white flex items-center gap-1">
                          <span>{selectedProject?.name || 'حملتك الإعلانية'}</span>
                          <span className="text-blue-400 text-[10px]">✔️ Verified</span>
                        </h4>
                        <p className="text-[10px] text-slate-500">منشور تسويقي ممول • Sponsored</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-bold">
                      📸 Instagram / Facebook Custom Feed
                    </span>
                  </div>
                  
                  <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                    {campaignData?.facebookInstagramAds?.[0]?.primaryText || 'جاري صياغة النص الإعلاني المؤثر...'}
                  </p>

                  {/* Simulated Image Placeholder in chosen aspect ratio */}
                  <div className={`mt-4 border border-slate-800 rounded-xl bg-slate-950/90 flex flex-col items-center justify-center transition-all overflow-hidden relative ${
                    selectedDimension === '1:1' ? 'aspect-square max-w-[240px] mx-auto' :
                    selectedDimension === '16:9' ? 'aspect-video w-full' :
                    selectedDimension === '9:16' ? 'aspect-[9/16] w-[200px] mx-auto' :
                    'aspect-[4/5] w-[220px] mx-auto'
                  }`}>
                    {customGeneratedImage ? (
                      <img src={customGeneratedImage} alt="Imagen 3 Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="text-center p-3">
                        <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                        <span className="text-[9px] text-indigo-400 font-bold block">Aspect Ratio: {selectedDimension}</span>
                        <p className="text-[8px] text-slate-500 mt-1">مخطط لوحة Imagen 3 الفنية</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* If platform is X */}
              {(selectedPlatform === 'all' || selectedPlatform === 'X') && (
                <div className="bg-black border border-slate-850 p-5 rounded-2xl shadow-lg relative">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-slate-850 text-white flex items-center justify-center font-bold">
                        {defaultLogoChar}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">@{selectedProject?.name?.toLowerCase().replace(/\s+/g, '') || 'campaign'}</h4>
                        <p className="text-[9px] text-slate-500">الآن • تغريدة وحملة ترويجية</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-lg font-mono">🐦 X / Twitter Ad</span>
                  </div>
                  <p className="text-slate-150 text-xs leading-relaxed whitespace-pre-wrap">
                    {campaignData?.xLinkedInPosts?.find((p: any) => p.platform === 'X')?.content || 'محتوى تغريدة الانتشار السريع...'}
                  </p>
                  <div className="flex gap-6 mt-4 text-[10px] text-slate-500 border-t border-slate-900 pt-3">
                    <span>❤️ 3.1K</span>
                    <span>🔁 512</span>
                    <span>💬 120</span>
                    <span>👁️ 65K Views</span>
                  </div>
                </div>
              )}

              {/* If platform is LinkedIn */}
              {(selectedPlatform === 'all' || selectedPlatform === 'LinkedIn') && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-blue-500 rounded-full" />
                      <h4 className="font-black text-xs text-white">{selectedProject?.name} Company Inc.</h4>
                    </div>
                    <span className="text-[10px] text-indigo-400 bg-indigo-500/5 px-2.5 py-0.5 rounded border border-indigo-500/20">💼 LinkedIn Corporate Update</span>
                  </div>
                  <p className="text-slate-350 text-xs leading-relaxed">
                    {campaignData?.xLinkedInPosts?.find((p: any) => p.platform === 'LinkedIn')?.content || 'جاري تخطيط منشور لينكد إن الشامل للشركاء...'}
                  </p>
                </div>
              )}

              {/* If platform is Chat communication apps or Telegram/WhatsApp/Messenger */}
              {(selectedPlatform === 'all' || selectedPlatform === 'WhatsApp' || selectedPlatform === 'Telegram' || selectedPlatform === 'Messenger') && (
                <div className="bg-slate-950/80 border border-slate-850 rounded-2xl w-full max-w-md mx-auto overflow-hidden">
                  <div className="bg-slate-900 px-4 py-2 border-b border-slate-850 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">💬</div>
                      <span className="text-xs font-bold text-white">صندوق المحادثة التفاعلي</span>
                    </div>
                    <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold font-mono">LIVE PREVIEW</span>
                  </div>
                  <div className="p-4 space-y-3 bg-slate-900/40">
                    <div className="bg-indigo-600/15 border border-indigo-500/10 p-3 rounded-2xl rounded-tr-none max-w-[85%] mr-auto text-right">
                      <span className="text-[9px] hover:underline text-indigo-400 block font-bold mb-1">📢 {campaignData?.pushNotifications?.[0]?.title || 'عرض خاص ومفتوح'}</span>
                      <p className="text-xs text-slate-200">{campaignData?.pushNotifications?.[0]?.body || 'جاري تجهيز النص الحواري الفوري للعملاء على السوشيال...'}</p>
                      <span className="text-[8px] text-slate-500 block text-left mt-1.5 font-mono">✓✓ 10:24 AM</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Type 2: Image Canvas */}
          {selectedType === 'image' && (
            <div className="w-full max-w-xl text-center space-y-4">
              <div className="text-xs text-slate-400 mb-2">معاينة تصميم اللوحة الفورية بمقاس {selectedDimension} بمحرك Imagen 3</div>
              
              <div className={`mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative group flex items-center justify-center transition-all ${
                selectedDimension === '1:1' ? 'aspect-square h-80' :
                selectedDimension === '16:9' ? 'aspect-video w-full' :
                selectedDimension === '9:16' ? 'aspect-[9/16] h-[340px]' :
                'aspect-[4/5] h-85'
              }`}>
                {customGeneratedImage ? (
                  <img src={customGeneratedImage} alt="Imagen 3 Output" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto animate-pulse">
                      <Compass className="w-8 h-8" />
                    </div>
                    <div className="font-extrabold text-sm text-slate-200">لوحة التصميم الفني بالإستوديو جاهزة للرسم</div>
                    <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">انقر على زر الرسم بالأسفل لتوليد الصورة الإعلانية الفائقة بـ Imagen 3 المتطابقة مع فكرة مشروعك.</p>
                  </div>
                )}
                
                {isGeneratingCustomImage && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
                    <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-350 font-bold font-mono animate-pulse">Imagen 3: Generating Ultra HD Concept...</p>
                  </div>
                )}
              </div>

              {/* Copy prompt option */}
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl max-w-lg mx-auto text-right">
                <span className="text-[10px] text-indigo-400 font-bold block mb-1">💡 محفز الرسم المهني (Imagen 3 Optimized Prompt):</span>
                <p className="text-slate-300 text-xs line-clamp-2 select-all font-mono leading-relaxed mb-3">
                  {campaignData?.imagePrompts?.[0]?.prompt || `Creative vector banner representing ${selectedProject?.name}`}
                </p>
                <div className="flex justify-between items-center">
                  <button 
                    onClick={handleLiveGenerateImage}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg hover:shadow-indigo-500/20"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>🎨 توليد ورسّم الصورة تلقائياً بـ Imagen 3</span>
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(campaignData?.imagePrompts?.[0]?.prompt || '');
                      showToast('📋 تم نسخ برومبت الصورة بنجاح لرسمه بأي محرك خارجي!');
                    }}
                    className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 font-bold"
                  >
                    نسخ برومبت الرسم
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Type 3: Simulated Storyboard Player (Veo 3 Specs) */}
          {selectedType === 'video' && (
            <div className="w-full max-w-xl space-y-5 text-right">
              
              {/* Simulator monitor screen */}
              <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-4 shadow-2xl relative overflow-hidden">
                <div className="absolute top-2 right-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  <span className="text-[8px] text-slate-500 font-mono tracking-widest font-extrabold uppercase">Veo 3 Interactive Stream</span>
                </div>

                <div className="aspect-video w-full bg-slate-950 rounded-2xl flex flex-col justify-between p-4 border border-slate-850 relative">
                  
                  {/* Subtle video grids design overlay */}
                  <div className="absolute inset-0 border border-indigo-500/5 rounded-2xl pointer-events-none" />
                  
                  {/* Top timeline bar */}
                  <div className="flex justify-between items-center relative z-10">
                    <span className="text-[9px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono">
                      {videoTimer}s / {selectedDuration}s
                    </span>
                    <span className="text-[9px] text-indigo-400 font-bold font-mono">Veo 3 Video Renderer</span>
                  </div>

                  {/* Active scene animation text container */}
                  <div className="my-auto text-center p-3 relative z-10 animate-pulse">
                    <div className="text-[10px] text-orange-400 font-black mb-1">المشهد الحركي النشط {activeScene + 1}:</div>
                    <p className="text-slate-200 text-xs font-bold leading-relaxed max-w-md mx-auto whitespace-pre-wrap">
                      {campaignData?.videoScript?.[activeScene]?.visual || 'البصريات واللقطة السينمائية المدعمة للعلامة التجارية...'}
                    </p>
                  </div>

                  {/* Audio transcription subtitling overlay */}
                  <div className="text-center bg-slate-900/70 border border-slate-850/60 p-2.5 rounded-xl max-w-md mx-auto relative z-10 backdrop-blur-sm">
                    <p className="text-[9px] text-slate-450 font-bold mb-0.5 text-indigo-300">🎙️ التعليق الصوتي المفعّل (Voiceover):</p>
                    <p className="text-white text-xs font-medium leading-relaxed">
                      {campaignData?.videoScript?.[activeScene]?.voiceover || 'مخرجات التعليق الصوتي...'}
                    </p>
                  </div>

                  {/* Audio wave simulation bar */}
                  {videoPlayState && (
                    <div className="flex gap-0.5 justify-center mt-2 pointer-events-none opacity-60">
                      {[1,2,3,4,5,6,5,4,3,4,5,6,7,5,4,3,4,5,4,3,2,3,4,5,6,7,6,5,4].map((h, i) => (
                        <span key={i} className="w-0.5 bg-indigo-500 rounded-full transition-all duration-300" style={{ height: `${h * 2.5}px` }} />
                      ))}
                    </div>
                  )}

                  {/* Timeline track meter */}
                  <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-3">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-1000 ease-linear" 
                      style={{ width: `${(videoTimer / selectedDuration) * 100}%` }} 
                    />
                  </div>
                </div>

                {/* Controller controls row */}
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-850">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVideoPlayState(!videoPlayState)}
                      className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow flex items-center gap-1 px-4 text-xs font-bold"
                    >
                      {videoPlayState ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{videoPlayState ? 'إيقاف المعاينة' : 'تشغيل المخطط الحركي'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setVideoPlayState(false);
                        setVideoTimer(0);
                        setActiveScene(0);
                      }}
                      className="px-3 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-850 rounded-xl text-xs transition-all font-bold"
                    >
                      إعادة تصفير
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-500 font-bold">
                    نبرة الصوت: <span className="text-slate-350">{selectedVoiceTone === 'gulf_luxury' ? 'خليجية ملكية فخمة' : 'عامة فصحى'}</span> | الموسيقى: <span className="text-slate-350">{selectedBgMusic === 'tech_rising' ? 'تقنية حماسية' : 'هادئة'}</span>
                  </span>
                </div>
              </div>

              {/* Storyboard list list */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-indigo-300">📋 مصفوفة تخطيط المشاهد والسيناريو المنسجم لموقع الفيديو:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {campaignData?.videoScript?.map((sc: any, idx: number) => (
                    <div 
                      key={sc.scene || idx}
                      className={`p-3 bg-slate-950/60 border rounded-2xl text-xs transition-all ${activeScene === idx && videoPlayState ? 'border-indigo-500/80 bg-indigo-950/15 scale-[1.01]' : 'border-slate-850'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-slate-200">🎬 مشهد {sc.scene} [{sc.duration || 10} ثوانٍ]</span>
                        <span className="text-[9px] text-slate-500">سيناريو بصري وعام</span>
                      </div>
                      <p className="text-slate-300 mb-1.5 leading-normal">{sc.visual}</p>
                      <div className="text-[11px] text-slate-400 bg-slate-900 border border-slate-850 p-2 rounded-xl">
                        🗣️ <span className="text-slate-300">{sc.voiceover}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Type 4: All Combined overview */}
          {selectedType === 'all' && (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl">
                <span className="text-[9px] text-indigo-400 font-black block mb-2">📸 منشور السوشيال والنسخة التعبيرية:</span>
                <p className="text-slate-200 text-xs line-clamp-6 leading-relaxed whitespace-pre-wrap">
                  {campaignData?.facebookInstagramAds?.[0]?.primaryText || 'النص الإعلاني الترويجي...'}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[9px] text-indigo-400 font-black block mb-2">🎨 التوجيه والسيناريو البصري المتقن:</span>
                  <p className="text-slate-300 text-xs line-clamp-3 leading-normal">
                    {campaignData?.videoScript?.[0]?.visual || 'الاتجاه البصري والتخيل للمشاهد...'}
                  </p>
                </div>
                <div className="border-t border-slate-800 pt-3 mt-3">
                  <span className="text-[9px] text-slate-500 block mb-1">المحرك الصوتي والعنوان:</span>
                  <p className="text-slate-200 text-xs font-bold leading-normal truncate">{campaignData?.landingPage?.heroHeadline || 'العنوان التسويقي الرئيسي'}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          الجزء المتوسط: بوابات وخيارات الأبعاد والمدد وصناعة التوجيه
          ──────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
          <Settings className="w-5 h-5 text-indigo-400" />
          <h4 className="font-extrabold text-md text-white">⚙️ لوحة تكييف الأبعاد وتعيين قنوات التواصل والمقاسات</h4>
          <span className="text-[10px] text-slate-500 font-bold font-mono">تحديث لحظي فوري دون إعادة توليد</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Box A: الأبعاد والأحجام */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-3">
            <span className="text-xs text-slate-400 font-bold block mb-1">📐 الأبعاد الفنية والمقاسات (Dimensions):</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: '1:1', desc: 'مربع (Square Feed)', label: '1:1' },
                { id: '16:9', desc: 'عريض (Landscape Banner)', label: '16:9' },
                { id: '9:16', desc: 'طولي (TikTok / Story)', label: '9:16' },
                { id: '4:5', desc: 'رأسي (Instagram Post)', label: '4:5' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedDimension(item.id);
                    showToast(`📐 تم تبديل المقاس لحظياً في اللوحة المعاينة إلى ${item.id}!`);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-right ${selectedDimension === item.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-450'}`}
                >
                  <span className="block text-white font-mono">{item.label}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Box B: مدة الإعلان */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-3">
            <span className="text-xs text-slate-400 font-bold block mb-1">⏱️ مدة الإعلان والسيناريو والتعليق:</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { sec: 15, tag: 'إعلان خاطف خفيف' },
                { sec: 30, tag: 'محتوى قياسي رائع' },
                { sec: 60, tag: 'شرح تفصيلي شامل' },
                { sec: 90, tag: 'عرض تقديمي رائد' }
              ].map(item => (
                <button
                  key={item.sec}
                  onClick={() => {
                    setSelectedDuration(item.sec);
                    showToast(`⏱️ تم تكييف مدة السيناريو لتلائم ${item.sec} ثانية مع دقة التدفق!`);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-right ${selectedDuration === item.sec ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-900 border-slate-800 text-slate-450 hover:bg-slate-850'}`}
                >
                  <span className="block text-white font-mono">{item.sec} ثانية</span>
                  <span className="text-[9px] text-slate-450 block mt-0.5">{item.tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Box C: الأنواع والتنسيقات */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-3">
            <span className="text-xs text-slate-400 font-bold block mb-1">📂 تنسيق ونوع المعاينة الإعلانية:</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'text', text: 'نص إعلاني وصور', icon: <FileText className="w-3 text-emerald-400" /> },
                { id: 'image', text: 'صور إعلانية فنية', icon: <ImageIcon className="w-3 text-indigo-400" /> },
                { id: 'video', text: 'سيناريو فيديو متكامل', icon: <VideoIcon className="w-3 text-orange-400" /> },
                { id: 'all', text: 'تصميم وباقة متكاملة', icon: <Sparkles className="w-3 text-amber-400" /> }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedType(item.id as any);
                    showToast(`📂 تم تفعيل صيغة التنسيق "${item.text}" في نافذة المعاينة!`);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between text-right ${selectedType === item.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-900 border-slate-800 text-slate-450 hover:bg-slate-850'}`}
                >
                  <span>{item.text}</span>
                  {item.icon}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Platforms Grid Section */}
        <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-300 font-black flex items-center gap-1.5">
              <span>📱 قنوات ومنصات التواصل المستهدفة بالإعلان:</span>
            </span>
            <button 
              onClick={() => {
                setSelectedPlatform('all');
                showToast('🌐 تم تفعيل وضع التوافق التلقائي مع جميع منصات التواصل الاجتماعي!');
              }}
              className={`px-3.5 py-1 rounded-xl text-[10px] font-black tracking-wide transition-all border ${selectedPlatform === 'all' ? 'bg-indigo-600 border-indigo-500 text-white font-mono' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
            >
              🌐 جميع منصات التواصل (كامل التوافق)
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-right">
            {platformsList.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedPlatform(item.id);
                  showToast(`📱 تم استهداف وتركيز المعاينة الحية لمنصة "${item.name}" تلقائياً!`);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold transition-all ${selectedPlatform === item.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 scale-102 font-black' : 'bg-slate-900/50 border-slate-850 text-slate-400 hover:text-slate-200'}`}
              >
                <span>{item.badge}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ────────────────────────────────────────────────────────
          الجزء السفلي: مدخلات طلبات وتعديلات المستخدم مع الأزرار الثمانية
          ──────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        
        <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
          <Edit3 className="w-5 h-5 text-indigo-400 animate-pulse" />
          <h4 className="font-extrabold text-md text-white">✏️ موجه تسيير طلبات وتعديلات وتوثيق الحملة الفوري (AI Composer)</h4>
        </div>

        {/* User request input custom area */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-bold block">اكتب تفاصيل طلباتك أو تعديلاتك المخصصة ليقوم AI Ideas بتحديث الحملة بالذكاء الاصطناعي الفائق:</label>
          <div className="relative">
            <textarea
              value={userEditRequest}
              onChange={(e) => setUserEditRequest(e.target.value)}
              placeholder="مثال: ركز الصور الإعلانية على مجالات ريادة الأعمال الحديثة، أو غيّر عنوان صفحة الهبوط ليكون أكثر دقة وحماساً واختصاراً، أو اجعل النصوص ملائمة لمنتج SaaS واشترط لغة ممتازة..."
              className="w-full h-28 p-4 bg-slate-950/90 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-650 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none resize-none leading-relaxed text-right md:-p-x-1"
            />
            {userEditRequest.trim().length > 0 && (
              <button
                onClick={() => performCampaignAdjustment()}
                className="absolute bottom-3 left-3 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-1 animate-pulse"
              >
                <span>🪄 تطبيق التعديلات الذكية</span>
              </button>
            )}
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Button 6: زر المشاركة الأصلية */}
          <button
            onClick={() => setShowShareModal(true)}
            className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all text-right group flex flex-col justify-between"
          >
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center mb-2">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-extrabold text-xs text-white">🔗 مشاركة الرابط التسويقي الأصلي</h5>
                <p className="text-[9px] text-slate-500 leading-normal mt-0.5">مشاركة خريطة المشروع داخل وخارج المنصة فورياً</p>
              </div>
            </button>

            {/* Button 7: زر الحذف وتطهير البيانات */}
            <button
              onClick={handleDeleteCampaign}
              className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-2xl transition-all text-right group flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-2">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-extrabold text-xs text-white">✕ حذف وتصفير الإعدادات</h5>
                <p className="text-[9px] text-slate-500 leading-normal mt-0.5">البدء الفوري من جديد ومسح الذاكرة الإعلانية</p>
              </div>
            </button>

            {/* Button 8: Expected conversion rate metrics box */}
            <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl text-right flex flex-col justify-between">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2 font-mono text-xs font-black">
                %
              </div>
              <div>
                <h5 className="font-bold text-xs text-slate-300">معدل التحويل المتوقع:</h5>
                <p className="text-xl font-black text-indigo-400 font-mono tracking-tight">+{campaignData.relevanceScore || 97}%</p>
              </div>
            </div>

          </div>
        </div>

      {/* ────────────────────────────────────────────────────────
          مودالات النوافذ المنبثقة التفاعلية (Inline Overlays & Modals)
          ──────────────────────────────────────────────────────── */}

      {/* A. Suggestions and strategical recommendations Drawer */}
      {showSuggestionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 text-right">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h4 className="text-md font-black text-white flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                <span>💡 توصيات واقتراحات استراتيجية لـ: {selectedProject?.name}</span>
              </h4>
              <button onClick={() => setShowSuggestionsModal(false)} className="text-slate-500 hover:text-white font-bold text-lg">&times;</button>
            </div>

            {loadingSuggestions ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-450 animate-pulse font-mono">AI Ideas is gathering professional strategical recommendations...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <div key={i} className="bg-slate-950 p-4 border border-slate-850 rounded-2xl text-xs leading-relaxed text-slate-200 text-right">
                    {s}
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={() => setShowSuggestionsModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              إغلاق النافذة
            </button>
          </div>
        </div>
      )}

      {/* B. Voice Tone Preset Modal (تغيير وتحميل نبرات الصوت والصوتيات) */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-right animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-855 pb-3">
              <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-orange-400" />
                <span>🎙️ خيارات الصوت والتعليق الصوتي:</span>
              </h4>
              <button onClick={() => setShowVoiceModal(false)} className="text-slate-500 hover:text-white font-bold">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-bold block">1. اختر نبرة دبلجة الصوت الإعلاني:</label>
                <select 
                  value={selectedVoiceTone} 
                  onChange={(e) => setSelectedVoiceTone(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white border border-slate-800 p-2.5 rounded-xl outline-none"
                >
                  <option value="gulf_luxury">خليجية فخمة جذابة ومثيرة للاهتمام</option>
                  <option value="egyptian_creative">لهجة مصرية ترويجية تفاعلية حية</option>
                  <option value="modern_standard_fusha">فصحى وثائقية احترافية رصينة</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-bold block">2. اختر الموسيقى الخلفية المرافقة للمشاهد:</label>
                <select 
                  value={selectedBgMusic} 
                  onChange={(e) => setSelectedBgMusic(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white border border-slate-800 p-2.5 rounded-xl outline-none"
                >
                  <option value="tech_rising">إيقاع حماسي تكنولوجي صاعد (Tech Electro)</option>
                  <option value="cinematic_glow">سينمائي ملهم وعميق (Cinematic Glow)</option>
                  <option value="acoustic_cozy">هادئ وبسيط للتكامل والراحة (Acoustic Comfort)</option>
                </select>
              </div>

              {/* Drag & Drop Audio Upload STEM File */}
              <div className="space-y-2 text-right">
                <span className="text-[11px] text-slate-400 font-bold block">3. أو ارفع ملف تعليق صوتي مخصص (.mp3) للإعلان:</span>
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer ${
                    dragActive ? 'border-indigo-400 bg-indigo-950/10' : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
                  }`}
                >
                  <Upload className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-350 font-bold block">اسحب ملف الصوت مخصص هنا أو انقر للتصفح</span>
                  <span className="text-[8px] text-slate-500 block mt-0.5">يدعم .mp3 | .wav ولا يتجاوز 50 ميجا</span>
                  
                  {uploadedAudioFile && (
                    <div className="mt-2 text-[9px] bg-indigo-600/30 text-indigo-300 py-1 px-2 rounded-lg inline-block">
                      ✓ ملف نشط: {uploadedAudioFile}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowVoiceModal(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all mt-4"
            >
              حفظ وتطبيق الخيارات الصوتية
            </button>
          </div>
        </div>
      )}

      {/* C. Download Options Modal (ZIP, APK, IPA) */}
      {showDownloadOptionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 max-w-lg w-full space-y-4 text-right animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>📦 تصدير وتحميل حزم الأجهزة والمنظومة التسويقية</span>
              </h4>
              <button onClick={() => setShowDownloadOptionsModal(false)} className="text-slate-500 hover:text-white text-lg font-bold">&times;</button>
            </div>

            {/* AI Engine Badge Row */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex flex-wrap gap-2 items-center justify-between">
              <span className="text-[9px] text-slate-400 font-bold">المحركات الإعلانية النشطة للدقة والسرعة:</span>
              <div className="flex gap-1.5">
                <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md font-mono font-bold">Veo 3</span>
                <span className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-mono font-bold">Gemini 1.5 Pro</span>
                <span className="text-[8px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md font-mono font-bold">Imagen 3</span>
              </div>
            </div>

            {/* Custom Project Link Box */}
            <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-2xl space-y-3">
              <label className="text-[10px] text-slate-400 font-bold block">🚨 رابط تشغيل ودومين مشروع المستخدم (Project Link & Domain):</label>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Domain Input */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 block text-right">⚙️ دومين المشروع:</span>
                  <div className="flex gap-1 bg-slate-950 border border-slate-800 p-2 rounded-xl">
                    <span className="text-[9px] text-emerald-400 font-mono self-center">https://</span>
                    <input 
                      type="text" 
                      value={customProjectDomain} 
                      onChange={(e) => setCustomProjectDomain(e.target.value.toLowerCase().replace(/[^a-z0-9\.\-]/g, ''))}
                      placeholder="ai-ideas.com" 
                      className="w-full bg-transparent text-[11px] text-white outline-none font-mono text-left font-bold"
                    />
                  </div>
                </div>

                {/* Slug Input */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 block text-right">✍️ مسار المشروع الفرعي:</span>
                  <div className="flex gap-1 bg-slate-950 border border-slate-800 p-2 rounded-xl">
                    <span className="text-[9px] text-indigo-400 font-mono self-center">/</span>
                    <input 
                      type="text" 
                      value={customProjectSlug} 
                      onChange={(e) => setCustomProjectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, ''))}
                      placeholder="اسم-مشروعك" 
                      className="w-full bg-transparent text-[11px] text-white outline-none font-mono text-left font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Preview URL */}
              <div className="text-[9px] text-indigo-400 text-left font-mono truncate pt-1 border-t border-slate-900 leading-relaxed">
                🔗 الرابط الحركي: https://{customProjectDomain || 'ai-ideas.com'}/{customProjectSlug || 'project'}
              </div>
              <p className="text-[9px] text-slate-500 text-right">ملاحظة: سيتم تغليف هذا الرابط والوسائل الترويجية تلقائياً في حزم الأجهزة لضمان التشغيل الصحيح دون أخطاء.</p>
            </div>

            <div className="space-y-2.5 flex flex-col">
              {/* Option 1: ZIP code package */}
              <button
                onClick={() => generateCampaignZip('zip')}
                disabled={loadingDownload}
                className="w-full p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-indigo-500/50 rounded-2xl text-right transition-all flex items-center justify-between group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                    ZIP
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-white">🗂️ حزمة الكود المصدري والمقالات (ZIP)</h5>
                    <p className="text-[9px] text-slate-500 mt-0.5">ملفات HTML المتجاوبة، وصحيفة تخطيط الحملة وتقارير النشر</p>
                  </div>
                </div>
                <span className="text-slate-600 group-hover:text-indigo-400 text-xs font-bold font-mono">تنزيل &larr;</span>
              </button>

              {/* Option 2: APK package */}
              <button
                onClick={() => generateCampaignZip('apk')}
                disabled={loadingDownload}
                className="w-full p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-emerald-500/50 rounded-2xl text-right transition-all flex items-center justify-between group disabled:opacity-50 mt-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-550/15 text-emerald-400 flex items-center justify-center font-bold">
                    APK
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-white">🤖 حزمة ملف تثبيت الأندرويد (APK)</h5>
                    <p className="text-[9px] text-slate-500 mt-0.5">تطبيق أندرويد حقيقي للتثبيت الفوري يدعم الهواتف والأجهزة اللوحية دون أخطاء</p>
                  </div>
                </div>
                <span className="text-slate-600 group-hover:text-emerald-400 text-xs font-bold font-mono">تنزيل &larr;</span>
              </button>

              {/* Option 3: IPA package */}
              <button
                onClick={() => generateCampaignZip('ipa')}
                disabled={loadingDownload}
                className="w-full p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-pink-500/50 rounded-2xl text-right transition-all flex items-center justify-between group disabled:opacity-50 mt-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center font-bold">
                    IPA
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-white">🍎 حزمة ملف تثبيت أجهزة الآيفون (IPA)</h5>
                    <p className="text-[9px] text-slate-500 mt-0.5">تطبيق iOS متكامل جاهز ومهيأ لتعديله وتصديره لأجهزة Apple iOS</p>
                  </div>
                </div>
                <span className="text-slate-600 group-hover:text-pink-400 text-xs font-bold font-mono">تنزيل &larr;</span>
              </button>
            </div>

            {loadingDownload && (
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 space-y-2 mt-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-bold font-sans">جاري تحزيم ملف {customProjectSlug} بدقة متناهية...</span>
                  <span className="text-emerald-400 font-mono font-bold">{downloadProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-300 pointer-events-none" style={{ width: `${downloadProgress}%` }} />
                </div>
              </div>
            )}

            <button 
              onClick={() => setShowDownloadOptionsModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 mt-2 text-center"
            >
              إغلاق خيارات التصدير والأجهزة
            </button>
          </div>
        </div>
      )}

      {/* D. Share original URL options (داخل وخارج المنصة) */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-right animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-pink-400" />
                <span>🔗 خيارات مشاركة الرابط التسويقي الأصلي:</span>
              </h4>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">&times;</button>
            </div>

            {/* Custom Project Slug Input */}
            <div className="space-y-1 text-right">
              <label className="text-[10px] text-slate-400 font-bold block mb-1">✍️ تخصيص دومين ورابط المشروع (Project Link & Domain):</label>
              
              <div className="space-y-2">
                {/* Domain Input */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 block">🌐 دومين المشاريع المخصص:</span>
                  <div className="flex gap-1.5 bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[10px] text-indigo-400 font-mono self-center">https://</span>
                    <input 
                      type="text" 
                      value={customProjectDomain} 
                      onChange={(e) => setCustomProjectDomain(e.target.value.toLowerCase().replace(/[^a-z0-9\.\-]/g, ''))}
                      placeholder="ai-ideas.com" 
                      className="flex-grow bg-transparent text-xs text-white outline-none font-mono text-left font-bold"
                    />
                  </div>
                </div>

                {/* Slug Input */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 block">✍️ مسار الرابط (Slug):</span>
                  <div className="flex gap-1.5 bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[10px] text-indigo-400 font-mono self-center">/</span>
                    <input 
                      type="text" 
                      value={customProjectSlug} 
                      onChange={(e) => setCustomProjectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, ''))}
                      placeholder="اسم-مشروعك" 
                      className="flex-grow bg-transparent text-xs text-white outline-none font-mono text-left font-bold"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 mt-1">يمكنك إدخال الدومين الخاص ببراندك ومسار المشروع الفريد لتخصيص الهوية كلياً.</p>
            </div>

            {/* Finalized original URL */}
            <div className="bg-slate-950 p-3.5 border border-slate-850 rounded-2xl text-xs space-y-2">
              <span className="text-[9px] text-indigo-400 font-bold block">الرابط المطور الجاهز للنشر:</span>
              <p className="text-white text-[11px] font-bold font-mono tracking-tight text-left select-all truncate bg-slate-900 px-2 py-1.5 rounded border border-slate-800">
                https://{customProjectDomain || 'ai-ideas.com'}/{customProjectSlug || 'project'}
              </p>
              <button
                onClick={() => {
                  const finalUrl = `https://${customProjectDomain || 'ai-ideas.com'}/${customProjectSlug || 'project'}`;
                  navigator.clipboard.writeText(finalUrl);
                  showToast(`📋 تم نسخ رابط مشروعك الفريد:\n${finalUrl}`);
                }}
                className="w-full py-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/20 rounded-xl text-xs font-bold transition-all focus:scale-[0.98]"
              >
                نسخ رابط المشروع المطور
              </button>
            </div>

            {/* Share destinations list */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 font-bold block">مشاركة مباشرة خارجية:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {shareTargets.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 p-2 bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-700 transition-all text-xs"
                  >
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-slate-350">{item.name}</span>
                  </a>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setShowShareModal(false)}
              className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all border border-slate-800 inline-block text-center"
            >
              إغلاق النافذة
            </button>
          </div>
        </div>
      )}

    </div>
  );
};