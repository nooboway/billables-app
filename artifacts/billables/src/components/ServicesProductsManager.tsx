import React, { useState } from 'react';
import { Plus, Trash2, Box, Scissors } from 'lucide-react';
import { Product, Service, TemplateSettings } from '../types';
import { motion } from 'motion/react';

interface Props {
  products: Product[]; onAddProduct: (p: Product) => void; onRemoveProduct: (id: string) => void;
  services: Service[]; onAddService: (s: Service) => void; onRemoveService: (id: string) => void;
  templateSettings: TemplateSettings;
}

export default function ServicesProductsManager({
  products, onAddProduct, onRemoveProduct,
  services, onAddService, onRemoveService,
  templateSettings
}: Props) {
  const [tab, setTab] = useState<'products'|'services'>('products');
  const [isCreating, setIsCreating] = useState(false);
  
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState<number|''>('');
  const [unit, setUnit] = useState('Unit');

  const format = (n: number) => `${templateSettings.currencySymbol || '$'}${n.toLocaleString()}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!name || typeof price !== 'number') return;
    
    if(tab === 'products') {
      onAddProduct({ id: `p-${Date.now()}`, name, description: desc, price, unit, discount: 0 });
    } else {
      onAddService({ id: `s-${Date.now()}`, name, description: desc, price, unit, discount: 0 });
    }
    setName(''); setDesc(''); setPrice(''); setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">Catalog</h2>
          <p className="text-sm text-stone-500 mt-1">Manage reusable products and services.</p>
        </div>
        <div className="flex bg-stone-100 p-1 rounded-lg">
          <button onClick={() => {setTab('products'); setIsCreating(false);}} className={`px-4 py-1.5 flex items-center gap-2 rounded-md text-xs font-bold transition-colors ${tab === 'products' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}><Box className="w-3.5 h-3.5"/> Products</button>
          <button onClick={() => {setTab('services'); setIsCreating(false);}} className={`px-4 py-1.5 flex items-center gap-2 rounded-md text-xs font-bold transition-colors ${tab === 'services' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}><Scissors className="w-3.5 h-3.5"/> Services</button>
        </div>
      </div>

      {!isCreating ? (
        <button onClick={() => setIsCreating(true)} className="w-full py-4 border-2 border-dashed border-stone-200 rounded-xl text-stone-500 hover:text-stone-900 hover:border-stone-300 hover:bg-stone-50 transition-all flex items-center justify-center gap-2 font-medium text-sm">
          <Plus className="w-4 h-4" /> Add New {tab === 'products' ? 'Product' : 'Service'}
        </button>
      ) : (
        <motion.form initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="bg-stone-50 border border-stone-200 rounded-xl p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-stone-900">New {tab === 'products' ? 'Product' : 'Service'}</h3>
            <button type="button" onClick={() => setIsCreating(false)} className="text-xs font-bold text-stone-500 hover:text-stone-900">CANCEL</button>
          </div>
          <div><label className="block text-xs font-bold text-stone-500 mb-1">NAME</label><input type="text" required value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-primary"/></div>
          <div><label className="block text-xs font-bold text-stone-500 mb-1">DESCRIPTION</label><textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-primary h-20"/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-stone-500 mb-1">PRICE</label><input type="number" required value={price} onChange={e=>setPrice(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-primary"/></div>
            <div><label className="block text-xs font-bold text-stone-500 mb-1">UNIT</label><input type="text" required value={unit} onChange={e=>setUnit(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg outline-none focus:border-primary"/></div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-stone-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider">Save Item</button>
        </motion.form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(tab === 'products' ? products : services).map(item => (
          <div key={item.id} className="bg-white border border-stone-200 rounded-xl p-5 hover:shadow-md transition-shadow group relative">
            <button onClick={() => tab==='products' ? onRemoveProduct(item.id) : onRemoveService(item.id)} className="absolute top-3 right-3 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-4 h-4"/>
            </button>
            <div className="font-bold text-stone-900 pr-8">{item.name}</div>
            <div className="text-xs text-stone-500 mt-1 line-clamp-2 min-h-[32px]">{item.description || 'No description'}</div>
            <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{item.unit}</span>
              <span className="font-mono font-bold text-stone-900">{format(item.price)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
