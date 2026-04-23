import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Link as LinkIcon, CheckCircle, AlertCircle, Loader2, X, Eye } from 'lucide-react';
import { useUploadPDF, useUploadArxiv } from '../hooks/usePapers';
import { useNavigate } from 'react-router-dom';

interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  fileName?: string;
  error?: string;
}

const EnhancedUpload = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [arxivLink, setArxivLink] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle',
    fileName: '',
    error: ''
  });

  const uploadPDF = useUploadPDF();
  const uploadArxiv = useUploadArxiv();

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

  const handleFileUpload = useCallback((file: File) => {
    // Validate file
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadProgress({
        progress: 0,
        status: 'error',
        fileName: file.name,
        error: 'Only PDF files are allowed'
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadProgress({
        progress: 0,
        status: 'error',
        fileName: file.name,
        error: 'File size must be less than 10MB'
      });
      return;
    }

    setUploadProgress({
      progress: 0,
      status: 'uploading',
      fileName: file.name,
      error: ''
    });

    uploadPDF.mutate(file, {
      onSuccess: (data) => {
        if (data.status === 'processing') {
          setUploadProgress({
            progress: 50,
            status: 'processing',
            fileName: file.name,
            error: ''
          });
          
          // Poll for status
          const intervalId = setInterval(async () => {
            try {
              const token = localStorage.getItem('token') || '';
              const response = await fetch(`http://localhost:8000/api/papers/${data.id}/status/`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const statusData = await response.json();
              
              if (statusData.status === 'ready') {
                clearInterval(intervalId);
                setUploadProgress({
                  progress: 100,
                  status: 'success',
                  fileName: file.name,
                  error: ''
                });
                localStorage.setItem('uploadedPaperId', data.id);
                setTimeout(() => navigate(`/chat/${data.id}`), 1500);
              } else if (statusData.status === 'failed') {
                clearInterval(intervalId);
                setUploadProgress({
                  progress: 0,
                  status: 'error',
                  fileName: file.name,
                  error: 'Processing failed on the server'
                });
              }
            } catch (err) {
              console.error('Polling error:', err);
            }
          }, 2000);
          
        } else {
          setUploadProgress({
            progress: 100,
            status: 'success',
            fileName: file.name,
            error: ''
          });
          localStorage.setItem('uploadedPaperId', data.id);
          setTimeout(() => navigate(`/chat/${data.id}`), 1500);
        }
      },
      onError: (error) => {
        setUploadProgress({
          progress: 0,
          status: 'error',
          fileName: file.name,
          error: error.message || 'Upload failed'
        });
      }
    });
  }, [uploadPDF, navigate]);

  const handleArxivUpload = useCallback(() => {
    if (!arxivLink.trim()) {
      setUploadProgress({
        progress: 0,
        status: 'error',
        error: 'Please enter a valid arXiv URL'
      });
      return;
    }

    // Validate arXiv URL
    const arxivRegex = /arxiv\.org\/abs\/(\d+\.\d+)|arxiv:(\d+\.\d+)/;
    if (!arxivRegex.test(arxivLink)) {
      setUploadProgress({
        progress: 0,
        status: 'error',
        error: 'Invalid arXiv URL format'
      });
      return;
    }

    setUploadProgress({
      progress: 0,
      status: 'uploading',
      fileName: `arXiv:${arxivLink}`,
      error: ''
    });

    uploadArxiv.mutate(arxivLink, {
      onSuccess: (data) => {
        setUploadProgress({
          progress: 100,
          status: 'success',
          fileName: `arXiv:${arxivLink}`,
          error: ''
        });
        
        localStorage.setItem('uploadedPaperId', data.id);
        
        setTimeout(() => {
          navigate(`/chat/${data.id}`);
        }, 1500);
      },
      onError: (error) => {
        setUploadProgress({
          progress: 0,
          status: 'error',
          fileName: `arXiv:${arxivLink}`,
          error: error.message || 'arXiv import failed'
        });
      }
    });
  }, [uploadArxiv, navigate]);

  const clearUpload = useCallback(() => {
    setUploadProgress({
      progress: 0,
      status: 'idle',
      fileName: '',
      error: ''
    });
    setArxivLink('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const getStatusIcon = () => {
    switch (uploadProgress.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="animate-spin" />;
      case 'success':
        return <CheckCircle className="text-green-500" />;
      case 'error':
        return <AlertCircle className="text-red-500" />;
      default:
        return <UploadCloud />;
    }
  };

  const getStatusColor = () => {
    switch (uploadProgress.status) {
      case 'uploading':
      case 'processing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-4 mb-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary flex items-center justify-center text-white shadow-lg">
              <UploadCloud size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload Research Paper</h1>
              <p className="text-gray-600 text-lg">Add your research papers to start analyzing</p>
            </div>
          </motion.div>
        </div>

        {/* Upload Progress */}
        <AnimatePresence>
          {uploadProgress.status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <div className={`bg-white rounded-2xl border-2 p-6 shadow-lg ${
                uploadProgress.status === 'error' ? 'border-red-200' : 
                uploadProgress.status === 'success' ? 'border-green-200' : 'border-blue-200'
              }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-full ${
                    uploadProgress.status === 'error' ? 'bg-red-100' : 
                    uploadProgress.status === 'success' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {getStatusIcon()}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${getStatusColor()}`}>
                      {uploadProgress.status === 'uploading' && 'Uploading...'}
                      {uploadProgress.status === 'processing' && 'Processing...'}
                      {uploadProgress.status === 'success' && 'Upload Complete!'}
                      {uploadProgress.status === 'error' && 'Upload Failed'}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {uploadProgress.fileName && (
                        <>
                          <span className="font-medium">{uploadProgress.fileName}</span>
                          {uploadProgress.status === 'uploading' && ` - ${uploadProgress.progress}%`}
                        </>
                      )}
                    </p>
                    {uploadProgress.error && (
                      <p className="text-red-600 text-sm">{uploadProgress.error}</p>
                    )}
                  </div>
                  {uploadProgress.status !== 'success' && (
                    <button
                      onClick={clearUpload}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                {uploadProgress.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: `${uploadProgress.progress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-primary-600 rounded-full"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* File Upload */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileText className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Upload PDF File</h3>
                  <p className="text-gray-600 text-sm">Drag and drop or click to browse</p>
                </div>
              </div>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
                onDragOver={handleDrag}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <motion.div
                  animate={{ scale: dragActive ? 0.95 : 1 }}
                  className="pointer-events-none"
                >
                  <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 font-medium mb-2">
                    {dragActive ? 'Drop your PDF file here' : 'Drag & Drop PDF Here'}
                  </p>
                  <p className="text-gray-500 text-sm mb-4">or</p>
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Browse Files
                  </button>
                </motion.div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <p>• Maximum file size: 10MB</p>
                <p>• Supported formats: PDF only</p>
                <p>• Files are processed automatically</p>
              </div>
            </div>
          </motion.div>

          {/* arXiv Upload */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <LinkIcon className="text-purple-600" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Import from arXiv</h3>
                  <p className="text-gray-600 text-sm">Enter arXiv URL or ID</p>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={arxivLink}
                  onChange={(e) => setArxivLink(e.target.value)}
                  placeholder="https://arxiv.org/abs/2301.07041"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition-all"
                />
                
                <button
                  onClick={handleArxivUpload}
                  disabled={!arxivLink.trim() || uploadProgress.status === 'uploading'}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Import from arXiv
                </button>
              </div>

              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <p>• Enter full arXiv URL or ID (e.g., 2301.07041)</p>
                <p>• Papers are imported automatically</p>
                <p>• Processing time varies by paper size</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Uploads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Recent Uploads</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {[
                { title: 'Attention Is All You Need', authors: 'Vaswani et al.', date: '2024-01-15', status: 'ready' },
                { title: 'BERT: Pre-training of Deep Bidirectional Transformers', authors: 'Devlin et al.', date: '2024-01-20', status: 'ready' },
                { title: 'Generative Adversarial Networks', authors: 'Goodfellow et al.', date: '2024-02-01', status: 'processing' }
              ].map((paper, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all"
                  onClick={() => paper.status === 'ready' && navigate(`/chat/${index + 1}`)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{paper.title}</h4>
                    <p className="text-sm text-gray-600">{paper.authors}</p>
                    <p className="text-xs text-gray-500">{paper.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      paper.status === 'ready' ? 'bg-green-100 text-green-700' :
                      paper.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {paper.status}
                    </span>
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <Eye size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default EnhancedUpload;
