import React, { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FaImage } from "react-icons/fa6";
import { MdKeyboardVoice } from "react-icons/md";

import { Profile } from "./Onboarding";
import EducatorDashboard from "./EducatorDashboard";
import StudentDashboard from "./StudentDashboard";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
type SpeechRecognition = any;
type SpeechRecognitionEvent = any;

interface Message {
  sender: "user" | "bot";
  text: string;
  type?: "normal" | "explanation";
  flagged?: boolean; // <-- Add this
}

export interface ChatScreenProps {
  profile: Profile;
  onBack: () => void;
  persona: string;
  autoRead: boolean;
  userAvatar: string;
  language: string; // <-- Add this line
  quizMode?: boolean;
}

const LEVEL_UP_XP = 100;
const SUMMARY_INTERVAL = 5; // Show summary every 5 questions

const personaAvatars: Record<string, string> = {
  friendly: "🤖",
  formal: "🎓",
  playful: "🐻",
};
const userAvatar = "🧑";

const translations: Record<string, Record<string, string>> = {
  en: {
    send: "Send",
    speak: "Speak",
    explain: "Explain",
    sessionSummary: "Session Summary",
    quizMode: "Quiz Mode",
    progressDashboard: "Progress Dashboard",
    reviewPast: "Review Past Sessions",
    image: "Image",
    offline: "You are offline. Only cached content is available.",
    clearHistory: "Clear History",
    // ...add more as needed
  },
  zh: {
    send: "发送",
    speak: "说话",
    explain: "解释",
    sessionSummary: "会话总结",
    quizMode: "测验模式",
    progressDashboard: "进度仪表板",
    reviewPast: "查看历史",
    image: "图片",
    offline: "您已离线。只能查看缓存内容。",
    clearHistory: "清除历史",
  },
  ms: {
    send: "Hantar",
    speak: "Bercakap",
    explain: "Terangkan",
    sessionSummary: "Ringkasan Sesi",
    quizMode: "Mod Kuiz",
    progressDashboard: "Papan Kemajuan",
    reviewPast: "Semak Sesi Lalu",
    image: "Imej",
    offline: "Anda sedang luar talian. Hanya kandungan cache tersedia.",
    clearHistory: "Padam Sejarah",
  },
  ta: {
    send: "அனுப்பு",
    speak: "பேசு",
    explain: "விளக்கு",
    sessionSummary: "அமர்வு சுருக்கம்",
    quizMode: "வினாடி வினா பயன்முறை",
    progressDashboard: "முன்னேற்றக் கட்டகம்",
    reviewPast: "முந்தைய அமர்வுகளை பார்க்கவும்",
    image: "படம்",
    offline:
      "நீங்கள் ஆஃப்லைனில் உள்ளீர்கள். கேஷ் உள்ளடக்கம் மட்டுமே கிடைக்கும்.",
    clearHistory: "வரலாற்றை அழி",
  },
};

