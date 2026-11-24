import{r as e}from"./preact.module.Bl7PEaKa.js";import{t}from"./hooks.module.U3JihANK.js";import{o as n,r}from"./hooks.CTQS5bFp.js";import{t as i}from"./Code.DX1tbTM2.js";var a=`tile:
    s_load_b128 s[4:7], s[0:1], 0x0
    s_load_b64 s[0:1], s[0:1], 0x10
    v_lshlrev_b32 v1, 4, v0
    v_lshlrev_b32 v16, 5, v0
    s_wait_kmcnt 0x0
    global_load_b128 v[8:11], v1, s[6:7]
    global_load_b128 v[12:15], v1, s[0:1]
    global_load_b128 v[4:7], v16, s[4:5] offset:16
    global_load_b128 v[0:3], v16, s[4:5]
    s_wait_loadcnt 0x0
    v_wmma_f32_16x16x16_f16 v[0:7], v[8:11], v[12:15], v[0:7]
    global_store_b128 v16, v[0:3], s[4:5]
    global_store_b128 v16, v[4:7], s[4:5] offset:16
    s_endpgm
`,o=a.split(`
`).findIndex(e=>e.includes(`v_wmma`)),s=a.split(`
`).slice(1).join(`
`),c=[{on:[],text:n(e,{children:[`every v_ instruction so far kept the lanes apart: lane 3 never saw lane 4's pixel. machine learning is mostly one operation, though, and it isn't like that: `,n(`b`,{children:`matrix multiply`})]})},{on:[`a`,`b`,`c`],text:n(e,{children:[`a wave has room for whole matrices. 32 lanes × 8 registers = 256 numbers = one `,n(`b`,{children:`16 × 16`}),` tile. here the wave holds three: A, B and C`]})},{on:[`a`,`b`,`c`,`d`,`ins`],text:n(e,{children:[n(`b`,{children:`v_wmma_f32_16x16x16_f16`}),`: D = A × B + C, all of it, as `,n(`b`,{children:`one instruction`}),`. the lanes are no longer 32 threads. together they're one matrix`]})},{on:[`a`,`b`,`c`,`d`,`ins`,`count`],text:n(e,{children:[`each of D's 256 numbers is 16 multiply-adds: `,n(`b`,{children:`4096`}),` in one instruction, taking 16 cycles. brighten's `,n(`code`,{children:`v_mul_lo_u32`}),` does 32`]})},{on:[`a`,`b`,`c`,`d`,`ins`,`count`,`names`],text:n(e,{children:[`this is what nvidia calls a `,n(`b`,{children:`tensor core`}),`: hardware that does D = A × B + C on small tiles, driven by a whole warp. a big matmul is thousands of these tiles. libraries (and compilers) emit it for you`]})}];function l({name:e,sub:t,on:r,hot:i}){return n(`div`,{class:`mx-m ${r?`on`:``} ${i?`hot`:``}`,children:[n(`div`,{class:`mx-g`,children:Array.from({length:256},()=>n(`i`,{}))}),n(`div`,{class:`mx-n`,children:[n(`b`,{children:e}),` `,n(`span`,{class:`muted`,children:t})]})]})}function u(){let e=t(null),a=Math.min(c.length-1,r(e)),u=e=>c[a].on.includes(e);return n(`div`,{class:`matrix`,ref:e,children:[n(`div`,{class:`mx-cols`,children:[n(i,{lang:`asm`,code:s,hl:u(`ins`)?[o-1]:[]}),n(`div`,{class:`mx-right`,children:[n(`div`,{class:`mx-eq`,children:[n(l,{name:`A`,sub:`16-bit floats · v8–v11`,on:u(`a`)}),n(`span`,{class:`mx-op`,children:`×`}),n(l,{name:`B`,sub:`16-bit floats · v12–v15`,on:u(`b`)}),n(`span`,{class:`mx-op`,children:`+`}),n(l,{name:`C`,sub:`32-bit floats · v0–v7`,on:u(`c`)}),n(`span`,{class:`mx-op`,children:`→`}),n(l,{name:`D`,sub:`back into v0–v7`,on:u(`d`),hot:!0})]}),n(`div`,{class:`mx-count fade ${u(`count`)?`on`:``}`,children:[`16 × 16 × 16 = `,n(`b`,{children:`4096`}),` multiply-adds · one instruction · 16 cycles`]}),n(`table`,{class:`mx-names fade ${u(`names`)?`on`:``}`,children:n(`tbody`,{children:[n(`tr`,{children:[n(`td`,{class:`muted`,children:`nvidia`}),n(`td`,{children:`tensor cores`}),n(`td`,{class:`muted`,children:`reached through "warp matrix" operations (wmma)`})]}),n(`tr`,{children:[n(`td`,{class:`muted`,children:`amd radeon`}),n(`td`,{children:`wmma: wave matrix multiply accumulate`}),n(`td`,{class:`muted`,children:`rx 7000 and up. amd also says "matrix cores", "ai accelerators"`})]})]})})]})]}),n(`div`,{class:`caption mx-text`,children:c[a].text}),n(`style`,{children:`
        .matrix .mx-cols { display: flex; gap: 1.6em; align-items: flex-start; }
        .matrix .mx-cols pre { margin: 0; flex: none; font-size: .42em; }
        .matrix .mx-right { flex: 1; min-width: 0; }
        .matrix .mx-eq { display: flex; align-items: center; gap: .5em; }
        .matrix .mx-m { flex: 1; opacity: .25; transition: opacity .4s; }
        .matrix .mx-m.on { opacity: 1; }
        .matrix .mx-g { display: grid; grid-template-columns: repeat(16, 1fr); gap: 1px; aspect-ratio: 1; }
        .matrix .mx-g i { background: var(--steel-2); border-radius: 1px; }
        .matrix .mx-m.hot.on .mx-g i { background: var(--hot); }
        .matrix .mx-n { font-size: .46em; margin-top: .4em; white-space: nowrap; }
        .matrix .mx-op { font-size: 1.1em; color: var(--muted); padding-bottom: 1em; }
        .matrix .mx-count { font-size: .62em; margin-top: 1em; }
        .matrix .mx-names { font-size: .52em; margin-top: .8em; }
        .matrix .mx-names td { padding: .2em 1.4em .2em 0; }
        .matrix .mx-text { font-size: .76em; min-height: 3.2em; margin-top: .8em; }
      `})]})}export{u as default};