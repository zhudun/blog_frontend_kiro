const state = {
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    keyword: '',
    categoryId: null,
    tagId: null,
    mine: '',
    loading: false,
    categories: [],
    tags: [],
    latest: []
};

document.addEventListener('DOMContentLoaded', async () => {
    mountFrame('home');
    document.title = SITE.name;
    const siteTitle = document.getElementById('site-title');
    if (siteTitle) siteTitle.textContent = SITE.name;

    const params = getUrlParams();
    state.categoryId = params.category || null;
    state.tagId = params.tag || null;
    state.keyword = params.keyword || '';
    state.mine = params.mine || '';
    state.currentPage = Math.max(1, Number(params.page) || 1);

    if (state.mine === 'drafts' && !isLoggedIn()) {
        window.location.href = 'login.html?next=' + encodeURIComponent('index.html?mine=drafts');
        return;
    }

    window.addEventListener('popstate', () => window.location.reload());

    await Promise.all([loadCategories(), loadTags(), loadLatest()]);
    await loadPosts();
    renderAside();
});

async function loadLatest() {
    try {
        const res = await postAPI.getList({
            page: 1,
            limit: 5,
            sortBy: 'createdAt',
            order: 'desc',
            status: 'published'
        });
        if (res.code === 200 && res.data) state.latest = res.data.records || [];
    } catch (error) {
        console.error(error);
    }
}

async function loadCategories() {
    try {
        const res = await categoryAPI.getAll();
        if (res.code === 200 && Array.isArray(res.data)) state.categories = res.data;
    } catch (error) {
        console.error(error);
    }
}

async function loadTags() {
    try {
        const res = await tagAPI.getAll();
        if (res.code === 200 && Array.isArray(res.data)) state.tags = res.data;
    } catch (error) {
        console.error(error);
    }
}

function currentTagName() {
    if (!state.tagId) return '';
    const tag = state.tags.find((item) => String(item.id) === String(state.tagId));
    return tag ? tag.name : '';
}

function renderNote() {
    const note = document.getElementById('listNote');
    if (!note) return;
    const parts = [];
    if (state.mine === 'drafts') parts.push('未发布的草稿');
    const category = state.categories.find((item) => String(item.id) === String(state.categoryId));
    if (category) parts.push(category.name);
    const tagName = currentTagName();
    if (tagName) parts.push(tagName);
    if (state.keyword) parts.push(`搜索「${state.keyword}」`);
    if (!parts.length) {
        note.hidden = true;
        note.innerHTML = '';
        return;
    }
    note.hidden = false;
    note.innerHTML = `<span>正在查看：${escapeHtml(parts.join(' · '))}</span> <button type="button" id="clearFilters">清除</button>`;
    document.getElementById('clearFilters').addEventListener('click', () => {
        state.categoryId = null;
        state.tagId = null;
        state.keyword = '';
        state.mine = '';
        state.currentPage = 1;
        updateUrlParams({ category: '', tag: '', keyword: '', mine: '', page: '' });
        loadPosts();
    });
}

async function loadPosts() {
    if (state.loading) return;
    state.loading = true;
    const list = document.getElementById('postsList');
    list.innerHTML = '<p class="feed-status">加载中...</p>';
    renderNote();

    try {
        const params = {
            page: state.currentPage,
            limit: 10,
            sortBy: 'createdAt',
            order: 'desc',
            status: state.mine === 'drafts' ? 'draft' : 'published'
        };
        if (state.keyword) params.keyword = state.keyword;
        if (state.categoryId) params.categoryId = state.categoryId;
        if (state.tagId) params.tagId = state.tagId;

        const res = await postAPI.getList(params);
        const records = res.code === 200 && res.data ? (res.data.records || []) : null;
        if (!records) {
            list.innerHTML = '<p class="feed-status">文章暂时没有加载出来。</p>';
            return;
        }

        state.totalPages = res.data.pages || 1;
        state.totalPosts = res.data.total || records.length;
        if (!records.length) {
            list.innerHTML = `<p class="feed-status">${state.mine === 'drafts' ? '没有草稿。' : '还没有文章。'}</p>`;
        } else {
            list.innerHTML = records.map((post, index) => renderEntry(post, index)).join('');
        }
        renderPager();
        setCounts(state.totalPosts, state.tags.length, state.categories.length);
    } catch (error) {
        list.innerHTML = '<p class="feed-status">文章暂时没有加载出来。</p>';
    } finally {
        state.loading = false;
    }
}

