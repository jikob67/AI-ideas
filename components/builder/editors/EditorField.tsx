import React from 'react';

interface EditorFieldProps {
    label: string;
    children: React.ReactNode;
}

const EditorField: React.FC<EditorFieldProps> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
        {children}
    </div>
);

export default EditorField;