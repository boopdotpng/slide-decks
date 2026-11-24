import{t as e}from"./hooks.module.U3JihANK.js";import{c as t,o as n,r}from"./hooks.DjY2cg7H.js";import{S as i,v as a}from"./viz.BpU9tPyD.js";var o=`
write(1, msg, 13);
exit(0);`,s=`
// entry points here (set at boot)
syscall_entry:
    save_registers(f);
    switch (f->rax) {
    case 1:  // write
        f->rax = sys_write(f->rdi, f->rsi, f->rdx);
    case 60: // exit
        sys_exit(f->rdi);
    }
    restore_registers(f);
    sysret;                     // back to ring 3

sys_write(fd, buf, len):
    if (!user_memory(buf, len)) return -EFAULT;
    terminal_write(buf, len);   // device driver
    return len;`,c=`0xffffffff81c00000`,l={mode:`ring 3`,pc:`0x11144`,saved:`—`,rax:`1`,rdi:`1`,entry:c},u=[{user:[0],st:{},text:`your program reaches the syscall instruction with rax = 1 (write), rdi = 1 (fd), rsi = msg, rdx = 13`},{kernel:[0,1],st:{mode:`ring 0`,pc:c,saved:`0x11146`},text:`the cpu does this by itself, in one step: save the next pc, switch to ring 0, jump to entry. the kernel set entry at boot (the LSTAR register): you don't pick where you land`},{kernel:[2],st:{},text:`save every register into a trap frame: the kernel needs them, and must hand them back untouched`},{kernel:[3,4,5],st:{},text:`dispatch on rax: 1 → sys_write(fd = 1, buf = 0x10120, len = 13)`},{kernel:[13],st:{},text:`never trust a pointer from user code: is 0x10120 … +13 really your memory? if not, return -EFAULT instead of crashing`},{kernel:[5,14,15],st:{},out:!0,text:`hand the bytes to the terminal driver. the return value (13 bytes written) goes into the saved rax`},{kernel:[9],st:{rax:`13`},text:`put your registers back (rax is now 13)`},{user:[1],kernel:[10],st:{mode:`ring 3`,pc:`0x11146`},text:`back to ring 3 at the saved pc (sysret). to your program, syscall looked like one very slow instruction`},{st:{},text:``},{user:[1],kernel:[6,7],st:{rax:`60`,rdi:`0`},text:`then exit(0): rax = 60, rdi = 0, syscall. the same trip, but sys_exit never returns. the kernel frees your memory and runs something else`}],d=[{name:`mode`},{name:`pc`},{name:`saved`,note:`pc to return to`},{name:`rax`,note:`syscall # / result`,reg:!0},{name:`rdi`,note:`1st arg`,reg:!0},{name:`entry`,note:`set at boot`}],f=[[`change entry`,`only ring 0 may. from ring 3 → fault`],[`jump / load into kernel memory`,`→ page fault. kernel pages don't have the u bit`],[`syscall`,`is the only door, and it always lands at entry, where the kernel checks everything`]];function p(){let c=e(null),p=r(c),m=u[p],h=Object.assign({},l,...u.slice(0,p+1).map(e=>e.st)),g=u.slice(0,p+1).some(e=>e.out);return t(`div`,{class:`sys`,ref:c,children:[t(`div`,{class:`cols`,children:[t(`div`,{class:`col left`,children:[t(`div`,{class:`lane ${h.mode===`ring 3`?`on`:``}`,children:`user · ring 3`}),t(n,{lang:`c`,code:o,hl:m.user??[]}),t(`div`,{class:`lane on`,children:`cpu`}),t(i,{vars:d,state:h,changed:Object.keys(m.st)}),t(a,{lines:g?[`$ ./hello`,`hello, world`]:[`$ ./hello`]})]}),t(`div`,{class:`col kernel`,children:[t(`div`,{class:`lane ${h.mode===`ring 0`?`on`:``}`,children:`kernel · ring 0`}),t(n,{lang:`c`,code:s,hl:m.kernel??[]})]})]}),p===8?t(`div`,{class:`cheat`,children:[t(`strong`,{children:`why can't you just cheat?`}),f.map(([e,n])=>t(`div`,{children:[t(`code`,{children:e}),` `,t(`span`,{class:`muted`,children:n})]}))]}):t(`div`,{class:`caption`,children:m.text}),t(`style`,{children:`
        /* code size follows the slide's width, so the kernel code always fits its box */
        .sys { container-type: inline-size; }
        .sys .cols { display: flex; gap: 2.4cqi; align-items: flex-start; font-size: min(1.55cqi, 2.3cqh); }
        .sys .col.left { flex: none; display: flex; flex-direction: column; }
        .sys .col.kernel { flex: 1; min-width: 0; }
        .sys pre { margin: 0; font-size: 1em; }
        .sys .col.kernel pre { padding: .7em .6em; }
        .sys .left pre.code { margin-bottom: 1.2em; }
        .sys .state-table td { padding: .12em .9em .12em .4em; }
        .sys .term { margin-top: 1em; }
        .sys .lane { font-family: var(--sans); color: var(--muted); margin-bottom: .4em; padding: .2em .5em; border-radius: 6px; transition: background .3s, color .3s; }
        .sys .lane.on { color: var(--fg); background: var(--hl); }
        .sys .caption { margin-top: .8em; color: var(--fg); font-size: .75em; min-height: 3em; }
        .sys .cheat { margin-top: .6em; font-size: .7em; display: flex; flex-direction: column; gap: .3em; }
      `})]})}export{p as default};