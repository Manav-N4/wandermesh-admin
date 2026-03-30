import { useState } from 'react';
import { motion } from 'framer-motion';

interface AuthGateProps {
  onSuccess: () => void;
}

const AuthGate = ({ onSuccess }: AuthGateProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'wandermesh2024') {
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
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
          <div className="security-badge">INTERNAL ACCESS</div>
          <h1>WanderMesh</h1>
          <p>Please authenticate to access the lead management dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className={`input-group ${error ? 'shake' : ''}`}>
             <input
              type="password"
              placeholder="Enter access code"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={error ? 'input-error' : ''}
              autoFocus
            />
          </div>
          {error && <span className="error-message">Incorrect password</span>}
          <button type="submit" className="login-button">
            Unlock Dashboard
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
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
          text-align: center;
        }

        .auth-header {
          margin-bottom: 2rem;
        }

        .security-badge {
          display: inline-block;
          background: #f1f5f9;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          letter-spacing: 0.05em;
          margin-bottom: 1.5rem;
        }

        h1 {
          font-size: 1.75rem;
          color: #1e293b;
          margin-bottom: 0.75rem;
          font-weight: 800;
        }

        p {
          color: #64748b;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        input {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          background: #f8fafc;
          transition: all 0.2s;
          text-align: center;
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
          font-weight: 500;
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
        }

        .login-button:hover {
          background: #0f172a;
          transform: translateY(-1px);
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
