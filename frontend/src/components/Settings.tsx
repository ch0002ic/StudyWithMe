import React, { useRef } from 'react';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文 (Chinese)' },
  { code: 'ms', label: 'Malay' },
  { code: 'ta', label: 'தமிழ் (Tamil)' }
];

interface SettingsProps {
  largeText: boolean;
  setLargeText: (v: boolean) => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  persona: string;
  setPersona: (v: string) => void;
  autoRead: boolean;
  setAutoRead: (v: boolean) => void;
  userAvatar: string;
  setUserAvatar: (v: string) => void;
  onClose: () => void;
  language: string;
  setLanguage: (v: string) => void;
}

const personas = [
  { value: 'friendly', label: 'Friendly Bot 🤖' },
  { value: 'formal', label: 'Formal Tutor 🎓' },
  { value: 'playful', label: 'Playful Buddy 🐻' }
];

const presetAvatars = [
  '🧑', '👩‍🎓', '👦', '👧', '🧓', '👨‍🏫', '🐱', '🐶', '🐻', '🦉'
];

const Settings: React.FC<SettingsProps> = ({
  largeText, setLargeText,
  highContrast, setHighContrast,
  persona, setPersona,
  autoRead, setAutoRead,
  userAvatar, setUserAvatar,
  onClose,
  language, setLanguage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) setUserAvatar(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      aria-modal="true"
      role="dialog"
    >
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 32,
        minWidth: 320,
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
      }}>
        <h2 style={{ marginTop: 0 }}>Settings & Profile</h2>
        <div style={{ marginBottom: 18 }}>
          <label>
            <input
              type="checkbox"
              checked={largeText}
              onChange={e => setLargeText(e.target.checked)}
            />{' '}
            Large Text
          </label>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label>
            <input
              type="checkbox"
              checked={highContrast}
              onChange={e => setHighContrast(e.target.checked)}
            />{' '}
            High Contrast
          </label>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label>
            Tutor Persona:{' '}
            <select
              value={persona}
              onChange={e => setPersona(e.target.value)}
              style={{ fontSize: '1em', marginLeft: 8 }}
            >
              {personas.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label>
            <input
              type="checkbox"
              checked={autoRead}
              onChange={e => setAutoRead(e.target.checked)}
            />{' '}
            Auto-Read AI Replies
          </label>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label>
            Language:{' '}
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              style={{ fontSize: '1em', marginLeft: 8 }}
              aria-label="Select language"
            >
              {languages.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label>
            <div style={{ marginBottom: 6 }}>Your Avatar:</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {presetAvatars.map((a, i) => (
                <button
                  key={i}
                  onClick={() => setUserAvatar(a)}
                  style={{
                    fontSize: '2em',
                    background: userAvatar === a ? '#1976d2' : '#eee',
                    color: userAvatar === a ? '#fff' : '#222',
                    border: userAvatar === a ? '2px solid #1976d2' : '1px solid #ccc',
                    borderRadius: 12,
                    cursor: 'pointer',
                    padding: '2px 10px'
                  }}
                  aria-label={`Select avatar ${a}`}
                >
                  {a}
                </button>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  fontSize: '1.2em',
                  background: '#eee',
                  border: '1px solid #ccc',
                  borderRadius: 12,
                  cursor: 'pointer',
                  padding: '2px 10px'
                }}
                aria-label="Upload custom avatar"
              >
                📷 Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                aria-label="Upload avatar image"
              />
            </div>
            {userAvatar && userAvatar.startsWith('data:') && (
              <img
                src={userAvatar}
                alt="Custom avatar"
                style={{ width: 48, height: 48, borderRadius: '50%', marginTop: 8, border: '2px solid #1976d2' }}
              />
            )}
          </label>
        </div>
        <button onClick={onClose} style={{
          marginTop: 16,
          padding: '8px 20px',
          borderRadius: 8,
          background: '#1976d2',
          color: '#fff',
          border: 'none',
          fontWeight: 700,
          cursor: 'pointer'
        }}>Close</button>
      </div>
    </div>
  );
};

export default Settings;