function tagLink(name) {
    const found = state.tags.find((tag) => tag.name === name);
    if (!found) return escapeHtml(name);
    return `<a class="article-meta__tags" href="index.html?tag=${found.id}">${escapeHtml(name)}</a>`;
}

function coverHtml(post, side) {
    const tone = coverTone(post.title);
    if (post.coverImage) {
        return `
            <div class="post_cover ${side}">
                <a href="post.html?slug=${encodeURIComponent(post.slug)}" title="${escapeHtml(post.title)}">
                    <img class="post-bg" src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}">
                </a>
            </div>`;
    }
    return `
        <div class="post_cover ${side}">
            <a href="post.html?slug=${encodeURIComponent(post.slug)}" title="${escapeHtml(post.title)}">
                <span class="post-bg tone-${tone}"></span>
            </a>
        </div>`;
}

function renderEntry(post, index) {
    const side = index % 2 === 0 ? 'left' : 'right';
    const tags = post.tags || [];
    const created = formatDashDate(post.createdAt);
    const updated = formatDashDate(post.updatedAt || post.createdAt);
    const excerpt = toPlain(post.excerpt || '');
    const tagHtml = tags.map((name, i) => `
        ${i ? '<span class="article-meta-link">•</span>' : ''}
        <i class="fas fa-tag"></i>${tagLink(name)}
    `).join('');

    return `
        <article class="recent-post-item">
            ${coverHtml(post, side)}
            <div class="recent-post-info">
                <a class="article-title" href="post.html?slug=${encodeURIComponent(post.slug)}" title="${escapeHtml(post.title)}">
                    ${post.featured ? '<i class="fas fa-thumbtack sticky"></i>' : ''}${escapeHtml(post.title)}
                </a>
                <div class="article-meta-wrap">
                    <span class="post-meta-date">
                        <i class="far fa-calendar-alt"></i>
                        <span class="article-meta-label">发表于</span>
                        <time datetime="${escapeHtml(post.createdAt || '')}">${created}</time>
                        <span class="article-meta-separator">|</span>
                        <i class="fas fa-history"></i>
                        <span class="article-meta-label">更新于</span>
                        <time datetime="${escapeHtml(post.updatedAt || post.createdAt || '')}">${updated}</time>
                    </span>
                    ${post.category ? `
                        <span class="article-meta">
                            <span class="article-meta-separator">|</span>
                            <i class="fas fa-inbox"></i>
                            <a class="article-meta__categories" href="index.html?category=${encodeURIComponent(post.categoryId)}">${escapeHtml(post.category)}</a>
                        </span>` : ''}
                    ${tags.length ? `<span class="article-meta tags"><span class="article-meta-separator">|</span>${tagHtml}</span>` : ''}
                </div>
                ${excerpt ? `<div class="content">${escapeHtml(excerpt)}</div>` : ''}
            </div>
        </article>
    `;
}

