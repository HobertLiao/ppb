
import React, { useState, useRef } from 'react';
import { Team, StatPoint, ScoreSnapshot, GameMode } from '../types';
import Button from './common/Button';
import { useLocalization } from '../contexts/LocalizationContext';
import { WINNER_REASON_KEYS, ERROR_REASON_KEYS } from '../constants';
import * as htmlToImage from 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/+esm';

interface GameOverScreenProps {
  winner: Team;
  teams: Team[];
  onPlayAgain: () => void;
  isAdvanced: boolean;
  gameHistory: StatPoint[];
  scoreHistory: ScoreSnapshot[];
  isCompactMode: boolean;
  isSharedView?: boolean;
  gameMode?: GameMode;
}

interface BarChartProps {
    label: string;
    value: number;
    maxValue: number;
    colorClass: string;
}

const BarChart: React.FC<BarChartProps> = ({ label, value, maxValue, colorClass }) => (
    <div className="flex items-center gap-2 text-sm">
        <span className="w-24 truncate text-gray-700">{label}:</span>
        <span className="font-bold w-6 text-gray-800">{value}</span>
        <div className="flex-grow bg-gray-200 rounded-full h-4">
            <div className={`${colorClass} h-4 rounded-full`} style={{ width: `${(value / maxValue) * 100}%` }}></div>
        </div>
    </div>
);

export const ScoreTrendChart: React.FC<{ scoreHistory: ScoreSnapshot[], isCompactMode: boolean, isExportMode?: boolean }> = ({ scoreHistory, isCompactMode, isExportMode }) => {
    const { t } = useLocalization();
    if (scoreHistory.length < 2) return null;

    const maxScore = Math.max(
        ...scoreHistory.map(s => Math.max(s.team1Score, s.team2Score)), 
        11 
    );
    const dataPoints = scoreHistory.length;
    
    // Adjust size slightly if in export mode
    const width = 120;
    const height = 65;
    const margin = { top: 10, right: 10, bottom: 15, left: 15 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const getX = (index: number) => margin.left + (index / (dataPoints - 1)) * chartWidth;
    const getY = (score: number) => (margin.top + chartHeight) - (score / maxScore) * chartHeight;

    const createPath = (getTeamScore: (s: ScoreSnapshot) => number) => {
        return scoreHistory.map((snapshot, index) => 
            `${index === 0 ? 'M' : 'L'} ${getX(index)} ${getY(getTeamScore(snapshot))}`
        ).join(' ');
    };

    const team1Path = createPath(s => s.team1Score);
    const team2Path = createPath(s => s.team2Score);

    return (
        <div className={`w-full bg-gray-50 border rounded-lg p-4 mt-6 ${isExportMode ? 'max-w-[500px] mx-auto' : ''}`}>
            <div className="relative w-full pb-[50%]">
                <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full overflow-visible">
                    <text x={margin.left} y={margin.top - 3} fontSize="4" fill="#6b7280" textAnchor="middle">{t('scoreLabel')}</text>
                    <text x={width / 2} y={height - 2} fontSize="4" fill="#6b7280" textAnchor="middle">{t('rallyLabel')}</text>
                    <text x={margin.left - 2} y={getY(maxScore) + 1} fontSize="3" fill="#9ca3af" textAnchor="end">{maxScore}</text>
                    <text x={margin.left - 2} y={getY(0)} fontSize="3" fill="#9ca3af" textAnchor="end">0</text>
                    <text x={getX(0)} y={getY(0) + 4} fontSize="3" fill="#9ca3af" textAnchor="middle">0</text>
                    <text x={getX(dataPoints - 1)} y={getY(0) + 4} fontSize="3" fill="#9ca3af" textAnchor="middle">{dataPoints - 1}</text>

                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                         const y = (margin.top + chartHeight) - ratio * chartHeight;
                         return (
                            <line key={ratio} x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
                         )
                    })}
                    <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + chartHeight} stroke="#9ca3af" strokeWidth="0.5" />
                    <line x1={margin.left} y1={margin.top + chartHeight} x2={width - margin.right} y2={margin.top + chartHeight} stroke="#9ca3af" strokeWidth="0.5" />
                    <path d={team1Path} fill="none" stroke="#15803d" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={team2Path} fill="none" stroke="#7e22ce" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
                    {scoreHistory.map((s, i) => (
                        <React.Fragment key={i}>
                            <circle cx={getX(i)} cy={getY(s.team1Score)} r="0.5" fill="#15803d" />
                            <circle cx={getX(i)} cy={getY(s.team2Score)} r="0.5" fill="#7e22ce" />
                        </React.Fragment>
                    ))}
                </svg>
            </div>
            <div className="flex justify-center gap-6 mt-2 text-xs md:text-sm">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-700 rounded-full"></div>
                    <span className="text-gray-700 font-semibold">Team 1</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-purple-700 rounded-full"></div>
                    <span className="text-gray-700 font-semibold">Team 2</span>
                </div>
            </div>
        </div>
    );
};

