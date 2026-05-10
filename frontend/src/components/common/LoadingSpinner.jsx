import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-container">
      <Loader2 size={40} className="spinner-icon" />
      <p>{message}</p>
      <style>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          color: var(--text-secondary);
          gap: 16px;
        }
        .loading-container p {
          font-size: 0.875rem;
        }
        .spinner-icon {
          animation: spin 1s linear infinite;
          color: var(--accent-blue);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
