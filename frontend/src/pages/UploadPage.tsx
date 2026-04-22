import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  FileText, 
  Link as LinkIcon, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Zap,
  Brain,
  Target,
  ArrowRight,
  File,
  Hash,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/design-system.css';

import { useUpload } from '../hooks/useUpload';

const UploadPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const {
    arxivLink,
    setArxivLink,
    activeTab,
    setActiveTab,
    uploadProgress,
    uploadedFiles,
    handleFileUpload,
    handleArxivUpload,
    resetUpload
  } = useUpload();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFileUpload(file);
    }
  }, []);



  const goToPapers = () => {
    navigate('/papers');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-pattern relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #1a1f3a 0%, transparent 70%)'
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{
            duration: 6,
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
                <h1 className="text-2xl font-black text-[#1a1f3a] leading-tight">UPLOAD PAPERS</h1>
                <p className="text-xs font-mono text-[#6c757d] uppercase tracking-wider">Transform Your Research</p>
              </div>
            </motion.div>

            {uploadedFiles.length > 0 && (
              <motion.button
                onClick={goToPapers}
                className="btn btn-accent"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <FileText className="w-4 h-4" />
                View Papers ({uploadedFiles.length})
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto"
        >
          {/* Upload Stats */}
          <motion.section
            variants={itemVariants}
            className="grid grid-cols-3 gap-6 mb-12"
          >
            {[
              { icon: File, label: 'Papers Uploaded', value: uploadedFiles.length, color: '#1a1f3a' },
              { icon: Brain, label: 'AI Analysis', value: 'Ready', color: '#c9302c' },
              { icon: Zap, label: 'Processing Speed', value: '< 3s', color: '#28a745' }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  className="border-4 border-[#dee2e6] bg-white p-6 text-center hover:border-[#1a1f3a] transition-colors"
                  whileHover={{ y: -4 }}
                >
                  <div 
                    className="w-12 h-12 mx-auto mb-3 rounded-none flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}dd 100%)` }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div 
                    className="text-2xl font-black mb-1"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs font-mono text-[#6c757d] uppercase tracking-wider">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </motion.section>

          {/* Upload Interface */}
          <motion.section
            variants={itemVariants}
            className="border-4 border-[#1a1f3a] bg-white p-8 relative overflow-hidden"
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffd700] opacity-10 transform translate-x-12 -translate-y-12 rotate-45"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#ffd700] opacity-10 transform -translate-x-8 translate-y-8 rotate-45"></div>

            <div className="relative z-10">
              {/* Tab Navigation */}
              <div className="flex gap-2 mb-8 border-b-2 border-[#dee2e6]">
                <button
                  onClick={() => setActiveTab('file')}
                  className={`px-6 py-3 font-mono text-sm uppercase tracking-wider border-b-4 transition-all ${
                    activeTab === 'file' 
                      ? 'border-[#1a1f3a] text-[#1a1f3a]' 
                      : 'border-transparent text-[#6c757d] hover:text-[#1a1f3a]'
                  }`}
                >
                  <File className="w-4 h-4 inline mr-2" />
                  PDF Upload
                </button>
                <button
                  onClick={() => setActiveTab('url')}
                  className={`px-6 py-3 font-mono text-sm uppercase tracking-wider border-b-4 transition-all ${
                    activeTab === 'url' 
                      ? 'border-[#1a1f3a] text-[#1a1f3a]' 
                      : 'border-transparent text-[#6c757d] hover:text-[#1a1f3a]'
                  }`}
                >
                  <LinkIcon className="w-4 h-4 inline mr-2" />
                  arXiv URL
                </button>
              </div>

              {/* File Upload Tab */}
              <AnimatePresence mode="wait">
                {activeTab === 'file' && (
                  <motion.div
                    key="file"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`upload-area ${dragActive ? 'dragover' : ''}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      
                      <div className="text-center">
                        <motion.div
                          className="w-20 h-20 mx-auto mb-6 rounded-none border-4 border-[#1a1f3a] flex items-center justify-center bg-white"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <UploadCloud className="w-10 h-10 text-[#1a1f3a]" />
                        </motion.div>
                        
                        <h3 className="text-2xl font-black text-[#1a1f3a] mb-4">
                          Drag & Drop Your PDF
                        </h3>
                        <p className="font-mono text-[#6c757d] mb-6">
                          or click to browse from your computer
                        </p>
                        
                        <div className="flex flex-wrap gap-4 justify-center text-sm font-mono text-[#6c757d]">
                          <div className="flex items-center gap-2">
                            <File className="w-4 h-4" />
                            <span>PDF only</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            <span>Max 10MB</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            <span>Instant processing</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* arXiv URL Tab */}
              <AnimatePresence mode="wait">
                {activeTab === 'url' && (
                  <motion.div
                    key="url"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-6">
                      <div>
                        <label className="block font-mono text-sm uppercase tracking-wider text-[#1a1f3a] mb-3">
                          arXiv Paper URL
                        </label>
                        <div className="flex gap-4">
                          <input
                            type="url"
                            value={arxivLink}
                            onChange={(e) => setArxivLink(e.target.value)}
                            placeholder="https://arxiv.org/abs/2301.00000"
                            className="input flex-1 text-lg font-mono"
                          />
                          <motion.button
                            onClick={handleArxivUpload}
                            className="btn btn-primary"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <LinkIcon className="w-4 h-4" />
                            Import
                          </motion.button>
                        </div>
                        <p className="text-xs font-mono text-[#6c757d] mt-2">
                          Enter the full arXiv URL to import the paper directly
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload Progress */}
              <AnimatePresence>
                {uploadProgress.status !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-8 p-6 border-2 border-[#dee2e6] bg-[#f8f9fa]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {uploadProgress.status === 'uploading' && (
                          <Loader2 className="w-5 h-5 text-[#1a1f3a] animate-spin" />
                        )}
                        {uploadProgress.status === 'processing' && (
                          <Brain className="w-5 h-5 text-[#c9302c] animate-pulse" />
                        )}
                        {uploadProgress.status === 'success' && (
                          <CheckCircle className="w-5 h-5 text-[#28a745]" />
                        )}
                        {uploadProgress.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-[#dc3545]" />
                        )}
                        
                        <div>
                          <div className="font-mono text-sm uppercase tracking-wider text-[#1a1f3a]">
                            {uploadProgress.status === 'uploading' && 'Uploading...'}
                            {uploadProgress.status === 'processing' && 'Processing with AI...'}
                            {uploadProgress.status === 'success' && 'Upload Complete!'}
                            {uploadProgress.status === 'error' && 'Upload Failed'}
                          </div>
                          {uploadProgress.fileName && (
                            <div className="text-xs font-mono text-[#6c757d]">
                              {uploadProgress.fileName}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {uploadProgress.status === 'error' && (
                        <button
                          onClick={resetUpload}
                          className="text-xs font-mono text-[#c9302c] hover:text-[#a02622] uppercase tracking-wider"
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                    
                    {(uploadProgress.status === 'uploading' || uploadProgress.status === 'processing') && (
                      <div className="mb-4">
                        <div className="progress">
                          <motion.div
                            className="progress-bar"
                            style={{ width: `${uploadProgress.progress}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <div className="flex justify-between text-xs font-mono text-[#6c757d] mt-2">
                          <span>{Math.round(uploadProgress.progress)}% Complete</span>
                          <span>
                            {uploadProgress.status === 'uploading' && 'Uploading file...'}
                            {uploadProgress.status === 'processing' && 'AI analysis in progress...'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {uploadProgress.status === 'success' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#28a745] text-white p-4 border-2 border-[#28a745]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5" />
                            <div>
                              <div className="font-mono text-sm uppercase tracking-wider">
                                Paper Successfully Processed!
                              </div>
                              <div className="text-xs opacity-90">
                                AI analysis complete. Ready for chat and search.
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <motion.button
                              onClick={resetUpload}
                              className="px-3 py-1 bg-white text-[#28a745] border-2 border-white font-mono text-xs uppercase tracking-wider hover:bg-[#f8f9fa] transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Upload Another
                            </motion.button>
                            <motion.button
                              onClick={goToPapers}
                              className="px-3 py-1 bg-transparent text-white border-2 border-white font-mono text-xs uppercase tracking-wider hover:bg-white hover:text-[#28a745] transition-all"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              View Papers
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {uploadProgress.status === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#dc3545] text-white p-4 border-2 border-[#dc3545]"
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5" />
                          <div>
                            <div className="font-mono text-sm uppercase tracking-wider">
                              Upload Error
                            </div>
                            <div className="text-xs opacity-90">
                              {uploadProgress.error || 'An unexpected error occurred. Please try again.'}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* Features */}
          <motion.section
            variants={itemVariants}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Brain,
                title: 'AI Analysis',
                description: 'Advanced text extraction and semantic understanding powered by cutting-edge AI models.',
                gradient: 'linear-gradient(135deg, #1a1f3a 0%, #2d3561 100%)'
              },
              {
                icon: Target,
                title: 'Smart Processing',
                description: 'Intelligent chunking and metadata extraction for optimal search and analysis.',
                gradient: 'linear-gradient(135deg, #c9302c 0%, #e74c3c 100%)'
              },
              {
                icon: Clock,
                title: 'Instant Results',
                description: 'Get your papers processed and ready for interaction in under 3 seconds.',
                gradient: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="border-2 border-[#dee2e6] bg-white p-6 hover:border-[#1a1f3a] transition-all"
                  whileHover={{ y: -4 }}
                >
                  <div 
                    className="w-12 h-12 rounded-none flex items-center justify-center mb-4"
                    style={{ background: feature.gradient }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 
                    className="font-black text-lg mb-3"
                    style={{ color: '#1a1f3a' }}
                  >
                    {feature.title}
                  </h4>
                  <p className="text-sm font-mono text-[#6c757d] leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
};

export default UploadPage;
