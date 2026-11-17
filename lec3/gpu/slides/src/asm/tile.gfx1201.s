tile:
    s_load_b128 s[4:7], s[0:1], 0x0
    s_load_b64 s[0:1], s[0:1], 0x10
    v_lshlrev_b32 v1, 4, v0
    v_lshlrev_b32 v16, 5, v0
    s_wait_kmcnt 0x0
    global_load_b128 v[8:11], v1, s[6:7]
    global_load_b128 v[12:15], v1, s[0:1]
    global_load_b128 v[4:7], v16, s[4:5] offset:16
    global_load_b128 v[0:3], v16, s[4:5]
    s_wait_loadcnt 0x0
    v_wmma_f32_16x16x16_f16 v[0:7], v[8:11], v[12:15], v[0:7]
    global_store_b128 v16, v[0:3], s[4:5]
    global_store_b128 v16, v[4:7], s[4:5] offset:16
    s_endpgm
