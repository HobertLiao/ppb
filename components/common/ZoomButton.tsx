import React from 'react';

interface ZoomButtonProps {
  isCompact: boolean;
  onClick: () => void;
}

const ZoomButton: React.FC<ZoomButtonProps> = ({ isCompact, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 bg-gray-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 hover:bg-gray-800 transition-transform duration-200 active:scale-90"
      aria-label={isCompact ? 'Expand View' : 'Compact View'}
    >
      {isCompact ? (
        // Expand Icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 15v6h6M21 9V3h-6M3 9l7-7M21 15l-7 7" />
        </svg>
      ) : (
        // Shrink Icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
      )}
    </button>
  );
};

export default ZoomButton;
