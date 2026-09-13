import { supabase } from './supabase.js'

export const $ = (sel) => document.querySelector(sel)
export const $$ = (sel) => document.querySelectorAll(sel)

// ============ 主题 ============
export function initTheme() {
  const toggle = document.getElementById('theme-toggle')
  if (!toggle) return

  toggle.addEventListener('click', () => {
    const html = document.documentElement
    const current = html.getAttribute('data-theme') || 'dark'
    const next = current === 'dark' ? 'light' : 'dark'
    html.classList.add('theme-transitioning')
    html.setAttribute('data-theme', next)
    try { localStorage.setItem('theme', next) } catch (e) {}
    clearTimeout(window.__themeTimer)
    window.__themeTimer = setTimeout(() => {
      html.classList.remove('theme-transitioning')
    }, 600)
  })
}

// ============ 时钟 ============
const WEEK_DATA = [
  { jp: '日曜日', cn: '日', en: 'Sunday' },
  { jp: '月曜日', cn: '一', en: 'Monday' },
  { jp: '火曜日', cn: '二', en: 'Tuesday' },
  { jp: '水曜日', cn: '三', en: 'Wednesday' },
  { jp: '木曜日', cn: '四', en: 'Thursday' },
  { jp: '金曜日', cn: '五', en: 'Friday' },
  { jp: '土曜日', cn: '六', en: 'Saturday' }
]

function pad2(n) { return String(n).padStart(2, '0') }

export function initClock() {
  const clockEl = document.getElementById('clock_c')
  const dateEl = document.getElementById('date_c')
  const jpEl = document.getElementById('cweek-jp')
  const cnEl = document.getElementById('cweek-cn')
  const enEl = document.getElementById('cweek-en')
  if (!clockEl || !dateEl) return

  let lastSec = -1
  function tick() {
    const d = new Date()
    if (d.getSeconds() !== lastSec) {
      lastSec = d.getSeconds()
      clockEl.textContent = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
    }
    dateEl.textContent = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
    const w = WEEK_DATA[d.getDay()]
    if (jpEl) jpEl.textContent = w.jp
    if (cnEl) cnEl.textContent = `(${w.cn})`
    if (enEl) enEl.textContent = w.en
  }
  tick()
  setInterval(tick, 1000)
}

// ============ 隐藏管理员入口 ============
export async function initSecretAdminEntry() {
  const logo = document.querySelector('.nav-logo')
  if (!logo) return
  let clicks = 0
  let timer = null
  const NEEDED = 3
  const WINDOW = 1000

  logo.addEventListener('click', async (e) => {
    e.preventDefault()
    clicks++
    if (clicks >= NEEDED) {
      clearTimeout(timer); clicks = 0
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
        if (profile && profile.role === 'admin') { location.href = 'admin.html'; return }
      }
      location.href = 'admin-entry.html'
      return
    }
    clearTimeout(timer)
    timer = setTimeout(() => {
      if (clicks === 1) location.href = 'index.html'
      clicks = 0
    }, WINDOW)
  })
}

// ============ 工具 ============
export function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function formatTime(ts) {
  const d = new Date(ts)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function showMsg(el, text, type) {
  if (type == null) type = 'error'
  el.className = 'msg msg-' + type
  el.textContent = text
  el.style.display = 'block'
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  if (type === 'success') setTimeout(() => { el.style.display = 'none' }, 3000)
}

export function initial(name) {
  if (!name) return '?'
  const ch = String(name).trim()[0]
  return /[a-zA-Z]/.test(ch) ? ch.toUpperCase() : ch
}

// ============ 会话 ============
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}

