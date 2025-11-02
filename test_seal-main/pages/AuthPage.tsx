import React from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { TestStudioLogo, GithubIcon } from '../components/icons/Icons';

interface AuthPageProps {
  onLogin: () => void;
}

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48" >
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C41.38,36.14,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 bg-gradient-g2">
      <div className="absolute top-8 left-8">
        <TestStudioLogo />
      </div>
      <Card className="w-full max-w-md" glow={true}>
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Sign in to TestStudio</h1>
          <p className="text-primary-muted mb-8">Start your AI-powered testing journey.</p>
        </div>
        <div className="space-y-4">
            <Button onClick={onLogin} className="w-full flex items-center justify-center">
               <GoogleIcon/> Continue with Google
            </Button>
            <Button onClick={onLogin} variant="secondary" className="w-full">
                Continue with Email
            </Button>
        </div>
        <p className="text-xs text-primary-muted text-center mt-8">
            By signing in you agree to our <a href="#" className="underline hover:text-primary">Terms</a> & <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
        </p>
      </Card>
    </div>
  );
};

export default AuthPage;
