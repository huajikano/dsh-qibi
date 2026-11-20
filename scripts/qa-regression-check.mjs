// Behavioral checks for actual component callbacks and deferred requests. No browser layout or screenshot claims.
import assert from 'node:assert/strict'
import React from 'react'
import { loadPanel } from './render-check.mjs'
import { runSerializedSave, flushDraft } from '../src/draft-save.js'
import { saveCharacterEditor } from '../src/character-editor.js'
const panel = await loadPanel()
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
const tick = () => new Promise(resolve => setImmediate(resolve))
const t = key => key
let passed = 0
const originals = Object.fromEntries(['window','document','localStorage','setTimeout','clearTimeout','setInterval','clearInterval'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis,key)]))
const timers = new Map(); let timerId = 0
const windowListeners = new Map()
globalThis.window = { addEventListener(key, fn) { windowListeners.set(key,fn) }, removeEventListener(key,fn) { if(windowListeners.get(key)===fn)windowListeners.delete(key) }, confirm:()=>true }
globalThis.document = { visibilityState:'visible', activeElement:null }
globalThis.localStorage = { getItem:()=>null, setItem(){} }
globalThis.setTimeout = fn => { timers.set(++timerId,fn); return timerId }
globalThis.setInterval = globalThis.setTimeout
globalThis.clearTimeout = id => timers.delete(id)
globalThis.clearInterval = globalThis.clearTimeout
function mount(Component, supplied) {
  const slots=[]; let cursor=0,dirty=false,effects=[],tree
  const props={t, notify(){},writable:true,active:true,...supplied}
  const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]))
  const dispatcher={
    useState(initial){const i=cursor++; if(!slots[i])slots[i]={value:typeof initial==='function'?initial():initial};return[slots[i].value,next=>{const v=typeof next==='function'?next(slots[i].value):next;if(!Object.is(v,slots[i].value)){slots[i].value=v;dirty=true}}]},
    useRef(value){const i=cursor++;return slots[i]??=( {current:value})},
    useId(){return `fixture-${cursor++}`},
    useMemo(fn,deps){const i=cursor++;if(!same(deps,slots[i]?.deps))slots[i]={deps,value:fn()};return slots[i].value},
    useCallback(fn,deps){return this.useMemo(()=>fn,deps)},
    useEffect(fn,deps){const i=cursor++;if(!same(deps,slots[i]?.deps)){effects.push({i,fn});slots[i]={deps,cleanup:slots[i]?.cleanup}}},
  }
  const text=node=>Array.isArray(node)?node.map(text).join(''):node==null||typeof node==='boolean'?'':typeof node==='object'?text(node.props?.children):String(node)
  function* walk(node){if(Array.isArray(node)){for(const row of node)yield* walk(row)}else if(node&&typeof node==='object'){yield node;yield*walk(node.props?.children)}}
  const nodes=predicate=>[...walk(tree)].filter(predicate)
  function sync(){for(let n=0;n<30;n++){
    cursor=0;dirty=false;effects=[]
    const holder=React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher
    const prior=holder.current;holder.current=dispatcher
    try{tree=Component(props)}finally{holder.current=prior}
    const pending=effects;for(const row of pending)slots[row.i].cleanup?.();for(const row of pending)slots[row.i].cleanup=row.fn()
    if(!dirty)return
  }throw Error('State did not settle')}
  const settle=async()=>{for(let i=0;i<5;i++){sync();await tick()}sync()}
  sync()
  return{props,sync,settle,nodes,button:key=>nodes(n=>n.type==='button'&&text(n)===key)[0],field:value=>nodes(n=>['input','textarea'].includes(n.type)&&n.props.value===value)[0],text:()=>text(tree),unmount(){for(const row of slots)row?.cleanup?.()}}
}
async function check(name, fn){await fn();passed++;console.log(`ok ${passed} - ${name}`)}
try{
  await check('保存队列不并行；强制保存也等待旧请求，切章排空最后一笔',async()=>{
    const lock={current:null},gates=[],snapshots=[];let draft='A',disk='',isCurrent=true
    const save=()=>runSerializedSave(lock,false,async()=>{if(draft===disk)return true;const value=draft,gate=deferred();gates.push(gate);snapshots.push(value);await gate.promise;disk=value;return true})
    const first=save();await tick();draft='B'
    const flushed=flushDraft({isCurrent:()=>isCurrent,isDirty:()=>draft!==disk,isSaving:()=>!!lock.current,save})
    gates[0].resolve();await tick();assert.deepEqual(snapshots,['A','B']);draft='C';gates[1].resolve();await tick();assert.deepEqual(snapshots,['A','B','C']);gates[2].resolve();await first;assert.equal(await flushed,true);assert.equal(disk,'C')
    const old=deferred();const a=runSerializedSave(lock,false,()=>old.promise);let ran=false;const b=runSerializedSave(lock,true,async()=>{ran=true;return true});await tick();assert.equal(ran,false);old.resolve(false);await a;assert.equal(await b,true)
    isCurrent=false;assert.equal(await flushDraft({isCurrent:()=>false,isDirty:()=>true,isSaving:()=>false,save}),false)
  })
  await check('实际编辑器：慢保存后撤销仍脏，后续保存使用新令牌；无变化不造修订',async()=>{
    let saved={id:11,novelId:1,title:'夹具章',content:'A',token:'t0',wordCount:1,status:'草稿'},count=0
    const pending=[]
    const call=async(method,input)=>{
      if(method==='status')return{exists:true,writable:true,configWritable:true,user:{id:1},dataDir:'fixture',dbPath:'fixture/db',counts:{novels:1}}
      if(method==='novels')return{novels:[{id:1,title:'夹具作品',chapterCount:2,wordCount:1}]}
      if(method==='chapters')return{chapters:[saved,{id:12,novelId:1,title:'第二章',content:'第二章',token:'b',wordCount:3}]}
      if(method==='chapter')return{chapter:input.chapterId===11?{...saved}:{id:12,novelId:1,title:'第二章',content:'第二章',token:'b',wordCount:3}}
      if(method==='characters')return{characters:[]};if(method==='outline')return{outline:[]};if(method==='aiInfo')return{available:false};if(method==='select')return{}
      if(method==='save'){const gate=deferred();pending.push({input,gate});await gate.promise;assert.equal(input.expectedToken,saved.token);saved={...saved,content:input.content,wordCount:input.content.length,token:`t${++count}`};return{chapter:{...saved}}}
      throw Error('Unexpected '+method)
    }
    const app=mount(panel.Workbench,{call,appearance:{open(){},name:'fixture'}})
    try{
      await app.settle();let editor=app.nodes(n=>n.props?.className==='qibi-editor')[0];assert.equal(editor.props.value,'A')
      editor.props.onChange({target:{value:'B'}});app.sync();editor=app.nodes(n=>n.props?.className==='qibi-editor')[0];editor.props.onBlur();await app.settle();assert.equal(pending.length,1)
      app.nodes(n=>n.props?.className==='qibi-editor')[0].props.onKeyDown({key:'z',ctrlKey:true,preventDefault(){}});app.sync();assert.equal(app.nodes(n=>n.props?.className==='qibi-editor')[0].props.value,'A')
      pending[0].gate.resolve();await app.settle();assert.equal(saved.content,'B');assert.ok(app.text().includes('unsaved'))
      app.nodes(n=>n.props?.className==='qibi-editor')[0].props.onBlur();await app.settle();assert.equal(pending[1].input.content,'A');assert.equal(pending[1].input.expectedToken,'t1');pending[1].gate.resolve();await app.settle();assert.equal(saved.content,'A')
      app.nodes(n=>n.props?.className==='qibi-editor')[0].props.onBlur();await app.settle();assert.equal(pending.length,2)
      const secondChapter=app.nodes(n=>n.type==='button'&&n.props.className?.includes('qibi-chapter')&&Array.isArray(n.props.children)&&n.props.children.some(child=>child?.props?.children==='第二章'))[0]
      await secondChapter.props.onClick();await app.settle()
      assert.equal(app.nodes(n=>n.props?.className==='qibi-editor')[0].props.value,'第二章')
      app.nodes(n=>n.props?.className==='qibi-editor')[0].props.onKeyDown({key:'z',ctrlKey:true,preventDefault(){}});await app.settle()
      assert.equal(app.nodes(n=>n.props?.className==='qibi-editor')[0].props.value,'第二章','Undo must not carry prose from the previous chapter')
      await app.nodes(n=>typeof n.props?.onOpenChapter==='function')[0].props.onOpenChapter(1,12);await app.settle()
      assert.equal(app.nodes(n=>n.props?.className==='qibi-editor')[0].props.value,'第二章','Opening the current chapter from search must preserve the editor')
    }finally{app.unmount()}
  })
  await check('人物部分成功重试只创建一个人物，读取账本失败不允许写空状态',async()=>{
    let created=0,token=0,stateAttempts=0,current
    const dialog={id:null,token:null,stateToken:null,stateExists:false,loadingState:false,stateLoadError:false,form:{name:'夹具人',alias:'',role:'',gender:'',age:'',appearance:'',personality:'',background:''},state:{location:'钟楼',inventory:'钥匙'}}
    const call=async(method,input)=>{
      if(method==='createCharacter'){created++;return{id:42,characters:[{id:42,token:`p${++token}`} ]}}
      if(method==='updateCharacter'){assert.equal(input.expectedToken,`p${token}`);return{characters:[{id:42,token:`p${++token}`} ]}}
      if(method==='updateCharacterState'){stateAttempts++;assert.equal(input.characterId,42);if(stateAttempts===1)throw Error('synthetic write failure');return{token:'s1'}}
      throw Error(method)
    }
    await assert.rejects(()=>saveCharacterEditor({call,novelId:1,dialog,onProgress:row=>{current=row}}),/synthetic/)
    assert.equal(current.id,42);assert.equal(current.token,'p1')
    await saveCharacterEditor({call,novelId:1,dialog:current,onProgress:row=>{current=row}});assert.equal(created,1);assert.equal(stateAttempts,2);assert.equal(current.stateToken,'s1')
    await assert.rejects(()=>saveCharacterEditor({call,novelId:1,dialog:{...current,stateLoadError:true},onProgress(){}}),/读取/);assert.equal(stateAttempts,2)
  })
  await check('大纲冲突保留本地输入；保存期间字段锁定',async()=>{
    const gate=deferred()
    const app=mount(panel.OutlineTab,{novelId:1,chapters:[],call:async method=>method==='outline'?{outline:[]}:gate.promise})
    try{await app.settle();app.button('outlineNewMaster').props.onClick();app.sync();app.nodes(n=>n.props?.name==='outline-title')[0].props.onChange({target:{value:'本地新标题'}});app.sync();const action=app.button('save').props.onClick();await app.settle();assert.ok(app.nodes(n=>n.type==='fieldset'&&n.props.disabled).length);gate.reject(Object.assign(Error('conflict'),{code:'ENTITY_CONFLICT'}));await action;await app.settle();assert.ok(app.field('本地新标题'))}finally{app.unmount()}
  })
  await check('人物账本读取失败禁用保存，并提供重试读取',async()=>{
    const app=mount(panel.CharactersTab,{novelId:1,chapterId:11,call:async method=>{if(method==='characters')return{characters:[{id:42,name:'夹具人',token:'p1'}]};throw Error('synthetic read failure')}})
    try{await app.settle();await app.button('edit').props.onClick();await app.settle();const dialog=app.nodes(n=>n.type===panel.Dialog)[0];assert.equal(dialog.props.footer.props.children[2].props.disabled,true);assert.ok(app.text().includes('characterStateReadFailed'));assert.ok(app.button('retry'))}finally{app.unmount()}
  })
  await check('连续性旧章保存迟到不把A摘要灌入B表单；冲突草稿保留',async()=>{
    const gate=deferred();const reloads=[]
    const app=mount(panel.ContinuityTab,{novelId:1,chapterId:11,call:async(method,input)=>{
      if(method==='volumes')return{volumes:[]};if(method==='writerState')return{writerState:{progress:'进度',foreshadowing:'[]'}}
      if(method==='chapterSummary'){reloads.push(input.chapterId);return{summary:{exists:true,summary:input.chapterId===11?'A摘要':'B摘要',keyEvents:'事件',cliffhanger:'钩子',token:'s'}}}
      if(method==='updateChapterSummary')return gate.promise;throw Error(method)
    }})
    try{await app.settle();app.field('A摘要').props.onChange({target:{value:'A新摘要'}});app.sync();const save=app.nodes(n=>n.type==='button'&&n.props.className==='qibi-btn small primary'&&n.props.disabled===false)[0].props.onClick();await app.settle();app.props.chapterId=12;await app.settle();assert.ok(app.field('B摘要'));gate.resolve({});await save;await app.settle();assert.ok(app.field('B摘要'));assert.deepEqual(reloads,[11,12])}finally{app.unmount()}
  })
  await check('蒸馏旧作者迟到详情被丢弃，屏幕目标与上传目标一致',async()=>{
    const a=deferred(),b=deferred()
    const app=mount(panel.DistillTab,{novelId:1,call:async(method,input)=>{
      if(method==='distilledAuthors')return[{id:1,name:'A',sourceCount:0},{id:2,name:'B',sourceCount:0}]
      if(method==='writerState')return{writerState:{}}
      if(method==='distilledAuthor')return input.authorId===1?a.promise:b.promise
      throw Error(method)
    }})
    try{await app.settle();app.nodes(n=>n.type==='button'&&n.props.className==='qibi-author-btn')[0].props.onClick();await app.settle();b.resolve({id:2,name:'B',sources:[],versions:[]});await app.settle();assert.equal(app.nodes(n=>n.props?.className==='qibi-distill-title')[0].props.children,'B');a.resolve({id:1,name:'A',sources:[],versions:[]});await app.settle();assert.equal(app.nodes(n=>n.props?.className==='qibi-distill-title')[0].props.children,'B')}finally{app.unmount()}
  })
  await check('连续性首次读取失败禁止空写，重试成功才解锁', async()=>{
    let fail=true,writes=0
    const app=mount(panel.ContinuityTab,{novelId:1,chapterId:11,call:async(method)=>{
      if(method==='volumes')return{volumes:[]}
      if(method==='chapterSummary'){if(fail)throw Error('fixture summary load failure');return{summary:{exists:true,summary:'保留摘要',keyEvents:'',cliffhanger:'',token:'s1'}}}
      if(method==='writerState'){if(fail)throw Error('fixture writer load failure');return{writerState:{exists:true,progress:'保留进度',foreshadowing:'[]',token:'w1'}}}
      if(method==='updateChapterSummary'||method==='updateWriterState'){writes++;return{}}
      throw Error(method)
    }})
    try{
      await app.settle()
      const saveButtons=app.nodes(n=>n.type==='button'&&n.props.className==='qibi-btn small primary')
      assert.equal(saveButtons.length,2);assert.ok(saveButtons.every(n=>n.props.disabled))
      for(const button of saveButtons)await button.props.onClick()
      await app.settle();assert.equal(writes,0)
      fail=false
      const retries=app.nodes(n=>n.type==='button'&&n.props.children==='retry')
      assert.equal(retries.length,2)
      for(const button of retries)await button.props.onClick()
      await app.settle();assert.ok(app.field('保留摘要'));assert.ok(app.field('保留进度'))
      assert.ok(app.nodes(n=>n.type==='button'&&n.props.className==='qibi-btn small primary').every(n=>!n.props.disabled))
    }finally{app.unmount()}
  })
  await check('蒸馏列表加载失败可重试，重复点当前作者不清详情', async()=>{
    let fail=true
    const app=mount(panel.DistillTab,{novelId:1,call:async(method)=>{
      if(method==='distilledAuthors'){if(fail)throw Error('fixture author list failure');return[{id:1,name:'固定作者',sourceCount:0}]}
      if(method==='writerState')return{writerState:{}}
      if(method==='distilledAuthor')return{id:1,name:'固定作者',sources:[],versions:[]}
      throw Error(method)
    }})
    try{
      await app.settle();assert.ok(app.button('retry'))
      fail=false;await app.button('retry').props.onClick();await app.settle()
      assert.equal(app.nodes(n=>n.props?.className==='qibi-distill-title')[0].props.children,'固定作者')
      app.nodes(n=>n.type==='button'&&n.props.className==='qibi-author-btn active')[0].props.onClick();await app.settle()
      assert.equal(app.nodes(n=>n.props?.className==='qibi-distill-title')[0].props.children,'固定作者')
    }finally{app.unmount()}
  })
  await check('自动整理只在本作品启用后、面板状态变为已发布时触发', async()=>{
    let saved={id:11,novelId:1,title:'发布夹具',status:'草稿',content:'一盏蓝灯亮着。',wordCount:8,token:'saved0'}
    const organized=[],updates=[]
    const call=async(method,input)=>{
      if(method==='status')return{exists:true,writable:true,configWritable:true,user:{id:1},dbPath:'fixture/publish-db',counts:{novels:1}}
      if(method==='novels')return{novels:[{id:1,title:'自动整理夹具',chapterCount:1,wordCount:saved.wordCount}]}
      if(method==='chapters')return{chapters:[saved]}
      if(method==='chapter')return{chapter:{...saved}}
      if(method==='characters')return{characters:[]};if(method==='outline')return{outline:[]};if(method==='aiInfo')return{available:false};if(method==='select')return{}
      if(method==='updateChapter'){const becamePublished=saved.status!=='已发布'&&input.status==='已发布';saved={...saved,title:input.title,status:input.status};updates.push(input);return{chapter:{...saved},becamePublished}}
      if(method==='save'){saved={...saved,content:input.content,token:'saved1'};return{chapter:{...saved}}}
      if(method==='organizeContinuity'){organized.push(input);return{filled:3,foreshadowAdded:1,ledgerSkipped:false,alreadyOrganized:false}}
      throw Error(method)
    }
    const app=mount(panel.Workbench,{call,appearance:{open(){},name:'fixture'}})
    const editStatus=async value=>{
      app.nodes(n=>n.type==='button'&&n.props['aria-haspopup']==='menu')[0].props.onClick({stopPropagation(){}})
      await app.settle();app.button('edit').props.onClick();await app.settle()
      app.nodes(n=>n.type==='select'&&n.props.value===saved.status)[0].props.onChange({target:{value}});app.sync()
      const dialog=app.nodes(n=>n.type===panel.Dialog&&n.props.title==='chapterSettings')[0]
      dialog.props.footer.props.children.find(n=>n?.type==='button'&&n.props.children==='save').props.onClick()
      await app.settle()
    }
    try{
      await app.settle();assert.equal(app.nodes(n=>n.type===panel.ContinuityTab)[0].props.organizer.enabled,false)
      await editStatus('已发布');assert.equal(organized.length,0)
      app.nodes(n=>n.type===panel.ContinuityTab)[0].props.organizer.setAuto(true);await app.settle()
      await editStatus('草稿');assert.equal(organized.length,0)
      await editStatus('已发布');assert.equal(organized.length,1);assert.equal(organized[0].requirePublished,true);assert.equal(organized[0].expectedChapterToken,saved.token)
      assert.deepEqual(organized[0].scope,{dbPath:'fixture/publish-db',userId:1})
      await editStatus('已发布');assert.equal(organized.length,1)
      app.nodes(n=>n.props?.className==='qibi-editor')[0].props.onChange({target:{value:saved.content+' 新内容。'}});app.sync()
      app.nodes(n=>n.props?.className==='qibi-editor')[0].props.onBlur();await app.settle();assert.equal(organized.length,1,'普通自动保存不调用整理')
    }finally{app.unmount()}
  })
  await check('整理后的后台刷新保留本地摘要，更新未修改的全书记录', async()=>{
    let generation=0,summaryReads=0,writerReads=0
    const app=mount(panel.ContinuityTab,{novelId:1,chapterId:11,organizer:{refreshVersion:0},call:async method=>{
      if(method==='volumes')return{volumes:[]}
      if(method==='chapterSummary'){summaryReads++;return{summary:{exists:true,summary:generation?'AI摘要':'原摘要',keyEvents:'',cliffhanger:'',token:'summary'}}}
      if(method==='writerState'){writerReads++;return{writerState:{exists:true,progress:generation?'后台进度':'原进度',foreshadowing:'[]',token:'state'}}}
      throw Error(method)
    }})
    try{
      await app.settle();app.field('原摘要').props.onChange({target:{value:'尚未保存的手动摘要'}});app.sync()
      generation=1;app.props.organizer={refreshVersion:1};await app.settle()
      assert.ok(app.field('尚未保存的手动摘要'));assert.ok(app.field('后台进度'));assert.equal(summaryReads,1);assert.equal(writerReads,2)
    }finally{app.unmount()}
  })
  console.log(`PASS: ${passed} deferred-request QA checks; actual component callbacks, isolated state and fake failures only. Browser layout is not tested here.`)
}finally{
  for(const[key,descriptor]of Object.entries(originals)){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key]}
}
