import React from 'react';
import { BuildInstructions } from '../../BuildInstructions';
import { CloseIcon } from '../../Icons';

interface BuildInstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BuildInstructionsModal: React.FC<BuildInstructionsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative animate-fade-in-up flex flex-col max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors z-10"><CloseIcon className="w-5 h-5" /></button>
                <BuildInstructions />
            </div>
        </div>
    );
};
