import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, Layers, BookOpen, HelpCircle, Users, LogOut, Menu, FileText, Brain, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function AdminLayout({ children, currentPage }) {
  const menu = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'AdminPanel' },
    { name: 'Chapters', icon: Layers, page: 'ManageChapters' },
    { name: 'Topics', icon: BookOpen, page: 'ManageTopics' },
    { name: 'Cases', icon: FileText, page: 'ManageCases' },
    { name: 'Questions', icon: HelpCircle, page: 'ManageQuestions' },
    { name: 'Students', icon: Users, page: 'AdminUsers' },
    { name: 'Chat Management', icon: MessageSquare, page: 'AdminChatManagement' },
    { name: 'AI Settings', icon: Brain, page: 'AdminAISettings' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Pharma Target
          <span className="block text-xs text-slate-500 font-normal mt-1">Admin Panel</span>
        </h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menu.map(item => {
          const active = currentPage === item.page;
          return (
            <Link 
              key={item.page} 
              to={createPageUrl(item.page)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                active 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
         <Link to={createPageUrl('Home')}>
          <button className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white w-full transition-colors rounded-xl hover:bg-white/5">
              <LogOut className="w-5 h-5" />
              <span>Back to App</span>
          </button>
         </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 border-r border-white/10 bg-black/20 backdrop-blur-xl fixed inset-y-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0a0a0f]/80 backdrop-blur border-b border-white/10 p-4 flex items-center justify-between">
         <span className="font-bold text-white">Admin Panel</span>
         <Sheet>
           <SheetTrigger asChild>
             <Button variant="ghost" size="icon">
               <Menu className="w-6 h-6 text-white" />
             </Button>
           </SheetTrigger>
           <SheetContent side="right" className="bg-[#0a0a0f] border-white/10 p-0 w-72">
             <SidebarContent />
           </SheetContent>
         </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 pt-16 md:pt-0 min-w-0">
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}