"""RV64IM instruction decoding, semantics, and disassembly.

Every instruction is 32 bits. The low 7 bits (the *opcode*) pick a group, and
funct3 / funct7 pick the exact operation. The six formats differ only in where
the immediate's bits are stored:

    R   funct7  | rs2 | rs1 | funct3 | rd       | opcode    add x1, x2, x3
    I   imm[11:0]     | rs1 | funct3 | rd       | opcode    addi, loads, jalr
    S   imm[11:5] | rs2 | rs1 | funct3 | imm[4:0] | opcode  stores
    B   like S, but the immediate is a branch offset (always even)
    U   imm[31:12]                   | rd       | opcode    lui, auipc
    J   imm[20|10:1|11|19:12]        | rd       | opcode    jal

Registers hold unsigned 64-bit Python ints; `sext` reinterprets them as signed.
"""

from dataclasses import dataclass

M64 = (1 << 64) - 1
M32 = (1 << 32) - 1

ABI = ["zero", "ra", "sp", "gp", "tp", "t0", "t1", "t2",
       "s0", "s1", "a0", "a1", "a2", "a3", "a4", "a5",
       "a6", "a7", "s2", "s3", "s4", "s5", "s6", "s7",
       "s8", "s9", "s10", "s11", "t3", "t4", "t5", "t6"]


def sext(value, bits):
    """Interpret the low `bits` bits of value as a two's-complement number."""
    value &= (1 << bits) - 1
    return value - (1 << bits) if value >> (bits - 1) else value


class IllegalInstruction(Exception):
    pass


# ---------------------------------------------------------------------------
# The instruction table: (name, format, opcode, funct3, funct7)
# ---------------------------------------------------------------------------

_TABLE = [
    ("lui", "U", 0x37), ("auipc", "U", 0x17),
    ("jal", "J", 0x6f), ("jalr", "JALR", 0x67, 0),
    *[(n, "B", 0x63, f3) for n, f3 in
      [("beq", 0), ("bne", 1), ("blt", 4), ("bge", 5), ("bltu", 6), ("bgeu", 7)]],
    *[(n, "L", 0x03, f3) for n, f3 in
      [("lb", 0), ("lh", 1), ("lw", 2), ("ld", 3), ("lbu", 4), ("lhu", 5), ("lwu", 6)]],
    *[(n, "S", 0x23, f3) for n, f3 in [("sb", 0), ("sh", 1), ("sw", 2), ("sd", 3)]],
    *[(n, "I", 0x13, f3) for n, f3 in
      [("addi", 0), ("slti", 2), ("sltiu", 3), ("xori", 4), ("ori", 6), ("andi", 7)]],
    ("slli", "IS", 0x13, 1, 0x00), ("srli", "IS", 0x13, 5, 0x00), ("srai", "IS", 0x13, 5, 0x20),
    ("addiw", "I", 0x1b, 0),
    ("slliw", "ISW", 0x1b, 1, 0x00), ("srliw", "ISW", 0x1b, 5, 0x00), ("sraiw", "ISW", 0x1b, 5, 0x20),
    *[(n, "R", 0x33, f3, f7) for n, f3, f7 in [
        ("add", 0, 0x00), ("sub", 0, 0x20), ("sll", 1, 0), ("slt", 2, 0), ("sltu", 3, 0),
        ("xor", 4, 0), ("srl", 5, 0x00), ("sra", 5, 0x20), ("or", 6, 0), ("and", 7, 0),
        # M extension: funct7 = 1
        ("mul", 0, 1), ("mulh", 1, 1), ("mulhsu", 2, 1), ("mulhu", 3, 1),
        ("div", 4, 1), ("divu", 5, 1), ("rem", 6, 1), ("remu", 7, 1)]],
    *[(n, "R", 0x3b, f3, f7) for n, f3, f7 in [
        ("addw", 0, 0x00), ("subw", 0, 0x20), ("sllw", 1, 0), ("srlw", 5, 0x00), ("sraw", 5, 0x20),
        ("mulw", 0, 1), ("divw", 4, 1), ("divuw", 5, 1), ("remw", 6, 1), ("remuw", 7, 1)]],
    ("fence", "FENCE", 0x0f, 0), ("fence.i", "FENCE", 0x0f, 1),
    ("ecall", "SYS", 0x00000073), ("ebreak", "SYS", 0x00100073),
]

# Which bits must match for each format (the rest are registers/immediates).
_MASK = {"R": 0xfe00707f, "ISW": 0xfe00707f, "IS": 0xfc00707f,
         "I": 0x707f, "L": 0x707f, "S": 0x707f, "B": 0x707f, "JALR": 0x707f, "FENCE": 0x707f,
         "U": 0x7f, "J": 0x7f, "SYS": 0xffffffff}

_BY_OPCODE = {}
for _entry in _TABLE:
    _name, _fmt, _op, _f3, _f7 = (*_entry, 0, 0)[:5]
    _match = _op if _fmt == "SYS" else _op | _f3 << 12 | _f7 << 25
    _BY_OPCODE.setdefault(_match & 0x7f, []).append((_name, _fmt, _MASK[_fmt], _match))


