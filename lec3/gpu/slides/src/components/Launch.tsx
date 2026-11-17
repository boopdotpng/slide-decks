/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from 'slides/hooks';

/**
 * What brighten<<<46875, 256>>>(gimg, n, 2) sets off, left to right. The packet is the real one (hsa_kernel_dispatch_packet_t,
 * 64 bytes, from rocm's hsa.h); the values are our launch: 46,875 blocks of 256 = 12,000,000 threads, one per pixel of
 * a 12 MP photo (the packet counts threads, not blocks). Who does what: llvm's amdgpu docs (the command processor reads the queue and sets up the
 * waves), hip's runtime source (fills the packet, rings the doorbell), the linux amdgpu docs (the doorbell wakes
 * the gpu's firmware; the kernel driver only sets the queue up).
 */
const STAGES: { t: string; d: ComponentChildren }[] = [
  { t: 'compile', d: <>hipcc builds a normal cpu program with the gpu's instructions packed inside it</> },
  { t: 'launch', d: <>hip's runtime writes the arguments into memory the gpu can read, and fills in a 64-byte <b>packet</b></> },
  { t: 'queue', d: <>the packet goes into a ring of packets in memory the gpu can read. then one write to a device register: the <b>doorbell</b></> },
  { t: 'the gpu', d: <>its command processor reads the packet, walks the grid, and starts waves on the wgps with their registers filled in</> },
  { t: 'done', d: <>when the last wave ends, the gpu flips a <b>signal</b> in memory. whoever was waiting on the cpu wakes up</> },
];
const PACKET: [string, string, string][] = [
  ['workgroup_size_x', '256', 'threads per block'],
  ['grid_size_x', '12,000,000', 'threads in all: 46,875 blocks'],
  ['group_segment_size', '0', 'bytes of lds per block'],
  ['kernel_object', '→ brighten', 'where the kernel is'],
  ['kernarg_address', '→ gimg, n, 2', 'where the arguments are'],
  ['completion_signal', '→ a signal', 'what to flip at the end'],
];
const TEXT: ComponentChildren[] = [
  <>before anything runs: the kernel is compiled for this gpu (gfx1201) and travels inside your program</>,
  <>the launch itself is small. no data moves: the packet says how big the grid is and <i>where</i> things are</>,
  <>no system call, no driver in the way. the operating system set this queue up once, when the program started. after that, a launch is a few writes to memory</>,
  <>this is where every wave gets its thread numbers and its block number: the <code>threadIdx</code> and <code>blockIdx</code> the kernel reads</>,
  <>that's why the launch returned at once, and why reading the answer back has to wait</>,
];

export default function Launch() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STAGES.length - 1, useSlideStep(root));
  return (
    <div class="launch" ref={root}>
      <div class="lc-chain">
        {STAGES.map((s, i) => (
          <div class={`lc-st ${i <= k ? 'on' : ''} ${i === k ? 'cur' : ''}`}>
            <div class="lc-n">{i + 1} · {s.t}</div>
            <div class="lc-d">{s.d}</div>
          </div>
        ))}
      </div>
      <div class={`lc-pkt fade ${k >= 1 ? 'on' : ''}`}>
        <div class="muted lc-pt">the packet for <code>brighten&lt;&lt;&lt;46875, 256&gt;&gt;&gt;(gimg, n, 2)</code></div>
        <table><tbody>
          {PACKET.map(([f, v, n]) => <tr><td class="lc-f">{f}</td><td class="lc-v">{v}</td><td class="muted">{n}</td></tr>)}
        </tbody></table>
      </div>
      <div class="caption lc-text">{TEXT[k]}</div>
      <style>{`
        .launch .lc-chain { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        .launch .lc-st { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: .6em .7em; opacity: .25;
          transition: opacity .4s, border-color .4s, background .4s; }
        .launch .lc-st.on { opacity: 1; } .launch .lc-st.cur { border-color: var(--accent); background: var(--tint-blue); }
        .launch .lc-n { font-size: .52em; color: var(--accent); text-transform: uppercase; letter-spacing: .08em; margin-bottom: .3em; }
        .launch .lc-d { font-size: .54em; line-height: 1.35; }
        .launch .lc-pkt { margin-top: 1em; font-size: .54em; }
        .launch .lc-pt { margin-bottom: .3em; } .launch .lc-pt code { background: none; padding: 0; }
        .launch .lc-pkt td { padding: .16em 1.6em .16em 0; }
        .launch .lc-f { font-family: var(--mono); } .launch .lc-v { font-family: var(--mono); color: var(--hot); }
        .launch .lc-text { font-size: .76em; min-height: 3.2em; margin-top: .8em; }
      `}</style>
    </div>
  );
}
