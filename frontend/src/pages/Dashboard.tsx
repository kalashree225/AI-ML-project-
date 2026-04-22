import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  BarChart3, 
  Users, 
  Upload,
  FileText,
  Search,
  ArrowRight,
  Menu,
  X,
  ChevronRight,
  Zap,
  Target,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/design-system.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [uploadedPaperId, setUploadedPaperId] = useState<string | null>(() => {
    return localStorage.getItem('uploadedPaperId') || null;
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const features = React.useMemo(() => [
    {
      id: 1,
      icon: Upload,
      title: 'UPLOAD & ANALYZE',
      subtitle: 'Transform PDFs into insights',
      description: 'Upload research papers and get instant AI-powered analysis with advanced text extraction and semantic understanding.',
      path: '/upload',
      gradient: 'linear-gradient(135deg, #1a1f3a 0%, #2d3561 100%)',
      accent: '#ffd700'
    },
    {
      id: 2,
      icon: BrainCircuit,
      title: 'AI CONVERSATION',
      subtitle: 'Chat with your papers',
      description: 'Engage in intelligent conversations with your research papers. Ask questions, get summaries, and explore connections.',
      path: '/chat',
      gradient: 'linear-gradient(135deg, #c9302c 0%, #e74c3c 100%)',
      accent: '#fff'
    },
    {
      id: 3,
      icon: Search,
      title: 'SEMANTIC SEARCH',
      subtitle: 'Find what matters',
      description: 'Search across your entire library with semantic understanding. Find papers by concepts, not just keywords.',
      path: '/search',
      gradient: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
      accent: '#fff'
    },
    {
      id: 4,
      icon: Layers,
      title: 'COMPARE & CONTRAST',
      subtitle: 'Multi-paper analysis',
      description: 'Compare multiple papers side-by-side. Identify similarities, differences, and research gaps.',
      path: '/compare',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
      accent: '#fff'
    },
    {
      id: 5,
      icon: BarChart3,
      title: 'RESEARCH INSIGHTS',
      subtitle: 'Analytics & trends',
      description: 'Visualize research trends, citation networks, and collaboration patterns in your field.',
      path: '/analytics',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
      accent: '#fff'
    },
    {
      id: 6,
      icon: Users,
      title: 'COLLABORATE',
      subtitle: 'Share & discover',
      description: 'Collaborate with peers, share annotations, and discover related research from your network.',
      path: '/collaborate',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      accent: '#fff'
    }
  ], []);

  const containerVariants = React.useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }), []);

  const itemVariants = React.useMemo(() => ({
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  }), []);

  const handleFeatureClick = React.useCallback((featureId: number, path: string) => {
    setActiveFeature(featureId);
    setTimeout(() => {
      navigate(path);
    }, 300);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-pattern relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #1a1f3a 0%, transparent 70%)',
            left: `${mousePosition.x * 0.05}px`,
            top: `${mousePosition.y * 0.05}px`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-64 h-64 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #c9302c 0%, transparent 70%)',
            right: `${100 - mousePosition.x * 0.03}px`,
            bottom: `${100 - mousePosition.y * 0.03}px`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.12, 0.1]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
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
              transition={{ duration: 0.6 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#1a1f3a] to-[#2d3561] rounded-none flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform">
                <BrainCircuit className="w-6 h-6 text-[#ffd700]" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#1a1f3a] leading-tight">ResearchMind</h1>
                <p className="text-xs font-mono text-[#6c757d] uppercase tracking-wider">Academic Intelligence Platform</p>
              </div>
            </motion.div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 border-2 border-[#1a1f3a] hover:bg-[#1a1f3a] hover:text-white transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {uploadedPaperId && (
                <motion.button
                  onClick={() => navigate('/papers')}
                  className="btn btn-accent"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FileText className="w-4 h-4" />
                  My Papers
                </motion.button>
              )}
              <motion.button
                onClick={() => navigate('/upload')}
                className="btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Upload className="w-4 h-4" />
                Get Started
              </motion.button>
            </nav>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.nav
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="lg:hidden mt-6 pt-6 border-t-2 border-[#dee2e6]"
              >
                <div className="flex flex-col gap-4">
                  {uploadedPaperId && (
                    <button
                      onClick={() => navigate('/papers')}
                      className="btn btn-accent text-left"
                    >
                      <FileText className="w-4 h-4" />
                      My Papers
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/upload')}
                    className="btn text-left"
                  >
                    <Upload className="w-4 h-4" />
                    Get Started
                  </button>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.section
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-8">
            <h2 className="text-6xl md:text-7xl font-black text-gradient mb-6 leading-tight">
              RESEARCH
              <br />
              REIMAGINED
            </h2>
            <p className="text-xl md:text-2xl font-mono text-[#6c757d] max-w-3xl mx-auto leading-relaxed">
              Transform academic papers into interactive, searchable knowledge.
              Powered by AI, designed for researchers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <motion.button
              onClick={() => navigate('/upload')}
              className="btn btn-primary text-lg px-8 py-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="w-5 h-5" />
              Upload First Paper
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            
            <div className="flex items-center gap-4 text-sm font-mono text-[#6c757d]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#28a745] rounded-full animate-pulse"></div>
                <span>Live Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>AI-Powered</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Features Grid */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isActive = activeFeature === feature.id;
            
            return (
              <motion.div
                key={feature.id}
                variants={itemVariants}
                whileHover={{ 
                  y: -8,
                  scale: 1.02
                }}
                onHoverStart={() => setActiveFeature(feature.id)}
                onHoverEnd={() => setActiveFeature(null)}
              >
                <div 
                  className={`card cursor-pointer border-4 transition-all duration-300 ${
                    isActive ? 'border-[#ffd700] shadow-2xl' : 'border-[#dee2e6] hover:border-[#1a1f3a]'
                  }`}
                  onClick={() => handleFeatureClick(feature.id, feature.path)}
                  style={{
                    background: isActive ? feature.gradient : 'white'
                  }}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div 
                      className="w-16 h-16 rounded-none flex items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform"
                      style={{ background: feature.gradient }}
                    >
                      <Icon className="w-8 h-8" style={{ color: feature.accent }} />
                    </div>
                    <ChevronRight 
                      className={`w-6 h-6 transition-all duration-300 ${
                        isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                      }`}
                      style={{ color: feature.accent }}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 
                      className="text-xl font-black leading-tight"
                      style={{ color: isActive ? '#fff' : '#1a1f3a' }}
                    >
                      {feature.title}
                    </h3>
                    <p 
                      className="font-mono text-sm uppercase tracking-wider"
                      style={{ color: isActive ? 'rgba(255,255,255,0.8)' : '#c9302c' }}
                    >
                      {feature.subtitle}
                    </p>
                    <p 
                      className="leading-relaxed"
                      style={{ color: isActive ? 'rgba(255,255,255,0.9)' : '#6c757d' }}
                    >
                      {feature.description}
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t-2" style={{ borderColor: isActive ? 'rgba(255,255,255,0.2)' : '#dee2e6' }}>
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-mono text-xs uppercase tracking-wider"
                        style={{ color: isActive ? feature.accent : '#1a1f3a' }}
                      >
                        EXPLORE →
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.section>

        {/* Stats Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
        >
          {[
            { number: '10K+', label: 'Papers Processed', color: '#1a1f3a' },
            { number: '95%', label: 'Accuracy Rate', color: '#c9302c' },
            { number: '2M+', label: 'Research Insights', color: '#28a745' },
            { number: '24/7', label: 'AI Available', color: '#8b5cf6' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div 
                className="text-4xl md:text-5xl font-black mb-2"
                style={{ color: stat.color }}
              >
                {stat.number}
              </div>
              <div className="text-sm font-mono text-[#6c757d] uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center"
        >
          <div className="border-4 border-[#1a1f3a] bg-gradient-to-br from-[#1a1f3a] to-[#2d3561] p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffd700] opacity-20 transform translate-x-16 -translate-y-16 rotate-45"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#ffd700] opacity-20 transform -translate-x-12 translate-y-12 rotate-45"></div>
            
            <div className="relative z-10">
              <h3 className="text-4xl md:text-5xl font-black text-white mb-6">
                Ready to Transform Your Research?
              </h3>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of researchers using AI to accelerate their discoveries and gain deeper insights from academic literature.
              </p>
              <motion.button
                onClick={() => navigate('/upload')}
                className="btn bg-white text-[#1a1f3a] hover:bg-[#ffd700] hover:text-[#1a1f3a] text-lg px-8 py-4 border-2 border-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Upload className="w-5 h-5" />
                Start Your Analysis
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t-4 border-[#1a1f3a] bg-white mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#1a1f3a] to-[#2d3561] rounded-none flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-[#ffd700]" />
              </div>
              <span className="font-mono text-sm text-[#6c757d] uppercase tracking-wider">
                © 2024 ResearchMind. Academic Intelligence.
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm font-mono text-[#6c757d]">
              <span>Built with</span>
              <span className="text-[#c9302c]">♥</span>
              <span>for Researchers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
