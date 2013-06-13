# jqgram

This module implements the PQ-Gram tree edit distance approximation algorithm for both server-side and browser-side applications; O(n log n) time and O(n) space performant where n is number of nodes in the trees.

The PQ-Gram approximation is much faster than obtaining the true edit distance via Zhang & Shasha, Klein, or Guha et. al, whom provide true edit distance algorithms that all perform minimum O(n<sup>2</sup>) time in O(n) space and are therefore unsuitable for many applications at scale.

Often in real-world applications it is not necessary to know the true edit distance if a relative approximation of multiple trees to a known standard can be obtained.  Javascript, in the browser and now on the server with the advent of Node.js deal frequently with tree structures and end-user performance is usually critical in algorithm implementation and design; thus jqgram.

jQGram is currently used in applications in private beta at hoonto.com and clipwidget.com. 

[![browser support](http://ci.testling.com/hoonto/jqgram.png)](http://ci.testling.com/hoonto/jqgram)

[![build status](https://secure.travis-ci.org/hoonto/jqgram.png)](http://travis-ci.org/hoonto/jqgram)


# Credits and Inspirations

[The academic paper](http://www.vldb2005.org/program/paper/wed/p301-augsten.pdf)

[PyGram, python implementation](https://github.com/Sycondaman/PyGram), from which jqgram was originally ported.

Includes very slightly modified version of [node-clone](https://github.com/pvorb/node-clone). 

Description
===========

The jqgram API expands upon the PyGram implementation providing callbacks for node child and label determination in order to provide better flexibility and applicability in Node and browser environments.  You may utilize your own tree structures or follow the DOM, cheerio, or basic object structure examples.

The PQ-Gram edit distance is pseudo-metric:

    1) Identity - edit_distance(a, a) = 0
    2) Symmetric - edit_distance(a, b) = edit_distance(b, a) 
    3) Triangle Inequality - edit_distance(a, b) + edit_distance(b, c) >= edit_distance(a, c)
    
In effect, this means that if the PQ-Gram distance between tree A and B is less than the distance between tree C and D, then the true edit distance between A and B is less than or equal to the distance between C and D. Note that an edit distance of 0 does not mean the two trees are identical, only very similar.

USAGE
=====

To use jqgram distance you need only create a jqgram object providing callbacks for label and children definitions for both trees being analyzed.  As the callbacks are per-tree, you can approximate edit distance between two different tree implementations.  For example, you could compare a tree generated from JSON with a DOM subtree.  You only need to pass in the root of each tree and the provided label and child callback functions will be used to generate the rest of the tree.  Another use case might be comparing an abstract syntax tree generated with Esprima with that created by Uglify2 or Acorn, or with something entirely of your own creation.

# example

``` js
//code example forthcoming
```

***

```
//code example output forthcoming
```



TIPS 
====

Tips are mostly the same as PyGram except that instead of using split_tree, you can define your labels in the child label callback function and implement your own splitting algorithm there or implement parts of labels as new child nodes in your child node callback function for trees being compared.

1)  The p and q values will change the distribution of the edit_distance function. This occurs for reasons that are more apparent if you read the paper. The basic concept is that p controls the impact of ancestor nodes, and q controls the impact of sibling nodes. In practice, you will likely not need to modify these, as the preset values are reasonable. However, you may wish to tweak them to improve performance (either speed or accuracy) of your program.

2)  Node labels are compared lexicographically. Whenever node labels are extended or overly descriptive, performance and accuracy of the algorithm can be increased dramatically by expanding node labels.  In jqgram you can do this in your label and child callback function as shown in examples. 

3) PQ-Gram always compares by the labels. Whatever other data you may have with the nodes, the edit distance comparison is always using just information in the labels. If you feel the data is necessary for proper comparison, you must include it in the label via the label callback function or as new children with the child callback function.

