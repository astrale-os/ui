import{i as e,t}from"./jsx-runtime-Cx0BB4qO.js";import{t as n}from"./react-3BKWdGy3.js";import{t as r}from"./check-BAQzfXtB.js";import{t as i}from"./copy-2haWNx80.js";import{d as a,f as o,m as s,p as c,ut as l,v as u,y as d}from"./index-BMFGxOWo.js";import{t as f}from"./bundle-full-B-EP95ax.js";var p=e(n()),m=t();function h(e){let t=e.match(/<code[^>]*>([\s\S]*?)<\/code>/);if(!t)return[e];let n=t[1].split(`
`);return n[n.length-1]===``&&n.pop(),n}async function g(e,t=`tsx`){try{return await f(e,{lang:t,themes:{light:`github-light`,dark:`github-dark`}})}catch{return`<pre><code>${e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}</code></pre>`}}function _({code:e,className:t,...n}){let[a,o]=p.useState(!1),s=p.useCallback(()=>{if(typeof navigator>`u`)return;let t=e=>(o(!0),setTimeout(()=>o(!1),1500),e);navigator.clipboard&&typeof window<`u`&&window.isSecureContext?navigator.clipboard.writeText(e).then(()=>t(e)).catch(()=>{v(e),t(e)}):(v(e),t(e))},[e]);return(0,m.jsx)(`button`,{"data-slot":`code-block-copy`,"aria-label":a?`Copied`:`Copy code`,onClick:s,className:l(`text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-md p-1.5 transition-colors`,t),...n,children:a?(0,m.jsx)(r,{className:`size-3.5`}):(0,m.jsx)(i,{className:`size-3.5`})})}function v(e){let t=document.createElement(`textarea`);t.value=e,t.style.cssText=`position:fixed;top:-9999px;left:-9999px`,document.body.appendChild(t),t.focus(),t.select();try{document.execCommand(`copy`)}finally{document.body.removeChild(t)}}function y({code:e,language:t=`tsx`,showCopy:n=!0,className:r,style:i,highlightLines:a,highlightClassName:o=`bg-amber-600/40 dark:bg-amber-400/40`,showLineNumbers:s=!1}){let[c,f]=p.useState(``);p.useEffect(()=>{let n=!1;return g(e,t).then(e=>{n||f(e)}),()=>{n=!0}},[e,t]);let v=a&&a.length>0||s,y=p.useMemo(()=>c?h(c):[],[c]);return(0,m.jsx)(`div`,{"data-slot":`code-block-pane`,className:l(``,r),style:i,children:(0,m.jsxs)(u,{className:`max-h-43.75 *:data-[slot=scroll-area-viewport]:h-auto! *:data-[slot=scroll-area-viewport]:max-h-43.75`,children:[n&&(0,m.jsx)(_,{code:e,className:`absolute top-2 right-2 z-10`}),c?v?(0,m.jsxs)(m.Fragment,{children:[(0,m.jsx)(`pre`,{className:`shiki bg-transparent! p-0 font-mono text-sm leading-relaxed`,children:(0,m.jsx)(`code`,{className:`block w-max min-w-full`,children:y.map((e,t)=>{let n=t+1,r=a?.includes(n)??!1;return(0,m.jsxs)(`div`,{className:l(`flex items-stretch px-4 py-[0.5px]`,r&&o),children:[s&&(0,m.jsx)(`span`,{className:`text-muted-foreground/50 mr-4 w-4 shrink-0 text-right font-mono text-xs leading-relaxed select-none`,children:n}),(0,m.jsx)(`span`,{className:`flex-1`,dangerouslySetInnerHTML:{__html:e||`&nbsp;`}})]},t)})})}),(0,m.jsx)(d,{orientation:`horizontal`})]}):(0,m.jsxs)(m.Fragment,{children:[(0,m.jsx)(`div`,{className:l(`[&>pre]:p-4 [&>pre]:text-sm [&>pre]:leading-relaxed`,`[&>pre]:bg-transparent! [&>pre]:font-mono [&>pre]:whitespace-pre`),dangerouslySetInnerHTML:{__html:c}}),(0,m.jsx)(d,{orientation:`horizontal`})]}):(0,m.jsx)(`pre`,{className:`p-4 font-mono text-sm leading-relaxed opacity-0`,children:e})]})})}function b({code:e,language:t=`tsx`,filename:n,files:r,className:i,panelClassName:o,paneStyle:u,highlightLines:d,highlightClassName:f,showLineNumbers:h,...g}){let v=p.useMemo(()=>r&&r.length>0?r:e===void 0?[]:[{filename:n?`${n}.${t}`:`index.${t}`,code:e,language:t,panelClassName:o,paneStyle:u,highlightLines:d,highlightClassName:f,showLineNumbers:h}],[r,e,t,n,o,u,d,f,h]),b=v.length>1,[x,S]=p.useState(v[0]?.filename??``);p.useEffect(()=>{v.length>0&&!v.some(e=>e.filename===x)&&S(v[0].filename)},[v,x]);let C=v.find(e=>e.filename===x)??v[0];return v.length===0?null:(0,m.jsxs)(`div`,{"data-slot":`code-block`,className:l(`bg-muted/50 border-border overflow-hidden rounded-xl border text-sm`,i),...g,children:[(0,m.jsxs)(`div`,{"data-slot":`code-block-header`,className:`border-border flex items-center justify-between gap-2 border-b`,children:[b?(0,m.jsx)(a,{value:x,onValueChange:S,className:`flex-1`,children:(0,m.jsx)(c,{variant:`line`,className:`group-data-horizontal/tabs:h-auto`,children:v.map(e=>(0,m.jsx)(s,{value:e.filename,className:`h-auto px-3 py-2 text-xs font-medium`,children:e.filename},e.filename))})}):(0,m.jsx)(`span`,{"data-slot":`code-block-filename`,className:`text-muted-foreground px-3 py-2 text-xs font-medium`,children:v[0].filename}),C&&(0,m.jsx)(_,{code:C.code,className:`mr-1 shrink-0`})]}),C&&(0,m.jsx)(y,{code:C.code,language:C.language,showCopy:!1,className:C.panelClassName,style:C.paneStyle,highlightLines:C.highlightLines,highlightClassName:C.highlightClassName,showLineNumbers:C.showLineNumbers},C.filename)]})}var x=[{label:`JavaScript`,value:`js`,filename:`todo-list`,language:`javascript`,code:`class TodoList {
  constructor() {
    this.todos = [];
  }

  add(task) {
    this.todos.push({ task, done: false });
  }

  toggle(index) {
    if (this.todos[index]) {
      this.todos[index].done = !this.todos[index].done;
    }
  }

  list() {
    return this.todos;
  }
}

const myTodos = new TodoList();
myTodos.add("Build code block component");
myTodos.add("Style it nicely");
myTodos.toggle(0);

console.log(myTodos.list());`},{label:`Python`,value:`py`,filename:`dice-roll`,language:`python`,code:`import random
from datetime import datetime

def roll_dice(times=5):
    results = [random.randint(1, 6) for _ in range(times)]
    return results, sum(results)

rolls, total = roll_dice(4)

print("Rolls:", rolls)
print("Total:", total)
print("Timestamp:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))`},{label:`React`,value:`tsx`,filename:`counter-card`,language:`tsx`,code:`import { useState } from "react";

export default function CounterCard() {
  const [count, setCount] = useState(0);

  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);

  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <h2>Simple Counter</h2>
      <p style={{ fontSize: 24 }}>{count}</p>
      <button onClick={decrement}>-</button>
      <button onClick={increment} style={{ marginLeft: 10 }}>+</button>
    </div>
  );
}`}],S=()=>(0,m.jsxs)(a,{defaultValue:`js`,className:`w-full max-w-xl`,children:[(0,m.jsx)(c,{className:`w-full justify-start`,children:x.map(e=>(0,m.jsx)(s,{value:e.value,children:e.label},e.value))}),x.map(e=>(0,m.jsx)(o,{value:e.value,children:(0,m.jsx)(b,{files:[{filename:`${e.filename}.${e.value}`,code:e.code,language:e.language,showLineNumbers:!0}]})},e.value))]}),C={source:`@astrale-os/ui`};export{S as default,C as preview};