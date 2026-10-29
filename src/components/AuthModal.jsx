import React, { useState } from 'react';
import { auth } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut 
} from 'firebase/auth';
import { X, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, user }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isResetting) {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent! Check your inbox.');
      } else if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        onClose();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        {user ? (
          <div className="text-center py-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Account Profile</h2>
            <p className="text-gray-600 text-sm mb-6">{user.email}</p>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white py-2.5 rounded-xl font-semibold hover:bg-red-600 transition-colors"
            >
              Log Out
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {isResetting ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {isResetting 
                ? 'Enter your email to receive a password reset link.' 
                : isSignUp 
                  ? 'Sign up to sync your recipes across devices.' 
                  : 'Log in to access your saved recipes.'}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle size={16} />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {!isResetting && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading 
                  ? 'Processing...' 
                  : isResetting 
                    ? 'Send Reset Link' 
                    : isSignUp 
                      ? 'Sign Up' 
                      : 'Log In'}
              </button>
            </form>

            <div className="mt-4 text-center text-xs text-gray-500 space-y-2">
              {!isResetting && (
                <button
                  onClick={() => { setIsResetting(true); setError(''); setMessage(''); }}
                  className="text-orange-600 font-medium hover:underline block mx-auto"
                >
                  Forgot Password?
                </button>
              )}

              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setIsResetting(false);
                  setError('');
                  setMessage('');
                }}
                className="text-gray-600 font-medium hover:underline block mx-auto"
              >
                {isResetting 
                  ? 'Back to Log In' 
                  : isSignUp 
                    ? 'Already have an account? Log In' 
                    : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}