import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styled from 'styled-components';

const RegisterContainer = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem 1rem;
  color: white;
`;

const FormCard = styled.div`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  padding: 2.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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

const Title = styled.h1`
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  font-size: 0.9rem;
  opacity: 0.9;
  color: white;
`;

const Input = styled.input`
  padding: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.15);
    outline: none;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &:invalid {
    border-color: #ff6b6b;
  }
`;

const NameRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid rgba(255, 107, 107, 0.5);
  color: #ff6b6b;
  padding: 1rem;
  border-radius: 10px;
  text-align: center;
  font-size: 0.9rem;
`;

const SuccessMessage = styled.div`
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid rgba(76, 175, 80, 0.5);
  color: #4CAF50;
  padding: 1rem;
  border-radius: 10px;
  text-align: center;
  font-size: 0.9rem;
`;

const Footer = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  opacity: 0.8;
`;

const FooterLink = styled(Link)`
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const PasswordStrength = styled.div<{ strength: string }>`
  font-size: 0.8rem;
  margin-top: 0.25rem;
  color: ${props => {
    switch (props.strength) {
      case 'weak': return '#ff6b6b';
      case 'medium': return '#ffa726';
      case 'strong': return '#4caf50';
      default: return 'rgba(255, 255, 255, 0.6)';
    }
  }};
`;

interface RegisterFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

const Register = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState<string>('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const checkPasswordStrength = (password: string): string => {
    if (password.length === 0) return '';
    if (password.length < 6) return 'weak';
    if (password.length < 8) return 'medium';
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return 'strong';
    return 'medium';
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev: RegisterFormData) => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.username.trim()) {
      errors.push('Имя пользователя обязательно');
    }

    if (!formData.email.trim()) {
      errors.push('Email обязателен');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push('Введите корректный email');
    }

    if (formData.password.length < 6) {
      errors.push('Пароль должен содержать минимум 6 символов');
    }

    if (formData.password !== formData.password_confirm) {
      errors.push('Пароли не совпадают');
    }

    return errors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData);
      
             if (result.success) {
         setSuccess('Регистрация успешна! Перенаправление...');
         // Немедленное перенаправление
         navigate('/');
       } else {
        if (typeof result.error === 'object') {
          // Обработка ошибок валидации Django
          const errorMessages = Object.values(result.error).flat();
          setError(errorMessages.join(', '));
        } else {
          setError(result.error || 'Неизвестная ошибка');
        }
      }
    } catch (err) {
      setError('Произошла ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterContainer>
      <FormCard>
        <Title>Регистрация</Title>
        
        <Form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
          
          <FormGroup>
            <Label htmlFor="username">Имя пользователя *</Label>
            <Input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Введите имя пользователя"
              required
              minLength={3}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="email">Email *</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Введите email"
              required
            />
          </FormGroup>
          
          <NameRow>
            <FormGroup>
              <Label htmlFor="first_name">Имя</Label>
              <Input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Введите имя"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="last_name">Фамилия</Label>
              <Input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Введите фамилию"
              />
            </FormGroup>
          </NameRow>
          
          <FormGroup>
            <Label htmlFor="password">Пароль *</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Введите пароль (минимум 6 символов)"
              required
              minLength={6}
            />
            {passwordStrength && (
              <PasswordStrength strength={passwordStrength}>
                {passwordStrength === 'weak' && 'Слабый пароль'}
                {passwordStrength === 'medium' && 'Средний пароль'}
                {passwordStrength === 'strong' && 'Сильный пароль'}
              </PasswordStrength>
            )}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="password_confirm">Подтверждение пароля *</Label>
            <Input
              type="password"
              id="password_confirm"
              name="password_confirm"
              value={formData.password_confirm}
              onChange={handleChange}
              placeholder="Повторите пароль"
              required
            />
          </FormGroup>
          
          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </SubmitButton>
        </Form>
        
        <Footer>
          Уже есть аккаунт? <FooterLink to="/login">Войти</FooterLink>
        </Footer>
      </FormCard>
    </RegisterContainer>
  );
};

export default Register;
