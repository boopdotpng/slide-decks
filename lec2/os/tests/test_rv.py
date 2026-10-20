"""Run with:  python3.15 -m unittest discover tests   (needs llvm-mc and ld.lld)"""

import io
import random
import subprocess
import sys
import tempfile
import unittest
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from rv.machine import Fault, Machine         # noqa: E402
from rv.program import BuildError, assemble   # noqa: E402

M64, M32 = 2**64 - 1, 2**32 - 1


def s64(v):
    v &= M64
    return v - 2**64 if v >= 2**63 else v


def s32(v):
    v &= M32
    return v - 2**32 if v >= 2**31 else v


def tdiv(a, b):
    return int(Fraction(a, b))     # int() of a Fraction truncates toward zero


# Reference semantics, written straight from the spec (independently of rv/cpu.py).
def ref(op, a, b):
    sa, sb, ua, ub = s64(a), s64(b), a & M64, b & M64
    wa, wb, uwa, uwb = s32(a), s32(b), a & M32, b & M32
    return {
        "add": lambda: sa + sb, "sub": lambda: sa - sb,
        "sll": lambda: ua << (ub % 64), "srl": lambda: ua >> (ub % 64), "sra": lambda: sa >> (ub % 64),
        "slt": lambda: int(sa < sb), "sltu": lambda: int(ua < ub),
        "xor": lambda: ua ^ ub, "or": lambda: ua | ub, "and": lambda: ua & ub,
        "mul": lambda: sa * sb, "mulh": lambda: (sa * sb) >> 64,
        "mulhsu": lambda: (sa * ub) >> 64, "mulhu": lambda: (ua * ub) >> 64,
        "div": lambda: -1 if sb == 0 else sa if (sa, sb) == (-2**63, -1) else tdiv(sa, sb),
        "divu": lambda: M64 if ub == 0 else ua // ub,
        "rem": lambda: sa if sb == 0 else 0 if (sa, sb) == (-2**63, -1) else sa - sb * tdiv(sa, sb),
        "remu": lambda: ua if ub == 0 else ua % ub,
        "addw": lambda: s32(wa + wb), "subw": lambda: s32(wa - wb),
        "sllw": lambda: s32(uwa << (ub % 32)), "srlw": lambda: s32(uwa >> (ub % 32)),
        "sraw": lambda: wa >> (ub % 32), "mulw": lambda: s32(wa * wb),
        "divw": lambda: -1 if wb == 0 else s32(tdiv(wa, wb)),
        "divuw": lambda: -1 if uwb == 0 else s32(uwa // uwb),
        "remw": lambda: wa if wb == 0 else s32(wa - wb * tdiv(wa, wb)),
        "remuw": lambda: wa if uwb == 0 else s32(uwa % uwb),
    }[op]() & M64


EDGES = [0, 1, 2, 3, 7, -1, -2, -7, 2**63 - 1, -2**63, 2**31 - 1, -2**31, 2**31, 2**32 - 1, 2**32, 63, 64]
R_OPS = ["add", "sub", "sll", "srl", "sra", "slt", "sltu", "xor", "or", "and",
         "mul", "mulh", "mulhsu", "mulhu", "div", "divu", "rem", "remu",
         "addw", "subw", "sllw", "srlw", "sraw", "mulw", "divw", "divuw", "remw", "remuw"]


def run_source(src, stdout=None):
    """Assemble + link + run; returns (machine, exit code)."""
    with tempfile.TemporaryDirectory() as d:
        path = Path(d) / "t.s"
        path.write_text(src)
        program = assemble(path)
    m = Machine(program, out=stdout or io.BytesIO())
    return m, m.run(1_000_000)


def program(body, data=""):
    return f"""
    .data
{data}
    .bss
    .align 3
results: .zero 65536
    .text
    .globl _start
_start:
    la s0, results
{body}
    li a0, 0
    li a7, 93
    ecall
"""


class Alu(unittest.TestCase):
    def check(self, cases, emit):
        body = "\n".join(emit(*c) + "\n    sd a2, 0(s0)\n    addi s0, s0, 8" for c in cases)
        m, code = run_source(program(body))
        self.assertEqual(code, 0)
        base = m.program.symbols["results"]
        for i, case in enumerate(cases):
            with self.subTest(case=case):
                self.assertEqual(m.mem.load(base + 8 * i, 8), case[-1], f"{case[0]} {case[1:-1]}")

    def test_register_ops(self):
        rnd = random.Random(7)
        vals = EDGES + [rnd.getrandbits(64) for _ in range(6)] + [s64(rnd.getrandbits(33)) for _ in range(3)]
        cases = [(op, a & M64, b & M64, ref(op, a, b))
                 for op in R_OPS for a in vals[::2] for b in vals[1::2] + [0, -1, 5]]
        self.check(cases, lambda op, a, b, _:
                   f"    li a0, {s64(a)}\n    li a1, {s64(b)}\n    {op} a2, a0, a1")

    def test_immediate_ops(self):
        rnd = random.Random(8)
        cases = []
        for a in EDGES + [rnd.getrandbits(64) for _ in range(5)]:
            for imm in [0, 1, -1, 2047, -2048, 5]:
                for op, base in [("addi", "add"), ("slti", "slt"), ("sltiu", "sltu"),
                                 ("xori", "xor"), ("ori", "or"), ("andi", "and"), ("addiw", "addw")]:
                    cases.append((op, a & M64, imm, ref(base, a, imm)))
            for sh in [0, 1, 31, 32, 63]:
                for op, base in [("slli", "sll"), ("srli", "srl"), ("srai", "sra")]:
                    cases.append((op, a & M64, sh, ref(base, a, sh)))
                if sh < 32:
                    for op, base in [("slliw", "sllw"), ("srliw", "srlw"), ("sraiw", "sraw")]:
                        cases.append((op, a & M64, sh, ref(base, a, sh)))
        self.check(cases, lambda op, a, imm, _: f"    li a0, {s64(a)}\n    {op} a2, a0, {imm}")


class Programs(unittest.TestCase):
    def test_loads_sign_extend(self):
        m, _ = run_source(program("""
    la t0, bytes
    lb  s1, 0(t0)
    lbu s2, 0(t0)
    lh  s3, 0(t0)
    lhu s4, 0(t0)
    lw  s5, 0(t0)
    lwu s6, 0(t0)
    ld  s7, 0(t0)
    lw  s8, 4(t0)""", "bytes: .dword 0x7fff0000ffff80f0"))
        x = m.x
        self.assertEqual([x[9]] + x[18:25], [s64(-16) & M64, 0xf0, s64(-0x7f10) & M64, 0x80f0,
                                    s64(-0x7f10) & M64, 0xffff80f0, 0x7fff0000ffff80f0, 0x7fff0000])

    def test_call_and_stack(self):
        m, _ = run_source(program("""
    li a0, 20
    call fib
    mv s1, a0
    li a0, 0
    li a7, 93
    ecall
fib:                    # naive recursive fib: exercises the stack hard
    li t0, 2
    blt a0, t0, 1f
    addi sp, sp, -32
    sd ra, 24(sp)
    sd s0, 16(sp)
    sd s1, 8(sp)
    mv s0, a0
    addi a0, a0, -1
    call fib
    mv s1, a0
    addi a0, s0, -2
    call fib
    add a0, a0, s1
    ld ra, 24(sp)
    ld s0, 16(sp)
    ld s1, 8(sp)
    addi sp, sp, 32
1:  ret"""))
        self.assertEqual(m.x[9], 6765)
        self.assertEqual(m.x[2], 0x8000_0000 - 32)   # sp balanced

    def test_malloc_and_brk(self):
        m, _ = run_source(program("""
    li a0, 100
    li a7, 1004
    ecall
    mv s1, a0
    li a0, 1
    li a7, 1004
    ecall
    mv s2, a0
    li a0, 2000000
    li a7, 1004
    ecall
    mv s3, a0           # too big: 0
    li a0, 0
    li a7, 214
    ecall
    mv s4, a0"""))
        s1, s2, s3, s4 = m.x[9], m.x[18], m.x[19], m.x[20]
        self.assertEqual(s1 % 4096, 0)
        self.assertEqual(s2, s1 + 112)                # 100 rounded up to 16
        self.assertEqual(s3, 0)
        self.assertEqual(s4, s2 + 1)

    def test_output_syscalls(self):
        out = io.BytesIO()
        run_source(program("""
    li a0, -42
    li a7, 1000
    ecall
    li a0, 255
    li a7, 1001
    ecall
    la a0, msg
    li a7, 1002
    ecall
    li a0, 1
    la a1, msg
    li a2, 2
    li a7, 64
    ecall""", 'msg: .asciz "hi!"'), stdout=out)
        self.assertEqual(out.getvalue(), b"-420xffhi!hi")

    def assertFaults(self, body, text, data=""):
        with self.assertRaises(Fault) as cm:
            run_source(program(body, data))
        self.assertIn(text, str(cm.exception))

    def test_faults(self):
        self.assertFaults("    ld a0, 0(zero)", "NULL pointer")
        self.assertFaults("    la t0, _start\n    sw zero, 0(t0)", "not writable")
        self.assertFaults("1:  addi sp, sp, -16\n    sd zero, 0(sp)\n    j 1b", "stack overflow")
        self.assertFaults("    li a0, 16\n    li a7, 1004\n    ecall\n    ld t0, 16(a0)", "past the break")
        self.assertFaults("    li a7, 12345\n    ecall", "unknown syscall")
        self.assertFaults("    la t0, x\n    jr t0", "not executable", "x: .word 0x13")


class Assemble(unittest.TestCase):
    def test_missing_start(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "t.s"
            path.write_text("main:\n    nop\n")
            with self.assertRaisesRegex(BuildError, "no _start"):
                assemble(path)

    def test_ebreak_lines(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "t.s"
            path.write_text(".globl _start\n_start:\n  nop\n  ebreak  # one\nx: ebreak\n# ebreak\n")
            program = assemble(path)
        self.assertEqual(sorted(program.ebreak_lines.values()), ["t.s:4", "t.s:5"])


class CompiledC(unittest.TestCase):
    def test_sum_c(self):
        with tempfile.TemporaryDirectory() as d:
            for name in ("sum.c", "rv.h"):
                (Path(d) / name).write_text((ROOT / "compiled" / name).read_text())
            subprocess.run([str(ROOT / "compile.sh"), str(Path(d) / "sum.c")], check=True,
                           capture_output=True)
            r = subprocess.run([str(ROOT / "rv.sh"), "run", str(Path(d) / "sum.s")],
                               capture_output=True, text=True)
        self.assertEqual((r.returncode, r.stdout), (0, "sum = 31\n"), r.stderr[-2000:])


class Examples(unittest.TestCase):
    EXPECTED = {"01_hello": (0, "hello, world\n"), "03_sections": (0, "counter = 42\n"),
                "04_loop": (55, "55\n"), "05_functions": (0, "3628800\n"),
                "06_heap": (0, "0 1 4 9 16 25 36 49 64 81 \n"), "02_registers": (0, "")}

    def test_examples(self):
        for name, (code, output) in self.EXPECTED.items():
            with self.subTest(example=name):
                r = subprocess.run([str(ROOT / "rv.sh"), "run", str(ROOT / "examples" / f"{name}.s")],
                                   capture_output=True, text=True)
                self.assertEqual((r.returncode, r.stdout), (code, output), r.stderr[-2000:])


if __name__ == "__main__":
    unittest.main()
