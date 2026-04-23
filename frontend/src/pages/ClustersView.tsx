import { motion } from 'framer-motion';
import { Layers, Zap, TrendingUp, BarChart3, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGenerateClusters } from '../hooks/useTopics';
import { useNavigate } from 'react-router-dom';
import { papersService } from '../services/papers';
import { usePapers } from '../hooks/usePapers';
import '../styles/design-system.css';

const ClustersView = () => {
  const navigate = useNavigate();
  const [activeCluster, setActiveCluster] = useState<number | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('umap');
  const [clusterCount, setClusterCount] = useState(5);
  const [showLabels, setShowLabels] = useState(true);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [colorScheme, setColorScheme] = useState('material');
  const [paperCount, setPaperCount] = useState(0);
  const { mutate: generateClusters, data: clusterData, isPending } = useGenerateClusters();
  const { data: allPapers } = usePapers();

  // Fetch papers count on mount
  useEffect(() => {
    papersService.listPapers()
      .then(papers => setPaperCount(papers.length))
      .catch(() => setPaperCount(0));
  }, []);

  const clusters = clusterData?.clusters || [];

  const handleGenerateClusters = async () => {
    try {
      const papers = await papersService.listPapers();
      if (papers.length === 0) {
        alert('No papers found. Please upload some papers first.');
        return;
      }
      
      setPaperCount(papers.length);
      const paperIds = papers.map(p => String(p.id));
      generateClusters(paperIds);
    } catch (error) {
      console.error('Failed to fetch papers:', error);
      alert('Error loading papers. Please try again.');
    }
  };

  // Color schemes for clusters
  const colorSchemes = {
    material: ['#1976d2', '#dc004e', '#388e3c', '#f57c00', '#7b1fa2', '#0288d1', '#c2185b', '#689f38'],
    vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
    pastel: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E0BBE4', '#FFDFD3', '#C8E6C9'],
    dark: ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7', '#ECF0F1', '#D5DBDB', '#ABB2B9']
  };

  const clusterColors = colorSchemes[colorScheme as keyof typeof colorSchemes];

  const handleClusterClick = (clusterId: number) => {
    setActiveCluster(clusterId);
    const cluster = clusters.find(c => c.id === clusterId);
    if (cluster && 'paper_ids' in cluster && cluster.paper_ids && cluster.paper_ids.length > 0) {
      navigate(`/chat/${cluster.paper_ids[0]}`);
    }
  };

  const handlePaperClick = (paperId: string) => {
    navigate(`/chat/${paperId}`);
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
                <h1 className="text-2xl font-black text-[#1a1f3a] leading-tight">ADVANCED CLUSTERING</h1>
                <p className="text-xs font-mono text-[#6c757d] uppercase tracking-wider">Topic Discovery & Analysis</p>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 container mx-auto px-6 py-12 overflow-y-auto">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="border-4 border-[#1a1f3a] bg-white p-4">
            <label className="block font-mono text-sm uppercase tracking-wider text-[#1a1f3a] mb-2">
              Algorithm
            </label>
            <select
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              className="w-full p-2 border-2 border-[#dee2e6] focus:border-[#1a1f3a] outline-none font-mono text-sm bg-transparent"
            >
              <option value="umap">UMAP</option>
              <option value="tsne">t-SNE</option>
              <option value="pca">PCA</option>
              <option value="kmeans">K-Means</option>
            </select>
          </div>

          <div className="border-4 border-[#1a1f3a] bg-white p-4">
            <label className="block font-mono text-sm uppercase tracking-wider text-[#1a1f3a] mb-2">
              Cluster Count
            </label>
            <input
              type="number"
              value={clusterCount}
              onChange={(e) => setClusterCount(parseInt(e.target.value))}
              min="2"
              max="20"
              className="w-full p-2 border-2 border-[#dee2e6] focus:border-[#1a1f3a] outline-none font-mono text-sm bg-transparent"
            />
          </div>

          <div className="border-4 border-[#1a1f3a] bg-white p-4">
            <label className="block font-mono text-sm uppercase tracking-wider text-[#1a1f3a] mb-2">
              Color Scheme
            </label>
            <select
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value)}
              className="w-full p-2 border-2 border-[#dee2e6] focus:border-[#1a1f3a] outline-none font-mono text-sm bg-transparent"
            >
              <option value="material">Material Design</option>
              <option value="vibrant">Vibrant</option>
              <option value="pastel">Pastel</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="border-4 border-[#1a1f3a] bg-white p-4">
            <label className="block font-mono text-sm uppercase tracking-wider text-[#1a1f3a] mb-2">
              View Mode
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('2d')}
                className={`flex-1 py-2 font-mono text-xs uppercase tracking-wider border-2 transition-colors ${
                  viewMode === '2d' 
                    ? 'bg-[#1a1f3a] text-white border-[#1a1f3a]' 
                    : 'bg-transparent text-[#1a1f3a] border-[#dee2e6] hover:border-[#1a1f3a]'
                }`}
              >
                2D
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`flex-1 py-2 font-mono text-xs uppercase tracking-wider border-2 transition-colors ${
                  viewMode === '3d' 
                    ? 'bg-[#1a1f3a] text-white border-[#1a1f3a]' 
                    : 'bg-transparent text-[#1a1f3a] border-[#dee2e6] hover:border-[#1a1f3a]'
                }`}
              >
                3D
              </button>
            </div>
          </div>
        </div>

        {/* Main Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cluster Visualization */}
          <div className="lg:col-span-2 border-4 border-[#1a1f3a] bg-white p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-[#1a1f3a] uppercase">Visualization</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border-2 transition-colors ${
                    showLabels 
                      ? 'bg-[#1a1f3a] text-white border-[#1a1f3a]' 
                      : 'bg-transparent text-[#1a1f3a] border-[#dee2e6] hover:border-[#1a1f3a]'
                  }`}
                >
                  {showLabels ? 'Hide Labels' : 'Show Labels'}
                </button>
                <button
                  onClick={handleGenerateClusters}
                  disabled={isPending}
                  className="btn btn-primary"
                >
                  {isPending ? 'Generating...' : (clusters.length > 0 ? 'Regenerate' : 'Generate')}
                </button>
              </div>
            </div>

            {/* SVG Visualization */}
            <div className="relative h-[500px] border-4 border-[#dee2e6] bg-[#f8f9fa] flex items-center justify-center overflow-hidden">
              {clusters.length === 0 ? (
                <div className="text-center">
                  <Layers className="w-16 h-16 text-[#dee2e6] mx-auto mb-4" />
                  <p className="text-lg font-black text-[#1a1f3a]">NO CLUSTERS GENERATED</p>
                  <p className="text-sm font-mono text-[#6c757d] uppercase mt-2">Upload papers and click generate</p>
                </div>
              ) : (
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                {/* Connection Lines */}
                {clusters.map((cluster, i) => 
                  clusters.slice(i + 1).map((otherCluster) => {
                    const distance = Math.sqrt(
                      Math.pow(cluster.x - otherCluster.x, 2) + 
                      Math.pow(cluster.y - otherCluster.y, 2)
                    );
                    if (distance < 30) {
                      return (
                        <line
                          key={`${cluster.id}-${otherCluster.id}`}
                          x1={cluster.x}
                          y1={cluster.y}
                          x2={otherCluster.x}
                          y2={otherCluster.y}
                          stroke="#dee2e6"
                          strokeWidth="0.5"
                          strokeDasharray="2,2"
                        />
                      );
                    }
                    return null;
                  })
                )}

                {/* Cluster Nodes */}
                {clusters.map((cluster, index) => (
                  <g key={cluster.id}>
                    <motion.circle
                      cx={cluster.x}
                      cy={cluster.y}
                      r={cluster.size * 8}
                      fill={clusterColors[index % clusterColors.length]}
                      fillOpacity={0.8}
                      stroke="#1a1f3a"
                      strokeWidth="0.5"
                      style={{ cursor: 'pointer' }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleClusterClick(cluster.id)}
                    />
                    
                    {showLabels && (
                      <text
                        x={cluster.x}
                        y={cluster.y + cluster.size * 8 + 5}
                        textAnchor="middle"
                        fontSize="3"
                        fontFamily="monospace"
                        fontWeight="bold"
                        fill="#1a1f3a"
                        style={{ pointerEvents: 'none' }}
                      >
                        {cluster.name}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
              )}
            </div>
          </div>

          {/* Cluster Details */}
          <div className="border-4 border-[#1a1f3a] bg-white p-6 relative">
            <h2 className="text-xl font-black text-[#1a1f3a] uppercase mb-6">Cluster Details</h2>
            
            {activeCluster ? (
              <div className="space-y-6">
                {(() => {
                  const cluster = clusters.find(c => c.id === activeCluster);
                  if (!cluster) return null;
                  
                  return (
                    <>
                      <div>
                        <h3 className="text-lg font-black uppercase mb-2" style={{ color: clusterColors[clusters.indexOf(cluster) % clusterColors.length] }}>
                          {cluster.name}
                        </h3>
                        <div className="flex gap-6 font-mono text-sm text-[#6c757d]">
                          <p>PAPERS: <span className="font-bold text-[#1a1f3a]">{cluster.papers}</span></p>
                          <p>DENSITY: <span className="font-bold text-[#1a1f3a]">{(cluster.density * 100).toFixed(1)}%</span></p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-[#1a1f3a] uppercase text-sm mb-3 border-b-2 border-[#dee2e6] pb-2">
                          Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {cluster.keywords.map((keyword, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 font-mono text-xs uppercase tracking-wider border-2 border-[#1a1f3a]"
                              style={{ 
                                backgroundColor: clusterColors[clusters.indexOf(cluster) % clusterColors.length] + '20',
                                color: '#1a1f3a'
                              }}
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-[#1a1f3a] uppercase text-sm mb-3 border-b-2 border-[#dee2e6] pb-2">
                          Papers in Cluster
                        </h4>
                        <div className="space-y-3">
                          {cluster.paper_ids?.map((paperId: string, i: number) => {
                            const paper = allPapers?.find(p => p.id === paperId);
                            if (!paper) return null;
                            return (
                              <button
                                key={i}
                                onClick={() => handlePaperClick(paper.id)}
                                className="w-full text-left p-3 border-2 border-[#dee2e6] hover:border-[#1a1f3a] transition-colors group"
                              >
                                <div className="font-bold text-[#1a1f3a] group-hover:text-[#c9302c] transition-colors mb-1 line-clamp-1">
                                  {paper.title}
                                </div>
                                <div className="font-mono text-xs text-[#6c757d] line-clamp-1">
                                  {paper.authors?.join(', ')}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-12 h-full flex flex-col justify-center">
                <p className="font-mono text-[#6c757d] uppercase tracking-wider border-2 border-dashed border-[#dee2e6] p-6">
                  Select a cluster from the visualization to view details
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="border-4 border-[#1a1f3a] bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#1a1f3a] flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-[#1a1f3a] leading-none mb-1">
                  {clusters.length}
                </p>
                <p className="font-mono text-xs text-[#6c757d] uppercase tracking-wider">
                  Total Clusters
                </p>
              </div>
            </div>
          </div>

          <div className="border-4 border-[#1a1f3a] bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#28a745] flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-[#1a1f3a] leading-none mb-1">
                  {clusters.reduce((sum, c) => sum + c.papers, 0)}
                </p>
                <p className="font-mono text-xs text-[#6c757d] uppercase tracking-wider">
                  Total Papers
                </p>
              </div>
            </div>
          </div>

          <div className="border-4 border-[#1a1f3a] bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#8b5cf6] flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-[#1a1f3a] leading-none mb-1">
                  {clusters.length ? (clusters.reduce((sum, c) => sum + c.density, 0) / clusters.length * 100).toFixed(1) : 0}%
                </p>
                <p className="font-mono text-xs text-[#6c757d] uppercase tracking-wider">
                  Avg Density
                </p>
              </div>
            </div>
          </div>

          <div className="border-4 border-[#1a1f3a] bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#c9302c] flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-[#1a1f3a] leading-none mb-1 line-clamp-1">
                  {selectedAlgorithm.toUpperCase()}
                </p>
                <p className="font-mono text-xs text-[#6c757d] uppercase tracking-wider">
                  Algorithm
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClustersView;
