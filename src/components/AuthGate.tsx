import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface AuthGateProps {
  onSuccess: () => void;
}

const AuthGate = ({ onSuccess }: AuthGateProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="auth-gate-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="auth-card"
      >
        <div className="auth-header">
          <div className="security-badge">SECURE ACCESS</div>
          <h1>WanderMesh</h1>
          <p>Sign in with your admin credentials to manage leads.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className={`input-group ${error ? 'shake' : ''}`}>
             <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={error ? 'input-error' : ''}
              required
              autoFocus
            />
             <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={error ? 'input-error' : ''}
              required
            />
          </div>
          
          {error && <span className="error-message">{error}</span>}
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </motion.div>

      <style>{`
        .auth-gate-container {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
        }

        .auth-card {
          width: 100%;
          max-width: 400px;
          background: white;
          padding: 3rem 2.5rem;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
          text-align: center;
        }

        .auth-header {
          margin-bottom: 2rem;
        }

        .security-badge {
          display: inline-block;
          background: #3b82f61a;
          color: #3b82f6;
          font-size: 10px;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 6px;
          letter-spacing: 0.05em;
          margin-bottom: 1.5rem;
        }

        h1 {
          font-size: 1.75rem;
          color: #1e293b;
          margin-bottom: 0.75rem;
          font-weight: 850;
        }

        p {
          color: #64748b;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        input {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-size: 1rem;
          background: white;
          color: #1e293b;
          transition: all 0.2s;
        }

        input::placeholder {
          color: #94a3b8;
        }

        input:focus {
          outline: none;
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.05);
        }

        .input-error {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .error-message {
          color: #ef4444;
          font-size: 0.85rem;
          font-weight: 600;
          display: block;
        }

        .login-button {
          width: 100%;
          background: #1e293b;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          transition: all 0.2s;
          cursor: pointer;
        }

        .login-button:hover:not(:disabled) {
          background: #0f172a;
          transform: translateY(-1px);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .shake {
          animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default AuthGate;
