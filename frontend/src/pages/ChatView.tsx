import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, AlignLeft, BarChart3, Network, FileDown, ExternalLink, MessageSquare, ListFilter, Bot, Sparkles, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import { useChatSession } from '../hooks/useChat';
import { usePaperSummary } from '../hooks/usePapers';
import { useCitationGraph } from '../hooks/useCitations';
import { ChatWebSocket, type WebSocketMessage } from '../services/websocket';
import '../styles/design-system.css';

const ChatView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('summary');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const wsRef = useRef<ChatWebSocket | null>(null);

  const { data: session } = useChatSession(id || '');
  const { data: summary } = usePaperSummary(id || '');
  const { data: citationGraph } = useCitationGraph(id ? [id] : undefined);

  const tabs = [
    { id: 'summary', name: 'Summary', icon: <FileDown size={16} /> },
    { id: 'document', name: 'Document', icon: <AlignLeft size={16} /> },
    { id: 'analytics', name: 'Analytics', icon: <BarChart3 size={16} /> },
    { id: 'graph', name: 'Graph', icon: <Network size={16} /> },
    { id: 'compare', name: 'Compare', icon: <Sparkles size={16} /> },
  ];

  useEffect(() => {
    if (session?.messages) {
      setMessages(session.messages.map(m => ({ role: m.role, content: m.content })));
    }
  }, [session]);

  useEffect(() => {
    if (id) {
      wsRef.current = new ChatWebSocket();
      wsRef.current.connect(
        id,
        (msg: WebSocketMessage) => {
          if (msg.type === 'message' && msg.content) {
            setMessages(prev => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg?.role === 'assistant') {
                return [...prev.slice(0, -1), { ...lastMsg, content: (lastMsg.content || '') + msg.content }];
              }
              return [...prev, { role: 'assistant', content: msg.content || '' }];
            });
          } else if (msg.type === 'complete') {
            setIsStreaming(false);
          }
        }
      );

      return () => {
        wsRef.current?.disconnect();
      };
    }
  }, [id]);

  const handleSendMessage = useCallback(() => {
    if (input.trim() && !isStreaming && id) {
      setIsStreaming(true);
      const paperIds = session?.papers?.map(p => p.id) || [id];
      wsRef.current?.sendMessage(input, paperIds);
      setInput('');
    }
  }, [input, isStreaming, id, session]);

  // D3 Force Graph Effect
  useEffect(() => {
    if (activeTab !== 'graph' || !svgRef.current || !citationGraph) return;

    const nodes = citationGraph.nodes?.map(n => ({
      id: n.id,
      title: n.title,
      group: Math.floor(Math.random() * 4) + 1,
      val: n.citation_count || 20,
    })) || [];
    
    const links = citationGraph.edges?.map(e => ({
      source: e.source,
      target: e.target,
    })) || [];

    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#1a1f3a')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4');

    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes as any)
      .enter()
      .append('circle')
      .attr('r', (d: any) => Math.sqrt(d.val) * 3)
      .attr('fill', (d: any) => {
        const colors = ['#1a1f3a', '#c9302c', '#28a745', '#ffd700'];
        return colors[d.group % 4];
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3)
      .call(d3.drag()
        .on('start', (event: any, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event: any, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event: any, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any);

    const label = svg.append('g')
      .selectAll('text')
      .data(nodes as any)
      .enter()
      .append('text')
      .text((d: any) => d.title)
      .attr('font-size', 12)
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('fill', '#1a1f3a')
      .attr('text-anchor', 'middle')
      .attr('dy', -20)
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    return () => {
      simulation.stop();
    };
  }, [activeTab, citationGraph]);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-pattern relative z-10">
      
      {/* Sidebar - Chat Area */}
      <section className="w-[45%] flex flex-col border-r-4 border-[#1a1f3a] bg-white relative z-20">
        <div className="h-16 flex items-center justify-between px-6 border-b-4 border-[#1a1f3a]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="w-8 h-8 border-2 border-[#1a1f3a] hover:bg-[#1a1f3a] hover:text-white transition-all flex items-center justify-center"
            >
              <ArrowLeft size={16} />
            </button>
            <h2 className="font-black text-[#1a1f3a] uppercase tracking-wider">Research Assistant</h2>
            <span className="px-2 py-1 text-xs font-mono font-bold bg-[#1a1f3a] text-white uppercase">GPT-4 RAG</span>
          </div>
          <button className="text-[#1a1f3a] hover:text-[#c9302c] transition-colors">
            <ListFilter size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 border-2 border-[#1a1f3a] flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-[#ffd700]' : 'bg-[#1a1f3a] text-white'
                }`}>
                  {msg.role === 'user' ? <MessageSquare size={16} /> : <Bot size={18} />}
                </div>
                <div className={`max-w-[80%] p-4 border-2 border-[#1a1f3a] ${
                  msg.role === 'user' ? 'bg-[#f8f9fa]' : 'bg-white'
                }`}>
                  <p className="text-[#1a1f3a] font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  
                  {msg.role === 'assistant' && (
                    <div className="mt-4 pt-3 border-t-2 border-[#dee2e6] flex gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 border border-[#1a1f3a] bg-[#f8f9fa] text-xs font-mono uppercase hover:bg-[#1a1f3a] hover:text-white transition-colors cursor-pointer">
                        <ExternalLink size={12} /> Source
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t-4 border-[#1a1f3a] bg-white">
          <div className="relative flex items-end border-4 border-[#1a1f3a] bg-[#f8f9fa] focus-within:border-[#c9302c] transition-colors p-2 group">
            <textarea
              className="w-full bg-transparent border-none outline-none resize-none px-2 py-2 max-h-32 min-h-[44px] font-mono text-sm text-[#1a1f3a] placeholder:text-[#6c757d]"
              placeholder="ASK ABOUT METHODOLOGY, RESULTS, OR COMPARISONS..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if(input.trim() && !isStreaming) {
                    handleSendMessage();
                  }
                }
              }}
            />
            <button 
              className="flex items-center justify-center w-12 h-12 bg-[#1a1f3a] text-white shrink-0 hover:bg-[#c9302c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent group-focus-within:border-[#c9302c]"
              onClick={handleSendMessage}
              disabled={isStreaming || !input.trim()}
            >
              <Send size={20} className="translate-x-[-2px]" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="flex-1 flex flex-col relative z-10 w-[55%] bg-[#f8f9fa]">
        <div className="h-16 flex items-center px-6 border-b-4 border-[#1a1f3a] bg-white gap-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 h-full px-4 transition-all font-mono text-sm font-bold uppercase tracking-wider whitespace-nowrap border-b-4 ${
                activeTab === tab.id 
                  ? 'border-[#1a1f3a] text-[#1a1f3a] bg-[#f8f9fa]' 
                  : 'border-transparent text-[#6c757d] hover:text-[#1a1f3a] hover:bg-[#f8f9fa]'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {/* Summary Tab */}
          {activeTab === 'summary' && summary && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-8">
              <div className="p-8 border-4 border-[#1a1f3a] bg-white relative">
                <div className="absolute top-0 left-0 w-4 h-full bg-[#c9302c]"></div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#6c757d] mb-3 ml-4">Main Contribution</h3>
                <p className="text-xl font-medium leading-relaxed text-[#1a1f3a] ml-4">
                  {summary.sections?.main_contribution || 'Loading...'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="p-6 border-4 border-[#1a1f3a] bg-white">
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#1a1f3a] border-b-2 border-[#1a1f3a] pb-2 mb-4">Key Methodology</h3>
                  <ul className="space-y-4 text-sm">
                    {summary.sections?.methodology?.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 mt-1.5 shrink-0 bg-[#1a1f3a]" /> 
                        <span className="font-medium text-[#1a1f3a]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-8">
                  <div className="p-6 border-4 border-[#1a1f3a] bg-[#ffd700]">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#1a1f3a] mb-2">Results Summary</h3>
                    <p className="text-[#1a1f3a] font-medium">
                      {summary.sections?.key_results || 'Results not available'}
                    </p>
                  </div>
                  {summary.sections?.limitations && (
                    <div className="p-6 border-4 border-[#1a1f3a] bg-white">
                      <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#c9302c] mb-2">Limitations</h3>
                      <p className="text-sm font-medium leading-relaxed text-[#1a1f3a]">
                        {summary.sections.limitations}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Graph Tab */}
          {activeTab === 'graph' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black text-[#1a1f3a] uppercase">Citation Network</h3>
                  <p className="font-mono text-sm text-[#6c757d] uppercase tracking-wider">Interactive relationship visualization</p>
                </div>
                <div className="flex items-center gap-4">
                  <select className="px-4 py-2 border-2 border-[#1a1f3a] bg-white font-mono text-sm uppercase tracking-wider outline-none">
                    <option>Force-Directed Layout</option>
                    <option>Circular Layout</option>
                    <option>Hierarchical Layout</option>
                    <option>Cluster Layout</option>
                  </select>
                  <button className="btn btn-primary px-6 py-2">
                    Export Graph
                  </button>
                </div>
              </div>
              
              <div className="flex-1 w-full border-4 border-[#1a1f3a] bg-white relative overflow-hidden">
                <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>
              </div>
            </motion.div>
          )}

          {/* Other tabs can be added here */}
        </div>
      </section>
    </div>
  );
};

export default ChatView;
