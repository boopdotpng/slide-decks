import{_ as e,c as t,u as n}from"./viz.ZHEKlosV.js";import{n as r,t as i}from"./RnnCommon.ClUr7vCC.js";var a=[1,2,5,10,19];function o(){let{root:o,step:s,d:c}=e(`rnn_unroll`);if(!c)return n(`div`,{ref:o});let l=a[Math.min(s,a.length-1)],u=c.chars.map((e,t)=>c.chars[t+1]!==void 0&&c.top[t][0][0]===c.chars[t+1]);return n(`div`,{class:`ru`,ref:o,children:[n(`div`,{class:`grid`,style:{gridTemplateColumns:`auto repeat(${c.chars.length}, 1fr)`},children:[n(`div`,{class:`rl muted`,children:`guess`}),c.chars.map((e,t)=>n(`div`,{class:`g ${t<l?`on`:``} ${u[t]?`ok`:``}`,children:[n(r,{c:c.top[t][0][0]}),n(`span`,{class:`p`,children:[Math.round(c.top[t][0][1]*100),`%`]})]})),n(`div`,{class:`rl muted`,children:`memory`}),c.chars.map((e,r)=>n(`div`,{class:`h ${r<l?`on`:``}`,children:[n(t,{values:c.h[r],scale:1,vertical:!0,height:230,width:18}),r<c.chars.length-1&&n(`span`,{class:`to`,children:`→`})]})),n(`div`,{class:`rl muted`,children:`read`}),c.chars.map((e,t)=>n(`div`,{class:`x ${t<l?`on`:``} ${t===l-1?`cur`:``}`,children:n(r,{c:e})}))]}),n(`div`,{class:`cap muted fade ${s>=a.length-1?`on`:``}`,children:[`one strip of `,c.h[0].length,` numbers, rewritten after every character. it's all the rnn remembers`]}),n(`style`,{children:`
        ${i}
        .ru { font-size: .8em; }
        .ru .grid { display: grid; column-gap: .35em; row-gap: .5em; align-items: center; justify-items: center; }
        .ru .rl { font-size: .6em; justify-self: end; padding-right: .5em; }
        .ru .g, .ru .h, .ru .x { opacity: 0; transition: opacity .3s; }
        .ru .on { opacity: 1; }
        .ru .g { display: flex; flex-direction: column; align-items: center; font-size: .85em; line-height: 1.1; }
        .ru .g .p { font-size: .5em; color: var(--muted); }
        .ru .g.ok .ch { color: var(--good); }
        .ru .h { position: relative; }
        .ru .h .to { position: absolute; left: calc(100% + .02em); top: 50%; transform: translateY(-50%); color: var(--accent); font-size: .6em; }
        .ru .x { font-size: 1.1em; padding: 0 .15em; border-radius: 5px; }
        .ru .x.cur { background: var(--hl); }
        .ru .cap { margin-top: .9em; font-size: .75em; }
      `})]})}export{o as default};