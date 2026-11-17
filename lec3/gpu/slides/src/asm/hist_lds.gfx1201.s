hist_lds:
    v_dual_mov_b32 v2, 0 :: v_dual_lshlrev_b32 v1, 2, v0
    s_load_b32 s4, s[0:1], 0x10
    s_load_b128 s[0:3], s[0:1], 0x0
    v_lshl_or_b32 v0, ttmp9, 12, v0
    s_mov_b32 s5, exec_lo
    ds_store_b32 v1, v2
    s_barrier_signal -1
    s_barrier_wait -1
    s_wait_kmcnt 0x0
    v_cmpx_gt_u32 s4, v0
    s_cbranch_execz .LBB0_2
    global_load_u8 v2, v0, s[2:3]
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_2:
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0x100, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_4
    global_load_u8 v2, v0, s[2:3] offset:256
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_4:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0x200, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_6
    global_load_u8 v2, v0, s[2:3] offset:512
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_6:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0x300, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_8
    global_load_u8 v2, v0, s[2:3] offset:768
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_8:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_or_b32 v2, 0x400, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_10
    global_load_u8 v2, v0, s[2:3] offset:1024
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_10:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0x500, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_12
    global_load_u8 v2, v0, s[2:3] offset:1280
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_12:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0x600, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_14
    global_load_u8 v2, v0, s[2:3] offset:1536
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_14:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0x700, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_16
    global_load_u8 v2, v0, s[2:3] offset:1792
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_16:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_or_b32 v2, 0x800, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_18
    global_load_u8 v2, v0, s[2:3] offset:2048
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_18:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0x900, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_20
    global_load_u8 v2, v0, s[2:3] offset:2304
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_20:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0xa00, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_22
    global_load_u8 v2, v0, s[2:3] offset:2560
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_22:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0xb00, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_24
    global_load_u8 v2, v0, s[2:3] offset:2816
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_24:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_or_b32 v2, 0xc00, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_26
    global_load_u8 v2, v0, s[2:3] offset:3072
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_26:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0xd00, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_28
    global_load_u8 v2, v2, s[2:3]
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_28:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v2, 0xe00, v0
    s_mov_b32 s5, exec_lo
    v_cmpx_gt_u32 s4, v2
    s_cbranch_execz .LBB0_30
    global_load_u8 v2, v2, s[2:3]
    s_wait_loadcnt 0x0
    v_dual_mov_b32 v3, 1 :: v_dual_lshlrev_b32 v2, 2, v2
    ds_add_u32 v2, v3
.LBB0_30:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s5
    v_add_nc_u32 v0, 0xf00, v0
    v_cmp_gt_u32 vcc_lo, s4, v0
    s_and_saveexec_b32 s4, vcc_lo
    s_cbranch_execz .LBB0_32
    global_load_u8 v0, v0, s[2:3]
    v_mov_b32 v2, 1
    s_wait_loadcnt 0x0
    v_lshlrev_b32 v0, 2, v0
    ds_add_u32 v0, v2
.LBB0_32:
    s_wait_alu depctr_sa_sdst(0)
    s_or_b32 exec_lo, exec_lo, s4
    s_barrier_signal -1
    s_barrier_wait -1
    ds_load_b32 v0, v1
    s_wait_dscnt 0x0
    global_atomic_add_u32 v1, v0, s[0:1] scope:SCOPE_DEV
    s_endpgm
