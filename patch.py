import sys

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: chart filter value display
old_select_value = '<SelectValue placeholder="Filter..." />'
new_select_value = '{chartFilter === \'all\' ? \'Alle (Gesamtvolumen)\' : (uniqueOptions.find(o => o[0] === chartFilter)?.[1] || chartFilter)}'
content = content.replace(old_select_value, new_select_value)

# Fix 2: Exercise dropdown text truncation
# Find the SelectContent for exercises
old_select_content = '<SelectContent>'
new_select_content = '<SelectContent className="max-w-[90vw] w-fit">'
content = content.replace(old_select_content, new_select_content)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
