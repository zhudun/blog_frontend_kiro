function formatLongDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
}

function debounce(fn, delay = 300) {
    let timer = null;
    return function (...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function showToast(message, type = 'info', duration = 2600) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' || type === 'warning' ? 'error' : ''}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), duration);
}

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) result[key] = value;
    return result;
}

function updateUrlParams(params) {
    const url = new URL(window.location.href);
    Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
            url.searchParams.set(key, params[key]);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.pushState({}, '', url);
}

function isLoggedIn() {
    return !!api.getToken();
}

function toPlain(text) {
    if (!text) return '';
    return String(text)
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
        .replace(/[#>*_`]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function parseMarkdown(text) {
    if (!text) return '';

    let source = escapeHtml(text);
    const codeBlocks = [];
    source = source.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        codeBlocks.push(`<pre><code class="language-${lang}">${code}</code></pre>`);
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    let html = source
        .replace(/^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm, (match, header, rows) => {
            const headers = header.split('|').filter((h) => h.trim()).map((h) => `<th>${h.trim()}</th>`).join('');
            const rowsHtml = rows.trim().split('\n').map((row) => {
                const cells = row.split('|').filter((c) => c.trim()).map((c) => `<td>${c.trim()}</td>`).join('');
                return `<tr>${cells}</tr>`;
            }).join('');
            return `<table><thead><tr>${headers}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
        })
        .replace(/^[-*_]{3,}\s*$/gm, '<hr>')
        .replace(/^###### (.*$)/gm, '<h6>$1</h6>')
        .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
        .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/((?:^[\-\*] .+$\n?)+)/gm, (match) => {
            const items = match.trim().split('\n').map((line) => line.replace(/^[\-\*] (.+)$/, '<li>$1</li>')).join('');
            return `<ul>${items}</ul>`;
        })
        .replace(/((?:^\d+\. .+$\n?)+)/gm, (match) => {
            const items = match.trim().split('\n').map((line) => line.replace(/^\d+\. (.+)$/, '<li>$1</li>')).join('');
            return `<ol>${items}</ol>`;
        })
        .replace(/^&gt; (.*$)/gm, '<blockquote>$1</blockquote>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, href) => {
            const clean = /^(https?:|mailto:|\/|#)/i.test(href.trim()) ? href : '#';
            return `<a href="${clean}" target="_blank" rel="noopener">${text}</a>`;
        })
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
            const clean = /^(https?:|\/)/i.test(src.trim()) ? src : '';
            return clean ? `<img src="${clean}" alt="${alt}">` : '';
        })
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^(.+)/, '<p>$1')
        .replace(/(.+)$/, '$1</p>')
        .replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => codeBlocks[index]);

    return html;
}

function renderMath(root) {
    if (!root || typeof renderMathInElement === 'undefined') return;
    renderMathInElement(root, {
        delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
    });
}
