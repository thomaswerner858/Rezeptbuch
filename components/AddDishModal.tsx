
import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

interface AddDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, recipe?: string, imageUrl?: string) => Promise<void>;
}

const AddDishModal: React.FC<AddDishModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [dishName, setDishName] = useState('');
  const [recipe, setRecipe] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dishName.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onSubmit(dishName.trim(), recipe.trim() || undefined, imagePreview || undefined);
        resetForm();
        onClose();
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const resetForm = () => {
    setDishName('');
    setRecipe('');
    setImagePreview(null);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-800 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <h3 className="text-xl font-bold text-white">Gericht hinzufügen</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Name des Gerichts *
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-500 disabled:opacity-50"
              placeholder="z.B. Selbstgemachte Lasagne"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Rezept / Notizen (Optional)
            </label>
            <textarea
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-500 min-h-[100px] resize-none disabled:opacity-50"
              placeholder="Wie wird es zubereitet?"
              value={recipe}
              onChange={(e) => setRecipe(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Bild (Optional)
            </label>
            <div 
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
              className={`relative aspect-video w-full rounded-xl border-2 border-dashed border-slate-700 bg-slate-800 hover:bg-slate-750 transition-colors cursor-pointer flex flex-col items-center justify-center overflow-hidden group ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                  {!isSubmitting && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-medium flex items-center gap-2">
                        <Upload size={18} /> Ändern
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="mx-auto text-slate-500 mb-2" size={32} />
                  <p className="text-slate-400 text-sm">Bild hochladen oder Foto machen</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageChange}
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={!dishName.trim() || isSubmitting}
              className="w-full bg-blue-600 text-white py-4 px-4 rounded-xl font-bold text-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Wird gespeichert...
                </>
              ) : (
                'Gericht speichern'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDishModal;
