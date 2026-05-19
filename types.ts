
import React, { ReactNode } from 'react';

declare global {
  interface Window {
    JSZip: any;
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export type View =
  | 'editApp'
  | 'aiAssistant'
  | 'projectBooster'
  | 'profile'
  | 'about'
  | 'terms'
  | 'privacy'
  | 'contact'
  | 'artConverter'
  | 'support'
  | 'marketing'
  | 'profitSource'
  | 'appeal'
  | 'drawToCode' 
  | 'professionalTemplateGenerator'
  | 'trash'
  | 'dataAnalysis'
  | 'aiContentDetector'
  | 'changelog'
  | 'ideaToCode'
  | 'textToCode'
  | 'screenToCode'
  | 'uiRecognizer'
  | 'live'
  | 'fileConverter'
  | 'projectWizard'
  | 'zipToApp'
  | 'linkWizard'
  | 'urlToCode'
  | 'seoOptimizer'
  | 'showroom'
  | 'preview'
  | 'guide'
  | 'promptRefiner'
  | 'flowDemo'
  | 'assetStudio';

export interface User {
  uid: string;
  name: string; 
  username: string; 
  email: string;
  profilePictureUrl?: string;
  plan?: 'free' | 'pro' | 'premium';
  walletAddress?: string; 
  selectedWalletType?: string;
  points?: number;
  freeMarketingContentUsed?: number;
  warnings?: number;
  isBanned?: boolean;
  isNewUser?: boolean;
  referralCode?: string;
  referralCodeUsed?: boolean;
  uniqueLoginCode?: string;
}

export type PlanId = 'premium';

export enum ProjectType {
  WEBSITE = 'موقع إلكتروني',
  WEB_APP = 'تطبيق ويب متكامل',
  MOBILE_APP = 'تطبيق هاتف ذكي',
  GAME = 'لعبة تفاعلية',
  API = 'واجهة برمجة تطبيقات (API)',
  LANDING_PAGE = 'صفحة هبوط تسويقية',
  BLOG = 'مدونة محتوى',
  STORE = 'متجر تجارة إلكترونية',
  ADMIN_SYSTEM = 'نظام إدارة إداري',
  EDUCATIONAL_PLATFORM = 'منصة تعليمية الرقمية',
  SOCIAL_NETWORK = 'شبكة تواصل اجتماعي',
  CHARITY_WEBSITE = 'موقع خيري ومجتمعي',
  IOT_DEVICE = 'نظام إنترنت الأشياء',
  DESKTOP_APP = 'تطبيق سطح مكتب',
  AI_MODEL = 'نموذج ذكاء اصطناعي',
  DATA_VISUALIZATION = 'نظام تحليل وتصور بيانات',
  VR_AR_APP = 'تطبيق واقع افتراضي/معزز',
  BLOCKCHAIN_APP = 'تطبيق بلوكتشين لا مركزي',
  // Usage-only types
  AI_CHAT_MESSAGE = 'رسالة دردشة ذكية',
  SCREENSHOT_TO_CODE = 'تحويل الواجهات إلى برمجيات',
  DRAW_TO_CODE = 'تحويل المخططات إلى كود',
  DRAW_TO_DIGITAL = 'تحويل الرسم اليدوي إلى فن رقمي',
  GENERATE_LOGO = 'ابتكار شعار ذكي',
  GENERATE_ICON = 'توليد أيقونة مشروع',
  GENERATE_IMAGE = 'توليد صورة إبداعية',
  GENERATE_VIDEO = 'إنتاج فيديو سينمائي',
  OTHER_FILE = 'ملف إضافي',
  PROJECT_BOOST = 'تسريع نمو المشروع',
  MARKETING_GENERATION = 'إنشاء محتوى تسويقي',
  DIGITAL_DRAWING = 'رسم رقمي احترافي',
  TTS = 'تحويل النص إلى صوت طبيعي',
  AUDIO_TRANSCRIPTION = 'تفريغ صوتي دقيق',
  // New usage types for Text-to-Code
  UPLOAD_IMAGE_CONTEXT = 'تحليل سياق الصور',
  UPLOAD_VIDEO_CONTEXT = 'تحليل سياق الفيديو',
  UPLOAD_AUDIO_CONTEXT = 'تحليل سياق الصوت',
  UPLOAD_FILE_CONTEXT = 'تحليل سياق المستندات',
  AI_CONTENT_DETECTION = 'فحص المحتوى التوليدي',
  PROJECT_GENERATION = 'توليد مشروع برمجي',
  UI_ANALYSIS = 'تحليل هندسة الواجهات',
  CODE_CONVERSION = 'تحويل وتطوير الأكواد',
}

export enum SectionType {
  DESIGN = 'الهوية البصرية',
  DATABASE = 'قواعد البيانات',
  AUTH = 'نظام الصلاحيات',
  USERS = 'إدارة المستخدمين',
  CHAT = 'غرف التواصل',
  MAP = 'الخرائط التفاعلية',
  PAYMENTS = 'بوابة المدفوعات',
  NOTIFICATIONS = 'نظام التنبيهات',
  ADS = 'مساحات إعلانية',
  MEDIA = 'مكتبة الوسائط',
  RSS = 'خلاصات المحتوى',
  FORM = 'نماذج البيانات',
  STORE = 'كتالوج المنتجات',
  BLOG = 'قسم المقالات',
  HTML = 'تكويد مخصص',
  COMMUNITY_FEED = 'خلاصة المجتمع',
  EVENTS = 'إدارة الفعاليات',
  ANALYTICS = 'مركز التحليلات',
  INTEGRATIONS = 'الربط الخارجي',
  POINTS_REWARDS = 'نظام الولاء والمكافآت',
  TEAM = 'فريق العمل',
}

export interface ProjectFile {
  name: string;
  language: string;
  content: string;
}

export interface StoreProduct {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    description: string;
}

export interface BlogPost {
    id: string;
    title: string;
    content: string;
    author: string;
    date: string;
}

export interface LayoutComponent {
    type: 'text' | 'link' | 'button';
    text: string;
    link?: string;
}

export interface DesignConfig {
    colors: {
        primary: string;
        secondary: string;
        background: string;
        text: string;
        headerBackground: string;
    };
    layout: {
        header: {
            enabled: boolean;
            components: LayoutComponent[];
        };
        footer: {
            enabled: boolean;
            components: LayoutComponent[];
        };
    };
}


export interface ProjectSection {
  id: string;
  type: SectionType;
  title: string;
  config: any; 
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp?: number;
  taskType?: Feature;
  status?: 'generating' | 'completed' | 'error';
  content?: ReactNode;
  sources?: { uri: string; title: string }[];
  actions?: { type: 'accept' | 'reject' | 'clarify', label: string, payload: any }[];
  project?: Project; 
  code?: string; 
  attachments?: { url: string; name: string }[];
}

export interface ComponentTreeNode {
  name: string;
  type: string;
  children: ComponentTreeNode[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  creationMode?: View;
  iconUrl?: string;
  files?: ProjectFile[];
  builderChat?: Message[];
  marketingAssets?: MarketingAsset[];
  marketingSuggestions?: MarketingSuggestion[];
  sections: ProjectSection[]; 
  timestamp: number;
  updatedAt?: number;
  ownerEmail?: string;
  ownerUid?: string;
  isShared?: boolean;
  isPublished?: boolean;
  isBoosted?: boolean;
  boostEndDate?: number;
  category?: string;
  flutterProjectUrl?: string;
  apkUrl?: string;
  ipaUrl?: string;
  apkBlobId?: string;
  ipaBlobId?: string;
  sharedWith?: { email: string, permission: 'view' | 'edit' }[];
  publicShareId?: string;
  
  // Metadata for subcollections
  fileCount?: number;
  messageCount?: number;
}

export interface FileMetadata extends ProjectFile {
  id: string;
  projectId: string;
  storageUrl?: string;
  size?: number;
  updatedAt: number;
}

export interface MessageMetadata extends Message {
  projectId: string;
  timestamp: number;
}

export type Usage = {
  [key in ProjectType]?: number;
};

export interface Wallet {
    name: string;
    address: string;
    logo: React.FC<React.SVGProps<SVGSVGElement>>;
}

export enum Feature {
  GENERATE_VIDEO = 'إنتاج فيديو إبداعي',
  GENERATE_IMAGE = 'توليد صورة فنية',
  EDIT_IMAGE = 'معالجة وتعديل الصور',
  ANALYZE_IMAGE = 'تحليل بصري للصور',
  ANALYZE_VIDEO = 'تحليل محتوى الفيديو',
  DATA_ANALYSIS = 'تحليل البيانات المتقدم',
  WEB_SEARCH = 'البحث المعزز بالويب',
  MAPS_SEARCH = 'البحث الجغرافي الذكي',
  AI_CHAT = 'مساعد المحادثة العام',
  FAST_CHAT = 'الرد السريع واللحظي',
  THINKING_MODE_CHAT = 'التحليل العميق والاستنتاج',
  TRANSCRIBE_AUDIO = 'تحويل الصوت إلى نصوص',
  TEXT_TO_SPEECH = 'توليد كلام بشري طبيعي',
  LIVE_CONVERSATION = 'محادثة صوتية فورية',
}


export interface MarketingSuggestion {
    id: string;
    type: 'strategy' | 'design' | 'content';
    title: string;
    description: string;
    platform?: 'Instagram' | 'Facebook' | 'Twitter' | 'LinkedIn';
}
  
export interface MarketingAsset {
    id: string;
    timestamp: number;
    title?: string;
    content?: string;
    design?: string;
    platform?: string;
    type?: 'image' | 'video' | 'text';
    source?: any;
    dataUrl?: string;
    suggestions?: string[];
    translatedSuggestions?: { [lang: string]: string[] };
}

export interface ProjectIdea {
  name: string;
  description: string;
  type: ProjectType;
  suggestedFeatures: string[];
}

export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  // Add other necessary methods here if needed
}
