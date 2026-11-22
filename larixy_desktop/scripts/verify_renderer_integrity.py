import os
import sys
import re
import json
import hashlib
import base64
import argparse

def compute_sha384(filepath):
    with open(filepath, 'rb') as f:
        return 'sha384-' + base64.b64encode(hashlib.sha384(f.read()).digest()).decode()

def verify_renderer(renderer_root):
    assets_dir = os.path.join(renderer_root, 'assets')
    if not os.path.exists(assets_dir):
        print(f"FATAL: assets directory missing at {assets_dir}")
        sys.exit(1)

    discrepancies = []

    # -------------------------------------------------------------
    # (a) Check HTML integrity attributes in index.html & auth-index.html
    # -------------------------------------------------------------
    html_files = ['index.html', 'auth-index.html']
    for hname in html_files:
        hpath = os.path.join(renderer_root, hname)
        if not os.path.exists(hpath):
            continue
        content = open(hpath, 'r', encoding='utf-8').read()
        matches = re.finditer(r'<(?:script|link)\b([^>]*\bintegrity="([^"]+)"[^>]*)>', content)
        for m in matches:
            tag_attrs = m.group(1)
            expected_hash = m.group(2)
            src_m = re.search(r'(?:src|href)="([^"]+)"', tag_attrs)
            if not src_m:
                continue
            url = src_m.group(1)
            if 'cloudflareinsights' in url:
                continue
            fname = url.split('?')[0].split('/')[-1]
            fpath = os.path.join(assets_dir, fname)
            if not os.path.exists(fpath):
                discrepancies.append(f"[{hname}] Referenced asset missing on disk: {fname} (url: {url})")
                continue
            actual_hash = compute_sha384(fpath)
            if actual_hash != expected_hash:
                discrepancies.append(
                    f"[{hname}] Integrity mismatch for {fname}: expected={expected_hash} computed={actual_hash}"
                )

    # -------------------------------------------------------------
    # (b) Check sriHashes and sriCssHashes of 7adf against assets/
    # -------------------------------------------------------------
    path_7adf = os.path.join(assets_dir, '7adf4e40d7e59402.js')
    if not os.path.exists(path_7adf):
        discrepancies.append("7adf4e40d7e59402.js missing in assets directory")
    else:
        c_7adf = open(path_7adf, 'r', encoding='utf-8').read()
        
        # Parse d.sriHashes & d.u
        m_sri = re.search(r'd\.sriHashes\s*=\s*(\{.+?\})(?:,|;)', c_7adf)
        if not m_sri:
            discrepancies.append("d.sriHashes not found in 7adf")
            sri_hashes = {}
        else:
            sri_hashes = json.loads(re.sub(r'(\d+):', r'"\1":', m_sri.group(1)))

        m_u = re.search(r'd\.u\s*=\s*s=>\{(.*?)\};', c_7adf)
        u_body = m_u.group(1) if m_u else ''
        js_matches = re.findall(r'if\s*\(\s*(\d+)===s\s*\)\s*return\s*"([^"]+)"', u_body)
        chunk_to_js = {cid: path for cid, path in js_matches}

        for cid, expected_sri in sri_hashes.items():
            if cid not in chunk_to_js:
                discrepancies.append(f"JS chunk {cid} in sriHashes has no d.u mapping in 7adf")
                continue
            fname = chunk_to_js[cid].split('?')[0].split('/')[-1]
            fpath = os.path.join(assets_dir, fname)
            if not os.path.exists(fpath):
                discrepancies.append(f"JS asset {fname} for chunk {cid} missing on disk")
                continue
            actual_sri = compute_sha384(fpath)
            if actual_sri != expected_sri:
                discrepancies.append(
                    f"JS chunk {cid} ({fname}) sriHashes mismatch: 7adf={expected_sri} disk={actual_sri}"
                )

        # Parse d.sriCssHashes & d.k
        m_css = re.search(r'd\.sriCssHashes\s*=\s*(\{.+?\})(?:,|;)', c_7adf)
        if not m_css:
            discrepancies.append("d.sriCssHashes not found in 7adf")
            sri_css_hashes = {}
        else:
            sri_css_hashes = json.loads(re.sub(r'(\d+):', r'"\1":', m_css.group(1)))

        idx_dk = c_7adf.find('d.k=')
        idx_next = c_7adf.find(';d.', idx_dk)
        dk_code = c_7adf[idx_dk:idx_next] if idx_dk != -1 else ''

        chunk_to_css = {}
        for m in re.finditer(r'(\d+)===s\?"([^"]+)"', dk_code):
            chunk_to_css[m.group(1)] = m.group(2)
        m_dict = re.search(r'\(\{([^}]+)\}\)\[s\]', dk_code)
        if m_dict:
            dict_content = '{' + re.sub(r'(\d+):', r'"\1":', m_dict.group(1)) + '}'
            css_map = json.loads(dict_content)
            for cid, stem in css_map.items():
                if cid not in chunk_to_css:
                    chunk_to_css[cid] = f"assets/{stem}.css"

        for cid, expected_sri in sri_css_hashes.items():
            if cid not in chunk_to_css:
                discrepancies.append(f"CSS chunk {cid} in sriCssHashes has no d.k mapping in 7adf")
                continue
            fname = chunk_to_css[cid].split('?')[0].split('/')[-1]
            fpath = os.path.join(assets_dir, fname)
            if not os.path.exists(fpath):
                discrepancies.append(f"CSS asset {fname} for chunk {cid} missing on disk")
                continue
            actual_sri = compute_sha384(fpath)
            if actual_sri != expected_sri:
                discrepancies.append(
                    f"CSS chunk {cid} ({fname}) sriCssHashes mismatch: 7adf={expected_sri} disk={actual_sri}"
                )

    # -------------------------------------------------------------
    # (c) Check desktop SW precache manifest if sw.js exists
    # -------------------------------------------------------------
    sw_path = os.path.join(renderer_root, 'sw.js')
    if os.path.exists(sw_path):
        c_sw = open(sw_path, 'r', encoding='utf-8').read()
        m_mani = re.search(r'manifest\s*=\s*(\[[^\]]+\])', c_sw)
        if m_mani:
            entries = json.loads(m_mani.group(1))
            for item in entries:
                url = item.get('url', '')
                expected_integ = item.get('integrity', '')
                fname = url.split('?')[0].split('/')[-1]
                fpath = os.path.join(assets_dir, fname)
                if not os.path.exists(fpath):
                    discrepancies.append(f"[sw.js] Missing precache file: {fname}")
                    continue
                actual_integ = compute_sha384(fpath)
                if actual_integ != expected_integ:
                    discrepancies.append(f"[sw.js] Integrity mismatch for {fname}: sw={expected_integ} disk={actual_integ}")
    else:
        # Desktop operates via LocalAppFileResolver without a Service Worker
        pass

    # -------------------------------------------------------------
    # Report Results
    # -------------------------------------------------------------
    print(f"=== Verification for renderer: {renderer_root} ===")
    if discrepancies:
        print(f"FAILED: Found {len(discrepancies)} discrepancies:")
        for d in discrepancies:
            print(f"  [DISCREPANCY] {d}")
        sys.exit(1)
    else:
        print("SUCCESS: 0 discrepancies found across HTML integrity, 7adf sriHashes & sriCssHashes, and Service Worker.")
        sys.exit(0)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--renderer-dir', required=True, help='Path to renderer directory')
    args = parser.parse_args()
    verify_renderer(os.path.abspath(args.renderer_dir))