export const MatchAnalysis: React.FC<{ teams: Team[], gameHistory: StatPoint[], isCompactMode: boolean, showDetailsOnlyFor?: number | null, onSetDetailsPlayer?: (id: number | null) => void }> = ({ teams, gameHistory, isCompactMode, showDetailsOnlyFor, onSetDetailsPlayer }) => {
    const { t } = useLocalization();
    const [viewingPlayerIdInternal, setViewingPlayerIdInternal] = React.useState<number | null>(null);
    
    const viewingPlayerId = showDetailsOnlyFor !== undefined ? showDetailsOnlyFor : viewingPlayerIdInternal;
    const setViewingPlayerId = onSetDetailsPlayer || setViewingPlayerIdInternal;

    const allPlayers = teams.flatMap(t => t.players);
    const viewingPlayer = allPlayers.find(p => p.id === viewingPlayerId);

    if (viewingPlayer) {
        const playerHistory = gameHistory.filter(p => p.playerId === viewingPlayer.id);
        const winnersByReason: { [key: string]: number } = {};
        const errorsByReason: { [key: string]: number } = {};
        playerHistory.forEach(point => {
            if (point.type === 'winner') {
                winnersByReason[point.reason] = (winnersByReason[point.reason] || 0) + 1;
            } else {
                errorsByReason[point.reason] = (errorsByReason[point.reason] || 0) + 1;
            }
        });
        const sortedWinners = Object.entries(winnersByReason).sort(([, a], [, b]) => b - a);
        const sortedErrors = Object.entries(errorsByReason).sort(([, a], [, b]) => b - a);
        const maxStat = Math.max(...Object.values(winnersByReason), ...Object.values(errorsByReason), 1);
        return (
            <div className="mt-8 border-t-2 pt-6">
                <h3 className={`text-purple-800 mb-4 transition-all ${isCompactMode ? 'text-2xl' : 'text-3xl'}`}>{t('matchHistoryFor', { playerName: viewingPlayer.name })}</h3>
                <div className="text-left max-w-md mx-auto space-y-6">
                    {sortedWinners.length > 0 && (
                        <div>
                            <h4 className="text-xl font-bold text-green-700 mb-2">{t('winnersLabel')}</h4>
                            <div className="space-y-1">
                                {sortedWinners.map(([reasonKey, count]) => (
                                    <BarChart key={reasonKey} label={t(reasonKey)} value={count} maxValue={maxStat} colorClass="bg-green-500" />
                                ))}
                            </div>
                        </div>
                    )}
                    {sortedErrors.length > 0 && (
                         <div>
                            <h4 className="text-xl font-bold text-red-700 mb-2">{t('errorsLabel')}</h4>
                            <div className="space-y-1">
                                {sortedErrors.map(([reasonKey, count]) => (
                                    <BarChart key={reasonKey} label={t(reasonKey)} value={count} maxValue={maxStat} colorClass="bg-red-500" />
                                ))}
                            </div>
                        </div>
                    )}
                     {playerHistory.length === 0 && (
                        <p className="text-center text-gray-500 p-4">{t('noRecordedActions')}</p>
                    )}
                </div>
                {!onSetDetailsPlayer && (
                    <div className="mt-6">
                        <Button onClick={() => setViewingPlayerId(null)} variant="secondary" className={isCompactMode ? '!py-2 !text-base' : ''}>{t('backToSummary')}</Button>
                    </div>
                )}
            </div>
        );
    }

    const stats = allPlayers.map(player => {
        const winners = gameHistory.filter(p => p.playerId === player.id && p.type === 'winner').length;
        const errors = gameHistory.filter(p => p.playerId === player.id && p.type === 'error').length;
        return { id: player.id, name: player.name, winners, errors };
    });
    const maxStat = Math.max(...stats.flatMap(s => [s.winners, s.errors]), 1);
    return (
        <div className="mt-8 border-t-2 pt-6">
            <h3 className={`text-purple-800 mb-4 transition-all ${isCompactMode ? 'text-2xl' : 'text-3xl'}`}>{t('matchAnalysis')}</h3>
            <div className="space-y-4 text-left max-w-md mx-auto">
                {stats.map(playerStat => (
                    <div key={playerStat.id}>
                        <div className="flex justify-between items-center mb-1">
                            <p className="font-bold text-lg text-gray-800">{playerStat.name}</p>
                            {!onSetDetailsPlayer && (
                                <button onClick={() => setViewingPlayerId(playerStat.id)} className="text-sm text-purple-700 hover:underline focus:outline-none" aria-label={t('viewHistoryFor', { playerName: playerStat.name })}>{t('viewHistory')}</button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-16">{t('winnersLabel')}:</span>
                            <span className="font-bold w-6">{playerStat.winners}</span>
                            <div className="flex-grow bg-gray-200 rounded-full h-4">
                                <div className="bg-green-500 h-4 rounded-full" style={{ width: `${(playerStat.winners / maxStat) * 100}%`}}></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-16">{t('errorsLabel')}:</span>
                            <span className="font-bold w-6">{playerStat.errors}</span>
                            <div className="flex-grow bg-gray-200 rounded-full h-4">
                                <div className="bg-red-500 h-4 rounded-full" style={{ width: `${(playerStat.errors / maxStat) * 100}%`}}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
};

const GameOverScreen: React.FC<GameOverScreenProps> = ({ winner, teams, onPlayAgain, isAdvanced, gameHistory, scoreHistory, isCompactMode, isSharedView, gameMode }) => {
  const { t } = useLocalization();
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const loser = teams.find(t => t.id !== winner.id);
  const finalScore = loser ? `${winner.score} - ${loser.score}` : `${winner.score}`;

  const handleDownloadImage = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    
    try {
      // Small delay to ensure the browser re-renders with the fixed width layout
      await new Promise(r => setTimeout(r, 400));
      
      const dataUrl = await htmlToImage.toPng(reportRef.current, {
        backgroundColor: '#ffffff',
        // Optional: specify width to the library if needed
        width: 600,
      });
      
      const link = document.createElement('a');
      link.download = `pickleball-result-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="text-center space-y-6">
      {/* 
          WRAPPER FOR CAPTURE: 
          When exporting, we force a specific width (600px) and padding 
          to ensure font sizes don't overflow like they do on narrow mobile screens.
      */}
      <div 
        ref={reportRef} 
        className={`bg-white transition-all duration-300 mx-auto ${isExporting ? 'w-[600px] p-8' : 'w-full p-4 rounded-xl'}`}
      >
        {isSharedView && (
            <div className="bg-blue-50 border-2 border-blue-200 p-2 rounded-md mb-4 text-blue-800 font-bold text-sm">
                🏆 {t('sharedResult')}
            </div>
        )}
        
        <h2 className={`text-green-700 font-bold transition-all ${isExporting ? 'text-4xl mb-4' : (isCompactMode ? 'text-5xl' : 'text-6xl')}`}>
            {t('winnerTitle')}
        </h2>
        
        <div className={`text-purple-800 transition-all ${isExporting ? 'text-xl' : (isCompactMode ? 'text-2xl' : 'text-3xl')}`}>
            <p>{t('congratulations')}</p>
            <p className={`font-bold my-2 text-gray-900 transition-all ${isExporting ? 'text-2xl' : (isCompactMode ? 'text-3xl' : 'text-4xl')}`}>
                {winner.players.map(p => p.name).join(' & ')}
            </p>
        </div>

        <div className={`font-bold text-gray-900 py-2 transition-all ${isExporting ? 'text-4xl' : (isCompactMode ? 'text-4xl' : 'text-5xl')}`}>
            {finalScore}
        </div>

        <p className={`transition-all ${isExporting ? 'text-lg' : (isCompactMode ? 'text-xl' : 'text-2xl')}`}>
            {t('wonMatch')}
        </p>

        {scoreHistory && scoreHistory.length > 0 && (
            <div className={isExporting ? 'mt-4' : ''}>
                <h3 className={`text-purple-800 mt-8 mb-2 transition-all ${isExporting ? 'text-xl' : (isCompactMode ? 'text-2xl' : 'text-3xl')}`}>
                    {t('scoreTrend')}
                </h3>
                <ScoreTrendChart scoreHistory={scoreHistory} isCompactMode={isCompactMode} isExportMode={isExporting} />
            </div>
        )}

        {isAdvanced && <MatchAnalysis teams={teams} gameHistory={gameHistory} isCompactMode={isCompactMode} />}
        
        <div className="mt-4 text-[10px] text-gray-300 italic">Generated by Pickleball Scorekeeper Arcade</div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button onClick={handleDownloadImage} disabled={isExporting} variant="secondary" className={`bg-blue-600 hover:bg-blue-700 ${isCompactMode ? '!py-2 !text-base' : ''}`}>
             <div className="flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                {isExporting ? t('exporting') : t('saveAsImage')}
             </div>
        </Button>
        <Button onClick={onPlayAgain} className={isCompactMode ? '!py-2 !text-base' : ''}>
            {isSharedView ? t('backToHome') : t('playAgain')}
        </Button>
      </div>
    </div>
  );
};

export default GameOverScreen;
