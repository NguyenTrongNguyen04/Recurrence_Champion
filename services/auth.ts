import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  User,
  AuthError,
} from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Đăng nhập với email và password
 */
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    throw error as AuthError;
  }
};

/**
 * Đăng ký tài khoản mới với email và password
 */
export const registerWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    throw error as AuthError;
  }
};

/**
 * Sign in with Google
 */
export const loginWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  } catch (error) {
    throw error as AuthError;
  }
};

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error as AuthError;
  }
};

/**
 * Convert Firebase error code to English error message
 */
export const getAuthErrorMessage = (error: AuthError, mode: 'login' | 'signup' = 'login'): string => {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'Invalid email format. Please check your email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check your email or sign up for a new account.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      // Firebase doesn't distinguish between wrong email or password for security
      // But we can display a clearer message
      if (mode === 'login') {
        return 'Invalid email or password. Please check your login again.';
      } else {
        return 'Invalid login credentials.';
      }
    case 'auth/email-already-in-use':
      return 'This email is already in use. Please sign in or use a different email.';
    case 'auth/weak-password':
      return 'Password is too weak. Password must be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many login attempts. Please try again in a few minutes.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this site and try again.';
    case 'auth/cancelled-popup-request':
      return 'Only one popup request is allowed at a time. Please try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account with this email already exists with a different sign-in method. Please use that method to sign in.';
    default:
      // If error message contains "invalid-credential", display clear message
      if (error.message?.includes('invalid-credential') || error.message?.includes('INVALID_LOGIN_CREDENTIALS')) {
        return mode === 'login'
          ? 'Invalid email or password. Please check your login credentials.'
          : 'Invalid login credentials.';
      }
      return error.message || 'An error occurred. Please try again.';
  }
};

