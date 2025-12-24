import React, { useState, useEffect, useRef } from 'react';
import { Team, GameMode, Player } from '../types';
import Button from './common/Button';
import { WINNER_REASON_KEYS, ERROR_REASON_KEYS } from '../constants';
import { useLocalization } from '../contexts/LocalizationContext';

const MIN_FONT_SIZE_LEVEL = 1;
const MAX_FONT_SIZE_LEVEL = 5;

interface GameScreenProps {
  teams: Team[];
  servingTeamId: number | null;
  serverPlayerId: number | null;
  onScore: (teamId: number) => void;
  onDecrementScore: (teamId: number) => void;
  onFault: () => void;
  onSetServer: (playerId: number) => void;
  onRecordPoint: (playerId: number, type: 'winner' | 'error', reason: string) => void;
  isAdvanced: boolean;
  gameMode: GameMode;
  serverNumber: 1 | 2;
  onReset: () => void;
  onUndo: () => void;
  canUndo: boolean;
  isCompactMode: boolean;
  scoreFontSizeLevel: number;
  onIncreaseScoreFontSize: () => void;
  onDecreaseScoreFontSize: () => void;
}

const PlayerDisplay: React.FC<{ 
    player: Player; 
    isServer: boolean; 
    onSelect: () => void; 
    className?: string;
    isCompact: boolean;
    teamId: number;
    buttonRef?: (el: HTMLButtonElement | null) => void;
    locked: boolean;
}> = ({ player, isServer, onSelect, className = '', isCompact, teamId, buttonRef, locked }) => {
    const { t } = useLocalization();
    
    // Team 1 = Green, Team 2 = Purple
    const activeClass = teamId === 1 
        ? 'bg-green-700 text-white' 
        : 'bg-purple-700 text-white';
        
    const inactiveClass = teamId === 1
        ? (locked ? 'bg-green-50 text-green-900 cursor-default' : 'bg-green-50 hover:bg-green-100 text-green-900 cursor-pointer') 
        : (locked ? 'bg-purple-50 text-purple-900 cursor-default' : 'bg-purple-50 hover:bg-purple-100 text-purple-900 cursor-pointer');

    return (
        <button 
            ref={buttonRef}
            onClick={locked ? undefined : onSelect}
            disabled={locked && !isServer}
            className={`w-full text-center transition-all duration-200 truncate rounded-md border-2 border-transparent ${isServer ? activeClass + ' shadow-md !border-yellow-400' : inactiveClass} ${className} ${isCompact ? 'p-1 text-sm' : 'p-2 text-base'} disabled:opacity-100`}
            aria-label={t('setServerAria', { playerName: player.name })}
        >
            <div className="flex items-center justify-center gap-2">
                <span className="truncate">{player.name}</span>
                {isServer && locked && (
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 md:w-4 md:h-4 text-yellow-300 flex-shrink-0">
                        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                    </svg>
                )}
            </div>
        </button>
    );
};

