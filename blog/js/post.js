document.addEventListener('DOMContentLoaded', async () => {
    mountFrame('home');
    const slug = getUrlParams().slug;
    const root = document.getElementById('post');

    if (!slug) {
        root.innerHTML = emptyPost('没有找到这篇文章。');
        return;
    }

    root.innerHTML = '<p class="feed-status">加载中...</p>';

    try {
        const res = await postAPI.getDetail(slug);
        if (res.code !== 200 || !res.data) {
            root.innerHTML = emptyPost('没有找到这篇文章。');
            return;
        }
        renderPost(res.data);
    } catch (error) {
        root.innerHTML = emptyPost('文章暂时没有加载出来。');
    }
});

function emptyPost(message) {
    return `<p class="feed-status">${escapeHtml(message)} <a href="index.html">回首页</a></p>`;
}

async function renderPost(post) {
    const user = api.getUser();
    const isOwner = user && post.author && String(user.id) === String(post.author.id);
    const tags = post.tags || [];
    const tagIds = {};
    try {
        const tagRes = await tagAPI.getAll();
        if (tagRes.code === 200 && Array.isArray(tagRes.data)) {
            tagRes.data.forEach((tag) => { tagIds[tag.name] = tag.id; });
        }
    } catch (error) {
        console.error(error);
    }
    document.title = `${post.title} - ${SITE.name}`;

    const header = document.getElementById('page-header');
    if (header && post.coverImage) {
        header.style.backgroundImage = `url("${String(post.coverImage).replace(/"/g, '')}")`;
    }
    const title = document.getElementById('post-title');
    if (title) title.textContent = post.title;
    const meta = document.getElementById('post-meta');
    if (meta) {
        meta.innerHTML = `
            <span class="post-meta-date">
                <i class="far fa-calendar-alt"></i>
                <span class="article-meta-label">发表于</span>
                <time>${formatDashDate(post.createdAt)}</time>
                <span class="article-meta-separator">|</span>
                <i class="fas fa-history"></i>
                <span class="article-meta-label">更新于</span>
                <time>${formatDashDate(post.updatedAt || post.createdAt)}</time>
            </span>
            ${post.category ? `<span class="article-meta"><span class="article-meta-separator">|</span><i class="fas fa-inbox"></i><a href="index.html?category=${encodeURIComponent(post.categoryId)}">${escapeHtml(post.category)}</a></span>` : ''}
            ${post.readTime ? `<span class="article-meta"><span class="article-meta-separator">|</span><i class="far fa-clock"></i> ${post.readTime} 分钟</span>` : ''}
            ${post.views ? `<span class="article-meta"><span class="article-meta-separator">|</span><i class="far fa-eye"></i> ${post.views}</span>` : ''}
            ${post.status === 'draft' ? '<span class="article-meta"><span class="article-meta-separator">|</span>草稿</span>' : ''}
        `;
    }

    const tagHtml = tags.map((name) => {
        const href = tagIds[name] ? `index.html?tag=${tagIds[name]}` : 'tags.html';
        return `<a class="post-tag" href="${href}">${escapeHtml(name)}</a>`;
    }).join('');
    document.getElementById('post').innerHTML = `
        <div id="article-container">${parseMarkdown(post.content || post.excerpt || '')}</div>
        <div class="post-copyright">
            <div class="post-copyright-meta"><span class="post-copyright-info"><i class="fas fa-user-circle"></i>文章作者:</span><span class="post-copyright-info-value">${escapeHtml(post.author?.name || SITE.name)}</span></div>
            <div class="post-copyright-meta"><span class="post-copyright-info"><i class="fas fa-link"></i>文章链接:</span><span class="post-copyright-info-value"><a href="${location.href}">${escapeHtml(location.href)}</a></span></div>
            <div class="post-copyright-meta"><span class="post-copyright-info"><i class="fas fa-copyright"></i>版权声明:</span><span class="post-copyright-info-value">本博客所有文章除特别声明外，均采用 CC BY-NC-SA 4.0 许可协议。转载请注明来源。</span></div>
        </div>
        ${tags.length ? `<div class="tag_share"><div class="post-meta__tags">${tagHtml}</div></div>` : ''}
        <div class="post-actions">
            <button type="button" class="text-btn" id="copyLink"><i class="fas fa-share-alt"></i> 复制链接</button>
            ${isOwner ? `<a href="write.html?slug=${encodeURIComponent(post.slug)}"><i class="fas fa-pen"></i> 编辑</a>` : ''}
            ${isOwner ? `<button type="button" class="text-btn" id="deletePost"><i class="fas fa-trash-alt"></i> 删除</button>` : ''}
        </div>
    `;

    renderMath(document.getElementById('article-container'));
    renderToc();

    document.getElementById('copyLink').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            showToast('链接已复制');
        } catch (error) {
            showToast('复制失败', 'error');
        }
    });

    const deleteBtn = document.getElementById('deletePost');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!window.confirm('删除这篇文章？')) return;
            const res = await postAPI.delete(post.id);
            if (res.code === 200) {
                showToast('已删除');
                setTimeout(() => { window.location.href = 'index.html'; }, 500);
            }
        });
    }
}

function renderToc() {
    const article = document.getElementById('article-container');
    const aside = document.getElementById('aside-content');
    if (!article || !aside) return;
    const headings = [...article.querySelectorAll('h1, h2, h3')];
    headings.forEach((heading, index) => {
        if (!heading.id) heading.id = `heading-${index}`;
    });
    const toc = headings.length
        ? headings.map((heading) => `
            <div class="toc-item toc-${heading.tagName.toLowerCase()}">
                <a class="toc-link" href="#${heading.id}">${heading.textContent}</a>
            </div>
        `).join('')
        : '<p class="feed-status">这篇文章没有目录。</p>';

    aside.innerHTML = `
        <div class="sticky_layout">
            <div class="card-widget" id="card-toc">
                <div class="item-headline"><i class="fas fa-list-ul"></i><span>目录</span></div>
                <div class="toc-content">${toc}</div>
            </div>
            <div class="card-widget card-info text-center">
                <div class="avatar-img"><span>札</span></div>
                <div class="author-info-name">${escapeHtml(SITE.name)}</div>
                <div class="author-info-description">${escapeHtml(SITE.description)}</div>
                <a id="card-info-btn" target="_blank" rel="noopener" href="${SITE.github}"><i class="fab fa-github"></i><span>GitHub</span></a>
            </div>
        </div>
    `;

    const links = [...aside.querySelectorAll('.toc-link')];
    if (!links.length) return;
    const map = new Map(headings.map((heading, index) => [heading.id, links[index]]));
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            links.forEach((link) => link.classList.remove('active'));
            const link = map.get(entry.target.id);
            if (link) link.classList.add('active');
        });
    }, { rootMargin: '-20% 0px -70% 0px' });
    headings.forEach((heading) => observer.observe(heading));
}
