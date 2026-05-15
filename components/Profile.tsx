
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUsage } from '../hooks/useUsage';
import { 
    UploadIcon, SaveIcon, SparklesIcon, UserCircleIcon, TrashIcon, 
    WalletIcon, CheckIcon, CopyIcon, 
    ArrowRightIcon, ShieldCheckIcon, PencilSquareIcon, CloseIcon
} from './Icons';
import { DAILY_LIMITS, PRO_LIMITS } from '../constants';
import { ProjectType } from '../types';
import UpgradeModal from './UpgradeModal';
import RedeemPointsModal from './RedeemPointsModal';

// --- Sub-components ---

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in-up z-50 ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            {type === 'success' ? <CheckIcon className="w-5 h-5" /> : <TrashIcon className="w-5 h-5" />}
            <span className="text-sm font-medium">{message}</span>
        </div>
    );
};

const WalletCard: React.FC<{ 
    address: string; 
    onConnect: () => void; 
    onDisconnect: () => void;
}> = ({ address, onConnect, onDisconnect }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!address) {
        return (
            <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 border border-slate-700 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 group hover:border-indigo-500/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-slate-700 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                    <WalletIcon className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" />
                </div>
                <div>
                    <h4 className="font-semibold text-slate-200">ربط المحفظة</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">اربط محفظتك الرقمية للوصول إلى الميزات المدفوعة وتوثيق ملكية المشاريع.</p>
                </div>
                <button onClick={onConnect} className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-indigo-900/20 transition-all transform hover:scale-105">
                    اتصال بالمحفظة
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-indigo-900/20 to-slate-800 border border-indigo-500/30 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <WalletIcon className="w-32 h-32 text-indigo-400" />
            </div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-xs font-mono text-green-400 uppercase tracking-wider">محفظة نشطة</span>
                    </div>
                    <button onClick={onDisconnect} className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">فصل</button>
                </div>
                
                <h4 className="text-2xl font-bold text-white mb-1 tracking-tight">0.00 <span className="text-sm font-normal text-indigo-300">ETH</span></h4>
                <p className="text-xs text-slate-400 mb-4">الرصيد التقريبي</p>

                <div className="bg-slate-900/50 rounded-lg p-2 flex items-center justify-between border border-slate-700/50">
                    <code className="text-xs text-slate-300 font-mono truncate max-w-[200px]">{address}</code>
                    <button onClick={handleCopy} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="نسخ العنوان">
                        {copied ? <CheckIcon className="w-4 h-4 text-green-400"/> : <CopyIcon className="w-4 h-4"/>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Sections ---

const UsageDashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const { usage } = useUsage();
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);

    const orderedLimits = Object.entries(DAILY_LIMITS)
      .map(([key, value]) => ({ key: key as ProjectType, value }))
      .sort((a, b) => a.key.localeCompare(b.key));
    
    const getLimit = (key: ProjectType) => {
        if (currentUser?.plan === 'premium') return Infinity;
        if (currentUser?.plan === 'pro') return PRO_LIMITS[key] || 0;
        return DAILY_LIMITS[key] || 0;
    };

    return (
        <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-amber-400"/>
                        نقاطك التفاعلية
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-white">{currentUser?.points?.toLocaleString() || 0}</span>
                        <span className="text-sm text-slate-400">نقطة</span>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => setIsRedeemModalOpen(true)} className="flex-1 md:flex-none bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm">
                        استبدال النقاط
                    </button>
                    <button onClick={() => setUpgradeModalOpen(true)} className="flex-1 md:flex-none bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-indigo-900/20 text-sm">
                        ترقية الحساب
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {orderedLimits.slice(0, 8).map(({ key }) => { // Showing top 8 for cleaner UI
                    const used = usage[key] || 0;
                    const limit = getLimit(key);
                    const isPremium = limit === Infinity;
                    const percent = !isPremium && limit > 0 ? (used / limit) * 100 : 0;
                    
                    return (
                        <div key={key} className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-medium text-slate-400 truncate" title={key}>{key}</h4>
                                <span className="text-xs font-bold text-white">{used} <span className="text-slate-500">/ {isPremium ? '∞' : limit}</span></span>
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${percent >= 100 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
            <RedeemPointsModal isOpen={isRedeemModalOpen} onClose={() => setIsRedeemModalOpen(false)} />
        </div>
    );
};

const Profile: React.FC = () => {
  const { currentUser, updateUser, logout } = useAuth();
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPhotoRemoved, setIsPhotoRemoved] = useState(false);
  
  // State
  const [walletAddress, setWalletAddress] = useState('');
  
  // Notifications
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const getAvatarUrl = () => {
      if (previewUrl) return previewUrl;
      if (currentUser?.profilePictureUrl) return currentUser.profilePictureUrl;
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=6366f1&color=fff&size=128`;
  };

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setWalletAddress(currentUser.walletAddress || '');
      setPreviewUrl(currentUser.profilePictureUrl || null);
    }
  }, [currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicFile(file);
      setIsPhotoRemoved(false);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error("فشل تحويل الملف"));
      };
      reader.onerror = () => reject(new Error("خطأ في قراءة الملف"));
    });
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    setIsSaving(true);

    try {
      let newProfilePictureUrl: string | undefined | null = undefined;
      
      if (profilePicFile) {
        try {
            newProfilePictureUrl = await fileToBase64(profilePicFile);
        } catch {
            setProfilePicFile(null);
            throw new Error("فشل في قراءة ملف الصورة. يرجى المحاولة مرة أخرى أو اختيار صورة أخرى.");
        }
      }

      const updates: any = {};
      if (name !== currentUser.name) updates.name = name;
      if (email !== currentUser.email) {
          const oldEmail = currentUser.email;
          const newEmail = email;
           const keysToMigrate = [
            `appProjects_`, `deletedProjects_`, `usageDate_`, `dailyUsage_`, 
            `monthlyUsageDate_`, `monthlyUsage_`, `dataAnalysisSession_`, `aiDetectorSession_`
          ];
           keysToMigrate.forEach(prefix => {
              const oldKey = `${prefix}${oldEmail}`;
              const newKey = `${prefix}${newEmail}`;
              const data = localStorage.getItem(oldKey);
              if (data) {
                  localStorage.setItem(newKey, data);
                  localStorage.removeItem(oldKey);
              }
          });
          updates.email = email;
      }
      if (walletAddress !== currentUser.walletAddress) updates.walletAddress = walletAddress;
      
      if (newProfilePictureUrl !== undefined) {
          updates.profilePictureUrl = newProfilePictureUrl;
      } else if (isPhotoRemoved) {
          updates.profilePictureUrl = ''; // Set to empty string to remove
      }

      if (Object.keys(updates).length > 0) {
        await updateUser(updates);
        setToast({ msg: 'تم تحديث الملف الشخصي بنجاح', type: 'success' });
        setProfilePicFile(null);
        setIsEditing(false);
        setIsPhotoRemoved(false);
      } else {
        setToast({ msg: 'لا توجد تغييرات للحفظ', type: 'success' });
        setIsEditing(false);
      }
    } catch (error: any) {
      setToast({ msg: error.message || 'حدث خطأ أثناء الحفظ', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
      if (currentUser) {
        setName(currentUser.name);
        setEmail(currentUser.email);
        setPreviewUrl(currentUser.profilePictureUrl || null);
      }
      setIsEditing(false);
      setProfilePicFile(null);
      setIsPhotoRemoved(false);
  };

  const handleConnectWallet = () => {
      const fakeAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
      setWalletAddress(fakeAddress);
      setToast({ msg: 'تم استرداد عنوان المحفظة. اضغط حفظ لتأكيد الربط.', type: 'success' });
  };

  const handleDisconnectWallet = () => {
      if(window.confirm("هل أنت متأكد من فصل المحفظة؟")) {
        setWalletAddress('');
        setToast({ msg: 'تم إزالة العنوان. اضغط حفظ للتأكيد.', type: 'success' });
      }
  };

  const handleDeleteAccount = () => {
      if (window.confirm("تحذير: هل أنت متأكد تمامًا من حذف حسابك؟ سيؤدي هذا إلى حذف جميع مشاريعك وبياناتك نهائيًا. لا يمكن التراجع عن هذا الإجراء.")) {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const newUsers = users.filter((u: any) => u.email !== currentUser?.email);
          localStorage.setItem('users', JSON.stringify(newUsers));
          
          if (currentUser?.email) {
            const keysToRemove = [
                `appProjects_${currentUser.email}`, 
                `deletedProjects_${currentUser.email}`, 
                `usageDate_${currentUser.email}`, 
                `dailyUsage_${currentUser.email}`, 
                `monthlyUsageDate_${currentUser.email}`, 
                `monthlyUsage_${currentUser.email}`, 
                `dataAnalysisSession_${currentUser.email}`, 
                `aiDetectorSession_${currentUser.email}`
            ];
            keysToRemove.forEach(key => localStorage.removeItem(key));
          }
          
          logout();
      }
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">إعدادات الحساب</h1>
            <p className="text-slate-400 mt-1">إدارة ملفك الشخصي والمحافظ الرقمية.</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: Basic Info */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <UserCircleIcon className="w-5 h-5 text-indigo-400"/> 
                        المعلومات الشخصية
                    </h3>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                            <PencilSquareIcon className="w-4 h-4"/> تعديل
                        </button>
                    )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-8">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative group w-32 h-32">
                            <img 
                                src={getAvatarUrl()} 
                                alt="Profile" 
                                className={`w-full h-full rounded-full object-cover border-4 border-slate-700 shadow-xl ${isEditing ? 'opacity-80' : ''}`} 
                            />
                            
                            {isEditing && (
                                <>
                                    <label htmlFor="pic-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full cursor-pointer font-medium text-sm opacity-100 transition-opacity hover:bg-black/70">
                                        <UploadIcon className="w-6 h-6 mb-1" />
                                    </label>
                                    <input id="pic-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </>
                            )}
                             {isEditing && !isPhotoRemoved && (previewUrl || (currentUser && currentUser.profilePictureUrl)) && (
                                <button 
                                    onClick={() => { setPreviewUrl(null); setProfilePicFile(null); setIsPhotoRemoved(true); }}
                                    className="absolute bottom-0 right-0 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors"
                                    title="إزالة الصورة"
                                >
                                    <TrashIcon className="w-4 h-4"/>
                                </button>
                            )}
                        </div>
                        {isEditing && <p className="text-xs text-slate-400">JPG, PNG (Max 2MB)</p>}
                    </div>

                    {/* Fields */}
                    <div className="flex-grow space-y-4 w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">الاسم الكامل</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    disabled={!isEditing}
                                    className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${!isEditing ? 'border-transparent bg-transparent pl-0' : 'border-slate-600'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">البريد الإلكتروني</label>
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    disabled={!isEditing}
                                    className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${!isEditing ? 'border-transparent bg-transparent pl-0' : 'border-slate-600'}`}
                                />
                            </div>
                        </div>
                        
                        {isEditing && (
                            <div className="pt-4 flex justify-end gap-3 animate-fade-in">
                                <button 
                                    onClick={handleCancelEdit}
                                    className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <CloseIcon className="w-5 h-5" />
                                    إلغاء
                                </button>
                                <button 
                                    onClick={handleSaveProfile} 
                                    disabled={isSaving}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <SaveIcon className="w-5 h-5" />}
                                    حفظ التغييرات
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Column 2: Wallet & Extras */}
        <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShieldCheckIcon className="w-5 h-5 text-green-400"/> 
                        المحفظة الرقمية
                    </h3>
                    {walletAddress && <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">Web3 Connected</span>}
                </div>
                
                {isEditing ? (
                     <div className="space-y-2">
                         <label className="text-sm text-slate-300">عنوان المحفظة</label>
                         <div className="flex gap-2">
                             <input 
                                type="text" 
                                value={walletAddress} 
                                onChange={e => setWalletAddress(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-xs font-mono"
                                placeholder="0x..."
                            />
                            {walletAddress ? (
                                <button onClick={handleDisconnectWallet} className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg"><TrashIcon className="w-4 h-4"/></button>
                            ) : (
                                <button onClick={handleConnectWallet} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"><CheckIcon className="w-4 h-4"/></button>
                            )}
                         </div>
                     </div>
                ) : (
                    <WalletCard 
                        address={walletAddress} 
                        onConnect={handleConnectWallet} 
                        onDisconnect={handleDisconnectWallet} 
                    />
                )}
                
                <div className="mt-4 text-xs text-slate-500 bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                    <p>يتم استخدام المحفظة للتحقق من ملكية المشاريع ولإتمام عمليات الدفع بالعملات الرقمية.</p>
                </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
                <h3 className="text-xl font-bold relative z-10">الخطة الاحترافية</h3>
                <p className="text-indigo-100 text-sm mt-1 relative z-10 mb-4">احصل على حدود أعلى وميزات حصرية.</p>
                <button onClick={() => setUpgradeModalOpen(true)} className="relative z-10 bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-md">
                    ترقية الآن <ArrowRightIcon className="w-4 h-4"/>
                </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 mt-8">
                <h3 className="text-lg font-bold text-red-400 mb-2">منطقة الخطر</h3>
                <p className="text-xs text-red-300/70 mb-4">
                    حذف الحساب إجراء نهائي لا يمكن التراجع عنه. ستفقد جميع مشاريعك وبياناتك نهائيًا.
                </p>
                <button 
                    onClick={handleDeleteAccount} 
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                >
                    <TrashIcon className="w-4 h-4"/>
                    حذف الحساب نهائياً
                </button>
            </div>
        </div>

      </div>

      <UsageDashboard />
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
    </div>
  );
};

export default Profile;
