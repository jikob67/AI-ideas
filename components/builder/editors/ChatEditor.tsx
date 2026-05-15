import React from 'react';
import { ProjectSection } from '../../../types';
import EditorField from './EditorField';
import SettingGroup from '../SettingGroup';

const ChatEditor: React.FC<{ section: ProjectSection; onUpdate: (s: ProjectSection) => void }> = ({ section, onUpdate }) => {
    const config = section.config || {};

    const handleChange = (key: string, value: any) => {
        onUpdate({ ...section, config: { ...config, [key]: value } });
    };

    return (
        <SettingGroup title="إعدادات الدردشة">
            <EditorField label="تمكين الدردشة بين شخصين (P2P)">
                <input
                    type="checkbox"
                    className="toggle-switch"
                    checked={config.enableP2P || false}
                    onChange={e => handleChange('enableP2P', e.target.checked)}
                />
            </EditorField>
            <EditorField label="تمكين الدردشة الجماعية">
                <input
                    type="checkbox"
                    className="toggle-switch"
                    checked={config.enableGroup || false}
                    onChange={e => handleChange('enableGroup', e.target.checked)}
                />
            </EditorField>
            <EditorField label="مدة الاحتفاظ بالرسائل (أيام)">
                <input
                    type="number"
                    value={config.retentionDays || 30}
                    onChange={e => handleChange('retentionDays', parseInt(e.target.value))}
                    className="w-full bg-slate-700 p-2 rounded-md text-sm"
                />
            </EditorField>
        </SettingGroup>
    );
};

export default ChatEditor;
