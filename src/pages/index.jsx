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
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Questions" element={<Questions />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/AIAssistant" element={<AIAssistant />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/CompetencyDetail" element={<CompetencyDetail />} />
                
                <Route path="/Quiz" element={<Quiz />} />
                
                <Route path="/QuizResults" element={<QuizResults />} />
                
                <Route path="/Bookmarked" element={<Bookmarked />} />
                
                <Route path="/IncorrectAnswers" element={<IncorrectAnswers />} />
                
                <Route path="/SavedSummaries" element={<SavedSummaries />} />
                
                <Route path="/ResumeQuizzes" element={<ResumeQuizzes />} />
                
                <Route path="/DailyChallenge" element={<DailyChallenge />} />
                
                <Route path="/Leaderboard" element={<Leaderboard />} />
                
                <Route path="/Flashcards" element={<Flashcards />} />
                
                <Route path="/AIQuiz" element={<AIQuiz />} />
                
                <Route path="/PersonalizedReview" element={<PersonalizedReview />} />
                
                <Route path="/ManageChapters" element={<ManageChapters />} />
                
                <Route path="/ManageTopics" element={<ManageTopics />} />
                
                <Route path="/ManageQuestions" element={<ManageQuestions />} />
                
                <Route path="/AdminUsers" element={<AdminUsers />} />
                
                <Route path="/MockExamSetup" element={<MockExamSetup />} />
                
                <Route path="/MockExam" element={<MockExam />} />
                
                <Route path="/MockExamResults" element={<MockExamResults />} />
                
                <Route path="/Pricing" element={<Pricing />} />
                
                <Route path="/SubscriptionSuccess" element={<SubscriptionSuccess />} />
                
                <Route path="/AdminPanel" element={<AdminPanel />} />
                
                <Route path="/RewardsStore" element={<RewardsStore />} />
                
                <Route path="/Badges" element={<Badges />} />
                
                <Route path="/StudyPlan" element={<StudyPlan />} />
                
                <Route path="/PersonalizedFeedback" element={<PersonalizedFeedback />} />
                
                <Route path="/IncorrectAnswersSummary" element={<IncorrectAnswersSummary />} />
                
                <Route path="/TopicSummary" element={<TopicSummary />} />
                
                <Route path="/ManageCases" element={<ManageCases />} />
                
                <Route path="/AdminAISettings" element={<AdminAISettings />} />
                
                <Route path="/GroupChat" element={<GroupChat />} />
                
                <Route path="/AdminChatManagement" element={<AdminChatManagement />} />
                
                <Route path="/MyAccount" element={<MyAccount />} />
                
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