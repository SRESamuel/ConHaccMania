import { Outlet } from 'react-router-dom';

export default function CourseLayout() {
  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
      {/* === Top Nav Band === */}
      <div style={{ height: '4px', background: '#085394' }} />

      {/* === Navigation Bar === */}
      <div style={{
        display: 'flex', alignItems: 'center', height: '58px',
        padding: '0 20px', borderBottom: '1px solid #e3e9f1', background: '#fff'
      }}>
        <a href="/"><img src="/img/nav-home-icon.png" alt="Home" style={{ height: '24px', marginRight: '10px', cursor: 'pointer' }} /></a>
        <span style={{ color: '#cdd5dc', margin: '0 8px', fontSize: '18px' }}>⋮</span>
        <img src="/img/econestoga-logo.png" alt="eConestoga" style={{ height: '28px', marginRight: '12px' }} />
        <span style={{ color: '#cdd5dc', margin: '0 8px', fontSize: '18px' }}>⋮</span>
        <span style={{ fontSize: '16px', color: '#494c4e', fontWeight: 500 }}>
          PROG3176-26W-Sec2-Prog...
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/img/nav-grid-icon.png" alt="" style={{ height: '24px' }} />
          <span style={{ color: '#cdd5dc', fontSize: '18px' }}>⋮</span>
          <img src="/img/nav-comm-icons.png" alt="" style={{ height: '24px' }} />
          <span style={{ color: '#cdd5dc', fontSize: '18px' }}>⋮</span>
          <span style={{ fontSize: '22px', color: '#e8a838' }}>🔔</span>
          <span style={{ fontSize: '16px', color: '#e8a838' }}>⚠</span>
          <span style={{ color: '#cdd5dc', fontSize: '18px' }}>⋮</span>
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: '#9860AF', color: '#fff', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 700
          }}>JK</div>
          <span style={{ fontSize: '20px', color: '#494c4e' }}>⚙</span>
        </div>
      </div>

      {/* === Secondary Nav === */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '24px',
        padding: '0 20px', height: '44px',
        borderBottom: '2px solid #085394', fontSize: '15px',
        position: 'relative'
      }}>
        <a href="/" style={{ color: '#494c4e', textDecoration: 'none' }}>Content</a>
        <div style={{ position: 'relative' }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              const menu = document.getElementById('course-tools-menu');
              menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            }}
            style={{ color: '#494c4e', textDecoration: 'none' }}
          >
            Course Tools ▾
          </a>
          <div
            id="course-tools-menu"
            style={{
              display: 'none', position: 'absolute', top: '32px', left: 0,
              background: '#fff', border: '1px solid #e3e9f1',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderRadius: '4px', width: '220px', zIndex: 100,
              padding: '8px 0'
            }}
          >
            {['Announcements', 'Assignments', 'Attendance', 'Awards', 'Calendar',
              'Checklist', 'Classlist', 'Class Progress', 'Discussions', 'ePortfolio',
              'Grades', 'Groups', 'Quizzes', 'Rubrics', 'Surveys'].map((item) => (
              <a
                key={item}
                href={item === 'Quizzes' ? '/quizzes' : '#'}
                style={{
                  display: 'block', padding: '8px 20px', fontSize: '14px',
                  color: item === 'Quizzes' ? '#006fbf' : '#494c4e',
                  fontWeight: item === 'Quizzes' ? 700 : 400,
                  textDecoration: 'none'
                }}
                onMouseOver={(e) => e.target.style.background = '#f1f5fb'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
        <a href="#" style={{ color: '#494c4e', textDecoration: 'none' }}>Student Support</a>
        <a href="#" style={{ color: '#494c4e', textDecoration: 'none' }}>Contact Support</a>
      </div>

      {/* === Page Content === */}
      <Outlet />
    </div>
  );
}
