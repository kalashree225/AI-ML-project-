import { useQuery } from '@tanstack/react-query';
import { citationsService } from '../services/citations';

export const useCitationGraph = (paperIds?: string[]) => {
  return useQuery({
    queryKey: ['citations', 'graph', paperIds],
    queryFn: () => citationsService.getCitationGraph(paperIds),
    enabled: paperIds !== undefined && paperIds.length > 0,
  });
};

export const usePaperCitations = (paperId: string) => {
  return useQuery({
    queryKey: ['citations', paperId],
    queryFn: () => citationsService.getPaperCitations(paperId),
    enabled: !!paperId,
  });
};
