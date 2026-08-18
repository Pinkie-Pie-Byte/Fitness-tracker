import sys

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = '''                <SelectTrigger className="w-[300px] overflow-hidden">
                  <span className="truncate block w-full text-left">
                    {chartFilter === 'all' ? 'Alle (Gesamtvolumen)' : (uniqueOptions.find(o => o[0] === chartFilter)?.[1] || chartFilter)}
                  </span>
                </SelectTrigger>'''

new_code = '''                <SelectTrigger className="w-[300px] overflow-hidden">
                  <span className="truncate flex-1 text-left">
                    {chartFilter === 'all' ? 'Alle (Gesamtvolumen)' : (uniqueOptions.find(o => o[0] === chartFilter)?.[1] || chartFilter)}
                  </span>
                </SelectTrigger>'''

content = content.replace(old_code, new_code)
with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
