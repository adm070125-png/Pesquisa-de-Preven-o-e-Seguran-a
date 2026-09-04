import React, { useState } from 'react';
import { CONFIG } from './constants';
import { Answer } from './types';

export const App: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [finished, setFinished] = useState(false);

  const startQuiz = () => {
    setStarted(true);
    setCurrent(0);
    setAnswers([]);
    setFinished(false);
  };

  const selectOption = (index: number) => {
    const q = CONFIG.questions[current];
    const chosen = q.options[index];
    const newAnswer: Answer = {
      id: q.id,
      text: chosen.text,
      score: chosen.score,
      region: chosen.region || null
    };

    const updatedAnswers = [...answers];
    updatedAnswers[current] = newAnswer;
    setAnswers(updatedAnswers);

    if (current + 1 < CONFIG.questions.length) {
      setCurrent(current + 1);
    } else {
      setFinished(true);
    }
  };

  const goBack = () => {
    if (current > 0) {
      setCurrent(current - 1);
    }
  };

  const renderResult = () => {
    const cityAnswer = answers.find(a => a.region);
    const regionKey = cityAnswer?.region || 'jaraguajs';
    const region = CONFIG.regions[regionKey];

    const totalScore = answers.reduce((sum, a) => sum + (a ? a.score : 0), 0);
    const recommended = region.plans.find(p => totalScore <= p.max) || region.plans[region.plans.length - 1];

    const baseInfo = answers.filter(a => a && a.id !== 'cidade').map(a => `- ${a.text}`).join('\n');
    const message = `Olá! Fiz a avaliação no site do ${CONFIG.brand} (${region.label}).\nPlano recomendado: ${recommended.name} (${recommended.price}).\nMinhas respostas:\n${baseInfo}\nGostaria de entender melhor.`;
    const waLink = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
    const ctaLabel = `Falar com o ${CONFIG.consultantTitle} ${CONFIG.consultantName} no WhatsApp`;

    return (
      <div className="stage active">
        <div className="card">
          <div className="q-label">{region.label}</div>
          <div className="q-title" style={{ marginBottom: '20px' }}>
            Compare os planos e fale com o Adilson
          </div>
          <div className="plans-compare">
            {region.plans.map(p => {
              const isRec = p.name === recommended.name;
              return (
                <div key={p.name} className={`plan-card ${isRec ? 'recommended' : ''}`}>
                  {isRec && <div className="tag">Recomendado pra você</div>}
                  <div className="row">
                    <div className="name">{p.name}</div>
                    <div className="price">{p.price}</div>
                  </div>
                  <div className="includes">Inclui: {p.includes}</div>
                  <ul>
                    {p.benefits.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <a className="whatsapp" href={waLink} target="_blank" rel="noopener noreferrer">
            {ctaLabel}
          </a>
          <p className="microcopy">Resposta rápida, direto com quem entende do assunto</p>
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    const q = CONFIG.questions[current];

    return (
      <div className="stage active">
        <div className="card">
          <div className="progress">
            {CONFIG.questions.map((_, i) => {
              let cls = '';
              if (i < current) cls = 'done';
              else if (i === current) cls = 'current';
              return (
                <span key={i} className={cls}>
                  <i></i>
                </span>
              );
            })}
          </div>
          <div className="q-label">
            Pergunta {current + 1} de {CONFIG.questions.length}
          </div>
          <div className="q-title">{q.title}</div>
          <div className="options">
            {q.options.map((o, i) => (
              <div key={i} className="opt" onClick={() => selectOption(i)}>
                {o.text}
              </div>
            ))}
          </div>
          <div className="nav-row">
            {current > 0 ? (
              <button className="ghost" onClick={goBack}>
                Voltar
              </button>
            ) : (
              <span></span>
            )}
            <span></span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="wrap">
      {!started && (
        <section className="hero" id="hero">
          <div className="brand">{CONFIG.brand}</div>
          <h1>Sua família merece tranquilidade, não imprevistos.</h1>
          <p>Responda 4 perguntas rápidas e descubra qual plano se encaixa na realidade da sua casa hoje.</p>
          <div className="cta">
            <button className="primary" onClick={startQuiz}>
              Começar avaliação gratuita
            </button>
          </div>
        </section>
      )}

      <section id="quiz-section">
        {started && !finished && renderQuiz()}
        {started && finished && renderResult()}
      </section>

      <footer>
        <div className="footer-cols">
          <div className="footer-col brand-col">
            <div className="brand-title">Grupo Ethernos</div>
            <div>Proteção e cuidado para sua família</div>
          </div>
          <div className="footer-col">
            <div className="col-title">Fale conosco</div>
            <div>WhatsApp: (47) 9942-9130</div>
            <div>Instagram: @schmitzadilsonroberto</div>
            <div>grupoethernos.com.br</div>
          </div>
          <div className="footer-col">
            <div className="col-title">Institucional</div>
            <div>
              <a href="#">Política de Privacidade</a>
            </div>
            <div>
              <a href="#">Termos de Uso</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; 2026 Grupo Ethernos. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default App;
