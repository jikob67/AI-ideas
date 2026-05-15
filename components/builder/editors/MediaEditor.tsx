import React from 'react';
import { ProjectSection } from '../../../types';
import EditorField from './EditorField';
import SettingGroup from '../SettingGroup';
import { PlusIcon, TrashIcon } from '../../Icons';

interface MediaItem {
    id: string;
    url: string;
    name: string;
    type: 'image' | 'video';
}

const MediaEditor: React.FC<{ section: ProjectSection; onUpdate: (s: ProjectSection) => void }> = ({ section, onUpdate }) => {
    const config = section.config || {};
    const mediaItems = (config.mediaItems || []) as MediaItem[];

    const handleChange = (key: string, value: any) => {
        onUpdate({ ...section, config: { ...config, [key]: value } });
    };

    const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        // FIX: Explicitly type 'file' as File to resolve type inference issues.
        const newItemsPromises = Array.from(files).map((file: File) => {
            return new Promise<MediaItem>((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target?.result as string;
                    resolve({
                        id: `media-${Date.now()}-${Math.random()}`,
                        url: dataUrl,
                        name: file.name,
                        type: file.type.startsWith('image/') ? 'image' : 'video'
                    });
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(newItemsPromises).then(newItems => {
            onUpdate({
                ...section,
                config: {
                    ...config,
                    mediaItems: [...mediaItems, ...newItems]
                }
            });
        });
    };

    const handleDeleteMedia = (id: string) => {
        const updatedItems = mediaItems.filter(item => item.id !== id);
        onUpdate({
            ...section,
            config: {
                ...config,
                mediaItems: updatedItems
            }
        });
    };


    return (
        <div className="space-y-4">
            <SettingGroup title="مكتبة الوسائط">
                <div className="grid grid-cols-3 gap-2">
                    {mediaItems.map(item => (
                        <div key={item.id} className="relative group aspect-square bg-slate-700 rounded-md">
                            {item.type === 'image' ? (
                                <img src={item.url} alt={item.name} className="w-full h-full object-cover rounded-md" title={item.name}/>
                            ) : (
                                <video src={item.url} className="w-full h-full object-cover rounded-md" title={item.name}/>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={() => handleDeleteMedia(item.id)} className="p-2 bg-red-500/80 rounded-full text-white">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    <label htmlFor="media-upload" className="cursor-pointer flex items-center justify-center aspect-square border-2 border-dashed border-slate-600 rounded-md hover:border-indigo-500 text-slate-500">
                        <PlusIcon className="w-6 h-6" />
                    </label>
                    <input id="media-upload" type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
                </div>
            </SettingGroup>
            <SettingGroup title="إعدادات الرفع">
                <EditorField label="السماح للمستخدمين بالرفع">
                    <input
                        type="checkbox"
                        className="toggle-switch"
                        checked={config.allowUploads ?? true}
                        onChange={e => handleChange('allowUploads', e.target.checked)}
                    />
                </EditorField>
                <EditorField label="أقصى حجم للملف (MB)">
                     <input
                        type="number"
                        value={config.maxFileSizeMB || 10}
                        onChange={e => handleChange('maxFileSizeMB', parseInt(e.target.value))}
                        className="w-full bg-slate-700 p-2 rounded-md text-sm"
                    />
                </EditorField>
            </SettingGroup>
        </div>
    );
};

export default MediaEditor;