import { base44 } from '@/api/base44Client';

export const awardUserPoints = async (userEmail, pointsToAdd) => {
    if (!userEmail) return;

    try {
        // 1. Get current user points
        const userPointsList = await base44.entities.UserPoints.filter({ user_id: userId });
        let userPointRecord = userPointsList[0];
        let currentPoints = 0;

        if (userPointRecord) {
            currentPoints = userPointRecord.total_points || 0;
            await base44.entities.UserPoints.update(userPointRecord.id, {
                total_points: currentPoints + pointsToAdd
            });
        } else {
            userPointRecord = await base44.entities.UserPoints.create({
                user_id: userId,
                total_points: pointsToAdd
            });
            currentPoints = 0;
        }

        const newTotal = currentPoints + pointsToAdd;

        // 2. Check for level up (optional notification logic could go here)
        // const oldLevel = calculateLevel(currentPoints);
        // const newLevel = calculateLevel(newTotal);

        return newTotal;
    } catch (error) {
        console.error("Failed to award points:", error);
        return 0;
    }
};

export const LEVELS = [
    { level: 1, minXP: 0, title: "Novice" },
    { level: 2, minXP: 500, title: "Apprentice" },
    { level: 3, minXP: 1000, title: "Pro" },
    { level: 4, minXP: 2500, title: "Expert" },
    { level: 5, minXP: 5000, title: "Master" },
    { level: 6, minXP: 10000, title: "Genius" },
];

export const calculateLevel = (points) => {
    const levelData = LEVELS.slice().reverse().find(l => points >= l.minXP);
    return levelData || LEVELS[0];
};

export const getNextLevel = (currentLevel) => {
    return LEVELS.find(l => l.level === currentLevel + 1);
};

export const BADGES = [
    {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Completed a quiz before 8 AM',
        icon: '🌅',
        condition: (stats) => stats.early_morning_quizzes > 0
    },
    {
        id: 'streak_7',
        name: 'Dedicated',
        description: 'Maintained a 7-day study streak',
        icon: '🔥',
        condition: (stats) => stats.streak_days >= 7
    },
    {
        id: 'quiz_master',
        name: 'Quiz Master',
        description: 'Scored 100% on 5 quizzes',
        icon: '🏆',
        condition: (stats) => stats.perfect_scores >= 5
    },
    {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Participated in 50 chat messages',
        icon: '🦋',
        condition: (stats) => stats.messages_sent >= 50
    },
    {
        id: 'volume_king',
        name: 'Volume King',
        description: 'Answered over 500 questions total',
        icon: '📚',
        condition: (stats) => stats.total_questions_answered >= 500
    }
];

export const calculateBadges = (userStats) => {
    return BADGES.filter(badge => badge.condition(userStats));
};
