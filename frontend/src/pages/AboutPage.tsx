import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  color: #eef2f7;
`;

const Title = styled.h1`
  font-size: 38px;
  font-weight: 800;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #e9ecf5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Section = styled.section`
  margin: 20px 0 28px;
  background: radial-gradient(1200px 400px at 10% 0%, rgba(255,255,255,0.10), rgba(255,255,255,0.04));
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  padding: 18px 18px;
`;

const P = styled.p`
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.65;
  margin: 8px 0;
`;

const List = styled.ul`
  margin: 8px 0 0 18px;
  color: rgba(255, 255, 255, 0.9);
`;

const AboutPage: React.FC = () => {
  return (
    <Container>
      <Title>О MindJourney</Title>
      <Section>
        <P>
          Мы используем только авторитетные психологические опросники и методики (IPIP, HEXACO, BFI, PHQ‑9,
          GAD‑7, PSS‑10 и др.), а также аккуратно собранные шкалы из открытых источников (OpenPsychometrics,
          IPIP, академические публикации). Результаты анализируются нашей моделью, которая строит персональную
          карту личности и рекомендации на основе ваших ответов.
        </P>
        <List>
          <li>Надёжные методики: валидированные опросники с доказанной психометрией.</li>
          <li>Приватность: ваши данные используются только для расчёта результатов и улучшения сервиса.</li>
          <li>Прозрачность: понятные интерпретации и наглядные визуализации.</li>
        </List>
      </Section>
      <Section>
        <P>
          Важно: результаты не являются медицинским диагнозом и не заменяют консультацию специалиста.
          Это ориентир, основанный на ваших ответах и эмпирических наблюдениях. При выраженных симптомах или
          сомнениях обратитесь к клиническому психологу или врачу‑психотерапевту.
        </P>
      </Section>
    </Container>
  );
};

export default AboutPage;


