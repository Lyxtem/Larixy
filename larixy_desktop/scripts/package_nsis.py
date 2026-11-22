import os
import subprocess
import sys

def main():
    root = r"c:\Users\Amendoza\Downloads\fluxer-main\fluxer-main\larixy_desktop"
    env = os.environ.copy()
    env.pop("ELECTRON_RUN_AS_NODE", None)
    env["LARIXY_SKIP_NATIVE"] = "true"
    env["ELECTRON_ARCH"] = "x64"
    
    cmd = ["cmd.exe", "/c", "npx", "electron-builder", "--config", "electron-builder.config.cjs", "--win", "--x64"]
    print(f"Running: {' '.join(cmd)} in {root}")
    
    proc = subprocess.run(cmd, cwd=root, env=env, text=True)
    sys.exit(proc.returncode)

if __name__ == "__main__":
    main()
