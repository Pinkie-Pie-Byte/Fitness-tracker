import json

with open('backend/bodybuilding_top_200.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

seen = set()
new_data = []
for ex in data:
    if ex['name'] not in seen:
        seen.add(ex['name'])
        new_data.append(ex)

with open('backend/bodybuilding_top_200.json', 'w', encoding='utf-8') as f:
    json.dump(new_data, f, indent=2, ensure_ascii=False)

print(f'Reduced from {len(data)} to {len(new_data)} exercises')
