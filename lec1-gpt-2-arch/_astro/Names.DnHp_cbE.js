import{_ as e,u as t}from"./viz.ZHEKlosV.js";import{r as n}from"./preact.module.Bl7PEaKa.js";import{t as r}from"./common.-pbhy8Ns.js";var i=[{plain:`the strip`,name:`residual stream`,code:`d_model = 768`},{plain:`three grids`,name:`projections`,code:`one weight: c_attn`,sub:[`q`,`k`,`v`].map((e,t)=>({...r[e],code:[`W_Q`,`W_K`,`W_V`][t]}))},{plain:`match + budget`,name:`attention pattern`,code:`q·k / √64 → mask → softmax`},{plain:`copy`,name:`weighted sum of values`,code:`probs @ v`},{plain:`the output grid`,name:`output projection`,code:`W_O · c_proj`},{plain:`add it on`,name:`residual add`,code:`x = x + attn`}];function a(){let{root:r,step:a}=e(`forward`);return t(`div`,{class:`nm`,ref:r,children:[t(`div`,{class:`head ${a>=2?`on`:``}`,children:[t(`div`,{class:`flow`,children:i.map((e,r)=>t(n,{children:[r>0&&t(`span`,{class:`ar`,children:`→`}),t(`div`,{class:`bx`,children:[t(`div`,{class:`pl`,children:e.plain}),e.sub&&t(`div`,{class:`subs`,children:e.sub.map(e=>t(`div`,{class:`sb`,style:{borderColor:e.color},children:[t(`span`,{class:`pl`,style:{color:e.color},children:e.plain}),t(`span`,{class:`nm2 fade ${a>=1?`on`:``}`,style:{color:e.color},children:[e.name,` `,t(`span`,{class:`cd`,children:e.code})]})]}))}),t(`div`,{class:`nm2 fade ${a>=1?`on`:``}`,children:e.name}),e.code&&t(`div`,{class:`cd fade ${a>=1?`on`:``}`,children:e.code})]})]}))}),t(`div`,{class:`hl fade ${a>=1?`on`:``}`,children:[`every "strip through a grid" is a `,t(`b`,{children:`matrix multiply`}),`, `,t(`code`,{children:`x @ W`}),`. the grey names are what the code and the papers call them`]}),t(`div`,{class:`hl fade ${a>=2?`on`:``}`,children:[`all of it, for one token: `,t(`b`,{children:`one attention head`})]})]}),t(`style`,{children:`
        .nm { font-size: .8em; }
        .nm .head { border: 2px dashed transparent; border-radius: 16px; padding: 1em; transition: border-color .4s; }
        .nm .head.on { border-color: var(--accent); }
        .nm .flow { display: flex; align-items: center; gap: .5em; }
        .nm .ar { color: var(--muted); }
        .nm .bx { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: .5em .7em;
          display: flex; flex-direction: column; gap: .3em; align-items: center; text-align: center; }
        .nm .pl { font-size: .6em; }
        .nm .nm2 { font-size: .58em; color: var(--accent); font-family: var(--mono); }
        .nm .subs { display: flex; flex-direction: column; gap: .3em; }
        .nm .sb { border-left: 4px solid; padding-left: .5em; display: flex; flex-direction: column; align-items: flex-start; }
        .nm .sb .pl { font-size: .55em; white-space: nowrap; }
        .nm .sb .nm2 { font-size: .55em; }
        .nm .cd { font-size: .5em; color: var(--muted); font-family: var(--mono); white-space: nowrap; }
        .nm .sb .nm2 .cd { font-size: 1em; margin-left: .3em; }
        .nm .hl code { font-family: var(--mono); color: var(--fg); }
        .nm .hl { margin-top: 1em; font-size: .7em; text-align: center; color: var(--muted); }
        .nm .hl b { color: var(--accent); }
      `})]})}export{a as default};