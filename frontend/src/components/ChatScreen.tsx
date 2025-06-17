import React, { useState, useRef } from 'react';
import { Profile } from './Onboarding';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
type SpeechRecognition = any;
type SpeechRecognitionEvent = any;

interface Message { sender: 'user' | 'bot'; text: string; type?: 'normal' | 'explanation'; }

interface ChatScreenProps { profile: Profile; onBack: () => void; }

const LEVEL_UP_XP = 100;

const ChatScreen: React.FC<ChatScreenProps> = ({ profile, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [badges, setBadges] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState(profile.difficulty_level);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const synth = window.speechSynthesis;

  function speak(text: string, ageGroup: string) {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    if (ageGroup === 'child') utter.pitch = 1.5;
    if (ageGroup === 'senior') utter.rate = 0.8;
    synth.speak(utter);
  }

  // XP/Level/Badge logic
  function handleCorrectAnswer() {
    let newXp = xp + 20;
    let newLevel = level;
    const newBadges = [...badges];

    if (newXp >= LEVEL_UP_XP) {
      newXp -= LEVEL_UP_XP;
      newLevel += 1;
      // Add a badge on level up
      if (!newBadges.includes(`Level ${newLevel} Achieved`)) {
        newBadges.push(`Level ${newLevel} Achieved`);
      }
    }
    setXp(newXp);
    setLevel(newLevel);
    setBadges(newBadges);
  }

  // Send message to backend
  const sendMessage = async (msg?: string, explain?: boolean) => {
    const messageToSend = msg ?? input;
    if (!messageToSend.trim()) return;
    setLoading(true);

    if (!explain) {
      setMessages(prev => [...prev, { sender: 'user', text: messageToSend }]);
    }

    setInput('');
    try {
      const resp = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          session_id: profile.ageGroup, // use camelCase here
          profile: {
            age_group: profile.ageGroup, // convert to snake_case ONLY here
            subject: profile.subject,
            difficulty_level: difficulty || 1
          },
          xp,
          explain: explain || false
        })
      });
      if (!resp.ok) {
        const err = await resp.json();
        setMessages(prev => [
          ...prev,
          { sender: 'bot', text: err.detail || 'Sorry, there was an error with the AI service.' }
        ]);
        setLoading(false);
        return;
      }
      const data = await resp.json();
      const botMsg: Message = { sender: 'bot', text: data.reply, type: explain ? 'explanation' : 'normal' };
      setMessages(prev => [...prev, botMsg]);
      speak(data.reply, profile.ageGroup); // use camelCase
      setXp(data.xp ?? xp);
      setDifficulty(data.difficulty_level ?? difficulty);
      if (data.reply.toLowerCase().includes('correct')) handleCorrectAnswer();
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: 'Network or server error. Please try again.' }
      ]);
    }
    setLoading(false);
  };

  // Voice input (Web Speech API)
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // "Explain" button handler
  const handleExplain = () => {
    const lastUserMsg = messages.slice().reverse().find(m => m.sender === 'user');
    if (lastUserMsg) sendMessage(lastUserMsg.text, true);
  };

  return (
    <div className="chat-screen" style={{ position: 'relative', minHeight: '100vh' }}>
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
        aria-label="Back to onboarding"
      >
        ← Back
      </button>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        marginBottom: 16, marginTop: 8
      }}>
        <div style={{ fontWeight: 700, fontSize: '1.15em', marginBottom: 4 }}>
          Level {level} — {xp} XP
        </div>
        <div style={{
          width: 200,
          height: 14,
          background: '#333',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 8,
          border: '1px solid #888'
        }}>
          <div style={{
            width: `${(xp / LEVEL_UP_XP) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #1976d2 60%, #8e24aa 100%)',
            transition: 'width 0.3s'
          }} />
        </div>
        {/* Show badges */}
        <div style={{ display: 'flex', gap: 8 }}>
          {badges.map((badge, i) => (
            <span key={i} style={{
              background: '#fbc02d', color: '#333', borderRadius: 12,
              padding: '2px 10px', fontSize: '0.93em', fontWeight: 600
            }}>
              🏅 {badge}
            </span>
          ))}
        </div>
      </div>
      <div className="chat-container" style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-bubble ${msg.sender}`}
            aria-live={msg.sender === 'bot' ? 'polite' : undefined}
            style={{
              background: msg.sender === 'user' ? '#1976d2' : '#222',
              color: '#fff',
              borderRadius: 16,
              padding: '12px 18px',
              margin: '8px 0',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              fontStyle: msg.type === 'explanation' ? 'italic' : 'normal'
            }}
          >
            {msg.text}
            {msg.sender === 'bot' && msg.type !== 'explanation' && (
              <button
                onClick={() => speak(msg.text, profile.ageGroup || profile.ageGroup)}
                aria-label="Read aloud"
                style={{
                  marginLeft: 8,
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer'
                }}
                tabIndex={0}
              >🔊</button>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ color: '#888', margin: '8px 0' }}>AI is typing...</div>
        )}
        <div className="chat-input-area" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your question..."
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            aria-label="Chat input"
            style={{ flex: 1, fontSize: '1.1em', borderRadius: 8, padding: 8 }}
            disabled={loading}
          />
          <button onClick={() => sendMessage()} aria-label="Send message" disabled={loading}>Send</button>
          <button
            onClick={listening ? stopListening : startListening}
            aria-label={listening ? 'Stop voice input' : 'Start voice input'}
            disabled={loading}
          >
            {listening ? '🛑 Stop' : '🎤 Speak'}
          </button>
          <button
            onClick={handleExplain}
            aria-label="Explain last answer"
            disabled={loading || !messages.some(m => m.sender === 'user')}
            style={{ background: '#fbc02d', color: '#222', borderRadius: 8, padding: '0 10px' }}
          >
            Explain
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;