import{t as e}from"./hooks.module.U3JihANK.js";import{c as t,o as n,r}from"./hooks.DjY2cg7H.js";import{J as i,S as a}from"./viz.BpU9tPyD.js";var o=`
// timer interrupt: enters the kernel like a syscall does
timer_interrupt:
    save_registers(cur);          // A's pc + all registers
    next = pick_next();           // the scheduler
    if (next->proc != cur->proc)
        cr3 = next->proc->page_table;
    cur = next;
    set_timer(now + 4ms);
    restore_registers(cur);       // B's registers and pc
    iretq;                        // back to ring 3`,s=`0xffffffff81c00080`,c={mode:`ring 3`,pc:`0x11148`,cr3:`hello's table`,saved:`—`},l=[{st:{},text:`thread A (hello) is running in ring 3. it has no idea it's about to be paused`},{kernel:[0,1],st:{mode:`ring 0`,pc:s,saved:`0x11148`},text:`the timer fires and the cpu enters the kernel, just like a syscall: save the pc, switch to ring 0, jump to the handler the kernel set up at boot`},{kernel:[2],st:{},text:`save all of A's registers into A's thread struct. paused, A is just data in memory`},{kernel:[3],st:{},text:`the scheduler picks who runs next: thread B, in another process (the shell)`},{kernel:[4,5],st:{cr3:`shell's table`},text:`another process → switch page tables. now 0x10120 means the shell's memory. (same process? skip this: threads share a table)`},{kernel:[6,7],st:{},text:`set the timer again, so the kernel gets the cpu back in ~4 ms`},{kernel:[8],st:{saved:`0x2a4f8`},text:`load B's registers and pc, saved the last time B was paused`},{kernel:[9],st:{mode:`ring 3`,pc:`0x2a4f8`},text:`back to ring 3 at B's pc: B continues exactly where it stopped, as if nothing happened`},{st:{},text:`every few ms, on every core. a switch costs a few µs, so you never notice: everything looks like it runs at once`},{st:{},text:`interrupted: it stopped mid-calculation, so any register might matter. save every one, restore every one`},{st:{},text:`stops itself (sleep, a lock, a read that blocks): it called into the kernel, and a call only promises the callee-saved registers. the rest are already garbage to the caller`}],u=[`rax`,`rbx`,`rcx`,`rdx`,`rsi`,`rdi`,`rbp`,`rsp`,`r8`,`r9`,`r10`,`r11`,`r12`,`r13`,`r14`,`r15`,`rip`,`rflags`],d=new Set([`rbx`,`rbp`,`rsp`,`r12`,`r13`,`r14`,`r15`,`rip`]),f=[{name:`mode`},{name:`pc`},{name:`cr3`,note:`page table`},{name:`saved`,note:`pc to return to`}],p={A:i.accent,B:i.purple,C:i.hot,k:`var(--raised-2)`},m=[[`A`,8],[`k`,1],[`B`,8]],h=[`A`,`B`,`C`,`A`,`B`,`A`,`C`,`B`,`A`,`C`].flatMap((e,t)=>t?[[`k`,.25],[e,2]]:[[e,2]]);function g(){let s=e(null),g=r(s),_=l[g],v=Object.assign({},c,...l.slice(0,g+1).map(e=>e.st)),y=g>=8?h:m.slice(0,g>=7?3:g>=1?2:1);return t(`div`,{class:`cs`,ref:s,children:[t(`div`,{class:`cs-strip`,children:[t(`span`,{class:`muted cs-core`,children:`core 0`}),t(`div`,{class:`cs-bar`,children:y.map(([e,n])=>t(`div`,{class:`cs-seg`,style:{flex:`0 0 ${n*4}%`,background:p[e]},children:e===`k`?``:e}))})]}),t(`div`,{class:`cs-legend muted`,children:`A = hello · B = shell · C = another thread · grey = kernel`}),g>=9?t(`div`,{class:`cs-regs`,children:[t(`div`,{class:`cs-regs-title`,children:[g===9?`interrupted`:`stops itself`,t(`span`,{class:`muted`,children:[` · saves `,g===9?u.length:d.size,` of `,u.length]})]}),t(`div`,{class:`cs-regs-grid`,children:u.map((e,n)=>{let r=g===9||d.has(e);return t(`div`,{class:`cs-reg ${r?`saved`:`skip`}`,style:{animationDelay:`${n*70}ms`},children:e})})}),t(`div`,{class:`muted cs-regs-note fade ${g===10?`on`:``}`,children:`faded: trashed by the call anyway, nothing to save`})]},g):t(`div`,{class:`cs-cols`,children:[t(`div`,{class:`cs-cpu`,children:[t(`div`,{class:`cs-lane ${v.mode===`ring 3`?`on`:``}`,children:[v.mode===`ring 3`?g>=7?`thread B`:`thread A`:`kernel`,` · `,v.mode]}),t(a,{vars:f,state:v,changed:Object.keys(_.st)})]}),t(`div`,{class:`cs-kernel`,children:t(n,{lang:`c`,code:o,hl:_.kernel??[]})})]}),t(`div`,{class:`caption`,children:_.text}),t(`style`,{children:`
        .cs-strip { display: flex; align-items: center; gap: .6em; font-size: .6em; }
        .cs-bar { flex: 1; display: flex; gap: 2px; height: 1.8em; }
        .cs-seg { border-radius: 4px; color: var(--on-color); font-weight: 700; display: flex; align-items: center; justify-content: center;
          animation: cs-in .3s both; }
        @keyframes cs-in { from { opacity: 0; } }
        .cs-legend { font-size: .55em; margin: .3em 0 .8em 4.2em; }
        .cs-cols { display: flex; gap: 1.6em; align-items: flex-start; font-size: .5em; }
        .cs-cpu { flex: 1; }
        .cs-kernel { flex: 1.7; }
        .cs pre { margin: 0; font-size: 1em; }
        .cs-lane { color: var(--muted); margin-bottom: .4em; padding: .2em .5em; border-radius: 6px; background: var(--panel); }
        .cs-lane.on { color: var(--fg); background: var(--hl); }
        .cs .caption { min-height: 3em; }
        .cs-regs { font-size: .6em; }
        .cs-regs-title { margin-bottom: .6em; }
        .cs-regs-grid { display: grid; grid-template-columns: repeat(9, 1fr); gap: .4em; font-family: var(--mono); }
        .cs-reg { padding: .45em 0; text-align: center; border-radius: 6px; background: var(--surface); color: var(--muted); }
        .cs-reg.saved { animation: cs-save .35s both; }
        .cs-reg.skip { animation: cs-skip .35s both; }
        @keyframes cs-save { to { background: ${i.accent}; color: var(--on-color); } }
        @keyframes cs-skip { to { opacity: .25; } }
        .cs-regs-note { margin-top: .6em; font-size: .9em; }
      `})]})}export{g as default};