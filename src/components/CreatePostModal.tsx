'use client';

import { useState } from 'react';
import { X, Calendar, Clock, Image, Video, Link, Hash, Send } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  channels: any[];
  onPostCreated: () => void;
}

export function CreatePostModal({ isOpen, onClose, organizationId, channels, onPostCreated }: CreatePostModalProps) {
  const [formData, setFormData] = useState({
    content: '',
    platforms: [] as string[],
    scheduledFor: '',
    images: [] as File[],
    hashtags: '',
    link: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent, publishType: 'now' | 'scheduled' = 'scheduled') => {
    if (publishType === 'scheduled') {
      e.preventDefault();
    }
    setIsLoading(true);
    setError('');

         // Validar que se haya seleccionado una plataforma
     if (formData.platforms.length === 0) {
       setError('Debes seleccionar al menos una plataforma');
       setIsLoading(false);
       return;
     }

     // Validar que Instagram tenga contenido multimedia
     if (formData.platforms.includes('INSTAGRAM') && formData.images.length === 0) {
       setError('Instagram requiere una imagen o video para publicar. Los posts solo de texto no son soportados.');
       setIsLoading(false);
       return;
     }

     // Validar que TikTok tenga contenido multimedia
     if (formData.platforms.includes('TIKTOK') && formData.images.length === 0) {
       setError('TikTok requiere un video para publicar. Los posts solo de texto no son soportados.');
       setIsLoading(false);
       return;
     }

    try {
      // Intentar publicación real primero (Facebook e Instagram)
      const selectedChannel = channels.find(ch => ch.platform === formData.platforms[0]);
      
      if (!selectedChannel) {
        setError('Canal no encontrado');
        setIsLoading(false);
        return;
      }

      console.log('Enviando datos de publicación:', {
        organizationId,
        channelId: selectedChannel.id,
        content: formData.content,
        type: 'TEXT',
        scheduledFor: formData.scheduledFor || null,
      });

       // Publicar en Facebook, Instagram o TikTok
       if (selectedChannel?.platform === 'FACEBOOK' || selectedChannel?.platform === 'INSTAGRAM' || selectedChannel?.platform === 'TIKTOK') {
         let publishResponse;
         
         // Para Instagram Y Facebook, enviar FormData si hay imágenes
         if (formData.images.length > 0) {
           const formDataToSend = new FormData();
           formDataToSend.append('organizationId', organizationId);
           formDataToSend.append('channelId', selectedChannel.id);
           formDataToSend.append('caption', formData.content);
           formDataToSend.append('type', 'TEXT');
           formDataToSend.append('scheduledFor', publishType === 'now' ? '' : (formData.scheduledFor || ''));
           formDataToSend.append('platform', selectedChannel.platform);
           formDataToSend.append('media', formData.images[0]); // Usar la primera imagen
           
           console.log('=== ENVIANDO FORMDATA CON IMAGEN ===');
           console.log('Plataforma:', selectedChannel.platform);
           console.log('¿Tiene imagen?', formData.images.length > 0);
           console.log('Tipo de archivo:', formData.images[0]?.type);
           
           // Para TikTok, usar la API específica de TikTok
           if (selectedChannel.platform === 'TIKTOK') {
             console.log('=== PUBLICANDO EN TIKTOK ===');
             publishResponse = await fetch('/api/tiktok/publish-video', {
               method: 'POST',
               body: formDataToSend,
             });
           } else {
             // Para Facebook e Instagram, usar la API general
             publishResponse = await fetch('/api/posts/publish', {
               method: 'POST',
               body: formDataToSend,
             });
           }
         } else {
           // Sin imágenes, usar JSON para ambas plataformas
           console.log('=== ENVIANDO JSON (SOLO TEXTO) ===');
           console.log('Plataforma:', selectedChannel.platform);
           
           publishResponse = await fetch('/api/posts/publish', {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             },
             body: JSON.stringify({
               organizationId,
               channelId: selectedChannel.id,
               caption: formData.content,
               type: 'TEXT',
               scheduledFor: publishType === 'now' ? null : formData.scheduledFor || null,
               platform: selectedChannel.platform
             }),
           });
         }

        if (publishResponse.ok) {
          const result = await publishResponse.json();
          console.log(`Post publicado en ${selectedChannel.platform}:`, result);
          alert(`✅ ${result.message}`);
          onPostCreated();
          onClose();
          // Reset form
          setFormData({
            content: '',
            platforms: [],
            scheduledFor: '',
            images: [],
            hashtags: '',
            link: '',
          });
          return;
        } else {
          const error = await publishResponse.json();
          console.error(`Error publicando en ${selectedChannel.platform}:`, error);
          
          // Si falla la publicación real, mostrar el error
          setError(`❌ ${error.error}\n\n${error.note || `Necesitas permisos de publicación en ${selectedChannel.platform}`}`);
          setIsLoading(false);
          return;
        }
      }

       // Fallback: usar la API normal de posts
       const response = await fetch('/api/posts', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           organizationId,
           channelId: selectedChannel.id,
           content: formData.content,
           type: 'TEXT',
           scheduledFor: publishType === 'now' ? null : formData.scheduledFor || null,
           hashtags: formData.hashtags.split(',').map(tag => tag.trim()).filter(Boolean),
         }),
       });

       if (response.ok) {
        onPostCreated();
        onClose();
        // Reset form
        setFormData({
          content: '',
          platforms: [],
          scheduledFor: '',
          images: [],
          hashtags: '',
          link: '',
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Error al crear el post');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Validación específica para TikTok
      if (formData.platforms.includes('TIKTOK')) {
        const hasVideo = files.some(file => file.type.startsWith('video/'));
        if (!hasVideo) {
          alert('TikTok requiere al menos un video para publicar. Por favor, selecciona un archivo de video.');
          return;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...files]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Crear Nuevo Post</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Contenido del post */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido del post
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="¿Qué quieres compartir hoy?"
              required
            />
            <div className="mt-2 text-sm text-gray-500">
              {formData.content.length}/280 caracteres
            </div>
          </div>

          {/* Plataformas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar plataformas
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Debug: Mostrar información de canales */}
              <div className="col-span-full mb-2 p-2 bg-gray-100 rounded text-xs">
                <strong>Debug:</strong> {channels.length} canales disponibles | 
                TikTok: {channels.find(c => c.platform === 'TIKTOK') ? 'ENCONTRADO' : 'NO ENCONTRADO'}
              </div>
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => handlePlatformToggle(channel.platform)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.platforms.includes(channel.platform)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {channel.platform === 'instagram' ? '📷' :
                       channel.platform === 'facebook' ? '📘' :
                       channel.platform === 'linkedin' ? '💼' :
                       channel.platform === 'twitter' ? '🐦' :
                       channel.platform === 'youtube' ? '📺' :
                       channel.platform === 'tiktok' ? '🎵' : '📱'}
                    </span>
                    <span className="font-medium capitalize">{channel.platform}</span>
                  </div>
                  {channel.isConnected && (
                    <div className="text-xs text-green-600 mt-1">✓ Conectado</div>
                  )}
                </button>
              ))}
              
              {/* Botón de TikTok manual para testing */}
              {!channels.find(c => c.platform === 'TIKTOK') && (
                <button
                  type="button"
                  onClick={() => handlePlatformToggle('TIKTOK')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.platforms.includes('TIKTOK')
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x2">
                    <span className="text-lg">🎵</span>
                    <span className="font-medium capitalize">TikTok</span>
                  </div>
                  <div className="text-xs text-orange-600 mt-1">⚠️ No conectado</div>
                </button>
              )}
            </div>
          </div>

          {/* Programación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                Fecha
              </label>
              <input
                type="date"
                value={formData.scheduledFor.split('T')[0] || ''}
                onChange={(e) => {
                  const time = formData.scheduledFor.split('T')[1] || '12:00';
                  setFormData(prev => ({ 
                    ...prev, 
                    scheduledFor: `${e.target.value}T${time}` 
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-2" />
                Hora
              </label>
              <input
                type="time"
                value={formData.scheduledFor.split('T')[1] || '12:00'}
                onChange={(e) => {
                  const date = formData.scheduledFor.split('T')[0] || new Date().toISOString().split('T')[0];
                  setFormData(prev => ({ 
                    ...prev, 
                    scheduledFor: `${date}T${e.target.value}` 
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

                     {/* Imágenes */}
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               <Image className="h-4 w-4 inline mr-2" />
               Imágenes {formData.platforms.includes('INSTAGRAM') && <span className="text-red-500">*</span>}
             </label>
             <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <input
               type="file"
               multiple
               accept="image/*,video/*"
               onChange={handleImageUpload}
               className="hidden"
               id="image-upload"
               required={formData.platforms.includes('INSTAGRAM') || formData.platforms.includes('TIKTOK')}
             />
               <label htmlFor="image-upload" className="cursor-pointer">
                 <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">
                 Haz clic para subir imágenes o arrastra y suelta
               </p>
                               <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, WebP, MP4, AVI, MOV hasta 20MB
                  {formData.platforms.includes('TIKTOK') && (
                    <span className="block text-blue-600 font-medium">
                      🎵 TikTok: Solo videos (MP4, MOV, AVI) hasta 20MB
                    </span>
                  )}
                </p>
                 {formData.platforms.includes('INSTAGRAM') && (
                   <p className="text-xs text-red-500 mt-1 font-medium">
                     ⚠️ Instagram requiere una imagen o video
                   </p>
                 )}
               </label>
             </div>
            
            {/* Imágenes subidas */}
            {formData.images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="h-4 w-4 inline mr-2" />
              Hashtags
            </label>
            <input
              type="text"
              value={formData.hashtags}
              onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="gatos, rescate, mascotas, amor"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separa los hashtags con comas
            </p>
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Link className="h-4 w-4 inline mr-2" />
              Link (opcional)
            </label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://ejemplo.com"
            />
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
                         <button
               type="button"
               onClick={() => handleSubmit({ preventDefault: () => {} } as any, 'now')}
               disabled={isLoading || formData.platforms.length === 0 || (formData.platforms.includes('INSTAGRAM') && formData.images.length === 0)}
               className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
             >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Publicando...
                </div>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publicar Ahora
                </>
              )}
            </button>
                         <button
               type="submit"
               disabled={isLoading || formData.platforms.length === 0 || (formData.platforms.includes('INSTAGRAM') && formData.images.length === 0)}
               className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
             >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Programando...
                </div>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Programar Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
