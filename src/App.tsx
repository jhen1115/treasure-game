import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './components/ui/button';
import { AuthScreen } from './components/AuthScreen';
import { saveScore, getMyScores, ScoreEntry } from './api';
import closedChest from './assets/treasure_closed.png';
import treasureChest from './assets/treasure_opened.png';
import skeletonChest from './assets/treasure_opened_skeleton.png';
import chestOpenSound from './audios/chest_open.mp3';
import evilLaughSound from './audios/chest_open_with_evil_laugh.mp3';
import keyImage from './assets/key.png';

interface Box {
  id: number;
  isOpen: boolean;
  hasTreasure: boolean;
}

type AuthUser = { token: string; username: string };
type User = AuthUser | 'guest' | null;

export default function App() {
  const [user, setUser] = useState<User>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreEntry[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);

  // Restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('treasureUser');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('treasureUser');
      }
    }
  }, []);

  // Start game when user is set (after auth or guest selection)
  useEffect(() => {
    if (user !== null) initializeGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Save score and fetch history when game ends (authenticated users only)
  useEffect(() => {
    if (!gameEnded || !user || user === 'guest') return;
    const authUser = user as AuthUser;
    const won = boxes.some(b => b.isOpen && b.hasTreasure);
    saveScore(authUser.token, score, won)
      .then(() => getMyScores(authUser.token))
      .then(history => setScoreHistory(history));
  // Intentionally only trigger on gameEnded — boxes/score/user are current at render time
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameEnded]);

  const handleAuth = (token: string, username: string) => {
    const u: AuthUser = { token, username };
    setUser(u);
    localStorage.setItem('treasureUser', JSON.stringify(u));
    setScoreHistory([]);
  };

  const handleGuest = () => setUser('guest');

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('treasureUser');
    setScoreHistory([]);
  };

  const initializeGame = () => {
    const treasureBoxIndex = Math.floor(Math.random() * 3);
    const newBoxes: Box[] = Array.from({ length: 3 }, (_, index) => ({
      id: index,
      isOpen: false,
      hasTreasure: index === treasureBoxIndex,
    }));
    setBoxes(newBoxes);
    setScore(0);
    setGameEnded(false);
  };

  const openBox = (boxId: number) => {
    if (gameEnded) return;
    setBoxes(prevBoxes => {
      const updatedBoxes = prevBoxes.map(box => {
        if (box.id === boxId && !box.isOpen) {
          new Audio(box.hasTreasure ? chestOpenSound : evilLaughSound).play();
          const newScore = box.hasTreasure ? score + 150 : score - 50;
          setScore(newScore);
          return { ...box, isOpen: true };
        }
        return box;
      });
      const treasureFound = updatedBoxes.some(box => box.isOpen && box.hasTreasure);
      const allOpened = updatedBoxes.every(box => box.isOpen);
      if (treasureFound || allOpened) setGameEnded(true);
      return updatedBoxes;
    });
  };

  if (user === null) {
    return <AuthScreen onAuth={handleAuth} onGuest={handleGuest} />;
  }

  const isAuthenticated = user !== 'guest';
  const username = isAuthenticated ? (user as AuthUser).username : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
      {/* Auth header */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <span className="text-amber-800 text-sm font-medium">👤 {username}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              Sign Out
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            ← Sign In
          </Button>
        )}
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl mb-4 text-amber-900">🏴‍☠️ Treasure Hunt Game 🏴‍☠️</h1>
        <p className="text-amber-800 mb-4">
          Click on the treasure chests to discover what's inside!
        </p>
        <p className="text-amber-700 text-sm">
          💰 Treasure: +$150 | 💀 Skeleton: -$50
        </p>
      </div>

      <div className="mb-8">
        <div className="text-2xl text-center p-4 bg-amber-200/80 backdrop-blur-sm rounded-lg shadow-lg border-2 border-amber-400">
          <span className="text-amber-900">Current Score: </span>
          <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${score}
          </span>
          {gameEnded && (
            <span className={`ml-4 font-bold ${score > 0 ? 'text-green-600' : score === 0 ? 'text-yellow-600' : 'text-red-600'}`}>
              {score > 0 ? '🏆 WIN' : score === 0 ? '🤝 TIE' : '💀 LOSS'}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {boxes.map((box) => (
          <motion.div
            key={box.id}
            className="flex flex-col items-center"
            style={{ cursor: box.isOpen ? 'default' : `url(${keyImage}), pointer` }}
            whileHover={{ scale: box.isOpen ? 1 : 1.05 }}
            whileTap={{ scale: box.isOpen ? 1 : 0.95 }}
            onClick={() => openBox(box.id)}
          >
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{
                rotateY: box.isOpen ? 180 : 0,
                scale: box.isOpen ? 1.1 : 1,
              }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="relative"
            >
              <img
                src={box.isOpen ? (box.hasTreasure ? treasureChest : skeletonChest) : closedChest}
                alt={box.isOpen ? (box.hasTreasure ? 'Treasure!' : 'Skeleton!') : 'Treasure Chest'}
                className="w-48 h-48 object-contain drop-shadow-lg"
              />
              {box.isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                >
                  {box.hasTreasure ? (
                    <div className="text-2xl animate-bounce">✨💰✨</div>
                  ) : (
                    <div className="text-2xl animate-pulse">💀👻💀</div>
                  )}
                </motion.div>
              )}
            </motion.div>

            <div className="mt-4 text-center">
              {box.isOpen ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className={`text-lg p-2 rounded-lg ${
                    box.hasTreasure
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {box.hasTreasure ? '+$150' : '-$50'}
                </motion.div>
              ) : (
                <div className="text-amber-700 p-2">Click to open!</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {gameEnded && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center w-full max-w-md"
        >
          <div className="mb-4 p-6 bg-amber-200/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-amber-400">
            <h2 className="text-2xl mb-2 text-amber-900">Game Over!</h2>
            <p className="text-lg text-amber-800">
              Final Score:{' '}
              <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>${score}</span>
            </p>
            <p className="text-sm text-amber-600 mt-2">
              {boxes.some(box => box.isOpen && box.hasTreasure)
                ? 'Treasure found! Well done, treasure hunter! 🎉'
                : 'No treasure found this time! Better luck next time! 💀'}
            </p>

            {/* Score history for authenticated users */}
            {isAuthenticated && scoreHistory.length > 0 && (
              <div className="mt-4 border-t border-amber-300 pt-4">
                <p className="text-sm font-semibold text-amber-800 mb-2">Your Recent Games</p>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {scoreHistory.map((entry, i) => (
                    <div key={i} className="flex justify-between text-sm text-amber-700">
                      <span>{new Date(entry.played_at).toLocaleDateString()}</span>
                      <span className={entry.score >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${entry.score}
                      </span>
                      <span>{entry.won ? '🏆' : '💀'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={initializeGame}
            className="text-lg px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white"
          >
            Play Again
          </Button>
        </motion.div>
      )}
    </div>
  );
}
