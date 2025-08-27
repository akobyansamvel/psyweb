import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { DynamicProfile } from '../types';

interface PersonalityRadarProps {
  profile: DynamicProfile;
  title?: string;
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

const ChartWrapper = styled.div`
  width: 100%;
  height: 420px;
  @media (max-width: 768px) {
    height: 320px;
  }
  @media (max-width: 480px) {
    height: 260px;
  }
`;

const Legend = styled.div`
  display: flex;
  gap: 0.8rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
`;

const PersonalityRadar: React.FC<PersonalityRadarProps> = ({ profile, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new (window as any).ResizeObserver((entries: any) => {
      for (const entry of entries) {
        const cw = entry.contentRect?.width || el.clientWidth;
        setContainerWidth(cw);
      }
    });
    ro.observe(el);
    // initial
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const isSmall = containerWidth > 0 && containerWidth < 480;
  const isTablet = containerWidth >= 480 && containerWidth < 768;
  const angleTickSize = isSmall ? 10 : isTablet ? 11 : 12;
  const radiusTickSize = isSmall ? 9 : 10;

  const data = Object.entries(profile.traits).map(([name, info]) => {
    const label = isSmall && name.length > 12 ? `${name.slice(0, 12)}…` : name;
    return {
      trait: label,
      fullTrait: name,
      score: info.score,
    };
  });

  return (
    <Container>
      <Title>{title || 'Карта личности (радар)'}</Title>
      <ChartWrapper ref={containerRef}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius={isSmall ? '65%' : isTablet ? '70%' : '75%'}>
            <PolarGrid stroke="rgba(255,255,255,0.15)" />
            <PolarAngleAxis dataKey="trait" stroke="rgba(255,255,255,0.8)" tick={{ fontSize: angleTickSize }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="rgba(255,255,255,0.6)" tick={{ fontSize: radiusTickSize }} />
            <Radar name="Баллы" dataKey="score" stroke="#6a8dff" fill="#6a8dff" fillOpacity={0.4} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 10,
                color: 'white'
              }}
              formatter={(value: any, _n: any, p: any) => [value, 'Балл']}
              labelFormatter={(_label: string, payload: any) => {
                const item = payload && payload[0] && payload[0].payload;
                return item?.fullTrait || _label;
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </ChartWrapper>
      <Legend>
        <span>Заполненность отражает уровень выраженности черты (0–100)</span>
      </Legend>
    </Container>
  );
};

export default PersonalityRadar;


