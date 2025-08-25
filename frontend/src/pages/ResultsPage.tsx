import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styled from 'styled-components';
import axios from 'axios';
import * as d3 from 'd3';
import { TestResult, PersonalityMap, TraitInfo } from '../types';

const ResultsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  color: white;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.8;
`;

const PersonalityMapContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  position: relative;
`;

const MapCanvas = styled.div`
  width: 100%;
  height: 600px;
  position: relative;
  overflow: hidden;
`;

const Tooltip = styled.div`
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  max-width: 300px;
  z-index: 1000;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  &.visible {
    opacity: 1;
  }
`;

const TraitDetails = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const TraitGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const TraitCard = styled.div<{ color: string }>`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 1.5rem;
  border-left: 4px solid ${props => props.color};
`;

const TraitName = styled.h3<{ color: string }>`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: ${props => props.color};
`;

const TraitScore = styled.div`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const TraitLevel = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 1rem;
`;

const TraitDescription = styled.p`
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 1rem;
`;

const TraitRecommendations = styled.p`
  font-size: 0.9rem;
  line-height: 1.4;
  font-style: italic;
  opacity: 0.9;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
`;

const Disclaimer = styled.div`
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 14px 16px;
  color: rgba(255,255,255,0.9);
  font-size: 0.95rem;
  line-height: 1.5;
`;

const Button = styled.button`
  padding: 1rem 2rem;
  border-radius: 25px;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
  }
  
  &.secondary {
    background: transparent;
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.5);
    
    &:hover {
      border-color: white;
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 2rem 0;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid rgba(255, 107, 107, 0.5);
  color: #ff6b6b;
  padding: 1rem;
  border-radius: 10px;
  margin: 2rem 0;
  text-align: center;
`;

interface TooltipState {
  visible: boolean;
  content: string;
  x: number;
  y: number;
}

interface TraitNode {
  id: string;
  score: number;
  level: string;
  description: string;
  recommendations: string;
  x?: number;
  y?: number;
}

interface TraitLink {
  source: string;
  target: string;
  strength: number;
}

