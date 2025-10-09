/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, no-unreachable */
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

const RadarContainer = styled.div`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
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
  const radarRef = useRef<SVGSVGElement>(null);
  const radarLettersRef = useRef<SVGSVGElement>(null);
  const attachmentRadarRef = useRef<SVGSVGElement>(null);
  const attachmentCrossRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchResult();
    } else {
      navigate('/login');
    }
  }, [resultId, isAuthenticated, navigate]);

  useEffect(() => {
    if (result) {
      createLetterRadarIfMBTI();
      createMbtiTypesRadar();
      createAttachmentRadarIfApplicable();
      createAttachmentCrossIfApplicable();
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
    // Отключено для страницы результата по требованию
    return; // полностью отключено

    const traits = (result as any).personality_map.traits;
    const connections = (result as any).personality_map.connections || [];
    
    // Очищаем предыдущий SVG
    d3.select(mapRef.current as any).selectAll("*").remove();
    
    const width = (mapRef.current as any).clientWidth;
    const height = 600;
    
    const svg = d3.select(mapRef.current as any)
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
            Балл: ${typeof (result?.personality_map?.traits?.[d.id]?.raw_score) === 'number' 
              ? `${result?.personality_map?.traits?.[d.id]?.raw_score}/${result?.personality_map?.traits?.[d.id]?.max_score} (${d.score}%)`
              : `${d.score}/100`}
            <br/>Уровень: ${d.level}<br/>
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

  // Убрали отдельную радар-диаграмму по дихотомиям

  const createLetterRadarIfMBTI = (): void => {
    if (!result) return;
    const testName = (result.test?.name || '').toLowerCase();
    const isMBTI = testName.includes('mbti');
    if (!isMBTI) return;

    const traits = result.personality_map?.traits || {};
    const keys = ['E','I','S','N','T','F','J','P'];

    const getScore = (key: string): number => {
      const entry = Object.entries(traits).find(([name]) => name.toLowerCase() === key.toLowerCase());
      return entry ? Math.max(0, Math.min(100, entry[1].score || 0)) : 0;
    };

    const data = keys.map(k => ({ axis: k, value: getScore(k) }));

    const container = d3.select('#mbti-letters-radar');
    container.selectAll('*').remove();

    const width = (container.node() as HTMLElement)?.clientWidth || 600;
    const height = 380;
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const angleSlice = (Math.PI * 2) / data.length;
    const rScale = d3.scaleLinear().range([0, radius]).domain([0, 100]);

    const levels = 5;
    for (let lvl = 1; lvl <= levels; lvl++) {
      const r = (radius / levels) * lvl;
      svg
        .append('circle')
        .attr('r', r)
        .style('fill', 'none')
        .style('stroke', 'rgba(255,255,255,0.25)')
        .style('stroke-dasharray', '2,2');
    }

    const axes = svg.selectAll('.axis')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'axis');

    axes
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', (_d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y2', (_d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
      .style('stroke', 'rgba(255,255,255,0.35)')
      .style('stroke-width', 1);

    axes
      .append('text')
      .attr('x', (_d, i) => (rScale(100) + 14) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (_d, i) => (rScale(100) + 14) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('dy', '0.35em')
      .style('fill', 'white')
      .style('font-size', '12px')
      .style('text-anchor', 'middle')
      .text(d => d.axis);

    const radarLine = d3
      .lineRadial<any>()
      .radius((d: any) => rScale(d.value))
      .angle((_d: any, i: number) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    svg
      .append('path')
      .datum(data)
      .attr('d', radarLine as any)
      .style('fill', 'rgba(76, 175, 80, 0.30)')
      .style('stroke', '#4CAF50')
      .style('stroke-width', 2);

    svg
      .selectAll('.radar-point')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'radar-point')
      .attr('r', 3.5)
      .attr('cx', (_d, i) => rScale(data[i].value) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('cy', (_d, i) => rScale(data[i].value) * Math.sin(angleSlice * i - Math.PI / 2))
      .style('fill', '#8b5cf6')
      .style('stroke', 'white')
      .style('stroke-width', 1.2);
  };

  const computeMbtiType = (): string | null => {
    if (!result) return null;
    const traits = result.personality_map?.traits || {};
    const pick = (a: string, b: string): string => {
      const av = (traits[a]?.score || 0);
      const bv = (traits[b]?.score || 0);
      return av >= bv ? a : b;
    };
    const e = pick('E','I');
    const s = pick('S','N');
    const t = pick('T','F');
    const j = pick('J','P');
    return `${e}${s}${t}${j}`;
  };

  const isAttachmentTest = (): boolean => {
    const name = (result?.test?.name || '').toLowerCase();
    const ttype = (result?.test as any)?.test_type || '';
    return name.includes('привязан') || name.includes('attachment') || ttype === 'attachment';
  };

  const createAttachmentRadarIfApplicable = (): void => {
    if (!result || !isAttachmentTest()) return;
    const traits = result.personality_map?.traits || {};
    const defs = result.test?.result_definitions || {};
    // Попытка извлечь известные ключи типов, иначе берём пересечение ключей defs и traits
    const preferredKeys = ['Secure','Anxious','Avoidant','Disorganized','Надёжная','Надежная','Тревожная','Избегающая','Дезорганизованная'];
    let keys = preferredKeys.filter(k => Object.prototype.hasOwnProperty.call(traits, k));
    if (keys.length < 3) {
      keys = Object.keys(traits).filter(k => Object.prototype.hasOwnProperty.call(defs, k));
    }
    if (keys.length < 3) return;

    const data = keys.map(k => ({ axis: k, value: Math.max(0, Math.min(100, traits[k]?.score || 0)) }));
    const container = d3.select('#attachment-radar');
    container.selectAll('*').remove();
    const width = (container.node() as HTMLElement)?.clientWidth || 600;
    const height = 420;
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const angleSlice = (Math.PI * 2) / data.length;
    const rScale = d3.scaleLinear().range([0, radius]).domain([0, 100]);

    const levels = 4;
    for (let lvl = 1; lvl <= levels; lvl++) {
      const r = (radius / levels) * lvl;
      svg.append('circle').attr('r', r).style('fill', 'none').style('stroke', 'rgba(255,255,255,0.25)').style('stroke-dasharray', '2,2');
    }

    const axes = svg.selectAll('.axis').data(data).enter().append('g').attr('class', 'axis');
    axes.append('line')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', (_d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y2', (_d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
      .style('stroke', 'rgba(255,255,255,0.35)');
    axes.append('text')
      .attr('x', (_d, i) => (rScale(100) + 12) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (_d, i) => (rScale(100) + 12) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('dy', '0.35em')
      .style('fill', 'white')
      .style('font-size', '12px')
      .style('text-anchor', 'middle')
      .text(d => d.axis);

    const radarLine = d3.lineRadial<any>()
      .radius((d: any) => rScale(d.value))
      .angle((_d: any, i: number) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    svg.append('path')
      .datum(data)
      .attr('d', radarLine as any)
      .style('fill', 'rgba(76, 175, 80, 0.35)')
      .style('stroke', '#4CAF50')
      .style('stroke-width', 2);
  };

  const findTrait = (keys: string[]): { name: string; value: number } | null => {
    if (!result) return null;
    const traits = result.personality_map?.traits || {};
    for (const k of keys) {
      const entry = Object.entries(traits).find(([name]) => name.toLowerCase() === k.toLowerCase());
      if (entry) return { name: entry[0], value: Math.max(0, Math.min(100, (entry[1] as any)?.score || 0)) };
    }
    return null;
  };

  // Крест (XY): X = избегание (лево-низко, право-высоко), Y = тревожность (низ-низкая, верх-высокая)
  const createAttachmentCrossIfApplicable = (): void => {
    if (!result || !isAttachmentTest()) return;
    const container = d3.select('#attachment-cross');
    container.selectAll('*').remove();

    // Ищем шкалы
    const anxious = findTrait(['Anxiety','Anxious','Тревожность','Тревожная']);
    const avoid = findTrait(['Avoidance','Avoidant','Избегание','Избегающая']);

    // Если прямых шкал нет — оценим по типам: Anxiety ≈ (Anxious + Disorganized)/2, Avoidance ≈ (Avoidant + Disorganized)/2
    let anxietyVal = anxious ? anxious.value : null;
    let avoidanceVal = avoid ? avoid.value : null;
    if (anxietyVal === null || avoidanceVal === null) {
      const traits = result.personality_map?.traits || {};
      const vAnx = (traits['Anxious']?.score ?? traits['Тревожная']?.score) ?? 0;
      const vAvd = (traits['Avoidant']?.score ?? traits['Избегающая']?.score) ?? 0;
      const vDis = (traits['Disorganized']?.score ?? traits['Дезорганизованная']?.score) ?? 0;
      anxietyVal = anxietyVal ?? Math.max(0, Math.min(100, (vAnx + vDis) / 2));
      avoidanceVal = avoidanceVal ?? Math.max(0, Math.min(100, (vAvd + vDis) / 2));
    }

    const width = (container.node() as HTMLElement)?.clientWidth || 600;
    const height = 420;
    const margin = { top: 20, right: 20, bottom: 30, left: 30 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Оси: 0..100 -> -1..1
    const x = d3.scaleLinear().domain([0, 100]).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);

    // Крест и сетка
    svg.append('line')
      .attr('x1', innerW / 2).attr('y1', 0)
      .attr('x2', innerW / 2).attr('y2', innerH)
      .attr('stroke', 'rgba(255,255,255,0.5)')
      .attr('stroke-dasharray', '4,4');
    svg.append('line')
      .attr('x1', 0).attr('y1', innerH / 2)
      .attr('x2', innerW).attr('y2', innerH / 2)
      .attr('stroke', 'rgba(255,255,255,0.5)')
      .attr('stroke-dasharray', '4,4');

    // Подписи квадрантов
    const labels = [
      { txt: 'Надёжная', x: innerW * 0.25, y: innerH * 0.75 },
      { txt: 'Тревожная', x: innerW * 0.25, y: innerH * 0.25 },
      { txt: 'Избегающая', x: innerW * 0.75, y: innerH * 0.75 },
      { txt: 'Дезорганизованная', x: innerW * 0.75, y: innerH * 0.25 },
    ];
    svg.selectAll('.quad-label')
      .data(labels)
      .enter().append('text')
      .attr('class', 'quad-label')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('fill', 'white')
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(d => d.txt);

    // Точка
    const px = x(avoidanceVal);
    const py = y(anxietyVal);
    const defs = svg.append('defs');
    const glow = defs.append('filter').attr('id', 'glowPoint');
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    const merge = glow.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    svg.append('circle')
      .attr('cx', px).attr('cy', py).attr('r', 7)
      .style('fill', '#4CAF50')
      .style('stroke', 'white')
      .style('stroke-width', 2)
      .style('filter', 'url(#glowPoint)');
  };

  const createMbtiTypesRadar = (): void => {
    if (!result) return;
    const testName = (result.test?.name || '').toLowerCase();
    const isMBTI = testName.includes('mbti');
    if (!isMBTI) return;

    const traits = result.personality_map?.traits || {};
    const val = (k: string) => Math.max(0, Math.min(100, traits[k]?.score || 0));
    const sumOrOne = (a: number, b: number) => Math.max(1, a + b);
    const pref = (aKey: string, bKey: string) => {
      const a = val(aKey);
      const b = val(bKey);
      return a / sumOrOne(a, b); // 0..1
    };

    const p = {
      E: pref('E','I'), I: pref('I','E'),
      S: pref('S','N'), N: pref('N','S'),
      T: pref('T','F'), F: pref('F','T'),
      J: pref('J','P'), P: pref('P','J'),
    } as Record<string, number>;

    const types = ['ISTJ','ISFJ','INFJ','INTJ','ISTP','ISFP','INFP','INTP','ESTP','ESFP','ENFP','ENTP','ESTJ','ESFJ','ENFJ','ENTJ'];
    const data = types.map(t => ({ axis: t, value: Math.round(100 * p[t[0]] * p[t[1]] * p[t[2]] * p[t[3]]) }));
    // Усиливаем видимость области: применим корневую шкалу и нижний порог
    const floor = 12; // минимальное заполнение в процентах
    const amplifiedData = data.map(d => ({
      axis: d.axis,
      value: Math.max(floor, Math.sqrt(d.value / 100) * 100)
    }));

    const container = d3.select('#mbti-types-radar');
    container.selectAll('*').remove();
    const width = Math.min((container.node() as HTMLElement)?.clientWidth || 500, 1200);
    const height = 380;
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const angleSlice = (Math.PI * 2) / data.length;
    const rScale = d3.scaleLinear().range([0, radius]).domain([0, 100]);

    const levels = 3;
    for (let lvl = 1; lvl <= levels; lvl++) {
      const r = (radius / levels) * lvl;
      svg
        .append('circle')
        .attr('r', r)
        .style('fill', 'none')
        .style('stroke', 'rgba(255,255,255,0.25)')
        .style('stroke-dasharray', '2,2');
    }

    const axes = svg.selectAll('.axis')
      .data(amplifiedData)
      .enter()
      .append('g')
      .attr('class', 'axis');

    axes
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', (_d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y2', (_d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
      .style('stroke', 'rgba(255,255,255,0.35)')
      .style('stroke-width', 1);

    axes
      .append('text')
      .attr('x', (_d, i) => (rScale(100) + 10) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (_d, i) => (rScale(100) + 10) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('dy', '0.35em')
      .style('fill', 'white')
      .style('font-size', '10px')
      .style('text-anchor', 'middle')
      .text(d => d.axis);

    const radarLine = d3
      .lineRadial<any>()
      .radius((d: any) => rScale(d.value))
      .angle((_d: any, i: number) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    // Glow фильтр для усиления области
    const defs = svg.append('defs');
    const glow = defs.append('filter').attr('id', 'glow');
    glow.append('feGaussianBlur').attr('stdDeviation', '3.5').attr('result', 'coloredBlur');
    const feMerge = glow.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    svg
      .append('path')
      .datum(amplifiedData)
      .attr('d', radarLine as any)
      .style('fill', 'rgba(76, 175, 80, 0.45)')
      .style('stroke', '#4CAF50')
      .style('stroke-width', 2.5)
      .style('filter', 'url(#glow)');

    // Точки на вершинах
    svg
      .selectAll('.radar-point-16')
      .data(amplifiedData)
      .enter()
      .append('circle')
      .attr('class', 'radar-point-16')
      .attr('r', 3)
      .attr('cx', (_d, i) => rScale(amplifiedData[i].value) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('cy', (_d, i) => rScale(amplifiedData[i].value) * Math.sin(angleSlice * i - Math.PI / 2))
      .style('fill', '#4CAF50')
      .style('stroke', 'white')
      .style('stroke-width', 1.2);
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

      {/* Интерактивная карта личности удалена на странице результата */}

      {/* Диаграммы для MBTI */}
      {((result.test?.name || '').toLowerCase().includes('mbti')) && Object.keys(traits).length > 0 && (
        <>
          {/* Радарная диаграмма по буквам (8 осей: E,I,S,N,T,F,J,P) */}
          <RadarContainer>
            <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Радарная диаграмма по шкалам (E, I, S, N, T, F, J, P)</h2>
            <div id="mbti-letters-radar" style={{ width: '100%', minHeight: 420 }} />
          </RadarContainer>

          {/* Радар 16-ти типов */}
          <RadarContainer>
            <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Распределение по 16 типам MBTI (радар)</h2>
            <div id="mbti-types-radar" style={{ width: '100%', minHeight: 400 }} />
          </RadarContainer>
        </>
      )}

      {/* Диаграмма для теста на стиль привязанности (оставляем только крест) */}
      {isAttachmentTest() && Object.keys(traits).length > 0 && (
        <RadarContainer>
          <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Карта стилей привязанности (крест тревожность/избегание)</h2>
          <div id="attachment-cross" style={{ width: '100%', minHeight: 420 }} />
        </RadarContainer>
      )}

  

      <TraitDetails>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Детальный анализ</h2>
        {(() => {
          const test = result.test;
          const defs = test?.result_definitions || {};
          const isMBTI = (test?.name || '').toLowerCase().includes('mbti');
          const isAttach = isAttachmentTest();

          // Для привязанности: выводим измерения (Closeness/Anxiety/Avoidance/Independence) с очками (max 6)
          // и определяем доминирующий СТИЛЬ по правилам (с бэка или локально)
          if (isAttach) {
            // собираем измерения
            const dimKeys = ['Closeness','Anxiety','Avoidance','Independence'];
            const dims: Array<{ name: string; score: number; raw: number; max: number }> = [];
            for (const dk of dimKeys) {
              const v = (traits as any)[dk];
              if (v) {
                dims.push({ name: dk, score: v.score || 0, raw: typeof v.raw_score === 'number' ? v.raw_score : Math.round((v.score||0)/100*6), max: (v.max_score || 6) });
              }
            }
            if (dims.length === 0) return null;

            // доминирующий стиль: берём с бэка, иначе локально по правилам из defs.scoring.rules
            const dominantFromBackend = (result as any)?.personality_map?.dominant_style as string | undefined;
            const rules = ((defs as any)?.scoring?.rules) || {};
            const rawBy = (key: string) => dims.find(d => d.name.toLowerCase() === key.toLowerCase())?.raw || 0;
            const decideLocal = (): string | null => {
              const candidates = Object.keys(rules);
              for (const label of candidates) {
                const r = (rules as any)[label] || {};
                let ok = true;
                for (const cond of Object.keys(r)) {
                  const [base, kind] = cond.split('_');
                  const val = rawBy(base);
                  const need = Number(r[cond] || 0);
                  if (kind === 'min' && !(val >= need)) { ok = false; break; }
                  if (kind === 'max' && !(val <= need)) { ok = false; break; }
                }
                if (ok) return label;
              }
              return null;
            };

            const dominantKey = (dominantFromBackend || decideLocal() || '').toString();
            const typesContainer = (defs as any)?.types || (defs as any)?.results || defs; // описание типов может лежать в types, results или корне
            const keysList = Object.keys(typesContainer || {});
            // Берём описание напрямую по ключу доминирующего стиля; если регистр отличается — ищем кейс‑инсensitive
            let dominantMeta: any = null;
            let displayDominant = dominantKey;
            if (dominantKey) {
              if (typesContainer && Object.prototype.hasOwnProperty.call(typesContainer, dominantKey)) {
                dominantMeta = (typesContainer as any)[dominantKey];
                displayDominant = dominantKey;
              } else {
                const ci = keysList.find(k => k.toLowerCase() === dominantKey.toLowerCase());
                if (ci) {
                  dominantMeta = (typesContainer as any)[ci];
                  displayDominant = ci;
                }
              }
            }

            return (
              <>
                {/* блок доминирующего стиля */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem'
                }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>
                      Доминирующий стиль: {(
                        dominantMeta?.full_name || dominantMeta?.name || displayDominant || '—'
                      )}
                    </div>
                    {(dominantMeta?.full_name || dominantMeta?.name) && (
                      <div style={{ fontSize: '1.05rem', marginBottom: 8 }}>
                        {dominantMeta.full_name || dominantMeta.name}
                      </div>
                    )}
                    {dominantMeta?.description && <div style={{ opacity: 0.9 }}>{dominantMeta.description}</div>}
                  </div>
                  <div>
                    {Array.isArray(dominantMeta?.strengths) && dominantMeta.strengths.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Сильные стороны</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {dominantMeta.strengths.map((s: string, i: number) => (<li key={`as_s_${i}`}>{s}</li>))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(dominantMeta?.weaknesses) && dominantMeta.weaknesses.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Зоны роста</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {dominantMeta.weaknesses.map((w: string, i: number) => (<li key={`as_w_${i}`}>{w}</li>))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(dominantMeta?.advice) && dominantMeta.advice.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Рекомендации</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {dominantMeta.advice.map((a: string, i: number) => (<li key={`as_a_${i}`}>{a}</li>))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(dominantMeta?.social_interaction) && dominantMeta.social_interaction.length > 0 && (
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Общение</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {dominantMeta.social_interaction.map((s: string, i: number) => (<li key={`as_si_${i}`}>{s}</li>))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* список всех измерений и очков */}
                <TraitGrid>
                  {dims.map(item => (
                    <TraitCard key={item.name} color={getTraitColor(item.score)}>
                      <TraitName color={getTraitColor(item.score)}>{item.name}</TraitName>
                      <TraitScore>{item.raw}/{item.max} ({item.score}%)</TraitScore>
                    </TraitCard>
                  ))}
                </TraitGrid>
              </>
            );
          }

          // MBTI блок (как был)
          const mbtiType = isMBTI ? computeMbtiType() : null;
          const meta = mbtiType ? (defs as any)[mbtiType] : null;
          return (
            <>
              {isMBTI && mbtiType && meta && (
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem'
                }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Ваш тип: {mbtiType}</div>
                    <div style={{ fontSize: '1.05rem', marginBottom: 8 }}>{meta.full_name || meta.name || ''}</div>
                    {meta.description && (
                      <div style={{ opacity: 0.9 }}>{meta.description}</div>
                    )}
                  </div>
                  <div>
                    {Array.isArray(meta.strengths) && meta.strengths.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Сильные стороны</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {meta.strengths.map((s: string, i: number) => (<li key={`s_${i}`}>{s}</li>))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(meta.weaknesses) && meta.weaknesses.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Зоны роста</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {meta.weaknesses.map((w: string, i: number) => (<li key={`w_${i}`}>{w}</li>))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(meta.advice) && meta.advice.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Рекомендации</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {meta.advice.map((a: string, i: number) => (<li key={`a_${i}`}>{a}</li>))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(meta.social_interaction) && meta.social_interaction.length > 0 && (
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Общение</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {meta.social_interaction.map((s: string, i: number) => (<li key={`si_${i}`}>{s}</li>))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* общий список черт как раньше */}
        <TraitGrid>
          {Object.entries(traits).map(([traitName, traitData]) => (
                  <TraitCard key={traitName} color={getTraitColor((traitData as any).score)}>
                    <TraitName color={getTraitColor((traitData as any).score)}>{traitName}</TraitName>
              <TraitScore>
                      {typeof (traitData as any).raw_score === 'number' && typeof (traitData as any).max_score === 'number'
                        ? `${(traitData as any).raw_score}/${(traitData as any).max_score} (${(traitData as any).score}%)`
                        : `${(traitData as any).score}/100`}
              </TraitScore>
                    <TraitLevel>{(traitData as any).level}</TraitLevel>
                    <TraitDescription>{(traitData as any).description}</TraitDescription>
            </TraitCard>
          ))}
        </TraitGrid>
            </>
          );
        })()}
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
