// Software Page Dynamic Content Logic

document.addEventListener('DOMContentLoaded', function() {
    const SOFTWARE_DATA_URL = '../data/software.json';
    const softwareGrid = document.getElementById('software-grid');
    const categoryFilter = document.getElementById('category-filter');
    const softwareCountBadge = document.getElementById('software-count'); // NEW: 获取软件总数显示元素
    let softwareData = [];

    // --- Tooltip Manager Functions (与 home.js 相同) ---
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
        
        // **边界检测和调整**
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


    // 创建单个软件卡片
    function createSoftwareCard(software) {
        const card = document.createElement('div');
        card.className = 'software-card';

        // 检查 icon 是否可用，提供备用图标
        const iconSrc = software.icon;
        const fallbackIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cGF0aCBkPSJNMTIgMkwyIDEySDVWMjBIMTlaTTcgMTguNUEyLjUgMi41IDAgMCAwIDkuNSAyMSAyLjUgMi41IDAgMCAwIDEyIDI0YTIuNSAyLjUgMCAwIDAgMi41LTIuNUExIDUgMCAwIDAgMTkgMjFIMTJaTTExIDExLjVMNyA3LjVIMTJWMTUuNUgxNFY2SDExWiIgZmlsbD0iIzY2NjY2NiIvPjwvc3ZnPg==';
        
        // 使用 onerror 属性处理图片加载失败
        const iconHtml = `<img src="${iconSrc}" alt="${software.name} Icon" onerror="this.onerror=null; this.src='${fallbackIcon}'">`;

        // NEW: 构建链接 HTML
        let linksHtml = '';
        
        // 1. 官方网站链接 (原有的 '官网下载' 改为 '官方网站')
        // 使用 fa-external-link-alt 图标
        linksHtml += `<a href="${software.website}" target="_blank" rel="noopener noreferrer" class="link-website"><i class="fas fa-external-link-alt"></i> 官方网站</a>`;

        // 2. NEW: 直接下载按钮
        // 检查 download 字段是否存在且非空
        if (software.download && software.download.trim() !== "") {
            // 使用 fa-download 图标，并添加 link-download 类
            linksHtml += `<a href="${software.download}" target="_blank" rel="noopener noreferrer" class="link-download"><i class="fas fa-download"></i> 直接下载</a>`;
        }
        
        // NEW: 移除原有的 software-icon 块，将图标和标题放在 software-info 内部的 software-title-line 中
        card.innerHTML = `
            <div class="software-info">
                <div class="software-title-line">
                    <div class="software-icon-small">
                        ${iconHtml}
                    </div>
                    <h3>${software.name}</h3>
                </div>
                <!-- NEW: 添加收录日期信息 -->
                <span class="software-date-full">收录于: ${software.date}</span>
                <p>${software.description}</p>
                <div class="software-links">
                    ${linksHtml}
                </div>
            </div>
        `;

        // 添加悬浮事件监听器
        card.setAttribute('data-software-info', JSON.stringify(software));

        card.addEventListener('mouseenter', function() {
            const softwareData = JSON.parse(this.getAttribute('data-software-info'));
            createAndShowTooltip(this, softwareData);
        });
        
        card.addEventListener('mouseleave', hideTooltip);

        return card;
    }

    // 渲染软件列表
    function renderSoftware(filterCategory = 'All') {
        softwareGrid.innerHTML = ''; // 清空现有内容
        const filteredList = (filterCategory === 'All') 
            ? softwareData
            : softwareData.filter(software => software.category === filterCategory);

        if (filteredList.length === 0) {
            softwareGrid.innerHTML = '<p class="loading">此类别下暂无软件推荐。</p>';
        }
        
        // NEW: 更新筛选后的软件数量
        if (softwareCountBadge) {
            if (filterCategory === 'All') {
                softwareCountBadge.textContent = `(${softwareData.length})`;
            } else {
                softwareCountBadge.textContent = `(${filteredList.length} / ${softwareData.length})`;
            }
        }
        
        // NEW: 默认按日期降序排序 (最新在前)
        filteredList.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA; // 降序
        });

        filteredList.forEach(software => {
            softwareGrid.appendChild(createSoftwareCard(software));
        });
    }

    // 渲染分类按钮
    function renderCategories() {
        const categories = ['All'];
        softwareData.forEach(software => {
            if (!categories.includes(software.category)) {
                categories.push(software.category);
            }
        });

        categoryFilter.innerHTML = ''; // 清空现有按钮

        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-btn';
            button.textContent = category;
            
            button.addEventListener('click', () => {
                // 移除所有按钮的 active 类
                document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
                // 给当前点击的按钮添加 active 类
                button.classList.add('active');
                renderSoftware(category);
            });
            
            categoryFilter.appendChild(button);
        });
        
        // 默认激活第一个按钮
        if (categoryFilter.firstElementChild) {
            categoryFilter.firstElementChild.classList.add('active');
        }
    }

    // 初始化加载
    async function init() {
        softwareGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> 正在加载软件列表...</div>';
        
        try {
            const response = await fetch(SOFTWARE_DATA_URL);
            if (!response.ok) {
                throw new Error(`无法加载软件数据: ${response.statusText}`);
            }
            softwareData = await response.json();
            
            renderCategories();
            renderSoftware('All'); // 默认渲染所有软件
            
        } catch (error) {
            console.error('加载软件数据失败:', error);
            softwareGrid.innerHTML = `<div class="error">软件列表加载失败: ${error.message}</div>`;
            // NEW: 加载失败也更新徽章
            if (softwareCountBadge) {
                softwareCountBadge.textContent = '(0)';
            }
        }
    }

    init();
});