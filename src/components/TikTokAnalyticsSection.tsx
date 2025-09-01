import React from 'react';

interface TikTokAnalyticsSectionProps {
  organizationId: string;
}

export default function TikTokAnalyticsSection({ organizationId }: TikTokAnalyticsSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">🎵 TikTok Analytics</h3>
        <p className="text-sm text-gray-500 mt-1">Componente de debug - Funcionando</p>
      </div>
      <div className="p-6">
        <div className="text-center py-8 text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎵</span>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">TikTok Analytics Section</p>
          <p className="text-gray-500">Organization ID: {organizationId}</p>
          <p className="text-gray-500">Componente funcionando correctamente</p>
        </div>
      </div>
    </div>
  );
}
