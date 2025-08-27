import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
`;

const Logo = styled(Link)`
  font-size: 1.8rem;
  font-weight: 700;
  color: #667eea;
  text-decoration: none;
  
  &:hover {
    color: #764ba2;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  color: #333;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
  
  &:hover {
    color: #667eea;
  }
`;

const AuthButtons = styled.div`
  display: flex;
  gap: 1rem;
  @media (max-width: 768px) {
    display: none;
  }
`;

const Button = styled.button`
  padding: 0.5rem 1.5rem;
  border-radius: 25px;
  font-weight: 500;
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
    color: #667eea;
    border: 2px solid #667eea;
    
    &:hover {
      background: #667eea;
      color: white;
    }
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserName = styled.span`
  font-weight: 500;
  color: #333;
`;

const LogoutButton = styled.button`
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #ff5252;
    transform: translateY(-1px);
  }
`;

const BurgerButton = styled.button`
  display: none;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
  margin-left: 0.5rem;
  @media (max-width: 768px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  span {
    display: block;
    width: 24px;
    height: 2px;
    background: #333;
    position: relative;
  }
  span::before,
  span::after {
    content: '';
    position: absolute;
    left: 0;
    width: 24px;
    height: 2px;
    background: #333;
    transition: transform 0.2s ease;
  }
  span::before { top: -7px; }
  span::after { top: 7px; }
`;

const MobileMenu = styled.div<{ open: boolean }>`
  display: none;
  @media (max-width: 768px) {
    display: block;
    position: fixed;
    top: 64px;
    right: 0;
    left: 0;
    background: rgba(255,255,255,0.98);
    border-bottom: 1px solid rgba(0,0,0,0.06);
    box-shadow: 0 6px 20px rgba(0,0,0,0.06);
    transform: translateY(${props => props.open ? '0' : '-8px'});
    opacity: ${props => props.open ? 1 : 0};
    pointer-events: ${props => props.open ? 'auto' : 'none'};
    transition: all 0.18s ease;
    padding: 12px 16px 16px;
  }
`;

const MobileRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
`;

const MobileLink = styled(Link)`
  color: #333;
  text-decoration: none;
  font-weight: 600;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(0,0,0,0.03);
`;

const MobileActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 8px;
`;

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const handleLogout = (): void => {
    logout();
    navigate('/');
  };

  return (
    <HeaderContainer>
      <Nav>
        <Logo to="/">MindJourney</Logo>
        
        <BurgerButton aria-label="Открыть меню" onClick={() => setMenuOpen(v => !v)}>
          <span />
        </BurgerButton>

        <NavLinks>
          <NavLink to="/">Главная</NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/history">История</NavLink>
              <NavLink to="/about">О нас</NavLink>
            </>
          )}
        </NavLinks>
        
        <AuthButtons>
          {isAuthenticated ? (
            <UserInfo>
              <UserName>Привет, {user?.first_name || user?.username}!</UserName>
              <LogoutButton onClick={handleLogout}>Выйти</LogoutButton>
            </UserInfo>
          ) : (
            <>
              <Button as={Link} to="/login" className="secondary">
                Войти
              </Button>
              <Button as={Link} to="/register" className="primary">
                Регистрация
              </Button>
            </>
          )}
        </AuthButtons>
      </Nav>

      <MobileMenu open={menuOpen}>
        <MobileRow>
          <MobileLink to="/" onClick={() => setMenuOpen(false)}>Главная</MobileLink>
          {isAuthenticated && (
            <>
              <MobileLink to="/history" onClick={() => setMenuOpen(false)}>История</MobileLink>
              <MobileLink to="/about" onClick={() => setMenuOpen(false)}>О нас</MobileLink>
            </>
          )}
        </MobileRow>
        <MobileActions>
          {isAuthenticated ? (
            <>
              <Button className="secondary" onClick={() => setMenuOpen(false)}>
                Привет, {user?.first_name || user?.username}
              </Button>
              <Button className="primary" onClick={() => { setMenuOpen(false); handleLogout(); }}>
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Button as={Link} to="/login" className="secondary" onClick={() => setMenuOpen(false)}>Войти</Button>
              <Button as={Link} to="/register" className="primary" onClick={() => setMenuOpen(false)}>Регистрация</Button>
            </>
          )}
        </MobileActions>
      </MobileMenu>
    </HeaderContainer>
  );
};

export default Header;
