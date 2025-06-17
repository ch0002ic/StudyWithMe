import React, { useState } from 'react';

export type AgeGroup = 'child' | 'teen' | 'adult' | 'senior';
export type Subject = 'math' | 'language' | 'science';
export interface Profile { ageGroup: AgeGroup; subject: Subject; difficulty_level: number; }

interface OnboardingProps {
  onComplete: (profile: Profile) => void;
  onBack: () => void; // <-- Add this prop
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onBack }) => {
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult');
  const [subject, setSubject] = useState<Subject>('math');
  const [difficulty, setDifficulty] = useState<number>(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ ageGroup, subject, difficulty_level: difficulty });
  };

  return (
    <div
      className="onboarding"
      style={{
        borderRadius: 20,
        padding: '2.5rem 2rem',
        textAlign: 'center',
        margin: '2rem auto',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 2px 16px rgba(80,80,120,0.10)'
      }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{
          position: 'absolute',
          left: 24,
          top: 24,
          background: 'none',
          border: 'none',
          color: '#1565c0',
          fontWeight: 700,
          fontSize: '1rem',
          cursor: 'pointer'
        }}
        aria-label="Back to homepage"
      >
        ← Back
      </button>
      <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Welcome to StudyWithMe</h2>
      <p style={{ marginBottom: '2rem', fontStyle: 'italic' }}>
        Perfect your knowledge, one review at a time.
      </p>
      <form
        onSubmit={handleSubmit}
        aria-label="Onboarding form"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
          alignItems: 'stretch'
        }}
      >
        <label style={{ fontWeight: 600, marginBottom: 4 }}>
          Age Group:
          <select
            value={ageGroup}
            onChange={e => setAgeGroup(e.target.value as AgeGroup)}
            aria-label="Select age group"
            style={{
              width: '100%',
              marginTop: 4,
              padding: '0.5rem',
              borderRadius: 8,
              border: '1px solid #bdbdbd',
              fontSize: '1rem'
            }}
          >
            <option value="child">Child</option>
            <option value="teen">Teen</option>
            <option value="adult">Adult</option>
            <option value="senior">Senior</option>
          </select>
        </label>
        <label style={{ fontWeight: 600, marginBottom: 4 }}>
          Subject:
          <select
            value={subject}
            onChange={e => setSubject(e.target.value as Subject)}
            aria-label="Select subject"
            style={{
              width: '100%',
              marginTop: 4,
              padding: '0.5rem',
              borderRadius: 8,
              border: '1px solid #bdbdbd',
              fontSize: '1rem'
            }}
          >
            <option value="math">Math</option>
            <option value="language">Language</option>
            <option value="science">Science</option>
          </select>
        </label>
        <label style={{ fontWeight: 600, marginBottom: 4 }}>
          Difficulty:
          <input
            type="range"
            min={1}
            max={10}
            value={difficulty}
            onChange={e => setDifficulty(Number(e.target.value))}
            aria-label="Select difficulty"
            style={{ width: '100%', marginTop: 8 }}
          />
          <span style={{ marginLeft: 8, fontWeight: 500 }}>{difficulty}</span>
        </label>
        <button
          type="submit"
          style={{
            marginTop: '1.2rem',
            padding: '0.8rem 0',
            borderRadius: 10,
            background: 'linear-gradient(90deg, #1976d2 60%, #8e24aa 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1.1rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s, transform 0.2s'
          }}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Start Learning
        </button>
      </form>
    </div>
  );
};

export default Onboarding;