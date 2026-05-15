import React from 'react';
import { ProjectSection } from '../../../types';
import EditorField from './EditorField';
import SettingGroup from '../SettingGroup';
import { PlusIcon, TrashIcon } from '../../Icons';

interface FormField {
    name: string;
    type: 'text' | 'email' | 'textarea' | 'number';
    label: string;
    required?: boolean;
}

const FormEditor: React.FC<{ section: ProjectSection; onUpdate: (s: ProjectSection) => void }> = ({ section, onUpdate }) => {
    const fields = (section.config.fields || []) as FormField[];

    const handleUpdateField = (index: number, field: keyof FormField, value: any) => {
        const updatedFields = fields.map((f, i) => i === index ? { ...f, [field]: value } : f);
        onUpdate({ ...section, config: { ...section.config, fields: updatedFields } });
    };

    const handleAddField = () => {
        const newField: FormField = { name: `field_${Date.now()}`, type: 'text', label: 'حقل جديد' };
        onUpdate({ ...section, config: { ...section.config, fields: [...fields, newField] } });
    };

    const handleDeleteField = (index: number) => {
        const updatedFields = fields.filter((_, i) => i !== index);
        onUpdate({ ...section, config: { ...section.config, fields: updatedFields } });
    };

    return (
        <SettingGroup title="حقول النموذج">
            <div className="space-y-2">
                {fields.map((field, index) => (
                    <div key={index} className="bg-slate-700/50 p-2 rounded-md space-y-2">
                        <div className="flex gap-2">
                             <input 
                                type="text"
                                value={field.label}
                                onChange={e => handleUpdateField(index, 'label', e.target.value)}
                                className="w-full bg-slate-600 p-1 rounded text-sm"
                                placeholder="عنوان الحقل"
                            />
                             <select value={field.type} onChange={e => handleUpdateField(index, 'type', e.target.value)} className="bg-slate-600 p-1 rounded text-sm">
                                <option value="text">نص</option>
                                <option value="email">بريد إلكتروني</option>
                                <option value="textarea">مربع نص</option>
                                <option value="number">رقم</option>
                             </select>
                             <button onClick={() => handleDeleteField(index)} className="p-1 text-red-400"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
             <button onClick={handleAddField} className="w-full text-sm mt-2 p-2 bg-indigo-600/50 rounded-md hover:bg-indigo-600 flex items-center justify-center gap-1">
                <PlusIcon className="w-4 h-4"/> إضافة حقل
            </button>
        </SettingGroup>
    );
};

export default FormEditor;
