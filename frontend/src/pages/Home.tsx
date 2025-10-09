import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';

// Types
interface Test {
  id: number;
  name: string;
  name_localized?: string;
  description: string;
  question_count: number;
  created_at: string;
  is_active: boolean;
}

// Временная локализация названий тестов на фронтеI
const localizeTestName = (name: string): string => {
  // Убираем числовые счётчики в скобках, если они есть (например, "(50)")
  const normalizedName = name.replace(/\s*\(\s*\d+\s*\)\s*$/g, '');
  const map: Record<string, string> = {
    'IPIP Big Five (50)': 'Большая пятёрка (IPIP-50)',
    'PHQ-9': 'PHQ‑9 (депрессия)',
    'GAD-7': 'GAD‑7 (тревога)',
    'Rosenberg Self-Esteem': 'Самооценка Розенберга',
    'PSS-10': 'PSS‑10 (стресс)',
    'Satisfaction With Life (SWLS)': 'Удовлетворённость жизнью (SWLS)',
    'MBTI Short (30)': 'MBTI (сокращённый, 30)',
    'Cognitive Reasoning (12)': 'Логико‑аналитические задачи (12)',
    'Working Memory (10)': 'Оперативная память (10)',
    'Emotional Intelligence (16)': 'Эмоциональный интеллект (16)',
    'Resilience (10)': 'Психологическая устойчивость (10)',
    'Mindfulness (15)': 'Осознанность (15)',
    'Sleep Quality (10)': 'Качество сна (10)',
    'Motivation (12)': 'Мотивация (12)',
    'Attentional Control (14)': 'Контроль внимания (14)',
    'Social Anxiety (12)': 'Социальная тревожность (12)',
    'Impulsivity (15)': 'Импульсивность (15)',
    'Visual Pattern Recognition': 'Распознавание визуальных паттернов',
    'Verbal Reasoning (18)': 'Вербальное рассуждение (18)',
    'Learning Strategies (20)': 'Стратегии обучения (20)',
    'Big Five Personality Test': 'Большая пятёрка (личностный тест)',
    'MBTI with Confidence Scale': 'MBTI с оценкой уверенности',
  };
  // Всегда возвращаем локализованное русское название
  return map[normalizedName] || normalizedName;
};

const HomeContainer = styled.div`
  text-align: center;
  color: #eef2f7;
  padding: 48px 16px 64px;
`;

const Hero = styled.div`
  margin-bottom: 48px;
`;

const Title = styled.h1`
  font-size: 46px;
  font-weight: 800;
  margin-bottom: 8px;
  letter-spacing: 0.2px;
  background: linear-gradient(135deg, #ffffff 0%, #e9ecf5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (max-width: 768px) {
    font-size: 34px;
  }
`;

const Subtitle = styled.p`
  font-size: 18px;
  margin-bottom: 24px;
  opacity: 0.9;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`;

const TestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 22px;
  margin-top: 28px;
`;

const Card = styled(Link)`
  position: relative;
  display: block;
  text-align: left;
  background: radial-gradient(1200px 400px at 10% 0%, rgba(255,255,255,0.10), rgba(255,255,255,0.04));
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  padding: 20px 18px;
  transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
  cursor: pointer;
  color: inherit;
  text-decoration: none;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(106, 141, 255, 0.6);
    box-shadow: 0 12px 28px rgba(0,0,0,0.25);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
`;

const Badge = styled.span`
  font-size: 12px;
  color: #dbe3ff;
  background: rgba(106,141,255,0.16);
  border: 1px solid rgba(106,141,255,0.45);
  padding: 4px 10px;
  border-radius: 999px;
`;

const TestTitle = styled.h3`
  font-size: 18px;
  margin: 0;
  color: #f3f6fb;
`;

// Удален неиспользуемый стиль

const TestMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.92rem;
`;

const StartPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #6a8dff, #8b5cf6);
  color: #ffffff;
  padding: 10px 16px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
  transition: transform 120ms ease, box-shadow 120ms ease;
  
  ${Card}:hover & {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(139, 92, 246, 0.35);
  }
`;

const LoadingMessage = styled.div`
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
`;

const Home: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async (): Promise<void> => {
    try {
      console.log('Fetching tests...');
      const response = await axios.get('/api/tests/');
      console.log('Tests response:', response.data);
      setTests(response.data.results || response.data);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching tests:', err);
      console.error('Error response:', err.response?.data);
      setError(`Ошибка загрузки тестов: ${err.response?.data?.detail || err.message}`);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <HomeContainer>
        <LoadingMessage>Загрузка тестов...</LoadingMessage>
      </HomeContainer>
    );
  }

  if (error) {
    return (
      <HomeContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </HomeContainer>
    );
  }

  return (
    <HomeContainer>
      <Hero>
        <Title>Добро пожаловать в MindJourney</Title>
        <Subtitle>
          Откройте тайны своей личности с помощью наших интерактивных психологических тестов. 
          Получите детальную карту личности и рекомендации по развитию.
        </Subtitle>
      </Hero>

      <TestGrid>
        {tests.map((test) => {
          const title = test.name_localized || localizeTestName(test.name);
          const desc = (test.description || '').trim();
          // Удалена неиспользуемая переменная isDup
          return (
            <Card key={test.id} to={`/test/${test.id}`}>
              <CardHeader>
                <Badge>~10 мин</Badge>
                <Badge>{test.question_count} вопросов</Badge>
              </CardHeader>
              <TestTitle>{title}</TestTitle>
              <TestMeta>
                <div />
                <StartPill>Начать</StartPill>
              </TestMeta>
            </Card>
          );
        })}
      </TestGrid>
    </HomeContainer>
  );
};

export default Home;
