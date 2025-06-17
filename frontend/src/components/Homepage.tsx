import React from 'react';
import { FaRobot, FaUserGraduate, FaUniversalAccess, FaGamepad } from 'react-icons/fa';

const Homepage: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <main
    className="homepage"
    style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 32,
      margin: '2rem auto',
      maxWidth: 900,
      boxShadow: '0 6px 32px rgba(80,80,120,0.08)',
      padding: '2.5rem 1.5rem'
    }}
  >
    <div
      className="main-card"
      style={{
        borderRadius: 20,
        padding: '2rem 2rem 1.5rem 2rem',
        textAlign: 'center',
        marginBottom: '2rem',
        width: '100%',
        maxWidth: 600,
        boxShadow: '0 2px 16px rgba(80,80,120,0.10)'
      }}
    >
      <span
        style={{
          fontSize: '2.5rem',
          display: 'block',
          marginBottom: 8,
          animation: 'bounce 1.5s infinite alternate'
        }}
      >🧑‍💻</span>
      <h1 style={{ fontWeight: 700, margin: 0, letterSpacing: '-1px' }}>StudyWithMe</h1>
      <p style={{ fontStyle: 'italic', color: '#1565c0', margin: '0.5rem 0 1rem 0' }}>
        Perfect your knowledge, one review at a time.
      </p>
      <p style={{ maxWidth: 500, margin: '0 auto', color: '#333', lineHeight: 1.7 }}>
        Your adaptive AI tutor for every learner. Personalized, accessible, and engaging learning — at your own pace, for all ages and abilities.
      </p>
    </div>
    <section>
      <Feature icon={<FaRobot size={32} color="#1976d2" />} label="AI-Powered Tutor" desc="Conversational, adaptive, and always encouraging." />
      <Feature icon={<FaUserGraduate size={32} color="#43a047" />} label="Personalized Learning" desc="Content and style tailored to your age and goals." />
      <Feature icon={<FaUniversalAccess size={32} color="#fbc02d" />} label="Accessible for All" desc="Large text, high contrast, and voice interaction." />
      <Feature icon={<FaGamepad size={32} color="#8e24aa" />} label="Fun & Gamified" desc="Earn XP, level up, and celebrate your progress!" />
    </section>
    <button
      onClick={onStart}
      style={{
        padding: '1rem 2.5rem',
        borderRadius: 12,
        background: 'linear-gradient(90deg, #1976d2 60%, #8e24aa 100%)',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 700,
        margin: '2rem 0 2.5rem 0',
        boxShadow: '0 2px 12px rgba(80,80,120,0.08)',
        transition: 'background 0.2s, transform 0.2s',
        minWidth: 200,
        alignSelf: 'center'
      }}
      aria-label="Start Learning"
      onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.04)')}
      onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
      tabIndex={0}
    >
      Start Learning
    </button>
    <style>
      {`
        @keyframes bounce {
          0% { transform: translateY(0);}
          100% { transform: translateY(-10px);}
        }
        .feature-card:focus {
          outline: 2px solid #1976d2;
          outline-offset: 2px;
        }
        button:focus {
          outline: 2px solid #8e24aa;
          outline-offset: 2px;
        }
      `}
    </style>
  </main>
);

function Feature({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div
      className="feature-card"
      tabIndex={0}
      style={{
        borderRadius: 16,
        padding: '1.5rem 1rem',
        boxShadow: '0 2px 8px rgba(80,80,120,0.10)',
        textAlign: 'center',
        transition: 'box-shadow 0.2s, transform 0.2s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid #e0e0e0',
        wordBreak: 'normal',
        whiteSpace: 'normal'
      }}
    >
      <div style={{ marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 700, margin: '0.3rem 0 0.5rem 0' }}>{label}</div>
      <div style={{ color: '#444', lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

export default Homepage;