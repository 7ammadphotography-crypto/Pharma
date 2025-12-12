import { base44 as realBase44 } from '@base44/sdk'; // Keep reference just in case, or removed if we fully mock.

// Mock User Data
const MOCK_USER = {
  id: 'mock-user-123',
  email: 'student@demo.com',
  full_name: 'Dr. Demo Student',
  role: 'student'
};

// Generic Mock Entity Handler
const createMockEntity = (name) => ({
  filter: async (...args) => {
    console.log(`[MockBase44] Filtering ${name}`, args);
    if (name === 'UserPoints') {
      return [{ total_points: 1250, streak_days: 5, level: 3 }];
    }
    if (name === 'QuizAttempt') {
      return [
        { id: 1, created_date: new Date().toISOString(), is_completed: true, percentage: 85, topic_id: 'cardiology' },
        { id: 2, created_date: new Date(Date.now() - 86400000).toISOString(), is_completed: true, percentage: 90, topic_id: 'neurology' },
        { id: 3, created_date: new Date(Date.now() - 172800000).toISOString(), is_completed: true, percentage: 70, topic_id: 'pharmacology' }
      ];
    }
    return [];
  },
  get: async (id) => {
    console.log(`[MockBase44] Getting ${name}`, id);
    return { id, name: `${name} Item` };
  },
  create: async (data) => {
    console.log(`[MockBase44] Creating ${name}`, data);
    return { id: Math.random().toString(36).substr(2, 9), ...data };
  },
  update: async (id, data) => {
    console.log(`[MockBase44] Updating ${name}`, id, data);
    return { id, ...data };
  },
  delete: async (id) => {
    console.log(`[MockBase44] Deleting ${name}`, id);
    return true;
  }
});

// List of all entities used in entities.js
const ENTITY_NAMES = [
  'Quiz', 'Question', 'QuizAttempt', 'Competency', 'Topic', 'BookmarkedQuestion',
  'SavedSummary', 'DailyChallenge', 'UserPoints', 'Flashcard', 'QuestionNote',
  'TopicQuestion', 'QuestionStats', 'Badge', 'UserBadge', 'RewardItem',
  'UserReward', 'StudyPlan', 'Case', 'AISettings', 'AIUsageLog',
  'AIPromptTemplate', 'AIFeatureConfig', 'ChatMessage', 'ChatBan', 'TypingIndicator'
];

// Construct the Mock Client
const mockBase44 = {
  auth: {
    me: async () => {
      console.log('[MockBase44] Authenticating as mock user');
      return MOCK_USER;
    },
    login: async () => {
      console.log('[MockBase44] Login requested (ignored)');
      return MOCK_USER;
    },
    logout: async () => {
      console.log('[MockBase44] Logout requested');
    }
  },
  entities: {}
};

// Populate entities
ENTITY_NAMES.forEach(name => {
  mockBase44.entities[name] = createMockEntity(name);
});

export const base44 = mockBase44;
