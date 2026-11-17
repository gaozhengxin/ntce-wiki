import json
from pathlib import Path
root = Path(__file__).resolve().parents[1]
questions = json.loads((root / 'data/questions.json').read_text(encoding='utf-8'))
seen = set()
required = {'id','stage','subject','kind','question','answer','origin'}
for q in questions:
    assert required <= q.keys(), f'missing fields in {q}'
    assert isinstance(q.get('options',[]),list)
    assert q['id'] not in seen, f'duplicate {q["id"]}'
    assert q['question'].strip() and q['answer'].strip()
    assert q['origin'] in ('original','licensed-past-paper','public-domain')
    if q['origin'] != 'original':
        assert q.get('sourceUrl') and q.get('license'), f'missing rights info: {q["id"]}'
    seen.add(q['id'])
print(f'OK: {len(questions)} questions')
