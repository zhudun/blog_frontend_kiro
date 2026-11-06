/**
 * 站点名称与共用框架。改名字、副标题、公告只动这里。
 */
const SITE = {
    name: '札记',
    tagline: '记录技术与生活。',
    subtitles: ['记录技术与生活。', 'Stay hungry, stay foolish.', '代码改变世界'],
    announcement: '欢迎来到札记。',
    description: '记录技术与生活。',
    github: 'https://github.com/zhudun',
    avatar: 'img/avatar.svg',
    since: '2025-01-01',
    about: [
        '这是我自己的博客。文章公开可读，写文章只需要我的账号。',
        '没有注册，没有关注，也没有点赞。想留下的东西，写下来就好。'
    ]
};

const NAV_ITEMS = [
    { href: 'index.html', icon: 'fas fa-home', label: '首页', key: 'home' },
    { href: 'archives.html', icon: 'fas fa-archive', label: '归档', key: 'archives' },
    { href: 'tags.html', icon: 'fas fa-tags', label: '标签', key: 'tags' },
    { href: 'categories.html', icon: 'fas fa-folder-open', label: '分类', key: 'categories' },
    { href: 'about.html', icon: 'fas fa-heart', label: '关于', key: 'about' }
];

function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const icon = document.querySelector('#darkmode i');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-adjust';
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
        btn.textContent = theme === 'dark' ? '亮' : '暗';
        btn.setAttribute('aria-label', theme === 'dark' ? '切换到浅色' : '切换到深色');
    });
}

function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) applyTheme(saved);
    else {
        const hour = new Date().getHours();
        applyTheme(hour <= 6 || hour >= 18 ? 'dark' : 'light');
    }
}

