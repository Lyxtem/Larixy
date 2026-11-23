content = open('/home/deploy/apps/wave-instance/extra/app_static/assets/b65d6c7bf5d6e1fd.js', 'r', encoding='utf-8').read()
idx = 0
while True:
    pos = content.find('_fluxer', idx)
    if pos == -1:
        break
    print(repr(content[max(0, pos-40):pos+40]))
    idx = pos + 1