function renderPager() {
    const pager = document.getElementById('pager');
    if (!pager) return;
    if (state.totalPages <= 1) {
        pager.innerHTML = '';
        return;
    }
    const current = state.currentPage;
    const total = state.totalPages;
    const pages = new Set([1, total, current - 1, current, current + 1]);
    const list = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
    let html = '';
    let prev = 0;
    list.forEach((n) => {
        if (prev && n - prev > 1) html += '<span class="page-number space">…</span>';
        html += n === current
            ? `<span class="page-number current">${n}</span>`
            : `<a class="page-number" href="#" data-page="${n}">${n}</a>`;
        prev = n;
    });
    if (current < total) html += `<a class="extend next" href="#" data-page="${current + 1}"><i class="fas fa-chevron-right"></i></a>`;
    pager.innerHTML = html;
    pager.querySelectorAll('[data-page]').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            state.currentPage = Number(link.dataset.page);
            updateUrlParams({ page: state.currentPage > 1 ? state.currentPage : '' });
            loadPosts();
            const target = document.getElementById('content-inner');
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

function thumb(post) {
    if (post.coverImage) {
        return `<img src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}">`;
    }
    return `<span class="tone-${coverTone(post.title)}"></span>`;
}

function renderAside() {
    const aside = document.getElementById('aside-content');
    if (!aside) return;
    const latest = state.latest.length ? state.latest : [];
    const cats = state.categories.map((cat) => `
        <li class="card-category-list-item">
            <a class="card-category-list-link" href="index.html?category=${cat.id}">
                <span class="card-category-list-name">${escapeHtml(cat.name)}</span>
                <span class="card-category-list-count">${cat.count || 0}</span>
            </a>
        </li>
    `).join('');
    const tags = state.tags.slice(0, 24).map((tag) => `
        <a class="aside-tag" href="index.html?tag=${tag.id}">${escapeHtml(tag.name)}</a>
    `).join('');
    const recent = latest.map((post) => `
        <div class="aside-list-item">
            <a class="thumbnail" href="post.html?slug=${encodeURIComponent(post.slug)}" title="${escapeHtml(post.title)}">${thumb(post)}</a>
            <div class="content">
                <a class="title" href="post.html?slug=${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a>
                <time datetime="${escapeHtml(post.createdAt || '')}">${formatDashDate(post.createdAt)}</time>
            </div>
        </div>
    `).join('');
    const updated = latest[0] ? formatDashDate(latest[0].updatedAt || latest[0].createdAt) : '';

    aside.innerHTML = `
        <div class="card-widget card-info text-center">
            <div class="avatar-img"><span>札</span></div>
            <div class="author-info-name">${escapeHtml(SITE.name)}</div>
            <div class="author-info-description">${escapeHtml(SITE.description)}</div>
            <div class="site-data">
                <a href="archives.html"><div class="headline">文章</div><div class="length-num" data-count="posts">${state.totalPosts}</div></a>
                <a href="tags.html"><div class="headline">标签</div><div class="length-num" data-count="tags">${state.tags.length}</div></a>
                <a href="categories.html"><div class="headline">分类</div><div class="length-num" data-count="categories">${state.categories.length}</div></a>
            </div>
            <a id="card-info-btn" target="_blank" rel="noopener" href="${SITE.github}"><i class="fab fa-github"></i><span>GitHub</span></a>
            <div class="card-info-social-icons">
                <a class="social-icon" href="${SITE.github}" target="_blank" rel="noopener" title="Github"><i class="fab fa-github"></i></a>
            </div>
        </div>
        <div class="card-widget card-announcement">
            <div class="item-headline"><i class="fas fa-bullhorn"></i><span>公告</span></div>
            <div class="announcement_content">${escapeHtml(SITE.announcement)}</div>
        </div>
        <div class="sticky_layout">
            <div class="card-widget card-recent-post">
                <div class="item-headline"><i class="fas fa-history"></i><span>最新文章</span></div>
                <div class="aside-list">${recent || '<p class="feed-status">还没有文章。</p>'}</div>
            </div>
            <div class="card-widget card-categories">
                <div class="item-headline">
                    <i class="fas fa-folder-open"></i><span>分类</span>
                    <a class="card-more-btn" href="categories.html" title="查看更多"><i class="fas fa-angle-right"></i></a>
                </div>
                <ul class="card-category-list">${cats}</ul>
            </div>
            <div class="card-widget card-tags">
                <div class="item-headline">
                    <i class="fas fa-tags"></i><span>标签</span>
                    <a class="card-more-btn" href="tags.html" title="查看更多"><i class="fas fa-angle-right"></i></a>
                </div>
                <div class="card-tag-cloud">${tags}</div>
            </div>
            <div class="card-widget card-webinfo">
                <div class="item-headline"><i class="fas fa-chart-line"></i><span>网站资讯</span></div>
                <div class="webinfo">
                    <div class="webinfo-item"><div class="item-name">文章数目 :</div><div class="item-count">${state.totalPosts}</div></div>
                    <div class="webinfo-item"><div class="item-name">运行时间 :</div><div class="item-count">${runtimeText()}</div></div>
                    <div class="webinfo-item"><div class="item-name">最后更新 :</div><div class="item-count">${updated || '—'}</div></div>
                </div>
            </div>
        </div>
    `;
}
