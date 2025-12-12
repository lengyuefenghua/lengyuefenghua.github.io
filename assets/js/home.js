// 主页动态内容加载
document.addEventListener('DOMContentLoaded', function() {
    const latestArticlesContainer = document.getElementById('latest-articles');
    const latestSoftwareContainer = document.getElementById('latest-software');
    
    // --- Tooltip Manager Functions (与 software.js 相同，支持全局 Tooltip) ---
    // 负责创建、更新和定位全局 Tooltip
    function createAndShowTooltip(card, software) {
        // 1. 获取现有 Tooltip 或创建一个新的全局 Tooltip
        let tooltip = document.getElementById('global-software-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'global-software-tooltip';
            tooltip.className = 'custom-tooltip';
            document.body.appendChild(tooltip);
        }
        
        // 2. 设置 Tooltip 内容
        const tooltipContent = software.details || software.description;
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <div class="tooltip-icon"><img src="${software.icon}" alt="${software.name}" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cGF0aCBkPSJNMTIgMkwyIDEySDVWMjBIMTlaTTcgMTguNUEyLjUgMi41IDAgMCAwIDkuNSAyMSAyLjUgMi41IDAgMCAwIDEyIDI0YTIuNSAyLjUgMCAwIDAgMi41LTIuNUExIDUgMCAwIDAgMTkgMjFIMTJaTTExIDExLjVMNyA3LjVIMTJWMTUuNUgxNFY2SDExWiIgZmlsbD0iIzY2NjY2NiIvPjwvc3ZnPg=='"></div>
                <div class="tooltip-title">${software.name}</div>
            </div>
            <div class="tooltip-body">${tooltipContent}</div>
        `;

        // 3. 计算 Tooltip 位置
        const rect = card.getBoundingClientRect();
        const scrollX = window.scrollX || document.documentElement.scrollLeft;
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        
        // 卡片顶部的 Y 坐标（用于向上弹出时的定位参考）
        const cardTopY = rect.top + scrollY;
        // Tooltip 的水平定位点 (卡片中心点的 X 坐标)
        const tooltipX = rect.left + rect.width / 2 + scrollX;

        // 设置水平定位
        tooltip.style.position = 'absolute';
        tooltip.style.left = `${tooltipX}px`;
        
        // **NEW: 边界检测和调整**
        // 必须先让 tooltip 可见（但不透明），才能获取其真实高度
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'visible';
        tooltip.classList.remove('tooltip-down'); // 确保默认向上弹出
        
        const tooltipHeight = tooltip.offsetHeight;
        
        // 检查 Tooltip 是否会超出屏幕上方（rect.top 是卡片相对于视口顶部的距离）
        // 如果卡片顶部距离视口顶部的距离小于 Tooltip 的高度加上一些缓冲距离 (10px)，则向下弹出。
        if (rect.top - tooltipHeight - 10 < 0) {
            // 如果会超出，设置向下弹出的类
            tooltip.classList.add('tooltip-down');
            
            // FIX: 当向下弹出时，将 top 设置为卡片底部位置 + 10px 缓冲
            const cardBottomY = rect.bottom + scrollY;
            tooltip.style.top = `${cardBottomY + 10}px`; 
            
        } else {
            // 否则，保持向上弹出
            tooltip.classList.remove('tooltip-down');
            // FIX: 向上弹出时，top 属性设置为卡片顶部 Y 坐标
            tooltip.style.top = `${cardTopY}px`; 
        }

        // 4. 显示 Tooltip
        tooltip.classList.add('visible');
        tooltip.style.opacity = '1';
    }

    function hideTooltip() {
        const tooltip = document.getElementById('global-software-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
            tooltip.classList.remove('tooltip-down'); // 隐藏时移除类
            tooltip.style.opacity = '0'; // 确保透明度也归零
            tooltip.style.visibility = 'hidden'; // 确保彻底隐藏
        }
    }
    // --- End Tooltip Manager Functions ---
    
    // --- 1. 加载最新文章 (从 data/articles.json) ---
    async function loadLatestArticles() {
        // 相对路径：index.html 应该在 ./data/articles.json
        const ARTICLE_INDEX_URL = './data/articles.json';
        latestArticlesContainer.innerHTML = '<li class="loading"><i class="fas fa-spinner fa-spin"></i> 正在加载文章...</li>';

        try {
            const response = await fetch(ARTICLE_INDEX_URL);
            if (!response.ok) {
                throw new Error(`无法加载文章索引: ${response.statusText}`);
            }
            const data = await response.json();
            
            // **修复：显式按日期降序排序 (最新在前) - NEW: 使用 updated_date 排序**
            data.sort((a, b) => {
                // 使用 updated_date 进行排序，如果不存在则回退到 date
                const dateA = a.updated_date || a.date;
                const dateB = b.updated_date || b.date;
                
                // 假设日期格式 YYYY-MM-DD 允许字符串比较
                if (dateA < dateB) return 1;
                if (dateA > dateB) return -1;
                return 0;
            });
            
            // 获取前 6 篇
            const latestArticles = data.slice(0, 6); 

            if (latestArticles.length === 0) {
                latestArticlesContainer.innerHTML = '<li>目前没有可用的博客文章。</li>';
                return;
            }

            latestArticlesContainer.innerHTML = ''; // 清空加载状态
            latestArticles.forEach(article => {
                const li = document.createElement('li');
                // 标题从文件名中去除 .md
                const title = article.file.replace('.md', '');
                
                // NEW: 显示最新的日期 (updated_date)
                const displayDate = article.updated_date || article.date;
                
                // NEW: 渲染标签 HTML 结构 (首页限制显示前2个标签)
                const tagsHtml = (article.tags && article.tags.length > 0)
                    ? `<div class="article-tags">${article.tags.slice(0, 2).map(tag => `<span class="article-tag">${tag}</span>`).join('')}</div>`
                    : '';
                
                // FIX: 链接到博客页面 (pages/blog.html)，并传递文章ID作为查询参数 'id'
                // 使用 encodeURIComponent 确保中文文件名可以正确传递
                const encodedId = encodeURIComponent(article.file);
                const articleLink = `./pages/blog.html?id=${encodedId}`;

                // NEW: 在链接内部使用 flex 布局，将标题和标签放在一起
                li.innerHTML = `
                    <a href="${articleLink}" data-article-file="${article.file}" title="${title}">
                        <span class="article-title-text">${title}</span>
                        ${tagsHtml}
                    </a>
                    <span class="article-date">${displayDate}</span>
                `;
                latestArticlesContainer.appendChild(li);
            });

        } catch (error) {
            console.error('加载文章索引失败:', error);
            latestArticlesContainer.innerHTML = `<li class="error">文章加载失败: ${error.message}</li>`;
        }
    }
    
    // --- 2. 渲染最新软件 (从 data/software.json 动态加载) ---
    async function renderLatestSoftware() {
        // 修正路径：相对 index.html 应该在 ./data/software.json
        const SOFTWARE_DATA_URL = './data/software.json';
        latestSoftwareContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> 正在加载软件...</div>';
        let softwareList = [];

        try {
            const response = await fetch(SOFTWARE_DATA_URL);
            if (!response.ok) {
                throw new Error(`无法加载软件数据: ${response.statusText}`);
            }
            softwareList = await response.json();
        } catch (error) {
            console.error('加载软件数据失败:', error);
            latestSoftwareContainer.innerHTML = `<div class="error">软件加载失败: ${error.message}</div>`;
            return;
        }

        // **修复：显式按日期降序排序 (最新在前)**
        softwareList.sort((a, b) => {
            // 假设日期格式 YYYY-MM-DD 允许字符串比较
            if (a.date < b.date) return 1;
            if (a.date > b.date) return -1;
            return 0;
        });

        // 获取前 6 个
        const latestSoftware = softwareList.slice(0, 3);
        latestSoftwareContainer.innerHTML = ''; // 清空加载状态

        if (latestSoftware.length === 0) {
            latestSoftwareContainer.innerHTML = '<div class="loading">没有可用的软件记录。</div>';
            return;
        }

        // NEW: 采用与 software.js 相同的卡片创建逻辑
        latestSoftware.forEach(software => {
            const card = document.createElement('div');
            // 统一使用 software-card 类名
            card.className = 'software-card';
            
            const iconSrc = software.icon;
            const fallbackIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cGF0aCBkPSJNMTIgMkwyIDEySDVWMjBIMTlaTTcgMTguNUEyLjUgMi41IDAgMCAwIDkuNSAyMSAyLjUgMi41IDAgMCAwIDEyIDI0YTIuNSAyLjUgMCAwIDAgMi41LTIuNUExIDUgMCAwIDAgMTkgMjFIMTJaTTExIDExLjVMNyA3LjVIMTJWMTUuNUgxNFY2SDExWiIgZmlsbD0iIzY2NjY2NiIvPjwvc3ZnPg==';
            const iconHtml = `<img src="${iconSrc}" alt="${software.name} Icon" onerror="this.onerror=null; this.src='${fallbackIcon}'">`;

            // NEW: 构建链接 HTML
            let linksHtml = '';
            
            // 1. 官方网站链接
            linksHtml += `<a href="${software.website}" target="_blank" rel="noopener noreferrer" class="link-website"><i class="fas fa-external-link-alt"></i> 官方网站</a>`;

            // 2. 直接下载按钮 (检查 download 字段)
            if (software.download && software.download.trim() !== "") {
                linksHtml += `<a href="${software.download}" target="_blank" rel="noopener noreferrer" class="link-download"><i class="fas fa-download"></i> 直接下载</a>`;
            }
            
            // 使用 data 属性存储软件信息，用于全局 Tooltip
            card.setAttribute('data-software-info', JSON.stringify(software));

            // NEW: 采用 software.html 的完整结构 (使用 software-title-line-home 和 software-icon-home 来保持尺寸一致性)
            card.innerHTML = `
                <div class="software-info">
                    <div class="software-title-line-home">
                        <div class="software-icon-home">
                            ${iconHtml}
                        </div>
                        <h4>${software.name}</h4>
                    </div>
                    <span class="software-date-full">收录于: ${software.date}</span>
                    <p>${software.description}</p>
                    <div class="software-links">
                        ${linksHtml}
                    </div>
                </div>
            `;
            
            latestSoftwareContainer.appendChild(card);
            
            // 添加悬浮事件监听器 (使用全局 Tooltip 函数)
            card.addEventListener('mouseenter', function() {
                const softwareData = JSON.parse(this.getAttribute('data-software-info'));
                createAndShowTooltip(this, softwareData);
            });
            
            card.addEventListener('mouseleave', hideTooltip);
        });
    }

    // 执行
    loadLatestArticles();
    renderLatestSoftware();
});