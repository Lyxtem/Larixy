import os
import sys
import hashlib
import zipfile
import subprocess
import shutil
import re

def compute_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(1024 * 1024):
            h.update(chunk)
    return h.hexdigest()

def audit_asar(extracted_dir):
    print(f"\n--- AUDITORIA DE SEGURIDAD EN APP.ASAR ---")
    print(f"Directorio extraido: {extracted_dir}")
    sensitive_extensions = {".env", ".key", ".pem", ".pfx", ".cer", ".p12"}
    violations = []
    pc_path_pattern = re.compile(rb"[a-zA-Z]:[\\/](?:users|Users)[\\/](?:Amendoza|amendoza)", re.IGNORECASE)
    secret_patterns = [
        (re.compile(rb"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----"), "Private Key"),
        (re.compile(rb"ghp_[a-zA-Z0-9]{36}"), "GitHub Personal Access Token"),
        (re.compile(rb"xox[baprs]-[0-9a-zA-Z]{10,48}"), "Slack Token"),
        (re.compile(rb"AKIA[0-9A-Z]{16}"), "AWS Access Key"),
    ]

    scanned_files = 0
    pc_paths_found = []
    secrets_found = []

    for root, dirs, files in os.walk(extracted_dir):
        for file in files:
            scanned_files += 1
            fpath = os.path.join(root, file)
            relpath = os.path.relpath(fpath, extracted_dir)
            _, ext = os.path.splitext(file.lower())

            if ext in sensitive_extensions or file.startswith(".env"):
                violations.append(f"Forbidden file pattern: {relpath}")

            # Scan content of text/js/json files
            if ext in {".js", ".cjs", ".mjs", ".json", ".html", ".css", ".txt", ".map", ".yml", ".yaml"}:
                try:
                    with open(fpath, "rb") as f:
                        content = f.read()
                        if pc_path_pattern.search(content):
                            pc_paths_found.append(relpath)
                        for pattern, sec_name in secret_patterns:
                            if pattern.search(content):
                                secrets_found.append(f"{sec_name} in {relpath}")
                except Exception:
                    pass

    print(f"Archivos escaneados en app.asar: {scanned_files}")
    print(f"Archivos prohibidos (.env, claves, certs): {len(violations)}")
    for v in violations:
        print(f"  - [VIOLACION] {v}")
    print(f"Tokens/Secretos en texto claro: {len(secrets_found)}")
    for s in secrets_found:
        print(f"  - [VIOLACION] {s}")
    print(f"Rutas absolutas del PC local (Amendoza): {len(pc_paths_found)}")
    for p in pc_paths_found[:10]:
        print(f"  - [VIOLACION] {p}")
    if len(pc_paths_found) > 10:
        print(f"  ... y {len(pc_paths_found) - 10} mas")

    if len(violations) == 0 and len(secrets_found) == 0 and len(pc_paths_found) == 0:
        print("RESULTADO AUDITORIA: LIMPIO (0 secretos, 0 claves, 0 .env, 0 rutas absolutas de PC).")
        return True
    else:
        print("RESULTADO AUDITORIA: ADVERTENCIAS ENCONTRADAS.")
        return False

def make_zip(source_dir, output_zip):
    print(f"\n--- GENERANDO ZIP WIN-UNPACKED ---")
    print(f"Origen: {source_dir}")
    print(f"Destino: {output_zip}")
    # Remove existing zip if any
    if os.path.exists(output_zip):
        os.remove(output_zip)
    
    file_count = 0
    with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                file_count += 1
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, source_dir)
                zf.write(abs_path, rel_path)
    size = os.path.getsize(output_zip)
    print(f"Comprimidos {file_count} archivos en {output_zip} ({size:,} bytes).")

if __name__ == "__main__":
    repo_root = r"c:\Users\Amendoza\Downloads\fluxer-main\fluxer-main"
    desktop_dir = os.path.join(repo_root, "larixy_desktop")
    dist_electron = os.path.join(desktop_dir, "dist-electron")
    unpacked_dir = os.path.join(dist_electron, "win-unpacked")
    asar_path = os.path.join(unpacked_dir, "resources", "app.asar")
    asar_bin = os.path.join(repo_root, "node_modules", ".pnpm", "@electron+asar@4.1.1", "node_modules", "@electron", "asar", "bin", "asar.mjs")
    
    # 1. Audit asar
    temp_extract = os.path.join(dist_electron, "temp-asar-audit")
    if os.path.exists(temp_extract):
        shutil.rmtree(temp_extract)
    
    print(f"Extrayendo app.asar ({os.path.getsize(asar_path):,} bytes)...")
    res = subprocess.run(["node", asar_bin, "extract", asar_path, temp_extract], capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error extrayendo asar: {res.stderr}")
        sys.exit(1)
    
    audit_ok = audit_asar(temp_extract)
    shutil.rmtree(temp_extract, ignore_errors=True)
    
    # 2. Check installer
    print(f"\n--- INFORMACION DEL INSTALADOR NSIS ---")
    installer_files = [f for f in os.listdir(dist_electron) if f.endswith(".exe") and not f.startswith("win-unpacked") and not f.endswith("__uninstaller.exe")]
    for inst in installer_files:
        inst_path = os.path.join(dist_electron, inst)
        size = os.path.getsize(inst_path)
        sha = compute_sha256(inst_path)
        print(f"Instalador: {inst_path}")
        print(f"Tamano:     {size} bytes ({size / (1024*1024):.2f} MB)")
        print(f"SHA-256:    {sha}")
    
    # 3. Create zip
    zip_path = os.path.join(dist_electron, "Larixy-Windows-x64.zip")
    make_zip(unpacked_dir, zip_path)
    zip_size = os.path.getsize(zip_path)
    zip_sha = compute_sha256(zip_path)
    print(f"\n--- INFORMACION DEL ARCHIVO ZIP ---")
    print(f"Archivo: {zip_path}")
    print(f"Tamano:  {zip_size} bytes ({zip_size / (1024*1024):.2f} MB)")
    print(f"SHA-256: {zip_sha}")
