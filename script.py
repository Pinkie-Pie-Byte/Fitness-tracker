import json
import re

with open('backend/bodybuilding_top_200.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for ex in data:
    # Remove everything after ' mit ' or ' im ' or ' - '
    name = ex['name']
    name = re.sub(r'\s+mit\s+.*$', '', name)
    name = re.sub(r'\s+im\s+.*$', '', name)
    name = re.sub(r'\s+-\s+.*$', '', name)
    ex['name'] = name

with open('backend/bodybuilding_top_200.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
