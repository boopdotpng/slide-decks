// The handful of names from hip's own headers that these kernels use, so they compile with plain clang and no rocm
// install. Each one is what hip defines it as: an attribute, or a read of a register the hardware fills in.
#define __global__ extern "C" __attribute__((global))   // a kernel: the gpu's entry point
#define __shared__ __attribute__((shared))              // lives in lds, one copy per block
struct __thread_x { __attribute__((device)) operator unsigned() const { return __builtin_amdgcn_workitem_id_x(); } };
struct __block_x { __attribute__((device)) operator unsigned() const { return __builtin_amdgcn_workgroup_id_x(); } };
static const struct { __thread_x x; } threadIdx;        // my number inside my block
static const struct { __block_x x; } blockIdx;          // my block's number
__attribute__((device)) static inline void __syncthreads() { __builtin_amdgcn_s_barrier(); }
// add to a counter in memory as one step, so no other thread's add can land in between. hip's own definition
__attribute__((device)) static inline unsigned atomicAdd(unsigned *p, unsigned v) {
  return __hip_atomic_fetch_add(p, v, __ATOMIC_RELAXED, __HIP_MEMORY_SCOPE_AGENT);
}
