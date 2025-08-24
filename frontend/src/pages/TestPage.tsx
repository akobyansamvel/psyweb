import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styled from 'styled-components';
import axios from 'axios';
import { Test, TestSubmission, Answer } from '../types';

const TestContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  color: white;
`;

const ProgressBar = styled.div`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  height: 8px;
  margin-bottom: 2rem;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ progress: number }>`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: 100%;
  border-radius: 25px;
  transition: width 0.5s ease;
  width: ${props => props.progress}%;
`;

const QuestionCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 2.5rem;
  margin-bottom: 2rem;
`;

const QuestionNumber = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1rem;
`;

const QuestionText = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 2rem;
  line-height: 1.4;
`;

const AnswerOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AnswerOption = styled.label`
  display: flex;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  &.selected {
    background: rgba(102, 126, 234, 0.2);
    border-color: #667eea;
  }
`;

const RadioInput = styled.input`
  margin-right: 1rem;
  transform: scale(1.2);
`;

const AnswerText = styled.span`
  font-size: 1rem;
  line-height: 1.4;
`;

const ConfidenceSection = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
`;

const ConfidenceLabel = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
`;

const ConfidenceSlider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #667eea;
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #667eea;
    cursor: pointer;
    border: none;
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
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.8rem 2rem;
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
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
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

const TestPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [test, setTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [confidenceLevels, setConfidenceLevels] = useState<Record<string, number>>({});
  const [responseTimes, setResponseTimes] = useState<Record<string, number>>({});
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (testId) {
      fetchTest();
    }
  }, [testId]);

  useEffect(() => {
    // Reset timer when question changes
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const fetchTest = async (): Promise<void> => {
    try {
      const response = await axios.get(`/api/tests/${testId}/`);
      setTest(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching test:', err);
      setError('Ошибка загрузки теста');
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerId: number): void => {
    const responseTime = (Date.now() - questionStartTime) / 1000; // Convert to seconds
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
    
    setResponseTimes(prev => ({
      ...prev,
      [questionId]: responseTime
    }));
  };

  const handleConfidenceChange = (questionId: string, confidence: number): void => {
    setConfidenceLevels(prev => ({
      ...prev,
      [questionId]: confidence
    }));
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

  const handleSubmitTest = async (): Promise<void> => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const submissionData: TestSubmission = {
        answers,
        response_time: responseTimes,
        confidence_levels: confidenceLevels,
        metadata: {
          total_time: Object.values(responseTimes).reduce((sum, time) => sum + time, 0),
          average_confidence: Object.values(confidenceLevels).length > 0 
            ? Object.values(confidenceLevels).reduce((sum, conf) => sum + conf, 0) / Object.values(confidenceLevels).length 
            : 0
        }
      };

      const response = await axios.post(`/api/tests/${testId}/submit/`, submissionData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      navigate(`/results/${response.data.result_id}`);
    } catch (err) {
      console.error('Error submitting test:', err);
      setError('Ошибка отправки теста');
      setSubmitting(false);
    }
  };

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
      </TestContainer>
    );
  }

  if (!test) {
    return (
      <TestContainer>
        <ErrorMessage>Тест не найден</ErrorMessage>
      </TestContainer>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === test.questions.length - 1;
  const allQuestionsAnswered = Object.keys(answers).length === test.questions.length;
  const currentConfidence = confidenceLevels[currentQuestion.id] || 3;

  return (
    <TestContainer>
      <ProgressBar>
        <ProgressFill progress={progress} />
      </ProgressBar>

      <QuestionCard>
        <QuestionNumber>
          Вопрос {currentQuestionIndex + 1} из {test.questions.length}
        </QuestionNumber>
        
        <QuestionText>{currentQuestion.text}</QuestionText>
        
        <AnswerOptions>
          {currentQuestion.answers.map((answer: Answer) => (
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
              value={currentConfidence}
              onChange={(e) => handleConfidenceChange(currentQuestion.id.toString(), parseInt(e.target.value))}
            />
            <ConfidenceValue>
              {currentConfidence === 1 && 'Совсем не уверен'}
              {currentConfidence === 2 && 'Скорее не уверен'}
              {currentConfidence === 3 && 'Затрудняюсь ответить'}
              {currentConfidence === 4 && 'Скорее уверен'}
              {currentConfidence === 5 && 'Полностью уверен'}
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
            onClick={handleSubmitTest}
            disabled={!allQuestionsAnswered || submitting}
          >
            {submitting ? 'Отправка...' : 'Завершить тест'}
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
