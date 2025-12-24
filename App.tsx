
import React, { useState, useCallback, useEffect } from 'react';
import { GameMode, GamePhase, Player, Team, StatPoint, MatchResult, ScoreSnapshot } from './types';
import HomeScreen from './components/HomeScreen';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import HistoryScreen from './components/HistoryScreen';
import ZoomButton from './components/common/ZoomButton';
import { WINNING_SCORE, WINNER_REASON_KEYS, ERROR_REASON_KEYS } from './constants';
import { useLocalization } from './contexts/LocalizationContext';

interface GameState {
  teams: Team[];
  servingTeamId: number | null;
  serverPlayerId: number | null;
  serverNumber: 1 | 2;
  isFirstServeOfGame: boolean;
  gameHistory: StatPoint[];
  scoreHistory: ScoreSnapshot[];
}

const App: React.FC = () => {
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.HOME);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [servingTeamId, setServingTeamId] = useState<number | null>(null);
  const [serverPlayerId, setServerPlayerId] = useState<number | null>(null);
  const [serverNumber, setServerNumber] = useState<1 | 2>(1); // For doubles
  const [isFirstServeOfGame, setIsFirstServeOfGame] = useState<boolean>(true);
  const [winner, setWinner] = useState<Team | null>(null);
  const [gameHistory, setGameHistory] = useState<StatPoint[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScoreSnapshot[]>([{ team1Score: 0, team2Score: 0 }]);
  const [gameId, setGameId] = useState<string | null>(null);
  const [matchHistoryLog, setMatchHistoryLog] = useState<MatchResult[]>([]);
  const [gameStateHistory, setGameStateHistory] = useState<GameState[]>([]);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [scoreFontSizeLevel, setScoreFontSizeLevel] = useState(4); // Levels 1-5
  const { t } = useLocalization();

  // Handle Shared Link on Mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('match');
    if (sharedData) {
      try {
        const raw = JSON.parse(decodeURIComponent(atob(sharedData)));
        
        // Handle Compact Minified Format (Schema v2)
        if (Array.isArray(raw)) {
            const [version, modeIdx, winnerId, compressedTeams, compressedHistory, compressedScores] = raw;
            
            const modeMap = [
                GameMode.SINGLES, GameMode.DOUBLES,
                GameMode.ADVANCED_SINGLES, GameMode.ADVANCED_DOUBLES,
                GameMode.SIMPLE_SINGLES, GameMode.SIMPLE_DOUBLES
            ];

            const decodedTeams: Team[] = (compressedTeams as any[]).map(ct => ({
                id: ct[0],
                players: (ct[1] as string[]).map((name, i) => ({ id: ct[0] === 1 ? i : i + 2, name })),
                score: ct[2]
            }));

            const decodedHistory: StatPoint[] = (compressedHistory as any[]).map(ch => ({
                playerId: ch[0],
                teamId: decodedTeams.find(t => t.players.some(p => p.id === ch[0]))?.id || 0,
                type: ch[1] === 0 ? 'winner' : 'error',
                reason: ch[1] === 0 ? WINNER_REASON_KEYS[ch[2]] : ERROR_REASON_KEYS[ch[2]]
            }));

            const decodedScores: ScoreSnapshot[] = (compressedScores as any[]).map(cs => ({
                team1Score: cs[0],
                team2Score: cs[1]
            }));

            const foundWinner = decodedTeams.find(t => t.id === winnerId);

            setWinner(foundWinner || null);
            setTeams(decodedTeams);
            setGameMode(modeMap[modeIdx]);
            setGameHistory(decodedHistory);
            setScoreHistory(decodedScores);
        } 
        // Handle Legacy Verbose Format (Schema v1)
        else {
            setWinner(raw.winner);
            setTeams(raw.teams);
            setGameMode(raw.gameMode);
            setGameHistory(raw.gameHistory);
            setScoreHistory(raw.scoreHistory);
        }
        
        setGamePhase(GamePhase.SHARED_RESULT);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("Failed to decode shared match data", e);
      }
    }
  }, []);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('pickleballMatchHistory');
      if (storedHistory) {
        setMatchHistoryLog(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to parse match history from localStorage", error);
    }
  }, []);
  
  useEffect(() => {
    if (gamePhase === GamePhase.GAME_OVER && winner && gameId) {
      const alreadyExists = matchHistoryLog.some(match => match.id === gameId);
      if (alreadyExists) return;

      const newMatchResult: MatchResult = {
        id: gameId,
        timestamp: new Date(gameId).toISOString(),
        winner,
        teams,
        gameMode: gameMode!,
        gameHistory,
        scoreHistory,
      };
      
      const updatedLog = [...matchHistoryLog, newMatchResult];
      setMatchHistoryLog(updatedLog);
      localStorage.setItem('pickleballMatchHistory', JSON.stringify(updatedLog));
    }
  }, [gamePhase, winner, gameId, teams, gameMode, gameHistory, scoreHistory, matchHistoryLog]);

  const handleGameModeSelect = useCallback((mode: GameMode) => {
    setGameMode(mode);
    setGamePhase(GamePhase.SETUP);
  }, []);
  
  const getServerSlotIndex = (teamId: number) => (teamId === 1 ? 1 : 0);

  const handleGameStart = useCallback((initialTeams: Team[], firstServerPlayerId: number) => {
    const isDoubles = gameMode === GameMode.DOUBLES || gameMode === GameMode.ADVANCED_DOUBLES || gameMode === GameMode.SIMPLE_DOUBLES;

    const teamsWithCorrectOrder = initialTeams.map(team => {
        const isServerInThisTeam = team.players.some(p => p.id === firstServerPlayerId);
        if (isDoubles && isServerInThisTeam && team.players.length === 2) {
             const requiredIndex = getServerSlotIndex(team.id);
             if (team.players[requiredIndex].id !== firstServerPlayerId) {
                 return { ...team, players: [team.players[1], team.players[0]] };
             }
        }
        return team;
    });

    const firstServingTeam = teamsWithCorrectOrder.find(team => team.players.some(p => p.id === firstServerPlayerId));
    if (!firstServingTeam) return;
    
    setGameId(new Date().toISOString());
    setTeams(teamsWithCorrectOrder);
    setServingTeamId(firstServingTeam.id);
    setServerPlayerId(firstServerPlayerId);
    setServerNumber(isDoubles ? 2 : 1);
    setIsFirstServeOfGame(true);
    setWinner(null);
    setGameHistory([]);
    setScoreHistory([{ team1Score: 0, team2Score: 0 }]);
    setGameStateHistory([]);
    setGamePhase(GamePhase.GAME);
  }, [gameMode]);
  
  const saveToHistory = useCallback(() => {
    setGameStateHistory(prev => [...prev, {
      teams: JSON.parse(JSON.stringify(teams)),
      servingTeamId,
      serverPlayerId,
      serverNumber,
      isFirstServeOfGame,
      gameHistory: [...gameHistory],
      scoreHistory: [...scoreHistory],
    }]);
  }, [teams, servingTeamId, serverPlayerId, serverNumber, isFirstServeOfGame, gameHistory, scoreHistory]);

  const handleUndo = useCallback(() => {
    if (gameStateHistory.length === 0) return;
    const lastState = gameStateHistory[gameStateHistory.length - 1];
    setTeams(lastState.teams);
    setServingTeamId(lastState.servingTeamId);
    setServerPlayerId(lastState.serverPlayerId);
    setServerNumber(lastState.serverNumber);
    setIsFirstServeOfGame(lastState.isFirstServeOfGame);
    setGameHistory(lastState.gameHistory);
    setScoreHistory(lastState.scoreHistory);
    setGameStateHistory(prev => prev.slice(0, -1));
  }, [gameStateHistory]);

  const handleScoreUpdate = useCallback((scoringTeamId: number) => {
      saveToHistory();
      const isDoubles = gameMode === GameMode.DOUBLES || gameMode === GameMode.ADVANCED_DOUBLES || gameMode === GameMode.SIMPLE_DOUBLES;
      const newTeams = teams.map(team => {
        if (team.id === scoringTeamId) {
            let newPlayers = team.players;
            if (isDoubles) {
                newPlayers = [team.players[1], team.players[0]];
            }
            return { ...team, score: team.score + 1, players: newPlayers };
        }
        return team;
      });
      setTeams(newTeams);
      const team1Score = newTeams.find(t => t.id === 1)?.score || 0;
      const team2Score = newTeams.find(t => t.id === 2)?.score || 0;
      setScoreHistory(prev => [...prev, { team1Score, team2Score }]);
      const scoringTeam = newTeams.find(t => t.id === scoringTeamId);
      const otherTeam = newTeams.find(t => t.id !== scoringTeamId);
      if (scoringTeam && otherTeam && scoringTeam.score >= WINNING_SCORE && scoringTeam.score >= otherTeam.score + 2) {
          setWinner(scoringTeam);
          setGamePhase(GamePhase.GAME_OVER);
      }
  }, [teams, saveToHistory, gameMode]);
  
  const handleDecrementScore = useCallback((teamId: number) => {
    if (teamId !== servingTeamId) return;
    saveToHistory();
    const newTeams = teams.map(team => 
      team.id === teamId ? { ...team, score: Math.max(0, team.score - 1)} : team
    );
    setTeams(newTeams);
    const team1Score = newTeams.find(t => t.id === 1)?.score || 0;
    const team2Score = newTeams.find(t => t.id === 2)?.score || 0;
    setScoreHistory(prev => [...prev, { team1Score, team2Score }]);
  }, [teams, servingTeamId, saveToHistory]);
  
  const handleFault = useCallback(() => {
    saveToHistory();
    const isDoubles = gameMode === GameMode.DOUBLES || gameMode === GameMode.ADVANCED_DOUBLES || gameMode === GameMode.SIMPLE_DOUBLES;
    if (!isDoubles) {
         const otherTeam = teams.find(t => t.id !== servingTeamId)!;
         performSideOut(otherTeam);
         return;
    }
    if (isFirstServeOfGame) {
        const otherTeam = teams.find(t => t.id !== servingTeamId)!;
        performSideOut(otherTeam);
    } else {
        if (serverNumber === 1) {
            const currentTeam = teams.find(t => t.id === servingTeamId)!;
            const nextServer = currentTeam.players.find(p => p.id !== serverPlayerId)!;
            setServerPlayerId(nextServer.id);
            setServerNumber(2);
        } else {
            const otherTeam = teams.find(t => t.id !== servingTeamId)!;
            performSideOut(otherTeam);
        }
    }
  }, [teams, servingTeamId, serverNumber, isFirstServeOfGame, gameMode, serverPlayerId]);
  
  const performSideOut = (nextTeam: Team) => {
      setServingTeamId(nextTeam.id);
      setIsFirstServeOfGame(false);
      const isDoubles = gameMode === GameMode.DOUBLES || gameMode === GameMode.ADVANCED_DOUBLES || gameMode === GameMode.SIMPLE_DOUBLES;
      if (isDoubles) {
          setServerNumber(1); 
          const serverSlotIndex = getServerSlotIndex(nextTeam.id);
          const selectedPlayer = nextTeam.players[serverSlotIndex];
          setServerPlayerId(selectedPlayer.id);
      } else {
          setServerPlayerId(nextTeam.players[0].id);
          setServerNumber(1);
      }
  };
  
  const handleRecordPoint = useCallback((playerId: number, type: 'winner' | 'error', reason: string) => {
    if (servingTeamId === null) return;
    const playerTeam = teams.find(t => t.players.some(p => p.id === playerId));
    if (!playerTeam) return;
    saveToHistory();
    setGameHistory(prev => [...prev, { playerId, teamId: playerTeam.id, type, reason }]);
    const isPlayerOnServingTeam = playerTeam.id === servingTeamId;
    if (type === 'winner') {
      if (isPlayerOnServingTeam) {
          const isDoubles = gameMode === GameMode.DOUBLES || gameMode === GameMode.ADVANCED_DOUBLES || gameMode === GameMode.SIMPLE_DOUBLES;
          const newTeams = teams.map(team => {
            if (team.id === servingTeamId) {
                let newPlayers = team.players;
                if (isDoubles) newPlayers = [team.players[1], team.players[0]];
                return { ...team, score: team.score + 1, players: newPlayers };
            }
            return team;
          });
          setTeams(newTeams);
          const team1Score = newTeams.find(t => t.id === 1)?.score || 0;
          const team2Score = newTeams.find(t => t.id === 2)?.score || 0;
          setScoreHistory(prev => [...prev, { team1Score, team2Score }]);
          const scoringTeam = newTeams.find(t => t.id === servingTeamId);
          const otherTeam = newTeams.find(t => t.id !== servingTeamId);
          if (scoringTeam && otherTeam && scoringTeam.score >= WINNING_SCORE && scoringTeam.score >= otherTeam.score + 2) {
            setWinner(scoringTeam);
            setGamePhase(GamePhase.GAME_OVER);
          }
      } else {
        handleFault();
      }
    } else if (type === 'error') {
      if (isPlayerOnServingTeam) {
        handleFault();
      } else {
          const isDoubles = gameMode === GameMode.DOUBLES || gameMode === GameMode.ADVANCED_DOUBLES || gameMode === GameMode.SIMPLE_DOUBLES;
          const newTeams = teams.map(team => {
            if (team.id === servingTeamId) {
                let newPlayers = team.players;
                if (isDoubles) newPlayers = [team.players[1], team.players[0]];
                return { ...team, score: team.score + 1, players: newPlayers };
            }
            return team;
          });
          setTeams(newTeams);
          const team1Score = newTeams.find(t => t.id === 1)?.score || 0;
          const team2Score = newTeams.find(t => t.id === 2)?.score || 0;
          setScoreHistory(prev => [...prev, { team1Score, team2Score }]);
          const scoringTeam = newTeams.find(t => t.id === servingTeamId);
          const otherTeam = newTeams.find(t => t.id !== servingTeamId);
          if (scoringTeam && otherTeam && scoringTeam.score >= WINNING_SCORE && scoringTeam.score >= otherTeam.score + 2) {
            setWinner(scoringTeam);
            setGamePhase(GamePhase.GAME_OVER);
          }
      }
    }
}, [teams, servingTeamId, saveToHistory, gameHistory, gameMode, handleFault]);


  const handleSetServer = useCallback((newServerPlayerId: number) => {
    saveToHistory();
    const newServingTeam = teams.find(team => team.players.some(p => p.id === newServerPlayerId));
    if (!newServingTeam) return; 
    const newServingTeamId = newServingTeam.id;
    const isDoubles = gameMode === GameMode.DOUBLES || gameMode === GameMode.ADVANCED_DOUBLES || gameMode === GameMode.SIMPLE_DOUBLES;
    if (newServingTeamId !== servingTeamId) { 
      const otherTeam = newServingTeam;
      setServingTeamId(otherTeam.id);
      setIsFirstServeOfGame(false);
       if (isDoubles) {
          setServerNumber(1); 
          const requiredIndex = getServerSlotIndex(otherTeam.id);
          const clickedPlayerIndex = otherTeam.players.findIndex(p => p.id === newServerPlayerId);
          if (clickedPlayerIndex !== requiredIndex) {
             const newPlayers = [otherTeam.players[1], otherTeam.players[0]]; 
             setTeams(prev => prev.map(t => t.id === otherTeam.id ? {...t, players: newPlayers} : t));
          }
          setServerPlayerId(newServerPlayerId);
      } else {
          setServerPlayerId(newServerPlayerId);
          setServerNumber(1);
      }
    } else {
      if (isDoubles) {
          setServerPlayerId(newServerPlayerId);
          if (newServerPlayerId !== serverPlayerId) {
             setServerNumber(serverNumber === 1 ? 2 : 1);
          }
      } else {
        setServerPlayerId(newServerPlayerId);
      }
    }
  }, [teams, servingTeamId, gameMode, serverPlayerId, serverNumber, saveToHistory]);

  const resetGame = useCallback(() => {
    setGamePhase(GamePhase.HOME);
    setGameMode(null);
    setTeams([]);
    setServingTeamId(null);
    setServerPlayerId(null);
    setServerNumber(1);
    setIsFirstServeOfGame(true);
    setWinner(null);
    setGameHistory([]);
    setScoreHistory([{ team1Score: 0, team2Score: 0 }]);
    setGameId(null);
    setGameStateHistory([]);
  }, []);
  
  const handleClearHistory = useCallback(() => {
    setMatchHistoryLog([]);
    localStorage.removeItem('pickleballMatchHistory');
  }, []);
  
  const handleToggleCompactMode = () => {
    setIsCompactMode(prev => !prev);
  };
  
  const handleIncreaseScoreFontSize = () => {
    setScoreFontSizeLevel(prev => Math.min(prev + 1, 5));
  };
  
  const handleDecreaseScoreFontSize = () => {
    setScoreFontSizeLevel(prev => Math.max(prev - 1, 1));
  };


  const renderContent = () => {
    const isAdvanced = gameMode === GameMode.ADVANCED_SINGLES || gameMode === GameMode.ADVANCED_DOUBLES;
    switch (gamePhase) {
      case GamePhase.SETUP:
        return <SetupScreen gameMode={gameMode!} onGameStart={handleGameStart} onBack={resetGame} isCompactMode={isCompactMode} />;
      case GamePhase.GAME:
        return <GameScreen 
                  teams={teams}
                  servingTeamId={servingTeamId}
                  serverPlayerId={serverPlayerId}
                  onScore={handleScoreUpdate}
                  onDecrementScore={handleDecrementScore}
                  onFault={handleFault}
                  onSetServer={handleSetServer}
                  onRecordPoint={handleRecordPoint}
                  isAdvanced={isAdvanced}
                  gameMode={gameMode!}
                  serverNumber={serverNumber}
                  onReset={resetGame}
                  onUndo={handleUndo}
                  canUndo={gameStateHistory.length > 0}
                  isCompactMode={isCompactMode}
                  scoreFontSizeLevel={scoreFontSizeLevel}
                  onIncreaseScoreFontSize={handleIncreaseScoreFontSize}
                  onDecreaseScoreFontSize={handleDecreaseScoreFontSize}
               />;
      case GamePhase.GAME_OVER:
      case GamePhase.SHARED_RESULT:
        return <GameOverScreen 
                  winner={winner!} 
                  teams={teams} 
                  onPlayAgain={resetGame} 
                  isAdvanced={isAdvanced}
                  gameHistory={gameHistory}
                  scoreHistory={scoreHistory}
                  isCompactMode={isCompactMode}
                  isSharedView={gamePhase === GamePhase.SHARED_RESULT}
                  gameMode={gameMode!}
               />;
      case GamePhase.HISTORY:
        return <HistoryScreen 
                 history={matchHistoryLog} 
                 onBack={() => setGamePhase(GamePhase.HOME)}
                 onClearHistory={handleClearHistory}
                 isCompactMode={isCompactMode}
                />;
      case GamePhase.HOME:
      default:
        return <HomeScreen 
                 onSelect={handleGameModeSelect}
                 onShowHistory={() => setGamePhase(GamePhase.HISTORY)}
                 isCompactMode={isCompactMode}
                />;
    }
  };

  return (
    <div className={`container mx-auto p-4 transition-all ${isCompactMode ? 'max-w-md' : 'max-w-3xl'}`}>
      <div className={`bg-white rounded-lg shadow-xl transition-all ${isCompactMode ? 'p-4' : 'p-6 md:p-8'}`}>
        <h1 className={`text-center font-bold text-green-800 transition-all ${isCompactMode ? 'text-3xl md:text-4xl mb-3' : 'text-4xl md:text-5xl mb-6'}`}>
          {t('appName')}
        </h1>
        {renderContent()}
      </div>
      <ZoomButton isCompact={isCompactMode} onClick={handleToggleCompactMode} />
    </div>
  );
};

export default App;
