import React from 'react';
import { ProjectSection } from '../../../types';
import EditorField from './EditorField';
import SettingGroup from '../SettingGroup';

const NotificationsEditor: React.FC<{ section: ProjectSection; onUpdate: (s: ProjectSection) => void }> = ({ section, onUpdate }) => {
    const config = section.config || {};
    
    const handleToggle = (platform: 'fcm', enabled: boolean) => {
        onUpdate({
            ...section,
            config: {
                ...config,
                [platform]: { ...config[platform], enabled }
            }
        });
    };
    
    const handleChange = (platform: 'fcm', key: string, value: string) => {
        onUpdate({
            ...section,
            config: {
                ...config,
                [platform]: { ...config[platform], [key]: value }
            }
        });
    };

    return (
        <div className="space-y-4">
            <SettingGroup title="Firebase Cloud Messaging (FCM)">
                <EditorField label="تفعيل إشعارات FCM">
                    <input
                        type="checkbox"
                        className="toggle-switch"
                        checked={config.fcm?.enabled || false}
                        onChange={e => handleToggle('fcm', e.target.checked)}
                    />
                </EditorField>
                {config.fcm?.enabled && (
                    <div className="animate-fade-in space-y-4">
                        <EditorField label="مفتاح الخادم (Server Key)">
                            <textarea
                                rows={4}
                                value={config.fcm?.serverKey || ''}
                                onChange={e => handleChange('fcm', 'serverKey', e.target.value)}
                                className="w-full bg-slate-700 p-2 rounded-md text-sm font-mono resize-y"
                                placeholder="AAAA..."
                            />
                        </EditorField>
                        <div className="text-xs text-slate-400 p-2 bg-slate-900/50 rounded-md">
                            <p>أدخل مفتاح الخادم (Server Key) الخاص بمشروعك على Firebase. هذا المفتاح ضروري لإرسال الإشعارات الفورية إلى تطبيقاتك.</p>
                        </div>
                    </div>
                )}
            </SettingGroup>
        </div>
    );
};

export default NotificationsEditor;