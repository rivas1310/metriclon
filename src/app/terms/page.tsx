import React from 'react';

export default function TermsPage() {
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
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white text-center">
              Términos de Servicio — Metriclon
            </h1>
            <p className="text-blue-100 text-center mt-2">
              Última actualización: {currentDate}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-8">
            {/* Contact Info */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Contacto:</strong> info@metriclon.com
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Dominio:</strong> https://metriclon.com/
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1: Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introducción</h2>
              <p className="text-gray-700 leading-relaxed">
                Bienvenido a Metriclon. Estos Términos de Servicio ("Términos") regulan tu uso de la plataforma Metriclon (el "Servicio"), 
                disponible en https://metriclon.com (la "Web" o la "App"). Al acceder o usar el Servicio aceptas estos Términos.
              </p>
            </section>

            {/* Section 2: Services */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Servicios que ofrecemos</h2>
              <p className="text-gray-700 leading-relaxed">
                Metriclon permite a comerciantes y creadores administrar contenido en plataformas sociales, incluyendo la posibilidad de 
                conectar cuentas mediante proveedores externos (por ejemplo Facebook, Instagram, TikTok), analizar métricas y gestionar 
                publicaciones desde un panel centralizado.
              </p>
            </section>

            {/* Section 3: Registration */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Registro y cuentas</h2>
              <p className="text-gray-700 leading-relaxed">
                Para usar ciertas funciones deberás crear una cuenta y vincular tus cuentas de redes sociales. Eres responsable de mantener 
                la confidencialidad de tu usuario y contraseña, y de toda la actividad que ocurra bajo tu cuenta.
              </p>
            </section>

            {/* Section 4: External Integration */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Integración con proveedores externos</h2>
              <p className="text-gray-700 leading-relaxed">
                Al vincular tu cuenta de Facebook, Instagram, TikTok u otras plataformas, autorizas a Metriclon a usar los tokens y 
                permisos que aceptes vía OAuth para realizar acciones autorizadas (p. ej. analizar métricas, gestionar publicaciones). 
                Los tokens se almacenan de forma segura y puedes revocar el acceso en cualquier momento desde tu cuenta o desde la 
                plataforma conectada.
              </p>
            </section>

            {/* Section 5: Content and Responsibilities */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Contenido y responsabilidades del usuario</h2>
              <p className="text-gray-700 leading-relaxed">
                Eres responsable del contenido que subes o publicas a través del Servicio. No publicarás material que infrinja derechos 
                de terceros, que sea ilegal, difamatorio, violento, de odio, obsceno o que viole las políticas de las plataformas externas. 
                Metriclon puede remover o bloquear contenido que viole estos Términos o las políticas de terceros.
              </p>
            </section>

            {/* Section 6: Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Propiedad intelectual</h2>
              <p className="text-gray-700 leading-relaxed">
                Tú mantienes la propiedad de los derechos sobre tu contenido. Al usar funciones de publicación, concedes a Metriclon una 
                licencia limitada para procesar y transmitir tu contenido a las plataformas conectadas con el único fin de ejecutar el Servicio.
              </p>
            </section>

            {/* Section 7: Fees and Payments */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Tarifas y pagos</h2>
              <p className="text-gray-700 leading-relaxed">
                Algunas funcionalidades pueden estar sujetas a pago. Si activas servicios de pago, la información de cobro se gestionará 
                mediante proveedores de pago externos conforme a sus términos.
              </p>
            </section>

            {/* Section 8: Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Privacidad</h2>
              <p className="text-gray-700 leading-relaxed">
                El tratamiento de datos personales está descrito en nuestra Política de Privacidad disponible en https://metriclon.com/privacy. 
                Allí explicamos qué datos recopilamos, cómo los usamos y tus derechos.
              </p>
            </section>

            {/* Section 9: Liability Limitation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitación de responsabilidad</h2>
              <p className="text-gray-700 leading-relaxed">
                En la máxima medida permitida por la ley, Metriclon no será responsable por daños indirectos, especiales o consecuenciales 
                derivados del uso o la imposibilidad de usar el Servicio. Nuestra responsabilidad total frente a ti por cualquier reclamo 
                no excederá la cantidad pagada (si corresponde) por el servicio en los últimos 12 meses, o $100 USD si no hubieres pagado nada.
              </p>
            </section>

            {/* Section 10: Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Terminación</h2>
              <p className="text-gray-700 leading-relaxed">
                Podemos suspender o cancelar tu acceso si violas estos Términos o si lo exige la ley o un proveedor tercero (p. ej. si tu 
                cuenta en Facebook fuera suspendida). También puedes cerrar tu cuenta en cualquier momento desde el panel.
              </p>
            </section>

            {/* Section 11: Modifications */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Modificaciones</h2>
              <p className="text-gray-700 leading-relaxed">
                Nos reservamos el derecho de modificar estos Términos. Avisaremos cambios importantes y la fecha de "Última actualización" 
                será actualizada. El uso continuado del Servicio implica la aceptación de los Términos modificados.
              </p>
            </section>

            {/* Section 12: Applicable Law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Ley aplicable y jurisdicción</h2>
              <p className="text-gray-700 leading-relaxed">
                Estos Términos se rigen por las leyes de México. Para cualquier controversia, las partes se someten a la jurisdicción 
                de los tribunales competentes de Ciudad de México, México.
              </p>
            </section>

            {/* Section 13: Contact */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contacto</h2>
              <p className="text-gray-700 leading-relaxed">
                Si tienes preguntas sobre estos Términos, escríbenos a: info@metriclon.com
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="text-center text-sm text-gray-500">
              <p>© {new Date().getFullYear()} Metriclon. Todos los derechos reservados.</p>
              <p className="mt-1">
                <a href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
                  Volver al inicio
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
