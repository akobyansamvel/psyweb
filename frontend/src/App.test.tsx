import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  Routes: ({ children }: { children: React.ReactNode }) => children,
  Route: ({ element }: { element: React.ReactNode }) => element,
}));

// Mock AuthContext
const mockAuthContext = {
  user: null,
  token: null,
  loading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: false
};

jest.mock('./contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Mock all components
jest.mock('./components/Header', () => () => <div data-testid="header">Header</div>);
jest.mock('./components/ProtectedRoute', () => ({ children }: { children: React.ReactNode }) => children);
jest.mock('./pages/Home', () => () => <div data-testid="home">Home</div>);
jest.mock('./pages/Login', () => () => <div data-testid="login">Login</div>);
jest.mock('./pages/Register', () => () => <div data-testid="register">Register</div>);
jest.mock('./pages/TestPage', () => () => <div data-testid="test">Test</div>);
jest.mock('./pages/ResultsPage', () => () => <div data-testid="results">Results</div>);
jest.mock('./pages/HistoryPage', () => () => <div data-testid="history">History</div>);
jest.mock('./pages/AboutPage', () => () => <div data-testid="about">About</div>);

test('renders app without crashing', () => {
  const { container } = render(<App />);
  expect(container).toBeInTheDocument();
});
