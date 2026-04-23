import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Search, FileText, ChevronRight, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChatSessions } from '../hooks/useChat';
import '../styles/design-system.css';

const HistoryView = () => {
  const navigate = useNavigate();
  const { data: sessions, isLoading } = useChatSessions();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions?.filter(session => 
    !searchQuery || 
    session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.id.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-pattern relative overflow-hidden flex flex-col">
      {/* Header */}
      <header className="relative z-10 border-b-4 border-[#1a1f3a] bg-white/90 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <button
                onClick={() => navigate('/')}
                className="w-10 h-10 border-2 border-[#1a1f3a] hover:bg-[#1a1f3a] hover:text-white transition-all flex items-center justify-center"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-[#1a1f3a] leading-tight">CHAT HISTORY</h1>
                <p className="text-xs font-mono text-[#6c757d] uppercase tracking-wider">Review Past Analysis Sessions</p>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 container mx-auto px-6 py-12 overflow-y-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="w-full max-w-5xl mx-auto mb-8">
          <div className="border-4 border-[#1a1f3a] bg-white flex items-center px-4 py-3 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#ffd700] transform -translate-x-full group-focus-within:translate-x-0 transition-transform"></div>
            <Search size={20} className="text-[#1a1f3a] mr-3 z-10" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past sessions by title or ID..." 
              className="flex-1 bg-transparent border-none outline-none font-mono text-[#1a1f3a] placeholder:text-[#6c757d] text-lg z-10"
            />
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-5xl mx-auto space-y-6"
        >
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[#1a1f3a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="font-mono text-[#6c757d] uppercase tracking-wider">Loading sessions...</p>
            </div>
          ) : filteredSessions.length > 0 ? (
            filteredSessions.map((session) => (
              <motion.div
                key={session.id}
                variants={itemVariants}
                onClick={() => navigate(`/chat/${session.id}`)}
                className="card border-4 border-[#dee2e6] hover:border-[#1a1f3a] cursor-pointer transition-colors p-0 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-[#1a1f3a] transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                <div className="p-6 flex items-start justify-between">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-[#1a1f3a] group-hover:text-[#c9302c] transition-colors">
                      {session.title || 'Untitled Session'}
                    </h3>
                    <div className="flex items-center gap-6 text-sm font-mono text-[#6c757d]">
                      <span className="flex items-center gap-2">
                        <Clock size={16} /> 
                        {new Date(session.created_at).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-2">
                        <FileText size={16} /> 
                        {session.papers?.length || 0} Paper{session.papers?.length !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-2">
                        <MessageSquare size={16} /> 
                        {session.message_count || 0} Messages
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 border-2 border-[#1a1f3a] flex items-center justify-center text-[#1a1f3a] group-hover:bg-[#1a1f3a] group-hover:text-white transition-all transform rotate-0 group-hover:rotate-12">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 border-4 border-dashed border-[#dee2e6] bg-white/50">
              <History className="w-12 h-12 text-[#dee2e6] mx-auto mb-4" />
              <p className="font-mono text-[#6c757d] uppercase tracking-wider mb-4">No chat sessions found</p>
              <button onClick={() => navigate('/upload')} className="btn btn-primary">
                Start New Session
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default HistoryView;
