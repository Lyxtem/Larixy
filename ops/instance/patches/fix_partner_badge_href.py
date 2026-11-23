path = '/home/deploy/apps/wave-instance/extra/chunk-ZKNE52GF.js'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()
if 'href: marketing("partners")' in c:
    c = c.replace('href: marketing("partners")', 'href: marketing("partner")')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Replaced partner link in chunk-ZKNE52GF.js!")
else:
    print("Already updated or pattern not found")
