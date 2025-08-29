'use client';

import { Plus, Calendar, BarChart3, Settings, Upload, Users, Zap } from 'lucide-react';

interface QuickActionsProps {
  organizationId: string;
}

export function QuickActions({ organizationId }: QuickActionsProps) {
  const actions = [
    {
      title: 'Crear Post',
      description: 'Publicar en todas tus redes',
      icon: Plus,
      color: 'bg-primary-500 hover:bg-primary-600',
      action: () => {
        // TODO: Open create post modal
        console.log('Create post');
      },
    },
    {
      title: 'Programar Contenido',
      description: 'Planifica tu calendario',
      icon: Calendar,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => {
        // TODO: Navigate to calendar
        console.log('Schedule content');
      },
    },
    {
      title: 'Ver Analytics',
      description: 'Métricas y reportes',
      icon: BarChart3,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => {
        // TODO: Navigate to analytics
        console.log('View analytics');
      },
    },
    {
      title: 'Subir Medios',
      description: 'Gestionar archivos',
      icon: Upload,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => {
        // TODO: Open media manager
        console.log('Upload media');
      },
    },
    {
      title: 'Gestionar Equipo',
      description: 'Usuarios y permisos',
      icon: Users,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => {
        // TODO: Navigate to team management
        console.log('Manage team');
      },
    },
    {
      title: 'Configuración',
      description: 'Ajustes de la cuenta',
      icon: Settings,
      color: 'bg-gray-500 hover:bg-gray-600',
      action: () => {
        // TODO: Navigate to settings
        console.log('Settings');
      },
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow border p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Acciones Rápidas</h3>
          <p className="text-sm text-gray-500">Accede rápidamente a las funciones más usadas</p>
        </div>
        <Zap className="h-6 w-6 text-primary-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.action}
              className={`${action.color} text-white p-4 rounded-lg text-left transition-colors duration-200 hover:shadow-lg`}
            >
              <div className="flex items-start space-x-3">
                <Icon className="h-6 w-6 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">{action.title}</h4>
                  <p className="text-xs text-white/80 mt-1">{action.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Acciones adicionales */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Consejo del día:</span> Programa tus posts para los horarios de mayor engagement
          </div>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Ver más consejos
          </button>
        </div>
      </div>
    </div>
  );
}
