const state = {
    currentPage: 1,
    totalPages: 1,
    keyword: '',
    categoryId: null,
    tagId: null,
    tagName: '',
    mine: '',
    loading: false,
    categories: [],
    tags: []
};

document.addEventListener('DOMContentLoaded', async () => {
    mountChrome('home');
    document.getElementById('siteTitle').textContent = SITE.name;
    document.getElementById('siteLede').textContent = SITE.tagline;
    document.title = SITE.name;

    const params = getUrlParams();
    state.categoryId = params.category || null;
    state.tagId = params.tag || null;
    state.keyword = params.keyword || '';
    state.mine = params.mine || '';
    document.getElementById('searchInput').value = state.keyword;

    if (state.mine === 'drafts' && !isLoggedIn()) {
        window.location.href = 'login.html?next=' + encodeURIComponent('index.html?mine=drafts');
        return;
    }

    document.getElementById('searchInput').addEventListener('input', debounce((e) => {
        state.keyword = e.target.value.trim();
        state.currentPage = 1;
        updateUrlParams({ keyword: state.keyword });
        loadPosts();
    }, 400));

    document.getElementById('loadMoreBtn').addEventListener('click', () => {
        if (state.currentPage < state.totalPages) {
            state.currentPage += 1;
            loadPosts(true);
        }
    });

    window.addEventListener('popstate', () => window.location.reload());

    await Promise.all([loadCategories(), loadTags()]);
    await loadPosts();
});

async function loadCategories() {
    try {
        const res = await categoryAPI.getAll();
        if (res.code === 200 && Array.isArray(res.data)) {
            state.categories = res.data;
        }
    } catch (error) {
        console.error(error);
    }
    renderChips();
}

async function loadTags() {
    try {
        const res = await tagAPI.getAll();
        if (res.code === 200 && Array.isArray(res.data)) {
            state.tags = res.data;
        }
    } catch (error) {
        console.error(error);
    }
}

function renderChips() {
    const chips = document.getElementById('categoryChips');
    const items = [{ id: '', name: '全部' }, ...state.categories];
    chips.innerHTML = items.map((cat) => `
        <button type="button" class="chip ${String(state.categoryId || '') === String(cat.id) ? 'is-active' : ''}" data-id="${cat.id}">
            ${escapeHtml(cat.name)}
        </button>
    `).join('');

    chips.querySelectorAll('.chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            state.categoryId = chip.dataset.id || null;
            state.currentPage = 1;
            updateUrlParams({ category: state.categoryId });
            renderChips();
            loadPosts();
        });
    });
}

function currentTagName() {
    if (!state.tagId) return '';
    const tag = state.tags.find((item) => String(item.id) === String(state.tagId));
    return tag ? tag.name : '';
}

function renderNote() {
    const note = document.getElementById('listNote');
    const parts = [];
    if (state.mine === 'drafts') parts.push('未发布的草稿');
    const category = state.categories.find((item) => String(item.id) === String(state.categoryId));
    if (category) parts.push(category.name);
    const tagName = currentTagName();
    if (tagName) parts.push(tagName);
    if (state.keyword) parts.push(`搜索「${state.keyword}」`);

    if (!parts.length) {
        note.hidden = true;
        return;
    }

    note.hidden = false;
    note.innerHTML = `${escapeHtml(parts.join(' · '))} <button type="button" id="clearFilters">清除</button>`;
    document.getElementById('clearFilters').addEventListener('click', () => {
        state.categoryId = null;
        state.tagId = null;
        state.keyword = '';
        state.mine = '';
        state.currentPage = 1;
        document.getElementById('searchInput').value = '';
        updateUrlParams({ category: '', tag: '', keyword: '', mine: '' });
        renderChips();
        loadPosts();
    });
}

async function loadPosts(append = false) {
    if (state.loading) return;
    state.loading = true;
    const list = document.getElementById('postsList');
    if (!append) list.innerHTML = '<p class="loading">正在翻开…</p>';
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
            list.innerHTML = '<p class="empty">文章暂时没有加载出来。</p>';
            return;
        }

        state.totalPages = res.data.pages || 1;
        if (append) {
            list.insertAdjacentHTML('beforeend', records.map(renderEntry).join(''));
        } else if (!records.length) {
            list.innerHTML = `<p class="empty">${state.mine === 'drafts' ? '没有草稿。' : '还没有文章。'}</p>`;
        } else {
            list.innerHTML = records.map(renderEntry).join('');
        }

        const more = document.getElementById('loadMoreBtn');
        const hasMore = state.currentPage < state.totalPages && records.length > 0;
        more.hidden = !hasMore;
    } catch (error) {
        list.innerHTML = '<p class="empty">文章暂时没有加载出来。</p>';
    } finally {
        state.loading = false;
    }
}

function renderEntry(post) {
    const tags = post.tags || [];
    const bits = [];
    if (post.category) {
        bits.push(`<a href="index.html?category=${encodeURIComponent(post.categoryId)}">${escapeHtml(post.category)}</a>`);
    }
    if (post.readTime) bits.push(`${post.readTime} 分钟`);
    tags.slice(0, 3).forEach((name) => {
        const found = state.tags.find((tag) => tag.name === name);
        bits.push(found
            ? `<a href="index.html?tag=${found.id}">${escapeHtml(name)}</a>`
            : escapeHtml(name));
    });

    return `
        <article class="entry">
            <time datetime="${escapeHtml(post.createdAt || '')}">${formatLongDate(post.createdAt)}</time>
            <div>
                <h2><a href="post.html?slug=${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></h2>
                ${post.excerpt ? `<p class="excerpt">${escapeHtml(toPlain(post.excerpt))}</p>` : ''}
                ${bits.length ? `<div class="entry-meta">${bits.join(' · ')}</div>` : ''}
            </div>
        </article>
    `;
}
