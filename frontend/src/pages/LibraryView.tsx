import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, Filter, DownloadCloud, TrendingUp, Eye, Share2, MoreVertical, Grid, List, ExternalLink, ArrowLeft } from 'lucide-react';
import { usePapers, useDeletePaper } from '../hooks/usePapers';
import { useNavigate } from 'react-router-dom';
import '../styles/design-system.css';

const LibraryView = () => {
  const navigate = useNavigate();
  const { data: papers } = usePapers();
  const deletePaper = useDeletePaper();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'citations' | 'relevance'>('date');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'processing' | 'failed'>('all');
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);

  const papersList = papers && Array.isArray(papers) ? papers : [];

  const filteredPapers = papersList.filter(paper => {
    const matchesSearch = !searchQuery || 
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
      paper.abstract?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || paper.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const sortedPapers = [...filteredPapers].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'citations':
        return (b.citations || 0) - (a.citations || 0);
      case 'relevance':
      default:
        return 0;
    }
  });

  const handlePaperSelect = (paperId: string) => {
    setSelectedPapers(prev => 
      prev.includes(paperId) 
        ? prev.filter(id => id !== paperId)
        : [...prev, paperId]
    );
  };

  const handleBulkAction = (action: 'export' | 'delete' | 'bookmark') => {
    switch (action) {
      case 'export':
        console.log('Exporting papers:', selectedPapers);
        break;
      case 'delete':
        selectedPapers.forEach(id => {
          deletePaper.mutate(id);
        });
        setSelectedPapers([]);
        break;
      case 'bookmark':
        console.log('Bookmarking papers:', selectedPapers);
        break;
    }
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
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-[#1a1f3a] leading-tight">ADVANCED LIBRARY</h1>
                <p className="text-xs font-mono text-[#6c757d] uppercase tracking-wider">Professional Paper Management</p>
              </div>
            </motion.div>
            
            <div className="flex gap-4">
              <button className="px-4 py-2 border-2 border-[#1a1f3a] font-mono text-sm uppercase font-bold text-[#1a1f3a] hover:bg-[#f8f9fa] transition-colors flex items-center gap-2">
                <Filter size={16} /> Filters
              </button>
              <button className="btn btn-primary flex items-center gap-2">
                <DownloadCloud size={16} /> Export
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 container mx-auto px-6 py-8 overflow-y-auto">
        {/* Advanced Search and Filters */}
        <div className="border-4 border-[#1a1f3a] bg-white p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative flex items-center border-2 border-[#dee2e6] focus-within:border-[#1a1f3a] transition-colors px-3">
              <Search className="text-[#1a1f3a] w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH PAPERS BY TITLE, AUTHOR, OR ABSTRACT..."
                className="w-full pl-3 pr-4 py-3 bg-transparent border-none outline-none font-mono text-sm text-[#1a1f3a] placeholder:text-[#6c757d]"
              />
            </div>
            
            <div className="flex gap-4">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border-2 border-[#dee2e6] focus:border-[#1a1f3a] outline-none font-mono text-sm bg-white uppercase"
              >
                <option value="date">Sort: Date</option>
                <option value="title">Sort: Title</option>
                <option value="citations">Sort: Citations</option>
                <option value="relevance">Sort: Relevance</option>
              </select>
              
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border-2 border-[#dee2e6] focus:border-[#1a1f3a] outline-none font-mono text-sm bg-white uppercase"
              >
                <option value="all">Status: All</option>
                <option value="ready">Status: Ready</option>
                <option value="processing">Status: Processing</option>
                <option value="failed">Status: Failed</option>
              </select>
              
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="w-12 border-2 border-[#dee2e6] hover:border-[#1a1f3a] flex items-center justify-center transition-colors text-[#1a1f3a]"
              >
                {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedPapers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-4 border-[#1a1f3a] bg-[#ffd700] p-4 mb-8 flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <span className="font-black text-[#1a1f3a] text-lg">
                {selectedPapers.length} SELECTED
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => handleBulkAction('export')}
                  className="px-4 py-2 border-2 border-[#1a1f3a] bg-white font-mono text-xs uppercase font-bold hover:bg-[#1a1f3a] hover:text-white transition-colors"
                >
                  Export
                </button>
                <button
                  onClick={() => handleBulkAction('bookmark')}
                  className="px-4 py-2 border-2 border-[#1a1f3a] bg-white font-mono text-xs uppercase font-bold hover:bg-[#1a1f3a] hover:text-white transition-colors"
                >
                  Bookmark
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-4 py-2 border-2 border-[#1a1f3a] bg-[#c9302c] text-white font-mono text-xs uppercase font-bold hover:bg-[#d9534f] transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
            <button
              onClick={() => setSelectedPapers([])}
              className="font-mono text-sm font-bold text-[#1a1f3a] hover:underline uppercase"
            >
              Clear Selection
            </button>
          </motion.div>
        )}

        {/* Papers Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedPapers.map((paper) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-6 border-4 border-[#dee2e6] hover:border-[#1a1f3a] bg-white flex flex-col relative group"
              >
                {/* Selection Checkbox */}
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedPapers.includes(paper.id)}
                    onChange={() => handlePaperSelect(paper.id)}
                    className="w-5 h-5 border-2 border-[#1a1f3a] accent-[#1a1f3a] cursor-pointer"
                  />
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 text-xs font-mono font-bold uppercase border-2 border-[#1a1f3a] ${
                    paper.status === 'ready' ? 'bg-[#28a745] text-white' :
                    paper.status === 'failed' ? 'bg-[#c9302c] text-white' :
                    'bg-[#ffd700] text-[#1a1f3a]'
                  }`}>
                    {paper.status}
                  </span>
                </div>
                
                {/* Paper Content */}
                <div className="mt-10 flex-1">
                  <h3 className="text-xl font-black text-[#1a1f3a] mb-3 line-clamp-2 leading-tight group-hover:text-[#c9302c] transition-colors cursor-pointer"
                      onClick={() => navigate(`/chat/${paper.id}`)}>
                    {paper.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-4 font-mono text-xs text-[#6c757d] uppercase">
                    <span className="truncate">
                      {paper.authors?.slice(0, 2).join(', ')}
                      {paper.authors?.length > 2 && ' et al.'}
                    </span>
                    <span>•</span>
                    <span>{new Date(paper.uploaded_at).getFullYear()}</span>
                  </div>
                  
                  <p className="text-sm text-[#1a1f3a] mb-6 line-clamp-3 leading-relaxed">
                    {paper.abstract || 'No abstract available for this document.'}
                  </p>
                </div>

                {/* Metrics & Actions */}
                <div className="pt-4 border-t-2 border-[#dee2e6] flex items-center justify-between">
                  <div className="flex gap-4 font-mono text-xs text-[#6c757d] font-bold">
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={14} /> {paper.total_pages || '0'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <TrendingUp size={14} /> {paper.chunk_count || '0'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/chat/${paper.id}`)}
                      className="w-8 h-8 border-2 border-[#1a1f3a] flex items-center justify-center text-[#1a1f3a] hover:bg-[#1a1f3a] hover:text-white transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                    <button className="w-8 h-8 border-2 border-[#1a1f3a] flex items-center justify-center text-[#1a1f3a] hover:bg-[#1a1f3a] hover:text-white transition-colors">
                      <Share2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="border-4 border-[#1a1f3a] bg-white overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-4 border-[#1a1f3a] bg-[#f8f9fa]">
                  <th className="p-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedPapers.length === sortedPapers.length && sortedPapers.length > 0}
                      onChange={(e) => setSelectedPapers(e.target.checked ? sortedPapers.map(p => p.id) : [])}
                      className="w-5 h-5 border-2 border-[#1a1f3a] accent-[#1a1f3a] cursor-pointer"
                    />
                  </th>
                  <th className="p-4 font-mono text-sm font-bold uppercase text-[#1a1f3a]">Title & Authors</th>
                  <th className="p-4 font-mono text-sm font-bold uppercase text-[#1a1f3a]">Date</th>
                  <th className="p-4 font-mono text-sm font-bold uppercase text-[#1a1f3a]">Status</th>
                  <th className="p-4 font-mono text-sm font-bold uppercase text-[#1a1f3a] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPapers.map((paper) => (
                  <tr key={paper.id} className="border-b-2 border-[#dee2e6] hover:bg-[#f8f9fa] transition-colors group">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedPapers.includes(paper.id)}
                        onChange={() => handlePaperSelect(paper.id)}
                        className="w-5 h-5 border-2 border-[#1a1f3a] accent-[#1a1f3a] cursor-pointer"
                      />
                    </td>
                    <td className="p-4 py-5">
                      <div className="font-bold text-[#1a1f3a] text-lg mb-1 group-hover:text-[#c9302c] cursor-pointer transition-colors" onClick={() => navigate(`/chat/${paper.id}`)}>
                        {paper.title}
                      </div>
                      <div className="font-mono text-xs text-[#6c757d]">
                        {paper.authors?.slice(0, 3).join(', ')}
                        {paper.authors?.length > 3 && ' et al.'}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm text-[#1a1f3a]">
                      {new Date(paper.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-mono font-bold uppercase border-2 border-[#1a1f3a] ${
                        paper.status === 'ready' ? 'bg-[#28a745] text-white' :
                        paper.status === 'failed' ? 'bg-[#c9302c] text-white' :
                        'bg-[#ffd700] text-[#1a1f3a]'
                      }`}>
                        {paper.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/chat/${paper.id}`)}
                          className="w-8 h-8 border-2 border-[#1a1f3a] flex items-center justify-center text-[#1a1f3a] hover:bg-[#1a1f3a] hover:text-white transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        <button className="w-8 h-8 border-2 border-[#1a1f3a] flex items-center justify-center text-[#1a1f3a] hover:bg-[#1a1f3a] hover:text-white transition-colors">
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default LibraryView;
