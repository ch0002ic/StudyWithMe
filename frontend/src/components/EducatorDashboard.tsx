import React from 'react';

const STORAGE_KEY = 'studywithme_history';

interface EducatorDashboardProps {
  onClose: () => void;
}

const EducatorDashboard: React.FC<EducatorDashboardProps> = ({ onClose }) => {
  // For MVP, just load from localStorage
  const data = localStorage.getItem(STORAGE_KEY);
  let messages: any[] = [];
  let quizHistory: any[] = [];
  if (data) {
    const parsed = JSON.parse(data);
    messages = parsed.messages || [];
    quizHistory = parsed.quizHistory || [];
  }

  // Optionally, add more analytics here

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="educator-dashboard-title"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)', zIndex: 3000,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32, minWidth: 340,
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)', maxWidth: 700, maxHeight: '80vh', overflowY: 'auto'
      }}>
        <h2 id="educator-dashboard-title" style={{ marginTop: 0 }}>Educator Dashboard</h2>
        <div style={{ marginBottom: 18 }}>
          <strong>Quiz History:</strong>
          <table style={{ width: '100%', fontSize: '0.97em', marginTop: 4 }}>
            <thead>
              <tr>
                <th>Quiz #</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {quizHistory.length === 0 ? (
                <tr><td colSpan={2}>No quiz history.</td></tr>
              ) : (
                quizHistory.map((q, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{q.score} / {q.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginBottom: 18 }}>
          <strong>Chat History:</strong>
          <div style={{ maxHeight: 200, overflowY: 'auto', background: '#f7f7f7', borderRadius: 8, padding: 8 }}>
            {messages.length === 0 ? (
              <div>No chat history.</div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} style={{
                  color: msg.sender === 'user' ? '#1976d2' : '#222',
                  marginBottom: 4,
                  fontWeight: msg.sender === 'user' ? 600 : 400
                }}>
                  <span>{msg.sender === 'user' ? 'You: ' : 'AI: '}</span>
                  <span>{msg.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            padding: '8px 20px',
            borderRadius: 8,
            background: '#43a047',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >Close</button>
      </div>
    </div>
  );
};

export default EducatorDashboard;