import React, { useState } from 'react';
import Homepage from './components/Homepage';
import Onboarding, { Profile } from './components/Onboarding';
import ChatScreen from './components/ChatScreen';
import './styles/ageThemes.css';

const getThemeClass = (profile: Profile | null) => {
  if (!profile) return '';
  switch (profile.ageGroup) {
    case 'child':
      return 'child-theme';
    case 'teen':
      return 'teen-theme';
    case 'adult':
      return 'adult-theme';
    case 'senior':
      return 'senior-theme';
    default:
      return '';
  }
};

const App: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);

  const themeClass = getThemeClass(profile);
  const accessibilityClass = `${highContrast ? 'high-contrast' : ''} ${largeText ? 'large-text' : ''}`;

  return (
    <div className={`app-container ${themeClass} ${accessibilityClass}`}>
      <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0 0.5rem 0' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>StudyWithMe</h1>
        <span style={{ fontStyle: 'italic', color: '#1565c0', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          Perfect your knowledge, one review at a time.
        </span>
        <div>
          <button
            aria-label="Toggle high contrast mode"
            onClick={() => setHighContrast(h => !h)}
            style={{ marginRight: 8 }}
          >
            {highContrast ? 'Normal Contrast' : 'High Contrast'}
          </button>
          <button
            aria-label="Toggle large text mode"
            onClick={() => setLargeText(l => !l)}
          >
            {largeText ? 'Normal Text' : 'Large Text'}
          </button>
        </div>
      </header>
      <main style={{ minHeight: '60vh' }}>
        {!showOnboarding && !profile && (
          <Homepage onStart={() => setShowOnboarding(true)} />
        )}
        {showOnboarding && !profile && (
          <Onboarding
            onComplete={setProfile}
            onBack={() => setShowOnboarding(false)}
          />
        )}
        {profile && (
          <ChatScreen
            profile={profile}
            onBack={() => setProfile(null)}
          />
        )}
      </main>
      <footer style={{ textAlign: 'center', color: '#888', fontSize: '1rem', margin: '2rem 0 1rem 0' }}>
        &copy; {new Date().getFullYear()} StudyWithMe &mdash; Perfect your knowledge, one review at a time.
      </footer>
    </div>
  );
};

export default App;