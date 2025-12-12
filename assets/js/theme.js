// 主题切换功能
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const icon = themeToggle.querySelector('i');
    
    // highlight.js 主题路径
    // 使用 'github' (浅色) 和 'atom-one-dark' (暗色)
    const HLJS_THEME_LIGHT = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github.min.css';
    const HLJS_THEME_DARK = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-dark.min.css';
    
    /**
     * 根据当前主题状态切换 highlight.js 的 CSS 文件。
     * @param {boolean} isDark - 是否为暗色主题。
     */
    function switchHljsTheme(isDark) {
        const hljsLink = document.getElementById('hljs-theme');
        // 只有 blog 页面有 hljs-theme 元素
        if (hljsLink) {
            if (isDark) {
                // 切换到暗色高亮主题
                hljsLink.href = HLJS_THEME_DARK;
            } else {
                // 切换到浅色高亮主题
                hljsLink.href = HLJS_THEME_LIGHT;
            }
        }
    }
    
    // 检查本地存储中的主题设置
    const savedTheme = localStorage.getItem('theme');

    // NEW: 自动主题切换逻辑
    function autoSetTheme() {
        const currentHour = new Date().getHours();
        // 假设 7:00 到 19:00 为白天（浅色主题），其他时间为夜晚（深色主题）
        const isDayTime = currentHour >= 7 && currentHour < 19;
        
        if (isDayTime) {
            return 'light';
        } else {
            return 'dark';
        }
    }
    
    // 确定初始主题
    let initialTheme;
    if (savedTheme) {
        // 如果用户手动设置过，使用用户设置
        initialTheme = savedTheme;
    } else {
        // 否则，根据时间自动设置主题
        initialTheme = autoSetTheme();
        // 自动设置的主题不写入 localStorage，除非用户手动点击切换
    }

    // 应用初始主题
    const isInitialDark = initialTheme === 'dark';
    if (isInitialDark) {
        body.classList.add('dark-theme');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        body.classList.remove('dark-theme');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
    
    // NEW: 应用初始 highlight.js 主题
    switchHljsTheme(isInitialDark);
    
    
    // 点击切换主题 (保留手动切换逻辑，并更新 localStorage)
    themeToggle.addEventListener('click', function() {
        body.classList.toggle('dark-theme');
        
        const isDark = body.classList.contains('dark-theme');
        
        if (isDark) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark'); // 手动切换后写入设置
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light'); // 手动切换后写入设置
        }
        
        // NEW: 切换 highlight.js 主题
        switchHljsTheme(isDark);
    });

    // --- Back to Top button logic (通用功能) ---
    const backToTopBtn = document.getElementById('back-to-top'); 
    
    if (backToTopBtn) {
        // 监听滚动事件，控制按钮的显示/隐藏
        window.addEventListener('scroll', function() {
            // 当滚动超过 300px 时显示按钮
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
        
        // 监听按钮点击事件，平滑滚动到顶部
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    // --- End Back to Top logic ---
});