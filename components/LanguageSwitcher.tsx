import React from 'react';
import { useLocalization } from '../contexts/LocalizationContext';

const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale } = useLocalization();

  return (
    <div className="flex justify-center items-center space-x-2">
      <button
        onClick={() => setLocale('en')}
        className={`px-3 py-1 text-sm rounded-md transition-colors ${
          locale === 'en' ? 'bg-purple-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        English
      </button>
      <button
        onClick={() => setLocale('zh-TW')}
        className={`px-3 py-1 text-sm rounded-md transition-colors ${
          locale === 'zh-TW' ? 'bg-purple-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        繁體中文
      </button>
    </div>
  );
};

export default LanguageSwitcher;