@dataclass(slots=True)
class Inst:
    name: str
    fmt: str
    rd: int
    rs1: int
    rs2: int
    imm: int    # sign-extended, as a normal Python int
    word: int


def _immediate(fmt, w):
    if fmt in ("I", "L", "JALR"):
        return sext(w >> 20, 12)
    if fmt == "IS":
        return (w >> 20) & 0x3f           # 6-bit shift amount on RV64
    if fmt == "ISW":
        return (w >> 20) & 0x1f
    if fmt == "S":
        return sext((w >> 25) << 5 | (w >> 7) & 0x1f, 12)
    if fmt == "B":
        return sext((w >> 31 & 1) << 12 | (w >> 7 & 1) << 11
                    | (w >> 25 & 0x3f) << 5 | (w >> 8 & 0xf) << 1, 13)
    if fmt == "U":
        return sext(w & 0xfffff000, 32)
    if fmt == "J":
        return sext((w >> 31 & 1) << 20 | (w >> 12 & 0xff) << 12
                    | (w >> 20 & 1) << 11 | (w >> 21 & 0x3ff) << 1, 21)
    if fmt == "FENCE":
        return (w >> 20) & 0xff           # pred (4 bits) and succ (4 bits)
    return 0


def decode(w):
    if w & 3 != 3:
        raise IllegalInstruction(
            f"{w & 0xffff:#06x} is a 16-bit compressed (C extension) instruction; "
            "this emulator runs RV64IM only")
    for name, fmt, mask, match in _BY_OPCODE.get(w & 0x7f, ()):
        if w & mask == match:
            return Inst(name, fmt, w >> 7 & 31, w >> 15 & 31, w >> 20 & 31, _immediate(fmt, w), w)
    raise IllegalInstruction(f"{w:#010x} is not an RV64IM instruction")


# ---------------------------------------------------------------------------
# Semantics. Inputs are unsigned 64-bit; results are masked to 64 bits by the
# caller. The *W variants work on the low 32 bits and sign-extend the result.
# ---------------------------------------------------------------------------

def _s(v):
    return sext(v, 64)


def _w(v):
    return sext(v, 32)


def _div(a, b):
    """Signed division that truncates toward zero (Python's // floors)."""
    if b == 0:
        return -1                      # RISC-V doesn't trap on divide by zero
    q = abs(a) // abs(b)
    return -q if (a < 0) != (b < 0) else q


def _rem(a, b):
    return a if b == 0 else a - b * _div(a, b)


ALU = {
    "add": lambda a, b: a + b,
    "sub": lambda a, b: a - b,
    "sll": lambda a, b: a << (b & 63),
    "srl": lambda a, b: a >> (b & 63),
    "sra": lambda a, b: _s(a) >> (b & 63),
    "slt": lambda a, b: int(_s(a) < _s(b)),
    "sltu": lambda a, b: int(a < b),
    "xor": lambda a, b: a ^ b,
    "or": lambda a, b: a | b,
    "and": lambda a, b: a & b,
    "mul": lambda a, b: a * b,
    "mulh": lambda a, b: (_s(a) * _s(b)) >> 64,
    "mulhsu": lambda a, b: (_s(a) * b) >> 64,
    "mulhu": lambda a, b: (a * b) >> 64,
    "div": lambda a, b: _div(_s(a), _s(b)),
    "divu": lambda a, b: a // b if b else M64,
    "rem": lambda a, b: _rem(_s(a), _s(b)),
    "remu": lambda a, b: a % b if b else a,
    "addw": lambda a, b: _w(a + b),
    "subw": lambda a, b: _w(a - b),
    "sllw": lambda a, b: _w(a << (b & 31)),
    "srlw": lambda a, b: _w((a & M32) >> (b & 31)),
    "sraw": lambda a, b: _w(a) >> (b & 31),
    "mulw": lambda a, b: _w(a * b),
    "divw": lambda a, b: _w(_div(_w(a), _w(b))),
    "divuw": lambda a, b: _w((a & M32) // (b & M32)) if b & M32 else M64,
    "remw": lambda a, b: _w(_rem(_w(a), _w(b))),
    "remuw": lambda a, b: _w((a & M32) % (b & M32)) if b & M32 else _w(a),
}

# Immediate forms reuse the register-register operation.
ALU_IMM = {"addi": "add", "slti": "slt", "sltiu": "sltu", "xori": "xor", "ori": "or",
           "andi": "and", "slli": "sll", "srli": "srl", "srai": "sra",
           "addiw": "addw", "slliw": "sllw", "srliw": "srlw", "sraiw": "sraw"}

BRANCH = {
    "beq": lambda a, b: a == b,
    "bne": lambda a, b: a != b,
    "blt": lambda a, b: _s(a) < _s(b),
    "bge": lambda a, b: _s(a) >= _s(b),
    "bltu": lambda a, b: a < b,
    "bgeu": lambda a, b: a >= b,
}

# name -> (size in bytes, sign-extend?)
LOAD = {"lb": (1, True), "lh": (2, True), "lw": (4, True), "ld": (8, False),
        "lbu": (1, False), "lhu": (2, False), "lwu": (4, False)}
STORE = {"sb": 1, "sh": 2, "sw": 4, "sd": 8}
