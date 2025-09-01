import React from 'react';

export default function PrivacyPage() {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white text-center">
              Política de Privacidad — Metriclon
            </h1>
            <p className="text-green-100 text-center mt-2">
              Última actualización: {currentDate}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-8">
            {/* Contact Info */}
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    <strong>Contacto:</strong> privacy@metriclon.com
                  </p>
                  <p className="text-sm text-green-700">
                    <strong>Dominio:</strong> https://metriclon.com/
                  </p>
                  <p className="text-sm text-green-700">
                    <strong>Oficial de Privacidad:</strong> dpo@metriclon.com
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1: Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introducción</h2>
              <p className="text-gray-700 leading-relaxed">
                En Metriclon ("nosotros", "nuestro", "la Compañía"), respetamos tu privacidad y nos comprometemos a proteger 
                tus datos personales. Esta Política de Privacidad explica cómo recopilamos, usamos, almacenamos y protegemos 
                tu información cuando utilizas nuestra plataforma.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Al usar Metriclon, aceptas las prácticas descritas en esta política. Si no estás de acuerdo con alguna parte 
                de esta política, por favor no uses nuestro servicio.
              </p>
            </section>

            {/* Section 2: Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Información que recopilamos</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Información que proporcionas directamente:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Información de cuenta:</strong> Nombre, dirección de correo electrónico, contraseña</li>
                <li><strong>Información de perfil:</strong> Nombre de empresa, industria, ubicación</li>
                <li><strong>Contenido:</strong> Posts, imágenes, videos que subes a través de nuestra plataforma</li>
                <li><strong>Comunicaciones:</strong> Mensajes, comentarios y feedback que nos envías</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.2 Información recopilada automáticamente:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Datos de uso:</strong> Cómo interactúas con nuestra plataforma, páginas visitadas, tiempo de sesión</li>
                <li><strong>Información del dispositivo:</strong> Tipo de dispositivo, sistema operativo, navegador, dirección IP</li>
                <li><strong>Cookies y tecnologías similares:</strong> Para mejorar tu experiencia y analizar el tráfico</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.3 Información de terceros:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Redes sociales:</strong> Datos de Facebook, Instagram, TikTok cuando conectas tus cuentas</li>
                <li><strong>Analytics:</strong> Información de proveedores de análisis web</li>
                <li><strong>Servicios de pago:</strong> Información de transacciones de proveedores de pago</li>
              </ul>
            </section>

            {/* Section 3: How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cómo usamos tu información</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Utilizamos tu información para los siguientes propósitos:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Proporcionar servicios:</strong> Gestionar tu cuenta, conectar redes sociales, analizar métricas</li>
                <li><strong>Mejorar la plataforma:</strong> Desarrollar nuevas características, optimizar el rendimiento</li>
                <li><strong>Comunicación:</strong> Enviar notificaciones importantes, actualizaciones y soporte</li>
                <li><strong>Seguridad:</strong> Proteger contra fraudes, abusos y actividades ilegales</li>
                <li><strong>Cumplimiento legal:</strong> Cumplir con leyes aplicables y regulaciones</li>
                <li><strong>Marketing:</strong> Enviar ofertas relevantes (solo con tu consentimiento)</li>
              </ul>
            </section>

            {/* Section 4: Information Sharing */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Compartir información</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>No vendemos, alquilamos ni intercambiamos tu información personal</strong> con terceros para fines comerciales. 
                Solo compartimos tu información en las siguientes circunstancias:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Con tu consentimiento:</strong> Cuando autorizas explícitamente el intercambio</li>
                <li><strong>Proveedores de servicios:</strong> Empresas que nos ayudan a operar (hosting, análisis, pagos)</li>
                <li><strong>Redes sociales:</strong> Para publicar contenido en tus cuentas conectadas</li>
                <li><strong>Cumplimiento legal:</strong> Cuando lo requiera la ley o autoridades competentes</li>
                <li><strong>Protección de derechos:</strong> Para proteger nuestros derechos, propiedad o seguridad</li>
              </ul>
            </section>

            {/* Section 5: Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Seguridad de datos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Encriptación:</strong> Datos transmitidos y almacenados con encriptación de nivel bancario</li>
                <li><strong>Acceso restringido:</strong> Solo personal autorizado puede acceder a datos personales</li>
                <li><strong>Monitoreo continuo:</strong> Sistemas de detección de intrusiones y monitoreo 24/7</li>
                <li><strong>Copias de seguridad:</strong> Respaldo regular y seguro de todos los datos</li>
                <li><strong>Auditorías de seguridad:</strong> Evaluaciones regulares de nuestras medidas de seguridad</li>
              </ul>
            </section>

            {/* Section 6: Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Retención de datos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Conservamos tu información personal solo durante el tiempo necesario para cumplir con los propósitos 
                descritos en esta política:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Datos de cuenta:</strong> Mientras tu cuenta esté activa y hasta 2 años después de su cierre</li>
                <li><strong>Datos de uso:</strong> Hasta 3 años para análisis y mejoras del servicio</li>
                <li><strong>Contenido publicado:</strong> Hasta que lo elimines o cierres tu cuenta</li>
                <li><strong>Datos de transacciones:</strong> Hasta 7 años para cumplimiento fiscal</li>
                <li><strong>Logs de seguridad:</strong> Hasta 1 año para auditorías y seguridad</li>
              </ul>
            </section>

            {/* Section 7: Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Tus derechos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Tienes los siguientes derechos sobre tus datos personales:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Acceso:</strong> Solicitar una copia de los datos que tenemos sobre ti</li>
                <li><strong>Rectificación:</strong> Corregir información inexacta o incompleta</li>
                <li><strong>Eliminación:</strong> Solicitar que eliminemos tus datos personales</li>
                <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado y transferible</li>
                <li><strong>Limitación:</strong> Restringir el procesamiento de tus datos</li>
                <li><strong>Oposición:</strong> Oponerte al procesamiento de tus datos</li>
                <li><strong>Retirada del consentimiento:</strong> Revocar el consentimiento en cualquier momento</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Para ejercer estos derechos, contáctanos en: <strong>privacy@metriclon.com</strong>
              </p>
            </section>

            {/* Section 8: Cookies and Tracking */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies y tecnologías de seguimiento</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Utilizamos cookies y tecnologías similares para mejorar tu experiencia:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Cookies esenciales:</strong> Necesarias para el funcionamiento básico del sitio</li>
                <li><strong>Cookies de rendimiento:</strong> Para analizar el uso y mejorar la funcionalidad</li>
                <li><strong>Cookies de funcionalidad:</strong> Para recordar tus preferencias y configuraciones</li>
                <li><strong>Cookies de marketing:</strong> Para mostrar contenido relevante (solo con consentimiento)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Puedes gestionar tus preferencias de cookies desde la configuración de tu navegador o desde nuestro panel de preferencias.
              </p>
            </section>

            {/* Section 9: Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Servicios de terceros</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Nuestra plataforma se integra con servicios de terceros que pueden recopilar información:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Redes sociales:</strong> Facebook, Instagram, TikTok para gestión de contenido</li>
                <li><strong>Analytics:</strong> Google Analytics, Facebook Pixel para análisis de tráfico</li>
                <li><strong>Pagos:</strong> Stripe, PayPal para procesamiento de transacciones</li>
                <li><strong>Hosting:</strong> Servicios de alojamiento y CDN para el funcionamiento del sitio</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Cada servicio de terceros tiene su propia política de privacidad. Te recomendamos revisarlas.
              </p>
            </section>

            {/* Section 10: International Transfers */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Transferencias internacionales</h2>
              <p className="text-gray-700 leading-relaxed">
                Tu información puede ser transferida y procesada en países fuera de tu residencia, incluyendo Estados Unidos. 
                Nos aseguramos de que estas transferencias cumplan con las leyes de protección de datos aplicables y 
                implementamos medidas de seguridad adecuadas.
              </p>
            </section>

            {/* Section 11: Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Privacidad de menores</h2>
              <p className="text-gray-700 leading-relaxed">
                Metriclon no está dirigido a menores de 18 años. No recopilamos intencionalmente información personal 
                de menores. Si eres padre o tutor y crees que tu hijo nos ha proporcionado información personal, 
                contáctanos inmediatamente.
              </p>
            </section>

            {/* Section 12: Changes to This Policy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Cambios en esta política</h2>
              <p className="text-gray-700 leading-relaxed">
                Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos cambios importantes 
                por correo electrónico o mediante un aviso en nuestra plataforma. La fecha de "Última actualización" 
                será modificada para reflejar los cambios.
              </p>
            </section>

            {/* Section 13: Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Información de contacto</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Para preguntas sobre privacidad:</strong> privacy@metriclon.com
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Oficial de Protección de Datos:</strong> dpo@metriclon.com
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Dirección postal:</strong> [DIRECCIÓN COMPLETA DE MEXICLON]
                </p>
                <p className="text-gray-700">
                  <strong>Teléfono:</strong> +52 [NÚMERO DE TELÉFONO]
                </p>
              </div>
            </section>

            {/* Section 14: Legal Basis */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Base legal para el procesamiento</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Procesamos tu información personal basándonos en las siguientes bases legales:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Consentimiento:</strong> Cuando nos das permiso explícito para procesar tus datos</li>
                <li><strong>Ejecución del contrato:</strong> Para proporcionarte los servicios solicitados</li>
                <li><strong>Interés legítimo:</strong> Para mejorar nuestros servicios y prevenir fraudes</li>
                <li><strong>Cumplimiento legal:</strong> Para cumplir con obligaciones legales aplicables</li>
              </ul>
            </section>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="text-center text-sm text-gray-500">
              <p>© {new Date().getFullYear()} Metriclon. Todos los derechos reservados.</p>
              <div className="mt-2 space-x-4">
                <a href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
                  Volver al inicio
                </a>
                <span className="text-gray-400">|</span>
                <a href="/terms" className="text-blue-600 hover:text-blue-800 transition-colors">
                  Términos de Servicio
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
