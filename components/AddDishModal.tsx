
import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Loader2, LogIn, AlertCircle } from 'lucide-react';
import heic2any from 'heic2any';
import { GOOGLE_CONFIG, STORAGE_KEYS } from '../constants';

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
  const [isConverting, setIsConverting] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(!!localStorage.getItem(STORAGE_KEYS.GOOGLE_TOKEN));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGoogleLogin = (e: React.MouseEvent) => {
    e.stopPropagation();
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CONFIG.CLIENT_ID,
      scope: GOOGLE_CONFIG.SCOPES,
      callback: (response: any) => {
        if (response.access_token) {
          localStorage.setItem(STORAGE_KEYS.GOOGLE_TOKEN, response.access_token);
          setIsGoogleConnected(true);
        }
      },
    });
    client.requestAccessToken();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsConverting(true);
    try {
      let fileToProcess: Blob = file;
      const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

      if (isHeic) {
        const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.7 });
        fileToProcess = Array.isArray(result) ? result[0] : result;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsConverting(false);
      };
      reader.readAsDataURL(fileToProcess);
    } catch (err) {
      console.error(err);
      setIsConverting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imagePreview && !isGoogleConnected) {
      // Wenn Bild gewählt aber nicht verbunden, Login triggern oder warnen
      alert("Für das Hochladen von Fotos ist eine Verbindung zu Google Drive erforderlich.");
      return;
    }

    if (dishName.trim() && !isSubmitting && !isConverting) {
      setIsSubmitting(true);
      try {
        await onSubmit(dishName.trim(), recipe.trim() || undefined, imagePreview || undefined);
        setDishName('');
        setRecipe('');
        setImagePreview(null);
        onClose();
      } catch (err: any) {
        alert(err.message || "Fehler beim Speichern");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <h3 className="text-xl font-black text-white tracking-tight">Neues Rezept</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Name des Gerichts *</label>
            <input
              type="text" required disabled={isSubmitting}
              className="w-full px-4 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg transition-all"
              placeholder="z.B. Mamas Lasagne"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Zutaten / Notizen</label>
            <textarea
              className="w-full px-4 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white min-h-[100px] resize-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Was brauchen wir alles?"
              value={recipe}
              onChange={(e) => setRecipe(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Foto {isConverting && " (wird verarbeitet...)"}
            </label>
            <div 
              onClick={() => !isSubmitting && !isConverting && fileInputRef.current?.click()}
              className="relative aspect-video w-full rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800 hover:bg-slate-750 transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden group"
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                  {!isGoogleConnected && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                      <AlertCircle className="text-amber-500 mb-3" size={32} />
                      <p className="text-white font-bold mb-4 text-sm">Google Drive Verbindung nötig um Fotos zu speichern</p>
                      <button 
                        type="button" 
                        onClick={handleGoogleLogin}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40"
                      >
                        <LogIn size={18} /> Jetzt verbinden
                      </button>
                    </div>
                  )}
                  {isGoogleConnected && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                      <Upload size={14} strokeWidth={3} />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-4 group-hover:scale-105 transition-transform">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ImageIcon className="text-slate-400" size={32} />
                  </div>
                  <p className="text-slate-400 font-bold">Foto hinzufügen</p>
                  <p className="text-slate-500 text-xs mt-1">Optional (Google Drive)</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.heic,.heif" onChange={handleImageChange} />
            </div>
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={!dishName.trim() || isSubmitting || isConverting || (imagePreview && !isGoogleConnected)}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xl hover:bg-blue-500 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/20 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  SPEICHERN...
                </>
              ) : (
                'REZEPT SPEICHERN'
              )}
            </button>
            {imagePreview && !isGoogleConnected && (
              <p className="text-center text-amber-500 text-[10px] font-bold uppercase tracking-wider mt-3">
                Verbindung erforderlich für Foto-Upload
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDishModal;
