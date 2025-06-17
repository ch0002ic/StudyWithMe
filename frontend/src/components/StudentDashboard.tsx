import React, { useState, useEffect } from 'react';
import { FaTrophy, FaChartLine, FaBook, FaLightbulb, FaCalendarAlt, FaStar } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface StudentDashboardProps {
  onClose: () => void;
  profile: {
    ageGroup: string;
    subject: string;
    difficulty_level: number;
  };
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
}

interface LearningStats {
  totalQuizzes: number;
  averageScore: number;
  streakDays: number;
  totalXP: number;
  topicsMastered: number;
  timeSpent: number;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onClose, profile }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first_quiz',
      title: 'First Steps',
      description: 'Complete your first quiz',
      icon: '🎯',
      unlocked: false,
      progress: 0
    },
    {
      id: 'streak_3',
      title: 'On Fire!',
      description: 'Maintain a 3-day streak',
      icon: '🔥',
      unlocked: false,
      progress: 0
    },
    {
      id: 'master_topic',
      title: 'Topic Master',
      description: 'Master any topic',
      icon: '👑',
      unlocked: false,
      progress: 0
    }
  ]);

  const [stats, setStats] = useState<LearningStats>({
    totalQuizzes: 0,
    averageScore: 0,
    streakDays: 0,
    totalXP: 0,
    topicsMastered: 0,
    timeSpent: 0
  });

  const [recentActivity, setRecentActivity] = useState<Array<{
    type: string;
    description: string;
    timestamp: string;
  }>>([]);

  useEffect(() => {
    // Load data from localStorage
    const loadDashboardData = () => {
      const savedStats = localStorage.getItem('studywithme_stats');
      const savedAchievements = localStorage.getItem('studywithme_achievements');
      const savedActivity = localStorage.getItem('studywithme_activity');

      if (savedStats) setStats(JSON.parse(savedStats));
      if (savedAchievements) setAchievements(JSON.parse(savedAchievements));
      if (savedActivity) setRecentActivity(JSON.parse(savedActivity));
    };

    loadDashboardData();
  }, []);

  const StatCard = ({ icon, title, value, color }: { icon: React.ReactNode; title: string; value: string | number; color: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(80,80,120,0.10)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        border: `2px solid ${color}`
      }}
    >
      <div style={{ color, fontSize: '2rem' }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{value}</div>
      <div style={{ color: '#666', fontSize: '0.9rem' }}>{title}</div>
    </motion.div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: '2rem',
          width: '90%',
          maxWidth: 1000,
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#666'
          }}
          aria-label="Close dashboard"
        >
          ×
        </button>

        <h1 style={{ margin: '0 0 2rem 0', color: '#1976d2' }}>Your Learning Journey</h1>

        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard icon={<FaChartLine />} title="Total XP" value={stats.totalXP} color="#1976d2" />
          <StatCard icon={<FaBook />} title="Quizzes Completed" value={stats.totalQuizzes} color="#43a047" />
          <StatCard icon={<FaCalendarAlt />} title="Day Streak" value={stats.streakDays} color="#fbc02d" />
          <StatCard icon={<FaLightbulb />} title="Topics Mastered" value={stats.topicsMastered} color="#8e24aa" />
        </div>

        {/* Achievements Section */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#1976d2', marginBottom: '1rem' }}>Achievements</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {achievements.map(achievement => (
              <motion.div
                key={achievement.id}
                whileHover={{ scale: 1.02 }}
                style={{
                  background: achievement.unlocked ? '#e3f2fd' : '#f5f5f5',
                  borderRadius: 12,
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  border: `2px solid ${achievement.unlocked ? '#1976d2' : '#e0e0e0'}`
                }}
              >
                <div style={{ fontSize: '2rem' }}>{achievement.icon}</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{achievement.title}</div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>{achievement.description}</div>
                  {!achievement.unlocked && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ height: 4, background: '#e0e0e0', borderRadius: 2 }}>
                        <div
                          style={{
                            width: `${achievement.progress}%`,
                            height: '100%',
                            background: '#1976d2',
                            borderRadius: 2
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 style={{ color: '#1976d2', marginBottom: '1rem' }}>Recent Activity</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{
                  background: '#f5f5f5',
                  borderRadius: 8,
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <FaStar style={{ color: '#fbc02d' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>{activity.description}</div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>{activity.timestamp}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </motion.div>
    </div>
  );
};

export default StudentDashboard; 