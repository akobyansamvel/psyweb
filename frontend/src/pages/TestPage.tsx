import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { API_BASE_URL } from '../types';

// Временная локализация названий
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

const TestContainer = styled.div`
  max-width: 980px;
  margin: 0 auto;
  padding: 32px 20px 24px;
  color: #eef2f7;
`;

const ProgressBar = styled.div`
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  height: 10px;
  margin: 12px 0 28px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
`;

const ProgressFill = styled.div<{ progress: number }>`
  background: linear-gradient(90deg, #6a8dff 0%, #8b5cf6 50%, #d946ef 100%);
  height: 100%;
  border-radius: 999px;
  transition: width 320ms ease;
  width: ${props => props.progress}%;
`;

const QuestionCard = styled.div`
  background: radial-gradient(1200px 400px at 10% 0%, rgba(255,255,255,0.10), rgba(255,255,255,0.04));
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 18px;
  padding: 24px 24px;
  margin-bottom: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12);
  overflow: visible;
`;

const QuestionNumber = styled.div`
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 12px;
  letter-spacing: 0.2px;
`;

const QuestionText = styled.h2`
  font-size: 1.6rem;
  margin-bottom: 22px;
  line-height: 1.5;
  color: #f3f6fb;
  text-shadow: 0 1px 0 rgba(0,0,0,0.25);
`;

const QuestionImage = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  margin: 0 0 1rem 0;
  box-shadow: 0 3px 12px rgba(0,0,0,0.15);
`;

const AnswerOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const AnswerOption = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease, background 120ms ease;
  will-change: transform;
  
  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
    border-color: rgba(255, 255, 255, 0.28);
    box-shadow: 0 6px 16px rgba(0,0,0,0.25);
  }
  
  &.selected {
    background: radial-gradient(600px 120px at 0% 0%, rgba(106,141,255,0.25), rgba(255,255,255,0.05));
    border-color: rgba(106, 141, 255, 0.7);
    box-shadow: 0 6px 18px rgba(106, 141, 255, 0.35);
  }
`;

const RadioInput = styled.input`
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.65);
  display: inline-block;
  position: relative;
  margin-right: 2px;
  outline: none;
  transition: border-color 120ms ease, background 120ms ease, box-shadow 120ms ease;

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(106,141,255,0.35);
  }

  &:checked {
    border-color: #8b5cf6;
    background: radial-gradient(circle at 50% 50%, #8b5cf6 0, #8b5cf6 40%, transparent 42%);
  }
`;

const AnswerText = styled.span`
  font-size: 1rem;
  line-height: 1.45;
  color: #eef2f7;
`;

const ConfidenceSection = styled.div`
  margin-top: 18px;
  padding: 14px 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 14px;
`;

const ConfidenceLabel = styled.div`
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 8px;
`;

const ConfidenceSlider = styled.input`
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  outline: none;
  -webkit-appearance: none;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(180deg, #8b5cf6, #6a8dff);
    cursor: pointer;
    border: 2px solid rgba(255,255,255,0.85);
    box-shadow: 0 4px 8px rgba(0,0,0,0.25);
  }
  
  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(180deg, #8b5cf6, #6a8dff);
    cursor: pointer;
    border: 2px solid rgba(255,255,255,0.85);
  }
`;

const ConfidenceValue = styled.div`
  text-align: center;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.5rem;
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 22px;
`;

const Button = styled.button`
  padding: 12px 22px;
  border-radius: 12px;
  font-weight: 600;
  transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
  cursor: pointer;
  
  &.primary {
    background: linear-gradient(135deg, #6a8dff, #8b5cf6);
    color: #ffffff;
    border: none;
    box-shadow: 0 10px 20px rgba(139, 92, 246, 0.35);
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 22px rgba(139, 92, 246, 0.4);
    }
    
    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }
  
  &.secondary {
    background: rgba(255, 255, 255, 0.06);
    color: #e8ecf5;
    border: 1px solid rgba(255, 255, 255, 0.25);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 18px rgba(0,0,0,0.25);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

const TestHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const TestTitle = styled.h1`
  font-size: 28px;
  color: #2c3e50;
  margin-bottom: 15px;