// ============ 导航渲染 ============
export async function renderNav() {
  initTheme()
  initClock()
  initSecretAdminEntry()
  initSearch()

  const navRight = document.getElementById('nav-right')
  if (!navRight) return

  let user = null
  try {
    user = await getUser()
  } catch (err) {
    console.warn('获取用户失败：', err)
  }

  if (user) {
    const profile = await getProfile(user.id)
    const name = (profile && profile.username) || user.email
    const wood = (profile && profile.rolling_wood != null) ? profile.rolling_wood : 0
    const isAdmin = !!(profile && profile.role === 'admin')
    const avatarUrl = profile && profile.avatar_url

    const avatarInner = avatarUrl
      ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(name)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
      : escapeHtml(initial(name))

    navRight.innerHTML = `
      <div class="user-menu" id="user-menu">
        <button class="user-trigger" id="user-trigger" type="button" aria-haspopup="true" aria-expanded="false">
          <span class="user-avatar">${avatarInner}</span>
          <span class="user-name">${escapeHtml(name)}</span>
          <span class="user-wood" title="滚木余额">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="8" width="18" height="4" rx="2"/>
              <path d="M5 12v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/>
            </svg>
            <span id="nav-wood">${wood}</span>
          </span>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <div class="user-dropdown" id="user-dropdown" role="menu">
          <div class="dropdown-header">
            <div class="user-avatar-lg">${avatarUrl
              ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(name)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
              : escapeHtml(initial(name))}</div>
            <div style="flex:1;min-width:0;">
              <div class="dropdown-username">${escapeHtml(name)}</div>
              <div class="dropdown-wood">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="8" width="18" height="4" rx="2"/>
                  <path d="M5 12v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/>
                </svg>
                ${wood} 个滚木
              </div>
            </div>
          </div>

          <a href="profile.html" class="dropdown-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            个人主页
          </a>

          <a href="messages.html" class="dropdown-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            消息通知
          </a>

          <a href="new.html" class="dropdown-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            发新帖
          </a>

          ${isAdmin ? `
            <a href="admin.html" class="dropdown-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              管理面板
            </a>
          ` : ''}

          <div class="dropdown-divider"></div>

          <button class="dropdown-item dropdown-logout" id="logout-btn" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            退出登录
          </button>
        </div>
      </div>
    `

    document.getElementById('logout-btn').onclick = async () => {
      await supabase.auth.signOut()
      location.href = 'index.html'
    }

    const menu = document.getElementById('user-menu')
    const trigger = document.getElementById('user-trigger')
    let hoverTimer = null

    menu.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimer)
      menu.classList.add('open')
      trigger.setAttribute('aria-expanded', 'true')
    })
    menu.addEventListener('mouseleave', () => {
      hoverTimer = setTimeout(() => {
        menu.classList.remove('open')
        trigger.setAttribute('aria-expanded', 'false')
      }, 180)
    })
    trigger.addEventListener('click', (e) => {
      e.stopPropagation()
      menu.classList.toggle('open')
      trigger.setAttribute('aria-expanded', menu.classList.contains('open'))
    })
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target)) {
        menu.classList.remove('open')
        trigger.setAttribute('aria-expanded', 'false')
      }
    })
  } else {
    navRight.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm">登录 / 注册</a>`
  }
}

// ============ 需要登录 ============
export async function requireLogin() {
  const user = await getUser()
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    location.href = `login.html?redirect=${redirect}`
    return null
  }
  return user
}

// ============ 统计 ============
export async function loadStats() {
  try {
    const set = (id, val) => {
      const el = document.getElementById(id)
      if (el) el.textContent = val
    }
    const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true })
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const { count: todayCount } = await supabase.from('posts').select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const { count: yestCount } = await supabase.from('posts').select('*', { count: 'exact', head: true })
      .gte('created_at', yesterdayStart.toISOString())
      .lt('created_at', todayStart.toISOString())
    const { data: newest } = await supabase.from('profiles').select('username')
      .order('created_at', { ascending: false }).limit(1).maybeSingle()

    set('stat-posts', postCount == null ? 0 : postCount)
    set('stat-users', userCount == null ? 0 : userCount)
    set('stat-today', todayCount == null ? 0 : todayCount)
    set('stat-yesterday', yestCount == null ? 0 : yestCount)
    set('stat-newest', (newest && newest.username) || '—')
    set('board-count-posts', postCount == null ? 0 : postCount)
    set('signin-count', (userCount == null ? 0 : userCount) + ' 人')
  } catch (e) {
    console.warn('加载统计失败：', e)
  }
}

