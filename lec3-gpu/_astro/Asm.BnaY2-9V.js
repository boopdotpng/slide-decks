import{r as e}from"./preact.module.Bl7PEaKa.js";import{t}from"./hooks.module.U3JihANK.js";import{o as n,r}from"./hooks.CTQS5bFp.js";import{t as i}from"./Code.DX1tbTM2.js";import{t as a}from"./kernel.Co34haHp.js";var o=`#include "hip.h"
// brighten a grayscale image: every pixel times a, capped at 255 (white). one thread per pixel
__global__ void brighten(unsigned char *img, unsigned n, unsigned a) {
  unsigned i = blockIdx.x * 256 + threadIdx.x;   // my pixel
  if (i < n) {                                   // the last block sticks out past the end
    unsigned p = img[i] * a;
    img[i] = p < 255 ? p : 255;
  }
}
`,s=`brighten:
    s_load_b64 s[2:3], s[0:1], 0x8
    v_lshl_add_u32 v0, ttmp9, 8, v0
    s_wait_kmcnt 0x0
    v_cmp_gt_u32 vcc_lo, s2, v0
    s_and_saveexec_b32 s2, vcc_lo
    s_cbranch_execz .LBB0_2
    s_load_b64 s[0:1], s[0:1], 0x0
    s_wait_kmcnt 0x0
    global_load_u8 v1, v0, s[0:1]
    s_wait_loadcnt 0x0
    v_mul_lo_u32 v1, s3, v1
    v_min_u32 v1, 0xff, v1
    global_store_b8 v0, v1, s[0:1]
.LBB0_2:
    s_endpgm
`.split(`
`).slice(1).filter(e=>e.trim()),c=s.join(`
`),l=s.filter(e=>/^\s+[a-z]/.test(e)).length,u=(...e)=>s.flatMap((t,n)=>e.some(e=>t.includes(e))?[n]:[]),d=[{asm:[],src:[],text:n(e,{children:[`the kernel, compiled by clang for the rx 9070 xt: `,n(`b`,{children:[l,` instructions`]}),`. every wave runs these, top to bottom, once. read the names with the key below`]})},{asm:u(`v_lshl_add`),src:[1],text:n(e,{children:[`my pixel. the hardware left the block number in `,n(`b`,{children:`ttmp9`}),` and each lane's thread number in `,n(`b`,{children:`v0`}),`. shift left by 8 is × 256, then add: `,n(`b`,{children:`one`}),` instruction, 32 answers`]})},{asm:u(`s_load`,`s_wait_kmcnt`),src:[0],text:n(e,{children:[`the arguments: `,n(`code`,{children:`img`}),`, `,n(`code`,{children:`n`}),` and `,n(`code`,{children:`a`}),` are the same for every thread, so they go in `,n(`b`,{children:`s`}),` registers, loaded once for the wave. `,n(`code`,{children:`s_wait_kmcnt`}),`: sleep until they arrive`]})},{asm:u(`v_cmp`,`s_and_saveexec`,`s_cbranch_execz`),src:[2,5],text:n(e,{children:[`the `,n(`code`,{children:`if`}),`: compare in all 32 lanes, put the 32 answers in `,n(`b`,{children:`exec`}),` (the on/off switch per lane). if every lane is off, jump to the end`]})},{asm:u(`global_load`,`s_wait_loadcnt`),src:[3],text:n(e,{children:[`one load, 32 addresses: every lane asks for its own pixel. then `,n(`code`,{children:`s_wait_loadcnt`}),`: the wave sleeps ~100 adds' worth, and the simd runs other waves meanwhile`]})},{asm:u(`v_mul`,`v_min`),src:[3,4],text:n(e,{children:[`× a, then cap at 255 (`,n(`code`,{children:`0xff`}),`). `,n(`code`,{children:`a`}),` comes from an s register, the pixel from each lane's own v1`]})},{asm:u(`global_store`,`s_endpgm`),src:[4],text:n(e,{children:[`store 32 bytes, and the wave is done. 32 pixels brightened by `,l,` instructions`]})}],f=[[`v_…`,n(e,{children:[`per lane: a `,n(`b`,{children:`v`}),` register holds 32 values, one for each thread`]})],[`s_…`,n(e,{children:[`once for the whole wave: an `,n(`b`,{children:`s`}),` register holds one value everyone shares`]})],[`global_…`,n(e,{children:`gpu memory: the photo`})],[`s_wait_…`,n(e,{children:`sleep until what was asked for has arrived`})]];function p(){let e=t(null),s=d[Math.min(d.length-1,r(e))];return n(`div`,{class:`asm-view`,ref:e,children:[n(`div`,{class:`av-cols`,children:[n(`div`,{class:`av-src`,children:[n(`div`,{class:`muted av-t`,children:`what you wrote`}),n(i,{lang:`cpp`,code:a(o),hl:s.src.length?s.src:void 0}),n(`div`,{class:`av-key`,children:[f.map(([e,t])=>n(`div`,{class:`av-k`,children:[n(`code`,{children:e}),n(`span`,{children:t})]})),n(`div`,{class:`av-k av-ex`,children:[n(`code`,{children:`v_mul_lo_u32`}),n(`span`,{children:`on v registers · multiply · 32-bit unsigned`})]})]})]}),n(`div`,{class:`av-asm`,children:[n(`div`,{class:`muted av-t`,children:`what the gpu runs (gfx1201)`}),n(i,{lang:`asm`,code:c,hl:s.asm.length?s.asm:void 0})]})]}),n(`div`,{class:`caption av-text`,children:s.text}),n(`style`,{children:`
        .asm-view .av-cols { display: flex; gap: 1.6em; align-items: flex-start; }
        .asm-view .av-src { flex: 1; min-width: 0; font-size: .5em; }
        .asm-view .av-asm { flex: none; font-size: .5em; }
        .asm-view pre { margin: 0; font-size: 1em; }
        .asm-view .av-t { font-size: .9em; margin-bottom: .3em; }
        .asm-view .av-key { margin-top: 1.2em; display: grid; gap: .35em; }
        .asm-view .av-k { display: grid; grid-template-columns: 9em 1fr; gap: .8em; align-items: baseline; }
        .asm-view .av-k code { background: none; padding: 0; color: var(--accent); }
        .asm-view .av-ex { margin-top: .4em; padding-top: .5em; border-top: 1px solid var(--border); }
        .asm-view .av-ex span { color: var(--muted); }
        .asm-view .av-text { font-size: .76em; min-height: 3.3em; margin-top: .8em; }
      `})]})}export{p as default};