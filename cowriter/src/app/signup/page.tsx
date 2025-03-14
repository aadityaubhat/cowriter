import { SignupForm } from '@/components/auth/SignupForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | CoWriter',
  description: 'Create a new CoWriter account',
};

export default function SignupPage() {
  return (
    <div className="container flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-md">
        <SignupForm />
      </div>
    </div>
  );
}