const AdvancedControls: React.FC<{ teams: Team[], onRecordPoint: GameScreenProps['onRecordPoint'], isCompact: boolean }> = ({ teams, onRecordPoint, isCompact }) => {
    const { t } = useLocalization();
    const [actionPlayerId, setActionPlayerId] = useState<number | null>(null);

    const handleRecord = (type: 'winner' | 'error', reasonKey: string) => {
        if (actionPlayerId === null) return;
        onRecordPoint(actionPlayerId, type, reasonKey);
        setActionPlayerId(null); // Reset after recording
    };
    
    return (
        <div className="w-full bg-gray-50 p-3 rounded-lg border space-y-3 z-10 relative">
            <div>
                <p className={`text-center font-bold text-gray-700 mb-2 ${isCompact ? 'text-xs' : 'text-sm'}`}>{t('rallyPlayerPrompt')}</p>
                <div className="grid grid-cols-2 gap-2">
                    {teams.map(team => (
                        <div key={team.id} className="space-y-1">
                            {team.players.map(player => (
                                <button
                                    key={player.id}
                                    onClick={() => setActionPlayerId(player.id)}
                                    className={`w-full rounded border-2 truncate transition-all ${isCompact ? 'py-0.5 text-xs' : 'py-1 text-sm'} ${actionPlayerId === player.id ? 'bg-purple-700 text-white border-purple-700' : 'bg-white hover:border-purple-500 border-gray-300'}`}
                                >
                                    {player.name}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {actionPlayerId !== null && (
                <div>
                    <p className={`text-center font-bold text-gray-700 mb-2 ${isCompact ? 'text-xs' : 'text-sm'}`}>{t('outcomePrompt')}</p>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-center text-xs text-green-700 mb-1">{t('winner').toUpperCase()}</p>
                            <div className="flex flex-col gap-1">
                                {WINNER_REASON_KEYS.map(reasonKey => (
                                    <button key={reasonKey} onClick={() => handleRecord('winner', reasonKey)} className={`bg-green-100 text-green-800 rounded hover:bg-green-200 transition-all ${isCompact ? 'py-0.5 text-xs' : 'py-1 text-sm'}`}>
                                        {t(reasonKey)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-center text-xs text-red-700 mb-1">{t('error').toUpperCase()}</p>
                            <div className="flex flex-col gap-1">
                                {ERROR_REASON_KEYS.map(reasonKey => (
                                    <button key={reasonKey} onClick={() => handleRecord('error', reasonKey)} className={`bg-red-100 text-red-800 rounded hover:bg-red-200 transition-all ${isCompact ? 'py-0.5 text-xs' : 'py-1 text-sm'}`}>
                                        {t(reasonKey)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const NormalControls: React.FC<{ servingTeam: Team, onDecrementScore: (id: number) => void, onScore: (id: number) => void, isCompact: boolean }> = ({ servingTeam, onDecrementScore, onScore, isCompact }) => (
    <div className="w-full z-10 relative">
        <div className="flex gap-4 w-full">
            <Button 
                onClick={() => onDecrementScore(servingTeam.id)} 
                variant="danger" 
                className={`text-2xl ${isCompact ? '!py-1.5' : '!py-2'}`}
            >
                -
            </Button>
            <Button 
                onClick={() => onScore(servingTeam.id)} 
                variant={servingTeam.id === 1 ? 'primary' : 'secondary'}
                className={`text-2xl ${isCompact ? '!py-1.5' : '!py-2'}`}
            >
                +
            </Button>
        </div>
    </div>
);

const SimpleControls: React.FC<{ servingTeamId: number, onScore: (id: number) => void, onFault: () => void, isCompact: boolean }> = ({ servingTeamId, onScore, onFault, isCompact }) => {
    const { t } = useLocalization();
    const btnColorClass = servingTeamId === 1 
        ? 'bg-green-700 hover:bg-green-800 focus:ring-green-500' 
        : 'bg-purple-700 hover:bg-purple-800 focus:ring-purple-500';

    return (
        <div className="flex gap-4 w-full mt-2 z-10 relative">
            <button 
                onClick={() => onScore(servingTeamId)}
                className={`flex-1 flex flex-col items-center justify-center rounded-lg shadow-lg text-white font-bold transition-transform active:scale-95 ${btnColorClass} ${isCompact ? 'py-4 text-xl' : 'py-8 text-3xl'}`}
            >
                <div className={`border-4 border-white rounded-full flex items-center justify-center mb-2 ${isCompact ? 'w-12 h-12 text-2xl' : 'w-20 h-20 text-4xl'}`}>O</div>
                <span>{t('pointBtn')}</span>
            </button>
            <button 
                onClick={onFault}
                className={`flex-1 flex flex-col items-center justify-center rounded-lg shadow-lg text-white font-bold transition-transform active:scale-95 ${btnColorClass} ${isCompact ? 'py-4 text-xl' : 'py-8 text-3xl'}`}
            >
                <div className={`border-4 border-white rounded-full flex items-center justify-center mb-2 ${isCompact ? 'w-12 h-12 text-2xl' : 'w-20 h-20 text-4xl'}`}>X</div>
                <span>{t('faultBtn')}</span>
            </button>
        </div>
    );
};

const getScoreFontSizeClass = (level: number, isCompact: boolean): string => {
    const compactShift = isCompact ? -1 : 0;
    const effectiveLevel = Math.max(1, level + compactShift);
    
    const sizeMap: { [key: number]: string } = {
        1: 'text-5xl md:text-6xl',
        2: 'text-6xl md:text-7xl',
        3: 'text-7xl md:text-8xl',
        4: 'text-8xl md:text-9xl',
        5: 'text-9xl md:text-[10rem]',
    };
    return sizeMap[effectiveLevel] || 'text-8xl md:text-9xl';
};

const FontSizeButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
    <button
        {...props}
        type="button"
        className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold text-xl flex items-center justify-center hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={props['aria-label']}
    />
);

interface ScoreDisplayProps {
    score: number;
    scoreSizeClass: string;
    textColorClass: string;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, scoreSizeClass, textColorClass }) => {
    return (
        <span className={`font-bold transition-all duration-300 ${scoreSizeClass} ${textColorClass}`}>
            {score}
        </span>
    );
};


const GameScreen: React.FC<GameScreenProps> = ({ 
    teams, servingTeamId, serverPlayerId, onScore, onDecrementScore, onFault, onSetServer, 
    gameMode, serverNumber, onReset, isAdvanced, onRecordPoint, onUndo, canUndo, 
    isCompactMode, scoreFontSizeLevel, onIncreaseScoreFontSize, onDecreaseScoreFontSize 
}) => {
  const { t } = useLocalization();
  const team1 = teams[0];
  const team2 = teams[1];
  const servingTeam = teams.find(t => t.id === servingTeamId);
  const scoreSizeClass = getScoreFontSizeClass(scoreFontSizeLevel, isCompactMode);
  
  const isSimpleMode = gameMode === GameMode.SIMPLE_SINGLES || gameMode === GameMode.SIMPLE_DOUBLES;
  const isDoubles = gameMode === GameMode.DOUBLES || gameMode === GameMode.ADVANCED_DOUBLES || gameMode === GameMode.SIMPLE_DOUBLES;

  const displayTeamLeft = teams[0];
  const displayTeamRight = teams[1];

  // Logic for visual arrow
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const [arrowCoords, setArrowCoords] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  
  // Lock state for server selection
  const [isServerLocked, setIsServerLocked] = useState(true);

  const setPlayerRef = (id: number, el: HTMLButtonElement | null) => {
      playerRefs.current[id] = el;
  };

  useEffect(() => {
    // FIX: Check for null explicitly because serverPlayerId can be 0, which is falsy
    if (!isDoubles || servingTeamId === null || serverPlayerId === null) {
        setArrowCoords(null);
        return;
    }

    const updateArrow = () => {
        const container = containerRef.current;
        if (!container) return;

        const serverBtn = playerRefs.current[serverPlayerId];
        
        // Find indexes to determine receiver
        const serverTeamIndex = teams.findIndex(t => t.id === servingTeamId);
        if (serverTeamIndex === -1) return;
        
        const serverTeam = teams[serverTeamIndex];
        const serverPlayerIndex = serverTeam.players.findIndex(p => p.id === serverPlayerId);
        if (serverPlayerIndex === -1) return;

        // Diagonal Rule: Opposite Team, Opposite Index (0->1, 1->0)
        const receiverTeamIndex = serverTeamIndex === 0 ? 1 : 0;
        const receiverTeam = teams[receiverTeamIndex];
        if (!receiverTeam || receiverTeam.players.length < 2) return;

        const receiverPlayerIndex = serverPlayerIndex === 0 ? 1 : 0;
        const receiverPlayer = receiverTeam.players[receiverPlayerIndex];
        const receiverBtn = playerRefs.current[receiverPlayer.id];

        if (serverBtn && receiverBtn) {
            const cRect = container.getBoundingClientRect();
            const sRect = serverBtn.getBoundingClientRect();
            const rRect = receiverBtn.getBoundingClientRect();

            // From Server Inner Edge to Receiver Inner Edge
            const isServerLeft = serverTeamIndex === 0; // Teams[0] is Left
            
            const x1 = isServerLeft 
                ? (sRect.right - cRect.left) 
                : (sRect.left - cRect.left);
                
            const y1 = (sRect.top + sRect.height / 2) - cRect.top;

            const x2 = isServerLeft 
                ? (rRect.left - cRect.left) 
                : (rRect.right - cRect.left);
                
            const y2 = (rRect.top + rRect.height / 2) - cRect.top;
            
            setArrowCoords({ x1, y1, x2, y2 });
        } else {
             setArrowCoords(null);
        }
    };

    updateArrow();
    // Use timeout to allow layout to settle after state changes (score updates/transitions)
    const timeout = setTimeout(updateArrow, 100); 
    window.addEventListener('resize', updateArrow);
    return () => {
        window.removeEventListener('resize', updateArrow);
        clearTimeout(timeout);
    };

  }, [servingTeamId, serverPlayerId, teams, isDoubles, isCompactMode]);

  // Determine Arrow Color
  // Team 1 = Green (#15803d), Team 2 = Purple (#7e22ce)
  const arrowColor = servingTeamId === 1 ? '#15803d' : '#7e22ce';
  const markerId = `arrowhead-${servingTeamId}`; // Unique ID per team to ensure color updates

  return (
    <div className={`flex flex-col items-center justify-between transition-all ${isCompactMode ? 'gap-1 p-1' : 'gap-2 p-2 min-h-[500px]'}`}>
        
        {/* Central Score Panel */}
        <div className="flex flex-col items-center z-20 relative">
            <div className={`flex items-center justify-center ${isCompactMode ? 'gap-2 md:gap-4' : 'gap-4 md:gap-8'}`}>
                <ScoreDisplay 
                    score={displayTeamLeft.score}
                    scoreSizeClass={scoreSizeClass}
                    textColorClass={servingTeamId === displayTeamLeft.id ? (displayTeamLeft.id === 1 ? 'text-green-700' : 'text-purple-700') : 'text-gray-800'}
                />
                
                <span className={`font-mono transition-all ${isCompactMode ? 'text-5xl md:text-6xl' : 'text-6xl md:text-7xl'} text-gray-400`}>-</span>
                
                <ScoreDisplay 
                    score={displayTeamRight.score}
                    scoreSizeClass={scoreSizeClass}
                    textColorClass={servingTeamId === displayTeamRight.id ? (displayTeamRight.id === 1 ? 'text-green-700' : 'text-purple-700') : 'text-gray-800'}
                />

                {isDoubles && servingTeamId && (
                     <span className={`font-bold text-gray-400 ${isCompactMode ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl'}`}>
                        -{serverNumber}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-4 mt-2">
                <FontSizeButton onClick={onDecreaseScoreFontSize} disabled={scoreFontSizeLevel === MIN_FONT_SIZE_LEVEL} aria-label={t('decreaseFontSizeAria')}>-</FontSizeButton>
                <span className="text-xs text-gray-500 uppercase tracking-wider">{t('fontSize')}</span>
                <FontSizeButton onClick={onIncreaseScoreFontSize} disabled={scoreFontSizeLevel === MAX_FONT_SIZE_LEVEL} aria-label={t('increaseFontSizeAria')}>+</FontSizeButton>
            </div>
        </div>

        {/* Players and Server Selection */}
        <div ref={containerRef} className={`w-full max-w-lg grid grid-cols-2 my-2 relative transition-all ${isCompactMode ? 'gap-2' : 'gap-4'}`}>
            
            {/* Arrow Overlay - Moved to z-30, solid line, dynamic marker ID */}
            {arrowCoords && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible">
                     <defs>
                        <marker id={markerId} markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                            <polygon points="0 0, 6 2, 0 4" fill={arrowColor} />
                        </marker>
                    </defs>
                    <line 
                        x1={arrowCoords.x1} 
                        y1={arrowCoords.y1} 
                        x2={arrowCoords.x2} 
                        y2={arrowCoords.y2} 
                        stroke={arrowColor} 
                        strokeWidth="4" 
                        markerEnd={`url(#${markerId})`}
                    />
                </svg>
            )}

            <div className={`border-2 rounded-lg z-10 bg-white transition-all ${isCompactMode ? 'p-2 space-y-1' : 'p-3 space-y-2'} ${servingTeamId === displayTeamLeft.id ? (displayTeamLeft.id === 1 ? 'border-green-700' : 'border-purple-700') : 'border-gray-300'}`}>
                 <h3 className={`text-center text-lg truncate ${displayTeamLeft.id === 1 ? 'text-green-700' : 'text-purple-700'}`}>{t('team')} {displayTeamLeft.id}</h3>
                 {displayTeamLeft.players.map(p => (
                     <PlayerDisplay 
                        key={p.id} 
                        player={p} 
                        isServer={serverPlayerId === p.id} 
                        onSelect={() => onSetServer(p.id)} 
                        isCompact={isCompactMode} 
                        teamId={displayTeamLeft.id} 
                        buttonRef={(el) => setPlayerRef(p.id, el)}
                        locked={isServerLocked}
                     />
                 ))}
            </div>
            <div className={`border-2 rounded-lg z-10 bg-white transition-all ${isCompactMode ? 'p-2 space-y-1' : 'p-3 space-y-2'} ${servingTeamId === displayTeamRight.id ? (displayTeamRight.id === 1 ? 'border-green-700' : 'border-purple-700') : 'border-gray-300'}`}>
                <h3 className={`text-center text-lg truncate ${displayTeamRight.id === 1 ? 'text-green-700' : 'text-purple-700'}`}>{t('team')} {displayTeamRight.id}</h3>
                {displayTeamRight.players.map(p => (
                    <PlayerDisplay 
                        key={p.id} 
                        player={p} 
                        isServer={serverPlayerId === p.id} 
                        onSelect={() => onSetServer(p.id)} 
                        isCompact={isCompactMode} 
                        teamId={displayTeamRight.id}
                        buttonRef={(el) => setPlayerRef(p.id, el)}
                        locked={isServerLocked}
                    />
                ))}
            </div>
        </div>
        
        <div className="flex flex-col items-center w-full max-w-sm gap-2">
            <div className="w-full">
                {servingTeam && serverPlayerId !== null ? (
                    <>
                        {isSimpleMode ? (
                             <SimpleControls servingTeamId={servingTeam.id} onScore={onScore} onFault={onFault} isCompact={isCompactMode} />
                        ) : isAdvanced ? (
                             <AdvancedControls teams={teams} onRecordPoint={onRecordPoint} isCompact={isCompactMode} /> 
                        ) : (
                             <NormalControls servingTeam={servingTeam} onDecrementScore={onDecrementScore} onScore={onScore} isCompact={isCompactMode} />
                        )}
                    </>
                ) : (
                    <div className="text-center text-gray-500 h-full flex items-center justify-center">{t('selectServerToStart')}</div>
                )}
            </div>
             <div className="flex gap-2 w-full mt-2">
                <Button 
                    onClick={onUndo} 
                    disabled={!canUndo} 
                    variant="secondary" 
                    className={`bg-blue-600 hover:bg-blue-700 flex-1 ${isCompactMode ? '!py-1.5 !text-sm' : '!py-2 text-base'}`}
                    aria-label={t('undoAria')}
                >
                    {t('undo')}
                </Button>
                
                <Button 
                    onClick={() => setIsServerLocked(!isServerLocked)}
                    className={`flex-none w-auto flex items-center justify-center bg-gray-200 text-gray-800 hover:bg-gray-300 ${isCompactMode ? '!py-1.5 px-3' : '!py-2 px-4'}`}
                    aria-label={isServerLocked ? t('unlockServer') : t('lockServer')}
                >
                     {isServerLocked ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M18 1.5c2.9 0 5.25 2.35 5.25 5.25v3.75a.75.75 0 0 1-1.5 0V6.75a3.75 3.75 0 1 0-7.5 0v3a3 3 0 0 1 3 3v6.75a3 3 0 0 1-3 3H3.75a3 3 0 0 1-3-3v-6.75a3 3 0 0 1 3-3h9v-3c0-2.9 2.35-5.25 5.25-5.25Z" />
                        </svg>
                    )}
                </Button>

                <Button onClick={onReset} variant="danger" className={`flex-1 ${isCompactMode ? '!py-1.5 !text-sm' : '!py-2 text-base'}`}>
                    {t('resetGame')}
                </Button>
            </div>
        </div>
    </div>
  );
};

export default GameScreen;