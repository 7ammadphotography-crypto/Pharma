
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, HelpCircle, BarChart3, Bot, User, MessageSquare, Brain } from 'lucide-react';

const navItems = [
  { name: 'Home', icon: Home, page: 'Home' },
  { name: 'Questions', icon: HelpCircle, page: 'Questions' },
  { name: 'Chat', icon: MessageSquare, page: 'GroupChat' },
  { name: 'AI', icon: Brain, page: 'AIAssistant' },
  { name: 'Account', icon: User, page: 'MyAccount' },
];

const adminNavItems = [
  { name: 'الرئيسية', icon: Home, page: 'AdminPanel' },
  { name: 'الفصول', icon: HelpCircle, page: 'ManageChapters' },
  { name: 'المواضيع', icon: BarChart3, page: 'ManageTopics' },
  { name: 'الأسئلة', icon: Bot, page: 'ManageQuestions' },
];

const adminPages = ['AdminPanel', 'ManageChapters', 'ManageTopics', 'ManageQuestions', 'AdminUsers'];

export default function Layout({ children, currentPageName }) {
  const isAdmin = adminPages.includes(currentPageName);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <style>{`
        :root {
          --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --gradient-secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          --gradient-accent: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        body {
          background: #0a0a0f;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .glow-effect {
          box-shadow: 0 0 60px rgba(99, 102, 241, 0.2);
        }
        .nav-glow {
          box-shadow: 0 -10px 50px rgba(99, 102, 241, 0.15);
        }
      `}</style>
      
      <main className={`flex-1 overflow-auto ${isAdmin ? '' : 'pb-24'}`}>
        {children}
      </main>

      {/* Bottom Navigation - Glassmorphism Style */}
      {!isAdmin && (
      <nav className="fixed bottom-0 left-0 right-0 nav-glow z-50">
        <div className="mx-3 mb-3">
          <div className="glass-card rounded-2xl px-2 py-3 max-w-lg mx-auto">
            <div className="flex justify-around items-center">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className="flex flex-col items-center gap-1 px-3 py-1 transition-all duration-300"
                  >
                    <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30' 
                        : 'hover:bg-white/5'
                    }`}>
                      <Icon className={`w-5 h-5 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`} />
                    </div>
                    <span className={`text-[10px] font-medium transition-colors ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          </div>
          </nav>
          )}
          </div>
          );
          }
