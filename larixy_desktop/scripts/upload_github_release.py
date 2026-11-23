import os
import sys
import json
import urllib.request
import subprocess

def get_github_token():
    p = subprocess.run(
        ["git", "credential", "fill"],
        input="protocol=https\nhost=github.com\n\n",
        text=True,
        capture_output=True,
        check=True
    )
    for line in p.stdout.splitlines():
        if line.startswith("password="):
            return line.split("=", 1)[1]
    raise RuntimeError("No token found in git credential fill")

def create_release(token, repo, tag_name, name, body):
    url = f"https://api.github.com/repos/{repo}/releases"
    payload = json.dumps({
        "tag_name": tag_name,
        "target_commitish": "main",
        "name": name,
        "body": body,
        "draft": False,
        "prerelease": False
    }).encode("utf-8")
    
    req = urllib.request.Request(url, data=payload, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "Larixy-Release-Uploader",
        "Content-Type": "application/json"
    })
    
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def upload_asset(token, upload_url, file_path, content_type):
    file_name = os.path.basename(file_path)
    file_size = os.path.getsize(file_path)
    clean_upload_url = upload_url.split("{")[0] + f"?name={file_name}"
    
    print(f"Subiendo {file_name} ({file_size:,} bytes) a {clean_upload_url}...")
    
    with open(file_path, "rb") as f:
        file_data = f.read()
    
    req = urllib.request.Request(clean_upload_url, data=file_data, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "Larixy-Release-Uploader",
        "Content-Type": content_type,
        "Content-Length": str(file_size)
    })
    
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        print(f"Asset subido con exito: {res.get('browser_download_url')}")
        return res

def main():
    repo = "Lyxtem/Larixy"
    tag_name = "v2026.1118.81749"
    release_name = "Larixy Desktop v2026.1118.81749 (Windows x64)"
    body = (
        "## Larixy Desktop for Windows (x64)\n\n"
        "Official Windows desktop build for Larixy.\n\n"
        "### Archivos incluidos:\n"
        "- **Instalador NSIS:** `Larixy-2026.1118.81749-win-x64.exe`\n"
        "  - SHA-256: `e9bc517e3d5456cde054e51a082da927e462f5f92248486a5962a86340871220`\n"
        "  - Registra el esquema de protocolo `larixy://` en Windows y accesos directos en Menú Inicio y Escritorio.\n\n"
        "- **Versión Portable:** `Larixy-Windows-x64.zip`\n"
        "  - SHA-256: `85a6e270735b6f0ac4fc8292f5688fa65c4fc56819c1d00c8bd4ed757f64da6e`\n"
        "  - Versión descomprimible sin instalación con `Larixy.exe` listo para ejecutar.\n"
    )
    
    desktop_dir = r"c:\Users\Amendoza\Downloads\fluxer-main\fluxer-main\larixy_desktop\dist-electron"
    installer_path = os.path.join(desktop_dir, "Larixy-2026.1118.81749-win-x64.exe")
    zip_path = os.path.join(desktop_dir, "Larixy-Windows-x64.zip")
    
    token = get_github_token()
    print("Creando release en GitHub...")
    rel = create_release(token, repo, tag_name, release_name, body)
    print(f"Release creado: {rel.get('html_url')}")
    
    upload_url = rel.get("upload_url")
    upload_asset(token, upload_url, installer_path, "application/vnd.microsoft.portable-executable")
    upload_asset(token, upload_url, zip_path, "application/zip")
    
    print("\nPROCESO COMPLETADO EXITOSAMENTE:")
    print(f"Release URL: {rel.get('html_url')}")

if __name__ == "__main__":
    main()
