	.attribute	4, 16
	.attribute	5, "rv64i2p1_m2p0_zmmul1p0"
	.file	"sum.c"
	.text
	.globl	sum                             # -- Begin function sum
	.p2align	2
	.type	sum,@function
sum:                                    # @sum
# %bb.0:
	li	a2, 0
	blez	a1, .LBB0_3
# %bb.1:
	slli	a1, a1, 3
	add	a1, a0, a1
.LBB0_2:                                # =>This Inner Loop Header: Depth=1
	ld	a3, 0(a0)
	addi	a0, a0, 8
	add	a2, a3, a2
	bne	a0, a1, .LBB0_2
.LBB0_3:
	mv	a0, a2
	ret
.Lfunc_end0:
	.size	sum, .Lfunc_end0-sum
                                        # -- End function
	.globl	main                            # -- Begin function main
	.p2align	2
	.type	main,@function
main:                                   # @main
# %bb.0:
	addi	sp, sp, -16
	sd	ra, 8(sp)                       # 8-byte Folded Spill
	lui	a0, %hi(numbers)
	addi	a0, a0, %lo(numbers)
	li	a1, 8
	call	sum
	mv	a1, a0
	lui	a0, %hi(.L.str)
	addi	a0, a0, %lo(.L.str)
	#APP
	ebreak
	#NO_APP
	li	a7, 1002
	#APP
	ecall
	#NO_APP
	mv	a0, a1
	li	a7, 1000
	#APP
	ecall
	#NO_APP
	li	a0, 10
	li	a7, 1003
	#APP
	ecall
	#NO_APP
	li	a0, 0
	ld	ra, 8(sp)                       # 8-byte Folded Reload
	addi	sp, sp, 16
	ret
.Lfunc_end1:
	.size	main, .Lfunc_end1-main
                                        # -- End function
	.type	numbers,@object                 # @numbers
	.data
	.globl	numbers
	.p2align	3, 0x0
numbers:
	.quad	3                               # 0x3
	.quad	1                               # 0x1
	.quad	4                               # 0x4
	.quad	1                               # 0x1
	.quad	5                               # 0x5
	.quad	9                               # 0x9
	.quad	2                               # 0x2
	.quad	6                               # 0x6
	.size	numbers, 64

	.type	.L.str,@object                  # @.str
	.section	.rodata.str1.1,"aMS",@progbits,1
.L.str:
	.asciz	"sum = "
	.size	.L.str, 7

	.section	".note.GNU-stack","",@progbits
