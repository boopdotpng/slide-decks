brighten:
    s_load_dwordx2 s[4:5], s[0:1], 0x8
    v_lshl_add_u32 v0, s2, 8, v0
    s_waitcnt lgkmcnt(0)
    v_cmp_gt_u32 vcc, s4, v0
    s_and_saveexec_b64 s[2:3], vcc
    s_cbranch_execz .LBB0_2
    s_load_dwordx2 s[0:1], s[0:1], 0x0
    s_waitcnt lgkmcnt(0)
    global_load_ubyte v1, v0, s[0:1]
    s_waitcnt vmcnt(0)
    v_mul_lo_u32 v1, s5, v1
    v_min_u32 v1, 0xff, v1
    global_store_byte v0, v1, s[0:1]
.LBB0_2:
    s_endpgm
