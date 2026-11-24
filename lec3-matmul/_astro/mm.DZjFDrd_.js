import{n as e}from"./hooks.5GiSEWoZ.js";function t({m:t,n,k:r,a:i,b:a,c:o,cell:s=22,names:c=[`A`,`B`,`C`],tag:l}){let u=(t,n,r)=>e(`div`,{class:`mm-g`,style:{gridTemplateColumns:`repeat(${n}, ${s}px)`,gridAutoRows:`${s}px`},children:Array.from({length:t*n},(t,i)=>e(`i`,{class:r(Math.floor(i/n),i%n)}))});return e(`div`,{class:`mm`,children:[e(`div`,{class:`mm-tag`,children:l}),e(`div`,{class:`mm-wrap`,children:[u(n,r,a),e(`div`,{class:`mm-n`,children:c[1]})]}),e(`div`,{class:`mm-wrap`,children:[u(t,n,i),e(`div`,{class:`mm-n`,children:c[0]})]}),e(`div`,{class:`mm-wrap`,children:[u(t,r,o),e(`div`,{class:`mm-n`,children:c[2]})]})]})}var n=`
  .mm { display: grid; grid-template-columns: auto auto; gap: 10px 14px; align-items: end; justify-content: center; }
  .mm-tag { align-self: center; justify-self: end; font-size: .44em; max-width: 9em; }
  .mm-wrap { display: flex; flex-direction: column; align-items: center; }
  .mm-g { display: grid; gap: 2px; }
  .mm-g i { border-radius: 2px; background: var(--surface); transition: background .3s, opacity .3s, box-shadow .3s; }
  .mm-n { font: .44em var(--mono); color: var(--muted); margin-top: .35em; white-space: nowrap; }
`;export{n,t};