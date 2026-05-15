import React from 'react';
import { ProjectSection, DesignConfig } from '../../../types';
import EditorField from './EditorField';
import SettingGroup from '../SettingGroup';

const DesignEditor: React.FC<{ section: ProjectSection; onUpdate: (s: ProjectSection) => void }> = ({ section, onUpdate }) => {
    const config = (section.config || {}) as Partial<DesignConfig>;
    const colors = config.colors || { primary: '#6366f1', secondary: '#a855f7', background: '#111827', text: '#f3f4f6', headerBackground: '#1f2937' };
    const layout = config.layout || { header: { enabled: true, components: [] }, footer: { enabled: true, components: [] } };

    const handleConfigChange = (key: keyof DesignConfig, value: any) => {
        onUpdate({
            ...section,
            config: {
                ...config,
                [key]: value,
            },
        });
    };

    const handleColorChange = (colorKey: keyof DesignConfig['colors'], value: string) => {
        handleConfigChange('colors', { ...colors, [colorKey]: value });
    };
    
    const handleLayoutChange = (part: 'header' | 'footer', key: 'enabled', value: boolean) => {
        handleConfigChange('layout', {
            ...layout,
            [part]: {
                // a bit of a hack to satisfy TS
                ...(layout[part] as any),
                [key]: value,
            },
        });
    };

    return (
        <>
            <SettingGroup title="الألوان">
                <div className="grid grid-cols-2 gap-4">
                    <EditorField label="اللون الأساسي">
                        <input type="color" value={colors.primary} onChange={e => handleColorChange('primary', e.target.value)} className="w-full h-10 p-1 bg-slate-700 rounded-md border border-slate-600 cursor-pointer"/>
                    </EditorField>
                    <EditorField label="اللون الثانوي">
                        <input type="color" value={colors.secondary} onChange={e => handleColorChange('secondary', e.target.value)} className="w-full h-10 p-1 bg-slate-700 rounded-md border border-slate-600 cursor-pointer"/>
                    </EditorField>
                    <EditorField label="لون الخلفية">
                        <input type="color" value={colors.background} onChange={e => handleColorChange('background', e.target.value)} className="w-full h-10 p-1 bg-slate-700 rounded-md border border-slate-600 cursor-pointer"/>
                    </EditorField>
                    <EditorField label="لون النص">
                        <input type="color" value={colors.text} onChange={e => handleColorChange('text', e.target.value)} className="w-full h-10 p-1 bg-slate-700 rounded-md border border-slate-600 cursor-pointer"/>
                    </EditorField>
                    <EditorField label="خلفية الهيدر">
                        <input type="color" value={colors.headerBackground} onChange={e => handleColorChange('headerBackground', e.target.value)} className="w-full h-10 p-1 bg-slate-700 rounded-md border border-slate-600 cursor-pointer"/>
                    </EditorField>
                </div>
            </SettingGroup>
            <SettingGroup title="التخطيط">
                <EditorField label="تمكين الهيدر">
                     <input
                        type="checkbox"
                        className="toggle-switch"
                        checked={layout.header?.enabled ?? true}
                        onChange={e => handleLayoutChange('header', 'enabled', e.target.checked)}
                    />
                </EditorField>
                 <EditorField label="تمكين الفوتر">
                     <input
                        type="checkbox"
                        className="toggle-switch"
                        checked={layout.footer?.enabled ?? true}
                        onChange={e => handleLayoutChange('footer', 'enabled', e.target.checked)}
                    />
                </EditorField>
                <p className="text-xs text-slate-500">ملاحظة: تعديل مكونات الهيدر والفوتر متاح في قسم HTML المخصص.</p>
            </SettingGroup>
        </>
    );
};

export default DesignEditor;
