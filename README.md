# jqgram  [![Build Status](https://travis-ci.org/hoonto/jqgram.png)](https://travis-ci.org/hoonto/jqgram)

> jqgram implements the PQ-Gram tree edit distance approximation algorithm for both server-side and browser applications; O(n log n) time and O(n) space performant where n is number of nodes in the trees.

> The PQ-Gram approximation is much faster than obtaining the true edit distance via Zhang & Shasha, Klein, or Guha et. al, whom provide true edit distance algorithms that all perform around O(n<sup>3</sup>) or O(n<sup>2</sup>) time in O(n) space and are therefore unsuitable for many applications at scale.

> Often in real-world applications it is not necessary to know the true edit distance if a relative approximation of multiple trees to a known standard can be obtained.  Javascript, in the browser and now on the server with the advent of Node.js deal frequently with tree structures and end-user performance is usually critical in algorithm implementation and design; thus jqgram.

Node <code>&gt;= 0.8.0</code> supported.

[![browser support](http://ci.testling.com/hoonto/jqgram.png)](http://ci.testling.com/hoonto/jqgram)

Note: IE is not passing tests according to testling, however I will dig into this at a later date, please let me know if this is critical for your application and enter an issue.

Rgds....Hoonto/Matt

# Description

The jqgram API provides callbacks for node child and label determination in order to provide flexibility and applicability in Node and browser environments.  You may utilize your own tree structures or follow the DOM, cheerio, or basic object structure examples.

The PQ-Gram edit distance is pseudo-metric:

    1) Identity - edit_distance(a, a) = 0
    2) Symmetric - edit_distance(a, b) = edit_distance(b, a) 
    3) Triangle Inequality - edit_distance(a, b) + edit_distance(b, c) >= edit_distance(a, c)
    
In effect, this means that if the PQ-Gram distance between tree A and B is less than the distance between tree C and D, then the true edit distance between A and B is less than or equal to the distance between C and D. Note that an edit distance of 0 does not mean the two trees are identical, only very similar.

# Usage

To use jqgram distance you need only create a jqgram object providing callbacks for label and children definition for trees being compared.  As the callbacks are per-tree, you can approximate edit distance between two different tree implementations.  For example, you could compare a tree generated from JSON with a DOM subtree.  You only need to pass in the root of each tree and the provided label and child callback functions will be used to generate the rest of the tree.  Another use case might be comparing an abstract syntax tree generated with Esprima with that created by Uglify2 or Acorn, or with something entirely of your own creation.  Note: default p and q are 2 and 3 respectively.

``` js
npm install jqgram
```

# Basic example

``` js
var jq = require("jqgram").jqgram;
var root1 = {
    "thelabel": "a",
    "thekids": [
        { "thelabel": "b",
        "thekids": [
                { "thelabel": "c" },
                { "thelabel": "d" }
            ]
        },
        { "thelabel": "e" },
        { "thelabel": "f" }
    ]
}

var root2 = {
    "name": "a",
    "kiddos": [
        { "name": "b",
        "kiddos": [
                { "name": "c" },
                { "name": "d" },
                { "name": "y" }
            ]
        },
        { "name": "e" },
        { "name": "x" }
    ]
}

jq.distance({
    root: root1,
    lfn: function(node){ return node.thelabel; },
    cfn: function(node){ return node.thekids; }
},{
    root: root2,
    lfn: function(node){ return node.name; },
    cfn: function(node){ return node.kiddos; }
},{ p:2, q:3, depth:10 },
function(result) {
    console.log(result.distance);
});
```

***

```
0.6428571428571428
```

# DOM vs Object 

``` js
// This could probably be optimized significantly, but is a real-world
// example of how to use tree edit distance in the browser.

// jqgram:
var jq = require("jqgram").jqgram;

// Make a DOM-ish structure out of objects:
var mydom = {
    "name": "body",
    "chittles": [ 
        { "name": "div",
        "chittles": [
                { "name": "a" }, // The id attribute
                { "name": "div",
                  "chittles": [
                    { "name": "c" }, // The "c" class
                    { "name": "d" }, // The "d" class
                    { "name": "span" }
                  ] 
                }
            ]
        },
    ]
}

// For ease, lets assume you have jQuery laoded:
var realdom = $('body');

// The lfn and cfn functions allow you to specify
// how labels and children should be defined:
jq.distance({
    root: mydom,
    lfn: function(node){ return node.name; },
    cfn: function(node){ return  node.chittles; }
},{
    root: realdom,
    lfn: function(node){ 
        return node.nodeName.toLowerCase(); 
    },
    cfn: function(node){ 
        var retarr = [];
        if(!! node.attributes && !! node.attributes.class && !! node.attributes.class.nodeValue){
            retarr = retarr.concat(node.attributes.class.nodeValue.split(' '));
        }
        if(!! node.attributes && !! node.attributes.id && !! node.attributes.id.nodeValue) {
            retarr.push(node.attributes.id.nodeValue);
        }
        for(var i=0; i<node.children.length; ++i){
            retarr.push(node.children[i]);
        }
        return retarr;
    }
},{ p:2, q:3, depth:10 },
function(result) {
    console.log(result.distance);
});
```

