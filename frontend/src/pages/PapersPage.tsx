import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  MessageSquare,
  Share2,
  Trash2,
  Calendar,
  FileText,
  Brain,
  Grid,
  List,
  ArrowRight,
  X,
  ChevronDown,
  Zap,
  Hash,
  Clock,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/design-system.css';

import type { Paper } from '../services/papers';
import { usePapers, useDeletePaper } from '../hooks/usePapers';

const PapersPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'status'>('date');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'processing' | 'failed'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: fetchedPapers, isLoading, error } = usePapers();
  const deletePaperMutation = useDeletePaper();
  
  // Use fetched papers instead of mock
  const papers = fetchedPapers || [];

  const filteredAndSortedPapers = React.useMemo(() => {
    return papers
      .filter((paper: Paper) => {
        const matchesSearch = paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (paper.authors && paper.authors.some((author: string) => author.toLowerCase().includes(searchQuery.toLowerCase()))) ||
                             (paper.abstract && paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFilter = filterStatus === 'all' || paper.status === filterStatus;
        return matchesSearch && matchesFilter;
      })
      .sort((a: Paper, b: Paper) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
          case 'title':
            return a.title.localeCompare(b.title);
          case 'status':
            return a.status.localeCompare(b.status);
          default:
            return 0;
        }
      });
  }, [papers, searchQuery, filterStatus, sortBy]);

  const getStatusColor = React.useCallback((status: string) => {
    switch (status) {
      case 'ready': return '#28a745';
      case 'processing': 
      case 'extracting':
      case 'chunking':
      case 'embedding':
        return '#ffc107';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  }, []);

  const getStatusIcon = React.useCallback((status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'processing':
      case 'extracting':
      case 'chunking':
      case 'embedding':
        return <Brain className="w-4 h-4 animate-pulse" />;
      case 'failed': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  }, []);

  const handlePaperAction = React.useCallback((action: string, paper: Paper) => {
    switch (action) {
      case 'view':
        setSelectedPaper(paper);
        break;
      case 'chat':
        navigate(`/chat?paper=${paper.id}`);
        break;
      case 'download':
        if (paper.file_url) {
          window.open(paper.file_url, '_blank');
        }
        break;
      case 'share':
        // Handle share
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this paper?')) {
          deletePaperMutation.mutate(paper.id);
        }
        break;
    }
  }, [navigate, deletePaperMutation]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-pattern relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-40 right-20 w-80 h-80 rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, #c9302c 0%, transparent 70%)'
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.05, 0.08, 0.05]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

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
                <h1 className="text-2xl font-black text-[#1a1f3a] leading-tight">MY PAPERS</h1>
                <p className="text-xs font-mono text-[#6c757d] uppercase tracking-wider">
                  {papers.length} Papers • {filteredAndSortedPapers.length} Filtered
                </p>
              </div>
            </motion.div>

            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => navigate('/upload')}
                className="btn btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText className="w-4 h-4" />
                Upload New
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-8">
        {/* Search and Filters */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6c757d]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search papers, authors, or content..."
                className="input pl-12 pr-4 py-4 text-lg font-mono"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn ${showFilters ? 'btn-primary' : ''}`}
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <div className="flex border-2 border-[#dee2e6] rounded-none">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-[#1a1f3a] text-white' : 'bg-white text-[#1a1f3a]'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 ${viewMode === 'list' ? 'bg-[#1a1f3a] text-white' : 'bg-white text-[#1a1f3a]'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 p-4 border-2 border-[#dee2e6] bg-[#f8f9fa]"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-mono text-sm uppercase tracking-wider text-[#1a1f3a] mb-2">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="input w-full"
                    >
                      <option value="date">Upload Date</option>
                      <option value="title">Title</option>
                      <option value="status">Status</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-sm uppercase tracking-wider text-[#1a1f3a] mb-2">
                      Status Filter
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="input w-full"
                    >
                      <option value="all">All Papers</option>
                      <option value="ready">Ready</option>
                      <option value="processing">Processing</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterStatus('all');
                        setSortBy('date');
                      }}
                      className="btn w-full"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Papers Grid/List */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedPapers.map((paper) => (
                <motion.div
                  key={paper.id}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  className="card cursor-pointer group"
                  onClick={() => handlePaperAction('view', paper)}
                >
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="flex items-center gap-2 px-3 py-1 border-2"
                      style={{ 
                        borderColor: getStatusColor(paper.status),
                        color: getStatusColor(paper.status)
                      }}
                    >
                      {getStatusIcon(paper.status)}
                      <span className="text-xs font-mono uppercase tracking-wider">
                        {paper.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#6c757d]">
                      <Hash className="w-3 h-3" />
                      {paper.chunk_count || 0} chunks
                    </div>
                  </div>

                  {/* Paper Info */}
                  <h3 className="font-black text-lg text-[#1a1f3a] mb-3 line-clamp-2 group-hover:text-[#c9302c] transition-colors">
                    {paper.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-3 h-3 text-[#6c757d]" />
                    <p className="text-xs font-mono text-[#6c757d] line-clamp-1">
                      {(paper.authors || []).join(', ')}
                    </p>
                  </div>

                  <p className="text-sm font-mono text-[#6c757d] mb-4 line-clamp-3 leading-relaxed">
                    {paper.abstract || ''}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs font-mono text-[#6c757d] mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(paper.uploaded_at).toLocaleDateString()}
                    </div>
                    {paper.processed_at && (
                      <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        {Math.round(
                          (new Date(paper.processed_at).getTime() - new Date(paper.uploaded_at).getTime()) / 1000
                        )}s
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePaperAction('chat', paper);
                      }}
                      className="flex-1 btn text-xs py-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MessageSquare className="w-3 h-3" />
                      Chat
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePaperAction('download', paper);
                      }}
                      className="flex-1 btn text-xs py-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedPapers.map((paper) => (
                <motion.div
                  key={paper.id}
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                  className="card cursor-pointer flex items-center gap-6 group"
                  onClick={() => handlePaperAction('view', paper)}
                >
                  {/* Status */}
                  <div 
                    className="flex items-center gap-2 px-3 py-2 border-2 flex-shrink-0"
                    style={{ 
                      borderColor: getStatusColor(paper.status),
                      color: getStatusColor(paper.status)
                    }}
                  >
                    {getStatusIcon(paper.status)}
                    <span className="text-xs font-mono uppercase tracking-wider">
                      {paper.status}
                    </span>
                  </div>

                  {/* Paper Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg text-[#1a1f3a] mb-2 group-hover:text-[#c9302c] transition-colors">
                      {paper.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm font-mono text-[#6c757d]">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {(paper.authors || []).slice(0, 3).join(', ')}
                        {(paper.authors || []).length > 3 && ` +${(paper.authors || []).length - 3}`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3" />
                        {paper.chunk_count || 0} chunks
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(paper.uploaded_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePaperAction('chat', paper);
                      }}
                      className="btn text-xs px-3 py-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MessageSquare className="w-3 h-3" />
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePaperAction('download', paper);
                      }}
                      className="btn text-xs px-3 py-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Download className="w-3 h-3" />
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePaperAction('delete', paper);
                      }}
                      className="btn text-xs px-3 py-2 text-[#dc3545] border-[#dc3545] hover:bg-[#dc3545] hover:text-white"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {filteredAndSortedPapers.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <FileText className="w-16 h-16 text-[#dee2e6] mx-auto mb-4" />
              <h3 className="text-xl font-black text-[#1a1f3a] mb-2">No Papers Found</h3>
              <p className="font-mono text-[#6c757d] mb-6">
                {searchQuery ? 'Try adjusting your search terms' : 'Upload your first paper to get started'}
              </p>
              {!searchQuery && (
                <motion.button
                  onClick={() => navigate('/upload')}
                  className="btn btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FileText className="w-4 h-4" />
                  Upload First Paper
                </motion.button>
              )}
            </motion.div>
          )}
        </motion.section>
      </main>

      {/* Paper Detail Modal */}
      <AnimatePresence>
        {selectedPaper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedPaper(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border-4 border-[#1a1f3a] max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-black text-[#1a1f3a] mb-3">
                      {selectedPaper.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm font-mono text-[#6c757d]">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {(selectedPaper.authors || []).join(', ')}
                      </div>
                      {selectedPaper.arxiv_id && (
                        <div className="flex items-center gap-2">
                          <Hash className="w-3 h-3" />
                          {selectedPaper.arxiv_id}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPaper(null)}
                    className="w-8 h-8 border-2 border-[#1a1f3a] hover:bg-[#1a1f3a] hover:text-white transition-all flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Abstract */}
                <div className="mb-6">
                  <h3 className="font-black text-lg text-[#1a1f3a] mb-3">Abstract</h3>
                  <p className="font-mono text-[#6c757d] leading-relaxed">
                    {selectedPaper.abstract || ''}
                  </p>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="border-2 border-[#dee2e6] p-4">
                    <div className="text-2xl font-black text-[#1a1f3a] mb-1">
                      {selectedPaper.chunk_count || 0}
                    </div>
                    <div className="text-xs font-mono text-[#6c757d] uppercase tracking-wider">
                      Text Chunks
                    </div>
                  </div>
                  <div className="border-2 border-[#dee2e6] p-4">
                    <div 
                      className="text-2xl font-black mb-1"
                      style={{ color: getStatusColor(selectedPaper.status) }}
                    >
                      {selectedPaper.status}
                    </div>
                    <div className="text-xs font-mono text-[#6c757d] uppercase tracking-wider">
                      Status
                    </div>
                  </div>
                  <div className="border-2 border-[#dee2e6] p-4">
                    <div className="text-2xl font-black text-[#1a1f3a] mb-1">
                      {new Date(selectedPaper.uploaded_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs font-mono text-[#6c757d] uppercase tracking-wider">
                      Uploaded
                    </div>
                  </div>
                  <div className="border-2 border-[#dee2e6] p-4">
                    <div className="text-2xl font-black text-[#1a1f3a] mb-1">
                      {selectedPaper.processed_at ? 
                        `${Math.round(
                          (new Date(selectedPaper.processed_at).getTime() - new Date(selectedPaper.uploaded_at).getTime()) / 1000
                        )}s` : 'N/A'
                      }
                    </div>
                    <div className="text-xs font-mono text-[#6c757d] uppercase tracking-wider">
                      Process Time
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <motion.button
                    onClick={() => {
                      navigate(`/chat?paper=${selectedPaper.id}`);
                      setSelectedPaper(null);
                    }}
                    className="btn btn-primary flex-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat with Paper
                  </motion.button>
                  <motion.button
                    onClick={() => handlePaperAction('download', selectedPaper)}
                    className="btn flex-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </motion.button>
                  <motion.button
                    onClick={() => handlePaperAction('share', selectedPaper)}
                    className="btn flex-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PapersPage;
