import { base44 } from '@/api/base44Client';

/**
 * Fetches and aggregates comprehensive analytics for a user.
 * @param {string} userId - The user's UUID.
 * @returns {Promise<Object>} The aggregated stats object.
 */
export const fetchUserAnalytics = async (userId) => {
    if (!userId) return null;

    try {
        // 1. Fetch Quiz Attempts
        const attempts = await base44.entities.QuizAttempt.filter({ user_id: userId });
        const completedAttempts = attempts.filter(a => a.is_completed);

        // 2. Fetch User Points
        const pointsList = await base44.entities.UserPoints.filter({ user_id: userId });
        const userPoints = pointsList[0] || { total_points: 0, streak_days: 0, level: 1 };

        // 3. Fetch Chat Stats (if available) - Assuming 'chat_messages' table
        let messagesCount = 0;
        try {
            // Direct supabase call if base44 doesn't support aggregate count easily, 
            // but sticking to base44 pattern if possible. 
            // Filter might return huge list, better to use count if possible, 
            // but base44 filter returns data. For now, careful with perf.
            // Optimally: userPoints should track this.
            // Fallback: check if we can count.
            const messages = await base44.entities.ChatMessage.filter({ user_id: userId });
            messagesCount = messages.length;
        } catch (e) {
            console.warn("Could not fetch chat stats", e);
        }

        // 4. Calculate Derived Metrics
        const totalQuestionsAnswered = attempts.reduce((acc, curr) => acc + (curr.total_questions || 0), 0);
        const perfectScores = completedAttempts.filter(a => a.percentage === 100).length;

        // Topic Mastery Logic
        const topicMastery = {};
        completedAttempts.forEach(a => {
            if (a.topic_id) {
                if (!topicMastery[a.topic_id]) topicMastery[a.topic_id] = [];
                topicMastery[a.topic_id].push(a.percentage || 0);
            }
        });
        const topicsMastered = Object.values(topicMastery).filter(scores => {
            const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;
            return avg >= 80;
        }).length;

        // Cognitive Score Calculation
        // Formula: (Avg Score * 0.4) + (Streak * 2) + (Total Questions / 100) * 10
        // Normalized somewhat to 0-100 scale logically, but can go higher.
        const avgScore = completedAttempts.length > 0
            ? completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length
            : 0;

        const cognitiveScore = Math.round(
            (avgScore * 0.5) +
            (userPoints.streak_days * 5) +
            (Math.min(totalQuestionsAnswered, 1000) / 10)
        );

        // Social Impact Score
        const socialImpact = Math.min(100, Math.round(messagesCount * 0.5)); // 2 messages = 1 point, max 100

        return {
            ...userPoints,
            avg_score: Math.round(avgScore),
            total_quizzes: completedAttempts.length,
            total_questions_answered: totalQuestionsAnswered,
            perfect_scores: perfectScores,
            topics_mastered: topicsMastered,
            early_morning_quizzes: attempts.filter(a => {
                const h = new Date(a.created_at || a.created_date).getHours();
                return h >= 5 && h < 9;
            }).length,
            messages_sent: messagesCount,
            cognitive_score: cognitiveScore,
            social_impact: socialImpact
        };

    } catch (error) {
        console.error("Analytics fetch failed:", error);
        return null;
    }
};