***

```
// Output depends on how your pseudo-DOM subtree compares with the real DOM!
```



# DOM vs Cheerio example

``` js
// This could probably be optimized significantly, but is a real-world
// example of how to use tree edit distance in the browser.

// For cheerio, you'll have to browserify, 
// which requires some fiddling around
// due to cheerio's dynamically generated 
// require's (good grief) that browserify 
// does not see due to the static nature 
// of its code analysis (dynamic off-line
// analysis is hard, but doable).
//
// Ultimately, the goal is to end up with 
// something like this in the browser:

var cheerio = require('./lib/cheerio'); 

// The easy part, jqgram:
var jq = require("../jqgram").jqgram;

// Make a cheerio DOM:
var html = '<body><div id="a"><div class="c d"><span>Irrelevent text</span></div></div></body>';

var cheeriodom = cheerio.load(html, {
    ignoreWhitespace: false,
    lowerCaseTags: true
});

// For ease, lets assume you have jQuery laoded:
var realdom = $('body');

// The lfn and cfn functions allow you to specify
// how labels and children should be defined:
jq.distance({
    root: cheeriodom,
    lfn: function(node){ 
        // We don't have to lowercase this because we already
        // asked cheerio to do that for us above (lowerCaseTags).
        return node.name; 
    },
    cfn: function(node){ 
        // Cheerio maintains attributes in the attribs array:
        // We're going to put id's and classes in as children 
        // of nodes in our cheerio tree
        var retarr = []; 
        if(!! node.attribs && !! node.attribs.class){
            retarr = retarr.concat(node.attribs.class.split(' '));
        }
        if(!! node.attribs && !! node.attribs.id){
            retarr.push(node.attribs.id);
        }
        retarr = retarr.concat(node.children);
        return  retarr;
    }
},{
    root: realdom,
    lfn: function(node){ 
        return node.nodeName.toLowerCase(); 
    },
    cfn: function(node){ 
        var retarr = [];
        if(!! node.attributes && !! node.attributes.class && !! node.attributes.class.nodeValue){
            retarr = retarr.concat(node.attributes.class.nodeValue.split(' '));
        }
        if(!! node.attributes && !! node.attributes.id && !! node.attributes.id.nodeValue) {
            retarr.push(node.attributes.id.nodeValue);
        }
        for(var i=0; i<node.children.length; ++i){
            retarr.push(node.children[i]);
        }
        return retarr;
    }
},{ p:2, q:3, depth:10 },
function(result) {
    console.log(result.distance);
});
```

***

```
// Output depends on how your pseudo-DOM subtree compares with the real DOM!
```

# Credits and Inspirations

[The academic paper](http://www.vldb2005.org/program/paper/wed/p301-augsten.pdf)

[PyGram, python implementation](https://github.com/Sycondaman/PyGram), from which jqgram was originally ported and main tests were recreated.

Includes slightly modified version of [node-clone](https://github.com/pvorb/node-clone). 

Utilizes [setImmediate](https://github.com/NobleJS/setImmediate). 

# Tips 

1)  The p and q values will change the distribution of the edit distance, which is a value between 0 and 1. In practice, you will likely not need to modify these.  Read the [the paper](http://www.vldb2005.org/program/paper/wed/p301-augsten.pdf) referenced in the credits section above for more info on that.

2)  Node labels are compared lexicographically. Whenever node labels are overly descriptive, performance and accuracy of the algorithm can be increased dramatically by expanding node labels as new children.  In jqgram you can do this in your child callback function for each tree as shown in examples - for example using the id and each class name in the class attributes of DOM nodes as additional immediate children of the current node. 

# License
JQGram 0.2.0 <http://hoonto.com/>
Copyright 2013 Hoonto <http://hoonto.com/>
Available under MIT License
Based on:
Academic paper <http://www.vldb2005.org/program/paper/wed/p301-augsten.pdf>
PyGram implementation <https://github.com/hoonto/jqgram>
with slightly modified node-clone <https://github.com/pvorb/node-clone>

