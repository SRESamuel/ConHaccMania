import { Outlet } from 'react-router-dom';
import { useRole } from '../context/RoleContext';

export default function CourseLayout() {
  const { role, currentUser, users, switchUser } = useRole();
  const avatarColor = role === 'student' ? '#9860AF' : '#085394';
  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
      {/* === Top Nav Band === */}
      <div style={{ height: '4px', background: '#085394' }} />

      {/* === Navigation Bar === */}
      <div style={{
        display: 'flex', alignItems: 'center', height: '58px',
        padding: '0 20px', borderBottom: '1px solid #e3e9f1', background: '#fff'
      }}>
        <a href="/" title="Home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/img/newgen-logo.jpg" alt="NewGenLearning — Home" style={{ height: '36px', marginRight: '10px', cursor: 'pointer' }} />
        </a>
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
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => {
                const menu = document.getElementById('user-dropdown');
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
              }}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: avatarColor, color: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700
              }}>{currentUser.initials}</div>
              <div style={{ fontSize: '12px', lineHeight: 1.3 }}>
                <div style={{ color: '#202122', fontWeight: 500 }}>{currentUser.name}</div>
                <div style={{ color: '#6e7477' }}>{role === 'student' ? 'Student' : 'Instructor'}</div>
              </div>
              <span style={{ fontSize: '10px', color: '#90989d' }}>▾</span>
            </div>
            <div
              id="user-dropdown"
              style={{
                display: 'none', position: 'absolute', top: '48px', right: 0,
                background: '#fff', border: '1px solid #e3e9f1',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderRadius: '4px', width: '240px', zIndex: 100,
                padding: '8px 0'
              }}
            >
              <div style={{ padding: '4px 16px', fontSize: '11px', color: '#90989d', fontWeight: 700 }}>STUDENTS</div>
              {users.filter(u => u.role === 'student').map(u => (
                <div
                  key={u.id}
                  onClick={() => { switchUser(u.id); document.getElementById('user-dropdown').style.display = 'none'; }}
                  style={{
                    padding: '8px 16px', fontSize: '14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: currentUser.id === u.id ? '#e8f8ff' : 'transparent',
                    color: '#202122'
                  }}
                  onMouseOver={(e) => { if (currentUser.id !== u.id) e.currentTarget.style.background = '#f1f5fb'; }}
                  onMouseOut={(e) => { if (currentUser.id !== u.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', background: '#9860AF',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, flexShrink: 0
                  }}>{u.initials}</div>
                  {u.name}
                  {currentUser.id === u.id && <span style={{ marginLeft: 'auto', color: '#006fbf' }}>✓</span>}
                </div>
              ))}
              <div style={{ borderTop: '1px solid #e3e9f1', margin: '4px 0' }} />
              <div style={{ padding: '4px 16px', fontSize: '11px', color: '#90989d', fontWeight: 700 }}>INSTRUCTOR</div>
              {users.filter(u => u.role === 'instructor').map(u => (
                <div
                  key={u.id}
                  onClick={() => { switchUser(u.id); document.getElementById('user-dropdown').style.display = 'none'; }}
                  style={{
                    padding: '8px 16px', fontSize: '14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: currentUser.id === u.id ? '#e8f8ff' : 'transparent',
                    color: '#202122'
                  }}
                  onMouseOver={(e) => { if (currentUser.id !== u.id) e.currentTarget.style.background = '#f1f5fb'; }}
                  onMouseOut={(e) => { if (currentUser.id !== u.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', background: '#085394',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, flexShrink: 0
                  }}>{u.initials}</div>
                  {u.name}
                  {currentUser.id === u.id && <span style={{ marginLeft: 'auto', color: '#006fbf' }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
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
