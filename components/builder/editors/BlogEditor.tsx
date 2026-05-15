import React, { useState } from 'react';
import { ProjectSection, BlogPost } from '../../../types';
import EditorField from './EditorField';
import SettingGroup from '../SettingGroup';
import { PlusIcon, TrashIcon } from '../../Icons';

const BlogEditor: React.FC<{ section: ProjectSection; onUpdate: (s: ProjectSection) => void }> = ({ section, onUpdate }) => {
    const posts = (section.config.posts || []) as BlogPost[];

    const handleUpdatePost = (postId: string, field: keyof BlogPost, value: string) => {
        const updatedPosts = posts.map(p => p.id === postId ? { ...p, [field]: value } : p);
        onUpdate({ ...section, config: { ...section.config, posts: updatedPosts }});
    };
    
    const handleAddPost = () => {
        const newPost: BlogPost = {
            id: `post-${Date.now()}`,
            title: 'مقالة جديدة',
            content: 'محتوى المقالة هنا...',
            author: 'Admin',
            date: new Date().toISOString().split('T')[0]
        };
        onUpdate({ ...section, config: { ...section.config, posts: [...posts, newPost] }});
    };
    
    const handleDeletePost = (postId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه المقالة؟')) {
            const updatedPosts = posts.filter(p => p.id !== postId);
            onUpdate({ ...section, config: { ...section.config, posts: updatedPosts }});
        }
    };
    
    return (
        <div>
            <SettingGroup title="إدارة المقالات">
                <div className="space-y-2">
                    {posts.map(post => (
                        <div key={post.id} className="bg-slate-700/50 p-3 rounded-md">
                            <div className="flex justify-between items-center mb-2">
                                <input 
                                    type="text"
                                    value={post.title}
                                    onChange={e => handleUpdatePost(post.id, 'title', e.target.value)}
                                    className="bg-transparent font-semibold w-full"
                                />
                                <button onClick={() => handleDeletePost(post.id)} className="p-1 text-red-400"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                            <textarea
                                value={post.content}
                                onChange={e => handleUpdatePost(post.id, 'content', e.target.value)}
                                rows={3}
                                className="w-full bg-slate-600/50 p-2 rounded text-sm resize-y"
                            />
                        </div>
                    ))}
                </div>
                <button onClick={handleAddPost} className="w-full text-sm mt-2 p-2 bg-indigo-600/50 rounded-md hover:bg-indigo-600 flex items-center justify-center gap-1">
                    <PlusIcon className="w-4 h-4"/> إضافة مقالة
                </button>
            </SettingGroup>
        </div>
    );
};

export default BlogEditor;
