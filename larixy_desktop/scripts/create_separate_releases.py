import os
import sys
import json
import urllib.request
import subprocess
import shutil

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
    raise RuntimeError("No token found")

def delete_release(token, repo, release_id, tag_name):
    # 1. Delete release
    url = f"https://api.github.com/repos/{repo}/releases/{release_id}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "Larixy-Release-Manager"
    }, method="DELETE")
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Release {release_id} eliminada ({resp.status})")
    except Exception as e:
        print(f"Error borrando release {release_id}: {e}")
    
    # 2. Delete tag ref if exists
    tag_url = f"https://api.github.com/repos/{repo}/git/refs/tags/{tag_name}"
    req_tag = urllib.request.Request(tag_url, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "Larixy-Release-Manager"
    }, method="DELETE")
    try:
        with urllib.request.urlopen(req_tag) as resp:
            print(f"Tag {tag_name} eliminado de GitHub ({resp.status})")
    except Exception as e:
        print(f"Tag ref no eliminado o no existia: {e}")

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
        "User-Agent": "Larixy-Release-Manager",
        "Content-Type": "application/json"
    })
    
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def upload_asset(token, upload_url, file_path, asset_name, content_type):
    file_size = os.path.getsize(file_path)
    clean_upload_url = upload_url.split("{")[0] + f"?name={asset_name}"
    
    print(f"\nSubiendo {asset_name} ({file_size:,} bytes) a GitHub...")
    
    with open(file_path, "rb") as f:
        file_data = f.read()
    
    req = urllib.request.Request(clean_upload_url, data=file_data, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "Larixy-Release-Manager",
        "Content-Type": content_type,
        "Content-Length": str(file_size)
    })
    
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        print(f"-> Asset '{asset_name}' subido con exito!")
        print(f"   Download URL: {res.get('browser_download_url')}")
        return res

def main():
    repo = "Lyxtem/Larixy"
    desktop_dir = r"c:\Users\Amendoza\Downloads\fluxer-main\fluxer-main\larixy_desktop\dist-electron"
    orig_installer = os.path.join(desktop_dir, "Larixy-2026.1118.81749-win-x64.exe")
    orig_zip = os.path.join(desktop_dir, "Larixy-Windows-x64.zip")
    
    # Friendly copies
    installer_copy = os.path.join(desktop_dir, "Larixy-Setup.exe")
    zip_copy = os.path.join(desktop_dir, "Larixy-Portable.zip")
    
    if not os.path.exists(installer_copy):
        shutil.copyfile(orig_installer, installer_copy)
    if not os.path.exists(zip_copy):
        shutil.copyfile(orig_zip, zip_copy)
        
    token = get_github_token()
    
    # 1. Delete previous release 454796743
    print("--- 1. ELIMINANDO RELEASE ANTERIOR NO SEPARADA ---")
    delete_release(token, repo, 454796743, "v2026.1118.81749")
    
    # 2. Release 1: INSTALADOR (.exe)
    print("\n--- 2. CREANDO RELEASE SEPARADA: INSTALADOR (.exe) ---")
    installer_body = (
        "## Larixy Windows Installer (x64)\n\n"
        "Instalador oficial de Larixy para Windows.\n\n"
        "### Archivo de instalación:\n"
        "- **`Larixy-Setup.exe`**\n"
        "- **Tamaño:** 278.36 MB (`291,883,426 bytes`)\n"
        "- **SHA-256:** `e9bc517e3d5456cde054e51a082da927e462f5f92248486a5962a86340871220`\n\n"
        "### Características:\n"
        "- Asistente de instalación estándar para Windows (NSIS).\n"
        "- Registra el protocolo `larixy://` en el sistema para enlaces directos e inicio de sesión.\n"
        "- Crea accesos directos en el Menú Inicio y en el Escritorio con el icono oficial de Larixy.\n"
    )
    rel_inst = create_release(token, repo, "v2026.1118.81749-installer", "Larixy Desktop - Windows Installer (.exe)", installer_body)
    print(f"Release de Instalador creada: {rel_inst.get('html_url')}")
    upload_asset(token, rel_inst.get("upload_url"), installer_copy, "Larixy-Setup.exe", "application/vnd.microsoft.portable-executable")
    
    # 3. Release 2: PORTABLE (.zip)
    print("\n--- 3. CREANDO RELEASE SEPARADA: PORTABLE (.zip) ---")
    portable_body = (
        "## Larixy Windows Portable (x64)\n\n"
        "Versión portable de Larixy para Windows que no requiere instalación en el sistema.\n\n"
        "### Archivo portable:\n"
        "- **`Larixy-Portable.zip`**\n"
        "- **Tamaño:** 346.33 MB (`363,156,928 bytes`)\n"
        "- **SHA-256:** `85a6e270735b6f0ac4fc8292f5688fa65c4fc56819c1d00c8bd4ed757f64da6e`\n\n"
        "### Instrucciones de uso:\n"
        "1. Descarga y descomprime `Larixy-Portable.zip` en la carpeta que prefieras.\n"
        "2. Ejecuta `Larixy.exe` directamente para iniciar la aplicación.\n"
    )
    rel_port = create_release(token, repo, "v2026.1118.81749-portable", "Larixy Desktop - Windows Portable (.zip)", portable_body)
    print(f"Release de Portable creada: {rel_port.get('html_url')}")
    upload_asset(token, rel_port.get("upload_url"), zip_copy, "Larixy-Portable.zip", "application/zip")
    
    print("\n=============================================")
    print("AMBAS RELEASES CREADAS Y SUBIDAS EXITOSAMENTE")
    print(f"Instalador: {rel_inst.get('html_url')}")
    print(f"Portable:   {rel_port.get('html_url')}")
    print("=============================================")

if __name__ == "__main__":
    main()
