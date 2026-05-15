import React from 'react';
import { ProjectSection } from '../../../types';
import EditorField from './EditorField';
import SettingGroup from '../SettingGroup';

const RssEditor: React.FC<{ section: ProjectSection; onUpdate: (s: ProjectSection) => void }> = ({ section, onUpdate }) => {
    const config = section.config || {};
    
    return (
        <SettingGroup title="إعدادات RSS">
            <EditorField label="رابط موجز RSS">
                <input
                    type="url"
                    value={config.feedUrl || ''}
                    onChange={e => onUpdate({ ...section, config: { ...config, feedUrl: e.target.value } })}
                    className="w-full bg-slate-700 p-2 rounded-md text-sm"
                    placeholder="https://example.com/feed.xml"
                />
            </EditorField>
        </SettingGroup>
    );
};

export default RssEditor;
