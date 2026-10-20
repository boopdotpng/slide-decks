"""Assemble a .s file and load the result: which bytes go where, where to start,
and the label names.

llvm-mc assembles and ld.lld links (picks the final addresses). Their output
happens to be an ELF file, which is read here in a temp directory. It's plumbing,
not something students need to look at.
"""

import bisect
import os
import re
import shutil
import struct
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

SEARCH = ["/opt/homebrew/opt/llvm/bin", "/usr/local/opt/llvm/bin",
          "/opt/homebrew/opt/lld/bin", "/usr/local/opt/lld/bin"]

# rv64 with the M extension (multiply/divide). Compressed instructions (C) and
# linker relaxation are off, so what you wrote is exactly what runs.
MATTR = "+m,-c,-relax"

EBREAK = 0x00100073

# Startup code for C programs, which define main instead of _start. Real C
# programs get the same thing from the C library (it's called crt0).
CRT0 = """
    .text
    .globl _start
_start:
    call main            # a0 = main's return value
    li   a7, 93          # exit(a0)
    ecall
"""


class BuildError(Exception):
    pass


@dataclass
class Section:
    name: str
    addr: int
    data: bytes
    writable: bool
    executable: bool


class Program:
    def __init__(self, image: bytes):
        self.entry, shoff = struct.unpack_from("<QxxxxxxxxQ", image, 24)
        shentsize, shnum, shstrndx = struct.unpack_from("<HHH", image, 58)
        headers = [struct.unpack_from("<IIQQQQIIQQ", image, shoff + i * shentsize) for i in range(shnum)]

        def string(table, index):
            start = headers[table][4] + index
            return image[start:image.index(b"\0", start)].decode()

        self.sections, self.symbols, self.globals, labels = [], {}, set(), []
        for name, kind, flags, addr, offset, size, link, *_ in headers:
            if flags & 2 and size:                     # SHF_ALLOC: occupies memory
                data = bytes(size) if kind == 8 else image[offset:offset + size]   # 8 = .bss
                self.sections.append(Section(string(shstrndx, name), addr, data,
                                             writable=bool(flags & 1), executable=bool(flags & 4)))
            if kind == 2:                              # the symbol table
                for off in range(offset, offset + size, 24):
                    n, info, _, shndx, value, _ = struct.unpack_from("<IBBHQQ", image, off)
                    sym = string(link, n)
                    if sym and info & 15 in (0, 1, 2) and 0 < shndx < 0xff00:
                        self.symbols[sym] = value
                        if info >> 4:                  # GLOBAL or WEAK (.globl)
                            self.globals.add(sym)
                        if not sym.startswith((".L", "$")):
                            labels.append((value, sym))
        labels.sort()
        self._addrs = [a for a, _ in labels]
        self._names = [n for _, n in labels]
        self.ebreak_lines = {}                         # pc -> "file.s:line"

    def label(self, addr):
        """'name' or 'name+0x8' for the closest label at or before addr."""
        i = bisect.bisect_right(self._addrs, addr) - 1
        if i < 0:
            return ""
        off = addr - self._addrs[i]
        return self._names[i] + (f"+{off:#x}" if off else "")


def _tool(name):
    for d in filter(None, [os.environ.get("RV_LLVM_BIN"), *SEARCH]):
        if (p := Path(d) / name).exists():
            return str(p)
    if p := shutil.which(name):
        return p
    raise BuildError(f"can't find {name}; install it with `brew install llvm lld` "
                     "or point RV_LLVM_BIN at the directory that contains it")


def _run(cmd):
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode:
        raise BuildError(result.stderr.strip() or f"{Path(cmd[0]).name} failed")


def _mc(src, obj):
    _run([_tool("llvm-mc"), "-triple=riscv64", f"-mattr={MATTR}", "-filetype=obj",
          "-I", str(src.parent), "-o", str(obj), str(src)])


def assemble(src):
    """Assemble and link a .s file into a Program ready to run."""
    src = Path(src)
    with tempfile.TemporaryDirectory() as tmp:
        obj, exe = Path(tmp) / f"{src.stem}.o", Path(tmp) / src.stem
        _mc(src, obj)
        objs = [obj]
        globals_ = Program(obj.read_bytes()).globals
        if "_start" not in globals_ and "main" in globals_:
            (crt0 := Path(tmp) / "crt0.s").write_text(CRT0)
            _mc(crt0, crt0.with_suffix(".o"))
            objs.append(crt0.with_suffix(".o"))
        _run([_tool("ld.lld"), "--build-id=none", "-o", str(exe), *map(str, objs)])
        program = Program(exe.read_bytes())
    if "_start" not in program.symbols:
        raise BuildError(f"{src}: no _start label. Execution begins at _start (or at main\n"
                         "for C code), so add\n"
                         "    .globl _start\n_start:\nbefore your first instruction")
    program.ebreak_lines = _ebreak_lines(src, program)
    return program


def _ebreak_lines(src, program):
    """Match the Nth ebreak in the code to the Nth `ebreak` line in the source.
    (Gives up, harmlessly, if they don't line up, e.g. ebreaks in an .include.)"""
    lines = [i for i, line in enumerate(src.read_text().splitlines(), 1)
             if re.sub(r"^\s*([\w.$]+:\s*)*", "", line.split("#")[0]).strip() == "ebreak"]
    pcs = [s.addr + off for s in program.sections if s.executable
           for off in range(0, len(s.data) - 3, 4)
           if int.from_bytes(s.data[off:off + 4], "little") == EBREAK]
    return {pc: f"{src.name}:{n}" for pc, n in zip(pcs, lines)} if len(pcs) == len(lines) else {}
