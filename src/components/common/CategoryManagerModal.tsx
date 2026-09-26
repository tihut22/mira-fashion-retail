import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useRetail } from '../../context/RetailContext';

export const CategoryManagerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { categories, addCategory } = useRetail();
  const [newCatName, setNewCatName] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-stone-900">Manage Categories</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-stone-400" /></button>
        </div>
        
        <div className="flex gap-2">
            <input 
                type="text" 
                value={newCatName} 
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New category name"
                className="flex-1 p-2 border border-stone-300 rounded-lg text-sm"
            />
            <button 
                onClick={() => {
                    if(newCatName.trim()) {
                        addCategory(newCatName.trim());
                        setNewCatName('');
                    }
                }}
                className="p-2 bg-stone-900 text-white rounded-lg"
            >
                <Plus className="w-5 h-5" />
            </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
            {categories.map(c => (
                <div key={c.id} className="flex justify-between items-center p-2 bg-stone-50 rounded-lg text-sm">
                    {c.name}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
