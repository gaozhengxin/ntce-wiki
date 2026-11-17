from pathlib import Path
from bs4 import BeautifulSoup
import json,re,sys
src,out=map(Path,sys.argv[1:])
def load(p): return json.loads(p.read_text(encoding='utf-8'))
def dump(name,obj): (out/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
wiki=src/'ntce-wiki'
questions=load(wiki/'data/questions.json')
seen={q['id'] for q in questions}
assets={x['source']:x['files'] for x in load(wiki/'data/originals.json')}
papers={}
for name in ('papers.json','papers-extra.json'):
 for site,title,url,files in load(src/'.ntce-download'/name):
  url=url.split('?')[0]
  entry=papers.setdefault(url,[site,title,[]])
  entry[2].extend(n for n in files if n not in entry[2])
labels={'zhengmeng':'正蒙教育','fen':'焚题库','shanxiang':'山香教育'}
section=re.compile(r'^[一二三四五六七八九十]+\s*[、.．]\s*(?:第[一二三四五六]题\s*)?(单项选择题|单选题|选择题|辨析题|简答题|材料分析题|材料题|论述题|写作题|教学设计题|活动设计题|案例分析题|阅读理解题)')
ordinal=re.compile(r'^(\d{1,2})\s*[.．、]\s*(.+)')
answer=re.compile(r'^(?:【|\[)?(?:参考)?答案(?:及解析|解析)?\s*[】\]:：]?\s*(.*)')
option=re.compile(r'(?<![A-Za-z0-9])([A-DＡ-Ｄ])\s*[.．、:：]\s*')
index=[]
for url,(site,title,names) in papers.items():
 local=[src/'真题原件'/site/n for n in names if (src/'真题原件'/site/n).is_file()]
 title_norm=title.replace(' ','')
 year=re.search(r'20\d{2}',title_norm)
 semester=re.search(r'[上下](?:半年|半|册)|(?<=\d)[上下](?=教)',title_norm)
 stage=next((s for s in ('小学','中学','幼儿园') if s in title_norm), '幼儿园' if re.search('幼儿|学前|幼教',title_norm) else '')
 subject=next((s for s in ('综合素质','保教知识与能力','教育教学知识与能力','教育知识与能力') if s in title_norm),'')
 if stage=='中学' and subject=='教育教学知识与能力': subject='教育知识与能力'
 expected=None
 if site=='zhengmeng' and stage and subject and year and semester:
  expected={'综合素质':32,'保教知识与能力':16,'教育教学知识与能力':26,'教育知识与能力':31}[subject]
  for p in local:
   if p.suffix!='.html': continue
   soup=BeautifulSoup(p.read_text(encoding='utf-8',errors='replace'),'html.parser')
   body=soup.select_one('.news_detail_content .jz_fix_ue_img')
   if not body: continue
   rows=[]
   for node in body.find_all(['p','h2','h3','li']):
    if node.find(['p','h2','h3','li']): continue
    for br in node.find_all('br'): br.replace_with('\n')
    rows.extend(re.sub(r'[^\S\n]+',' ',x).strip() for x in node.get_text().splitlines())
   kind=None; current=None; blocks=[]; last=0
   for line in rows:
    if not line: continue
    match=section.match(line)
    if match:
     if last and match[1] in ('单项选择题','单选题','选择题'): break
     kind='单选题' if match[1] in ('单项选择题','单选题','选择题') else match[1]
     current=None;continue
    if not kind: continue
    if re.match(r'^(?:参考)?答案(?:及解析|解析)?[：: ]*$',line) and last>=expected-1: break
    m=ordinal.match(line)
    if m and int(m[1])==last+1 and int(m[1])<=expected:
     last+=1; current=[last,kind,[m[2]]];blocks.append(current)
    elif m and int(m[1])==1 and last>=expected-2: break
    elif current: current[2].append(line)
   for n,kind,lines in blocks:
    qid=f'zm-{p.stem.split("-")[-1]}-{n:02d}'
    if qid in seen: continue
    split=next((i for i,line in enumerate(lines) if answer.match(line)),len(lines))
    stem='\n'.join(lines[:split]).strip()
    if len(stem)<5:continue
    marks=list(option.finditer(stem))
    opts=[]
    if kind=='单选题' and ''.join(m[1].translate(str.maketrans('ＡＢＣＤ','ABCD')) for m in marks)=='ABCD':
     opts=[stem[m.start():(marks[i+1].start() if i+1<len(marks) else len(stem))].strip() for i,m in enumerate(marks)]
     stem=stem[:marks[0].start()].strip()
    if not stem: continue
    # Unverified answers stay in the original; never infer an answer from adjacent text.
    q={'id':qid,'year':int(year[0]),'semester':semester[0][0]+'半年','number':n,'stage':stage,'subject':subject,'kind':kind,'question':stem,'options':opts,'answer':'参考答案请查看原卷；尚未逐题核对。','origin':'sourced-past-paper','sourceUrl':url,'sourceName':labels[site]}
    questions.append(q);seen.add(qid)
 qs=[q for q in questions if q['sourceUrl']==url]
 nums=sorted({q['number'] for q in qs})
 index.append({'title':title,'sourceUrl':url,'sourceName':labels[site],'files':assets.get(url,[]),'questionIds':[q['id'] for q in sorted(qs,key=lambda q:q['number'])],'expected':expected,'unindexedNumbers':sorted(set(range(1,expected+1))-set(nums)) if expected else [],'status':'有逐题索引，待核对' if qs else '有原件，待拆题' if local else '缺本地原件'})
assert len(seen)==len(questions)
assert {q['id'] for q in questions}=={qid for p in index for qid in p['questionIds']}
dump('questions.json',questions);dump('paper-index.json',index)
from collections import Counter
print(len(questions),len(papers),Counter(p['status'] for p in index))
