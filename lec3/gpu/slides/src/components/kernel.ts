/** a kernel file without its #include line and the comment lines above the function */
export const body = (src: string) => src.split('\n').filter((l) => !/^(#include|\/\/)/.test(l)).join('\n').trim();
