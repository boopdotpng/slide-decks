import{_ as e,a as t,c as n,d as r,l as i,u as a}from"./viz.ZHEKlosV.js";import{n as o,t as s}from"./common.-pbhy8Ns.js";var c=12,l=52,u=300;function d(){let{root:d,step:f,d:p}=e(`forward`);if(!p)return a(`div`,{ref:d});let m=p.focus[1],h=p.toks.length,g=f>=3,_=p.ln1[h-1],v=p.q_all[h-1],y=p.c_attn_img;return a(`div`,{class:`gl3`,ref:d,children:[a(`div`,{class:`one ${g?`gone`:``}`,children:[a(`div`,{class:`x`,children:[a(`div`,{class:`lbl`,children:a(i,{t:p.toks[h-1]})}),a(n,{values:_,vertical:!0,height:u,width:22,label:`strip`}),a(`div`,{class:`lbl`,children:`768`})]}),a(`span`,{class:`op op1`,children:`·`}),a(`div`,{class:`grids`,children:Array.from({length:c},(e,t)=>a(`div`,{class:`g ${t===m||f>=1?`on`:``}`,style:{background:o(t,m),transitionDelay:`${Math.abs(t-m)*50}ms`},children:a(`span`,{children:t===m?`ours`:``})}))}),a(`span`,{class:`op op2 ${r(f,2)}`,children:`=`}),a(`div`,{class:`outs ${r(f,2)}`,children:[a(n,{values:v,height:26,label:`looking for, all heads`}),a(`div`,{class:`cuts`,children:Array.from({length:c},(e,t)=>a(`div`,{class:`o ${t===m?`ours`:``}`,style:{borderColor:o(t,m)}}))})]}),a(`div`,{class:`lbl wide`,children:[`head ${m}'s grid: 768 tall, 64 wide`,`twelve heads side by side: one grid, 768 × 768. every head reads all 768 rows; each writes its own 64 columns`,`the output, 768 wide, cut every 64: piece ${m} is exactly what our head made alone. 12 × 64 = 768`][Math.min(f,2)]})]}),a(`div`,{class:`real ${r(f,3)}`,children:[a(t,{m:y,w:900,h:300,children:[[`q`,`k`,`v`].map((e,t)=>a(`div`,{class:`third`,style:{left:`${t/3*100}%`,borderColor:s[e].color},children:a(`span`,{style:{color:s[e].color},children:s[e].name})})),Array.from({length:36},(e,t)=>t%c>0&&a(`div`,{class:`cut`,style:{left:`${t/36*100}%`}})),Array.from({length:3},(e,t)=>a(`div`,{class:`ours`,style:{left:`${(t*c+m)/36*100}%`,width:`${100/36}%`},children:a(`span`,{children:[`head `,m]})}))]}),a(`div`,{class:`lbl wide`,children:`what's actually stored: all three, glued again. 768 × 2304, one multiply for all 36 grids. head h is columns 64h … 64h+63 of each third`})]}),a(`style`,{children:`
        .gl3 { position: relative; font-size: .8em; min-height: 440px; }
        .gl3 .one { display: grid; grid-template-columns: auto auto auto; grid-template-rows: auto auto auto; gap: .6em 1em; align-items: center; justify-content: center; transition: opacity .4s; }
        .gl3 .one.gone { opacity: 0; }
        .gl3 .x { display: flex; flex-direction: column; align-items: center; gap: .3em; grid-column: 1; grid-row: 1; }
        .gl3 .op { font-size: 1.4em; color: var(--muted); }
        .gl3 .op1 { grid-column: 2; grid-row: 1; }
        .gl3 .op2 { grid-column: 2; grid-row: 2; }
        .gl3 .grids { display: flex; gap: 3px; height: ${u}px; grid-column: 3; grid-row: 1; }
        .gl3 .g { width: ${l}px; border-radius: 3px; opacity: 0; transform: translateY(-30px); transition: opacity .4s, transform .5s;
          display: flex; align-items: flex-end; justify-content: center; }
        .gl3 .g.on { opacity: .85; transform: none; }
        .gl3 .g span { font-size: .5em; color: var(--on-color); padding-bottom: .4em; }
        .gl3 .outs { grid-column: 3; grid-row: 2; width: 657px; }
        .gl3 .cuts { display: flex; gap: 3px; margin-top: 3px; }
        .gl3 .o { width: ${l}px; height: 8px; border-bottom: 4px solid; }
        .gl3 .o.ours { height: 12px; }
        .gl3 .lbl { font-size: .5em; white-space: nowrap; }
        .gl3 .lbl.wide { grid-column: 1 / -1; grid-row: 3; text-align: center; font-size: .6em; color: var(--muted); }
        .gl3 .real { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; gap: 1.6em; }
        .gl3 .third { position: absolute; top: -4px; bottom: -4px; width: 33.33%; border: 3px solid; border-radius: 4px; }
        .gl3 .third span { position: absolute; top: -1.6em; left: 0; font: .55em var(--mono); }
        .gl3 .cut { position: absolute; top: 0; bottom: 0; width: 1px; background: color-mix(in srgb, var(--fg) 35%, transparent); }
        .gl3 .real .ours { position: absolute; top: -4px; bottom: -4px; outline: 2px solid var(--accent); border-radius: 2px; }
        .gl3 .real .ours span { position: absolute; bottom: -1.7em; left: 50%; transform: translateX(-50%); font: .5em var(--mono); color: var(--accent); white-space: nowrap; }
      `})]})}export{d as default};