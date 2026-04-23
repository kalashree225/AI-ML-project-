import api from './api';

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract?: string;
  file_url?: string;
  arxiv_id?: string;
  status: 'uploading' | 'processing' | 'extracting' | 'chunking' | 'embedding' | 'ready' | 'failed';
  uploaded_at: string;
  processed_at?: string;
  content_hash?: string;
  metadata?: any;
  total_pages?: number;
  extraction_progress?: number;
  processing_error?: string;
  chunk_count?: number;
}

export interface PaperSummary {
  overall_summary?: string;
  sections?: {
    main_contribution?: string;
    methodology?: string[];
    key_results?: string;
    limitations?: string;
    future_work?: string;
  };
  paper_metadata?: {
    title: string;
    authors: string[];
    abstract: string;
  };
  error?: string;
}

export interface PaperComparison {
  comparison_text?: string;
  structured_comparison?: {
    similarities?: string;
    differences?: string;
    strengths?: Record<string, string>;
    weaknesses?: Record<string, string>;
    recommendations?: string;
  };
  papers?: Array<{
    id: string;
    title: string;
    authors: string[];
  }>;
  error?: string;
}

export interface PaperUploadResponse {
  id: string;
  status: string;
  message: string;
}

export const papersService = {
  uploadPDF: async (file: File): Promise<PaperUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await api.post('/papers/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  uploadArxivLink: async (arxivUrl: string): Promise<PaperUploadResponse> => {
    const { data } = await api.post('/papers/', {
      arxiv_url: arxivUrl,
    });
    return data;
  },

  getPaperStatus: async (paperId: string): Promise<Paper> => {
    const { data } = await api.get(`/papers/${paperId}/status/`);
    return data;
  },

  listPapers: async (): Promise<Paper[]> => {
    const { data } = await api.get('/papers/list/');
    return data;
  },

  getPaperSummary: async (paperId: string): Promise<PaperSummary> => {
    const { data } = await api.get(`/papers/${paperId}/summary/`);
    return data;
  },

  comparePapers: async (paperIds: string[]): Promise<PaperComparison> => {
    const { data } = await api.post('/papers/compare/', {
      paper_ids: paperIds,
    });
    return data;
  },

  deletePaper: async (paperId: string): Promise<void> => {
    await api.delete(`/papers/${paperId}/`);
  },
};
