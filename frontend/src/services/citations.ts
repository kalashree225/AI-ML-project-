import api from './api';

export interface CitationNode {
  id: string;
  title: string;
  authors: string[];
  year: number;
  citation_count: number;
  pagerank?: number;
}

export interface CitationEdge {
  source: string;
  target: string;
  weight?: number;
}

export interface CitationGraph {
  nodes: CitationNode[];
  edges: CitationEdge[];
  metrics: {
    total_papers: number;
    total_citations: number;
    avg_citations: number;
  };
}

export const citationsService = {
  getCitationGraph: async (paperIds?: string[]): Promise<CitationGraph> => {
    const params = paperIds ? { paper_ids: paperIds.join(',') } : {};
    const { data } = await api.get('/citations/graph/', { params });
    return data;
  },

  getPaperCitations: async (paperId: string) => {
    const { data } = await api.get(`/papers/${paperId}/citations/`);
    return data;
  },
};
