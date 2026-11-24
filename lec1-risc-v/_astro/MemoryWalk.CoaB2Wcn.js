import{r as e}from"./preact.module.Bl7PEaKa.js";import{t}from"./hooks.module.U3JihANK.js";import{o as n,r}from"./hooks.CTQS5bFp.js";import{S as i,et as a}from"./viz.3mionHVt.js";var o=74136,s=[3,1,4,1,5,9,2,6,0],c=[`nums`,``,``,``,``,``,``,``,`total`],l=e=>`0x`+e.toString(16),u=`
la   t0, nums       # t0 = the address of nums
ld   t3, 0(t0)      # t3 = the 8 bytes at t0 + 0
ld   t3, 8(t0)      # t3 = the 8 bytes at t0 + 8
la   t4, total      # t4 = the address of total
sd   t3, 0(t4)      # the 8 bytes at t4 + 0 = t3`,d=[{hl:[],text:n(e,{children:[`memory is one huge array of bytes, and every byte has a number: its `,n(`b`,{children:`address`}),`. here are our 8 numbers, 8 bytes each`]})},{hl:[0],set:{t0:o},text:n(e,{children:[n(`b`,{children:`la`}),` (load address) puts an address in a register. t0 now `,n(`i`,{children:`points at`}),` nums[0]`]})},{hl:[1],set:{t3:3},touch:0,text:n(e,{children:[n(`b`,{children:`ld`}),` (load doubleword): read 8 bytes from address t0 + 0 into t3`]})},{hl:[2],set:{t3:1},touch:1,text:n(e,{children:`the number in front of the bracket is added to the address: t0 + 8 is the next number`})},{hl:[3],set:{t4:74200},text:n(e,{children:`total sits right after the 8 numbers: 64 bytes on`})},{hl:[4],touch:8,write:!0,text:n(e,{children:[n(`b`,{children:`sd`}),` (store doubleword): write t3 into memory. loads and stores are the `,n(`b`,{children:`only`}),` instructions that touch memory`]})},{hl:[4],touch:8,write:!0,text:n(e,{children:[`other sizes: `,n(`code`,{children:`lw`}),`/`,n(`code`,{children:`sw`}),` 4 bytes, `,n(`code`,{children:`lh`}),`/`,n(`code`,{children:`sh`}),` 2, `,n(`code`,{children:`lb`}),`/`,n(`code`,{children:`sb`}),` 1. everything else is register to register`]})}];function f({mem:e,ptrs:t={},touch:r,write:i}){return n(`div`,{class:`mem-row`,children:[e.map((e,a)=>n(`div`,{class:`mw-cell ${r===a?i?`write`:`read`:``}`,children:[n(`span`,{class:`mw-name`,children:c[a]}),n(`span`,{class:`mw-addr`,children:l(o+8*a)}),n(`span`,{class:`mw-v`,children:e}),n(`span`,{class:`mw-ptr`,children:(t[a]??[]).join(` `)})]})),n(`style`,{children:`
        .mem-row { display: flex; gap: .3em; font-family: var(--mono); font-size: .62em; margin-bottom: 1em; }
        .mem-row .mw-cell { display: flex; flex-direction: column; align-items: center; flex: 1; }
        .mem-row .mw-name { font-size: .8em; color: var(--fg); height: 1.5em; line-height: 1.5em; }
        .mem-row .mw-addr { font-size: .7em; color: var(--muted); }
        .mem-row .mw-v { width: 100%; text-align: center; background: var(--surface); border-radius: 4px; padding: .3em 0;
          box-shadow: inset 0 0 0 2px transparent; transition: box-shadow .25s, background .25s; }
        .mem-row .mw-cell:last-child .mw-v { background: var(--tint-blue); }
        .mem-row .read .mw-v { box-shadow: inset 0 0 0 2px var(--accent); }
        .mem-row .write .mw-v { box-shadow: inset 0 0 0 2px var(--hot); }
        .mem-row .mw-ptr { color: var(--accent); min-height: 1.4em; }
      `})]})}var p=e=>Object.assign({},...d.slice(0,e+1).map(e=>e.set??{}));function m(){let e=t(null),c=Math.min(d.length-1,r(e)),m=d[c],h=p(c),g=[...s];c>=5&&(g[8]=1);let _={};for(let e of[`t0`,`t4`])h[e]!==void 0&&(_[(h[e]-o)/8]??=[]).push(e);return n(`div`,{class:`mem-walk`,ref:e,children:[n(f,{mem:g,ptrs:_,touch:m.touch,write:m.write}),n(`div`,{class:`mw-cols`,children:[n(a,{lang:`asm`,code:u,hl:m.hl}),n(i,{vars:[`t0`,`t3`,`t4`].map(e=>({name:e,reg:!0})),state:Object.fromEntries(Object.entries(h).map(([e,t])=>[e,e===`t3`?String(t):l(t)])),changed:Object.keys(m.set??{})})]}),n(`div`,{class:`caption mw-text`,children:m.text}),n(`style`,{children:`
        .mem-walk .mw-cols { display: flex; gap: 2.5em; align-items: flex-start; font-size: .62em; }
        .mem-walk .mw-cols pre { margin: 0; flex: 1.6; font-size: 1em; }
        .mem-walk .mw-text { font-size: .78em; min-height: 3em; margin-top: .8em; }
      `})]})}export{o as BASE,s as MEM0,f as MemRow,m as default,l as hex};