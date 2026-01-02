
import React from 'react';
import { PlusCircle } from 'lucide-react';

interface NoMatchViewProps {
  onAddDish: () => void;
}

const NoMatchView: React.FC<NoMatchViewProps> = ({ onAddDish }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-500">
      <div className="bg-slate-900 p-8 rounded-full mb-8 border border-slate-800 shadow-2xl relative">
        <span className="text-7xl block animate-bounce">🍕</span>
        <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-full border-4 border-slate-950">
          <PlusCircle size={20} className="text-white" />
        </div>
      </div>
      <h2 className="text-2xl font-black text-white mb-3">Alle Teller leer!</h2>
      <p className="text-slate-400 mb-10 max-w-[260px] mx-auto leading-relaxed">
        Du hast alle Vorschläge durchgesehen. Zeit für etwas Neues?
      </p>
      
      <button 
        onClick={onAddDish}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 px-8 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
      >
        <PlusCircle size={24} strokeWidth={2.5} />
        EIGENES GERICHT HINZUFÜGEN
      </button>
    </div>
  );
};

export default NoMatchView;
