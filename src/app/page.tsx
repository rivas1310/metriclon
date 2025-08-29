export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Integración Social</h1>
      <p className="text-xl mb-4">Plataforma de gestión de redes sociales</p>
      <div className="mt-8">
        <a href="/login" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4">
          Iniciar Sesión
        </a>
        <a href="/register" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Registrarse
        </a>
      </div>
    </main>
  );
}
