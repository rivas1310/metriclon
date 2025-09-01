import React from 'react';

interface TikTokConnectProps {
  onConnect?: () => void;
}

const TikTokConnect: React.FC<TikTokConnectProps> = ({ onConnect }) => {
  const connectTikTok = async () => {
    try {
      console.log('Conectando TikTok...');
      
      const response = await fetch('/api/oauth/tiktok');
      const data = await response.json();
      
      if (data.authUrl) {
        console.log('Redirigiendo a TikTok...');
        window.open(data.authUrl, '_blank');
        onConnect?.();
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error conectando TikTok:', error);
    }
  };

  return (
    <button
      onClick={connectTikTok}
      className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
    >
      Conectar TikTok
    </button>
  );
};

export default TikTokConnect;
