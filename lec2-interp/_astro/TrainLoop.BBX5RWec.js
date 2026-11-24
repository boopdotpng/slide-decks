import{r as e}from"./viz.BfyPauLx.js";import{r as t}from"./preact.module.Bl7PEaKa.js";import{t as n}from"./hooks.module.BNbONuGS.js";import{n as r,t as i}from"./roles.Ca55homO.js";var a=[[`w7nhibbae`,`7`],[`vqxnpz0qo`,`0`],[`oyhvra3wo`,`3`],[`atsw1cwao`,`1`],[`c8mkkaada`,`8`],[`rnq9qtjlz`,`9`]],o=[`vsri2bpgd`,`t6oiwgtwm`,`ay4rotspx`],s=[1,2,4],c=[i(t,{children:[`sample `,i(`b`,{children:`512`}),` examples`]}),i(t,{children:[`forward → `,i(`b`,{children:`36 scores`}),` → probabilities`]}),i(t,{children:[i(`b`,{children:`loss`}),` `,i(e,{tex:`= -\\log p(\\text{answer})`}),i(`span`,{class:`eg`,children:[`1-in-10 guess: `,i(`b`,{children:`2.30`}),` · 99% sure and right: `,i(`b`,{children:`0.01`})]})]}),i(t,{children:[i(`b`,{children:`backward`}),`: a gradient for every weight the forward pass used`]}),i(t,{children:[i(`b`,{children:`optimizer`}),` step: nudge each weight against its gradient · `,i(`b`,{children:`repeat`}),` a few thousand times`]}),i(t,{children:[i(`b`,{children:`test`}),` on held-out examples`]})],l={e7:{x:80,y:56,t:`emb[7]`},ea:{x:80,y:146,t:`emb[a]`},u:{x:560,y:56,t:`unembed`},x:{x:310,y:146,t:`last stream`},s:{x:560,y:146,t:`36 scores`},l:{x:800,y:146,t:`loss`}},u=150,d=40,f=[`e7`,`ea`,`u`],p=[[`ea`,`x`],[`x`,`s`],[`u`,`s`],[`s`,`l`]],m=[[`l`,`s`,0],[`s`,`x`,450],[`s`,`u`,450],[`x`,`ea`,900]],h={l:0,s:400,x:850,u:850,ea:1300};function g(e,t,n=0){let r=l[e],i=l[t];if(r.y===i.y){let e=Math.sign(i.x-r.x);return[r.x+e*u/2,r.y+n,i.x-e*u/2,i.y+n]}let a=Math.sign(i.y-r.y);return[r.x+n,r.y+a*d/2,i.x+n,i.y-a*d/2]}function _({a:e,b:t,off:n=0,cls:r,delay:a}){let[o,s,c,l]=g(e,t,n),u=Math.atan2(l-s,c-o),d=e=>c-9*Math.cos(u+e),f=e=>l-9*Math.sin(u+e),p=a===void 0?void 0:{transitionDelay:`${a}ms`};return i(`g`,{class:`edge ${r}`,children:[i(`path`,{pathLength:1,d:`M ${o} ${s} L ${c} ${l}`,style:p}),i(`path`,{class:`tip`,d:`M ${d(.5)} ${f(.5)} L ${c} ${l} L ${d(-.5)} ${f(-.5)}`,style:a===void 0?void 0:{transitionDelay:`${a+350}ms`}})]})}function v({on:e}){return i(`svg`,{class:`bw ${e?`on`:``}`,viewBox:`0 0 900 200`,children:[i(`text`,{class:`note`,x:900,y:14,style:{textAnchor:`end`},children:`task 0 on qwdk7mzpa`}),i(`path`,{class:`stub`,d:`M ${l.e7.x+u/2} ${l.e7.y} H ${l.e7.x+u/2+40}`}),i(`text`,{class:`note`,x:l.e7.x+u/2+50,y:l.e7.y+6,children:`never read: not the last position`}),p.map(([e,t])=>i(_,{a:e,b:t,cls:`fwd`})),m.map(([e,t,n])=>i(_,{a:e,b:t,off:e===`s`&&t===`u`?14:9,cls:`grad`,delay:n})),Object.keys(l).map(e=>{let t=l[e],n=f.includes(e),r=h[e];return i(`g`,{class:`node ${n?`w`:``} ${r===void 0?``:`got`} ${e===`e7`?`none`:``}`,style:r===void 0?void 0:{transitionDelay:`${r}ms`},children:[i(`rect`,{x:t.x-u/2,y:t.y-d/2,width:u,height:d,rx:`7`,style:r===void 0?void 0:{transitionDelay:`${r}ms`}}),i(`text`,{x:t.x,y:t.y+6,children:t.t})]})}),i(`text`,{class:`tag moves`,x:l.ea.x,y:l.ea.y+48,style:{transitionDelay:`1300ms`},children:`gets a gradient: moves`}),i(`text`,{class:`tag moves`,x:l.u.x+u/2+14,y:l.u.y+6,style:{transitionDelay:`850ms`,textAnchor:`start`},children:`moves`}),i(`text`,{class:`tag zero`,x:l.e7.x,y:l.e7.y-30,style:{transitionDelay:`1300ms`},children:`gradient 0: stays put`})]})}function y(){let e=n(null),t=r(e);return i(`div`,{class:`tl`,ref:e,children:[i(`div`,{class:`data`,children:[i(`div`,{class:`lbl`,children:[`training examples `,i(`span`,{class:`muted`,children:`· 10,000`})]}),a.map(([e,n],r)=>i(`div`,{class:`ex ${t>=1&&t<=5&&s.includes(r)?`pick`:``}`,children:[i(`code`,{children:e}),i(`span`,{class:`arr`,children:`→`}),i(`code`,{class:`y`,children:n})]})),i(`div`,{class:`ex more`,children:`…`}),i(`div`,{class:`test ${t>=6?`on`:``}`,children:[i(`div`,{class:`lbl`,children:[`test examples `,i(`span`,{class:`muted`,children:`· 1,000, never trained on`})]}),o.map(e=>i(`div`,{class:`ex`,children:[i(`code`,{children:e}),i(`span`,{class:`arr`,children:`→`}),i(`code`,{class:`y`,children:`?`})]}))]})]}),i(`ol`,{class:`loop`,children:c.map((e,n)=>i(`li`,{class:`fade ${t>n?`on`:``} ${t===n+1?`now`:``}`,children:[e,n===3&&i(v,{on:t>=4})]}))}),i(`style`,{children:`
        .tl { display: grid; grid-template-columns: auto 1fr; gap: 3em; align-items: start; font-size: .8em; }
        .tl .lbl { font-size: .7em; margin-bottom: .4em; }
        .tl .ex { display: flex; gap: .6em; align-items: center; padding: .1em .5em; border-radius: 6px; transition: background .3s; }
        .tl .ex code { font-size: 1em; background: none; padding: 0; letter-spacing: .05em; }
        .tl .ex .y { color: var(--answer); }
        .tl .ex .arr { color: var(--muted); }
        .tl .ex.pick { background: var(--hl); }
        .tl .ex.more { color: var(--muted); }
        .tl .test { margin-top: 1em; padding-top: .6em; border-top: 1px dashed var(--border); opacity: .45; transition: opacity .3s; }
        .tl .test.on { opacity: 1; }
        .tl .test .y { color: var(--muted); }
        .tl .loop { margin: 0; padding-left: 1.3em; display: flex; flex-direction: column; gap: .3em; }
        .tl .loop li { margin: 0; padding: .2em .4em; border-radius: 6px; transition: background .3s, opacity .35s; }
        .tl .loop li.now { background: var(--hl); }
        .tl .loop b { color: var(--fg); }
        .tl .eg { display: block; font-size: .8em; color: var(--muted); margin-top: .2em; }
        .tl .eg b { font-family: var(--mono); }
        .tl .bw { display: block; width: 920px; margin-top: .3em; overflow: visible; }
        .tl .bw .node rect { fill: var(--raised); stroke: var(--border); stroke-width: 2; transition: stroke .3s, fill .3s; }
        .tl .bw .node.w rect { stroke-dasharray: none; }
        .tl .bw .node text { font-family: var(--mono); font-size: 21px; fill: var(--fg); text-anchor: middle; }
        .tl .bw .node.none text { fill: var(--muted); }
        .tl .bw.on .node.got rect { stroke: var(--focus); } .tl .bw .node.none rect { stroke-dasharray: 5 4; }
        .tl .bw.on .node.got.w rect { fill: color-mix(in srgb, var(--focus) 20%, var(--raised)); }
        .tl .bw .edge path { fill: none; stroke-width: 2; }
        .tl .bw .edge.fwd path { stroke: var(--faint); }
        .tl .bw .edge.grad path { stroke: var(--focus); stroke-width: 2.5; stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset .4s linear; }
        .tl .bw .edge.grad .tip { stroke-dasharray: none; opacity: 0; transition: opacity .1s; }
        .tl .bw.on .edge.grad path { stroke-dashoffset: 0; } .tl .bw.on .edge.grad .tip { opacity: 1; }
        .tl .bw:not(.on) .edge.grad path, .tl .bw:not(.on) .node rect, .tl .bw:not(.on) .tag { transition-delay: 0ms !important; }
        .tl .bw .stub { stroke: var(--faint); stroke-width: 2; stroke-dasharray: 4 5; fill: none; }
        .tl .bw .note { font-size: 18px; fill: var(--muted); }
        .tl .bw .tag { font-size: 19px; text-anchor: middle; opacity: 0; transition: opacity .3s; }
        .tl .bw.on .tag { opacity: 1; }
        .tl .bw .tag.moves { fill: var(--focus); } .tl .bw .tag.zero { fill: var(--muted); }
      `})]})}export{y as default};