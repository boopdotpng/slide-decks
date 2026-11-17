hist_atomic:
    s_load_b32 s2, s[0:1], 0x10
    v_lshl_add_u32 v0, ttmp9, 8, v0
    s_wait_kmcnt 0x0
    v_cmp_gt_u32 vcc_lo, s2, v0
    s_and_saveexec_b32 s2, vcc_lo
    s_cbranch_execz .LBB0_2
    s_load_b128 s[0:3], s[0:1], 0x0
    v_mov_b32 v1, 1
    s_wait_kmcnt 0x0
    global_load_u8 v0, v0, s[2:3]
    s_wait_loadcnt 0x0
    v_lshlrev_b32 v0, 2, v0
    global_atomic_add_u32 v0, v1, s[0:1] scope:SCOPE_DEV
.LBB0_2:
    s_endpgm
