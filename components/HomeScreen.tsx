import React, { useState } from 'react';
import { GameMode } from '../types';
import Button from './common/Button';
import { useLocalization } from '../contexts/LocalizationContext';
import LanguageSwitcher from './LanguageSwitcher';

interface HomeScreenProps {
  onSelect: (mode: GameMode) => void;
  onShowHistory: () => void;
  isCompactMode: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onSelect, onShowHistory, isCompactMode }) => {
  const { t } = useLocalization();
  const [selection, setSelection] = useState<'mode' | 'type'>('mode');
  const [mode, setMode] = useState<'ADVANCED' | 'SIMPLE' | null>(null);

  const handleModeSelect = (selectedMode: 'ADVANCED' | 'SIMPLE') => {
    setMode(selectedMode);
    setSelection('type');
  };

  const handleTypeSelect = (type: 'SINGLES' | 'DOUBLES') => {
    if (mode === 'ADVANCED') {
      onSelect(type === 'SINGLES' ? GameMode.ADVANCED_SINGLES : GameMode.ADVANCED_DOUBLES);
    } else if (mode === 'SIMPLE') {
      onSelect(type === 'SINGLES' ? GameMode.SIMPLE_SINGLES : GameMode.SIMPLE_DOUBLES);
    }
  };

  const handleBack = () => {
    setMode(null);
    setSelection('mode');
  };

  if (selection === 'mode') {
    return (
      <div className="text-center">
        <h2 className={`mb-4 text-purple-800 transition-all ${isCompactMode ? 'text-xl md:text-3xl' : 'text-2xl md:text-4xl'}`}>{t('chooseMode')}</h2>
        <LanguageSwitcher />
        <div className={`flex flex-col gap-4 mt-6 ${isCompactMode ? 'gap-3' : 'gap-4'}`}>
          <div className="w-full">
            <Button onClick={() => handleModeSelect('SIMPLE')} className={`!bg-[#00703C] hover:!bg-[#005c31] ${isCompactMode ? '!py-2 !text-base' : ''}`}>
              {t('simpleMode')}
            </Button>
          </div>
          <div className="w-full">
            <Button onClick={() => handleModeSelect('ADVANCED')} variant="secondary" className={isCompactMode ? '!py-2 !text-base' : ''}>
              {t('advancedMode')}
            </Button>
          </div>
        </div>
         <div className="mt-6">
            <Button onClick={onShowHistory} variant="primary" className={`!bg-gray-600 hover:!bg-gray-700 ${isCompactMode ? '!py-2 !text-base' : ''}`}>
                {t('matchHistory')}
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className={`mb-4 text-purple-800 transition-all ${isCompactMode ? 'text-xl md:text-3xl' : 'text-2xl md:text-4xl'}`}>{t('chooseGameType')}</h2>
      <LanguageSwitcher />
      <div className={`flex flex-col md:flex-row mt-6 ${isCompactMode ? 'gap-4' : 'gap-6'}`}>
        <div className="w-full">
          <Button onClick={() => handleTypeSelect('SINGLES')} variant="primary" className={isCompactMode ? '!py-2 !text-base' : ''}>
            {t('singles')}
          </Button>
        </div>
        <div className="w-full">
          <Button onClick={() => handleTypeSelect('DOUBLES')} variant="secondary" className={isCompactMode ? '!py-2 !text-base' : ''}>
            {t('doubles')}
          </Button>
        </div>
      </div>
      <div className="mt-6">
        <Button onClick={handleBack} variant="danger" className={isCompactMode ? '!py-2 !text-base' : ''}>{t('back')}</Button>
      </div>
    </div>
  );
};

export default HomeScreen;