const ResultsPage: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, content: '', x: 0, y: 0 });
  
  const mapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchResult();
    } else {
      navigate('/login');
    }
  }, [resultId, isAuthenticated, navigate]);

  useEffect(() => {
    if (result && mapRef.current) {
      createPersonalityMap();
    }
  }, [result]);

  const fetchResult = async (): Promise<void> => {
    try {
      const response = await axios.get<TestResult>(`/api/results/${resultId}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setResult(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching result:', err);
      setError('Ошибка загрузки результатов');
      setLoading(false);
    }
  };

  const createPersonalityMap = (): void => {
    if (!result || !result.personality_map || !mapRef.current) return;

    const traits = result.personality_map.traits;
    const connections = result.personality_map.connections || [];
    
    // Очищаем предыдущий SVG
    d3.select(mapRef.current).selectAll("*").remove();
    
    const width = mapRef.current.clientWidth;
    const height = 600;
    
    const svg = d3.select(mapRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height);
    
    // Создаем симуляцию для расположения узлов
    const simulation = d3.forceSimulation<TraitNode>()
      .force("link", d3.forceLink<TraitNode, TraitLink>().id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));
    
    // Создаем узлы (черты личности)
    const nodes: TraitNode[] = Object.keys(traits).map(trait => ({
      id: trait,
      score: traits[trait].score,
      level: traits[trait].level,
      description: traits[trait].description,
      recommendations: traits[trait].recommendations
    }));
    
    // Создаем связи между чертами
    const links: TraitLink[] = connections.map(conn => ({
      source: conn.from,
      target: conn.to,
      strength: conn.strength
    }));
    
    // Добавляем связи
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#667eea")
      .attr("stroke-width", (d: TraitLink) => d.strength / 20)
      .attr("opacity", 0.6);
    
    // Добавляем узлы
    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("r", (d: TraitNode) => Math.max(20, d.score / 3))
      .attr("fill", (d: TraitNode) => getTraitColor(d.score))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", (event: MouseEvent, d: TraitNode) => {
        const rec = (d.recommendations || '').trim();
        const recHtml = rec ? `<br/><br/><em>${rec}</em>` : '';
        setTooltip({
          visible: true,
          content: `
            <strong>${d.id}</strong><br/>
            Балл: ${d.score}/100<br/>
            Уровень: ${d.level}<br/>
            <br/>${d.description}${recHtml}
          `,
          x: event.pageX + 10,
          y: event.pageY - 10
        });
      })
      .on("mouseout", () => {
        setTooltip({ ...tooltip, visible: false });
      });
    
    // Добавляем подписи к узлам
    const labels = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .enter().append("text")
      .text((d: TraitNode) => d.id)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("font-weight", "600");
    
    // Обновляем симуляцию
    simulation
      .nodes(nodes)
      .on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);
        
        node
          .attr("cx", (d: TraitNode) => d.x!)
          .attr("cy", (d: TraitNode) => d.y!);
        
        labels
          .attr("x", (d: TraitNode) => d.x!)
          .attr("y", (d: TraitNode) => d.y!);
      });
    
    const linkForce = simulation.force("link") as d3.ForceLink<TraitNode, TraitLink>;
    if (linkForce) {
      linkForce.links(links);
    }
  };

  const getTraitColor = (score: number): string => {
    if (score >= 80) return "#4CAF50"; // Зеленый для высоких баллов
    if (score >= 60) return "#8BC34A"; // Светло-зеленый
    if (score >= 40) return "#FFC107"; // Желтый
    if (score >= 20) return "#FF9800"; // Оранжевый
    return "#F44336"; // Красный для низких баллов
  };

  const handleSaveToHistory = (): void => {
    // Результат уже сохранен в базе данных
    navigate('/history');
  };

  if (loading) {
    return (
      <ResultsContainer>
        <LoadingMessage>Загрузка результатов...</LoadingMessage>
      </ResultsContainer>
    );
  }

  if (error) {
    return (
      <ResultsContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </ResultsContainer>
    );
  }

  if (!result) {
    return (
      <ResultsContainer>
        <ErrorMessage>Результаты не найдены</ErrorMessage>
      </ResultsContainer>
    );
  }

  const traits = result.personality_map?.traits || {};

  return (
    <ResultsContainer>
      <Header>
        <Title>Ваша карта личности</Title>
        <Subtitle>
          Тест: {result.test?.name} • Завершен: {new Date(result.completed_at).toLocaleDateString('ru-RU')}
        </Subtitle>
      </Header>

      <PersonalityMapContainer>
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Интерактивная карта личности</h2>
        <MapCanvas ref={mapRef}>
          <Tooltip 
            className={tooltip.visible ? 'visible' : ''}
            style={{ left: tooltip.x, top: tooltip.y }}
            dangerouslySetInnerHTML={{ __html: tooltip.content }}
          />
        </MapCanvas>
      </PersonalityMapContainer>

      <TraitDetails>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Детальный анализ черт личности</h2>
        <TraitGrid>
          {Object.entries(traits).map(([traitName, traitData]) => (
            <TraitCard key={traitName} color={getTraitColor(traitData.score)}>
              <TraitName color={getTraitColor(traitData.score)}>{traitName}</TraitName>
              <TraitScore>{traitData.score}/100</TraitScore>
              <TraitLevel>{traitData.level}</TraitLevel>
              <TraitDescription>{traitData.description}</TraitDescription>
              {traitData.recommendations && traitData.recommendations.trim() !== '' && (
                <TraitRecommendations>{traitData.recommendations}</TraitRecommendations>
              )}
            </TraitCard>
          ))}
        </TraitGrid>
      </TraitDetails>

      <ActionButtons>
        <Button className="secondary" onClick={() => navigate('/')}>
          На главную
        </Button>
        <Button className="primary" onClick={handleSaveToHistory}>
          Сохранить в историю
        </Button>
      </ActionButtons>

      <Disclaimer>
        Важно: представленные результаты не являются медицинским диагнозом и не заменяют консультацию
        специалиста. Это ориентировочная интерпретация, основанная на ваших ответах и эмпирических
        моделях. Если вы испытываете выраженные симптомы или сомнения, обратитесь к клиническому
        психологу или врачу‑психотерапевту.
      </Disclaimer>
    </ResultsContainer>
  );
};

export default ResultsPage;
