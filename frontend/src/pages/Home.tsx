import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';

// Types
interface Test {
  id: number;
  name: string;
  description: string;
  question_count: number;
  created_at: string;
  is_active: boolean;
}

const HomeContainer = styled.div`
  text-align: center;
  color: white;
  padding: 2rem 0;
`;

const Hero = styled.div`
  margin-bottom: 4rem;
`;

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.3rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`;

const TestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
`;

const TestCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 2rem;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
`;

const TestTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: white;
`;

const TestDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const TestMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const StartButton = styled(Link)`
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.8rem 2rem;
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
        {tests.map((test) => (
          <TestCard key={test.id}>
            <TestTitle>{test.name}</TestTitle>
            <TestDescription>{test.description}</TestDescription>
            <TestMeta>
              <span>Вопросов: {test.question_count}</span>
              <span>Время: ~10 мин</span>
            </TestMeta>
            <StartButton to={`/test/${test.id}`}>
              Начать тест
            </StartButton>
          </TestCard>
        ))}
      </TestGrid>
    </HomeContainer>
  );
};

export default Home;
