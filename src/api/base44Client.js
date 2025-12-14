import { supabase } from '@/lib/supabaseClient';

// Helper to map entity names to table names
const TABLE_MAP = {
  'User': 'profiles', // Explicit mapping for AdminUsers
  'Profile': 'profiles',
  'Competency': 'competencies',
  'Topic': 'topics',
  'Case': 'cases',
  'Question': 'questions',
  'TopicQuestion': 'topic_questions',
  'QuizAttempt': 'quiz_attempts',
  'UserPoints': 'user_points',
  'BookmarkedQuestion': 'bookmarked_questions',
  // Entities not yet in schema or handled differently (Mock for now to prevent crashes)
  'Quiz': 'quizzes',
  'SavedSummary': 'saved_summaries',
  'DailyChallenge': 'daily_challenges',
  'Flashcard': 'flashcards',
  'QuestionNote': 'question_notes',
  'QuestionStats': 'question_stats',
  'Badge': 'badges',
  'UserBadge': 'user_badges',
  'RewardItem': 'reward_items',
  'UserReward': 'user_rewards',
  'StudyPlan': 'study_plans',
  'AISettings': 'ai_settings',
  'AIUsageLog': 'ai_usage_logs',
  'AIPromptTemplate': 'ai_prompt_templates',
  'AIFeatureConfig': 'ai_feature_configs',
  'ChatMessage': 'chat_messages',
  'ChatBan': 'chat_bans',
  'TypingIndicator': 'typing_indicators'
};

// Generic Client wrapper for Supabase
const createSupabaseEntity = (entityName) => {
  const tableName = TABLE_MAP[entityName] || entityName.toLowerCase() + 's';

  return {
    // List all (or filter)
    list: async () => {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) {
        console.warn(`[SupabaseAdapter] List error for ${tableName}:`, error);
        throw error;
      }
      return data;
    },
    // Filter with specific criteria
    filter: async (criteria = {}) => {
      let query = supabase.from(tableName).select('*');

      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query;
      if (error) {
        console.warn(`[SupabaseAdapter] Filter error for ${tableName}:`, error);
        return [];
      }
      return data;
    },
    // Get single item by ID
    get: async (id) => {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
      if (error) {
        console.warn(`[SupabaseAdapter] Get error for ${tableName}:`, error);
        return null;
      }
      return data;
    },
    // Create new item (single)
    create: async (data, { select = true } = {}) => {
      // Auto-inject user_id if needed and available would happen here via RLS or trigger mostly
      let query = supabase.from(tableName).insert(data);
      if (select) query = query.select().single();

      const { data: created, error } = await query;
      if (error) {
        console.error(`[SupabaseAdapter] Create error for ${tableName}:`, error);
        throw error;
      }
      return created;
    },
    // Bulk Create
    bulkCreate: async (data) => {
      if (!Array.isArray(data) || data.length === 0) return [];
      const { data: created, error } = await supabase.from(tableName).insert(data).select();
      if (error) {
        console.error(`[SupabaseAdapter] Bulk Create error for ${tableName}:`, error);
        throw error;
      }
      return created;
    },
    // Update item
    update: async (id, data) => {
      const { data: updated, error } = await supabase.from(tableName).update(data).eq('id', id).select().single();
      if (error) {
        console.error(`[SupabaseAdapter] Update error for ${tableName}:`, error);
        throw error;
      }
      return updated;
    },
    // Delete item
    delete: async (id) => {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) {
        console.error(`[SupabaseAdapter] Delete error for ${tableName}:`, error);
        throw error;
      }
      return true;
    }
  };
};

// List of all entities used in entities.js
const ENTITY_NAMES = Object.keys(TABLE_MAP);

// Construct the Client
const supabaseAdapter = {
  auth: {
    me: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Fetch profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

      return { ...session.user, ...profile };
    },
    login: async () => {
      // This was used for external redirection in old SDK
      // In Supabase, we handle login via UI components calling useAuth
      // We'll return null here or throw to encourage using the Hook
      console.log('[SupabaseAdapter] Login called via Adapter - Should use useAuth hook');
      return null;
    },
    logout: async () => {
      await supabase.auth.signOut();
    }
  },
  storage: {
    upload: async ({ file, bucket = 'chat-uploads' }) => {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return { file_url: publicUrl };
    }
  },
  // Mock integrations to prevent crashes in legacy code
  integrations: {
    Core: {
      InvokeLLM: async () => ({ data: "AI features are currently disabled during migration." }),
      UploadFile: async () => ({ file_url: "" }),
      ExtractDataFromUploadedFile: async () => ({}),
      list: async () => [],
      ListRows: async () => ({ data: [] }),
      CreateRow: async () => ({}),
      UpdateRow: async () => ({}),
      DeleteRow: async () => ({})
    }
  },
  entities: {}
};

// Populate entities
ENTITY_NAMES.forEach(name => {
  supabaseAdapter.entities[name] = createSupabaseEntity(name);
});

export const base44 = supabaseAdapter;
