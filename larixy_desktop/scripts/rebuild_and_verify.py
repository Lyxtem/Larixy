import subprocess
import os
import shutil
import sys

cwd = r'c:\Users\Amendoza\Downloads\fluxer-main\fluxer-main\larixy_desktop'

print('1. Stopping processes...')
subprocess.run(['powershell', '-Command', 'Stop-Process -Name Larixy -Force -ErrorAction SilentlyContinue'])

dist_electron = os.path.join(cwd, 'dist-electron')
if os.path.exists(dist_electron):
    print('2. Removing dist-electron...')
    shutil.rmtree(dist_electron)

print('3. Running electron-builder...')
env = os.environ.copy()
env['LARIXY_SKIP_NATIVE'] = 'true'
builder_cmd = 'npx electron-builder --config electron-builder.config.cjs --dir --x64'
res = subprocess.run(builder_cmd, cwd=cwd, env=env, shell=True, capture_output=True, text=True)
print('electron-builder returncode:', res.returncode)
if res.returncode != 0:
    print('STDOUT:\n', res.stdout)
    print('STDERR:\n', res.stderr)
    sys.exit(1)

print('Package created successfully!')

print('4. Extracting app.asar for verification...')
packaged_asar = os.path.join(dist_electron, 'win-unpacked', 'resources', 'app.asar')
extract_dir = r'C:\Users\Amendoza\.gemini\antigravity\brain\8603b235-7ade-476b-8918-d0b5877425b5\scratch\extracted_asar_verified'
if os.path.exists(extract_dir):
    shutil.rmtree(extract_dir)

cmd = ['npx', 'asar', 'extract', packaged_asar, extract_dir]
subprocess.run(cmd, shell=True, check=True)

print('5. Verifying integrity on extracted asar...')
verify_script = os.path.join(cwd, 'scripts', 'verify_renderer_integrity.py')
v_res = subprocess.run([sys.executable, verify_script, '--renderer-dir', os.path.join(extract_dir, 'dist', 'renderer')], capture_output=True, text=True)
print(v_res.stdout)
if v_res.returncode != 0:
    print('VERIFY FAILED:\n', v_res.stderr)
    sys.exit(1)
print('ALL VERIFICATIONS PASSED!')
