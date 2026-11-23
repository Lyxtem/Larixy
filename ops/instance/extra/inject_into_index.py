index_path = '/home/deploy/apps/wave-instance/extra/app_static/index.html'
style_path = '/home/deploy/apps/wave-instance/extra/premium_style_tag.html'

with open(style_path, 'r', encoding='utf-8') as f:
    style_content = f.read()

with open(index_path, 'r', encoding='utf-8') as f:
    index_content = f.read()

# Remove old larixy-modern-premium if present
import re
index_content = re.sub(r'<style id="larixy-modern-premium">[\s\S]*?</style>', '', index_content)

# Insert before </head> or after wave-custom-hide-nagbars
marker = '</style>'
pos = index_content.find('id="wave-custom-hide-nagbars"')
if pos != -1:
    end_pos = index_content.find('</style>', pos) + len('</style>')
    index_content = index_content[:end_pos] + '\n' + style_content + '\n' + index_content[end_pos:]
else:
    head_pos = index_content.find('</head>')
    index_content = index_content[:head_pos] + '\n' + style_content + '\n' + index_content[head_pos:]

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(index_content)

print('Successfully injected into extra/app_static/index.html, new length:', len(index_content))
