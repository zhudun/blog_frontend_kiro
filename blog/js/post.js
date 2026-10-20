document.addEventListener('DOMContentLoaded', async () => {
    mountChrome();
    const root = document.getElementById('postArticle');
    const slug = getUrlParams().slug;

    if (!slug) {
        root.innerHTML = emptyPost('没有找到这篇文章。');
        return;
    }

    root.innerHTML = '<p class="loading">正在翻开…</p>';

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
    return `<p class="empty">${escapeHtml(message)} <a href="index.html">回首页</a></p>`;
}

function renderPost(post) {
    const user = api.getUser();
    const isOwner = user && post.author && String(user.id) === String(post.author.id);
    const tags = post.tags || [];
    document.title = `${post.title} - ${SITE.name}`;

    const tagHtml = tags.map((name) => `<span>${escapeHtml(name)}</span>`).join('<span> · </span>');
    const cover = post.coverImage
        ? `<figure class="cover"><img src="${escapeHtml(post.coverImage)}" alt=""></figure>`
        : '';

    document.getElementById('postArticle').innerHTML = `
        <a class="back" href="index.html">← ${escapeHtml(SITE.name)}</a>
        ${post.category ? `<p class="kicker"><a href="index.html?category=${encodeURIComponent(post.categoryId)}">${escapeHtml(post.category)}</a></p>` : ''}
        <h1>${escapeHtml(post.title)}</h1>
        <div class="post-meta">
            <span>${formatLongDate(post.createdAt)}</span>
            ${post.readTime ? `<span>约 ${post.readTime} 分钟</span>` : ''}
            ${post.views ? `<span>${post.views} 次阅读</span>` : ''}
            ${post.status === 'draft' ? '<span>草稿</span>' : ''}
            ${tagHtml}
        </div>
        ${cover}
        <div class="prose" id="postContent">${parseMarkdown(post.content)}</div>
        <div class="post-actions">
            <button type="button" class="text-btn" id="copyLink">复制链接</button>
            ${isOwner ? `<a href="write.html?slug=${encodeURIComponent(post.slug)}">编辑</a>` : ''}
            ${isOwner ? `<button type="button" class="text-btn" id="deletePost">删除</button>` : ''}
        </div>
    `;

    renderMath(document.getElementById('postContent'));

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
