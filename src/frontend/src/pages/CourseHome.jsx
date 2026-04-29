export default function CourseHome() {
  return (
    <div style={{ display: 'flex' }}>

      {/* Left Sidebar — uses actual eConestoga sidebar image */}
      <div style={{ flexShrink: 0 }}>
        <img
          src="/img/sidebar-with-avatar.png"
          alt="Sidebar"
          style={{ width: '120px', display: 'block' }}
        />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '0 24px' }}>

        {/* Course Header */}
        <div style={{ padding: '20px 0 16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 400, color: '#202122', marginBottom: '4px' }}>
            Programming: Distributed Applications Development
          </h1>
          <div style={{ fontSize: '13px', color: '#6e7477' }}>
            PROG3176 - Winter 2026 - Section 2
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', padding: '16px 0 24px' }}>
          {[
            { label: 'Course Outline', bg: '#3a5b74' },
            { label: 'Instructional Plan', bg: '#3a5b74' },
            { label: 'Textbook', bg: '#9a9a9a' },
          ].map((link, i) => (
            <div key={i} style={{ textAlign: 'center', cursor: 'pointer' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: link.bg, margin: '0 auto 8px'
              }} />
              <div style={{ fontSize: '13px', color: '#006fbf' }}>{link.label}</div>
            </div>
          ))}
        </div>

        {/* 2-Column: Announcements + Work To Do */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '32px' }}>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Announcements</h2>
            {[1, 2].map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e3e9f1' }}>
                <div className="cc-icon blue-bg megaphone" style={{ flexShrink: 0 }} />
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>[Announcement Title Placeholder]</h3>
                  <p style={{ fontSize: '12px', color: '#90989d', marginBottom: '8px' }}>[Date Placeholder]</p>
                  <p style={{ fontSize: '14px', color: '#494c4e', lineHeight: 1.6 }}>[Announcement content placeholder]</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
              Work To Do <span style={{ fontSize: '14px', color: '#90989d', fontWeight: 400 }}>ⓘ</span>
            </h2>
            <div style={{
              border: '1px solid #e3e9f1', borderRadius: '4px', padding: '20px', textAlign: 'center'
            }}>
              <p style={{ fontSize: '13px', color: '#6e7477', marginBottom: '12px' }}>
                There are no upcoming items to display at this time.
              </p>
              <button style={{
                background: '#494c4e', color: '#fff', border: 'none',
                borderRadius: '3px', padding: '8px 20px', fontSize: '13px', cursor: 'pointer'
              }}>
                View Full Schedule
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
