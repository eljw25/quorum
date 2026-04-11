import { useNavigate } from 'react-router-dom';

const steps = [
  {
    number: '01',
    title: 'Create a Room',
    description: 'One person starts a room and gets a shareable 6-character code.'
  },
  {
    number: '02',
    title: 'Friends Join',
    description: 'Everyone joins with the code. No app download, no setup.'
  },
  {
    number: '03',
    title: 'Vote on Genres',
    description: 'Each person picks the genres they\'re feeling. Votes sync live across all clients.'
  },
  {
    number: '04',
    title: 'Get Your Movies',
    description: 'Quorum finds the overlap and surfaces movies everyone can actually agree on.'
  }
];

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="lp-container">
      <nav className="lp-nav">
        <h1 className="logo">Quorum</h1>
        <button className="btn-outline-small" onClick={() => navigate('/auth')}>
          Sign In
        </button>
      </nav>

      <section className="lp-hero">
        <h1 className="lp-title">
          Stop arguing about<br />
          <span className="lp-highlight">what to watch.</span>
        </h1>
        <p className="lp-subtitle">
          Quorum finds the movie your whole group actually agrees on —
          in real time, in under a minute.
        </p>
        <div className="lp-cta-row">
          <button className="btn-primary lp-cta" onClick={() => navigate('/auth')}>
            Get Started
          </button>
        </div>
      </section>

      <section className="lp-steps">
        <h2 className="lp-section-title">How it works</h2>
        <div className="lp-steps-grid">
          {steps.map(step => (
            <div key={step.number} className="lp-step-card">
              <div className="lp-step-number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="lp-footer">
        <p>© 2026 Eric Lee</p>
      </footer>
    </div>
  );
}

export default LandingPage;
