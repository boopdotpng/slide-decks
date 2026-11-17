brighten:
    s_load_b64 s[2:3], s[0:1], 0x8
    v_lshl_add_u32 v0, ttmp9, 8, v0
    s_wait_kmcnt 0x0
    v_cmp_gt_u32 vcc_lo, s2, v0
    s_and_saveexec_b32 s2, vcc_lo
    s_cbranch_execz .LBB0_2
    s_load_b64 s[0:1], s[0:1], 0x0
    s_wait_kmcnt 0x0
    global_load_u8 v1, v0, s[0:1]
    s_wait_loadcnt 0x0
    v_mul_lo_u32 v1, s3, v1
    v_min_u32 v1, 0xff, v1
    global_store_b8 v0, v1, s[0:1]
.LBB0_2:
    s_endpgm
