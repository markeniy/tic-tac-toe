import { useState } from 'react';
import { supabase } from '../lib/supabase';

function AuthForm() {
  const [mode, setMode] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    const authAction =
      mode === 'sign-up'
        ? supabase.auth.signUp({
            email,
            password,
          })
        : supabase.auth.signInWithPassword({
            email,
            password,
          });

    const { error } = await authAction;

    if (error) {
      console.error('Auth error:', error);
      return;
    }

    setEmail('');
    setPassword('');
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <h1 className="app-title">Track Vault</h1>
        <p className="auth-text">
          Sign in to see your private tracks or create a new account.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={function (event) {
                setEmail(event.target.value);
              }}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={function (event) {
                setPassword(event.target.value);
              }}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="save-track-button auth-submit-button">
            {mode === 'sign-up' ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <button
          type="button"
          className="secondary-button"
          onClick={function () {
            setMode(function (currentMode) {
              return currentMode === 'sign-up' ? 'sign-in' : 'sign-up';
            });
          }}
        >
          {mode === 'sign-up'
            ? 'Already have an account? Sign In'
            : 'Need an account? Sign Up'}
        </button>
      </div>
    </main>
  );
}

export default AuthForm;
