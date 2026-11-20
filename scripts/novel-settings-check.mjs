// Actual form callbacks and deferred Host adapters. These checks do not measure browser layout.
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { loadPanel } from './render-check.mjs'
import { novelForm, novelFormDirty, novelPayload } from '../src/novel-settings.js'
const { Workbench, Dialog, NovelSettingsFields } = await loadPanel()
const tick = () => new Promise(resolve => setImmediate(resolve))
const deferred = () => { let resolve,reject; const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return{promise,resolve,reject} }
const original=Object.fromEntries(['window','document','localStorage','setTimeout','clearTimeout','setInterval','clearInterval'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]))
let allowDiscard=true, confirmations=0
const noop=()=>{}
globalThis.window={addEventListener:noop,removeEventListener:noop,confirm(){confirmations++;return allowDiscard}}
globalThis.document={visibilityState:'visible',activeElement:null}
globalThis.localStorage={getItem:()=>null,setItem:noop}
globalThis.setTimeout=()=>1;globalThis.setInterval=()=>1;globalThis.clearTimeout=noop;globalThis.clearInterval=noop
let passed=0
const t=key=>key
function mount(Component, props, elements) {
  const slots=[];let cursor=0,dirty=false,pending=[],tree
  const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]))
  const dispatch={
    useState(value){const i=cursor++;if(!slots[i])slots[i]={value:typeof value==='function'?value():value};return[slots[i].value,next=>{const result=typeof next==='function'?next(slots[i].value):next;if(!Object.is(result,slots[i].value)){slots[i].value=result;dirty=true}}]},
    useRef(value){return slots[cursor++]??={current:value}},useId(){return`settings-${cursor++}`},
    useMemo(fn,deps){const i=cursor++;if(!same(slots[i]?.deps,deps))slots[i]={deps,value:fn()};return slots[i].value},
    useCallback(fn,deps){return this.useMemo(()=>fn,deps)},
    useEffect(effect,deps){const i=cursor++;if(!same(slots[i]?.deps,deps)){pending.push({i,effect});slots[i]={deps,cleanup:slots[i]?.cleanup}}},
  }
  function* walk(node){if(Array.isArray(node)){for(const row of node)yield*walk(row)}else if(node&&typeof node==='object'){yield node;yield*walk(node.props?.children)}}
  const text=node=>Array.isArray(node)?node.map(text).join(''):node==null||typeof node==='boolean'?'':typeof node==='object'?text(node.props?.children):String(node)
  const nodes=test=>[...walk(tree)].filter(test)
  const sync=()=>{for(let n=0;n<25;n++){cursor=0;dirty=false;pending=[];const holder=React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher;const old=holder.current;holder.current=dispatch;try{tree=Component(props)}finally{holder.current=old}if(elements)for(const node of walk(tree))if(node.ref&&elements(node))node.ref.current=elements(node);const effects=pending;for(const row of effects)slots[row.i].cleanup?.();for(const row of effects)slots[row.i].cleanup=row.effect();if(!dirty)return}throw Error('Unsettled state')}
  const settle=async()=>{for(let i=0;i<5;i++){sync();await tick()}sync()}
  sync();return{nodes,props,sync,settle,button:key=>nodes(n=>n.type==='button'&&text(n)===key)[0],unmount(){for(const slot of slots)slot?.cleanup?.()}}
}
async function check(name,fn){await fn();passed++;console.log(`ok ${passed} - ${name}`)}
try{
  const base={id:1,title:'原始作品',author:'署名',genre:'自定义类型',status:'准备修订',intro:'原始简介',chapterCount:2,wordCount:123}
  await check('字段规范化、脏稿比较和自定义状态不被覆盖',async()=>{
    assert.deepEqual(novelForm(base),{title:base.title,author:base.author,genre:base.genre,status:base.status,intro:base.intro})
    assert.equal(novelFormDirty(base,{...base}),false);assert.equal(novelFormDirty({...base,intro:'不同'},base),true)
    const payload=novelPayload({...base,title:'  新书名  ',unknown:'discard'})
    assert.equal(payload.title,'新书名');assert.equal(payload.status,'准备修订');assert.equal(payload.unknown,undefined)
    assert.deepEqual(novelPayload({ ...base, intro: '只改简介' }, base), { intro: '只改简介' })
    assert.deepEqual(novelPayload(base, base), {})
  })
  await check('作品设置有分组、必填提示、简介计数、独立危险区和只读门禁',async()=>{
    const form=novelForm(base)
    const html=renderToStaticMarkup(React.createElement(NovelSettingsFields,{form,initial:base,formId:'fixture',mode:'edit',writable:true,busy:false,error:'',onField:noop,onSubmit:noop,onDelete:noop,t}))
    for(const text of ['novelBasicSection','novelIntroSection','novelDangerSection','novelDeleteAction','list=','原始作品','准备修订','<details','name="intro"','rows="7"'])assert.ok(html.includes(text),text)
    let writes=0
    const app=mount(NovelSettingsFields,{form,initial:base,formId:'fixture',mode:'edit',writable:false,busy:false,error:'',onField:()=>writes++,onSubmit:()=>writes++,onDelete:()=>writes++,t})
    try{app.nodes(n=>n.props?.name==='title')[0].props.onChange({target:{value:'不能写'}});app.nodes(n=>n.type==='form')[0].props.onSubmit({preventDefault:noop});await app.button('novelDeleteAction').props.onClick();assert.equal(writes,0)}finally{app.unmount()}
  })
  let gate,updateCount=0,rejectRefresh=false,listReads=0
  const call=async(method,input)=>{
    if(method==='status')return{exists:true,writable:true,configWritable:true,user:{id:1},dbPath:'fixture/db',counts:{novels:1}}
    if(method==='novels'){listReads++;if(rejectRefresh&&listReads>1)throw Error('fixture refresh failed');return{novels:[base]}}
    if(method==='chapters')return{chapters:[]};if(method==='characters')return{characters:[]};if(method==='outline')return{outline:[]};if(method==='aiInfo')return{available:false}
    if(method==='updateNovel'){updateCount++;assert.equal(input.novelId,1);assert.equal(Object.hasOwn(input,'genre'),false);assert.equal(Object.hasOwn(input,'status'),false);return gate.promise}
    throw Error('Unexpected '+method)
  }
  await check('修改取消需确认，必填错误在表单内，未知值保留',async()=>{
    const app=mount(Workbench,{call,t,appearance:{open:noop,name:'fixture'}})
    try{
      await app.settle();app.button('novelSettings').props.onClick();app.sync()
      let fields=app.nodes(n=>n.type===NovelSettingsFields)[0]
      fields.props.onField('title','');app.sync();await app.nodes(n=>n.type===NovelSettingsFields)[0].props.onSubmit();await app.settle()
      assert.equal(app.nodes(n=>n.type===NovelSettingsFields)[0].props.error,'novelNameRequired');assert.equal(updateCount,0)
      allowDiscard=false;app.nodes(n=>n.type===Dialog)[0].props.onClose();await app.settle();assert.equal(app.nodes(n=>n.type===NovelSettingsFields).length,1)
      allowDiscard=true;app.nodes(n=>n.type===Dialog)[0].props.onClose();await app.settle();assert.equal(app.nodes(n=>n.type===NovelSettingsFields).length,0);assert.ok(confirmations>=2)
    }finally{app.unmount()}
  })
  await check('保存期间锁定，双击只发一个请求；失败保留编辑可重试',async()=>{
    listReads=0;gate=deferred();const app=mount(Workbench,{call,t,appearance:{open:noop,name:'fixture'}})
    try{
      await app.settle();app.button('novelSettings').props.onClick();app.sync();app.nodes(n=>n.type===NovelSettingsFields)[0].props.onField('intro','修改简介');app.sync()
      const fields=app.nodes(n=>n.type===NovelSettingsFields)[0];const a=fields.props.onSubmit();const b=fields.props.onSubmit();await app.settle();assert.equal(updateCount,1);assert.equal(app.nodes(n=>n.type===Dialog)[0].props.busy,true)
      app.nodes(n=>n.type===Dialog)[0].props.onClose();await app.settle();assert.equal(app.nodes(n=>n.type===NovelSettingsFields).length,1)
      gate.reject(Error('fixture save failed'));await a;await b;await app.settle();assert.equal(app.nodes(n=>n.type===NovelSettingsFields)[0].props.form.intro,'修改简介');assert.equal(app.nodes(n=>n.type===NovelSettingsFields)[0].props.error,'fixture save failed')
      gate=deferred();const retry=app.nodes(n=>n.type===NovelSettingsFields)[0].props.onSubmit();await app.settle();gate.resolve({novel:base});await retry;await app.settle();assert.equal(updateCount,2);assert.equal(app.nodes(n=>n.type===NovelSettingsFields).length,0)
    }finally{app.unmount()}
  })
  await check('保存成功但列表刷新失败不会把已提交表单留下诱发重复保存',async()=>{
    listReads=0;rejectRefresh=true;gate=deferred();const app=mount(Workbench,{call,t,appearance:{open:noop,name:'fixture'}})
    try{await app.settle();app.button('novelSettings').props.onClick();app.sync();app.nodes(n=>n.type===NovelSettingsFields)[0].props.onField('intro','再次修改');app.sync();const task=app.nodes(n=>n.type===NovelSettingsFields)[0].props.onSubmit();await app.settle();gate.resolve({novel:base});await task;await app.settle();assert.equal(app.nodes(n=>n.type===NovelSettingsFields).length,0)}finally{app.unmount();rejectRefresh=false}
  })
  await check('作品弹窗的危险区标题参与Tab顺序，底部按钮仍可达', async()=>{
    let keydown, prevented=0
    const previousDocument=globalThis.document
    const control=name=>({name,isConnected:true,focus(){document.activeElement=this},matches:()=>false,getClientRects:()=>[{}]})
    const first=control('close'),summary=control('summary'),last=control('save'),trigger=control('trigger')
    const element={focus(){document.activeElement=this},querySelectorAll(selector){return selector.includes('summary')?[first,summary,last]:[first,last]}}
    globalThis.document={activeElement:trigger,addEventListener(name,fn){if(name==='keydown')keydown=fn},removeEventListener:noop}
    const app=mount(Dialog,{title:'设置',busy:false,onClose:noop,children:null,footer:null},node=>node.props?.role==='dialog'?element:null)
    try{
      document.activeElement=summary;keydown({key:'Tab',shiftKey:false,preventDefault(){prevented++}})
      assert.equal(prevented,0);assert.equal(document.activeElement,summary)
      document.activeElement=last;keydown({key:'Tab',shiftKey:false,preventDefault(){prevented++}})
      assert.equal(prevented,1);assert.equal(document.activeElement,first)
    }finally{app.unmount();globalThis.document=previousDocument}
  })
  console.log(`PASS: ${passed} novel settings checks; offline form callbacks and fake Host only, no visual/browser claims.`)
}finally{for(const[key,value]of Object.entries(original)){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key]}}
