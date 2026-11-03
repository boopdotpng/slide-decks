# 01-title

# 07-arrays

**1:00** · the 10,000-foot view, no internals

- one pixel is a number; flatten an image and it's a row; as 28 × 28 it's a grid; a batch is a stack of grids (3-d)
- if asked about the 1 in xtrain's (60000, 1, 28, 28): one color channel (grayscale). flatten(1) folds it in with the 28 × 28
- step 4: every value in the script is one of these. that's all a tensor is: numbers plus a shape

# 12-library

**1:30**

- 0: a linear fit's loss, one line of array math (on purpose not the lab's model). 1: the library records the whole computation as a graph
- 2: a compiler turns the graph into gpu code. real code, generated on this mac for that one line: the matmul, the subtract, the square and the mean fused into one Metal kernel. nobody writes that by hand
- 3: the same graph becomes CUDA on nvidia, HIP on amd, Metal on a mac, C on a cpu (that's why we installed clang)
- 4: walking the graph backwards gives the gradients: that's backward(). leave it at that
