
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';

import { USERS } from './constants.ts';
import { Dish, SwipeDirection, User } from './types.ts';
import { storageService } from './services/storageService.ts';

import Header from './components/Header.tsx';
import SwipeCard, { SwipeCardHandle } from './components/SwipeCard.tsx';
import ActionButtons from './components/ActionButtons.tsx';
import MatchOverlay from './components/MatchOverlay.tsx';
import AddDishModal from './components/AddDishModal.tsx';
import NoMatchView from './components/NoMatchView.tsx';

function App() {
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]);
  const [queue, setQueue] = useState<Dish[]>([]);
  const [matchedDish, setMatchedDish] = useState<Dish | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSwiping, setIsSwiping] = useState(false);

  const topCardRef = useRef<SwipeCardHandle>(null);

  const refreshQueue = useCallback(() => {
    try {
      const dishes = storageService.getQueueForUser(currentUser.id);
      setQueue(dishes);
    } catch (err) {
      console.error("Fehler beim Laden der Queue:", err);
      setQueue([]);
    }
  }, [currentUser.id]);

  useEffect(() => {
    refreshQueue();
    setLoading(false);
  }, [currentUser, refreshQueue]);

  const handleSwipe = async (direction: SwipeDirection) => {
    if (queue.length === 0) return;

    const dish = queue[0];
    const isLike = direction === SwipeDirection.RIGHT;

    const newQueue = queue.slice(1);
    setQueue(newQueue);
    setIsSwiping(false);

    storageService.castVote(currentUser.id, dish.id, isLike);

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

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-white">Laden...</div>;

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto bg-slate-950 relative shadow-2xl overflow-hidden border-x border-slate-900">
      
      <Header 
        currentUser={currentUser} 
        allUsers={USERS} 
        onSwitchUser={handleUserSwitch}
        onAddDish={() => setIsAddModalOpen(true)}
      />

      <main className="flex-grow relative w-full p-4 overflow-hidden flex flex-col">
        <div className="relative flex-grow w-full">
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
            <NoMatchView />
          )}
        </div>
      </main>

      <div className="bg-slate-950 z-10">
        <ActionButtons 
          disabled={queue.length === 0 || isSwiping}
          onDislike={() => handleButtonSwipe(SwipeDirection.LEFT)}
          onLike={() => handleButtonSwipe(SwipeDirection.RIGHT)}
        />
      </div>

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