function t(key: string, language: string) {
  return translations[language]?.[key] || translations["en"][key] || key;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  profile,
  onBack,
  persona,
  autoRead,
  language,
  quizMode = false,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [badges, setBadges] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState(profile.difficulty_level);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | boolean | null>(false);
  const [flaggedMsgs, setFlaggedMsgs] = useState<number[]>([]); // Track flagged message indices
  const [flagModalIdx, setFlagModalIdx] = useState<number | null>(null);
  const [flagReason, setFlagReason] = useState<string>("Incorrect");
  const [toast, setToast] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [sessionAnalytics, setSessionAnalytics] = useState<any[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [quizActive, setQuizActive] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizStep, setQuizStep] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<string[]>([]);
  const [quizCorrectAnswers, setQuizCorrectAnswers] = useState<string[]>([]);
  const [quizExplanations, setQuizExplanations] = useState<string[]>([]);
  const [showQuizReview, setShowQuizReview] = useState(false);
  const [quizReviewData, setQuizReviewData] = useState<any>(null);
  const [quizTimer, setQuizTimer] = useState(20);
  const [showFeedbackAnim, setShowFeedbackAnim] = useState<
    null | "correct" | "wrong"
  >(null);
  const [confirmFlag, setConfirmFlag] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showEducatorDashboard, setShowEducatorDashboard] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [xpHistory, setXpHistory] = useState<number[]>([0]);
  const [quizHistory, setQuizHistory] = useState<
    { score: number; total: number }[]
  >([]);
  const [missedQuestions, setMissedQuestions] = useState<
    { question: string; count: number }[]
  >([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showSettings, setShowSettings] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false); // Added state for session summary
  const [streak, setStreak] = useState(0);
  const [lastActiveDate, setLastActiveDate] = useState<string | null>(null);
  const [topicStats, setTopicStats] = useState<{
    [topic: string]: { correct: number; total: number };
  }>({});
  const [miniGameActive, setMiniGameActive] = useState(false);
  const [miniGameCards, setMiniGameCards] = useState<
    { question: string; answer: string }[]
  >([]);
  const [miniGameStep, setMiniGameStep] = useState(0);
  const [miniGameInput, setMiniGameInput] = useState("");
  const [miniGameScore, setMiniGameScore] = useState(0);
  const [miniGameFeedback, setMiniGameFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (showDashboard && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [showDashboard]);

  function speak(text: string, ageGroup: string, msgIdx: number) {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    if (ageGroup === "child") utter.pitch = 1.5;
    if (ageGroup === "senior") utter.rate = 0.8;
    utter.onstart = () => setIsSpeaking(msgIdx);
    utter.onend = () => setIsSpeaking(null);
    utter.onerror = () => setIsSpeaking(null);
    window.speechSynthesis.speak(utter);
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
    setCorrectAnswers((c) => c + 1);
  }

  // Send message to backend
  const sendMessage = async (msg?: string, explain?: boolean) => {
    const messageToSend = msg ?? input;
    if (!messageToSend.trim()) return;
    setLoading(true);

    if (!explain) {
      setMessages((prev) => [...prev, { sender: "user", text: messageToSend }]);
    }

    setInput("");
    setQuestionsAsked((q) => q + (!explain ? 1 : 0));
    try {
      const resp = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          session_id: profile.ageGroup, // use camelCase here
          profile: {
            age_group: profile.ageGroup, // convert to snake_case ONLY here
            subject: profile.subject,
            difficulty_level: difficulty || 1,
          },
          xp,
          explain: explain || false,
          persona, // add this
          language,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text:
              err.detail || "Sorry, there was an error with the AI service.",
          },
        ]);
        setLoading(false);
        return;
      }
      const data = await resp.json();
      setSessionAnalytics((prev) => [...prev, data.analytics || {}]);
      const botMsg: Message = {
        sender: "bot",
        text: data.reply,
        type: explain ? "explanation" : "normal",
      };
      setMessages((prev) => [...prev, botMsg]);
      speak(data.reply, profile.ageGroup, messages.length);
      setXp(data.xp ?? xp);
      setDifficulty(data.difficulty_level ?? difficulty);
      if (data.reply.toLowerCase().includes("correct")) handleCorrectAnswer();
      if (!data.reply.toLowerCase().includes("correct"))
        setIncorrectAnswers((i) => i + 1);

      // Fact-check warning
      if (data.fact_warning) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `⚠️ Fact-Check: ${data.fact_warning}`,
            type: "normal",
          },
        ]);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Network or server error. Please try again." },
      ]);
    }
    setLoading(false);
  };

  // Voice input (Web Speech API)
  const startListening = () => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
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
    const lastUserMsg = messages
      .slice()
      .reverse()
      .find((m) => m.sender === "user");
    if (lastUserMsg) sendMessage(lastUserMsg.text, true);
  };

  const handleFlag = (idx: number, reason: string) => {
    setFlaggedMsgs((prev) => [...prev, idx]);
    // Optionally send to backend:
    // fetch('http://localhost:8000/flag', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ message: messages[idx].text, reason })
    // });
  };

  const handleConfirmFlag = async () => {
    if (flagModalIdx === null) return;
    const msgToFlag = messages[flagModalIdx];
    try {
      await fetch("http://localhost:8000/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msgToFlag.text,
          reason: flagReason,
          sender: msgToFlag.sender,
          session_id: profile.ageGroup,
        }),
      });
      setToast("Message flagged successfully.");
    } catch (e) {
      setToast("Error flagging message. Please try again.");
    }
    setFlagModalIdx(null);
    setFlagReason("Incorrect");
    setConfirmFlag(false);
    setToastOpen(true); // Show toast after flagging
  };

  const handleToastClose = () => {
    setToastOpen(false);
  };

  const flagReasons = ["Incorrect", "Confusing", "Inappropriate", "Other"];

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      e.target.value = ""; // Reset input so same file can be selected again
    }
  };

  // Send image to backend
  const sendImage = async () => {
    if (!imageFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("session_id", profile.ageGroup);
    formData.append(
      "profile",
      JSON.stringify({
        age_group: profile.ageGroup,
        subject: profile.subject,
        difficulty_level: difficulty || 1,
      })
    );
    formData.append("xp", xp.toString());
    formData.append("persona", persona);

    try {
      const resp = await fetch("http://localhost:8000/image", {
        method: "POST",
        body: formData,
      });
      if (!resp.ok) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Sorry, there was an error processing the image.",
          },
        ]);
        setLoading(false);
        return;
      }
      const data = await resp.json();
      setMessages((prev) => [
        ...prev,
        { sender: "user", text: "[Image uploaded]" },
        { sender: "bot", text: data.reply },
      ]);
      speak(data.reply, profile.ageGroup, messages.length);
      setXp(data.xp ?? xp);
      setDifficulty(data.difficulty_level ?? difficulty);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Network or server error. Please try again." },
      ]);
    }
    setLoading(false);
    setImagePreview(null);
    setImageFile(null);
  };

  const startQuiz = async () => {
    setLoading(true);
    if (isOffline) {
      const cached = localStorage.getItem("prefetched_quiz");
      if (cached) {
        setQuizQuestions(JSON.parse(cached));
        setQuizAnswers([]);
        setQuizFeedback([]);
        setQuizCorrectAnswers([]);
        setQuizExplanations([]);
        setQuizStep(0);
        setQuizScore(0);
        setQuizActive(true);
        setLoading(false);
        return;
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "No cached quiz available for offline mode." },
        ]);
        setLoading(false);
        return;
      }
    }
    const resp = await fetch("http://localhost:8000/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: {
          age_group: profile.ageGroup,
          subject: profile.subject,
          difficulty_level: difficulty || 1,
        },
      }),
    });
    const data = await resp.json();
    setQuizQuestions(data.questions);
    setQuizAnswers([]);
    setQuizFeedback([]);
    setQuizCorrectAnswers([]);
    setQuizExplanations([]);
    setQuizStep(0);
    setQuizScore(0);
    setQuizActive(true);
    setLoading(false);
  };

  const submitQuizAnswer = async (answer: string) => {
    setQuizAnswers((prev) => [...prev, answer]);
    setLoading(true);
    const resp = await fetch("http://localhost:8000/quiz/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: quizQuestions[quizStep].question,
        answer,
        profile: {
          age_group: profile.ageGroup,
          subject: profile.subject,
          difficulty_level: difficulty || 1,
        },
      }),
    });
    const data = await resp.json();
    setQuizFeedback((prev) => [...prev, data.feedback]);
    setQuizCorrectAnswers((prev) => [...prev, data.correctAnswer]);
    setQuizExplanations((prev) => [...prev, data.explanation]);
    if (data.correct) setQuizScore((s) => s + 1);
    setShowFeedbackAnim(data.correct ? "correct" : "wrong");
    setTimeout(() => setShowFeedbackAnim(null), 1000);
    setMessages((prev) => [...prev, { sender: "bot", text: data.feedback }]);
    // Update missed questions if answer is incorrect
    if (!data.correct) updateMissedQuestions(quizQuestions[quizStep].question);
    const topic = profile.subject;
    setTopicStats((prev) => ({
      ...prev,
      [topic]: {
        correct: (prev[topic]?.correct || 0) + (data.correct ? 1 : 0),
        total: (prev[topic]?.total || 0) + 1,
      },
    }));
    setQuizStep((s) => s + 1);
    setLoading(false);
    if (quizStep + 1 >= quizQuestions.length) {
      setQuizActive(false);
      setShowQuizReview(true);
      setQuizReviewData({
        questions: quizQuestions,
        userAnswers: [...quizAnswers, answer],
        feedback: [...quizFeedback, data.feedback],
        correctAnswers: [...quizCorrectAnswers, data.correctAnswer],
        explanations: [...quizExplanations, data.explanation],
      });
    }
  };

  // Timer effect
  useEffect(() => {
    if (!quizActive) return;
    setQuizTimer(20);
    const interval = setInterval(() => {
      setQuizTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          submitQuizAnswer(""); // Auto-submit blank
          return 20;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [quizActive, quizStep]);

  useEffect(() => {
    if (questionsAsked > 0 && questionsAsked % SUMMARY_INTERVAL === 0) {
      setShowSummary(true);
    }
  }, [questionsAsked]);

  useEffect(() => {
    if (!autoRead) return;
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender === "bot") {
      speak(lastMsg.text, profile.ageGroup, messages.length - 1);
    }
    // eslint-disable-next-line
  }, [messages, autoRead]);

  // Track XP history
  useEffect(() => {
    setXpHistory((prev) => [...prev, xp]);
    // eslint-disable-next-line
  }, [xp]);

  // Track quiz history
  useEffect(() => {
    if (showQuizReview && quizReviewData) {
      setQuizHistory((prev) => [
        ...prev,
        {
          score: quizReviewData.userAnswers.filter(
            (ans: string, i: number) =>
              ans &&
              quizReviewData.correctAnswers[i] &&
              ans.trim().toLowerCase() ===
                quizReviewData.correctAnswers[i].trim().toLowerCase()
          ).length,
          total: quizReviewData.questions.length,
        },
      ]);
    }
    // eslint-disable-next-line
  }, [showQuizReview, quizReviewData]);

  // Add a unique key for localStorage (per user/session if needed)
  const STORAGE_KEY = "studywithme_history";

  // Load history on mount
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const { messages, quizHistory } = JSON.parse(cached);
      setMessages(messages || []);
      setQuizHistory(quizHistory || []);
    }
    // eslint-disable-next-line
  }, []);

  // Save history on relevant changes
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        messages,
        quizHistory,
      })
    );
  }, [messages, quizHistory]);

  const flaggedCount = flaggedMsgs ? flaggedMsgs.length : 0;

  const updateMissedQuestions = (question: string) => {
    setMissedQuestions((prev) => {
      const idx = prev.findIndex((q) => q.question === question);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].count += 1;
        return updated;
      }
      return [...prev, { question, count: 1 }];
    });
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSessionSummary = () => setShowSessionSummary(true);

  // Load streak from localStorage on mount
  useEffect(() => {
    const streakData = localStorage.getItem("studywithme_streak");
    if (streakData) {
      const { streak, lastActiveDate } = JSON.parse(streakData);
      setStreak(streak);
      setLastActiveDate(lastActiveDate);
    }
  }, []);

  // Update streak on activity (e.g. when a message is sent)
  useEffect(() => {
    if (messages.length === 0) return;
    const today = dayjs().format("YYYY-MM-DD");
    if (lastActiveDate === today) return;
    if (
      lastActiveDate &&
      dayjs(today).diff(dayjs(lastActiveDate), "day") === 1
    ) {
      setStreak((s) => s + 1);
      setLastActiveDate(today);
      localStorage.setItem(
        "studywithme_streak",
        JSON.stringify({ streak: streak + 1, lastActiveDate: today })
      );
    } else if (lastActiveDate !== today) {
      setStreak(1);
      setLastActiveDate(today);
      localStorage.setItem(
        "studywithme_streak",
        JSON.stringify({ streak: 1, lastActiveDate: today })
      );
    }
    // eslint-disable-next-line
  }, [messages]);

  const startMiniGame = () => {
    // Example: 5 random math flashcards
    const cards = [
      { question: "6 + 7", answer: "13" },
      { question: "9 x 2", answer: "18" },
      { question: "15 - 4", answer: "11" },
      { question: "8 / 2", answer: "4" },
      { question: "5 x 5", answer: "25" },
    ];
    setMiniGameCards(cards.sort(() => Math.random() - 0.5));
    setMiniGameStep(0);
    setMiniGameInput("");
    setMiniGameScore(0);
    setMiniGameFeedback(null);
    setMiniGameActive(true);

    setQuizActive(true);
    setQuizTimer(20);
  };

  const submitMiniGame = () => {
    const correct = miniGameInput.trim() === miniGameCards[miniGameStep].answer;
    setMiniGameFeedback(
      correct
        ? "✅ Correct!"
        : `❌ Incorrect. Answer: ${miniGameCards[miniGameStep].answer}`
    );
    if (correct) setMiniGameScore((s) => s + 1);
    setTimeout(() => {
      setMiniGameStep((s) => s + 1);
      setMiniGameInput("");
      setMiniGameFeedback(null);
    }, 1000);
  };

  // Prefetch quiz questions on mount
  useEffect(() => {
    async function prefetchQuiz() {
      try {
        const resp = await fetch("http://localhost:8000/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile: {
              age_group: profile.ageGroup,
              subject: profile.subject,
              difficulty_level: profile.difficulty_level,
            },
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          localStorage.setItem(
            "prefetched_quiz",
            JSON.stringify(data.questions)
          );
        }
      } catch (e) {
        // Ignore errors (offline)
      }
    }
    prefetchQuiz();
    // eslint-disable-next-line
  }, [profile.ageGroup, profile.subject, profile.difficulty_level]);

  const exportCSV = () => {
    let csv = "Quiz #,Score\n";
    quizHistory.forEach((q, i) => {
      csv += `${i + 1},${q.score}/${q.total}\n`;
    });
    csv += "\nTopic,Correct,Total\n";
    Object.entries(topicStats).forEach(([topic, stats]) => {
      csv += `${topic},${stats.correct},${stats.total}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "studywithme_progress.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("StudyWithMe Progress Report", 14, 18);

    // Quiz History Table
    doc.setFontSize(14);
    doc.text("Quiz History", 14, 30);
    (doc as any).autoTable({
      startY: 34,
      head: [["Quiz #", "Score"]],
      body: quizHistory.map((q, i) => [`${i + 1}`, `${q.score}/${q.total}`]),
    });

    // Topic Mastery Table
    const topicStartY = (doc as any).lastAutoTable.finalY + 10;
    doc.text("Topic Mastery", 14, topicStartY);
    (doc as any).autoTable({
      startY: topicStartY + 4,
      head: [["Topic", "Correct", "Total"]],
      body: Object.entries(topicStats).map(([topic, stats]) => [
        topic,
        stats.correct,
        stats.total,
      ]),
    });

    doc.save("studywithme_progress.pdf");
  };

  useEffect(() => {
    // Quiz will only start when user clicks the "Start Quiz" button
    // Reset any active quizzes when leaving quiz mode
    if (!quizMode) {
      setQuizActive(false);
      setMiniGameActive(false);
    }
  }, [quizMode]);

  return (
    <>
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        marginBottom: "24px",
        marginTop: "16px"
      }}>
        <button
          style={{
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontWeight: 700,
            cursor: "pointer",
          }}
          onClick={() => setShowEducatorDashboard(true)}
        >
          Educator Dashboard
        </button>
      </div>
      <button
        type="button"
        onClick={onBack}
        style={{
          position: "absolute",
          left: 24,
          top: 24,
          background: "none",
          border: "none",
          color: "#1565c0",
          fontWeight: 700,
          fontSize: "1rem",
          cursor: "pointer",
        }}
        aria-label="Back to onboarding"
      >
        ← Back
      </button>
      <div
        className="chat-screen"
        style={{ position: "relative", minHeight: "100vh" }}
      >
        <div
          style={{
            maxWidth: 700,
            margin: "32px auto",
            padding: 24,
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <h2 style={{ margin: 0 }}>
              {" "}
              {quizMode ? "Quiz Mode" : "AI Tutor Chat"}
            </h2>

            <button
              style={{
                background: "#616161",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 18px",
                fontWeight: 700,
                cursor: "pointer",
              }}
              onClick={() => setShowHistory(true)}
            >
              Review Past Sessions
            </button>

            {/* <div>
              <h1 style={{ margin: 0, fontSize: "2.2em", color: "#1976d2" }}>
                StudyWithMe
              </h1>
              <div
                style={{
                  fontStyle: "italic",
                  color: "#1976d2",
                  fontSize: "1.1em",
                }}
              >
                Perfect your knowledge, one review at a time.
              </div>
            </div> */}
            {/* <button
              onClick={() => setShowSettings(true)}
              style={{
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 48,
                height: 48,
                fontSize: "1.7em",
                boxShadow: "0 2px 8px rgba(25, 118, 210, 0.15)",
                cursor: "pointer",
              }}
              aria-label="Open settings"
              title="Settings & Profile"
            >
              ⚙️
            </button> */}
          </div>

          {/* XP/Level Bar */}
          {quizMode ? (
            <>
              <div style={{ margin: "16px 0 24px 0", textAlign: "center" }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "1.2em",
                    color: "#1976d2",
                  }}
                >
                  Level {level} — {xp} XP
                </span>
                {/* <div
              style={{
                width: "80%",
                margin: "8px auto 0 auto",
                background: "#eee",
                borderRadius: 8,
                height: 10,
                position: "relative",
              }}
            > */}
                <div
                  style={{
                    width: `${(xp / LEVEL_UP_XP) * 100}%`,
                    background: "#1976d2",
                    height: "100%",
                    borderRadius: 8,
                    transition: "width 0.3s",
                  }}
                />
                {/* </div> */}
              </div>
              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  justifyContent: "center",
                  marginBottom: 18,
                }}
              >
                {/* <button
              style={{
                background: "#43a047",
                color: "#fff",
                borderRadius: 8,
                padding: "8px 18px",
                fontWeight: 700,
              }}
              onClick={handleSessionSummary}
            >
              Session Summary
            </button> */}
                {/* <button
              style={{
                background: "#8e24aa",
                color: "#fff",
                padding: "8px 18px",
                fontWeight: 700,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
              onClick={startQuiz}
            >
              Quiz Mode
            </button> */}
                <button
                  style={{
                    background: "#1976d2",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 18px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  onClick={() => setShowDashboard(true)}
                >
                  Progress Dashboard
                </button>

                <div
                  tabIndex={0}
                  role="button"
                  aria-label="Start Mini-Game"
                  onClick={startMiniGame}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && startMiniGame()
                  }
                  style={{
                    background: "#8e24aa",
                    color: "#fff",
                    padding: "8px 18px",
                    fontWeight: 700,
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Start Quiz
                </div>

                {/* Add more as needed */}
              </div>{" "}
            </>
          ) : (
            <>
              {/* Chat Input Row */}
              {/* Chat Input Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 24,
                }}
              >
                <div style={{ position: "relative", flex: 1 }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      display: "flex",
                      gap: "8px",
                      zIndex: 10,
                    }}
                  >
                    <span
                      onClick={() =>
                        document.getElementById("image-upload")?.click()
                      }
                      style={{
                        cursor: loading ? "not-allowed" : "pointer",
                        color: "#666",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <FaImage />
                    </span>
                    <span
                      onClick={listening ? stopListening : startListening}
                      style={{
                        cursor: loading ? "not-allowed" : "pointer",
                        color: listening ? "#d32f2f" : "#666",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {listening ? "🛑" : <MdKeyboardVoice />}
                    </span>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleImageChange}
                      aria-label="Upload image"
                    />
                  </div>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question..."
                    aria-label="Chat input"
                    style={{
                      width: "100%",
                      fontSize: "1.1em",
                      borderRadius: 8,
                      padding: "12px",
                      paddingLeft: "70px", // Make space for the icons
                      border: "1.5px solid #bbb",
                      boxSizing: "border-box",
                    }}
                    disabled={isOffline || loading}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                </div>

                <button
                  onClick={() => sendMessage()}
                  aria-label="Send"
                  disabled={isOffline || loading || !input.trim()}
                  style={{
                    background: "#1976d2",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "8px 18px",
                    fontWeight: 700,
                    border: "none",
                  }}
                >
                  Send
                </button>

                {imagePreview && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {/* ...existing image preview code... */}
                  </div>
                )}
                <button
                  onClick={handleExplain}
                  aria-label="Explain last answer"
                  disabled={
                    loading || !messages.some((m) => m.sender === "user")
                  }
                  style={{
                    background: "#fbc02d",
                    color: "#222",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontWeight: 700,
                    border: "none",
                  }}
                >
                  Explain
                </button>
              </div>
            </>
          )}

          {/* Chat messages and other content go here */}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", marginBottom: 8 }}
            >
              {msg.sender === "user" ? (
                <span
                  style={{
                    fontSize: "2em",
                    marginRight: 8,
                    display: "inline-block",
                    width: 36,
                    height: 36,
                    textAlign: "center",
                    lineHeight: "36px",
                  }}
                  aria-label="User avatar"
                >
                  {userAvatar}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: "2em",
                    marginRight: 8,
                    display: "inline-block",
                    width: 36,
                    height: 36,
                    textAlign: "center",
                    lineHeight: "36px",
                  }}
                  aria-label="AI Tutor"
                >
                  🤖
                </span>
              )}
              <div
                style={{
                  background: msg.sender === "user" ? "#e3f2fd" : "#f3e5f5",
                  color: "#222",
                  borderRadius: 12,
                  padding: "10px 16px",
                  maxWidth: "70%",
                  position: "relative",
                }}
              >
                {msg.text}
                {/* Only show flag for bot messages */}
                {msg.sender === "bot" && (
                  <button
                    onClick={() => setConfirmFlag(true)}
                    aria-label="Flag message"
                    style={{
                      marginLeft: 8,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.2em",
                    }}
                  >
                    🚩
                  </button>
                )}
              </div>
              {msg.sender === "bot" && (
                <button
                  onClick={() => {
                    setIsSpeaking(true);
                    const utter = new window.SpeechSynthesisUtterance(msg.text);
                    utter.onend = () => setIsSpeaking(false);
                    window.speechSynthesis.speak(utter);
                  }}
                  aria-label="Speak message"
                  disabled={!!isSpeaking}
                  style={{
                    marginLeft: 8,
                    background: "#eee",
                    border: "none",
                    borderRadius: 6,
                    cursor: isSpeaking ? "not-allowed" : "pointer",
                    fontSize: "1em",
                  }}
                >
                  {isSpeaking ? "🔊..." : "🔊"}
                </button>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ color: "#888", margin: "8px 0" }}>
              AI is typing...
            </div>
          )}

          {/* Mini-Game: Flashcard Challenge */}
          {quizMode && miniGameActive && (
            <div
              style={{
                background: "#fffde7",
                borderRadius: 12,
                padding: 24,
                margin: "1.5rem 0",
                textAlign: "center",
              }}
            >
              <h3>Flashcard Challenge</h3>
              {quizTimer < 6 && (
                <div
                  style={{
                    fontSize: "1.2em",
                    fontWeight: "bold",
                    color: "#d32f2f",
                    marginBottom: 10,
                  }}
                >
                  Time left: {quizTimer}s
                </div>
              )}
              {miniGameStep < miniGameCards.length ? (
                <>
                  <div style={{ fontSize: "1.3em", marginBottom: 12 }}>
                    {miniGameCards[miniGameStep].question}
                  </div>
                  <input
                    type="text"
                    value={miniGameInput}
                    onChange={(e) => setMiniGameInput(e.target.value)}
                    aria-label="Mini-game answer"
                    style={{
                      fontSize: "1.1em",
                      borderRadius: 8,
                      padding: 8,
                      marginRight: 8,
                    }}
                    disabled={!!miniGameFeedback}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !miniGameFeedback && submitMiniGame()
                    }
                  />
                  <button
                    onClick={submitMiniGame}
                    disabled={!miniGameInput.trim() || !!miniGameFeedback}
                    style={{
                      background: "#1976d2",
                      color: "#fff",
                      borderRadius: 8,
                      padding: "6px 18px",
                      fontWeight: 700,
                    }}
                  >
                    Submit
                  </button>
                  {miniGameFeedback && (
                    <div style={{ marginTop: 12, fontWeight: 600 }}>
                      {miniGameFeedback}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ fontSize: "1.2em", marginBottom: 12 }}>
                    Game Over! Score: {miniGameScore} / {miniGameCards.length}
                  </div>
                  <button
                    onClick={() => setMiniGameActive(false)}
                    style={{
                      background: "#1976d2",
                      color: "#fff",
                      borderRadius: 8,
                      padding: "6px 18px",
                      fontWeight: 700,
                    }}
                  >
                    Close
                  </button>
                  <div style={{ marginTop: 12 }}>
                    <button
                      onClick={exportCSV}
                      style={{
                        padding: "8px 20px",
                        borderRadius: 8,
                        background: "#43a047",
                        color: "#fff",
                        border: "none",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      aria-label="Export progress as CSV"
                    >
                      Export CSV
                    </button>

                    <button
                      onClick={exportPDF}
                      style={{
                        padding: "8px 20px",
                        borderRadius: 8,
                        background: "#74c365",
                        color: "#fff",
                        border: "none",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      aria-label="Export progress as PDF"
                    >
                      Export PDF
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {flagModalIdx !== null && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.3)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 24,
                minWidth: 260,
              }}
            >
              <h4>Flag this answer</h4>
              <div>
                <label>
                  Reason:{" "}
                  <select
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    style={{ fontSize: "1em", marginLeft: 8 }}
                  >
                    {flagReasons.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                <button
                  onClick={() => {
                    handleFlag(flagModalIdx!, flagReason);
                    setFlagModalIdx(null);
                    setToast("Thank you for your feedback!");
                  }}
                  style={{
                    background: "#fbc02d",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 18px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Submit
                </button>
                <button
                  onClick={() => setFlagModalIdx(null)}
                  style={{
                    background: "#eee",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 18px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {confirmFlag && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.3)",
              zIndex: 3000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 24,
                minWidth: 260,
              }}
            >
              <div style={{ marginBottom: 16 }}>
                Are you sure you want to flag this message?
              </div>
              <button onClick={handleConfirmFlag} style={{ marginRight: 8 }}>
                Yes
              </button>
              <button onClick={() => setConfirmFlag(false)}>No</button>
            </div>
          </div>
        )}
        {toast && (
          <div
            style={{
              position: "fixed",
              bottom: 32,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#333",
              color: "#fff",
              borderRadius: 8,
              padding: "10px 24px",
              fontWeight: 600,
              zIndex: 2000,
            }}
          >
            {toast}
            <button
              onClick={() => setToast(null)}
              style={{
                marginLeft: 16,
                background: "none",
                border: "none",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        {showSummary && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 32,
                minWidth: 320,
                boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                color: "#222",
              }}
            >
              <h2 id="session-summary-title" style={{ marginTop: 0 }}>
                {t("sessionSummary", language)}
              </h2>
              <div style={{ marginBottom: 12 }}>
                <strong>Questions Asked:</strong> {questionsAsked}
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Correct Answers:</strong> {correctAnswers}
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>XP Earned:</strong> {xp}
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Difficulty Progression:</strong>
                <div style={{ marginTop: 4 }}>
                  {sessionAnalytics.map((a, i) => (
                    <span
                      key={i}
                      style={{
                        display: "inline-block",
                        background: "#e3f2fd",
                        color: "#1976d2",
                        borderRadius: 6,
                        padding: "2px 8px",
                        marginRight: 4,
                        fontWeight: 600,
                      }}
                    >
                      {a.difficulty_level !== undefined
                        ? `Q${i + 1}: ${a.difficulty_level}`
                        : ""}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Incorrect Answers:</strong> {incorrectAnswers}
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Flagged Answers:</strong> {flaggedCount}
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Average Difficulty:</strong>{" "}
                {sessionAnalytics.length > 0
                  ? (
                      sessionAnalytics.reduce(
                        (sum, a) => sum + (a.difficulty_level || 0),
                        0
                      ) / sessionAnalytics.length
                    ).toFixed(2)
                  : "N/A"}
              </div>
              <button
                onClick={() => setShowSummary(false)}
                style={{
                  marginTop: 16,
                  padding: "8px 20px",
                  borderRadius: 8,
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
        {quizMode &&
          (incorrectAnswers > 2 ? (
            <div style={{ color: "#d32f2f", marginTop: 8 }}>
              Suggestion: Review the last few questions or try easier problems.
            </div>
          ) : (
            <div style={{ color: "#388e3c", marginTop: 8 }}>
              Great job! Ready for harder questions?
            </div>
          ))}
        {showQuizReview && quizReviewData && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 32,
                minWidth: 320,
                boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                color: "#222",
              }}
            >
              <h2>Quiz Review</h2>
              <h3>
                Score: {quizScore} / {quizQuestions.length}
              </h3>
              <table style={{ width: "100%", marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th scope="col" style={{ textAlign: "left" }}>
                      Question
                    </th>
                    <th scope="col" style={{ textAlign: "left" }}>
                      Your Answer
                    </th>
                    <th scope="col" style={{ textAlign: "left" }}>
                      Correct Answer
                    </th>
                    <th scope="col" style={{ textAlign: "left" }}>
                      Result
                    </th>
                    <th scope="col" style={{ textAlign: "left" }}>
                      Explanation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quizReviewData.questions.map((q: any, i: number) => (
                    <tr key={i}>
                      <td>{q.question}</td>
                      <td>{quizReviewData.userAnswers[i]}</td>
                      <td>{quizReviewData.correctAnswers[i]}</td>
                      <td>
                        {quizReviewData.feedback[i].includes("Correct")
                          ? "✅"
                          : "❌"}
                      </td>
                      <td>{quizReviewData.explanations[i]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={() => setShowQuizReview(false)}
                style={{
                  marginTop: 16,
                  padding: "8px 20px",
                  borderRadius: 8,
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
        {showDashboard && (
          <StudentDashboard
            onClose={() => setShowDashboard(false)}
            profile={profile}
          />
          // <div

          //   role="dialog"
          //   aria-modal="true"
          //   aria-labelledby="dashboard-title"
          //   style={{
          //     position: "fixed",
          //     top: 0,
          //     left: 0,
          //     right: 0,
          //     bottom: 0,
          //     background: "rgba(0,0,0,0.4)",
          //     zIndex: 2000,
          //     display: "flex",
          //     alignItems: "center",
          //     justifyContent: "center",
          //   }}
          // >
          //   <div
          //     style={{
          //       background: "#fff",
          //       borderRadius: 16,
          //       padding: 32,
          //       minWidth: 340,
          //       boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          //     }}
          //   >
          //     <h2 id="dashboard-title" style={{ marginTop: 0 }}>
          //       Progress Dashboard
          //     </h2>
          //     {/* XP Progress */}
          //     <div style={{ marginBottom: 18 }}>
          //       <strong>XP Progress:</strong>
          //       <div style={{ marginTop: 6, marginBottom: 8 }}>
          //         <svg width="220" height="22">
          //           <rect
          //             x="0"
          //             y="6"
          //             width="200"
          //             height="10"
          //             rx="5"
          //             fill="#eee"
          //           />
          //           <rect
          //             x="0"
          //             y="6"
          //             width={(xp / LEVEL_UP_XP) * 200}
          //             height="10"
          //             rx="5"
          //             fill="#1976d2"
          //           />
          //         </svg>
          //         <span style={{ marginLeft: 12, fontWeight: 600 }}>
          //           {xp} / {LEVEL_UP_XP} XP
          //         </span>
          //       </div>
          //       <div>
          //         Level: <b>{level}</b>
          //       </div>
          //     </div>
          //     {/* XP Bar Chart */}
          //     <div style={{ marginBottom: 18 }}>
          //       <strong>XP per Session:</strong>
          //       <svg width={xpHistory.length * 24} height="60">
          //         {xpHistory.map((val, i) => (
          //           <rect
          //             key={i}
          //             x={i * 24}
          //             y={60 - (val / Math.max(...xpHistory, 1)) * 50}
          //             width={18}
          //             height={(val / Math.max(...xpHistory, 1)) * 50}
          //             fill="#1976d2"
          //             rx={4}
          //           />
          //         ))}
          //         {xpHistory.map((val, i) => (
          //           <text
          //             key={i}
          //             x={i * 24 + 9}
          //             y={58}
          //             textAnchor="middle"
          //             fontSize="10"
          //             fill="#333"
          //           >
          //             {val}
          //           </text>
          //         ))}
          //       </svg>
          //     </div>
          //     {/* Accuracy Pie */}
          //     <div style={{ marginBottom: 18 }}>
          //       <strong>Accuracy:</strong>
          //       <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          //         <svg width="54" height="54" viewBox="0 0 36 36">
          //           <circle
          //             cx="18"
          //             cy="18"
          //             r="16"
          //             fill="#eee"
          //             stroke="#eee"
          //             strokeWidth="4"
          //           />
          //           <circle
          //             cx="18"
          //             cy="18"
          //             r="16"
          //             fill="none"
          //             stroke="#43a047"
          //             strokeWidth="4"
          //             strokeDasharray={`${Math.round(
          //               (correctAnswers / Math.max(1, questionsAsked)) * 100
          //             )},100`}
          //             strokeDashoffset="25"
          //             transform="rotate(-90 18 18)"
          //           />
          //           <text
          //             x="18"
          //             y="22"
          //             textAnchor="middle"
          //             fontSize="12"
          //             fill="#333"
          //             fontWeight="bold"
          //           >
          //             {questionsAsked > 0
          //               ? Math.round((correctAnswers / questionsAsked) * 100)
          //               : 0}
          //             %
          //           </text>
          //         </svg>
          //         <div>
          //           <div>
          //             Correct: <b>{correctAnswers}</b>
          //           </div>
          //           <div>
          //             Incorrect: <b>{incorrectAnswers}</b>
          //           </div>
          //           <div>
          //             Total: <b>{questionsAsked}</b>
          //           </div>
          //         </div>
          //       </div>
          //     </div>
          //     {/* Subject */}
          //     <div style={{ marginBottom: 18 }}>
          //       <strong>Subject:</strong>{" "}
          //       {profile.subject.charAt(0).toUpperCase() +
          //         profile.subject.slice(1)}
          //     </div>
          //     {/* Quiz History Table */}
          //     <div style={{ marginBottom: 18 }}>
          //       <strong>Quiz History:</strong>
          //       <table
          //         style={{ width: "100%", fontSize: "0.97em", marginTop: 4 }}
          //       >
          //         <thead>
          //           <tr>
          //             <th>Quiz #</th>
          //             <th>Score</th>
          //           </tr>
          //         </thead>
          //         <tbody>
          //           {quizHistory.map((q, i) => (
          //             <tr key={i}>
          //               <td>{i + 1}</td>
          //               <td>
          //                 {q.score} / {q.total}
          //               </td>
          //             </tr>
          //           ))}
          //         </tbody>
          //       </table>
          //     </div>
          //     {/* Most Missed Questions */}
          //     <div style={{ marginBottom: 18 }}>
          //       <strong>Most Missed Questions:</strong>
          //       <ul style={{ margin: 0, paddingLeft: 18 }}>
          //         {missedQuestions.length === 0 ? (
          //           <li>None yet!</li>
          //         ) : (
          //           missedQuestions
          //             .sort((a, b) => b.count - a.count)
          //             .slice(0, 5)
          //             .map((q, i) => (
          //               <li key={i}>
          //                 <b>{q.count}×</b> {q.question}
          //               </li>
          //             ))
          //         )}
          //       </ul>
          //     </div>
          //     {/* Badges */}
          //     <div style={{ marginBottom: 18 }}>
          //       <strong>Badges:</strong>
          //       <div
          //         style={{
          //           display: "flex",
          //           gap: 8,
          //           flexWrap: "wrap",
          //           marginTop: 4,
          //         }}
          //       >
          //         {badges.length === 0 ? (
          //           <span>No badges yet.</span>
          //         ) : (
          //           badges.map((badge, i) => (
          //             <span
          //               key={i}
          //               style={{
          //                 background: "#fbc02d",
          //                 color: "#333",
          //                 borderRadius: 12,
          //                 padding: "2px 10px",
          //                 fontSize: "0.93em",
          //                 fontWeight: 600,
          //               }}
          //             >
          //               🏅 {badge}
          //             </span>
          //           ))
          //         )}
          //       </div>
          //     </div>
          //     <div style={{ marginBottom: 18 }}>
          //       <strong>Current Streak:</strong>
          //       <span
          //         style={{ color: "#fbc02d", fontWeight: 700, marginLeft: 8 }}
          //       >
          //         {streak} day{streak === 1 ? "" : "s"}
          //       </span>
          //       {streak >= 7 && (
          //         <span
          //           title="7-day streak badge"
          //           style={{ marginLeft: 8, fontSize: "1.3em" }}
          //         >
          //           🔥
          //         </span>
          //       )}
          //       {streak >= 14 && (
          //         <span
          //           title="14-day streak badge"
          //           style={{ marginLeft: 4, fontSize: "1.3em" }}
          //         >
          //           🏅
          //         </span>
          //       )}
          //       {streak >= 30 && (
          //         <span
          //           title="30-day streak badge"
          //           style={{ marginLeft: 4, fontSize: "1.3em" }}
          //         >
          //           🌟
          //         </span>
          //       )}
          //     </div>
          //     <div style={{ marginBottom: 18 }}>
          //       <strong>Topic Mastery:</strong>
          //       <div style={{ marginTop: 8 }}>
          //         {Object.keys(topicStats).length === 0 ? (
          //           <div>No data yet.</div>
          //           ) : (
          //             Object.entries(topicStats).map(([topic, stats]) => {
          //               const percent =
          //                 stats.total > 0
          //                   ? Math.round((stats.correct / stats.total) * 100)
          //                   : 0;
          //               return (
          //                 <div key={topic} style={{ marginBottom: 10 }}>
          //                   <div style={{ fontWeight: 600, marginBottom: 2 }}>
          //                     {topic.charAt(0).toUpperCase() + topic.slice(1)}:{" "}
          //                     {percent}%
          //                   </div>
          //                   <div
          //                     style={{
          //                       background: "#eee",
          //                       borderRadius: 8,
          //                       height: 16,
          //                       width: 220,
          //                       position: "relative",
          //                       overflow: "hidden",
          //                     }}
          //                   >
          //                     <div
          //                       style={{
          //                         width: `${percent}%`,
          //                         background:
          //                           percent >= 80
          //                             ? "#43a047"
          //                             : percent >= 50
          //                             ? "#fbc02d"
          //                             : "#d32f2f",
          //                         height: "100%",
          //                         borderRadius: 8,
          //                         transition: "width 0.4s",
          //                       }}
          //                     />
          //                     <span
          //                       style={{
          //                         position: "absolute",
          //                         left: 8,
          //                         top: 0,
          //                         fontSize: "0.95em",
          //                         color: "#222",
          //                       }}
          //                     >
          //                       {stats.correct}/{stats.total}
          //                     </span>
          //                   </div>
          //                 </div>
          //               );
          //             })
          //           )}
          //         </div>
          //       </div>
          //       <button
          //         ref={closeBtnRef}
          //         onClick={() => setShowDashboard(false)}
          //         style={{
          //           marginTop: 16,
          //           padding: "8px 20px",
          //           borderRadius: 8,
          //           background: "#1976d2",
          //           color: "#fff",
          //           border: "none",
          //           fontWeight: 700,
          //           cursor: "pointer",
          //         }}
          //         aria-label="Close dashboard"
          //       >
          //         Close
          //       </button>
          //     </div>
          //   </div>
        )}
        {showHistory && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 2200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 32,
                minWidth: 340,
                boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                color: "#222",
                maxWidth: 600,
                maxHeight: "80vh",
                overflowY: "auto",
              }}
            >
              <h2 style={{ marginTop: 0 }}>Past Sessions</h2>
              <div style={{ marginBottom: 18 }}>
                <strong>Chat History:</strong>
                <div
                  style={{
                    maxHeight: 200,
                    overflowY: "auto",
                    background: "#f7f7f7",
                    borderRadius: 8,
                    padding: 8,
                  }}
                >
                  {messages.length === 0 ? (
                    <div>No chat history.</div>
                  ) : (
                    messages.map((msg, i) => (
                      <div
                        key={i}
                        style={{
                          color: msg.sender === "user" ? "#1976d2" : "#222",
                          marginBottom: 4,
                          fontWeight: msg.sender === "user" ? 600 : 400,
                        }}
                      >
                        <span>{msg.sender === "user" ? "You: " : "AI: "}</span>
                        <span>{msg.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <strong>Quiz History:</strong>
                <table
                  style={{ width: "100%", fontSize: "0.97em", marginTop: 4 }}
                >
                  <thead>
                    <tr>
                      <th>Quiz #</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizHistory.length === 0 ? (
                      <tr>
                        <td colSpan={2}>No quiz history.</td>
                      </tr>
                    ) : (
                      quizHistory.map((q, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>
                            {q.score} / {q.total}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  marginTop: 16,
                  padding: "8px 20px",
                  borderRadius: 8,
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
        {isOffline && (
          <div
            style={{
              background: "#ffeb3b",
              color: "#222",
              padding: "8px 0",
              textAlign: "center",
              fontWeight: 700,
              borderBottom: "2px solid #fbc02d",
            }}
          >
            ⚠️ {t("offline", language)}
          </div>
        )}
        <button
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            setMessages([]);
            setQuizHistory([]);
            setShowHistory(false);
          }}
          style={{
            marginTop: 8,
            marginRight: 12,
            padding: "8px 20px",
            borderRadius: 8,
            background: "#d32f2f",
            color: "#fff",
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {t("clearHistory", language)}
        </button>

        {/* Settings Modal */}
        {showSettings && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 32,
                minWidth: 320,
                boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              }}
            >
              <h2 id="settings-modal-title" style={{ marginTop: 0 }}>
                Settings & Profile
              </h2>
              {/* Place your Settings form/fields here */}
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  marginTop: 16,
                  padding: "8px 20px",
                  borderRadius: 8,
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
        {showSessionSummary && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-summary-title"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 32,
                minWidth: 320,
                boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              }}
            >
              <h2 id="session-summary-title" style={{ marginTop: 0 }}>
                Session Summary
              </h2>
              {/* Place your session summary content here */}
              <button
                onClick={() => setShowSessionSummary(false)}
                style={{
                  marginTop: 16,
                  padding: "8px 20px",
                  borderRadius: 8,
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
        {quizMode && quizActive && (
          <div
            style={{
              fontWeight: 600,
              color: quizTimer < 6 ? "#d32f2f" : "#1976d2",
              marginBottom: 8,
            }}
          >
            Time left: {quizTimer}s
          </div>
        )}
        {showFeedbackAnim === "correct" && (
          <div
            style={{
              fontSize: "2em",
              color: "#43a047",
              textAlign: "center",
              marginTop: 12,
            }}
          >
            ✅
          </div>
        )}
        {showFeedbackAnim === "wrong" && (
          <div
            style={{
              fontSize: "2em",
              color: "#d32f2f",
              textAlign: "center",
              marginTop: 12,
            }}
          >
            ❌
          </div>
        )}
        {toastOpen && (
          <div
            style={{
              position: "fixed",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#323232",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 8,
              zIndex: 4000,
            }}
          >
            Message flagged!
            <button
              onClick={handleToastClose}
              style={{
                marginLeft: 16,
                color: "#fff",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              aria-label="Close notification"
            >
              ✖
            </button>
          </div>
        )}
        {isSpeaking && (
          <button
            onClick={() => {
              window.speechSynthesis.cancel();
              setIsSpeaking(false);
            }}
            aria-label="Stop speaking"
            style={{
              position: "fixed",
              bottom: 100,
              right: 32,
              background: "#d32f2f",
              color: "#fff",
              border: "none",
              borderRadius: 24,
              padding: "12px 18px",
              fontSize: "1.5em",
              zIndex: 3000,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              cursor: "pointer",
            }}
          >
            ⏹️ Stop Speaking
          </button>
        )}
      </div>
      {showEducatorDashboard && (
        <EducatorDashboard onClose={() => setShowEducatorDashboard(false)} />
      )}
    </>
  );
};
