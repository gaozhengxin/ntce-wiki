const app = document.querySelector('#app');
const STORAGE = 'ntce-wiki-state-v1';
const safe = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr = safe;
const external = u => { try {const p=new URL(u,location.href);return ['http:','https:'].includes(p.protocol)?p.href:'#';}catch{return '#';}};
const data = {};
const state = (() => {try {const v=JSON.parse(localStorage.getItem(STORAGE)||'{}');return v && typeof v==='object' && !Array.isArray(v)?v:{};}catch{return {};}})();
const persist=()=>{try{localStorage.setItem(STORAGE, JSON.stringify(state));}catch{alert('无法保存到浏览器本地存储，请先导出备份或释放空间。');}};
async function load(){try{for (const [k,path] of Object.entries({questions:'data/questions.json',paperIndex:'data/paper-index.json',originals:'data/originals.json',wiki:'data/wiki.json'})){const r=await fetch('./'+path);if(!r.ok)throw new Error(path+' HTTP '+r.status);data[k]=await r.json();}render();}catch(err){app.innerHTML=`<div class="notice">内容加载失败：${safe(err.message)}。请通过本地 HTTP 服务器访问，不要直接打开 HTML 文件。</div>`;}}
const route=()=>decodeURIComponent(location.hash.replace(/^#\/?/,'')||'home').split('/');
const statuses=()=>data.questions.map(q=>state[q.id]).filter(s=>s==='correct'||s==='wrong');
function render(){const [page,arg]=route();if(page==='paper-index')return paperIndex();if(page==='questions')return questions(false);if(page==='wrong')return questions(true);if(page==='sources')return sources();if(page==='wiki')return wiki(arg);return home();}
function home(){const seen=statuses().length,wrong=statuses().filter(x=>x==='wrong').length;
 app.innerHTML=`<h1>教师资格考试 · Wiki</h1><p class="lead">考试大纲与资料索引、Markdown 知识笔记、隐藏答案的练习题。无需账户，所有练习记录只存在当前浏览器。</p><div class="grid"><section class="panel"><h2>题库规模</h2><div class="stats">${data.questions.length}</div><p class="muted">已录入的练习题</p><a href="#/questions">开始练习 →</a></section><section class="panel"><h2>已判断</h2><div class="stats">${seen}</div><p class="muted">自行判断的做题记录</p><a href="#/questions">继续刷题 →</a></section><section class="panel"><h2>错题</h2><div class="stats">${wrong}</div><p class="muted">可再次显示答案、重新判断</p><a href="#/wrong">打开错题集 →</a></section></div><div class="grid"><section class="panel"><h2>学习资料</h2><p>官方考纲、考试科目与教育学笔记。</p><a href="#/wiki/syllabus">查看考试大纲 →</a></section><section class="panel"><h2>历年真题来源</h2><p>按来源查阅历年试题和参考答案。</p><a href="#/sources">查看资料原件 →</a><p><a href="./downloads/ntce-originals.zip" download>下载考纲和真题原件（ZIP）</a></p></section></div><section class="panel"><h2>本地进度备份</h2><p class="muted">缓存可能被清理。请定期导出 JSON，换设备后导入恢复。</p><div class="actions"><button class="primary" id="export">导出做题记录</button><label class="file-label">导入记录 <input id="import" type="file" accept="application/json,.json"></label><button id="reset">清空全部记录</button></div></section>`;
 document.querySelector('#export').onclick=()=>{const blob=new Blob([JSON.stringify({format:'ntce-wiki-state-v1',savedAt:new Date().toISOString(),progress:state},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ntce-wiki-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);};
 document.querySelector('#import').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const v=JSON.parse(await f.text());if(v.format!=='ntce-wiki-state-v1'||!v.progress||typeof v.progress!=='object'||Array.isArray(v.progress))throw Error('格式不匹配');if(!confirm('导入将覆盖当前做题记录，继续吗？'))return;const allowed=new Set(data.questions.map(q=>q.id));Object.keys(state).forEach(k=>delete state[k]);for(const [id,s] of Object.entries(v.progress))if(allowed.has(id)&&['correct','wrong'].includes(s))state[id]=s;persist();render();}catch(err){alert('导入失败：'+err.message);}};
 document.querySelector('#reset').onclick=()=>{if(confirm('确定清空当前浏览器的所有做题记录？')){Object.keys(state).forEach(k=>delete state[k]);persist();render();}};
}
let filters={stage:'',subject:'',kind:''};
function questions(wrongOnly){let list=data.questions.filter(q=>!wrongOnly||state[q.id]==='wrong');if(!wrongOnly && route()[1]) list=list.filter(q=>q.id===route()[1]);const opts=key=>[...new Set(data.questions.map(x=>x[key]))].sort();
 app.innerHTML=`<h1>${wrongOnly?'错题集':'刷题练习'}</h1><p class="lead">题目作答由你自己完成；点击显示参考答案，再选择“做对”或“做错”。无自动判分。</p>${data.questions.length ? "" : `<div class="notice">题库暂未录入真题。可在<a href="#/sources">资料来源</a>查看原网站。</div>`}${wrongOnly?'':`<div class="toolbar"><label>学段 <select id="stage">${makeOptions(opts('stage'),filters.stage)}</select></label><label>科目 <select id="subject">${makeOptions(opts('subject'),filters.subject)}</select></label><label>题型 <select id="kind">${makeOptions(opts('kind'),filters.kind)}</select></label></div>`}<div id="cards"></div>`;
 if(!wrongOnly)for(const name of ['stage','subject','kind'])document.querySelector('#'+name).onchange=e=>{filters[name]=e.target.value;draw();};
 function draw(){list=data.questions.filter(q=>(wrongOnly||!route()[1]||q.id===route()[1])&&(!wrongOnly||state[q.id]==='wrong')&&(wrongOnly||(!filters.stage||q.stage===filters.stage)&&(!filters.subject||q.subject===filters.subject)&&(!filters.kind||q.kind===filters.kind)));document.querySelector('#cards').innerHTML=list.length?list.map((q,i)=>`<article class="question"><div class="meta">${q.year ? safe(q.year + ' 年' + q.semester + ' · 原卷第 ' + q.number + ' 题') : '第 ' + (i+1) + ' 题'} · <span class="pill">${safe(q.stage)}</span><span class="pill">${safe(q.subject)}</span><span class="pill">${safe(q.kind)}</span><span class="pill">${safe(q.topic||'综合')}</span></div><div class="question-title">${safe(q.question)}</div>${q.options?.length?`<ol class="options" style="list-style:none;padding-left:0">${q.options.map(o=>`<li>${safe(o)}</li>`).join('')}</ol>`:''}<div id="answer-${attr(q.id)}" class="answer" hidden><b>参考答案</b><div>${safe(q.answer)}</div></div><div class="actions"><button data-id="${attr(q.id)}" data-action="reveal">显示答案</button><button data-id="${attr(q.id)}" data-action="correct" ${state[q.id]==='correct'?'disabled':''}>✓ 做对了</button><button data-id="${attr(q.id)}" data-action="wrong" ${state[q.id]==='wrong'?'disabled':''}>✕ 做错了</button><button data-id="${attr(q.id)}" data-action="clear">清除标记</button></div><div class="source">编号：${safe(q.id)} · ${state[q.id]==='correct'?'已标记做对':state[q.id]==='wrong'?'已标记错题':'尚未判断'} · ${q.sourceUrl ? `<a href="${attr(external(q.sourceUrl))}" target="_blank" rel="noopener noreferrer">${safe(q.sourceName || '查看试卷来源')}${q.origin==='sourced-past-paper'?' · 第三方整理版':''} ↗</a>` : '原创练习'}</div></article>`).join(''):`<div class="empty">${wrongOnly?'暂无错题。可以先在刷题页标记做错的题目。':'没有符合筛选条件的题目。'}</div>`;}
 draw();document.querySelector('#cards').onclick=e=>{const btn=e.target.closest('button[data-id]');if(!btn)return;const id=btn.dataset.id,action=btn.dataset.action;if(action==='reveal'){const ans=document.getElementById('answer-'+id);ans.hidden=!ans.hidden;btn.textContent=ans.hidden?'显示答案':'隐藏答案';return;}if(action==='clear')delete state[id];else state[id]=action;persist();draw();};}
function makeOptions(items,v){return `<option value="">全部</option>`+items.map(x=>`<option value="${attr(x)}" ${v===x?'selected':''}>${safe(x)}</option>`).join('');}
function sources() {
 const groups = [...new Set(data.originals.map(item => item.group))];
 app.innerHTML = `<h1>资料</h1>
  <p class="lead">展开资料后，可直接查看仓库中的考纲、试卷和图片。</p>
  <div class="toolbar">
   <label>资料分类 <select id="original-group">${groups.map(group => `<option>${safe(group)}</option>`).join('')}</select></label>
   <label>标题或文件名 <input id="original-search" type="search"></label>
  </div>
  <div id="original-list"></div>`;
 const group = document.querySelector('#original-group');
 const query = document.querySelector('#original-search');
 const list = document.querySelector('#original-list');
 function renderOriginals() {
  const keyword = query.value.trim().toLowerCase();
  const entries = data.originals.filter(item => item.group === group.value &&
   [item.title, ...item.files.map(file => file.name)].some(value => value.toLowerCase().includes(keyword)));
  list.innerHTML = entries.length ? entries.map(item => `<details class="panel original-entry">
   <summary>${safe(item.title)} <span class="muted">（${item.files.length} 个文件）</span></summary>
   <div class="original-files"></div>
  </details>`).join('') : '<p class="empty">这个分类没有找到匹配的资料。</p>';
  list.querySelectorAll('.original-entry').forEach((entry, index) => {
   entry.addEventListener('toggle', () => {
    const content = entry.querySelector('.original-files');
    if (!entry.open) {
     content.replaceChildren();
     return;
    }
    content.innerHTML = entries[index].files.map(file => {
     const original = './' + encodeURI(file.path);
     const preview = file.preview ? './' + encodeURI(file.preview) : original;
     let viewer = '';
     if (/\.(jpg|jpeg|png)$/i.test(file.name)) {
      viewer = `<img class="original-image" src="${attr(preview)}" alt="${attr(file.name)}" loading="lazy">`;
     } else if (file.preview || /\.pdf$/i.test(file.name)) {
      const sandbox = /\.html$/i.test(file.preview || '') ? ' sandbox' : '';
      viewer = `<iframe class="original-preview" src="${attr(preview)}" title="${attr(file.name)}" loading="lazy"${sandbox}></iframe>`;
     }
     return `<section class="original-file">
      <h3>${safe(file.name)}</h3>
      ${viewer || (file.note ? `<p>${safe(file.note)}</p>` : '<p>请下载 DOC 原件后打开。</p>')}
      <button type="button" data-download="${attr(original)}" data-name="${attr(file.name)}">下载原件</button>
     </section>`;
    }).join('');
   });
  });
 }
 list.addEventListener('click', event => {
  const button = event.target.closest('button[data-download]');
  if (!button) return;
  const download = document.createElement('a');
  download.href = button.dataset.download;
  download.download = button.dataset.name;
  download.click();
 });
 group.addEventListener('change', renderOriginals);
 query.addEventListener('input', renderOriginals);
 renderOriginals();
}
function md(s){const chunks=s.replace(/\r\n/g,'\n').split('```');return chunks.map((chunk,i)=>{if(i%2)return `<pre><code>${safe(chunk.replace(/^\w*\n/,''))}</code></pre>`;return chunk.split('\n').map(line=>{const escaped=safe(line);const linked=escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^ )]+)\)/g,(_,label,url)=>`<a target="_blank" rel="noopener noreferrer" href="${attr(external(url))}">${label}</a>`).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');if(/^### /.test(line))return `<h3>${linked.slice(4)}</h3>`;if(/^## /.test(line))return `<h2>${linked.slice(3)}</h2>`;if(/^# /.test(line))return `<h1>${linked.slice(2)}</h1>`;if(/^[-*] /.test(line))return `<div class="bullet">• ${linked.slice(2)}</div>`;return line.trim()?`<p>${linked}</p>`:'';}).join('');}).join('');}
async function wiki(id){const item=data.wiki.find(x=>x.id===id)||data.wiki[0];app.innerHTML=`<h1>知识库</h1><div class="wiki-layout"><aside class="wiki-menu">${data.wiki.map(x=>`<a class="panel" href="#/wiki/${attr(x.id)}">${safe(x.title)}</a>`).join('')}</aside><article class="panel wiki-article" id="wiki-content">载入中…</article></div>`;try{const r=await fetch('./docs/'+item.file);if(!r.ok)throw Error('HTTP '+r.status);const body=await r.text();if(route()[0]==='wiki'&&(route()[1]||data.wiki[0].id)===item.id)document.querySelector('#wiki-content').innerHTML=md(body);}catch(e){document.querySelector('#wiki-content').textContent='加载失败：'+e.message;}}
window.addEventListener('hashchange',render);load();

function paperIndex(){
 const byId=new Map(data.questions.map(q=>[q.id,q]));
 const indexed=data.paperIndex.filter(p=>p.questionIds.length);
 const pending=data.paperIndex.filter(p=>!p.questionIds.length && p.files.length);
 const missing=data.paperIndex.length-indexed.length-pending.length;
 app.innerHTML=`<h1>真题索引</h1><p>共 ${data.questions.length} 道已拆分题目，${data.paperIndex.length} 条试卷来源。${indexed.length} 条来源有逐题索引（不一定收齐），${pending.length} 条有原件待拆题，${missing} 条缺本地原件。</p><label>搜索试卷 <input id="paper-search" type="search"></label><div id="paper-list"></div>`;
 const draw=()=>{
 const term=document.querySelector('#paper-search').value.trim().toLowerCase();
 document.querySelector('#paper-list').innerHTML=data.paperIndex.filter(p=>(p.title+' '+p.sourceName+' '+p.status).toLowerCase().includes(term)).map(p=>`<details class="panel"><summary>${safe(p.title)} · ${p.questionIds.length} 题 · ${safe(p.status)}</summary><p><a href="${attr(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">来源页面</a> ${p.files.map(f=>`<a href="./${attr(f.path)}" download>${safe(f.name)}</a>`).join(' · ')}</p>${p.unindexedNumbers.length?`<p>待核对或补录题号：${p.unindexedNumbers.join('、')}</p>`:''}<ol>${p.questionIds.map(id=>{const q=byId.get(id);return `<li><a href="#/questions/${attr(id)}">第 ${q.number} 题 · ${safe(q.question.slice(0,100))}</a></li>`;}).join('')}</ol></details>`).join('');
 };
 document.querySelector('#paper-search').oninput=draw;draw();
}
