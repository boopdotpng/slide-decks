import{_ as e,i as t,u as n}from"./viz.ZHEKlosV.js";import{n as r,t as i}from"./RnnCommon.ClUr7vCC.js";function a(){let{root:a,step:o,d:s}=e(`rnn_task`);if(!s)return n(`div`,{ref:a});let c=Math.min(o,s.length-1),l=s[c];return n(`div`,{class:`rt`,ref:a,children:[n(`div`,{class:`ctxs`,children:s.map((e,t)=>n(`div`,{class:`ctx ${t===c?`on`:``} ${t>o?`hide`:``}`,children:[[...e.ctx].map(e=>n(r,{c:e})),n(`span`,{class:`q`,children:`?`})]}))}),n(`div`,{class:`out`,children:[n(`div`,{class:`lbl muted`,children:[`the rnn's guess for `,n(`span`,{class:`q`,children:`?`})]}),n(t,{values:l.top.map(e=>e[1]),labels:l.top.map(e=>n(r,{c:e[0]})),max:1,fmtV:e=>`${Math.round(e*100)}%`,width:340}),n(`div`,{class:`muted foot`,children:`top 5 of 65 characters. the other 60 share what's left`})]}),n(`style`,{children:`
        ${i}
        .rt { display: grid; grid-template-columns: 1.2fr 1fr; gap: 3em; align-items: center; }
        .rt .ctxs { display: flex; flex-direction: column; gap: .5em; font-size: .9em; }
        .rt .ctx { font-family: var(--mono); padding: .25em .5em; border-radius: 6px; opacity: .35; transition: opacity .3s, background .3s; }
        .rt .ctx.on { opacity: 1; background: var(--panel); }
        .rt .ctx.hide { opacity: 0; }
        .rt .q { color: var(--accent); font-family: var(--mono); font-weight: 700; }
        .rt .out { font-size: .8em; }
        .rt .out .bars { font-size: 1.15em; }
        .rt .lbl { margin-bottom: .5em; }
        .rt .foot { font-size: .7em; margin-top: .7em; }
      `})]})}export{a as default};