import os

files_to_check = [
    '/home/deploy/apps/wave-instance/extra/chunk-ZKNE52GF.js',
    '/home/deploy/apps/wave-instance/extra/app_static/assets/0b1b6d66830e360f.js',
    '/home/deploy/apps/wave-instance/extra/app_static/assets/54038d2d97540f4d.js',
]

for fpath in files_to_check:
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        fv = content.count('fluxer-verification')
        ff = content.count('_fluxer')
        print(f"{fpath}: fluxer-verification={fv}, _fluxer={ff}")

        # Reemplazar con cuidado sin romper variables internas que no correspondan
        # 1. En backend chunk-ZKNE52GF.js:
        # `_fluxer.${identifier}` -> `_larixy.${identifier}`
        # `fluxer-verification=<token>` -> `larixy-verification=<token>`
        # `/.well-known/fluxer-verification` -> `/.well-known/larixy-verification`
        
        new_content = content
        if 'fluxer-verification' in new_content:
            new_content = new_content.replace('fluxer-verification', 'larixy-verification')
        
        # En el frontend o backend, cambiar `_fluxer.` por `_larixy.`
        if '_fluxer.' in new_content:
            new_content = new_content.replace('_fluxer.', '_larixy.')
            
        if new_content != content:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Patched {fpath} successfully!")
        else:
            print(f"No changes needed for {fpath}")
