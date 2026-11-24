import{f as e,o as t,u as n}from"./roles.C1apZS_N.js";var r=`scores = q @ k.transpose(-1, -2)
scores = scores / math.sqrt(q.shape[-1])
weights = (scores + mask).softmax(axis=-1)
weights.realize()   # tinygrad runs work only when a result is needed`,i=[{t:`tensor expressions`,s:`what you write`},{t:`computation graph`,s:`operations and dependencies`},{t:`scheduling + lowering`,s:`divide and translate the work`},{t:`executable kernels`,s:`compiled numerical programs`},{t:`cpu or gpu`,s:`the chosen device`}],a=[[`q`,`q`,60,60,`in`],[`k`,`k`,60,160,`in`],[`mask`,`mask`,60,300,`in`],[`T`,`transpose`,200,160,`mv`],[`mul`,`× (pairs)`,340,110,`op`],[`sumd`,`sum over d`,480,110,`red`],[`sc`,`× 0.5  (÷ √4)`,640,110,`op`],[`add`,`+ mask`,340,300,`op`],[`max`,`max per row`,500,230,`red`],[`sub`,`− max`,640,300,`op`],[`exp`,`exp`,760,300,`op`],[`sum`,`sum per row`,880,230,`red`],[`div`,`÷ sum`,920,360,`op`]],o=[[`q`,`mul`],[`k`,`T`],[`T`,`mul`],[`mul`,`sumd`],[`sumd`,`sc`],[`sc`,`add`],[`mask`,`add`],[`add`,`max`],[`add`,`sub`],[`max`,`sub`],[`sub`,`exp`],[`exp`,`sum`],[`exp`,`div`],[`sum`,`div`]],s=[{name:`r_4_4_4`,what:`scores`,ops:[`load q, k`,`× pairs`,`sum over d`,`× 0.5`,`store scores`],line:`lines 1–2`},{name:`r_4_4`,what:`row max m`,ops:[`load scores, mask`,`+`,`max per row`,`store m`],line:`line 3`},{name:`r_4_4`,what:`row sum ℓ`,ops:[`load scores, mask, m`,`+`,`− m`,`exp`,`sum per row`,`store ℓ`],line:`line 3`},{name:`E_4_4`,what:`weights`,ops:[`load scores, mask, m, ℓ`,`+`,`− m`,`exp`,`÷ ℓ`,`store weights`],line:`line 3`}];function c({step:t}){let n=Object.fromEntries(a.map(([e,,t,n])=>[e,[t,n]]));return e(`svg`,{class:`dag`,viewBox:`0 0 1010 400`,children:[o.map(([t,r])=>{let[i,a]=n[t],[o,s]=n[r];return e(`path`,{class:`ge`,d:`M ${i+50} ${a} C ${i+90} ${a}, ${o-90} ${s}, ${o-56} ${s}`,"marker-end":`url(#ex-a)`})}),a.map(([,t,n,r,i])=>e(`g`,{class:`gn ${i}`,children:[e(`rect`,{x:n-56,y:r-20,width:`112`,height:`40`,rx:i===`in`?20:8}),e(`text`,{x:n,y:r+6,children:t})]})),e(`text`,{class:`gl`,x:200,y:210,children:`a view: no data moves`}),e(`text`,{class:`gl`,x:640,y:60,children:`= scores`}),e(`text`,{class:`gl`,x:920,y:410,children:`= weights`}),t===1&&e(`text`,{class:`gl b`,x:505,y:30,children:`built, not run: each op only records its inputs`}),e(`defs`,{children:e(`marker`,{id:`ex-a`,viewBox:`0 0 10 10`,refX:`9`,refY:`5`,markerWidth:`6`,markerHeight:`6`,orient:`auto`,children:e(`path`,{d:`M0 0 L10 5 L0 10 z`,class:`ah`})})})]})}function l(){let{root:a,step:o,d:l}=t(`kernels`),u=Math.min(o,4),d=l?.scores[0]?.src??``,f=l?.weights??[],p=(e,t)=>e.split(`
`).find(e=>t.test(e))?.trim()??``,m=[e(`div`,{class:`v0`,children:[e(n,{lang:`py`,code:r,hl:o===0?[0,1,2]:[]}),e(`p`,{children:[`in tinygrad these lines are `,e(`b`,{children:`lazy`}),`: each one adds to a graph. nothing is computed until a result is needed (`,e(`code`,{children:`realize()`}),`, `,e(`code`,{children:`.numpy()`}),`, `,e(`code`,{children:`.item()`}),`…)`]}),e(`p`,{class:`mut`,children:`run here on a tiny example so the generated code fits: q, k of shape (1, 4, 4), so d = 4 and the scale is ÷ √4`})]}),e(c,{step:1}),e(`div`,{class:`v2`,children:[s.map((t,n)=>e(`div`,{class:`kb k${n}`,children:[e(`div`,{class:`kh`,children:[e(`code`,{children:t.name}),e(`span`,{children:[`→ `,t.what]}),e(`em`,{children:t.line})]}),e(`div`,{class:`ops`,children:t.ops.map(t=>e(`span`,{children:t}))})]})),e(`p`,{children:[`the scheduler cut the graph into `,e(`b`,{children:`4 kernels`}),`. the transpose became an index pattern; `,e(`code`,{children:`+ mask`}),` and `,e(`code`,{children:`exp`}),` are recomputed inside the kernels that need them instead of being stored`]})]}),e(`div`,{class:`v3`,children:[e(`div`,{class:`ksrc`,children:[e(`div`,{class:`sh`,children:[e(`code`,{children:`r_4_4_4`}),`: lines 1–2 as one C function, as tinygrad generated it`]}),e(n,{lang:`c`,code:d,hl:[2,4,6,7,8,9,11]})]}),e(`div`,{class:`ann`,children:[e(`p`,{children:[e(`b`,{children:`loops`}),`: row `,e(`code`,{children:`Lidx1`}),`, column `,e(`code`,{children:`Lidx2`}),`, and the reduction `,e(`code`,{children:`Ridx0`}),` over d`]}),e(`p`,{children:[e(`b`,{children:`multiply-add`}),` into `,e(`code`,{children:`buf0`}),`: the dot product`]}),e(`p`,{children:[e(`code`,{children:`* 0.5f`}),`: line 2's `,e(`code`,{children:`/ math.sqrt(4)`}),`, folded into the same loop`]}),e(`p`,{class:`sm`,children:`line 3's kernels, key line of each:`}),f.map((t,n)=>e(`p`,{class:`kl`,children:[e(`code`,{children:t.name}),` `,e(`span`,{children:[`row max of scores + mask`,`Σ exp(s + mask − m)`,`exp(s + mask − m) / ℓ`][n]}),e(`br`,{}),e(`code`,{class:`raw`,children:p(t.src,[/alu3 =/,/\*1\.44/,/\/val1\)/][n]).slice(0,64)})]}))]})]}),e(`div`,{class:`v4`,children:[e(`div`,{class:`dev on`,children:[e(`div`,{class:`dh`,children:`CPU · this lab`}),e(`div`,{children:[`the CPU backend writes C for each kernel, `,e(`b`,{children:`clang`}),` compiles it, and the program calls it. this run launched:`]}),e(`div`,{class:`launch`,children:[...l?.scores??[],...f].map(t=>e(`code`,{children:t.name}))}),e(`div`,{class:`mut`,children:`4 kernels for 3 lines. that's why setup checks for clang`})]}),e(`div`,{class:`dev`,children:[e(`div`,{class:`dh`,children:`GPU`}),e(`div`,{children:`the same graph and schedule; a different code generator emits GPU code (CUDA, Metal, …) and the runtime launches it on the device`}),e(`div`,{class:`mut`,children:`many threads per kernel: slide 3's concerns`})]})]}),e(`div`,{class:`v5`,children:e(`div`,{class:`cmp`,children:[e(`div`,{class:`ch`,children:`tinygrad`}),e(`div`,{class:`ch`,children:`PyTorch, eager (default)`}),e(`div`,{children:`builds a lazy graph, schedules it into kernels, generates code, runs it`}),e(`div`,{children:[`runs each operation as Python reaches it: `,e(`code`,{children:`@`}),`, `,e(`code`,{children:`/`}),`, `,e(`code`,{children:`+`}),`, `,e(`code`,{children:`softmax`}),` each dispatch to an existing implementation for that device`]}),e(`div`,{class:`mut`,children:`fusion is the default: lines 1–2 → 1 kernel`}),e(`div`,{class:`mut`,children:[`optional `,e(`code`,{children:`torch.compile`}),` captures a larger region and can compile it into fused kernels`]})]})})];return e(`div`,{class:`ex`,ref:a,children:[e(`div`,{class:`xin`,children:[e(`div`,{class:`card pipe`,children:[e(`div`,{class:`kick`,children:`execution pipeline`}),i.map((t,n)=>e(`div`,{class:`ps ${n===u&&o<5?`on`:``} ${n<u||o===5?`done`:``} ${n>=3?`late`:``}`,children:[e(`span`,{class:`n`,children:n+1}),e(`div`,{children:[e(`div`,{class:`t`,children:t.t}),e(`div`,{class:`s`,children:t.s})]})]}))]}),e(`div`,{class:`main`,children:[e(`div`,{class:`card view`,children:m[o]??m[0]}),e(`div`,{class:`row`,children:[e(`div`,{class:`card bar-a fw ${o>=1&&o<=4?`on`:``}`,children:[e(`b`,{children:`tinygrad`}),` builds a lazy graph, schedules work, generates code, and executes it`]}),e(`div`,{class:`card bar-n fw ${o===5?`on`:``}`,children:[e(`b`,{children:`PyTorch`}),`: eager operations dispatch to implementations; optional compilation can optimize larger regions`]})]}),e(`div`,{class:`row`,children:[e(`div`,{class:`card call ${o>=2?`on`:``}`,children:[`one Python line need not mean one kernel: `,e(`b`,{children:`2 lines → 1 kernel`}),`, `,e(`b`,{children:`1 line → 3 kernels`})]}),e(`div`,{class:`card call2 ${o>=4?`on`:``}`,children:[`our first lab device is `,e(`b`,{children:`CPU`}),`. the tensor mathematics stays the same`]})]})]})]}),e(`style`,{children:`
        .ex { flex: 1; min-height: 0; }
        .ex .xin { display: grid; grid-template-columns: 340px 1fr; gap: .7em; height: 100%; font-size: .6em; }
        .ex .pipe { display: flex; flex-direction: column; gap: .45em; padding: .5em .6em; }
        .ex .ps { display: flex; gap: .6em; align-items: center; padding: .4em .6em; border-radius: 8px; opacity: .55; transition: all .3s; }
        .ex .ps.done { opacity: .85; }
        .ex .ps.on { opacity: 1; background: color-mix(in srgb, var(--accent) 14%, transparent); }
        .ex .ps.late.on { background: color-mix(in srgb, var(--hot) 14%, transparent); }
        .ex .ps .n { flex: none; width: 1.2em; font-family: var(--mono); font-weight: 700; color: var(--accent); }
        .ex .ps.late .n { color: var(--hot); }
        .ex .ps .t { font-weight: 700; color: var(--accent); font-size: .92em; }
        .ex .ps.late .t { color: var(--hot); }
        .ex .ps .s { font-size: .78em; color: var(--muted); }
        .ex .main { display: flex; flex-direction: column; gap: .45em; min-height: 0; }
        .ex .view { flex: 1; min-height: 0; padding: .5em .8em; display: flex; flex-direction: column; justify-content: safe center; overflow: hidden; }
        .ex .row { display: grid; grid-template-columns: 1fr 1fr; gap: .6em; }
        .ex .fw { font-size: .82em; color: var(--muted); opacity: .7; transition: all .3s; }
        .ex .fw.on { opacity: 1; color: var(--fg); }
        .ex .fw b { color: var(--fg); }
        .ex .call, .ex .call2 { font-size: .85em; text-align: center; opacity: .3; transition: opacity .3s; }
        .ex .call { color: var(--hot); }
        .ex .call b { color: var(--hot); }
        .ex .call.on, .ex .call2.on { opacity: 1; }
        .ex p { margin: .4em 0; }
        .ex p b, .ex .v4 b { color: var(--fg); }
        .ex .v0 pre { font-size: .95em; }
        .ex .dag { width: 100%; height: 100%; max-height: 430px; overflow: visible; }
        .ex .gn rect { fill: var(--sunken); stroke: var(--line-2); stroke-width: 2; }
        .ex .gn.in rect { fill: color-mix(in srgb, var(--accent) 12%, var(--sunken)); stroke: var(--accent); }
        .ex .gn.red rect { stroke: var(--hot); }
        .ex .gn.mv rect { stroke-dasharray: 5 4; }
        .ex .gn text { font-family: var(--mono); font-size: 16px; fill: var(--fg); text-anchor: middle; }
        .ex .ge { fill: none; stroke: var(--faint); stroke-width: 2; }
        .ex .ah { fill: var(--faint); }
        .ex .gl { font-size: 16px; fill: var(--muted); text-anchor: middle; }
        .ex .gl.b { fill: var(--accent); font-size: 18px; }
        .ex .v2 { display: flex; flex-direction: column; gap: .35em; }
        .ex .kb { border-left: 3px solid var(--border); padding: .2em .7em; }
        .ex .kb.k0 { border-color: var(--accent); } .ex .kb.k1, .ex .kb.k2, .ex .kb.k3 { border-color: color-mix(in srgb, var(--hot) 60%, transparent); }
        .ex .kh { display: flex; gap: .7em; align-items: baseline; }
        .ex .kh code { font-weight: 700; }
        .ex .kh em { margin-left: auto; font-style: normal; font-size: .8em; color: var(--muted); }
        .ex .ops { display: flex; flex-wrap: wrap; gap: .3em; margin-top: .2em; }
        .ex .ops span { font-family: var(--mono); font-size: .72em; padding: .05em .45em; border-radius: 6px; background: var(--surface); }
        .ex .v3 { display: grid; grid-template-columns: 1.25fr 1fr; gap: .8em; align-items: start; }
        .ex .v3 .sh { font-size: .8em; color: var(--muted); margin-bottom: .2em; }
        .ex .v3 pre { font-size: .58em; margin: 0; }
        .ex .v3 .ann { font-size: .78em; }
        .ex .v3 .ann p { margin: .25em 0; }
        .ex .v3 .sm { color: var(--muted); margin-top: .8em; }
        .ex .v3 .kl { font-size: .9em; } .ex .v3 .kl span { color: var(--muted); }
        .ex .v3 .raw { font-size: .7em; color: var(--muted); }
        .ex .v4 { display: grid; grid-template-columns: 1fr 1fr; gap: .8em; }
        .ex .dev { border: 2px solid var(--border); border-radius: 12px; padding: .6em .8em; display: flex; flex-direction: column; gap: .4em; }
        .ex .dev.on { border-color: var(--hot); background: color-mix(in srgb, var(--hot) 6%, var(--sunken)); }
        .ex .dh { font-weight: 700; color: var(--hot); }
        .ex .launch { display: flex; gap: .4em; flex-wrap: wrap; }
        .ex .mut { color: var(--muted); font-size: .9em; }
        .ex .cmp { display: grid; grid-template-columns: 1fr 1fr; gap: .5em 1.2em; }
        .ex .cmp .ch { font-weight: 700; border-bottom: 2px solid var(--border); padding-bottom: .2em; }
      `})]})}export{l as default};