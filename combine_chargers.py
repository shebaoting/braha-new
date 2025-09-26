import os

# 配置输出文件
OUTPUT_FILE = 'combined_code.md'

# 配置目标目录和文件列表
# 您可以在这里添加任何想要包含的文件或目录路径
TARGET_PATHS = [
    os.path.join('src', 'models'),
    os.path.join('src', 'stores'),
    os.path.join('src', 'utils'),
    os.path.join('src', 'pages'),
    os.path.join('src', 'components'),
    os.path.join('src', 'lib'),
    os.path.join('src', 'video')
    # 'README.md', # 也可以直接添加单个文件
]

def write_file_to_md(md_file, file_path):
    """将指定文件的路径和内容写入Markdown文件"""
    # 写入文件路径标题
    md_file.write(f'### 文件路径: `{file_path}`\n\n')

    # 从文件扩展名推断代码语言，用于语法高亮
    _, extension = os.path.splitext(file_path)
    language = extension.lstrip('.') if extension else ''

    # 写入代码块
    try:
        # 使用 'rb' 读取二进制文件，并尝试用 utf-8 解码，以兼容更多文件类型
        with open(file_path, 'rb') as f:
            raw_content = f.read()
            try:
                content = raw_content.decode('utf-8')
            except UnicodeDecodeError:
                content = f"// 注意：此文件无法以 UTF-8 格式解码，可能为二进制文件。\n// 文件大小: {len(raw_content)} 字节"
                language = 'text' # 对无法解码的文件使用纯文本格式

            md_file.write(f'```{language}\n')
            md_file.write(content)
            if not content.endswith('\n'):
                md_file.write('\n')  # 确保代码块结尾换行
            md_file.write('```\n\n')

    except Exception as e:
        md_file.write(f'```\n// 读取文件时发生错误: {str(e)}\n```\n\n')

# --- 主逻辑 ---
with open(OUTPUT_FILE, 'w', encoding='utf-8') as md_file:
    # 可以在此处写入一个总标题
    md_file.write('# 项目代码总览\n\n')

    for target_path in TARGET_PATHS:
        if os.path.isdir(target_path):
            # 如果是目录，则遍历该目录下的所有文件
            print(f"正在处理目录: {target_path}")
            for root, dirs, files in os.walk(target_path):
                # 可选：排除不想包含的特定目录
                dirs[:] = [d for d in dirs if d not in ['.git', '__pycache__', 'node_modules']]

                for file in files:
                    file_path = os.path.join(root, file)
                    print(f"  -> 正在写入文件: {file_path}")
                    write_file_to_md(md_file, file_path)

        elif os.path.isfile(target_path):
            # 如果是文件，直接处理
            print(f"正在处理文件: {target_path}")
            write_file_to_md(md_file, target_path)

        else:
            # 如果路径不存在
            print(f"警告: 目标路径不存在或不是有效的文件/目录: {target_path}")


print(f"\n生成完成！输出文件: {OUTPUT_FILE}")