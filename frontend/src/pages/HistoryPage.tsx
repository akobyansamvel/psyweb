import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styled from 'styled-components';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TestResult, DynamicProfile } from '../types';
import PersonalityRadar from '../components/PersonalityRadar';

const HistoryContainer = styled.div`
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

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
`;

const ResultCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const TestName = styled.h3`
  font-size: 1.3rem;
  color: white;
`;

const TestDate = styled.span`
  font-size: 0.9rem;
  opacity: 0.7;
`;

const OverallScore = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const ScoreValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #667eea;
`;

const ScoreLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.7;
`;

const TraitsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const TraitItem = styled.div<{ color: string }>`
  text-align: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border-left: 3px solid ${props => props.color};
`;

const TraitName = styled.div`
  font-size: 0.8rem;
  margin-bottom: 0.3rem;
  font-weight: 600;
`;

const TraitScore = styled.div<{ color: string }>`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${props => props.color};
`;

const ViewButton = styled(Link)`
  display: block;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }
`;

const ChartsSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const ChartTitle = styled.h2`
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.8rem;
`;

const ChartContainer = styled.div`
  height: 400px;
  margin-bottom: 2rem;
  @media (max-width: 768px) {
    height: 320px;
  }
  @media (max-width: 480px) {
    height: 260px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.7);
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
`;

const EmptyText = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
`;

const StartTestButton = styled(Link)`
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  border-radius: 25px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
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

// Удалены неиспользуемые стили

const HistoryPage: React.FC = () => {
  const { token } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [dynamicProfile, setDynamicProfile] = useState<DynamicProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
    fetchDynamicProfile();
  }, []);

  const fetchHistory = async (): Promise<void> => {
    try {
      const response = await axios.get('/api/users/history/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setResults(response.data.results || response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Ошибка загрузки истории');
      setLoading(false);
    }
  };

  const fetchDynamicProfile = async (): Promise<void> => {
    try {
      const response = await axios.get('/api/users/dynamic-profile/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setDynamicProfile(response.data.profile);
    } catch (err) {
      console.error('Error fetching dynamic profile:', err);
      // Don't set error here as it's not critical
    }
  };

  const getTraitColor = (score: number): string => {
    if (score >= 80) return "#4CAF50";
    if (score >= 60) return "#8BC34A";
    if (score >= 40) return "#FFC107";
    if (score >= 20) return "#FF9800";
    return "#F44336";
  };

  const prepareChartData = (): any[] => {
    if (results.length === 0) return [];

    // Получаем все уникальные черты личности
    const allTraits = new Set<string>();
    results.forEach(result => {
      if (result.personality_map?.traits) {
        Object.keys(result.personality_map.traits).forEach(trait => allTraits.add(trait));
      }
    });

    // Создаем данные для графика
    const chartData = results.map((result, index) => {
      const dataPoint: any = {
        date: new Date(result.completed_at).toLocaleDateString('ru-RU'),
        test: result.test?.name || `Тест ${index + 1}`
      };

      allTraits.forEach(trait => {
        const traitData = result.personality_map?.traits?.[trait];
        dataPoint[trait] = traitData?.score || 0;
      });

      return dataPoint;
    });

    return chartData;
  };

  const chartData = prepareChartData();

  if (loading) {
    return (
      <HistoryContainer>
        <LoadingMessage>Загрузка истории...</LoadingMessage>
      </HistoryContainer>
    );
  }

  if (error) {
    return (
      <HistoryContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </HistoryContainer>
    );
  }

  if (results.length === 0) {
    return (
      <HistoryContainer>
        <EmptyState>
          <EmptyIcon>📊</EmptyIcon>
          <EmptyText>У вас пока нет результатов тестов</EmptyText>
          <StartTestButton to="/">Пройти первый тест</StartTestButton>
        </EmptyState>
      </HistoryContainer>
    );
  }

  return (
    <HistoryContainer>
      <Header>
        <Title>История ваших тестов</Title>
        <Subtitle>
          Отслеживайте изменения в вашей личности со временем
        </Subtitle>
      </Header>

      {dynamicProfile && (
        <PersonalityRadar profile={dynamicProfile} />
      )}

      {chartData.length > 1 && (
        <ChartsSection>
          <ChartTitle>Динамика развития черт личности</ChartTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255, 255, 255, 0.7)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="rgba(255, 255, 255, 0.7)"
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white'
                  }}
                />
                <Legend />
                {Object.keys(chartData[0] || {}).filter(key => !['date', 'test'].includes(key)).map((trait, index) => (
                  <Line
                    key={trait}
                    type="monotone"
                    dataKey={trait}
                    stroke={getTraitColor(50 + index * 10)}
                    strokeWidth={2}
                    dot={{ fill: getTraitColor(50 + index * 10), strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ChartsSection>
      )}

      <ResultsGrid>
        {results.map((result) => (
          <ResultCard key={result.id}>
            <ResultHeader>
              <TestName>{result.test?.name || 'Тест личности'}</TestName>
              <TestDate>
                {new Date(result.completed_at).toLocaleDateString('ru-RU')}
              </TestDate>
            </ResultHeader>

            <OverallScore>
              <ScoreValue>
                {result.personality_map?.overall_score || 0}
              </ScoreValue>
              <ScoreLabel>Общий балл</ScoreLabel>
            </OverallScore>

            {result.personality_map?.traits && (
              <TraitsList>
                {Object.entries(result.personality_map.traits).map(([traitName, traitData]) => (
                  <TraitItem key={traitName} color={getTraitColor(traitData.score)}>
                    <TraitName>{traitName}</TraitName>
                    <TraitScore color={getTraitColor(traitData.score)}>
                      {traitData.score}
                    </TraitScore>
                  </TraitItem>
                ))}
              </TraitsList>
            )}

            <ViewButton to={`/results/${result.id}`}>
              Просмотреть детально
            </ViewButton>
          </ResultCard>
        ))}
      </ResultsGrid>
    </HistoryContainer>
  );
};

export default HistoryPage;
