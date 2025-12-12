import os
import json
import datetime
from pathlib import Path

def get_current_date():
    """获取当前日期的 YYYY-MM-DD 格式字符串"""
    # 这是一个辅助函数，但我们主要依赖文件修改时间
    return datetime.date.today().strftime('%Y-%m-%d')

def get_file_modification_date(filepath):
    """获取文件的最后修改日期 YYYY-MM-DD 格式字符串"""
    # 使用文件系统的时间戳
    timestamp = os.path.getmtime(filepath)
    # 将时间戳转换为 YYYY-MM-DD 格式
    return datetime.datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d')

def load_articles_json(json_path):
    """加载现有的 articles.json 文件"""
    if json_path.exists():
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"警告: {json_path} 文件内容无效或为空，将创建新的文件。")
            return []
    return []

def save_articles_json(data, json_path):
    """保存 articles.json 文件"""
    json_path.parent.mkdir(parents=True, exist_ok=True)
    with open(json_path, 'w', encoding='utf-8') as f:
        # 使用 ensure_ascii=False 确保中文正确显示，indent=2 方便阅读
        json.dump(data, f, ensure_ascii=False, indent=2)

def generate_articles_json():
    """扫描文章目录并生成或更新 articles.json"""
    
    # 路径定义，使用 Path(__file__).parent 确保路径是相对于脚本本身的绝对路径
    # 这样可以避免因当前工作目录变化导致的路径错误。
    script_dir = Path(__file__).parent
    
    # ARTICLES_DIR 指向脚本所在目录下的 articles 子目录
    ARTICLES_DIR = script_dir / 'articles'
    # JSON_FILE_PATH 指向脚本所在目录下的 articles.json 文件
    JSON_FILE_PATH = script_dir / 'articles.json'
    
    # 1. 加载现有数据
    existing_data = load_articles_json(JSON_FILE_PATH)
    # 使用 article_id (即文件名) 作为键来映射现有文章数据
    articles_map = {item['file']: item for item in existing_data}
    updated_articles = []
    
    # 2. 扫描文章目录
    if not ARTICLES_DIR.is_dir():
        # 如果依然失败，打印绝对路径以供用户检查文件系统
        print(f"错误: 文章目录 {ARTICLES_DIR.resolve()} 不存在，请检查路径。")
        return

    print(f"正在扫描文章目录: {ARTICLES_DIR.resolve()}")

    # 遍历 articles 目录下的所有子文件夹
    for folder_path in ARTICLES_DIR.iterdir():
        if folder_path.is_dir():
            article_id = folder_path.name  # 文件夹名称作为文章ID/Title
            
            # 期望的 Markdown 文件路径: folder_path/article_id.md
            markdown_filepath = folder_path / f'{article_id}.md'
            
            if not markdown_filepath.is_file():
                print(f"警告: 文件夹 '{article_id}' 中未找到匹配的 Markdown 文件 '{article_id}.md'，跳过。")
                continue
            
            # 获取 Markdown 文件的修改日期
            file_mtime_str = get_file_modification_date(markdown_filepath)
            
            # 3. 处理文章数据
            article_entry = articles_map.get(article_id)
            
            if article_entry:
                # 现有文章：
                new_entry = article_entry.copy() # 复制现有条目以保留所有字段 (包括 tags)
                
                # 确定已记录的 updated_date，如果缺失则使用 date 作为基准
                recorded_updated_date = new_entry.get('updated_date', new_entry.get('date', '1900-01-01'))
                
                # 仅在文件修改时间比记录的 updated_date 新时才更新 updated_date
                if file_mtime_str > recorded_updated_date:
                    new_entry['updated_date'] = file_mtime_str
                    print(f"更新: 文章 '{article_id}' 的 updated_date 已更新为 {file_mtime_str}")
                    
                # 确保 date 字段存在，如果不存在则使用文件创建时间
                if 'date' not in new_entry:
                     new_entry['date'] = file_mtime_str
                     
            else:
                # 新文章：date, updated_date, 和 tags 都设置为默认值
                new_entry = {
                    'file': article_id,
                    'date': file_mtime_str,      
                    'updated_date': file_mtime_str,
                    'tags': [] # NEW: 为新文章添加空的 tags 列表
                }
                print(f"新增: 文章 '{article_id}' 已添加，date/updated_date 设置为 {file_mtime_str}")

            updated_articles.append(new_entry)

    # 4. 保存新数据 (按 updated_date 降序排序，方便前端使用)
    updated_articles.sort(key=lambda x: x.get('updated_date', '1900-01-01'), reverse=True)
    
    save_articles_json(updated_articles, JSON_FILE_PATH)
    print(f"\n成功: articles.json 已更新，共包含 {len(updated_articles)} 篇文章。")

if __name__ == '__main__':
    generate_articles_json()