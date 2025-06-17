import React, { useState } from "react";
import Homepage from "./components/Homepage";
import Onboarding, { Profile } from "./components/Onboarding";
import { ChatScreen } from "./components/ChatScreen";
import Settings from "./components/Settings";
import StudentDashboard from "./components/StudentDashboard";
import "./styles/ageThemes.css";

type AppMode = "chat" | "quiz";

const getThemeClass = (profile: Profile | null) => {
  if (!profile) return "";
  switch (profile.ageGroup) {
    case "child":
      return "child-theme";
    case "teen":
      return "teen-theme";
    case "adult":
      return "adult-theme";
    case "senior":
      return "senior-theme";
    default:
      return "";
  }
};

const App: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [persona, setPersona] = useState("friendly");
  const [autoRead, setAutoRead] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>("🧑");
  const [language, setLanguage] = useState("en");
  const [currentMode, setCurrentMode] = useState<AppMode>('chat');

  const themeClass = getThemeClass(profile);
  const accessibilityClass = `${highContrast ? "high-contrast" : ""} ${
    largeText ? "large-text" : ""
  }`;

  // Add classes to <body> for accessibility
  React.useEffect(() => {
    document.body.classList.toggle("large-text", largeText);
    document.body.classList.toggle("high-contrast", highContrast);
  }, [largeText, highContrast]);

  return (
    <div className={`app-container ${themeClass} ${accessibilityClass}`}>
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "1rem 0 0.5rem 0",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "2rem" }}>StudyWithMe</h1>
        <span
          style={{
            fontStyle: "italic",
            color: "#1565c0",
            fontSize: "1.1rem",
            marginBottom: "0.5rem",
          }}
        >
          Perfect your knowledge, one review at a time.
        </span>

        
          {/* <button
            aria-label="Toggle high contrast mode"
            onClick={() => setHighContrast((h) => !h)}
            style={{ marginRight: 8 }}
          >
            {highContrast ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            aria-label="Toggle large text mode"
            onClick={() => setLargeText((l) => !l)}
          >
            {largeText ? "Normal Text" : "Large Text"}
          </button> */}
          {profile && (
          <div style={{ 
            display: "flex", 
            justifyContent: "center",
            marginTop: "1rem",
            gap: "1rem"
          }}>
            <button
              onClick={() => setCurrentMode('chat')}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: currentMode === 'chat' ? "#1976d2" : "#e0e0e0",
                color: currentMode === 'chat' ? "#fff" : "#333",
                border: "none",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              aria-pressed={currentMode === 'chat'}
            >
              💬 Chat Mode
            </button>
            <button
              onClick={() => setCurrentMode('quiz')}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: currentMode === 'quiz' ? "#8e24aa" : "#e0e0e0",
                color: currentMode === 'quiz' ? "#fff" : "#333",
                border: "none",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              aria-pressed={currentMode === 'quiz'}
            >
              📝 Quiz Mode
            </button>
          </div>
        )}
        
        <div>
          {/* Existing dashboard button */}
          {profile && (
            <button
              onClick={() => setShowDashboard(true)}
              style={{ marginLeft: 8 }}
              aria-label="View dashboard"
            >
              📊 Dashboard
            </button>
          )}
          
        </div>
      </header>
      <main style={{ minHeight: "60vh" }}>
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
          <>
            {/* Conditionally render based on mode */}
            {currentMode === 'chat' ? (
              <ChatScreen
                profile={profile}
                onBack={() => setProfile(null)}
                persona={persona}
                autoRead={autoRead}
                userAvatar={userAvatar}
                language={language}
                quizMode={false} // Add this prop to hide quiz UI in chat mode
              />
            ) : (
              <ChatScreen
                profile={profile}
                onBack={() => setProfile(null)}
                persona={persona}
                autoRead={autoRead}
                userAvatar={userAvatar}
                language={language}
                quizMode={true} // Show only quiz UI in quiz mode
              />
            )}
          </>
        )}
      </main>
      <button
        onClick={() => setShowSettings(true)}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 100,
          background: "#fff",
          border: "0.1px solid #1976d2",
          borderRadius: 8,
          padding: "6px 16px",
          fontWeight: 700,
          cursor: "pointer",
        }}
        aria-label="Open settings"
      >
        ⚙️ Settings
      </button>
      {showSettings && (
        <Settings
          largeText={largeText}
          setLargeText={setLargeText}
          highContrast={highContrast}
          setHighContrast={setHighContrast}
          persona={persona}
          setPersona={setPersona}
          autoRead={autoRead}
          setAutoRead={setAutoRead}
          userAvatar={userAvatar}
          setUserAvatar={setUserAvatar}
          language={language}
          setLanguage={setLanguage}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showDashboard && profile && (
        <StudentDashboard
          onClose={() => setShowDashboard(false)}
          profile={profile}
        />
      )}
      <footer
        style={{
          textAlign: "center",
          color: "#888",
          fontSize: "1rem",
          margin: "2rem 0 1rem 0",
        }}
      >
        &copy; {new Date().getFullYear()} StudyWithMe &mdash; Perfect your
        knowledge, one review at a time.
      </footer>
    </div>
  );
};

export default App;
