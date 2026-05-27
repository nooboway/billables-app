/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tag, Plus, Trash2, Scissors, ShoppingBag, FolderPlus } from 'lucide-react';
import { Product, Service, TemplateSettings } from '../types';

interface ServicesProductsManagerProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onRemoveProduct: (id: string) => void;
  services: Service[];
  onAddService: (service: Service) => void;
  onRemoveService: (id: string) => void;
  templateSettings: TemplateSettings;
}

export default function ServicesProductsManager({
  products,
  onAddProduct,
  onRemoveProduct,
  services,
  onAddService,
  onRemoveService,
  templateSettings,
}: ServicesProductsManagerProps) {
  const [activeCatalog, setActiveCatalog] = useState<'products' | 'services'>('products');
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState(0);
  const [itemUnit, setItemUnit] = useState('Pack'); // Hour, Session, Pack, etc
  const [duration, setDuration] = useState(30);

  const currencySymbol = templateSettings.currencySymbol || '₦';

  const formatValue = (num: number) => {
    return `${currencySymbol}${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
    })}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName) return;

    if (activeCatalog === 'products') {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: itemName,
        description: itemDesc,
        price: itemPrice,
        unit: itemUnit,
        discount: 0,
      };
      onAddProduct(newProd);
    } else {
      const newServ: Service = {
        id: `serv-${Date.now()}`,
        name: itemName,
        description: itemDesc,
        price: itemPrice,
        unit: itemUnit,
        discount: 0,
        durationMinutes: duration,
      };
      onAddService(newServ);
    }

    // Reset Form
    setItemName('');
    setItemDesc('');
    setItemPrice(0);
    setIsCreating(false);
  };  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm font-sans feature-card cursor-pointer" id="catalog-manager-section">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-5 border-b border-stone-100 mb-6 gap-4 select-none">
        <div>
          <span className="text-[11px] tracking-[0.06em] text-[#E54A13] uppercase font-black block mb-1">INVENTORY CATALOG</span>
          <h2 className="text-2xl md:text-3xl font-black tracking-[-0.035em] text-stone-900 flex items-center gap-2">
            Commodities Library
          </h2>
          <p className="text-[13px] text-stone-500 mt-1">Predefine recurring goods or tariffs for instant click-to-invoice insertion.</p>
        </div>

        {/* Catalog Selector Tabs */}
        <div className="flex gap-2.5">
          <button
            onClick={() => { setActiveCatalog('products'); setIsCreating(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer border-0 ${
              activeCatalog === 'products' ? 'bg-[#E54A13] text-white shadow-md' : 'bg-stone-100 text-stone-500 hover:text-stone-700'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Products ({products.length})
          </button>
          <button
            onClick={() => { setActiveCatalog('services'); setIsCreating(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer border-0 ${
              activeCatalog === 'services' ? 'bg-[#E54A13] text-white shadow-md' : 'bg-stone-100 text-stone-500 hover:text-stone-700'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            Services ({services.length})
          </button>
        </div>
      </div>

      {/* COLLPABLE CREATOR BLOCK */}
      {isCreating ? (
        <form onSubmit={handleSubmit} className="bg-stone-50 border border-stone-200 p-4 rounded-xl mb-4 space-y-3.5 animate-slide-up text-xs font-sans">
          <div className="flex justify-between items-center pb-2 border-b border-stone-200 select-none">
            <span className="font-extrabold text-[#E54A13] uppercase tracking-widest text-[9px] flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5" />
              Add new {activeCatalog === 'products' ? 'Product SKU' : 'Service Offer'}
            </span>
            <button 
              type="button" 
              onClick={() => setIsCreating(false)} 
              className="text-stone-400 hover:text-stone-600 text-[10px] uppercase font-bold cursor-pointer border-0 bg-transparent"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-stone-450 text-stone-400 font-bold block text-[10px] uppercase">Item Name</label>
            <input 
              type="text" 
              value={itemName} 
              onChange={(e) => setItemName(e.target.value)}
              placeholder={activeCatalog === 'products' ? 'e.g. Fine Herb Slimming Pack' : 'e.g. Initial alignment Checkup'}
              className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] rounded-xl px-2.5 py-1.5 text-xs text-stone-800 outline-none font-sans"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-stone-450 text-stone-400 font-bold block text-[10px] uppercase">Long Description (Appears inside final invoice)</label>
            <textarea 
              value={itemDesc} 
              onChange={(e) => setItemDesc(e.target.value)}
              placeholder="Provide a thorough, professional billing description..."
              className="w-full h-16 bg-white border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] rounded-xl px-2.5 py-1.5 text-xs text-stone-800 outline-none font-sans"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-stone-450 text-stone-400 font-bold block text-[10px] uppercase">Price ({currencySymbol})</label>
              <input 
                type="number" 
                value={itemPrice || ''} 
                onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] rounded-xl px-2.5 py-1.5 text-xs text-stone-800 outline-none font-sans"
                min="0"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-stone-450 text-stone-400 font-bold block text-[10px] uppercase">Billing Unit Size</label>
              <select 
                value={itemUnit} 
                onChange={(e) => setItemUnit(e.target.value)}
                className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] rounded-xl px-2.5 py-1.5 text-xs text-stone-800 outline-none font-sans"
              >
                <option value="Pack">Pack</option>
                <option value="Hourly">Hour</option>
                <option value="Session">Session</option>
                <option value="Box">Box</option>
                <option value="Piece">Piece</option>
              </select>
            </div>

            {activeCatalog === 'services' && (
              <div className="space-y-1 col-span-2 md:col-span-1">
                <label className="text-stone-450 text-stone-400 font-bold block text-[10px] uppercase">Duration (Minutes)</label>
                <input 
                  type="number" 
                  value={duration} 
                  onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                  className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-[#E54A13] focus:border-[#E54A13] rounded-xl px-2.5 py-1.5 text-xs text-stone-800 outline-none font-sans"
                  min="1"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-[#E54A13] hover:bg-orange-700 text-white rounded-xl font-bold uppercase tracking-wide transition-all cursor-pointer shadow-md border-0"
          >
            Create Item Record
          </button>
        </form>
      ) : (
        <div className="mb-4">
          <button
            onClick={() => setIsCreating(true)}
            className="px-3.5 py-2.5 bg-white border border-stone-200 hover:border-[#E54A13] hover:text-[#E54A13] text-stone-650 rounded-xl flex items-center gap-1.5 w-full justify-center transition-all cursor-pointer text-xs uppercase font-extrabold shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#E54A13]" />
            Create fresh {activeCatalog === 'products' ? 'Product' : 'Service'}
          </button>
        </div>
      )}

      {/* Catalog Render Lists */}
      <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
        {activeCatalog === 'products' ? (
          products.length === 0 ? (
            <p className="text-center py-8 text-stone-400 font-sans text-xs italic">No products in catalog yet.</p>
          ) : (
            products.map((item) => (
              <div 
                key={item.id} 
                className="p-3 bg-stone-50 border border-stone-100 rounded-xl flex justify-between items-center hover:bg-stone-100/50 transition-all text-xs font-sans"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-800 text-sm">{item.name}</span>
                    <span className="px-1.5 py-0.2 bg-stone-200 text-[9px] text-stone-650 font-bold rounded uppercase">Pack unit</span>
                  </div>
                  {item.description && (
                    <p className="text-[10px] text-stone-450 mt-0.5 leading-normal">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-stone-800 text-sm select-none">{formatValue(item.price)}</span>
                  <button
                    onClick={() => onRemoveProduct(item.id)}
                    className="p-1.5 bg-white border border-stone-200 hover:border-[#E54A13] text-stone-400 hover:text-[#E54A13] rounded-lg transition-all cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          services.length === 0 ? (
            <p className="text-center py-8 text-stone-400 font-sans text-xs italic">No services in catalog yet.</p>
          ) : (
            services.map((item) => (
              <div 
                key={item.id} 
                className="p-3 bg-stone-50 border border-stone-100 rounded-xl flex justify-between items-center hover:bg-stone-100/50 transition-all text-xs font-sans"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-800 text-sm">{item.name}</span>
                    {item.durationMinutes && (
                      <span className="px-1.5 py-0.2 bg-stone-200 text-[9px] text-stone-650 font-bold rounded uppercase">{item.durationMinutes} mins</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[10px] text-stone-450 mt-0.5 leading-normal">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-stone-800 text-sm select-none">{formatValue(item.price)}</span>
                  <button
                    onClick={() => onRemoveService(item.id)}
                    className="p-1.5 bg-white border border-stone-200 hover:border-[#E54A13] text-stone-400 hover:text-[#E54A13] rounded-lg transition-all cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
