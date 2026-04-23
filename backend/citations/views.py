from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Count
from papers.models import Paper, Citation, DocumentChunk
from papers.sync_tasks import extract_citations_sync
from collections import defaultdict

@api_view(['GET'])
@permission_classes([AllowAny])
def citation_graph(request):
    paper_ids = request.GET.get('paper_ids', '').split(',') if request.GET.get('paper_ids') else []

    if paper_ids:
        # Fetch ego network (1-hop citations)
        root_papers = list(Paper.objects.filter(id__in=paper_ids))
        
        # Papers cited by root papers
        cited_by_root = Paper.objects.filter(citations_received__citing_paper__in=root_papers)
        
        # Papers citing root papers
        citing_root = Paper.objects.filter(citations_made__cited_paper__in=root_papers)
        
        # Combine all papers (root + 1 hop out + 1 hop in)
        papers = list(set(root_papers) | set(cited_by_root) | set(citing_root))
    else:
        papers = list(Paper.objects.all()[:50])

    paper_id_set = {str(p.id) for p in papers}

    # Single query for all citation counts
    citation_counts = {
        str(row['citing_paper_id']): row['cnt']
        for row in Citation.objects.filter(citing_paper__in=papers)
        .values('citing_paper_id')
        .annotate(cnt=Count('id'))
    }

    nodes = [
        {
            'id': str(p.id),
            'title': p.title,
            'authors': p.authors,
            'year': p.uploaded_at.year,
            'citation_count': citation_counts.get(str(p.id), 0),
            'status': p.status,
        }
        for p in papers
    ]

    # Single query for all edges
    all_citations = Citation.objects.filter(
        citing_paper__in=papers,
        cited_paper__in=papers,
    ).values('citing_paper_id', 'cited_paper_id')

    edge_weights: dict = defaultdict(int)
    for row in all_citations:
        src, tgt = str(row['citing_paper_id']), str(row['cited_paper_id'])
        if src != tgt:
            edge_weights[(src, tgt)] += 1

    # Co-citation: papers sharing cited targets — single query
    co_cite: dict = defaultdict(set)
    for row in Citation.objects.filter(citing_paper__in=papers).values('citing_paper_id', 'cited_paper_id'):
        if row['cited_paper_id']:
            co_cite[str(row['citing_paper_id'])].add(row['cited_paper_id'])

    paper_list = [str(p.id) for p in papers]
    for i, pid1 in enumerate(paper_list):
        for pid2 in paper_list[i + 1:]:
            common = len(co_cite.get(pid1, set()) & co_cite.get(pid2, set()))
            if common > 0:
                edge_weights[(pid1, pid2)] = edge_weights.get((pid1, pid2), 0) + common

    edges = [
        {'source': src, 'target': tgt, 'weight': w, 'type': 'citation'}
        for (src, tgt), w in edge_weights.items()
    ]

    return Response({
        'nodes': nodes,
        'edges': edges,
        'metrics': {
            'total_papers': len(nodes),
            'total_citations': len(edges),
            'avg_citations': len(edges) / len(nodes) if nodes else 0,
        },
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def paper_citations(request, paper_id):
    try:
        paper = Paper.objects.get(id=paper_id)
        citations = Citation.objects.filter(citing_paper=paper)
        
        citation_data = []
        for citation in citations:
            citation_info = {
                'cited_title': citation.cited_title,
                'context': getattr(citation, 'context', ''),
                'doi': citation.doi,
                'arxiv_id': citation.arxiv_id,
            }
            
            # Add cited paper info if available
            if citation.cited_paper:
                citation_info['cited_paper'] = {
                    'id': str(citation.cited_paper.id),
                    'title': citation.cited_paper.title,
                    'authors': citation.cited_paper.authors
                }
            
            citation_data.append(citation_info)
        
        return Response({
            'paper_id': str(paper.id),
            'paper_title': paper.title,
            'citations': citation_data,
            'total_citations': len(citation_data)
        })
    except Paper.DoesNotExist:
        return Response({'error': 'Paper not found'}, status=404)


@api_view(['POST'])
@permission_classes([AllowAny])
def extract_citations(request):
    """Extract citations from papers."""
    try:
        paper_ids = request.data.get('paper_ids', [])
        
        if not paper_ids:
            return Response({'error': 'No paper IDs provided'}, status=400)
        
        results = []
        for paper_id in paper_ids:
            try:
                # Trigger synchronous citation extraction
                task_result = extract_citations_sync(paper_id)
                results.append({
                    'paper_id': paper_id,
                    'status': task_result.get('status', 'started')
                })
            except Exception as e:
                results.append({
                    'paper_id': paper_id,
                    'status': 'failed',
                    'error': str(e)
                })
        
        return Response({
            'message': 'Citation extraction started',
            'results': results
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def citation_statistics(request):
    """Get citation statistics."""
    try:
        total_papers = Paper.objects.count()
        total_citations = Citation.objects.count()

        # Top cited papers — single aggregated query, no N+1
        from django.db.models import Count as DCount
        top_cited = (
            Citation.objects
            .values('citing_paper__id', 'citing_paper__title')
            .annotate(citation_count=DCount('id'))
            .order_by('-citation_count')[:5]
        )

        return Response({
            'total_papers': total_papers,
            'total_citations': total_citations,
            'avg_citations_per_paper': total_citations / total_papers if total_papers > 0 else 0,
            'top_cited_papers': [
                {
                    'paper_id': str(row['citing_paper__id']),
                    'title': row['citing_paper__title'],
                    'citation_count': row['citation_count'],
                }
                for row in top_cited
            ],
        })

    except Exception as e:
        return Response({'error': str(e)}, status=500)
