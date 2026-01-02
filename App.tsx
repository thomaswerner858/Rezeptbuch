
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';

import { USERS } from './constants';
import { Dish, SwipeDirection, User } from './types';
import { storageService } from './services/storageService';

import Header from './components/Header';
import SwipeCard, { SwipeCardHandle } from './components/SwipeCard';
import ActionButtons from './components/ActionButtons';
import MatchOverlay from './components/MatchOverlay';
import AddDishModal from './components/AddDishModal';
import NoMatchView from './components/NoMatchView';
import MatchesList from './components/MatchesList';

type View = 'swipe' | 'matches';

function App() {
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]);
  const [currentView, setCurrentView] = useState<View>('swipe');
  const [queue, setQueue] = useState<Dish[]>([]);
  const [matchedDish, setMatchedDish] = useState<Dish | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);

  const topCardRef = useRef<SwipeCardHandle>(null);

  const performSync = useCallback(async () => {
    setSyncing(true);
    try {
      await storageService.sync();
      const dishes = storageService.getQueueForUser(currentUser.id);
      setQueue(dishes);
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    performSync();
    // Alle 30 Sekunden im Hintergrund synchronisieren für Live-Matches
    const interval = setInterval(performSync, 30000);
    return () => clearInterval(interval);
  }, [performSync]);

  const matches = useMemo(() => {
    const allDishes = storageService.getDishes();
    return allDishes.filter(dish => storageService.checkForMatch(dish.id));
  }, [queue, matchedDish]);

  const handleSwipe = async (direction: SwipeDirection) => {
    if (queue.length === 0) return;

    const dish = queue[0];
    const isLike = direction === SwipeDirection.RIGHT;

    const newQueue = queue.slice(1);
    setQueue(newQueue);
    setIsSwiping(false);

    // Diese Funktion sendet den Vote nun auch an die Cloud
    await storageService.castVote(currentUser.id, dish.id, isLike);

    if (isLike) {
      const isMatch = storageService.checkForMatch(dish.id);
      if (isMatch) {
        setMatchedDish(dish);
      }
    }
  };

  const handleButtonSwipe = async (direction: SwipeDirection) => {
    if (queue.length === 0 || isSwiping || !topCardRef.current) return;
    setIsSwiping(true);
    await topCardRef.current.triggerSwipe(direction);
  };

  const handleUserSwitch = (userId: string) => {
    const user = USERS.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const handleAddDish = async (name: string, recipe?: string, imageBase64?: string) => {
    const newDish = await storageService.addDish(name, recipe, imageBase64);
    setQueue(prev => [newDish, ...prev]);
  };

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-slate-950 text-white gap-4">
      <Loader2 className="animate-spin text-blue-500" size={48} />
      <p className="text-slate-400 font-medium animate-pulse">Synchronisiere mit Partner...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-slate-950 relative shadow-2xl overflow-hidden border-x border-slate-900">
      
      <Header 
        currentUser={currentUser} 
        allUsers={USERS} 
        onSwitchUser={handleUserSwitch}
        onAddDish={() => setIsAddModalOpen(true)}
        currentView={currentView}
        onViewChange={setCurrentView}
        matchCount={matches.length}
      />

      {/* Sync Status Badge */}
      <div className="absolute top-[70px] right-4 z-[40] flex items-center gap-2">
        {syncing ? (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] text-blue-400 font-bold uppercase tracking-wider">
            <RefreshCw size={10} className="animate-spin" /> Syncing
          </span>
        ) : (
          <button 
            onClick={performSync}
            className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] text-green-400 font-bold uppercase tracking-wider hover:bg-green-500/20 transition-colors"
          >
            ● Live
          </button>
        )}
      </div>

      <main className="flex-grow relative w-full overflow-hidden flex flex-col">
        {currentView === 'swipe' ? (
          <div className="relative flex-grow w-full p-4">
            <div className="relative h-full w-full">
              {queue.length > 0 ? (
                queue.map((dish, index) => (
                  <SwipeCard 
                    key={dish.id} 
                    ref={index === 0 ? topCardRef : null}
                    dish={dish} 
                    index={index} 
                    onSwipe={handleSwipe}
                  />
                ))
              ) : (
                <div className="h-full flex flex-col">
                  <NoMatchView />
                  <button 
                    onClick={performSync}
                    className="mx-auto mt-4 px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 font-bold flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all"
                  >
                    <RefreshCw size={18} /> Nach neuen Rezepten suchen
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <MatchesList matches={matches} />
        )}
      </main>

      {currentView === 'swipe' && (
        <div className="bg-slate-950 z-10">
          <ActionButtons 
            disabled={queue.length === 0 || isSwiping}
            onDislike={() => handleButtonSwipe(SwipeDirection.LEFT)}
            onLike={() => handleButtonSwipe(SwipeDirection.RIGHT)}
          />
        </div>
      )}

      <AnimatePresence>
        {matchedDish && (
          <MatchOverlay 
            dish={matchedDish} 
            onClose={() => setMatchedDish(null)} 
          />
        )}
      </AnimatePresence>

      <AddDishModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddDish}
      />
    </div>
  );
}

export default App;
