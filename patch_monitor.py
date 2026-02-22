#!/usr/bin/env python3
content = open('/home/ubuntu/phimkhoi/src/components/WatchContainer.tsx', 'r', encoding='utf-8').read()
old = '{ List as ListIcon }'
new = '{ List as ListIcon, Monitor }'
if old in content:
    content = content.replace(old, new)
    open('/home/ubuntu/phimkhoi/src/components/WatchContainer.tsx', 'w', encoding='utf-8').write(content)
    print("PATCHED: Monitor import added successfully")
else:
    print("SKIP: import already contains Monitor or pattern not found")
    print("Current import line:", [l for l in content.split('\n') if 'lucide-react' in l])