`;

const TestDescription = styled.p`
  font-size: 16px;
  color: #7f8c8d;
  line-height: 1.6;
  margin-bottom: 25px;
`;

const TestImage = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  margin: 0 auto 20px;
  display: block;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
`;

const TestInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const InfoItem = styled.div`
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 3px solid #4A90E2;
`;

const InfoLabel = styled.div`
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 5px;
`;

const InfoValue = styled.div`
  font-size: 16px;
  color: #2c3e50;
  font-weight: 600;
`;

const StartButton = styled.button`
  background: #27ae60;
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 18px;
  border-radius: 8px;
  cursor: pointer;
  margin: 0 auto 20px;
  display: block;
  transition: background 0.2s ease;
  
  &:hover {
    background: #229954;
  }
`;

const BackButton = styled.button`
  background: #6c757d;
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
  
  &:hover {
    background: #5a6268;
  }
`;

const ResultsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const ResultCard = styled.div`
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  border: 2px solid #e9ecef;
`;

const ResultTitle = styled.h3`
  font-size: 16px;
  color: #6c757d;
  margin-bottom: 10px;
`;

const ResultValue = styled.div`
  font-size: 24px;
  color: #2c3e50;
  font-weight: 700;
`;

const TestPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [confidenceLevels, setConfidenceLevels] = useState<Record<string, number>>({});
  const [responseTimes, setResponseTimes] = useState<Record<string, number>>({});
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  useEffect(() => {
    if (testId) {
      fetchTest();
    }
  }, [testId]);

  const fetchTest = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tests/${testId}/`);
      if (!response.ok) {
        throw new Error('Тест не найден');
      }
      const data = await response.json();
      setTest(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки теста');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (questionId: string, answerId: number): void => {
    const responseTime = (Date.now() - questionStartTime) / 1000;
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
    setResponseTimes(prev => ({ ...prev, [questionId]: responseTime }));
  };

  const handleConfidenceChange = (questionId: string, confidence: number): void => {
    setConfidenceLevels(prev => ({ ...prev, [questionId]: confidence }));
  };

  const goToNextQuestion = (): void => {
    if (test && currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = (): void => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const handleFinish = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tests/${testId}/submit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          answers,
          response_time: responseTimes,
          confidence_levels: confidenceLevels,
          metadata: {
            total_time: Object.values(responseTimes).reduce((sum, t) => sum + t, 0),
            average_confidence: Object.values(confidenceLevels).length > 0
              ? Object.values(confidenceLevels).reduce((s, c) => s + c, 0) / Object.values(confidenceLevels).length
              : 0
          }
        })
      });
      if (!response.ok) {
        throw new Error('Ошибка отправки результатов');
      }
      const data = await response.json();
      navigate(`/results/${data.result_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки результатов');
    }
  };

  // Отправка результатов отключена в упрощённой версии страницы

  if (loading) {
    return (
      <TestContainer>
        <LoadingMessage>Загрузка теста...</LoadingMessage>
      </TestContainer>
    );
  }

  if (error) {
    return (
      <TestContainer>
        <ErrorMessage>{error}</ErrorMessage>
        <BackButton onClick={() => navigate('/tests')}>
          Вернуться к списку тестов
        </BackButton>
      </TestContainer>
    );
  }

  if (!test) {
    return (
      <TestContainer>
        <ErrorMessage>Тест не найден</ErrorMessage>
        <BackButton onClick={() => navigate('/tests')}>
          Вернуться к списку тестов
        </BackButton>
      </TestContainer>
    );
  }

  // Проверяем, что у теста есть вопросы
  if (!test.questions || test.questions.length === 0) {
    return (
      <TestContainer>
        <ErrorMessage>У этого теста нет вопросов</ErrorMessage>
        <BackButton onClick={() => navigate('/tests')}>
          Вернуться к списку тестов
        </BackButton>
      </TestContainer>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <TestContainer>
        <ErrorMessage>Вопрос не найден</ErrorMessage>
      </TestContainer>
    );
  }
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;
  const headerTitle = (test.name_localized as string) || localizeTestName(test.name || '');
  const descText: string = typeof test.description === 'string' ? test.description : '';
  const isDuplicateDesc = descText.trim().toLowerCase() === headerTitle.trim().toLowerCase() ||
    (descText && headerTitle && descText.toLowerCase().includes(headerTitle.toLowerCase()));
  const isLastQuestion = currentQuestionIndex === test.questions.length - 1;
  const allQuestionsAnswered = Object.keys(answers).length === test.questions.length;
  const questionText: string = (currentQuestion.text
    || currentQuestion.statement
    || currentQuestion.prompt
    || currentQuestion.question_text
    || '').toString();
  const hasAnswers: boolean = Array.isArray(currentQuestion.answers) && currentQuestion.answers.length > 0;
  const defaultLikert = [
    { id: 1, text: 'Совсем не согласен' },
    { id: 2, text: 'Скорее не согласен' },
    { id: 3, text: 'Ни согласен, ни не согласен' },
    { id: 4, text: 'Скорее согласен' },
    { id: 5, text: 'Полностью согласен' },
  ];

  return (
    <TestContainer>
      <TestHeader>
        <TestTitle>{headerTitle}</TestTitle>
        {test.image_url && <TestImage src={test.image_url} alt={headerTitle} />} 
      </TestHeader>

      <ProgressBar>
        <ProgressFill progress={progress} />
      </ProgressBar>

      <QuestionCard>
        <QuestionNumber>
          Вопрос {currentQuestionIndex + 1} из {test.questions.length}
        </QuestionNumber>
        
        <QuestionText>{questionText}</QuestionText>
        {currentQuestion.image_url && (
          <QuestionImage src={currentQuestion.image_url} alt={currentQuestion.image_alt || 'Изображение к вопросу'} />
        )}
        
        <AnswerOptions>
          {(hasAnswers ? currentQuestion.answers : defaultLikert).map((answer: any) => (
            <AnswerOption
              key={answer.id}
              className={answers[currentQuestion.id] === answer.id ? 'selected' : ''}
            >
              <RadioInput
                type="radio"
                name={`question_${currentQuestion.id}`}
                value={answer.id}
                checked={answers[currentQuestion.id] === answer.id}
                onChange={() => handleAnswerSelect(currentQuestion.id.toString(), answer.id)}
              />
              <AnswerText>{answer.text}</AnswerText>
            </AnswerOption>
          ))}
        </AnswerOptions>

        {answers[currentQuestion.id] && (
          <ConfidenceSection>
            <ConfidenceLabel>
              Насколько вы уверены в своем ответе?
            </ConfidenceLabel>
            <ConfidenceSlider
              type="range"
              min="1"
              max="5"
              value={confidenceLevels[currentQuestion.id] || 3}
              onChange={(e) => handleConfidenceChange(currentQuestion.id.toString(), parseInt(e.target.value))}
            />
            <ConfidenceValue>
              {confidenceLevels[currentQuestion.id] === 1 && 'Совсем не уверен'}
              {confidenceLevels[currentQuestion.id] === 2 && 'Скорее не уверен'}
              {confidenceLevels[currentQuestion.id] === 3 && 'Затрудняюсь ответить'}
              {confidenceLevels[currentQuestion.id] === 4 && 'Скорее уверен'}
              {confidenceLevels[currentQuestion.id] === 5 && 'Полностью уверен'}
            </ConfidenceValue>
          </ConfidenceSection>
        )}
      </QuestionCard>

      <NavigationButtons>
        <Button
          className="secondary"
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Назад
        </Button>
        
        {isLastQuestion ? (
          <Button
            className="primary"
            onClick={handleFinish}
            disabled={!allQuestionsAnswered}
          >
            Завершить
          </Button>
        ) : (
          <Button
            className="primary"
            onClick={goToNextQuestion}
            disabled={!answers[currentQuestion.id]}
          >
            Далее
          </Button>
        )}
      </NavigationButtons>
    </TestContainer>
  );
};

export default TestPage;
