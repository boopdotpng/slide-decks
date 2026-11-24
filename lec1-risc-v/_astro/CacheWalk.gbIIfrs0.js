import{i as e,t}from"./hooks.module.U3JihANK.js";import{n,o as r,r as i}from"./hooks.CTQS5bFp.js";import{J as a,et as o}from"./viz.3mionHVt.js";var s=64,c=8,l=70,u=.7,d=550,f=70,p=70,m=(e,t=1)=>Array.from({length:e},(e,n)=>n*t),h=[null,{code:`for (i = 0; i < 64; i++)
    total += a[i];`,idx:m(64),text:`a miss brings in the whole line, so the next 7 loads hit`},{code:`for (i = 0; i < 64; i += 8)
    total += a[i];`,idx:m(8,8),text:`every 8th long: each load lands in a new line. 8 loads, 8 misses: about as slow as the 64 loads before`},{code:`for (i = 0; i < 64; i++)
    total += a[i];`,idx:m(64),prefetch:!0,text:`real cpus have a prefetcher: it sees you walking forward and fetches the next lines before you ask. that's why walking an array in order is fast`}],g=`a long is 8 bytes. memory moves to the cache in 64-byte lines: 8 longs at a time, never less`;function _(e){let t=new Set,n=0;return e.idx.map(r=>{let i=Math.floor(r/c),a=t.has(i)?`hit`:e.prefetch&&t.size>0?`pf`:`miss`;return t.add(i),n+=a===`miss`?d:a===`pf`?p:f,{i:r,line:i,kind:a,end:n}})}var v=h.map(e=>e?_(e):[]);function y(){let d=t(null),f=Math.min(h.length-1,i(d)),p=h[f],_=v[f],[y,b]=e(0),x=t(null);n(d,e=>{(!x.current||x.current.step!==f||e<x.current.ms)&&(x.current={step:f,ms:e});let t=e-x.current.ms-400,n=_.filter(e=>e.end<=t).length;n!==y&&b(n)});let S=typeof document<`u`&&document.body.classList.contains(`mode-print`)?_.length:Math.min(y,_.length),C=_.slice(0,S),w=S<_.length?_[S]:null,T=new Set(C.map(e=>e.line));w&&w.kind!==`miss`&&T.add(w.line);let E=C.filter(e=>e.kind===`miss`).length,D=C.length-E,O=E*l+D*u,k=new Map(C.map(e=>[e.i,e.kind]));return r(`div`,{class:`cache-walk`,ref:d,"data-hold":_.length?_[_.length-1].end+1500:void 0,children:[r(`div`,{class:`cw-top`,children:[r(`div`,{class:`cw-code`,children:p?r(o,{lang:`c`,code:p.code}):r(o,{lang:`c`,code:`long a[64];
 `})}),r(`table`,{class:`cw-stats fade ${p?`on`:``}`,children:[r(`tr`,{children:[r(`td`,{children:`loads`}),r(`td`,{children:C.length})]}),r(`tr`,{children:[r(`td`,{class:`cw-miss`,children:`misses`}),r(`td`,{children:[E,` `,r(`span`,{class:`muted`,children:[`× ~`,l,` ns`]})]})]}),r(`tr`,{children:[r(`td`,{class:`cw-hit`,children:`hits`}),r(`td`,{children:[D,` `,r(`span`,{class:`muted`,children:[`× ~`,u,` ns`]})]})]}),r(`tr`,{class:`cw-total`,children:[r(`td`,{children:`time`}),r(`td`,{children:[`~`,Math.round(O),` ns`]})]})]})]}),r(`div`,{class:`cw-lines`,children:m(s/c).map(e=>r(`div`,{class:`cw-line ${T.has(e)?`in`:``} ${w?.line===e&&w.kind===`miss`?`fetching`:``}`,children:[r(`div`,{class:`cw-cells`,children:m(c).map(t=>{let n=e*c+t,i=k.get(n);return r(`span`,{class:`cw-c ${i??``} ${w?.i===n?`now`:``}`,children:n})})}),r(`div`,{class:`cw-label`,children:[`line `,e,` · 64 B`]})]}))}),r(`div`,{class:`cw-key muted`,children:[r(`span`,{children:[r(`i`,{class:`miss`}),` miss: wait for ram`]}),r(`span`,{children:[r(`i`,{class:`hit`}),` hit: already in l1`]}),p?.prefetch&&r(`span`,{children:[r(`i`,{class:`pf`}),` prefetched: arrived early`]}),r(`span`,{children:[r(`i`,{class:`in`}),` line in the cache`]})]}),r(`div`,{class:`caption cw-text`,children:p?p.text:g}),r(`style`,{children:`
        .cache-walk { font-size: .9em; }
        .cache-walk .cw-top { display: flex; gap: 2em; align-items: flex-start; justify-content: space-between; min-height: 4.6em; }
        .cache-walk .cw-code pre { font-size: .7em; margin: 0; }
        .cache-walk .cw-stats { font-family: var(--mono); font-size: .62em; font-variant-numeric: tabular-nums; }
        .cache-walk .cw-stats td { padding: .05em 1em .05em 0; }
        .cache-walk .cw-stats td:first-child { color: var(--muted); }
        .cache-walk .cw-stats .cw-total td { color: var(--fg); font-weight: 700; border-top: 1px solid var(--border); padding-top: .2em; }
        .cache-walk .cw-lines { display: grid; grid-template-columns: repeat(4, 1fr); gap: .8em .7em; margin-top: 1em; }
        .cache-walk .cw-line { border-radius: 8px; padding: .3em; background: var(--sunken); box-shadow: inset 0 0 0 2px transparent;
          transition: background .3s, box-shadow .3s; }
        .cache-walk .cw-line.in { background: color-mix(in srgb, ${a.green} 33%, transparent); box-shadow: inset 0 0 0 2px ${a.green}; }
        .cache-walk .cw-line.fetching { box-shadow: inset 0 0 0 2px ${a.bad}; animation: cw-pulse .5s ease-in-out infinite alternate; }
        @keyframes cw-pulse { to { box-shadow: inset 0 0 0 2px color-mix(in srgb, ${a.bad} 27%, transparent); } }
        .cache-walk .cw-cells { display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; }
        .cache-walk .cw-c { font-family: var(--mono); font-size: .5em; text-align: center; padding: .45em 0; border-radius: 3px;
          background: var(--surface); color: var(--muted); transition: background .2s, color .2s; }
        .cache-walk .cw-c.miss { background: ${a.bad}; color: var(--on-color); }
        .cache-walk .cw-c.hit { background: ${a.good}; color: var(--on-color); }
        .cache-walk .cw-c.pf { background: ${a.accent}; color: var(--on-color); }
        .cache-walk .cw-c.now { outline: 2px solid var(--fg); }
        .cache-walk .cw-label { font-size: .45em; color: var(--muted); text-align: center; margin-top: .25em; }
        .cache-walk .cw-key { display: flex; gap: 1.6em; font-size: .5em; margin-top: .9em; }
        .cache-walk .cw-key i { display: inline-block; width: .9em; height: .9em; border-radius: 2px; vertical-align: -.1em; margin-right: .3em; }
        .cache-walk .cw-key i.miss { background: ${a.bad}; }
        .cache-walk .cw-key i.hit { background: ${a.good}; }
        .cache-walk .cw-key i.pf { background: ${a.accent}; }
        .cache-walk .cw-key i.in { background: color-mix(in srgb, ${a.green} 33%, transparent); box-shadow: inset 0 0 0 2px ${a.green}; }
        .cache-walk .cw-text { font-size: .8em; min-height: 2.6em; margin-top: .6em; }
      `})]})}export{y as default};