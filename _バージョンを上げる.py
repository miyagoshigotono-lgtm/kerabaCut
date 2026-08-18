# -*- coding: utf-8 -*-
"""アプリを直したあとに実行すると、全員のパソコンが自動で最新版になります。
   使い方:  python _バージョンを上げる.py
"""
import io, json, os, re, datetime
APP = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app')

idx = io.open(os.path.join(APP, 'index.html'), encoding='utf-8-sig').read()
cur = re.search(r"const APP_VERSION = '([^']+)'", idx).group(1)
a, b, c = (cur.split('.') + ['0', '0'])[:3]
new = '%s.%s.%d' % (a, b, int(c) + 1)

idx = idx.replace("const APP_VERSION = '%s'" % cur, "const APP_VERSION = '%s'" % new)
io.open(os.path.join(APP, 'index.html'), 'w', encoding='utf-8', newline='').write(idx)

sw = io.open(os.path.join(APP, 'sw.js'), encoding='utf-8-sig').read()
sw = re.sub(r"const VERSION = 'keraba-v[^']+'", "const VERSION = 'keraba-v%s'" % new, sw)
io.open(os.path.join(APP, 'sw.js'), 'w', encoding='utf-8', newline='').write(sw)

io.open(os.path.join(APP, 'version.json'), 'w', encoding='utf-8', newline='').write(
    json.dumps({'version': new}, ensure_ascii=False) + '\n')

print('%s  ->  %s   (%s)' % (cur, new, datetime.date.today()))
print('app フォルダを配布先に上書きコピーすれば、各パソコンが自動で更新されます。')
