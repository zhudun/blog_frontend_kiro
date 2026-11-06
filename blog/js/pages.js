document.addEventListener('DOMContentLoaded', async () => {
    const page = document.body.dataset.page;
    mountFrame(page);
    loadCounts();
    if (page === 'about') renderAbout();
    if (page === 'tags') await renderTags();
    if (page === 'categories') await renderCategories();
    if (page === 'archives') await renderArchives();
});

async function loadCounts() {
    try {
        const [posts, tags, categories] = await Promise.all([
            postAPI.getList({ page: 1, limit: 1, status: 'published', sortBy: 'createdAt', order: 'desc' }),
            tagAPI.getAll(),
            categoryAPI.getAll()
        ]);
        setCounts(
            posts.code === 200 ? posts.data?.total : '',
            tags.code === 200 && Array.isArray(tags.data) ? tags.data.length : '',
            categories.code === 200 && Array.isArray(categories.data) ? categories.data.length : ''
        );
    } catch (error) {
        console.error(error);
    }
}

function renderAbout() {
    document.title = `关于 - ${SITE.name}`;
    document.getElementById('page-title').textContent = '关于';
    document.getElementById('page-body').innerHTML = `
        <div class="about-copy">
            ${SITE.about.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
            <p><a href="${SITE.github}" target="_blank" rel="noopener">GitHub</a></p>
        </div>
    `;
}

async function renderTags() {
    document.title = `标签 - ${SITE.name}`;
    document.getElementById('page-title').textContent = '标签';
    const box = document.getElementById('page-body');
    box.innerHTML = '<p class="feed-status">加载中...</p>';
    try {
        const res = await tagAPI.getAll();
        const tags = res.code === 200 && Array.isArray(res.data) ? res.data : [];
        setCounts('', tags.length, '');
        if (!tags.length) {
            box.innerHTML = '<p class="feed-status">还没有标签。</p>';
            return;
        }
        const colors = ['blue', 'pink', 'orange', 'purple', 'green', 'red'];
        box.innerHTML = `<div class="tag-cloud-page">${tags.map((tag, index) => `
            <a class="page-tag is-${colors[index % colors.length]}" href="index.html?tag=${tag.id}" style="font-size:${tagSize(tag.count)}px">
                ${escapeHtml(tag.name)}<span class="tag-count">${tag.count || 0}</span>
            </a>
        `).join('')}</div>`;
    } catch (error) {
        box.innerHTML = '<p class="feed-status">标签暂时没有加载出来。</p>';
    }
}

function tagSize(count) {
    const n = Number(count) || 0;
    return Math.min(28, 15 + Math.round(Math.log2(n + 1) * 3));
}

async function renderCategories() {
    document.title = `分类 - ${SITE.name}`;
    document.getElementById('page-title').textContent = '分类';
    const box = document.getElementById('page-body');
    box.innerHTML = '<p class="feed-status">加载中...</p>';
    try {
        const res = await categoryAPI.getAll();
        const categories = res.code === 200 && Array.isArray(res.data) ? res.data : [];
        setCounts('', '', categories.length);
        if (!categories.length) {
            box.innerHTML = '<p class="feed-status">还没有分类。</p>';
            return;
        }
        box.innerHTML = `<ul class="category-board">${categories.map((cat) => `
            <li>
                <a href="index.html?category=${cat.id}">
                    <span class="name"><i class="fas fa-folder-open"></i> ${escapeHtml(cat.name)}</span>
                    <span class="count">${cat.count || 0}</span>
                </a>
                ${cat.description ? `<p>${escapeHtml(cat.description)}</p>` : ''}
            </li>
        `).join('')}</ul>`;
    } catch (error) {
        box.innerHTML = '<p class="feed-status">分类暂时没有加载出来。</p>';
    }
}

async function renderArchives() {
    document.title = `归档 - ${SITE.name}`;
    document.getElementById('page-title').textContent = '归档';
    const box = document.getElementById('page-body');
    box.innerHTML = '<p class="feed-status">加载中...</p>';
    try {
        const posts = await fetchAllPosts();
        setCounts(posts.length, '', '');
        if (!posts.length) {
            box.innerHTML = '<p class="feed-status">还没有文章。</p>';
            return;
        }
        const groups = new Map();
        posts.forEach((post) => {
            const year = formatDashDate(post.createdAt).slice(0, 4) || '未知';
            if (!groups.has(year)) groups.set(year, []);
            groups.get(year).push(post);
        });
        const years = [...groups.keys()].sort((a, b) => b.localeCompare(a));
        box.innerHTML = `<div class="article-sort">${years.map((year) => `
            <div class="article-sort-title">${year}</div>
            ${groups.get(year).map((post) => `
                <div class="article-sort-item">
                    <a href="post.html?slug=${encodeURIComponent(post.slug)}">
                        <time>${formatDashDate(post.createdAt).slice(5)}</time>
                        <span class="article-sort-item-title">${escapeHtml(post.title)}</span>
                    </a>
                </div>
            `).join('')}
        `).join('')}</div>`;
    } catch (error) {
        box.innerHTML = '<p class="feed-status">归档暂时没有加载出来。</p>';
    }
}

async function fetchAllPosts() {
    const all = [];
    let page = 1;
    let pages = 1;
    while (page <= pages && page <= 20) {
        const res = await postAPI.getList({
            page,
            limit: 50,
            sortBy: 'createdAt',
            order: 'desc',
            status: 'published'
        });
        if (res.code !== 200 || !res.data) break;
        all.push(...(res.data.records || []));
        pages = res.data.pages || 1;
        page += 1;
    }
    return all;
}
