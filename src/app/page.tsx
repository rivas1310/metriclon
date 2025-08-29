import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirigir automáticamente al login
  redirect('/login');
}
