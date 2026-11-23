import re

# 1. Patch 110c633e7e76486d.js
fpath = '/home/deploy/apps/wave-instance/extra/app_static/assets/110c633e7e76486d.js'
with open(fpath, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('_fluxer.', '_larixy.')
code = code.replace('fluxer-verification', 'larixy-verification')

with open(fpath, 'w', encoding='utf-8') as f:
    f.write(code)

print("Patched 110c633e7e76486d.js!")

# 2. Add volume mount to custom.compose.yml if not present
compose_path = '/home/deploy/apps/wave-instance/custom.compose.yml'
with open(compose_path, 'r', encoding='utf-8') as f:
    compose_content = f.read()

mount_line = '      - ./extra/app_static/assets/110c633e7e76486d.js:/srv/app/static/assets/110c633e7e76486d.js:ro'
if '110c633e7e76486d.js' not in compose_content:
    compose_content = compose_content.replace(
        '      - ./extra/app_static/assets/f951e531a01953b2.js:/srv/app/static/assets/f951e531a01953b2.js:ro',
        '      - ./extra/app_static/assets/f951e531a01953b2.js:/srv/app/static/assets/f951e531a01953b2.js:ro\n' + mount_line
    )
    with open(compose_path, 'w', encoding='utf-8') as f:
        f.write(compose_content)
    print("Added volume mount to custom.compose.yml!")
else:
    print("Volume mount already in custom.compose.yml")
