import sys

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_select = '''                <Select value={exName} onValueChange={(v) => setExName(v || '')}>
                  <SelectTrigger><SelectValue placeholder="Übung wählen..." /></SelectTrigger>
                  <SelectContent className="max-w-[90vw] w-fit">
                    {availableExercises.map(ex => (
                      <SelectItem key={ex.id || ex.name} value={ex.name}>{ex.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>'''

new_input = '''                <Input 
                  list="exercise-list"
                  placeholder="Übung eingeben oder wählen..." 
                  value={exName} 
                  onChange={(e) => setExName(e.target.value)} 
                />
                <datalist id="exercise-list">
                  {availableExercises.map(ex => (
                    <option key={ex.id || ex.name} value={ex.name} />
                  ))}
                </datalist>'''

content = content.replace(old_select, new_input)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
