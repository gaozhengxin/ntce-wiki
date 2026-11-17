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
    assert q['origin'] in ('original','licensed-past-paper','public-domain','sourced-past-paper')
    if q['origin'] == 'sourced-past-paper':
        assert q.get('sourceUrl') and q.get('sourceName') and q.get('number')
    if q['origin'] in ('licensed-past-paper', 'public-domain'):
        assert q.get('sourceUrl') and q.get('license'), f'missing rights info: {q["id"]}'
    seen.add(q['id'])
print(f'OK: {len(questions)} questions')

originals = json.loads((root / 'data/originals.json').read_text(encoding='utf-8'))
for entry in originals:
    assert entry['title'] and entry['source'] and entry['files']
    for file in entry['files']:
        path = (root / file['path']).resolve()
        assert path.is_relative_to(root / 'downloads' / 'originals')
        assert path.is_file() and path.stat().st_size > 0, file['path']
        if file.get('preview'):
            preview = (root / file['preview']).resolve()
            assert preview.is_relative_to(root / 'downloads' / 'previews')
            assert preview.is_file() and preview.stat().st_size > 0, file['preview']
print(f'OK: {sum(len(entry["files"]) for entry in originals)} original files')
