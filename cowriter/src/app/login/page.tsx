import { LoginForm } from '@/components/auth/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | CoWriter',
  description: 'Login to your CoWriter account',
};

export default function LoginPage() {
  return (
    <div className="container flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
