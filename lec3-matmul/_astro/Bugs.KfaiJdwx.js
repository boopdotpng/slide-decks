import{r as e}from"./preact.module.Bl7PEaKa.js";import{t}from"./hooks.module.BNbONuGS.js";import{n,t as r}from"./hooks.5GiSEWoZ.js";import{t as i}from"./Code.Cy3pb0ne.js";var a=[{code:`if ((k < K) && (m < M)) {
  float sum = 0;
  for (int n = 0; n < N; n++)
    sum += A[m*N + n] * B[n*K + k];
  C[idx] += sum;
}`,hl:[4],text:n(e,{children:[n(`code`,{children:`+=`}),` adds onto whatever was already in C. it only passes because leetgpu's C starts out as zeros. use `,n(`code`,{children:`=`})]})},{code:`__global__ void matmul(const float* A, const float* B, float* C,
                       int N, int M, int K) {
  ...
  if (i < N && j < K) {
    for (int k = 0; k < M; ++k)
      csum += A[i * M + k] * B[k * K + j];

matmul<<<grid, block>>>(A, B, C, M, N, K);`,hl:[1,7],text:n(e,{children:`the call sends (M, N, K), but the kernel calls them (N, M, K). they're swapped everywhere, so it happens to work, until someone edits it`})},{code:`int row = blockIdx.x * blockDim.x + threadIdx.x;   // row on x
int col = blockIdx.y * blockDim.y + threadIdx.y;   // col on y
...
sum += A[row * N + i] * B[i * K + col];`,hl:[0,1],text:n(e,{children:`right answer, but slow. threads next to each other in x should read numbers next to each other. with x as the row, each read is a whole row apart`})}],o=[19,22,43,50];function s(){let e=t(null),s=Math.min(a.length-1,r(e)),c=a[s];return n(`div`,{class:`bugs`,ref:e,children:[n(`div`,{class:`bg-cols`,children:[n(`div`,{class:`bg-code`,children:n(i,{lang:`cpp`,code:c.code,hl:c.hl})}),n(`div`,{class:`bg-pic`,children:[n(`div`,{class:`bg-plus fade ${s===0?`on`:``}`,children:[0,1].map(e=>n(`div`,{class:`bg-case`,children:[n(`div`,{class:`muted bg-cap`,children:[`C starts at `,e]}),n(`div`,{class:`bg-c`,children:o.map(t=>n(`i`,{class:e?`bad`:`good`,children:t+e}))}),n(`div`,{class:`bg-mark ${e?`bad`:`good`}`,children:e?`✗`:`✓`})]}))}),n(`div`,{class:`bg-swap fade ${s===1?`on`:``}`,children:[n(`div`,{class:`bg-row`,children:[n(`span`,{class:`muted`,children:`call`}),[`M`,`N`,`K`].map(e=>n(`b`,{children:e}))]}),n(`div`,{class:`bg-row bg-arrows`,children:[n(`span`,{}),[`↓`,`↓`,`↓`].map(e=>n(`i`,{children:e}))]}),n(`div`,{class:`bg-row`,children:[n(`span`,{class:`muted`,children:`kernel`}),[`N`,`M`,`K`].map((e,t)=>n(`b`,{class:t<2?`bad`:``,children:e}))]}),n(`div`,{class:`muted bg-cap bg-note`,children:`two wrong names, used consistently wrong`})]}),n(`div`,{class:`bg-mem fade ${s===2?`on`:``}`,children:[{name:`x = column: B[i * K + col]`,step:1,good:!0},{name:`x = row: A[row * N + i]`,step:8,good:!1}].map(e=>n(`div`,{class:`bg-strip`,children:[n(`div`,{class:`muted bg-cap`,children:e.name}),n(`div`,{class:`bg-cells`,children:Array.from({length:64},(t,r)=>n(`i`,{class:r%e.step===0&&r/e.step<8?e.good?`good`:`bad`:``}))}),n(`div`,{class:`bg-cap ${e.good?`c-good`:`c-bad`}`,children:e.good?`one trip to memory`:`one trip per thread`})]}))})]})]}),n(`div`,{class:`caption bg-text`,children:c.text}),n(`style`,{children:`
        .bugs .bg-cols { display: flex; gap: 1.6em; align-items: center; }
        .bugs .bg-code { flex: 1; min-width: 0; }
        .bugs .bg-code pre { margin: 0; font-size: .54em; overflow: hidden; }
        .bugs .bg-pic { flex: none; width: 560px; display: grid; align-items: center; }
        .bugs .bg-plus, .bugs .bg-swap, .bugs .bg-mem { grid-area: 1 / 1; }
        .bugs .bg-plus { display: flex; gap: 2em; justify-content: center; }
        .bugs .bg-case { display: flex; flex-direction: column; align-items: center; }
        .bugs .bg-cap { font-size: .42em; margin-bottom: .4em; }
        .bugs .bg-c { display: grid; grid-template-columns: repeat(2, 2.2em); grid-auto-rows: 2.2em; gap: 4px; }
        .bugs .bg-c i { display: grid; place-items: center; font: 700 .6em var(--mono); font-style: normal; border-radius: 5px; color: var(--fg); }
        .bugs .bg-c i.good { background: color-mix(in srgb, var(--good) 35%, var(--surface)); }
        .bugs .bg-c i.bad { background: color-mix(in srgb, var(--bad) 35%, var(--surface)); }
        .bugs .bg-mark { font-size: .9em; margin-top: .2em; }
        .bugs .good.bg-mark, .bugs .c-good { color: var(--good); }
        .bugs .bad.bg-mark, .bugs .c-bad { color: var(--bad); }
        .bugs .bg-swap { justify-self: center; }
        .bugs .bg-row { display: grid; grid-template-columns: 4em repeat(3, 1.6em); align-items: center; font: 1em var(--mono); text-align: center; }
        .bugs .bg-row span { font-size: .6em; text-align: right; padding-right: 1em; }
        .bugs .bg-row b.bad { color: var(--bad); }
        .bugs .bg-arrows i { font-style: normal; color: var(--muted); }
        .bugs .bg-note { margin-top: 1em; text-align: center; }
        .bugs .bg-mem { display: grid; gap: 1.4em; }
        .bugs .bg-cells { display: grid; grid-template-columns: repeat(64, 1fr); gap: 1px; height: 22px; }
        .bugs .bg-cells i { background: var(--surface); }
        .bugs .bg-cells i.good { background: var(--good); } .bugs .bg-cells i.bad { background: var(--bad); }
        .bugs .bg-strip .bg-cap:last-child { margin: .4em 0 0; }
        .bugs .bg-text { font-size: .8em; min-height: 2.4em; margin-top: 1em; }
      `})]})}export{s as default};