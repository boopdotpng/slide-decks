"""A sequential RV64IM machine: memory, the fetch/decode/execute loop, and syscalls.

There is one hart (core), and it executes one instruction at a time in program
order. Every memory access is therefore visible immediately, which makes
`fence` a no-op here. Fences only matter with several harts or with devices.

Memory map (the stack and heap addresses are our own choice, Linux-like):

    0x10000 and up   your .rodata, .text, .data and .bss
    heap             1 MB, starting at the first page after the program;
                     usable up to the current "break" (see brk / malloc)
    stack            1 MB, ending at 0x80000000; sp starts near the top
"""

import os
import sys

from . import cpu
from .cpu import ABI, M64, sext

HEAP_SIZE = 1 << 20
STACK_SIZE = 1 << 20
STACK_TOP = 0x8000_0000

# Syscall numbers. The first group is real Linux, so the same program also runs
# under qemu-riscv64. The 1000+ group exists only in this emulator, as shortcuts.
SYS_READ, SYS_WRITE, SYS_EXIT, SYS_EXIT_GROUP, SYS_BRK = 63, 64, 93, 94, 214
SYS_PRINT_INT, SYS_PRINT_HEX, SYS_PRINT_STR, SYS_PRINT_CHAR = 1000, 1001, 1002, 1003
SYS_MALLOC, SYS_FREE = 1004, 1005

VERB = {"r": "load from", "w": "store to", "x": "execute at"}
NOT = {"r": "readable", "w": "writable", "x": "executable"}


class Fault(Exception):
    pass


class Exit(Exception):
    def __init__(self, code):
        self.code = code


class Region:
    def __init__(self, name, base, size, perms, init=b""):
        self.name, self.base, self.perms = name, base, perms
        self.data = bytearray(size)
        self.data[:len(init)] = init
        self.end = base + size     # the heap moves its end as the break changes

    def __repr__(self):
        perms = "".join(c if c in self.perms else "-" for c in "rwx")
        return f"{self.base:#010x}-{self.end:#010x} {perms} {self.name}"


class Memory:
    def __init__(self):
        self.regions = []
        self._last = None

    def find(self, addr, size, perm):
        r = self._last
        if r is None or not (r.base <= addr and addr + size <= r.end):
            for r in self.regions:
                if r.base <= addr and addr + size <= r.end:
                    break
            else:
                raise Fault(self._explain(addr, size, perm))
            self._last = r
        if perm not in r.perms:
            raise Fault(f"{VERB[perm]} {addr:#x}: that is in {r.name}, which is not {NOT[perm]}")
        return r

    def load(self, addr, size, signed=False):
        r = self.find(addr, size, "r")
        off = addr - r.base
        return int.from_bytes(r.data[off:off + size], "little", signed=signed) & M64

    def store(self, addr, size, value):
        r = self.find(addr, size, "w")
        off = addr - r.base
        r.data[off:off + size] = (value & ((1 << 8 * size) - 1)).to_bytes(size, "little")

    def read(self, addr, n):
        r = self.find(addr, n, "r")
        return bytes(r.data[addr - r.base:addr - r.base + n])

    def write(self, addr, data):
        r = self.find(addr, len(data), "w")
        r.data[addr - r.base:addr - r.base + len(data)] = data

    def cstring(self, addr, limit=1 << 16):
        out = bytearray()
        while len(out) < limit:
            b = self.load(addr + len(out), 1)
            if b == 0:
                break
            out.append(b)
        return bytes(out)

    def _explain(self, addr, size, perm):
        msg = f"{VERB[perm]} {addr:#x} ({size} bytes): nothing is there"
        heap = next((r for r in self.regions if r.name == "heap"), None)
        stack = next((r for r in self.regions if r.name == "stack"), None)
        if addr < 0x1000:
            msg += "\n  hint: an address near 0 is usually a NULL pointer or an uninitialized register"
        elif stack and stack.base - 0x10000 <= addr < stack.base:
            msg += "\n  hint: just below the stack, so this is a stack overflow (runaway recursion?)"
        elif stack and stack.end <= addr < stack.end + 0x1000:
            msg += "\n  hint: just above the top of the stack; did you pop more than you pushed?"
        elif heap and heap.base <= addr < heap.base + HEAP_SIZE:
            msg += (f"\n  hint: inside the heap area but past the break ({heap.end:#x});"
                    " allocate it first with malloc or brk")
        else:
            for r in self.regions:
                if r.end <= addr < r.end + 0x100:
                    msg += f"\n  hint: just past the end of {r.name}"
        return msg + "\n  memory map:\n" + "\n".join(f"    {r}" for r in self.regions)


