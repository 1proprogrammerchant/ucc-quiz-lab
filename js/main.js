// Main frontend behaviors: theme toggle, login form submit, demo click handlers
(function(){
  // Theme toggle (if an element with id 'themeToggle' exists)
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const apply = (mode)=>{
      if(mode==='dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', mode);
    };
    const stored = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light');
    apply(stored);
    themeToggle.addEventListener('click', ()=>{
      const isDark = document.documentElement.classList.toggle('dark');
      apply(isDark? 'dark':'light');
    });
  }

  // Login form handling (uses /api/login)
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const f = new FormData(loginForm);
      const body = { username: f.get('username'), password: f.get('password') };
      const msg = document.getElementById('loginMessage');
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          window.location.href = data.redirect || '/index.html';
        } else {
          msg.textContent = data.message || 'Invalid credentials';
        }
      } catch (err) {
        msg.textContent = 'Network error';
      }
    });
  }

  // Demo click handlers for buttons with a semantic role
  document.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      // If the button is inside the login form or is a real action, ignore
      if (btn.closest && btn.closest('form')) return;
      const text = (btn.textContent||'').trim();
      if (!text) return;
      // small UX: show a brief toast using alert for now (non-blocking)
      if (text.match(/Continue|Resume|Start|Enroll|Explore|Take the Quiz|Sign in/i)) {
        // allow default actions for links/buttons that navigate
        return;
      }
    });
  });

  // Start-quiz buttons navigation
  document.querySelectorAll('[data-action="start-quiz"]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      // navigate to a simple quiz page
      window.location.href = 'quiz.html';
    });
  });

  // Open profile when avatar clicked
  document.querySelectorAll('[data-action="open-profile"]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      window.location.href = 'profile.html';
    });
  });

  // Site logo reloads the page
  const siteLogo = document.getElementById('siteLogo');
  if (siteLogo) {
    siteLogo.style.cursor = 'pointer';
    siteLogo.addEventListener('click', (e)=>{
      e.preventDefault();
      location.reload();
    });
  }

  // Logout action (posts to /api/logout then redirects)
  document.querySelectorAll('[data-action="logout"]').forEach(el=>{
    el.addEventListener('click', async (e)=>{
      e.preventDefault();
      try {
        await fetch('/api/logout', { method: 'POST' });
      } catch (err) {
        // ignore network errors
      }
      window.location.href = 'index.html';
    });
  });

  // Leaderboard: fetch and render into #leaders with pagination and ranks
  let _leaderPage = 1;
  const _leaderPerPage = 6;

  async function loadLeaderboard(page = 1) {
    const container = document.getElementById('leaders');
    const pagerInfo = document.getElementById('leaderPagerInfo');
    const prevBtn = document.getElementById('leaderPrev');
    const nextBtn = document.getElementById('leaderNext');
    if (!container) return;
    _leaderPage = page;
    container.innerHTML = '<div class="text-sm text-slate-400">Loading...</div>';
    try {
      const res = await fetch(`/api/leaderboard?page=${page}&per_page=${_leaderPerPage}`);
      if (!res.ok) throw new Error('Network');
      const data = await res.json();
      const rows = (data.leaderboard || data.leaders || data.leaders || []);
      const total = data.total || 0;
      const totalPages = Math.max(1, Math.ceil(total / _leaderPerPage));
      // update pager
      if (pagerInfo) pagerInfo.textContent = `Page ${_leaderPage} of ${totalPages} - ${total} users`;
      if (prevBtn) prevBtn.disabled = _leaderPage <= 1;
      if (nextBtn) nextBtn.disabled = _leaderPage >= totalPages;
      if (!rows.length) {
        container.innerHTML = '<div class="text-sm text-slate-400">No leaderboard data yet.</div>';
        return;
      }
      container.innerHTML = '';
      rows.forEach((r, idx)=>{
        const rank = ((_leaderPage-1)*_leaderPerPage) + idx + 1;
        const wrap = document.createElement('div');
        wrap.className = 'flex items-center justify-between py-2';
        if (rank <= 3) wrap.className += ' bg-amber-50 rounded-lg px-3';
        const left = document.createElement('div');
        left.className = 'flex items-center gap-3';
        const rankBadge = document.createElement('div');
        rankBadge.className = 'w-8 text-sm font-bold text-slate-700 text-center';
        rankBadge.textContent = rank;
        const avatar = document.createElement('div');
        avatar.className = 'w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700';
        avatar.textContent = (r.username||'U').split('').slice(0,2).join('').toUpperCase();
        const name = document.createElement('div');
        name.className = 'flex flex-col';
        const title = document.createElement('span');
        title.className = 'text-sm font-medium text-slate-700';
        title.textContent = r.username || 'Unknown';
        const meta = document.createElement('span');
        meta.className = 'text-xs text-slate-400';
        meta.textContent = `Best: ${r.best_score || 0} • Avg: ${r.avg_score || 0}`;
        name.appendChild(title);
        name.appendChild(meta);
        left.appendChild(rankBadge);
        left.appendChild(avatar);
        left.appendChild(name);
        const score = document.createElement('div');
        score.className = 'text-sm font-bold text-primary text-right';
        score.innerHTML = `<div>${(r.total_score || 0)} pts</div><div class="text-xs text-slate-400">${r.attempts||0} attempts</div>`;
        wrap.appendChild(left);
        wrap.appendChild(score);
        container.appendChild(wrap);
      });
    } catch (err) {
      container.innerHTML = '<div class="text-sm text-red-500">Failed to load leaderboard.</div>';
    }
  }

  const refreshBtn = document.getElementById('refreshLeaders');
  if (refreshBtn) refreshBtn.addEventListener('click', ()=> loadLeaderboard(1));
  const prevBtn = document.getElementById('leaderPrev');
  const nextBtn = document.getElementById('leaderNext');
  if (prevBtn) prevBtn.addEventListener('click', ()=> { if (_leaderPage>1) loadLeaderboard(_leaderPage-1); });
  if (nextBtn) nextBtn.addEventListener('click', ()=> { loadLeaderboard(_leaderPage+1); });
  // auto-load on pages with the container
  if (document.getElementById('leaders')) {
    loadLeaderboard(1);
  }

  // Load current user info and stats to populate real-time values
  async function loadUserInfo() {
    const nameEl = document.getElementById('profileName');
    const pendingEl = document.getElementById('pendingCount');
    const overallEl = document.getElementById('overallCompletion');
    const coursesEl = document.getElementById('coursesCount');
    const quizzesEl = document.getElementById('quizzesCount');
    const avgEl = document.getElementById('userAvgScore');
    try {
      const meRes = await fetch('/api/me');
      if (!meRes.ok) throw new Error('not logged');
      const meData = await meRes.json();
      if (meData && meData.ok && meData.user) {
        if (nameEl) nameEl.textContent = meData.user.username || 'User';
        if (pendingEl) pendingEl.textContent = meData.user.quizzes_completed ?? '0';
      }
      const statsRes = await fetch('/api/user-stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData && statsData.ok && statsData.stats) {
            const attempts = statsData.stats.attempts || 0;
            const avg = statsData.stats.avg_score || 0;
            if (avgEl) avgEl.textContent = avg;
            if (quizzesEl) quizzesEl.textContent = attempts;
            // use total_quizzes from meData if available
            const totalQuizzes = (meData && meData.user && (meData.user.total_quizzes || meData.user.total_quizzes === 0)) ? meData.user.total_quizzes : null;
            if (overallEl) {
              if (totalQuizzes && totalQuizzes > 0) {
                const pct = Math.min(100, Math.round((attempts / totalQuizzes) * 100));
                overallEl.textContent = pct + '%';
              } else {
                overallEl.textContent = '-';
              }
            }
          if (coursesEl && coursesEl.textContent === '-') {
            // leave courses unknown unless we have data; show placeholder
            coursesEl.textContent = '-';
          }
        }
      }
    } catch (err) {
      // Not logged in or network error - ensure UI shows guest defaults
      if (nameEl) nameEl.textContent = 'Guest';
      if (pendingEl) pendingEl.textContent = '-';
      if (overallEl) overallEl.textContent = '-';
      if (coursesEl) coursesEl.textContent = '-';
      if (quizzesEl) quizzesEl.textContent = '-';
      if (avgEl) avgEl.textContent = '-';
    }
  }

  // Auto-run if any of the stat targets exist on the page
  if (document.getElementById('profileName') || document.getElementById('overallCompletion') || document.getElementById('userAvgScore')) {
    loadUserInfo();
  }

})();