function toggleTheme() {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

function menuMarkup(active) {
    const authed = typeof api !== 'undefined' && !!api.getToken();
    const items = NAV_ITEMS.map((item) => `
        <div class="menus_item">
            <a class="site-page ${active === item.key ? 'is-active' : ''}" href="${item.href}">
                <i class="fa-fw ${item.icon}"></i><span> ${item.label}</span>
            </a>
        </div>
    `).join('');
    const extra = authed
        ? `<div class="menus_item"><a class="site-page ${active === 'write' ? 'is-active' : ''}" href="write.html"><i class="fa-fw fas fa-pen"></i><span> 写文章</span></a></div>
           <div class="menus_item"><a class="site-page" href="index.html?mine=drafts"><i class="fa-fw fas fa-file-alt"></i><span> 草稿</span></a></div>
           <div class="menus_item"><button type="button" class="site-page logout-btn"><i class="fa-fw fas fa-sign-out-alt"></i><span> 退出</span></button></div>`
        : `<div class="menus_item"><a class="site-page ${active === 'login' ? 'is-active' : ''}" href="login.html"><i class="fa-fw fas fa-user"></i><span> 登录</span></a></div>`;
    return items + extra;
}

function mountFrame(active) {
    const nav = document.getElementById('nav');
    if (nav) {
        nav.innerHTML = `
            <span id="blog-info">
                <a class="nav-site-title" href="index.html"><span class="site-name">${escapeHtml(SITE.name)}</span></a>
            </span>
            <div id="menus">
                <div id="search-button">
                    <button type="button" class="site-page social-icon search" id="openSearch">
                        <i class="fas fa-search fa-fw"></i><span> 搜索</span>
                    </button>
                </div>
                <div class="menus_items">${menuMarkup(active)}</div>
                <div id="toggle-menu">
                    <button type="button" class="site-page" id="openSidebar" aria-label="打开菜单">
                        <i class="fas fa-bars fa-fw"></i>
                    </button>
                </div>
            </div>
        `;
    }

    const sidebar = document.getElementById('sidebar-menus');
    if (sidebar) {
        sidebar.innerHTML = `
            <div class="avatar-img text-center">札</div>
            <div class="site-data text-center" id="sidebarCounts">
                <a href="archives.html"><div class="headline">文章</div><div class="length-num" data-count="posts">0</div></a>
                <a href="tags.html"><div class="headline">标签</div><div class="length-num" data-count="tags">0</div></a>
                <a href="categories.html"><div class="headline">分类</div><div class="length-num" data-count="categories">0</div></a>
            </div>
            <div class="menus_items">${menuMarkup(active)}</div>
        `;
    }

    const footer = document.getElementById('footer');
    if (footer && !footer.dataset.ready) {
        const year = new Date().getFullYear();
        const start = SITE.since.slice(0, 4);
        footer.innerHTML = `
            <div class="footer-other">
                <div class="footer-copyright"><span class="copyright">&copy;&nbsp;${start} - ${year} By ${escapeHtml(SITE.name)}</span></div>
                <div class="footer_custom_text">${escapeHtml(SITE.tagline)}</div>
            </div>
        `;
        footer.dataset.ready = '1';
    }

    ensureWidgets();
    bindFrame();
    applyTheme(getTheme());
    const title = document.getElementById('site-title');
    if (title && !title.textContent.trim()) title.textContent = SITE.name;
    const pageTitle = document.getElementById('page-title');
    if (pageTitle && pageTitle.dataset.fallback && !pageTitle.textContent.trim()) {
        pageTitle.textContent = pageTitle.dataset.fallback;
    }
    startSubtitle();
}

function ensureWidgets() {
    if (!document.getElementById('rightside')) {
        const side = document.createElement('div');
        side.id = 'rightside';
        side.innerHTML = `
            <div id="rightside-config-hide">
                <button id="darkmode" type="button" title="日间和夜间模式切换"><i class="fas fa-adjust"></i></button>
                <button id="hide-aside-btn" type="button" title="单栏和双栏切换"><i class="fas fa-arrows-alt-h"></i></button>
            </div>
            <div id="rightside-config-show">
                <button id="rightside-config" type="button" title="设置"><i class="fas fa-cog"></i></button>
                <button id="go-up" type="button" title="回到顶部"><span id="scrollPercent">0</span></button>
            </div>
        `;
        document.body.appendChild(side);
    }
    if (!document.getElementById('search-dialog')) {
        const dialog = document.createElement('div');
        dialog.id = 'search-dialog';
        dialog.hidden = true;
        dialog.innerHTML = `
            <div class="search-mask"></div>
            <div class="search-panel">
                <div class="search-head">
                    <i class="fas fa-search"></i>
                    <input id="searchDialogInput" type="search" placeholder="搜索文章" aria-label="搜索文章">
                    <button type="button" id="closeSearch" aria-label="关闭"><i class="fas fa-times"></i></button>
                </div>
                <div id="searchResults" class="search-results"></div>
            </div>
        `;
        document.body.appendChild(dialog);
    }
    if (!document.getElementById('toastContainer')) {
        const toasts = document.createElement('div');
        toasts.className = 'toasts';
        toasts.id = 'toastContainer';
        document.body.appendChild(toasts);
    }
}

function bindFrame() {
    document.querySelectorAll('.logout-btn').forEach((logoutBtn) => {
        if (logoutBtn.dataset.bound) return;
        logoutBtn.dataset.bound = '1';
        logoutBtn.addEventListener('click', () => {
            api.clearToken();
            window.location.href = 'index.html';
        });
    });

    const openSearch = document.getElementById('openSearch');
    if (openSearch && !openSearch.dataset.bound) {
        openSearch.dataset.bound = '1';
        openSearch.addEventListener('click', () => openSearchDialog());
    }
    const closeSearch = document.getElementById('closeSearch');
    if (closeSearch && !closeSearch.dataset.bound) {
        closeSearch.dataset.bound = '1';
        closeSearch.addEventListener('click', closeSearchDialog);
        document.querySelector('#search-dialog .search-mask').addEventListener('click', closeSearchDialog);
        document.getElementById('searchDialogInput').addEventListener('input', debounce((e) => {
            runSearch(e.target.value.trim());
        }, 350));
    }

    const sidebar = document.getElementById('sidebar');
    const openSidebar = document.getElementById('openSidebar');
    if (openSidebar && sidebar && !openSidebar.dataset.bound) {
        openSidebar.dataset.bound = '1';
        openSidebar.addEventListener('click', () => sidebar.classList.add('open'));
        const mask = document.getElementById('menu-mask');
        if (mask) mask.addEventListener('click', () => sidebar.classList.remove('open'));
    }

    const dark = document.getElementById('darkmode');
    if (dark && !dark.dataset.bound) {
        dark.dataset.bound = '1';
        dark.addEventListener('click', toggleTheme);
    }
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
        if (btn.dataset.bound) return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', toggleTheme);
    });

    const hideAside = document.getElementById('hide-aside-btn');
    if (hideAside && !hideAside.dataset.bound) {
        hideAside.dataset.bound = '1';
        if (localStorage.getItem('aside-status') === 'hide') {
            document.documentElement.classList.add('hide-aside');
        }
        hideAside.addEventListener('click', () => {
            document.documentElement.classList.toggle('hide-aside');
            localStorage.setItem('aside-status', document.documentElement.classList.contains('hide-aside') ? 'hide' : 'show');
        });
    }

    const config = document.getElementById('rightside-config');
    const rightside = document.getElementById('rightside');
    if (config && rightside && !config.dataset.bound) {
        config.dataset.bound = '1';
        config.addEventListener('click', () => rightside.classList.toggle('open'));
    }

    const goUp = document.getElementById('go-up');
    if (goUp && !goUp.dataset.bound) {
        goUp.dataset.bound = '1';
        goUp.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    const scrollDown = document.getElementById('scroll-down');
    if (scrollDown && !scrollDown.dataset.bound) {
        scrollDown.dataset.bound = '1';
        scrollDown.addEventListener('click', () => {
            const target = document.getElementById('content-inner');
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    }
}

let lastScroll = 0;
function onScroll() {
    const header = document.getElementById('page-header');
    const y = window.scrollY || document.documentElement.scrollTop;
    const goUp = document.getElementById('go-up');
    const percent = document.getElementById('scrollPercent');
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const value = height > 0 ? Math.min(100, Math.round((y / height) * 100)) : 0;
    if (percent) percent.textContent = String(value);
    if (goUp) goUp.classList.toggle('show', y > 200);

    if (header) {
        const threshold = header.classList.contains('full_page') ? Math.max(window.innerHeight - 80, 120) : 60;
        if (y > threshold) {
            header.classList.add('nav-fixed');
            header.classList.toggle('nav-visible', y < lastScroll);
        } else {
            header.classList.remove('nav-fixed', 'nav-visible');
        }
    }
    lastScroll = y;
}

function openSearchDialog() {
    const dialog = document.getElementById('search-dialog');
    dialog.hidden = false;
    document.body.classList.add('search-open');
    const input = document.getElementById('searchDialogInput');
    input.focus();
}

function closeSearchDialog() {
    const dialog = document.getElementById('search-dialog');
    if (dialog) dialog.hidden = true;
    document.body.classList.remove('search-open');
}

async function runSearch(keyword) {
    const box = document.getElementById('searchResults');
    if (!keyword) {
        box.innerHTML = '<p class="search-empty">输入关键词，搜索标题和摘要。</p>';
        return;
    }
    box.innerHTML = '<p class="search-empty">正在搜索…</p>';
    try {
        const res = await postAPI.getList({
            page: 1,
            limit: 8,
            keyword,
            status: 'published',
            sortBy: 'createdAt',
            order: 'desc'
        });
        const records = res.code === 200 && res.data ? (res.data.records || []) : [];
        if (!records.length) {
            box.innerHTML = `<p class="search-empty">未找到符合「${escapeHtml(keyword)}」的文章。</p>`;
            return;
        }
        box.innerHTML = records.map((post) => `
            <a class="search-hit" href="post.html?slug=${encodeURIComponent(post.slug)}">
                <span class="search-hit-title">${escapeHtml(post.title)}</span>
                <span class="search-hit-meta">${escapeHtml(formatDashDate(post.createdAt))}${post.category ? ' · ' + escapeHtml(post.category) : ''}</span>
            </a>
        `).join('');
    } catch (error) {
        box.innerHTML = '<p class="search-empty">搜索暂时不可用。</p>';
    }
}

function startSubtitle() {
    const el = document.getElementById('subtitle');
    if (!el || el.dataset.ready) return;
    el.dataset.ready = '1';
    if (typeof Typed === 'function') {
        new Typed('#subtitle', {
            strings: SITE.subtitles,
            startDelay: 300,
            typeSpeed: 100,
            backSpeed: 50,
            loop: true
        });
    } else {
        el.textContent = SITE.subtitles[0] || SITE.tagline;
    }
}

function endLoading() {
    const box = document.getElementById('loading-box');
    if (!box) return;
    box.classList.add('loaded');
    document.body.style.overflow = '';
}

function runtimeText() {
    const start = new Date(SITE.since);
    if (Number.isNaN(start.getTime())) return '';
    const days = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000));
    return `${days} 天`;
}

function setCounts(posts, tags, categories) {
    const write = (key, value) => {
        if (value === '' || value === undefined || value === null) return;
        document.querySelectorAll(`[data-count="${key}"]`).forEach((el) => { el.textContent = value; });
    };
    write('posts', posts);
    write('tags', tags);
    write('categories', categories);
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    endLoading();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearchDialog();
});
window.addEventListener('load', endLoading);
setTimeout(endLoading, 2500);
