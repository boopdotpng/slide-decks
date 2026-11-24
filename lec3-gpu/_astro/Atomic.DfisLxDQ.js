import{r as e}from"./preact.module.Bl7PEaKa.js";import{t}from"./hooks.module.U3JihANK.js";import{o as n,r}from"./hooks.CTQS5bFp.js";import{t as i}from"./Code.DX1tbTM2.js";import{t as a}from"./kernel.Co34haHp.js";import{a as o,n as s}from"./image.CiJbjrhy.js";import{a as c,t as l}from"./hist-parts.4EHOzlKe.js";var u=a(`#include "hip.h"
// the same, with the add done as one step by the memory itself. right, but every thread queues on 256 counters
__global__ void hist_atomic(unsigned *bins, const unsigned char *img, unsigned n) {
  unsigned i = blockIdx.x * 256 + threadIdx.x;
  if (i < n) atomicAdd(&bins[img[i]], 1);
}
`),d=u.split(`
`).findIndex(e=>e.includes(`atomicAdd`)),f=12e6,p=s.map((e,t)=>({v:t,c:e})).sort((e,t)=>t.c-e.c).slice(0,6),m=o/256,h=e=>Math.round(e/o*f),g=[{view:`turns`,text:n(e,{children:[n(`b`,{children:`atomicAdd`}),`: send "+1" out to the chip's shared cache (the 8 MB one), and it does read, add, write as `,n(`b`,{children:`one step`}),`. nobody can cut in between. two adds to the same counter take turns`]})},{view:`right`,text:n(e,{children:[`every pixel counted: `,c(o),` of `,c(o),`, every run. correct. the gpu has atomics for add, min, max, swap, and a few more`]})},{view:`far`,text:n(e,{children:[`but each one is a trip out of the workgroup processor, across the chip to that cache, and back. `,c(o),` trips here; a 12-megapixel phone photo: `,c(f),`, aimed at just 256 counters`]})},{view:`queue`,text:n(e,{children:[`and the counters aren't hit evenly. this photo is dark, so a few brightnesses get most of the pixels, and those adds take turns, one after another. spread evenly it would be `,m,` each`]})},{view:`queue`,text:n(e,{children:`right, but slow exactly where it's crowded. the fix: let each block count its own pixels somewhere near, and send the far counters only the totals`})}];function _(){let e=t(null),a=g[Math.min(g.length-1,r(e))],o=a.view,f=p[0].c;return n(`div`,{class:`atomic`,ref:e,children:[n(`div`,{class:`at-cols`,children:[n(`div`,{class:`at-code`,children:n(i,{lang:`cpp`,code:u,hl:o===`turns`?[d]:[]})}),n(`div`,{class:`at-right`,children:[o===`turns`&&n(`div`,{class:`at-turns`,children:[n(`div`,{class:`at-row`,children:[n(`span`,{class:`muted`,children:`thread a`}),n(`span`,{class:`at-op`,children:`+1 →`})]}),n(`div`,{class:`at-row`,children:[n(`span`,{class:`muted`,children:`thread b`}),n(`span`,{class:`at-op`,children:`+1 →`})]}),n(`div`,{class:`at-mem`,children:[n(`div`,{class:`muted at-t`,children:`bins[20], in the shared cache: one add at a time`}),n(`div`,{class:`at-seq`,children:[n(`span`,{children:`41`}),n(`i`,{children:`a's +1`}),n(`span`,{children:`42`}),n(`i`,{children:`b's +1`}),n(`span`,{class:`ok`,children:`43`})]})]})]}),o===`right`&&n(`div`,{children:[n(l,{bins:s,ghost:s,cls:`good`,height:260}),n(`div`,{class:`at-tot`,children:[`counted: `,n(`b`,{class:`ok`,children:c(10240)}),` `,n(`span`,{class:`muted`,children:[`should be: `,c(10240)]})]})]}),o===`far`&&n(`div`,{class:`at-far`,children:[n(`div`,{class:`at-box`,children:[c(10240),` threads `,n(`span`,{class:`muted`,children:`· one add each`})]}),n(`div`,{class:`at-arrow`,children:`→ across the chip →`}),n(`div`,{class:`at-box`,children:[`256 counters `,n(`span`,{class:`muted`,children:`· in the shared cache`})]})]}),o===`queue`&&n(`div`,{class:`at-q`,children:[n(`div`,{class:`muted at-t`,children:`the busiest counters: adds waiting their turn`}),p.map(e=>n(`div`,{class:`at-qr`,children:[n(`span`,{class:`at-qn`,children:[`bins[`,e.v,`]`]}),n(`span`,{class:`at-qt`,children:[n(`span`,{class:`at-qb`,style:{width:`${100*e.c/f}%`}}),n(`span`,{class:`at-even`,style:{left:`${100*m/f}%`}})]}),n(`span`,{class:`at-qv`,children:e.c}),n(`span`,{class:`muted at-qbig`,children:[c(h(e.c)),` at 12 MP`]})]})),n(`div`,{class:`muted at-leg`,children:[n(`i`,{class:`at-even-k`}),` `,m,` each, if they were spread evenly · "12 MP": a photo shaped like this one, at phone size`]})]})]})]}),n(`div`,{class:`caption at-text`,children:a.text}),n(`style`,{children:`
        .atomic .at-cols { display: flex; flex-direction: column; gap: .9em; }
        .atomic .at-code { flex: none; font-size: .56em; align-self: flex-start; } .atomic .at-code pre { margin: 0; }
        .atomic .at-right { flex: 1; min-width: 0; font-size: .58em; min-height: 330px; }
        .atomic .at-row { display: flex; gap: 1em; align-items: center; margin-bottom: .4em; }
        .atomic .at-row .muted { width: 5.5em; }
        .atomic .at-op { font-family: var(--mono); background: var(--tint-blue); box-shadow: inset 0 0 0 1.5px var(--accent); border-radius: 6px; padding: .3em .8em; }
        .atomic .at-mem { margin-top: 1em; }
        .atomic .at-t { margin-bottom: .4em; }
        .atomic .at-seq { display: flex; gap: .8em; align-items: center; font-family: var(--mono); }
        .atomic .at-seq span { background: var(--surface); border-radius: 6px; padding: .35em .9em; font-size: 1.2em; }
        .atomic .at-seq i { font-style: normal; color: var(--muted); font-size: .85em; }
        .atomic .ok { color: var(--good); }
        .atomic .at-seq span.ok { box-shadow: inset 0 0 0 2px var(--good); }
        .atomic .at-tot { margin-top: .4em; font-size: 1.1em; display: flex; gap: 1em; }
        .atomic .at-far { display: flex; align-items: center; gap: 1.2em; margin-top: 1.5em; }
        .atomic .at-box { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: .8em 1em; font-size: 1.1em; }
        .atomic .at-arrow { color: var(--hot); font-family: var(--mono); white-space: nowrap; }
        .atomic .at-qr { display: grid; grid-template-columns: 5.5em 1fr 3em 10em; gap: .8em; align-items: center; margin-bottom: .45em; }
        .atomic .at-qn { font-family: var(--mono); }
        .atomic .at-qt { position: relative; height: 1.3em; background: var(--sunken); border-radius: 4px; }
        .atomic .at-qb { position: absolute; left: 0; top: 0; bottom: 0; background: var(--hot); border-radius: 4px; }
        .atomic .at-even { position: absolute; top: -3px; bottom: -3px; border-left: 2px dashed var(--fg); }
        .atomic .at-qv { font-family: var(--mono); text-align: right; }
        .atomic .at-qbig { font-size: .85em; white-space: nowrap; }
        .atomic .at-leg { margin-top: .6em; font-size: .85em; }
        .atomic .at-even-k { display: inline-block; height: 1em; border-left: 2px dashed var(--fg); vertical-align: -.15em; }
        .atomic .at-right > div { max-width: 1100px; }
        .atomic .at-text { font-size: .76em; min-height: 3.3em; margin-top: .4em; }
      `})]})}export{_ as default};