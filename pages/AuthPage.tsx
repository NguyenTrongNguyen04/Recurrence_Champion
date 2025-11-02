import React, { useState, FormEvent } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ThemeToggle from '../components/ui/ThemeToggle';
import { TestFlowLogo, EyeIcon, EyeSlashIcon, GoogleIcon, ExclamationCircleIcon } from '../components/icons/Icons';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  getAuthErrorMessage,
} from '../services/auth';
import { AuthError } from 'firebase/auth';

type AuthMode = 'login' | 'signup';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Check if email or password is empty
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    // Validate email format before sending request
    if (!validateEmail(email)) {
      setError('Invalid email format. Please enter a valid email address (e.g., user@example.com).');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      // Authentication state sẽ được cập nhật tự động qua AuthContext
      // App sẽ tự động redirect
    } catch (err) {
      const authError = err as AuthError;
      // Truyền mode vào để hiển thị thông báo phù hợp
      setError(getAuthErrorMessage(authError, mode));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      await loginWithGoogle();
      // Authentication state sẽ được cập nhật tự động qua AuthContext
      // App sẽ tự động redirect
    } catch (err) {
      const authError = err as AuthError;
      // Không cần truyền mode cho Google auth
      setError(getAuthErrorMessage(authError));
    } finally {
      setGoogleLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 bg-gradient-g2">
      <div className="absolute top-8 left-8">
        <TestFlowLogo />
      </div>
      <div className="absolute top-8 right-8">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md" glow={true}>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {mode === 'login' ? 'Sign in to' : 'Sign up for'} Test Studio AI
          </h1>
          <p className="text-primary-muted">
            {mode === 'login'
              ? 'Start your AI-powered testing journey.'
              : 'Create a new account to get started.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm error-animate flex items-start gap-3 shadow-lg shadow-red-500/10 backdrop-blur-sm">
              <ExclamationCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <span className="flex-1 leading-relaxed">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-surface2 border border-surface2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-violet text-primary"
              placeholder="Email"
              disabled={loading || googleLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-primary mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-surface2 border border-surface2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-violet text-primary"
                placeholder="Enter password"
                disabled={loading || googleLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-muted hover:text-primary transition-colors focus:outline-none"
                disabled={loading || googleLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="text-xs text-primary-muted mt-1">
                Password must be at least 6 characters
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || googleLoading}
          >
            {loading
              ? 'Processing...'
              : mode === 'login'
              ? 'Sign In'
              : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface2"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-primary-muted">or</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center"
            variant="secondary"
            disabled={googleLoading || loading}
          >
            <GoogleIcon className="mr-3" />
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={switchMode}
            className="text-sm text-primary-muted hover:text-primary transition-colors"
            disabled={loading || googleLoading}
          >
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <span className="font-semibold underline">Sign up</span>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <span className="font-semibold underline">Sign in</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-primary-muted text-center mt-8">
          By signing in, you agree to our{' '}
          <a href="#" className="underline hover:text-primary">
            Terms
          </a>{' '}
          &{' '}
          <a href="#" className="underline hover:text-primary">
            Privacy Policy
          </a>
          .
        </p>
      </Card>
    </div>
  );
};

export default AuthPage;
