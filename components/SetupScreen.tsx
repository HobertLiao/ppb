
import React, { useState, useRef, useEffect } from 'react';
import { GameMode, Player, Team } from '../types';
import Button from './common/Button';
import { useLocalization } from '../contexts/LocalizationContext';

interface SetupScreenProps {
  gameMode: GameMode;
  onGameStart: (teams: Team[], firstServerPlayerId: number) => void;
  onBack: () => void;
  isCompactMode: boolean;
}

const PlayerInput: React.FC<{ 
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    placeholder: string, 
    isCompact: boolean;
    inputRef?: (el: HTMLDivElement | null) => void;
}> = ({ value, onChange, placeholder, isCompact, inputRef }) => (
    <div ref={inputRef} className="w-full">
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full bg-gray-50 border-2 border-gray-300 text-gray-800 text-center focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 rounded-md transition-all ${isCompact ? 'p-1 text-xs md:p-2 md:text-sm' : 'p-2 text-sm md:p-3 md:text-lg'}`}
        />
    </div>
);

const SetupScreen: React.FC<SetupScreenProps> = ({ gameMode, onGameStart, onBack, isCompactMode }) => {
  const { t } = useLocalization();
  const isSingles = gameMode === GameMode.SINGLES || gameMode === GameMode.ADVANCED_SINGLES || gameMode === GameMode.SIMPLE_SINGLES;
  const isAdvanced = gameMode === GameMode.ADVANCED_SINGLES || gameMode === GameMode.ADVANCED_DOUBLES;
  const isSimple = gameMode === GameMode.SIMPLE_SINGLES || gameMode === GameMode.SIMPLE_DOUBLES;
  const isDoubles = !isSingles;

  const [playerNames, setPlayerNames] = useState<string[]>(
    isSingles
        ? [t('playerPlaceholder', { num: 1 }), t('playerPlaceholder', { num: 2 })]
        : [t('playerPlaceholderWithTeam', { teamNum: 1, letter: 'A' }), t('playerPlaceholderWithTeam', { teamNum: 1, letter: 'B' }), t('playerPlaceholderWithTeam', { teamNum: 2, letter: 'A' }), t('playerPlaceholderWithTeam', { teamNum: 2, letter: 'B' })]
    );
  
  // Initialize server: Team 1 bottom player (index 1) for Doubles, Player 1 (index 0) for Singles.
  const [firstServer, setFirstServer] = useState<number | null>(isDoubles ? 1 : 0);
  const [error, setError] = useState<string>('');

  // Refs for arrow calculation
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [arrowCoords, setArrowCoords] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);

  const setInputRef = (index: number, el: HTMLDivElement | null) => {
    inputRefs.current[index] = el;
  };

  useEffect(() => {
    if (!isDoubles || firstServer === null || !containerRef.current) {
        setArrowCoords(null);
        return;
    }

    const updateArrow = () => {
        const container = containerRef.current;
        if (!container) return;

        const serverEl = inputRefs.current[firstServer];
        
        // Setup Screen Doubles Indices:
        // Team 1: 0 (Top), 1 (Bottom)
        // Team 2: 2 (Top), 3 (Bottom)
        // Diagonal Rule: 0 <-> 3, 1 <-> 2
        let receiverIndex: number;
        if (firstServer === 0) receiverIndex = 3;
        else if (firstServer === 1) receiverIndex = 2;
        else if (firstServer === 2) receiverIndex = 1;
        else receiverIndex = 0;

        const receiverEl = inputRefs.current[receiverIndex];

        if (serverEl && receiverEl) {
            const cRect = container.getBoundingClientRect();
            const sRect = serverEl.getBoundingClientRect();
            const rRect = receiverEl.getBoundingClientRect();

            const isServerInTeam1 = firstServer < 2;

            const x1 = isServerInTeam1 
                ? (sRect.right - cRect.left) 
                : (sRect.left - cRect.left);
            const y1 = (sRect.top + sRect.height / 2) - cRect.top;

            const x2 = isServerInTeam1 
                ? (rRect.left - cRect.left) 
                : (rRect.right - cRect.left);
            const y2 = (rRect.top + rRect.height / 2) - cRect.top;

            setArrowCoords({ x1, y1, x2, y2 });
        }
    };

    updateArrow();
    const timeout = setTimeout(updateArrow, 100);
    window.addEventListener('resize', updateArrow);
    return () => {
        window.removeEventListener('resize', updateArrow);
        clearTimeout(timeout);
    };
  }, [firstServer, isDoubles, playerNames, isCompactMode]);

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleSelectFirstServer = (index: number) => {
    if (isSingles) {
        setFirstServer(index);
        return;
    }

    // Doubles Ordering Rule:
    // Team 1 server must be at Index 1 (Bottom)
    // Team 2 server must be at Index 2 (Top of right side)
    const newNames = [...playerNames];
    let finalServerIndex = index;

    if (index < 2) { // Team 1
        const targetIndex = 1; 
        if (index !== targetIndex) {
            // Swap Team 1 players
            [newNames[0], newNames[1]] = [newNames[1], newNames[0]];
            finalServerIndex = targetIndex;
        }
    } else { // Team 2
        const targetIndex = 2;
        if (index !== targetIndex) {
            // Swap Team 2 players
            [newNames[2], newNames[3]] = [newNames[3], newNames[2]];
            finalServerIndex = targetIndex;
        }
    }

    setPlayerNames(newNames);
    setFirstServer(finalServerIndex);
  };

  const handleStart = () => {
    if (playerNames.some(name => name.trim() === '')) {
      setError(t('errorPlayerName'));
      return;
    }
    if (firstServer === null) {
      setError(t('errorSelectServer'));
      return;
    }
    setError('');

    // Important: At this point playerNames are already in correct order
    const players: Player[] = playerNames.map((name, i) => ({ id: i, name }));
    let teams: Team[];

    if (isSingles) {
      teams = [
        { id: 1, players: [players[0]], score: 0 },
        { id: 2, players: [players[1]], score: 0 },
      ];
    } else {
      teams = [
        { id: 1, players: [players[0], players[1]], score: 0 },
        { id: 2, players: [players[2], players[3]], score: 0 },
      ];
    }

    // Use the player ID from the current firstServer index
    const firstServerId = players[firstServer].id;
    onGameStart(teams, firstServerId);
  };
  
  const getTitle = () => {
    let title = '';
    if (isAdvanced) title += t('advanced') + ' ';
    else if (isSimple) title += t('simple') + ' ';
    
    if (isSingles) title += t('singles') + ' ';
    else title += t('doubles') + ' ';
    title += t('setup');
    return title;
  };

  const renderPlayerInputs = () => {
    if (isSingles) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <h3 className={`mb-2 transition-all text-center ${isCompactMode ? 'text-sm' : 'text-xl'} text-green-700`}>{t('player')} 1</h3>
            <PlayerInput value={playerNames[0]} onChange={(e) => handleNameChange(0, e.target.value)} placeholder={t('playerPlaceholder', { num: 1 })} isCompact={isCompactMode} />
          </div>
          <div>
            <h3 className={`mb-2 transition-all text-center ${isCompactMode ? 'text-sm' : 'text-xl'} text-purple-700`}>{t('player')} 2</h3>
            <PlayerInput value={playerNames[1]} onChange={(e) => handleNameChange(1, e.target.value)} placeholder={t('playerPlaceholder', { num: 2 })} isCompact={isCompactMode} />
          </div>
        </div>
      );
    } else {
      return (
        <div ref={containerRef} className={`grid grid-cols-2 relative transition-all ${isCompactMode ? 'gap-2' : 'gap-4'}`}>
          {/* Arrow Overlay for Setup */}
          {arrowCoords && (
             <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                <defs>
                    <marker id="setup-arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                        <polygon points="0 0, 6 2, 0 4" fill={firstServer! < 2 ? '#15803d' : '#7e22ce'} />
                    </marker>
                </defs>
                <line 
                    x1={arrowCoords.x1} 
                    y1={arrowCoords.y1} 
                    x2={arrowCoords.x2} 
                    y2={arrowCoords.y2} 
                    stroke={firstServer! < 2 ? '#15803d' : '#7e22ce'} 
                    strokeWidth={isCompactMode ? "2" : "3"} 
                    strokeDasharray="5,5"
                    markerEnd="url(#setup-arrowhead)"
                />
             </svg>
          )}

          <div className={`border-2 border-green-700 rounded-lg bg-white z-10 transition-all ${isCompactMode ? 'p-1.5 space-y-1.5' : 'p-3 space-y-3 md:p-4 md:space-y-4'}`}>
            <h3 className={`text-center text-green-700 transition-all ${isCompactMode ? 'text-base' : 'text-lg md:text-2xl'}`}>{t('team')} 1</h3>
            <PlayerInput inputRef={(el) => setInputRef(0, el)} value={playerNames[0]} onChange={(e) => handleNameChange(0, e.target.value)} placeholder={t('playerPlaceholderWithTeam', { teamNum: 1, letter: 'A' })} isCompact={isCompactMode} />
            <PlayerInput inputRef={(el) => setInputRef(1, el)} value={playerNames[1]} onChange={(e) => handleNameChange(1, e.target.value)} placeholder={t('playerPlaceholderWithTeam', { teamNum: 1, letter: 'B' })} isCompact={isCompactMode} />
          </div>
          <div className={`border-2 border-purple-700 rounded-lg bg-white z-10 transition-all ${isCompactMode ? 'p-1.5 space-y-1.5' : 'p-3 space-y-3 md:p-4 md:space-y-4'}`}>
            <h3 className={`text-center text-purple-700 transition-all ${isCompactMode ? 'text-base' : 'text-lg md:text-2xl'}`}>{t('team')} 2</h3>
            <PlayerInput inputRef={(el) => setInputRef(2, el)} value={playerNames[2]} onChange={(e) => handleNameChange(2, e.target.value)} placeholder={t('playerPlaceholderWithTeam', { teamNum: 2, letter: 'A' })} isCompact={isCompactMode} />
            <PlayerInput inputRef={(el) => setInputRef(3, el)} value={playerNames[3]} onChange={(e) => handleNameChange(3, e.target.value)} placeholder={t('playerPlaceholderWithTeam', { teamNum: 2, letter: 'B' })} isCompact={isCompactMode} />
          </div>
        </div>
      );
    }
  };

  return (
    <div className={isCompactMode ? 'space-y-4' : 'space-y-8'}>
      <h2 className={`text-center text-purple-800 transition-all ${isCompactMode ? 'text-xl' : 'text-3xl'}`}>{getTitle()}</h2>
      {renderPlayerInputs()}
      
      <div>
        <h3 className={`text-center text-purple-800 mb-4 transition-all ${isCompactMode ? 'text-lg' : 'text-2xl'}`}>{t('selectFirstServer')}</h3>
        <div className={`grid gap-1.5 md:gap-4 ${isDoubles ? 'grid-cols-4' : 'grid-cols-2'}`}>
          {playerNames.map((name, index) => {
            if (!name.trim()) return null;
            const isTeam1 = index < 2;
            const isActive = firstServer === index;

            let activeClasses = "";
            if (isActive) {
                activeClasses = isTeam1 
                    ? 'bg-green-700 text-white border-green-700 shadow-sm scale-105' 
                    : 'bg-purple-700 text-white border-purple-700 shadow-sm scale-105';
            } else {
                activeClasses = isTeam1
                    ? 'bg-white border-gray-300 text-gray-700 hover:border-green-700 hover:text-green-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-purple-700 hover:text-purple-700';
            }

            return (
              <button 
                key={index}
                onClick={() => handleSelectFirstServer(index)}
                className={`border-2 rounded-md transition-all duration-200 truncate font-semibold ${isCompactMode ? 'p-1 text-[10px] md:text-xs' : 'p-2 text-xs md:p-3 md:text-base'} ${activeClasses}`}
              >
                {name}
              </button>
            )
          })}
        </div>
      </div>

      {error && <p className="text-red-500 text-center text-lg">{error}</p>}
      
      <div className={`flex flex-col md:flex-row gap-4 ${isCompactMode ? 'mt-4' : 'mt-8'}`}>
        <Button onClick={onBack} variant="danger" className={isCompactMode ? '!py-2 !text-base' : ''}>{t('back')}</Button>
        <Button onClick={handleStart} className={isCompactMode ? '!py-2 !text-base' : ''}>{t('startMatch')}</Button>
      </div>
    </div>
  );
};

export default SetupScreen;
