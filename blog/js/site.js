/**
 * 站点名称与共用页头页脚。改名字只动这里。
 */
const SITE = {
    name: '札记',
    tagline: '记录技术与生活。',
    about: [
        '这是我自己的博客。文章公开可读，写文章只需要我的账号。',
        '没有注册，没有关注，也没有点赞。想留下的东西，写下来就好。'
    ]
};

function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
        btn.textContent = theme === 'dark' ? '亮' : '暗';
        btn.setAttribute('aria-label', theme === 'dark' ? '切换到浅色' : '切换到深色');
    });
}

function initTheme() {
    const saved = localStorage.getItem('theme');
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(saved || preferred);
}

function toggleTheme() {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

function mountChrome(active) {
    const header = document.getElementById('siteHeader');
    const footer = document.getElementById('siteFooter');
    const authed = typeof api !== 'undefined' && !!api.getToken();

    if (header) {
        header.innerHTML = `
            <a class="brand" href="index.html">${escapeHtml(SITE.name)}</a>
            <nav class="nav" aria-label="站点">
                <a href="about.html" class="${active === 'about' ? 'is-active' : ''}">关于</a>
                <button type="button" class="text-btn" data-theme-toggle>暗</button>
                ${authed ? `
                    <a href="index.html?mine=drafts">草稿</a>
                    <a href="write.html">写文章</a>
                    <button type="button" class="text-btn" id="logoutBtn">退出</button>
                ` : `
                    <a href="login.html" class="${active === 'login' ? 'is-active' : ''}">登录</a>
                `}
            </nav>
        `;
        header.querySelector('[data-theme-toggle]').addEventListener('click', toggleTheme);
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                api.clearToken();
                window.location.href = 'index.html';
            });
        }
    }

    if (footer) {
        const year = new Date().getFullYear();
        footer.innerHTML = `<p>© ${year} ${escapeHtml(SITE.name)}</p>`;
    }

    applyTheme(getTheme());
}

document.addEventListener('DOMContentLoaded', initTheme);
