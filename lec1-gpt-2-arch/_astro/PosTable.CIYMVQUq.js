import{_ as e,a as t,d as n,u as r}from"./viz.ZHEKlosV.js";var i=[`var(--series-1)`,`var(--series-2)`,`var(--series-3)`,`var(--series-4)`],a=560,o=440,s=380;function c(){let{root:c,step:l,d:u}=e(`embed`);if(!u)return r(`div`,{ref:c});let d=Object.keys(u.wpe_dims),f=d.flatMap(e=>u.wpe_dims[e]).slice(1),p=Math.min(...f),m=Math.max(...f),h=e=>e.slice(1).map((e,t)=>`${(e-p)/(m-p)*s},${(t+1)/1023*o}`).join(` `);return r(`div`,{class:`pt`,ref:c,children:[r(`div`,{class:`tbl`,children:[r(`div`,{class:`lbl`,style:{marginLeft:`5em`},children:`768 numbers per row →`}),r(`div`,{class:`tw`,children:[r(`div`,{class:`ticks muted`,children:[r(`span`,{children:`position 0`}),r(`span`,{children:`↓`}),r(`span`,{children:`1023`})]}),r(t,{m:u.wpe_img,w:a,h:o,children:[d.map((e,t)=>r(`div`,{class:`col ${n(l,1)}`,style:{left:`${u.wpe_order.indexOf(Number(e))/768*100}%`,background:i[t]}})),r(`div`,{class:`ours ${n(l,3)}`})]})]}),r(`div`,{class:`missing ${n(l,2)}`,children:`no row 1024. that's the context length`})]}),r(`div`,{class:`side`,children:[r(`div`,{class:n(l,1),children:[r(`svg`,{width:s,height:o,viewBox:`0 0 ${s} ${o}`,children:d.map((e,t)=>r(`polyline`,{points:h(u.wpe_dims[e]),fill:`none`,stroke:i[t],"stroke-width":`2`}))}),r(`div`,{class:`lbl`,children:`four of the columns: slow waves down the positions`})]}),r(`div`,{class:`ourcap ${n(l,3)}`,children:`our 4 tokens: rows 0, 1, 2, 3`})]}),r(`style`,{children:`
        .pt { display: flex; gap: 1.5em; align-items: flex-start; font-size: .8em; }
        .pt .tbl { display: flex; flex-direction: column; gap: .3em; }
        .pt .col { position: absolute; top: 0; bottom: 0; width: 3px; margin-left: -1px; }
        .pt .ours { position: absolute; left: -6px; right: -6px; top: -3px; height: 8px; border: 2px solid var(--accent); border-radius: 3px; }
        .pt .missing { margin-top: .2em; padding: .3em .6em; border: 2px dashed var(--bad); border-radius: 6px; color: var(--bad); font-size: .65em; }
        .pt .side { position: relative; display: flex; flex-direction: column; padding-top: 1.1em; }
        .pt .tw { display: flex; gap: .5em; }
        .pt .ticks { height: ${o}px; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end;
          font-size: .5em; white-space: nowrap; }
        .pt .side svg { display: block; }
        .pt .ourcap { color: var(--accent); font-size: .6em; position: absolute; top: .4em; left: 0; }
        .pt .side .lbl { margin-top: .4em; }
      `})]})}export{c as default};