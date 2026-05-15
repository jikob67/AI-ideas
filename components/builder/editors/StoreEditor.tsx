import React from 'react';
import { ProjectSection, StoreProduct } from '../../../types';
import SettingGroup from '../SettingGroup';
import { PlusIcon, TrashIcon, PhotoIcon } from '../../Icons';

const StoreEditor: React.FC<{ section: ProjectSection; onUpdate: (s: ProjectSection) => void }> = ({ section, onUpdate }) => {
    const products = (section.config.products || []) as StoreProduct[];

    const handleUpdateProduct = (productId: string, field: keyof StoreProduct, value: string | number) => {
        const updatedProducts = products.map(p => p.id === productId ? { ...p, [field]: value } : p);
        onUpdate({ ...section, config: { ...section.config, products: updatedProducts }});
    };
    
    const handleAddProduct = () => {
        const newProduct: StoreProduct = {
            id: `prod-${Date.now()}`,
            name: 'منتج جديد',
            price: 9.99,
            description: 'وصف المنتج.',
            imageUrl: ''
        };
        onUpdate({ ...section, config: { ...section.config, products: [...products, newProduct] }});
    };
    
    const handleDeleteProduct = (productId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
            const updatedProducts = products.filter(p => p.id !== productId);
            onUpdate({ ...section, config: { ...section.config, products: updatedProducts }});
        }
    };

    const handleProductImageUpload = (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                handleUpdateProduct(productId, 'imageUrl', dataUrl);
            };
            reader.readAsDataURL(file);
        }
    };
    
    return (
        <div>
            <SettingGroup title="إدارة المنتجات">
                <div className="space-y-3">
                    {products.map(product => (
                        <div key={product.id} className="bg-slate-700/50 p-3 rounded-lg space-y-2 border border-slate-600">
                            <div className="flex justify-between items-start gap-3">
                                <label htmlFor={`img-upload-${product.id}`} className="cursor-pointer w-20 h-20 flex-shrink-0 rounded bg-slate-600 flex items-center justify-center text-slate-400 hover:bg-slate-500">
                                    {product.imageUrl ?
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full rounded object-cover" />
                                        : <PhotoIcon className="w-8 h-8 text-slate-500" />
                                    }
                                </label>
                                <input id={`img-upload-${product.id}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleProductImageUpload(product.id, e)} />
                                <div className="flex-grow space-y-1">
                                    <input 
                                        type="text" value={product.name} onChange={e => handleUpdateProduct(product.id, 'name', e.target.value)}
                                        className="w-full bg-slate-600 p-1 rounded text-sm font-semibold"
                                        placeholder="اسم المنتج"
                                    />
                                    <input 
                                        type="number" value={product.price} onChange={e => handleUpdateProduct(product.id, 'price', parseFloat(e.target.value))}
                                        className="w-full bg-slate-600 p-1 rounded text-sm"
                                        placeholder="السعر"
                                    />
                                </div>
                                <button onClick={() => handleDeleteProduct(product.id)} className="p-1 text-red-400 hover:bg-red-500/20 rounded-full flex-shrink-0"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                            <textarea
                                value={product.description} onChange={e => handleUpdateProduct(product.id, 'description', e.target.value)}
                                rows={2}
                                className="w-full bg-slate-600 p-1 rounded text-xs"
                                placeholder="وصف قصير للمنتج"
                            />
                            <input 
                                type="text" value={product.imageUrl} onChange={e => handleUpdateProduct(product.id, 'imageUrl', e.target.value)}
                                className="w-full bg-slate-600 p-1 rounded text-xs"
                                placeholder="أو الصق رابط الصورة هنا"
                            />
                        </div>
                    ))}
                </div>
                <button onClick={handleAddProduct} className="w-full text-sm mt-3 p-2 bg-indigo-600/50 rounded-md hover:bg-indigo-600 flex items-center justify-center gap-1">
                    <PlusIcon className="w-4 h-4"/> إضافة منتج
                </button>
            </SettingGroup>
        </div>
    );
};

export default StoreEditor;