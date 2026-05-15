import React from 'react';
import { ProjectSection } from '../../../types';
import EditorField from './EditorField';
import SettingGroup from '../SettingGroup';

const AdsEditor: React.FC<{ section: ProjectSection; onUpdate: (s: ProjectSection) => void }> = ({ section, onUpdate }) => {
    const config = section.config || {};
    
    const handleToggle = (platform: 'admob' | 'unity', enabled: boolean) => {
        onUpdate({
            ...section,
            config: {
                ...config,
                [platform]: { ...config[platform], enabled }
            }
        });
    };
    
    const handleChange = (platform: 'admob' | 'unity', key: string, value: string) => {
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
            <SettingGroup title="Google AdMob">
                <EditorField label="تفعيل AdMob">
                    <input
                        type="checkbox"
                        className="toggle-switch"
                        checked={config.admob?.enabled || false}
                        onChange={e => handleToggle('admob', e.target.checked)}
                    />
                </EditorField>
                {config.admob?.enabled && (
                    <EditorField label="معرف إعلان البانر (Banner ID)">
                        <input
                            type="text"
                            value={config.admob?.bannerId || ''}
                            onChange={e => handleChange('admob', 'bannerId', e.target.value)}
                            className="w-full bg-slate-700 p-2 rounded-md text-sm"
                            placeholder="ca-app-pub-..."
                        />
                    </EditorField>
                )}
            </SettingGroup>
            
            <SettingGroup title="Unity Ads">
                <EditorField label="تفعيل Unity Ads">
                     <input
                        type="checkbox"
                        className="toggle-switch"
                        checked={config.unity?.enabled || false}
                        onChange={e => handleToggle('unity', e.target.checked)}
                    />
                </EditorField>
                {config.unity?.enabled && (
                    <EditorField label="معرف اللعبة (Game ID)">
                         <input
                            type="text"
                            value={config.unity?.gameId || ''}
                            onChange={e => handleChange('unity', 'gameId', e.target.value)}
                            className="w-full bg-slate-700 p-2 rounded-md text-sm"
                            placeholder="1234567"
                        />
                    </EditorField>
                )}
            </SettingGroup>
        </div>
    );
};

export default AdsEditor;
