import{r as e}from"./preact.module.Bl7PEaKa.js";import{t}from"./hooks.module.U3JihANK.js";import{o as n,r}from"./hooks.CTQS5bFp.js";import{t as i}from"./Code.DX1tbTM2.js";var a=`shadows:
    s_load_b32 s2, s[0:1], 0x8
    v_lshl_add_u32 v1, ttmp9, 8, v0
    s_wait_kmcnt 0x0
    v_cmp_gt_u32 vcc_lo, s2, v1
    s_and_saveexec_b32 s2, vcc_lo
    s_cbranch_execz .LBB0_3
    s_load_b64 s[0:1], s[0:1], 0x0
    s_wait_kmcnt 0x0
    global_load_d16_u8 v0, v1, s[0:1]
    v_add_co_u32 v1, s0, s0, v1
    s_wait_alu depctr_va_sdst(0)
    v_add_co_ci_u32 v2, null, s1, 0, s0
    s_wait_loadcnt 0x0
    v_cmp_gt_u16 vcc_lo, 40, v0.l
    s_and_b32 exec_lo, exec_lo, vcc_lo
    s_cbranch_execz .LBB0_3
    v_lshlrev_b16 v0.l, 1, v0.l
    global_store_b8 v[1:2], v0, off
.LBB0_3:
    s_endpgm
`,o=`hist_lds:
    v_dual_mov_b32 v2, 0 :: v_dual_lshlrev_b32 v1, 2, v0
    s_load_b32 s4, s[0:1], 0x10
    s_load_b128 s[0:3], s[0:1], 0x0
    v_lshl_or_b32 v0, ttmp9, 12, v0
    s_mov_b32 s5, exec_lo
    ds_store_b32 v1, v2
    s_barrier_signal -1
    s_barrier_wait -1
    s_wait_kmcnt 0x0
    v_cmpx_gt_u32 s4, v0
    s_cbranch_execz .LBB0_2
    global_load_u8 v2, v0, s[2:3]
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_2:
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0x100, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_4
    global_load_u8 v2, v0, s[2:3] offset:256
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_4:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0x200, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_6
    global_load_u8 v2, v0, s[2:3] offset:512
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_6:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0x300, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_8
    global_load_u8 v2, v0, s[2:3] offset:768
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_8:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_or_b32 v2, 0x400, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_10
    global_load_u8 v2, v0, s[2:3] offset:1024
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_10:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0x500, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_12
    global_load_u8 v2, v0, s[2:3] offset:1280
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_12:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0x600, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_14
    global_load_u8 v2, v0, s[2:3] offset:1536
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_14:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0x700, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_16
    global_load_u8 v2, v0, s[2:3] offset:1792
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_16:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_or_b32 v2, 0x800, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_18
    global_load_u8 v2, v0, s[2:3] offset:2048
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_18:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0x900, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_20
    global_load_u8 v2, v0, s[2:3] offset:2304
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_20:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0xa00, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_22
    global_load_u8 v2, v0, s[2:3] offset:2560
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_22:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0xb00, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_24
    global_load_u8 v2, v0, s[2:3] offset:2816
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_24:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_or_b32 v2, 0xc00, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_26
    global_load_u8 v2, v0, s[2:3] offset:3072
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_26:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0xd00, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_28
    global_load_u8 v2, v2, s[2:3]
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_28:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0xe00, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_30
    global_load_u8 v2, v2, s[2:3]
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_30:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v0, 0xf00, v0
    v_cmp_gt_u32 vcc_lo, s4, v0
    s_and_saveexec_b32 s4, vcc_lo
    s_cbranch_execz .LBB0_32
    global_load_u8 v0, v0, s[2:3]
    v_mov_b32 v2, 1
    s_wait_loadcnt 0x0
    v_lshlrev_b32 v0, 2, v0
    ds_add_u32 v0, v2
.LBB0_32:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s4
    s_barrier_signal -1
    s_barrier_wait -1
    ds_load_b32 v0, v1
    s_wait_dscnt 0x0
    global_atomic_add_u32 v1, v0, s[0:1] scope:SCOPE_DEV
    s_endpgm
`,s=a.split(`
`).slice(1).filter(e=>e.trim()),c=o.split(`
`).slice(1).filter(e=>e.trim()),l=c.findIndex(e=>e.includes(`s_or_b32 exec_lo`)),u=c.map(e=>/^\.LBB/.test(e)).lastIndexOf(!0),d=c.filter(e=>e.includes(`ds_add_u32`)).length,f=[...c.slice(0,l+1),`    ; … ${d-1} more copies of these lines: the compiler unrolled the loop`,...c.slice(u)],p=(e,...t)=>e.flatMap((e,n)=>t.some(t=>e.includes(t))?[n]:[]),m=(e,t)=>[e.map(e=>e.includes(t)).lastIndexOf(!0)],h=[{focus:`sh`,sh:[...p(s,`v_cmp_gt_u16`,`s_and_b32 exec_lo`),...m(s,`s_cbranch_execz`)],text:n(e,{children:[`shadows' `,n(`code`,{children:`if`}),`: compare the pixel in all 32 lanes, `,n(`b`,{children:`and`}),` the answers into exec (lanes with light pixels switch off), and skip the body only if `,n(`b`,{children:`every`}),` lane is off. the exec mask from the wave slides is these three lines`]})},{focus:`sh`,sh:p(s,`v_lshlrev_b16`,`global_store_b8`),text:n(e,{children:`the body runs once for the whole wave. switched-off lanes sit through it, writing nothing: that's the cost of a wave that disagrees`})},{focus:`h`,h:[...p(f,`ds_store_b32`),...p(f,`s_barrier`).slice(0,2)],text:n(e,{children:[`the lds histogram: every thread clears its bin with `,n(`b`,{children:`ds_store`}),`. `,n(`code`,{children:`__syncthreads()`}),` is two instructions: `,n(`b`,{children:`s_barrier_signal`}),` ("i'm done") and `,n(`b`,{children:`s_barrier_wait`}),` (sleep until every wave of the block has said so)`]})},{focus:`h`,h:p(f,`global_load_u8`,`ds_add_u32`),text:n(e,{children:[`the count. `,n(`b`,{children:`ds_add_u32`}),` is the lds doing the add itself, one step that nobody can interrupt: `,n(`code`,{children:`atomicAdd`}),` on `,n(`code`,{children:`__shared__`}),` memory. the loop of 16 became `,d,` copies, no loop left`]})},{focus:`h`,h:[...m(f,`s_or_b32 exec_lo`),...p(f,`s_barrier`).slice(2),...p(f,`ds_load_b32`,`global_atomic_add`)],text:n(e,{children:[`the end: switch every lane back on, the second barrier, read my bin from lds, and `,n(`b`,{children:`global_atomic_add`}),`: the same one-step add, done far away in the shared cache. once per bin per block`]})}];function g(){let e=t(null),a=h[Math.min(h.length-1,r(e))];return n(`div`,{class:`asm-sync`,ref:e,children:[n(`div`,{class:`as-cols`,children:[n(`div`,{class:`as-p ${a.focus===`h`?`dim`:``}`,children:[n(`div`,{class:`muted as-t`,children:`shadows: a branch`}),n(i,{lang:`asm`,code:s.join(`
`),hl:a.sh})]}),n(`div`,{class:`as-p ${a.focus===`sh`?`dim`:``}`,children:[n(`div`,{class:`muted as-t`,children:`the lds histogram: barriers and atomics`}),n(i,{lang:`asm`,code:f.join(`
`),hl:a.h})]})]}),n(`div`,{class:`caption as-text`,children:a.text}),n(`style`,{children:`
        .asm-sync .as-cols { display: flex; gap: 1.6em; align-items: flex-start; }
        .asm-sync .as-p { flex: none; font-size: .42em; transition: opacity .4s; }
        .asm-sync .as-p.dim { opacity: .35; }
        .asm-sync pre { margin: 0; font-size: 1em; }
        .asm-sync .as-t { font-size: 1em; margin-bottom: .3em; }
        .asm-sync .as-text { font-size: .74em; min-height: 3.3em; margin-top: .7em; }
      `})]})}export{g as default};