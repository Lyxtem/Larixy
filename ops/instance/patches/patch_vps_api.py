import re

# 1. Patch chunk-ZXO4TNSM.js
path1 = "/home/deploy/apps/wave-instance/extra/chunk-ZXO4TNSM.js"
with open(path1, "r", encoding="utf-8") as f:
    c = f.read()

target1 = "var DESKTOP_HANDOFF_RETURN_URI_PATTERN = /^fluxer(?:-canary|-development)?:\/\/handoff$/u;"
replacement1 = "var DESKTOP_HANDOFF_RETURN_URI_PATTERN = /^(?:larixy|fluxer)(?:-canary|-development)?:\/\/handoff$/u;"

if target1 in c:
    c = c.replace(target1, replacement1)
    with open(path1, "w", encoding="utf-8") as f:
        f.write(c)
    print("chunk-ZXO4TNSM.js patched successfully!")
else:
    print("target1 not found in chunk-ZXO4TNSM.js, maybe already patched?")

# 2. Patch AppEntrypoint.js
path2 = "/home/deploy/apps/wave-instance/extra/AppEntrypoint.js"
with open(path2, "r", encoding="utf-8") as f:
    c2 = f.read()

target2 = "corsOrigins: [...config.endpoints.webAppOrigins, config.endpoints.marketing],"
replacement2 = 'corsOrigins: [...config.endpoints.webAppOrigins, config.endpoints.marketing, "larixy-app://app"],'

if target2 in c2:
    c2 = c2.replace(target2, replacement2)
    with open(path2, "w", encoding="utf-8") as f:
        f.write(c2)
    print("AppEntrypoint.js patched successfully!")
else:
    print("target2 not found in AppEntrypoint.js, maybe already patched?")
