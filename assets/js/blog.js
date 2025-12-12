// 博客功能JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const articleList = document.getElementById('article-list');
    const articleContent = document.getElementById('article-content');
    const tocContainer = document.getElementById('toc-container');
    const toc = document.getElementById('toc');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const articleCountBadge = document.getElementById('article-count'); // 获取文章总数显示元素
    const tagFilterContainer = document.getElementById('tag-filter-container'); // NEW: 标签筛选容器
    const tagCountBadge = document.getElementById('tag-count'); // NEW: 标签总数徽章
    
    // NEW: 右侧固定 TOC 容器
    const tocFixedWrapper = document.getElementById('toc-fixed-wrapper'); 

    // 存储从 JSON 加载的文章元数据
    let articles = [];
    let activeTag = 'All'; // NEW: 当前激活的标签筛选状态
    // 修正路径：相对 pages/blog.html 应该在 ../data/articles.json
    const ARTICLE_INDEX_URL = '../data/articles.json'; 
    
    // NEW: 用于滚动时显示/隐藏 TOC 的计时器
    let scrollTimer = null;
    let isTocShowing = false;
    
    /**
     * 从 URL 查询参数中获取指定键的值。
     * @param {string} name - 参数名称 (例如 'id')。
     * @returns {string|null} 参数值或 null。
     */
    function getUrlParameter(name) {
        // 使用 URLSearchParams API 获取参数，处理中文乱码问题
        const urlParams = new URLSearchParams(window.location.search);
        // 使用 decodeURIComponent 来确保正确解析中文文件名
        const value = urlParams.get(name);
        return value ? decodeURIComponent(value) : null;
    }

    // 初始化页面
    function init() {
        loadArticleIndex()
            .then(() => {
                
                // NEW: 确保全局文章列表已按日期降序排序 (最新在前)，以保证 articles[0] 是最新文章
                articles.sort((a, b) => {
                    const dateA = a.updated_date || a.date;
                    const dateB = b.updated_date || b.date;
                    
                    // 降序排序 (最新日期在前)
                    if (dateA < dateB) return 1;
                    if (dateA > dateB) return -1;
                    return 0;
                });
                
                renderTagFilters(); // NEW: 渲染标签筛选按钮
                renderArticleList();
                setupEventListeners();
                
                // =========================================================================
                // FIX: 检查 URL 参数，确定要加载的文章 ID
                const requestedArticleId = getUrlParameter('id');
                let targetArticleId = null;

                if (requestedArticleId && articles.some(a => a.id === requestedArticleId)) {
                    // 1. 如果 URL 中有文章 ID 且有效，则加载该文章
                    targetArticleId = requestedArticleId;
                } else if (articles.length > 0) {
                    // 2. 否则，默认加载最新文章 (articles[0] 已经是最新排序后的第一篇)
                    targetArticleId = articles[0].id;
                }

                if (targetArticleId) {
                    loadArticle(targetArticleId); 
                    
                    // 确保目标文章在列表中被标记为活动状态
                    // 延迟执行以确保 renderArticleList 已经完成 DOM 渲染
                    setTimeout(() => {
                         const targetArticleLink = document.querySelector(`.article-list a[data-id="${targetArticleId}"]`);
                         if (targetArticleLink) {
                            // 先清除所有 active 状态
                            document.querySelectorAll('.article-list a').forEach(a => a.classList.remove('active'));
                            targetArticleLink.classList.add('active');
                        }
                    }, 0);
                }
                
                // NEW: 设置全局滚动监听，用于控制右侧 TOC 的显示/隐藏
                window.addEventListener('scroll', handleScrollForToc);

                // =========================================================================
            });
    }

    // NEW: 处理滚动事件，控制右侧 TOC 的显示/隐藏
    function handleScrollForToc() {
        // 如果文章内容未加载，则不执行任何操作
        if (!tocFixedWrapper || toc.children.length === 0) {
            return;
        }

        // 1. 显示 TOC
        if (!isTocShowing) {
            tocFixedWrapper.classList.add('visible');
            isTocShowing = true;
        }

        // 2. 重置隐藏计时器
        if (scrollTimer !== null) {
            clearTimeout(scrollTimer);
        }

        // 3. 2秒后自动隐藏 TOC
        scrollTimer = setTimeout(() => {
            tocFixedWrapper.classList.remove('visible');
            isTocShowing = false;
        }, 2000); 
    }

    // 加载文章索引文件
    async function loadArticleIndex() {
        articleList.innerHTML = '<li><i class="fas fa-spinner fa-spin"></i> 正在加载文章索引...</li>';
        try {
            const response = await fetch(ARTICLE_INDEX_URL);
            if (!response.ok) {
                throw new Error(`无法加载文章索引: ${response.statusText}`);
            }
            const data = await response.json();
            
            // 确保文章文件名路径正确
            articles = data.map(article => ({
                id: article.file, // 使用文件名作为ID
                title: article.file,
                // 修正 Markdown 文件路径：相对 pages/blog.html 应该在 ../data/articles/
                file: `../data/articles/${article.file}/${article.file}.md`, 
                date: article.date, // 原始创建日期
                updated_date: article.updated_date || article.date, // NEW: 最后修改日期，如果不存在则使用创建日期
                tags: article.tags || [] // NEW: 确保 tags 字段存在
            }));

            // NEW: 更新文章总数
            if (articleCountBadge) {
                articleCountBadge.textContent = `(${articles.length})`;
            }

        } catch (error) {
            console.error('加载文章索引失败:', error);
            articleList.innerHTML = `<li>加载失败: ${error.message}</li>`;
            // 如果加载失败，保持 articles 为空数组
            if (articleCountBadge) { // NEW: 加载失败也更新徽章
                articleCountBadge.textContent = '(0)';
            }
        }
    }
    
    // NEW: 渲染标签筛选按钮
    function renderTagFilters() {
        const uniqueTags = new Set();
        articles.forEach(article => {
            if (article.tags && Array.isArray(article.tags)) {
                article.tags.forEach(tag => uniqueTags.add(tag));
            }
        });
        
        const sortedTags = Array.from(uniqueTags).sort();
        
        // 清空现有按钮
        tagFilterContainer.innerHTML = '';
        
        // 更新标签总数
        if (tagCountBadge) {
            tagCountBadge.textContent = `(${sortedTags.length})`;
        }
        
        // 渲染 "全部" 按钮
        const allBtn = document.createElement('button');
        allBtn.className = 'tag-btn ' + (activeTag === 'All' ? 'active' : '');
        allBtn.textContent = '全部';
        allBtn.setAttribute('data-tag', 'All');
        tagFilterContainer.appendChild(allBtn);

        // 渲染其他标签按钮
        sortedTags.forEach(tag => {
            const button = document.createElement('button');
            button.className = 'tag-btn ' + (activeTag === tag ? 'active' : '');
            button.textContent = tag;
            button.setAttribute('data-tag', tag);
            tagFilterContainer.appendChild(button);
        });
        
        // 添加事件监听器
        document.querySelectorAll('.tag-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const tag = this.getAttribute('data-tag');
                
                // 更新 activeTag 状态
                activeTag = tag;
                
                // 切换 active 类
                document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // 重新渲染文章列表（同时应用搜索过滤）
                renderArticleList(searchInput.value.trim()); 
            });
        });
    }

    // 渲染文章列表
    function renderArticleList(filter = '') {
        articleList.innerHTML = '';
        
        // 如果文章数据为空，显示提示
        if (articles.length === 0) {
             articleList.innerHTML = '<li>目前没有可用的文章。</li>';
             return;
        }

        let filteredArticles = articles.filter(article => {
            const searchMatch = !filter || article.title.toLowerCase().includes(filter.toLowerCase());
            
            // NEW: 标签筛选逻辑
            const tagMatch = activeTag === 'All' || (article.tags && article.tags.includes(activeTag));
            
            return searchMatch && tagMatch;
        });

        if (filteredArticles.length === 0) {
            articleList.innerHTML = '<li>没有找到匹配的文章</li>';
            // NEW: 更新筛选后的文章数量
            if (articleCountBadge) {
                articleCountBadge.textContent = `(0)`;
            }
            return;
        }

        // NEW: 更新筛选后的文章数量
        if (articleCountBadge) {
            articleCountBadge.textContent = `(${filteredArticles.length} / ${articles.length})`;
        }

        
        filteredArticles.forEach(article => {
            const li = document.createElement('li');
            // NEW: 在列表中显示最新的日期 (updated_date)
            const displayDate = article.updated_date || article.date;
            
            // REMOVE: 移除文章列表中的标签显示，只保留标题
            // const tagsHtml = (article.tags && article.tags.length > 0)
            //     ? `<div class="article-tags">${article.tags.slice(0, 3).map(tag => `<span class="article-tag">${tag}</span>`).join('')}</div>`
            //     : '';

            // 修复：将日期显示为右浮动的小标签，并在链接上添加 title 属性用于悬浮提示
            // FIX: 链接内部只包含标题文本
            li.innerHTML = `
                <a href="#" data-id="${article.id}" title="${article.title}">
                    <span class="article-title-text">${article.title}</span>
                </a>
                <span class="article-date">${displayDate}</span>
            `;
            articleList.appendChild(li);
            
            // 添加点击事件
            li.querySelector('a').addEventListener('click', function(e) {
                e.preventDefault();
                
                // 关键更改：在加载内容前，第一时间滚动到页面顶部
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth' // 使用平滑滚动，体验更好
                });
                
                loadArticle(article.id);
                
                // 更新活动状态
                document.querySelectorAll('.article-list a').forEach(a => a.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }
    
    // 加载文章内容
    function loadArticle(articleId) {
        const article = articles.find(a => a.id === articleId);
        if (!article) return;
        
        // 移除滚动操作，已转移到点击事件监听器中。

        // 隐藏欢迎信息
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) welcomeMessage.style.display = 'none';

        // 显示加载状态
        articleContent.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> 正在加载内容...</div>';
        
        // NEW: 隐藏右侧 TOC 容器
        if(tocFixedWrapper) {
            tocFixedWrapper.style.display = 'none'; 
            clearTimeout(scrollTimer);
            isTocShowing = false;
        }

        // **NEW: 在加载新文章内容前，清除旧的滚动监听，防止干扰**
        if (window.tocObserver) {
            window.tocObserver.disconnect();
        }

        // 使用fetch加载Markdown文件
        fetch(article.file)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        
        .then(text => {
            const encodedArticleId = encodeURIComponent(articleId);
            // 1. 修正图片相对路径 (满足本地编辑习惯)
            // 将 Markdown 中的相对路径 `(./` 替换为 `(../data/articles/`。
            // 这样在 pages/blog.html 中才能正确访问 data/articles/ 目录下的图片。
            let correctedText = text.replace(/\(\.\//g, `(../data/articles/${encodedArticleId}/`);
console.log('Fetched article content for:', correctedText);
            // 2. 处理 HTML 格式的绝对路径（如 <img src="D:\Data\...），将其替换为提示信息
            // 匹配 <img src="D:\..." ... /> 或 <img src="C:\..." ... />
            correctedText = correctedText.replace(/<img\s+src=["']([a-z]:\\|file:\/\/\/).*?["'](.*?)>/gi, 
                (match, p1, p2) => `<div class="image-load-error">图片使用了本地绝对路径或文件协议，无法显示。请上传图片文件并使用相对路径。</div>`
            );

            // 使用marked解析Markdown
            const html = marked.parse(correctedText);
            
            // NEW: 构造文章标签 HTML
            const tagsHtml = (article.tags && article.tags.length > 0)
                ? `<div class="article-metadata-tags">${article.tags.map(tag => `<span class="article-tag-detail">${tag}</span>`).join('')}</div>`
                : '';

            // NEW: 构造并预置文章日期和标签信息 (左对齐标签，右对齐日期)
            const dateBlockHTML = `
                <div class="article-metadata-header">
                    ${tagsHtml}
                    <div class="article-metadata-dates">
                        <span class="created-date">创建于: ${article.date}</span>
                        <span class="updated-date">最后修改于: ${article.updated_date || article.date}</span>
                    </div>
                </div>
            `;
            
            // 将日期信息块预置在文章内容之前
            articleContent.innerHTML = dateBlockHTML + html;
            
            // 3. 图片错误处理 (针对 Marked 解析出的 <img> 标签)
            document.querySelectorAll('.article-content img').forEach(img => {
                // 添加一个错误处理，以便图片加载失败时显示提示
                img.onerror = function() {
                    console.error('Image failed to load:', img.src);
                    const altText = img.alt || '图片';
                    // 替换为自定义的错误提示 HTML
                    const parent = img.parentNode;
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'image-load-error';
                    errorDiv.innerHTML = `无法加载图片: ${altText}。请检查图片路径。`;
                    parent.replaceChild(errorDiv, img);
                };
            });
            
            // 4. 高亮代码
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
            
            // 5. 生成目录
            generateTOC(articleContent, correctedText); 
            
            // 6. NEW: 设置滚动监听 (Scroll Spy)
            setupScrollSpy(articleContent);
            
            // NEW: 内容加载完毕后，显示右侧 TOC 容器
            if (tocFixedWrapper) {
                 tocFixedWrapper.style.display = 'block'; 
            }
            
        })
        .catch(error => {
            articleContent.innerHTML = `<div class="error">加载文章失败: ${error.message}</div>`;
            if (tocFixedWrapper) {
                tocFixedWrapper.style.display = 'none';
            }
        });
    }
    
    // 生成目录 (修复：确保生成的锚点ID是唯一的)
    function generateTOC(contentElement, markdown) {
        // ... (保持原有的 generateTOC 逻辑不变，因为它完成了锚点ID的创建)
        const headers = [];
        const lines = markdown.split('\n');
        // NEW: 用于存储已生成的锚点ID及其出现次数，以确保唯一性
        const anchorMap = {}; 
        
        // 第一次遍历 Markdown 文本，提取标题文本
        lines.forEach(line => {
            if (line.startsWith('# ')) {
                headers.push({ level: 1, text: line.substring(2).trim() });
            } else if (line.startsWith('## ')) {
                headers.push({ level: 2, text: line.substring(3).trim() });
            } else if (line.startsWith('### ')) {
                headers.push({ level: 3, text: line.substring(4).trim() });
            }
        });
        
        if (headers.length > 0) {
            toc.innerHTML = '';
            
            // 第二次遍历，处理文章内容中的标题，并生成目录
            headers.forEach(header => {
                // 规范化标题文本，用于创建锚点ID
                let baseAnchor = header.text.toLowerCase()
                    .replace(/[^\w\s\u4e00-\u9fa5]/g, '') // 允许中文、字母、数字、空格
                    .replace(/\s+/g, '-');
                
                // 确保锚点ID唯一
                let anchor = baseAnchor;
                let count = anchorMap[baseAnchor] || 0;
                
                if (count > 0) {
                    anchor = `${baseAnchor}-${count}`;
                }
                anchorMap[baseAnchor] = count + 1; // 更新计数

                // 为文章中的标题元素添加ID
                // 必须在 DOM 中找到对应的标题元素并设置 ID
                const headerElements = contentElement.querySelectorAll(`h${header.level}`);
                let isIdSet = false;
                
                headerElements.forEach(el => {
                    // 只有当元素的文本内容与解析出的标题文本精确匹配时，才设置ID
                    // 并且确保该元素尚未被设置 ID
                    if (el.textContent.trim() === header.text && !isIdSet) {
                        el.id = anchor; // 使用唯一的 ID
                        isIdSet = true;
                    }
                });

                // 创建目录列表项
                const li = document.createElement('li');
                // 根据级别设置类名，以调整缩进
                li.className = header.level === 3 ? 'toc-h3' : (header.level === 2 ? 'toc-h2' : 'toc-h1');
                
                li.innerHTML = `<a href="#${anchor}">${header.text}</a>`;
                toc.appendChild(li);
            });
            
            tocContainer.style.display = 'block';
        } else {
            tocContainer.style.display = 'none';
        }
    }
    
    // **NEW: 滚动监听 (Scroll Spy) 函数**
    function setupScrollSpy(contentElement) {
        // 1. 获取所有需要监听的标题元素（有 ID 的 h2 和 h3）
        // 这里只关注 h2 和 h3，因为它们是目录的主要结构
        const headers = Array.from(contentElement.querySelectorAll('h2[id], h3[id]'));
        if (headers.length === 0) return;

        // 2. 获取所有 TOC 链接
        // 注意：现在 TOC 链接在 tocFixedWrapper 内部
        const tocLinks = document.querySelectorAll('#toc-fixed-wrapper #toc a');
        
        // 3. 定义 IntersectionObserver 的配置
        // rootMargin: '0px 0px -60% 0px' 意味着视口的底部 60% 被排除在观察区域之外。
        // 观察区域的底部参考线位于视口高度的 40% 处。
        // 任何标题的顶部越过这条线时，就会被视为“进入”区域，从而被高亮。
        const observerOptions = {
            root: null, // 默认为视口
            rootMargin: '0px 0px -60% 0px', // 顶部 40% 区域为活跃区
            threshold: 0 // 只要有一点点进入/离开就触发
        };
        
        // 4. 创建 IntersectionObserver
        const observer = new IntersectionObserver((entries) => {
            let activeId = null;
            
            // 找到所有正在交叉的元素
            const intersectingEntries = entries.filter(entry => entry.isIntersecting);

            if (intersectingEntries.length > 0) {
                // 找到所有交叉元素中，距离视口顶部最近的那个 (top 最小)
                intersectingEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                
                // 选取最靠上的元素作为当前活动元素
                activeId = intersectingEntries[0].target.id;
            } 
            
            // Fallback: 如果滚动到文章顶部，但第一个标题还未被 IntersectionObserver 捕获（例如，页面很短）
            if (!activeId && headers.length > 0 && window.scrollY < 100) {
                activeId = headers[0].id;
            }

            // 5. 更新 TOC 链接的活动状态
            tocLinks.forEach(link => {
                link.classList.remove('active-toc-link');
                // 链接的 href 属性是 #anchor-id
                if (link.getAttribute('href') === `#${activeId}`) {
                    link.classList.add('active-toc-link');
                }
            });
        }, observerOptions);

        // 6. 监听所有标题
        headers.forEach(header => {
            observer.observe(header);
        });
        
        // 7. 将 observer 存储在 window 对象上，以便在加载新文章时清除
        window.tocObserver = observer;
    }
    
    // 设置事件监听器
    function setupEventListeners() {
        // 搜索功能
        searchBtn.addEventListener('click', function() {
            const filter = searchInput.value.trim();
            renderArticleList(filter);
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault(); // 阻止默认的表单提交行为
                const filter = searchInput.value.trim();
                renderArticleList(filter);
            }
        });
    }
    
    // 初始化
    init();
});