import Layout from "./Layout.jsx";

import Home from "./Home";

import Questions from "./Questions";

import Dashboard from "./Dashboard";

import AIAssistant from "./AIAssistant";

import Profile from "./Profile";

import CompetencyDetail from "./CompetencyDetail";

import Quiz from "./Quiz";

import QuizResults from "./QuizResults";

import Bookmarked from "./Bookmarked";

import IncorrectAnswers from "./IncorrectAnswers";

import SavedSummaries from "./SavedSummaries";

import ResumeQuizzes from "./ResumeQuizzes";

import DailyChallenge from "./DailyChallenge";

import Leaderboard from "./Leaderboard";

import Flashcards from "./Flashcards";

import AIQuiz from "./AIQuiz";

import PersonalizedReview from "./PersonalizedReview";

import ManageChapters from "./ManageChapters";

import ManageTopics from "./ManageTopics";

import ManageQuestions from "./ManageQuestions";

import AdminUsers from "./AdminUsers";

import MockExamSetup from "./MockExamSetup";

import MockExam from "./MockExam";

import MockExamResults from "./MockExamResults";

import Pricing from "./Pricing";

import SubscriptionSuccess from "./SubscriptionSuccess";

import AdminPanel from "./AdminPanel";

import RewardsStore from "./RewardsStore";

import Badges from "./Badges";

import StudyPlan from "./StudyPlan";

import PersonalizedFeedback from "./PersonalizedFeedback";

import IncorrectAnswersSummary from "./IncorrectAnswersSummary";

import TopicSummary from "./TopicSummary";

import ManageCases from "./ManageCases";

import AdminAISettings from "./AdminAISettings";

import GroupChat from "./GroupChat";

import AdminChatManagement from "./AdminChatManagement";

import MyAccount from "./MyAccount";
import Login from "./Login";
import ProtectedRoute from "@/components/ProtectedRoute";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {

    Home: Home,

    Questions: Questions,

    Dashboard: Dashboard,

    AIAssistant: AIAssistant,

    Profile: Profile,

    CompetencyDetail: CompetencyDetail,

    Quiz: Quiz,

    QuizResults: QuizResults,

    Bookmarked: Bookmarked,

    IncorrectAnswers: IncorrectAnswers,

    SavedSummaries: SavedSummaries,

    ResumeQuizzes: ResumeQuizzes,

    DailyChallenge: DailyChallenge,

    Leaderboard: Leaderboard,

    Flashcards: Flashcards,

    AIQuiz: AIQuiz,

    PersonalizedReview: PersonalizedReview,

    ManageChapters: ManageChapters,

    ManageTopics: ManageTopics,

    ManageQuestions: ManageQuestions,

    AdminUsers: AdminUsers,

    MockExamSetup: MockExamSetup,

    MockExam: MockExam,

    MockExamResults: MockExamResults,

    Pricing: Pricing,

    SubscriptionSuccess: SubscriptionSuccess,

    AdminPanel: AdminPanel,

    RewardsStore: RewardsStore,

    Badges: Badges,

    StudyPlan: StudyPlan,

    PersonalizedFeedback: PersonalizedFeedback,

    IncorrectAnswersSummary: IncorrectAnswersSummary,

    TopicSummary: TopicSummary,

    ManageCases: ManageCases,

    AdminAISettings: AdminAISettings,

    GroupChat: GroupChat,

    AdminChatManagement: AdminChatManagement,

    MyAccount: MyAccount,

}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    return (
        <Layout currentPageName={currentPage}>
            <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/Home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/Questions" element={<ProtectedRoute><Questions /></ProtectedRoute>} />
                <Route path="/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/AIAssistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
                <Route path="/Profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/CompetencyDetail" element={<ProtectedRoute><CompetencyDetail /></ProtectedRoute>} />
                <Route path="/Quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
                <Route path="/QuizResults" element={<ProtectedRoute><QuizResults /></ProtectedRoute>} />
                <Route path="/Bookmarked" element={<ProtectedRoute><Bookmarked /></ProtectedRoute>} />
                <Route path="/IncorrectAnswers" element={<ProtectedRoute><IncorrectAnswers /></ProtectedRoute>} />
                <Route path="/SavedSummaries" element={<ProtectedRoute><SavedSummaries /></ProtectedRoute>} />
                <Route path="/ResumeQuizzes" element={<ProtectedRoute><ResumeQuizzes /></ProtectedRoute>} />
                <Route path="/DailyChallenge" element={<ProtectedRoute><DailyChallenge /></ProtectedRoute>} />
                <Route path="/Leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                <Route path="/Flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
                <Route path="/AIQuiz" element={<ProtectedRoute><AIQuiz /></ProtectedRoute>} />
                <Route path="/PersonalizedReview" element={<ProtectedRoute><PersonalizedReview /></ProtectedRoute>} />
                <Route path="/MockExamSetup" element={<ProtectedRoute><MockExamSetup /></ProtectedRoute>} />
                <Route path="/MockExam" element={<ProtectedRoute><MockExam /></ProtectedRoute>} />
                <Route path="/MockExamResults" element={<ProtectedRoute><MockExamResults /></ProtectedRoute>} />
                <Route path="/Pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
                <Route path="/SubscriptionSuccess" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />
                <Route path="/RewardsStore" element={<ProtectedRoute><RewardsStore /></ProtectedRoute>} />
                <Route path="/Badges" element={<ProtectedRoute><Badges /></ProtectedRoute>} />
                <Route path="/StudyPlan" element={<ProtectedRoute><StudyPlan /></ProtectedRoute>} />
                <Route path="/PersonalizedFeedback" element={<ProtectedRoute><PersonalizedFeedback /></ProtectedRoute>} />
                <Route path="/IncorrectAnswersSummary" element={<ProtectedRoute><IncorrectAnswersSummary /></ProtectedRoute>} />
                <Route path="/TopicSummary" element={<ProtectedRoute><TopicSummary /></ProtectedRoute>} />
                <Route path="/GroupChat" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />
                <Route path="/MyAccount" element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/ManageChapters" element={<ProtectedRoute adminOnly><ManageChapters /></ProtectedRoute>} />
                <Route path="/ManageTopics" element={<ProtectedRoute adminOnly><ManageTopics /></ProtectedRoute>} />
                <Route path="/ManageQuestions" element={<ProtectedRoute adminOnly><ManageQuestions /></ProtectedRoute>} />
                <Route path="/AdminUsers" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
                <Route path="/AdminPanel" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
                <Route path="/ManageCases" element={<ProtectedRoute adminOnly><ManageCases /></ProtectedRoute>} />
                <Route path="/AdminAISettings" element={<ProtectedRoute adminOnly><AdminAISettings /></ProtectedRoute>} />
                <Route path="/AdminChatManagement" element={<ProtectedRoute adminOnly><AdminChatManagement /></ProtectedRoute>} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}