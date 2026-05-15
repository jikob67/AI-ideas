import React from 'react';
import { ProjectSection } from '../../../types';

const GenericEditor: React.FC<{ section: ProjectSection; onUpdate: (s: ProjectSection) => void }> = ({ section, onUpdate }) => {
    const configString = JSON.stringify(section.config, null, 2);

    const handleChange = (value: string) => {
        try {
            const newConfig = JSON.parse(value);
            onUpdate({ ...section, config: newConfig });
        } catch (e) {
            // handle JSON parse error if needed, maybe show an error message
            console.error("Invalid JSON format");
        }
    };

    return (
        <div>
            <p className="text-sm text-slate-400 mb-2">لا يوجد محرر مخصص لهذا القسم. يمكنك تعديل إعدادات JSON مباشرة.</p>
            <textarea
                value={configString}
                onChange={e => handleChange(e.target.value)}
                rows={15}
                className="w-full bg-slate-900 font-mono text-sm p-2 rounded-md border border-slate-600"
                spellCheck="false"
            />
        </div>
    );
};

export default GenericEditor;