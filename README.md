# jqgram

This module implements the PQ-Gram tree edit distance approximation algorithm for both server-side and browser-side applications; O(n log n) time and O(n) space performant where n is number of nodes in the trees.

The PQ-Gram approximation is much faster than obtaining the true edit distance via Zhang & Shasha, Klein, or Guha et. al, whom provide true edit distance algorithms that all perform minimum O(n<sup>2</sup>) time in O(n) space and are therefore unsuitable for many applications at scale.

Often in real-world applications it is not necessary to know the true edit distance if a relative approximation of multiple trees to a known standard can be obtained.  Javascript, in the browser and now on the server with the advent of Node.js deal frequently with tree structures and end-user performance is usually critical in algorithm implementation and design; thus jqgram.

jQGram is currently used in applications in private beta at hoonto.com and clipwidget.com. 

[![browser support](http://ci.testling.com/hoonto/jqgram.png)](http://ci.testling.com/hoonto/jqgram)


# Credits and Inspirations

[The academic paper](http://www.vldb2005.org/program/paper/wed/p301-augsten.pdf)

[PyGram, python implementation](https://github.com/Sycondaman/PyGram), from which jqgram was originally ported and tests were faithfully recreated.

Includes slightly modified version of [node-clone](https://github.com/pvorb/node-clone). 

# Description

The jqgram API provides callbacks for node child and label determination in order to provide flexibility and applicability in Node and browser environments.  You may utilize your own tree structures or follow the DOM, cheerio, or basic object structure examples.

The PQ-Gram edit distance is pseudo-metric:

    1) Identity - edit_distance(a, a) = 0
    2) Symmetric - edit_distance(a, b) = edit_distance(b, a) 
    3) Triangle Inequality - edit_distance(a, b) + edit_distance(b, c) >= edit_distance(a, c)
    
In effect, this means that if the PQ-Gram distance between tree A and B is less than the distance between tree C and D, then the true edit distance between A and B is less than or equal to the distance between C and D. Note that an edit distance of 0 does not mean the two trees are identical, only very similar.

# Usage

To use jqgram distance you need only create a jqgram object providing callbacks for label and children definition for trees being compared.  As the callbacks are per-tree, you can approximate edit distance between two different tree implementations.  For example, you could compare a tree generated from JSON with a DOM subtree.  You only need to pass in the root of each tree and the provided label and child callback functions will be used to generate the rest of the tree.  Another use case might be comparing an abstract syntax tree generated with Esprima with that created by Uglify2 or Acorn, or with something entirely of your own creation.

``` js
 not available in npm just yet.
// finishing testing first. 
// clone for now, npm install jqgram coming later
```


# example

``` js
//code example forthcoming
```

***

```
//code example output forthcoming
```



# Tips 

1)  The p and q values will change the distribution of the edit distance, which is a value between 0 and 1. In practice, you will likely not need to modify these.  Read the [the paper](http://www.vldb2005.org/program/paper/wed/p301-augsten.pdf) referenced in the credits section above for more info on that.

2)  Node labels are compared lexicographically. Whenever node labels are overly descriptive, performance and accuracy of the algorithm can be increased dramatically by expanding node labels as new children.  In jqgram you can do this in your child callback function for each tree as shown in examples - for example using the id and each class name in the class attributes of DOM nodes as additional immediate children of the current node. 