// ============ 帖子列表 ============
export async function loadPosts(containerId, keyword) {
  if (keyword == null) keyword = ''
  const container = document.getElementById(containerId)
  if (!container) return

  let query = supabase
    .from('posts')
    .select('id, title, content, created_at, author_id, tags_major, tags_minor, profiles!author_id(username, avatar_url), comments(count), likes(count), tips(count)')

  if (keyword) {
    query = query.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    container.innerHTML = `<div class="empty">加载失败：${escapeHtml(error.message)}</div>`
    return
  }
  if (!data || !data.length) {
    container.innerHTML = keyword
      ? `<div class="empty">没有找到和「${escapeHtml(keyword)}」相关的帖子</div>`
      : `<div class="empty">
          <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <div>还没有帖子，<a href="new.html">来发第一帖</a>吧</div>
        </div>`
    return
  }

  container.innerHTML = data.map((p, i) => {
    const username = (p.profiles && p.profiles.username) || '匿名'
    const avatarUrl = p.profiles && p.profiles.avatar_url
    const cCount = (p.comments && p.comments[0] && p.comments[0].count) || 0
    const lCount = (p.likes && p.likes[0] && p.likes[0].count) || 0
    const tCount = (p.tips && p.tips[0] && p.tips[0].count) || 0
    const majors = p.tags_major || []
    const minors = p.tags_minor || []

    const avatarInner = avatarUrl
      ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(username)}" class="avatar avatar-img">`
      : `<div class="avatar">${escapeHtml(initial(username))}</div>`

    const raw = String(p.content || '')
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '[图片]')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[#*>`~_\-]/g, '')
      .replace(/\n+/g, ' ').trim()
    const summary = raw.slice(0, 140) + (raw.length > 140 ? '…' : '')

    return `
      <div class="card post-card" style="animation-delay:${Math.min(i * 55, 400)}ms;">
        <a href="post.html?id=${p.id}" class="post-link" aria-label="${escapeHtml(p.title)}"></a>
        <div class="card-head">
          <a href="profile.html?id=${encodeURIComponent(p.author_id)}" class="avatar-link" onclick="event.stopPropagation();">
            ${avatarInner}
          </a>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.85rem;color:var(--text-dim);font-weight:500;">
              ${escapeHtml(username)}
            </div>
            <div style="font-size:0.78rem;color:var(--text-muted);">
              ${formatTime(p.created_at)}
            </div>
          </div>
        </div>
        <h3>${escapeHtml(p.title)}</h3>
        ${(majors.length || minors.length) ? `
          <div class="post-tags">
            ${majors.map(t => `<a href="board.html?tag=${encodeURIComponent(t)}" class="tag-major">${escapeHtml(t)}</a>`).join('')}
            ${minors.map(t => `<a href="search.html?tag=${encodeURIComponent(t)}&type=minor" class="tag-minor">${escapeHtml(t)}</a>`).join('')}
          </div>
        ` : ''}
        ${summary ? `<div class="card-body">${escapeHtml(summary)}</div>` : ''}
        <div class="card-foot">
          <span class="stat">
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            ${cCount}
          </span>
          <span class="stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            ${lCount}
          </span>
          <span class="stat" title="收到滚木">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="8" width="18" height="4" rx="2"/>
              <path d="M5 12v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/>
            </svg>
            ${tCount}
          </span>
          <span class="stat" style="color:var(--primary-light);margin-left:auto;">查看 →</span>
        </div>
      </div>
    `
  }).join('')

  bindCardGlow(container)
}

// ============ 搜索 ============
export function initSearch() {
  const input = document.getElementById('nav-search')
  const clearBtn = document.getElementById('search-clear')
  if (!input) return

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const q = input.value.trim()
      if (q) location.href = `search.html?q=${encodeURIComponent(q)}`
    }
  })

  input.addEventListener('input', () => {
    if (clearBtn) clearBtn.style.display = input.value.trim() ? 'flex' : 'none'
  })

  if (clearBtn) {
    clearBtn.onclick = () => {
      input.value = ''
      clearBtn.style.display = 'none'
      input.focus()
    }
  }
}

// ============ 卡片光晕 ============
export function bindCardGlow(root) {
  if (root == null) root = document
  root.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      card.style.setProperty('--mx', x + '%')
      card.style.setProperty('--my', y + '%')
    }, { passive: true })
  })
}

// ============ 滚动进度条 ============
export function initScrollProgress() {
  const bar = document.createElement('div')
  bar.className = 'scroll-progress'
  document.body.prepend(bar)
  let ticking = false
  const update = () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0
    bar.style.width = progress + '%'
    ticking = false
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(update)
    }
  }, { passive: true })
  update()
}

initScrollProgress()