import React, { useState } from 'react';
import { MatchResult, GameMode } from '../types';
import Button from './common/Button';
import { MatchAnalysis, ScoreTrendChart } from './GameOverScreen';
import { useLocalization } from '../contexts/LocalizationContext';

interface HistoryScreenProps {
  history: MatchResult[];
  onBack: () => void;
  onClearHistory: () => void;
  isCompactMode: boolean;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, onBack, onClearHistory, isCompactMode }) => {
    const { t } = useLocalization();
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
    
    const selectedMatch = history.find(m => m.id === selectedMatchId);

    if (selectedMatch) {
        const isAdvanced = selectedMatch.gameMode === GameMode.ADVANCED_SINGLES || selectedMatch.gameMode === GameMode.ADVANCED_DOUBLES;
        const loser = selectedMatch.teams.find(t => t.id !== selectedMatch.winner.id);
        const finalScore = loser ? `${selectedMatch.winner.score} - ${loser.score}` : `${selectedMatch.winner.score}`;
        
        return (
            <div className="space-y-6 text-center">
                 <h2 className={`text-purple-800 transition-all ${isCompactMode ? 'text-2xl' : 'text-3xl'}`}>{t('matchDetails')}</h2>
                 <div className={`bg-gray-50 p-6 rounded-lg shadow-inner space-y-3 ${isCompactMode ? 'p-4' : 'p-6'}`}>
                    <p><span className="font-bold">{t('date')}:</span> {new Date(selectedMatch.timestamp).toLocaleString()}</p>
                    <p><span className="font-bold">{t('mode')}:</span> {t(selectedMatch.gameMode)}</p>
                    <p className={`transition-all ${isCompactMode ? 'text-xl' : 'text-2xl'}`}><span className="font-bold">{t('winnerLabel')}: </span>{selectedMatch.winner.players.map(p => p.name).join(' & ')}</p>
                    <p className={`font-bold transition-all ${isCompactMode ? 'text-3xl' : 'text-4xl'}`}>{finalScore}</p>
                 </div>

                 {selectedMatch.scoreHistory && selectedMatch.scoreHistory.length > 0 && (
                    <div>
                        <h3 className={`text-purple-800 mt-6 mb-2 transition-all ${isCompactMode ? 'text-2xl' : 'text-3xl'}`}>{t('scoreTrend')}</h3>
                        <ScoreTrendChart scoreHistory={selectedMatch.scoreHistory} isCompactMode={isCompactMode} />
                    </div>
                 )}

                 {isAdvanced && <MatchAnalysis teams={selectedMatch.teams} gameHistory={selectedMatch.gameHistory} isCompactMode={isCompactMode} />}

                 <div className="mt-4">
                    <Button onClick={() => setSelectedMatchId(null)} variant="secondary" className={isCompactMode ? '!py-2 !text-base' : ''}>{t('backToHistory')}</Button>
                 </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h2 className={`text-center text-purple-800 transition-all ${isCompactMode ? 'text-2xl' : 'text-3xl'}`}>{t('matchHistory')}</h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {history.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">{t('noMatchesPlayed')}</p>
                ) : (
                    [...history].reverse().map(match => {
                        const loser = match.teams.find(t => t.id !== match.winner.id);
                        const score = loser ? `${match.winner.score}-${loser.score}` : `${match.winner.score}`;
                        return (
                            <div key={match.id} className="bg-gray-50 p-4 rounded-lg shadow flex justify-between items-center gap-4">
                                <div className="flex-grow text-left">
                                    <p className="font-bold text-lg text-green-800">{t(match.gameMode)} - <span className="text-gray-800">{score}</span></p>
                                    <p className="text-sm text-gray-600">{new Date(match.timestamp).toLocaleString()}</p>
                                    <p className="truncate"><span className="font-semibold">W:</span> {match.winner.players.map(p => p.name).join(' & ')}</p>
                                </div>
                                <div>
                                    <Button onClick={() => setSelectedMatchId(match.id)} className="!px-4 !py-2 !text-base">{t('details')}</Button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-8">
                <Button onClick={onBack} variant="danger" className={isCompactMode ? '!py-2 !text-base' : ''}>{t('backToHome')}</Button>
                {history.length > 0 && <Button onClick={onClearHistory} variant="danger" className={`bg-red-700 hover:bg-red-800 ${isCompactMode ? '!py-2 !text-base' : ''}`}>{t('clearHistory')}</Button>}
            </div>
        </div>
    );
};

export default HistoryScreen;