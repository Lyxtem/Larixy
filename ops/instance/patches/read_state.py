import json

with open('/home/deploy/apps/wave-instance/.rexctl/state.json', 'r') as f:
    data = json.load(f)

# Find email related keys
def search_dict(d, prefix=""):
    for k, v in d.items():
        key_path = f"{prefix}.{k}" if prefix else k
        if 'email' in k.lower() or 'auth' in k.lower() or 'integrat' in k.lower():
            print(f"{key_path}: {v}")
        if isinstance(v, dict):
            search_dict(v, key_path)

search_dict(data)
