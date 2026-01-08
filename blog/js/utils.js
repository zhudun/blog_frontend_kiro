/**
 * 工具函数
 */

// 格式化日期
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    // 小于1分钟
    if (diff < 60 * 1000) {
        return '刚刚';
    }
    // 小于1小时
    if (diff < 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 1000)) + '分钟前';
    }
    // 小于24小时
    if (diff < 24 * 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
    }
    // 小于7天
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前';
    }
    
    // 其他情况显示完整日期
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    if (year === now.getFullYear()) {
        return `${month}-${day}`;
    }
    return `${year}-${month}-${day}`;
}

// 格式化数字
function formatNumber(num) {
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + 'w';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

// 截取文本
function truncate(text, length = 100) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

// 防抖函数
function debounce(fn, delay = 300) {
    let timer = null;
    return function(...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// 节流函数
function throttle(fn, delay = 300) {
    let last = 0;
    return function(...args) {
        const now = Date.now();
        if (now - last >= delay) {
            last = now;
            fn.apply(this, args);
        }
    };
}

// 显示 Toast 提示
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const icons = {
        success: 'ri-checkbox-circle-fill',
        error: 'ri-close-circle-fill',
        warning: 'ri-error-warning-fill',
        info: 'ri-information-fill'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// 获取 URL 参数
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

// 更新 URL 参数
function updateUrlParams(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
            url.searchParams.set(key, params[key]);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.pushState({}, '', url);
}

// 默认头像
function getDefaultAvatar(name) {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
    const color = colors[name.charCodeAt(0) % colors.length];
    const initial = name.charAt(0).toUpperCase();
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
            <rect width="100" height="100" fill="${color}"/>
            <text x="50" y="50" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">${initial}</text>
        </svg>
    `)}`;
}

// 默认封面图
function getDefaultCover(title) {
    const colors = [
        ['#667eea', '#764ba2'],
        ['#f093fb', '#f5576c'],
        ['#4facfe', '#00f2fe'],
        ['#43e97b', '#38f9d7'],
        ['#fa709a', '#fee140'],
        ['#a8edea', '#fed6e3']
    ];
    const [c1, c2] = colors[title.charCodeAt(0) % colors.length];
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="400">
            <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${c1}"/>
                    <stop offset="100%" style="stop-color:${c2}"/>
                </linearGradient>
            </defs>
            <rect width="800" height="400" fill="url(#g)"/>
            <text x="400" y="200" font-size="24" fill="white" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" opacity="0.8">${truncate(title, 30)}</text>
        </svg>
    `)}`;
}

// 检查是否登录
function isLoggedIn() {
    return !!api.getToken();
}

// 需要登录才能操作
function requireLogin(callback) {
    if (!isLoggedIn()) {
        showToast('请先登录', 'warning');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1000);
        return false;
    }
    if (callback) callback();
    return true;
}

// 复制到剪贴板
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('复制成功', 'success');
    } catch (err) {
        showToast('复制失败', 'error');
    }
}

// 滚动到顶部
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 生成随机 ID
function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 解析 Markdown（简单版本）
function parseMarkdown(text) {
    if (!text) return '';
    
    // 先处理代码块，避免被其他规则影响
    const codeBlocks = [];
    text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        codeBlocks.push(`<pre><code class="language-${lang}">${code}</code></pre>`);
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });
    
    return text
        // 表格
        .replace(/^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm, function(match, header, rows) {
            const headers = header.split('|').filter(h => h.trim()).map(h => `<th>${h.trim()}</th>`).join('');
            const rowsHtml = rows.trim().split('\n').map(row => {
                const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
                return `<tr>${cells}</tr>`;
            }).join('');
            return `<table><thead><tr>${headers}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
        })
        // 分隔线
        .replace(/^[-*_]{3,}\s*$/gm, '<hr>')
        // 标题（从 h6 到 h1）
        .replace(/^###### (.*$)/gm, '<h6>$1</h6>')
        .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
        .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // 无序列表（连续的列表项包裹在 ul 中）
        .replace(/((?:^[\-\*] .+$\n?)+)/gm, function(match) {
            const items = match.trim().split('\n').map(line => {
                return line.replace(/^[\-\*] (.+)$/, '<li>$1</li>');
            }).join('');
            return `<ul>${items}</ul>`;
        })
        // 有序列表
        .replace(/((?:^\d+\. .+$\n?)+)/gm, function(match) {
            const items = match.trim().split('\n').map(line => {
                return line.replace(/^\d+\. (.+)$/, '<li>$1</li>');
            }).join('');
            return `<ol>${items}</ol>`;
        })
        // 引用
        .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
        // 粗体
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // 斜体
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // 行内代码
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // 链接
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        // 图片
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
        // 段落（两个换行符分隔）
        .replace(/\n\n/g, '</p><p>')
        // 单个换行
        .replace(/\n/g, '<br>')
        // 包裹段落
        .replace(/^(.+)/, '<p>$1')
        .replace(/(.+)$/, '$1</p>')
        // 恢复代码块
        .replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => codeBlocks[index]);
}