class Machine:
    def __init__(self, program, out=None):
        self.program = program
        self.out = out or sys.stdout.buffer
        self.x = [0] * 32
        self.pc = program.entry
        self.steps = 0
        self.mem = Memory()
        self.icache = {}

        for s in program.sections:
            perms = "r" + ("w" if s.writable else "") + ("x" if s.executable else "")
            self.mem.regions.append(Region(s.name, s.addr, len(s.data), perms, s.data))
        end = max(r.end for r in self.mem.regions)
        heap_base = (end + 0xfff) & ~0xfff
        self.heap = Region("heap", heap_base, HEAP_SIZE, "rw")
        self.heap.end = heap_base               # empty until brk/malloc grows it
        self.mem.regions.append(self.heap)
        self.mem.regions.append(Region("stack", STACK_TOP - STACK_SIZE, STACK_SIZE, "rw"))
        # Linux starts sp at argc/argv/envp; here they are all zero (no arguments).
        self.x[2] = STACK_TOP - 32
        self._last_dump = list(self.x)          # dumps mark changes relative to this

    # -- running ------------------------------------------------------------

    def run(self, max_steps=10_000_000):
        """Run until exit. Returns the exit code; raises Fault on errors."""
        try:
            while self.steps < max_steps:
                self.step()
            raise Fault(f"stopped after {max_steps:,} instructions (infinite loop?)")
        except Exit as e:
            return e.code

    def fetch(self, pc):
        inst = self.icache.get(pc)
        if inst is None:
            if pc & 3:
                raise Fault(f"jump to misaligned address {pc:#x}")
            r = self.mem.find(pc, 4, "x")
            word = int.from_bytes(r.data[pc - r.base:pc - r.base + 4], "little")
            try:
                inst = cpu.decode(word)
            except cpu.IllegalInstruction as e:
                raise Fault(f"illegal instruction at {pc:#x}: {e}") from None
            self.icache[pc] = inst   # safe: code is not writable
        return inst

    def step(self):
        pc = self.pc
        inst = self.fetch(pc)
        x = self.x
        f, n = inst.fmt, inst.name
        next_pc = pc + 4
        rd_value = None

        if f == "R":
            rd_value = cpu.ALU[n](x[inst.rs1], x[inst.rs2])
        elif f in ("I", "IS", "ISW"):
            rd_value = cpu.ALU[cpu.ALU_IMM[n]](x[inst.rs1], inst.imm & M64)
        elif f == "L":
            size, signed = cpu.LOAD[n]
            rd_value = self.mem.load((x[inst.rs1] + inst.imm) & M64, size, signed)
        elif f == "S":
            self.mem.store((x[inst.rs1] + inst.imm) & M64, cpu.STORE[n], x[inst.rs2])
        elif f == "B":
            if cpu.BRANCH[n](x[inst.rs1], x[inst.rs2]):
                next_pc = (pc + inst.imm) & M64
        elif f == "U":
            rd_value = inst.imm if n == "lui" else pc + inst.imm
        elif f == "J":
            rd_value = pc + 4
            next_pc = (pc + inst.imm) & M64
        elif f == "JALR":
            rd_value = pc + 4
            next_pc = (x[inst.rs1] + inst.imm) & M64 & ~1
        elif f == "FENCE":
            pass                       # one hart, in-order memory: nothing to wait for
        elif n == "ecall":
            self.syscall()
        elif n == "ebreak":
            where = self.program.ebreak_lines.get(pc) or self.where(pc)
            self.dump_registers(f"ebreak at {where}")

        if rd_value is not None and inst.rd:   # writes to x0 are discarded
            x[inst.rd] = rd_value & M64
        self.steps += 1
        self.pc = next_pc

    # -- syscalls -----------------------------------------------------------

    def syscall(self):
        x = self.x
        n, a0, a1, a2 = x[17], x[10], x[11], x[12]
        if n == SYS_WRITE:
            data = self.mem.read(a1, a2)
            if a0 not in (1, 2):
                return self._ret(-9)                  # -EBADF: only stdout and stderr
            stream = self.out if a0 == 1 else sys.stderr.buffer
            stream.write(data)
            stream.flush()
            return self._ret(len(data))
        if n == SYS_READ:
            if a0 != 0:
                return self._ret(-9)                  # only stdin
            data = os.read(0, a2)
            self.mem.write(a1, data)
            return self._ret(len(data))
        if n in (SYS_EXIT, SYS_EXIT_GROUP):
            raise Exit(a0 & 0xff)
        if n == SYS_BRK:
            return self._ret(self.brk(a0))
        if n == SYS_MALLOC:
            ptr = (self.heap.end + 15) & ~15          # 16-byte aligned, like real malloc
            return self._ret(ptr if self.brk(ptr + a0) == ptr + a0 else 0)
        if n == SYS_FREE:
            return                                    # this malloc never reuses memory
        if n == SYS_PRINT_INT:
            return self._print(str(sext(a0, 64)))
        if n == SYS_PRINT_HEX:
            return self._print(f"{a0:#x}")
        if n == SYS_PRINT_STR:
            return self._print(self.mem.cstring(a0))
        if n == SYS_PRINT_CHAR:
            return self._print(bytes([a0 & 0xff]))
        raise Fault(f"unknown syscall number {sext(n, 64)} in a7. Supported: "
                    "63 read, 64 write, 93 exit, 214 brk, 1000 print_int, 1001 print_hex, "
                    "1002 print_str, 1003 print_char, 1004 malloc, 1005 free")

    def brk(self, addr):
        """Linux semantics: brk(0) asks for the current break; a bad request
        leaves it unchanged. Either way, the result is the current break."""
        if self.heap.base <= addr <= self.heap.base + HEAP_SIZE:
            self.heap.end = addr
            self.mem._last = None
        return self.heap.end

    def _ret(self, value):
        self.x[10] = value & M64

    def _print(self, text):
        self.out.write(text.encode() if isinstance(text, str) else text)
        self.out.flush()

    # -- display ------------------------------------------------------------

    def where(self, addr):
        label = self.program.label(addr)
        return f"{addr:#x} <{label}>" if label else f"{addr:#x}"

    def describe_pointer(self, value):
        """If value looks like an address, say what it points at."""
        if value < 0x1000:
            return ""
        r = next((r for r in self.mem.regions if r.base <= value < r.end), None)
        if r is None:
            return ""
        if r is self.heap:
            off = value - r.base
            return f"-> heap+{off:#x}" if off else "-> heap (start)"
        if r.name == "stack":
            return "-> stack"
        return f"-> {self.program.label(value) or r.name}"

    def dump_registers(self, title):
        """All 32 registers. * marks the ones that changed since the last dump."""
        sys.stdout.flush()
        rows = []
        for r in range(32):
            v, signed = self.x[r], sext(self.x[r], 64)
            points_to = self.describe_pointer(v)
            # Hex only where it helps: addresses, big numbers, negative numbers.
            hex_ = f"{v:#x}" if points_to or signed < 0 or signed >= 4096 else ""
            mark = "*" if v != self._last_dump[r] else " "
            rows.append((mark, f"x{r:<2} {ABI[r]:<4}", str(signed), hex_, points_to))
        dec_w = max(len(row[2]) for row in rows)
        hex_w = max(len(row[3]) for row in rows)
        lines = ["", f"── {title} ──"]
        for mark, name, dec, hex_, points_to in rows:
            lines.append(f"{mark} {name}  {dec:>{dec_w}}  {hex_:<{hex_w}}  {points_to}".rstrip())
        lines.append("(* = changed since the previous dump)")
        print("\n".join(lines), file=sys.stderr)
        self._last_dump = list(self.x)
