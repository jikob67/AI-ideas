import React, { ReactNode } from 'react';

interface SettingGroupProps {
    title: string;
    children: ReactNode;
}

const SettingGroup: React.FC<SettingGroupProps> = ({ title, children }) => {
    return (
        <div className="border-b border-slate-700 last:border-b-0 py-4">
            <h4 className="text-md font-semibold text-slate-200 mb-3">{title}</h4>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
};

export default SettingGroup;
