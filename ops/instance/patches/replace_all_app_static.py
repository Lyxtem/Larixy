import subprocess

cmd = """python3 - << 'PYEOF'
import os

app_dir = '/srv/app/static/assets'
# Check both in mounted extra and inside container
for root, dirs, files in os.walk('/home/deploy/apps/wave-instance/extra/app_static'):
    for f in files:
        if f.endswith('.js'):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                data = fp.read()
            if '_fluxer' in data:
                print(f"Found _fluxer in {p}")
                # Replace with _larixy
                data = data.replace('_fluxer', '_larixy')
                with open(p, 'w', encoding='utf-8') as fp:
                    fp.write(data)
                print(f"Replaced in {p}")
            if 'fluxer-verification' in data:
                print(f"Found fluxer-verification in {p}")
                data = data.replace('fluxer-verification', 'larixy-verification')
                with open(p, 'w', encoding='utf-8') as fp:
                    fp.write(data)
                print(f"Replaced in {p}")
PYEOF
"""

print("Running...")
