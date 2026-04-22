import { useState, useCallback } from 'react';
import { useUploadPDF, useUploadArxiv } from './usePapers';

export interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  fileName?: string;
  error?: string;
  paperId?: string;
}

export const useUpload = () => {
  const [arxivLink, setArxivLink] = useState('');
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle',
    fileName: '',
    error: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const uploadPDFMutation = useUploadPDF();
  const uploadArxivMutation = useUploadArxiv();

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setUploadProgress({
        progress: 0,
        status: 'error',
        fileName: file.name,
        error: 'Only PDF files are supported'
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

    try {
      const response = await uploadPDFMutation.mutateAsync(file);
      setUploadProgress({
        progress: 100,
        status: 'success',
        fileName: file.name,
        paperId: response.id
      });
      setUploadedFiles(prev => [...prev, file.name]);
      localStorage.setItem('uploadedPaperId', response.id);
    } catch (err: any) {
      setUploadProgress({
        progress: 0,
        status: 'error',
        fileName: file.name,
        error: err?.message || 'Failed to upload PDF'
      });
    }
  }, [uploadPDFMutation]);

  const handleArxivUpload = useCallback(async () => {
    if (!arxivLink.trim()) {
      setUploadProgress({
        progress: 0,
        status: 'error',
        error: 'Please enter a valid arXiv URL'
      });
      return;
    }

    const arxivIdMatch = arxivLink.match(/arxiv\.org\/abs\/(.+)$/);
    const fileName = arxivIdMatch ? `arXiv-${arxivIdMatch[1]}.pdf` : 'arXiv-paper.pdf';

    setUploadProgress({
      progress: 0,
      status: 'uploading',
      fileName,
      error: ''
    });

    try {
      const response = await uploadArxivMutation.mutateAsync(arxivLink);
      setUploadProgress({
        progress: 100,
        status: 'success',
        fileName,
        paperId: response.id
      });
      setUploadedFiles(prev => [...prev, fileName]);
      setArxivLink('');
      localStorage.setItem('uploadedPaperId', response.id);
    } catch (err: any) {
      setUploadProgress({
        progress: 0,
        status: 'error',
        fileName,
        error: err?.message || 'Failed to upload arXiv paper'
      });
    }
  }, [arxivLink, uploadArxivMutation]);

  const resetUpload = useCallback(() => {
    setUploadProgress({
      progress: 0,
      status: 'idle',
      fileName: '',
      error: ''
    });
  }, []);

  return {
    arxivLink,
    setArxivLink,
    activeTab,
    setActiveTab,
    uploadProgress,
    uploadedFiles,
    handleFileUpload,
    handleArxivUpload,
    resetUpload
  };
};
