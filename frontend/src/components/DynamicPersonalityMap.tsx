import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import styled from 'styled-components';
import { DynamicProfile, DynamicConnection, D3Node, D3Link } from '../types';

interface DynamicPersonalityMapProps {
  profile: DynamicProfile;
}

const Container = styled.div`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 1.5rem;
  margin: 1rem 0;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 20%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 70% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }
`;

const Title = styled.h3`
  color: white;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const SVGWrapper = styled.div`
  width: 100%;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0.5rem 0;
`;

const Legend = styled.div`
  display: flex;
  gap: 0.8rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: white;
  font-size: 0.75rem;
  padding: 0.3rem 0.6rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const LegendColor = styled.div<{ color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.color};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`;

const InconsistenciesList = styled.div`
  margin-top: 1rem;
  padding: 0.8rem;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 107, 107, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 107, 107, 0.3);
`;

const InconsistencyItem = styled.div`
  color: #ff6b6b;
  margin-bottom: 0.4rem;
  font-size: 0.8rem;
  padding: 0.3rem;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 6px;
  border-left: 2px solid #ff6b6b;
`;

const Tooltip = styled.div<{ visible: boolean; x: number; y: number }>`
  position: absolute;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  max-width: 200px;
  z-index: 1000;
  opacity: ${props => props.visible ? 1 : 0};
  transform: ${props => props.visible ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.3s ease;
  pointer-events: none;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  h4 {
    margin: 0 0 0.2rem 0;
    color: #667eea;
    font-size: 0.9rem;
  }
  
  p {
    margin: 0.1rem 0;
    opacity: 0.9;
    font-size: 0.75rem;
  }
`;

const DynamicPersonalityMap: React.FC<DynamicPersonalityMapProps> = ({ profile }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data: any;
  }>({
    visible: false,
    x: 0,
    y: 0,
    data: null
  });

  useEffect(() => {
    if (!profile || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;

    // отслеживаем положение курсора для корректировки тултипа без глобального event
    const onMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    container.addEventListener('mousemove', onMouseMove);
    const width = container.clientWidth - 20;
    const height = 400;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const traits: D3Node[] = Object.entries(profile.traits).map(([name, data]) => ({
      id: name,
      score: data.score,
      level: data.level,
      description: data.description,
      recommendations: data.recommendations,
      stability: data.stability,
      variance: data.variance,
      test_count: data.test_count,
      evolution: data.evolution
    }));

    const d3Links: D3Link[] = profile.connections.map(conn => ({
      source: conn.from,
      target: conn.to,
      strength: conn.strength,
      type: conn.type,
      correlation: conn.correlation,
      description: conn.description
    }));

    // Улучшенная симуляция с более компактным расположением
    const simulation = d3.forceSimulation<D3Node>(traits)
      .force("link", d3.forceLink<D3Node, D3Link>(d3Links).id((d: D3Node) => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(35))
      .force("x", d3.forceX(width / 2).strength(0.2))
      .force("y", d3.forceY(height / 2).strength(0.2))
      .alphaDecay(0.03)
      .velocityDecay(0.5);

    // Градиенты для узлов
    const defs = svg.append("defs");
    
    traits.forEach(trait => {
      const gradient = defs.append("radialGradient")
        .attr("id", `gradient-${trait.id}`)
        .attr("cx", "30%")
        .attr("cy", "30%");
      
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", getNodeColor(trait.score))
        .attr("stop-opacity", 0.9);
      
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", getNodeColor(trait.score))
        .attr("stop-opacity", 0.5);
    });

    // Связи
    const links = svg.append("g")
      .selectAll("line")
      .data(profile.connections)
      .enter()
      .append("line")
      .attr("stroke", (d: DynamicConnection) => {
        if (d.type === 'inconsistency') return "#ff6b6b";
        return d.correlation && d.correlation > 0 ? "#4CAF50" : "#FF9800";
      })
      .attr("stroke-width", (d: DynamicConnection) => Math.max(1, d.strength / 15))
      .attr("stroke-dasharray", (d: DynamicConnection) => 
        d.type === 'inconsistency' ? "4,2" : "none"
      )
      .attr("opacity", 0.5)
      .attr("stroke-linecap", "round");

    // Узлы
    const nodes = svg.append("g")
      .selectAll("g")
      .data(traits)
      .enter()
      .append("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Круги узлов (только круги, без текста)
    nodes.append("circle")
      .attr("r", (d: any) => Math.max(18, d.score / 3.5))
      .attr("fill", (d: any) => `url(#gradient-${d.id})`)
      .attr("stroke", (d: any) => {
        const inconsistency = profile.inconsistencies.find(inc => inc.trait === d.id);
        return inconsistency ? "#ff6b6b" : "rgba(255, 255, 255, 0.8)";
      })
      .attr("stroke-width", (d: any) => {
        const inconsistency = profile.inconsistencies.find(inc => inc.trait === d.id);
        return inconsistency ? 2.5 : 1.5;
      })
      .attr("filter", "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3))")
      .on("mouseover", function(event, d: any) {
        const padding = 12;
        const ttWidth = 220; // примерно как max-width
        const ttHeight = 120; // примерная высота
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        let tx = event.clientX + padding;
        let ty = event.clientY + padding;
        // если уходит за правый край
        if (tx + ttWidth > viewportW) tx = event.clientX - ttWidth - padding;
        // если уходит за нижний край
        if (ty + ttHeight > viewportH) ty = event.clientY - ttHeight - padding;
        // учитываем позицию контейнера
        const rect = container.getBoundingClientRect();
        tx = Math.max(0, Math.min(viewportW - ttWidth, tx)) - rect.left;
        ty = Math.max(0, Math.min(viewportH - ttHeight, ty)) - rect.top;
        setTooltip({ visible: true, x: tx, y: ty, data: d });
        d3.select(this)
          .attr("stroke-width", 3)
          .attr("r", (d: any) => Math.max(22, d.score / 3.5) + 2);
      })
      .on("mouseout", function(event, d: any) {
        setTooltip(prev => ({ ...prev, visible: false }));
        const inconsistency = profile.inconsistencies.find(inc => inc.trait === d.id);
        d3.select(this)
          .attr("stroke-width", inconsistency ? 2.5 : 1.5)
          .attr("r", (d: any) => Math.max(18, d.score / 3.5));
      });

    // Баллы внутри кругов (маленькие)
    nodes.append("text")
      .text((d: any) => d.score)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .attr("text-shadow", "0 1px 2px rgba(0, 0, 0, 0.8)");

    // Названия узлов ВНЕ кругов (справа)
    nodes.append("text")
      .text((d: any) => d.id)
      .attr("text-anchor", "start")
      .attr("dx", "25")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("text-shadow", "0 1px 2px rgba(0, 0, 0, 0.8)");

    // Обновление позиций с ограничениями
    simulation.on("tick", () => {
      links
        .attr("x1", (d: any) => Math.max(15, Math.min(width - 15, d.source.x)))
        .attr("y1", (d: any) => Math.max(15, Math.min(height - 15, d.source.y)))
        .attr("x2", (d: any) => Math.max(15, Math.min(width - 15, d.target.x)))
        .attr("y2", (d: any) => Math.max(15, Math.min(height - 15, d.target.y)));

      nodes
        .attr("transform", (d: any) => {
          const x = Math.max(25, Math.min(width - 80, d.x)); // Оставляем место для текста
          const y = Math.max(25, Math.min(height - 25, d.y));
          return `translate(${x},${y})`;
        });
      // если тултип открыт, подвинем его ближе к последней позиции курсора
      if (tooltip.visible) {
        const padding = 12;
        const ttWidth = 220;
        const ttHeight = 120;
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const rect = container.getBoundingClientRect();
        const cx = mousePosRef.current.x;
        const cy = mousePosRef.current.y;
        const mx = Math.max(0, Math.min(viewportW - ttWidth, cx + padding)) - rect.left;
        const my = Math.max(0, Math.min(viewportH - ttHeight, cy + padding)) - rect.top;
        setTooltip(prev => ({ ...prev, x: mx, y: my }));
      }
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
      container.removeEventListener('mousemove', onMouseMove);
    };
  }, [profile]);

  // Улучшенная цветовая палитра
  const getNodeColor = (score: number) => {
    if (score >= 80) return "#00C851"; // Яркий зеленый
    if (score >= 60) return "#33B5E5"; // Голубой
    if (score >= 40) return "#FFBB33"; // Оранжевый
    if (score >= 20) return "#FF6B6B"; // Красный
    return "#9933CC"; // Фиолетовый
  };

  return (
    <Container>
      <Title>Динамическая карта личности</Title>
      
      <SVGWrapper ref={containerRef}>
        <svg
          ref={svgRef}
          style={{ display: 'block', margin: '0 auto' }}
        />
      </SVGWrapper>

      <Legend>
        <LegendItem>
          <LegendColor color="#00C851" />
          <span>Высокий (80-100)</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#33B5E5" />
          <span>Хороший (60-79)</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#FFBB33" />
          <span>Средний (40-59)</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#FF6B6B" />
          <span>Низкий (20-39)</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#9933CC" />
          <span>Очень низкий (0-19)</span>
        </LegendItem>
        <LegendItem>
          <div style={{ width: '12px', height: '1px', background: '#4CAF50', borderRadius: '1px' }}></div>
          <span>Положительная связь</span>
        </LegendItem>
        <LegendItem>
          <div style={{ width: '12px', height: '1px', background: '#FF9800', borderRadius: '1px' }}></div>
          <span>Отрицательная связь</span>
        </LegendItem>
        <LegendItem>
          <div style={{ width: '12px', height: '1px', background: '#ff6b6b', borderTop: '1px dashed #ff6b6b' }}></div>
          <span>Несоответствие</span>
        </LegendItem>
      </Legend>

      {profile.inconsistencies.length > 0 && (
        <InconsistenciesList>
          <h4 style={{ color: '#ff6b6b', marginBottom: '0.6rem', textAlign: 'center', fontSize: '0.9rem' }}>
            ⚠️ Обнаруженные несоответствия
          </h4>
          {profile.inconsistencies.map((inc, index) => (
            <InconsistencyItem key={index}>
              • {inc.description}
            </InconsistencyItem>
          ))}
        </InconsistenciesList>
      )}

      <Tooltip 
        visible={tooltip.visible} 
        x={tooltip.x} 
        y={tooltip.y}
      >
        {tooltip.data && (
          <>
            <h4>{tooltip.data.id}</h4>
            <p><strong>Балл:</strong> {tooltip.data.score}</p>
            <p><strong>Уровень:</strong> {tooltip.data.level}</p>
            <p><strong>Стабильность:</strong> {tooltip.data.stability}</p>
            <p><strong>Тестов:</strong> {tooltip.data.test_count}</p>
            <p><strong>Описание:</strong> {tooltip.data.description}</p>
          </>
        )}
      </Tooltip>
    </Container>
  );
};

export default DynamicPersonalityMap;
