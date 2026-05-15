import React from 'react';
import { ProjectSection } from '../../../types';
import EditorField from './EditorField';
import SettingGroup from '../SettingGroup';

const UsersEditor: React.FC<{ section: ProjectSection; onUpdate: (s: ProjectSection) => void }> = ({ section, onUpdate }) => {
    const config = section.config || {};

    const handleChange = (key: string, value: boolean) => {
        onUpdate({ ...section, config: { ...config, [key]: value } });
    };

    return (
        <SettingGroup title="إعدادات المستخدمين">
            <EditorField label="السماح بالتسجيل الجديد">
                <input
                    type="checkbox"
                    className="toggle-switch"
                    checked={config.allowRegistration ?? true}
                    onChange={e => handleChange('allowRegistration', e.target.checked)}
                />
            </EditorField>
            <EditorField label="طلب التحقق من البريد الإلكتروني">
                <input
                    type="checkbox"
                    className="toggle-switch"
                    checked={config.requireVerification ?? true}
                    onChange={e => handleChange('requireVerification', e.target.checked)}
                />
            </EditorField>
        </SettingGroup>
    );
};

export default UsersEditor;
