shadows:
    s_load_b32 s2, s[0:1], 0x8
    v_lshl_add_u32 v1, ttmp9, 8, v0
    s_wait_kmcnt 0x0
    v_cmp_gt_u32 vcc_lo, s2, v1
    s_and_saveexec_b32 s2, vcc_lo
    s_cbranch_execz .LBB0_3
    s_load_b64 s[0:1], s[0:1], 0x0
    s_wait_kmcnt 0x0
    global_load_d16_u8 v0, v1, s[0:1]
    v_add_co_u32 v1, s0, s0, v1
    s_wait_alu depctr_va_sdst(0)
    v_add_co_ci_u32 v2, null, s1, 0, s0
    s_wait_loadcnt 0x0
    v_cmp_gt_u16 vcc_lo, 40, v0.l
    s_and_b32 exec_lo, exec_lo, vcc_lo
    s_cbranch_execz .LBB0_3
    v_lshlrev_b16 v0.l, 1, v0.l
    global_store_b8 v[1:2], v0, off
.LBB0_3:
    s_endpgm
