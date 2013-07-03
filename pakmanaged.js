var global = Function("return this;")();
/*!
  * Ender: open module JavaScript framework (client-lib)
  * copyright Dustin Diaz & Jacob Thornton 2011 (@ded @fat)
  * http://ender.no.de
  * License MIT
  */
!function (context) {

  // a global object for node.js module compatiblity
  // ============================================

  context['global'] = context

  // Implements simple module system
  // losely based on CommonJS Modules spec v1.1.1
  // ============================================

  var modules = {}
    , old = context.$

  function require (identifier) {
    // modules can be required from ender's build system, or found on the window
    var module = modules[identifier] || window[identifier]
    if (!module) throw new Error("Requested module '" + identifier + "' has not been defined.")
    return module
  }

  function provide (name, what) {
    return (modules[name] = what)
  }

  context['provide'] = provide
  context['require'] = require

  function aug(o, o2) {
    for (var k in o2) k != 'noConflict' && k != '_VERSION' && (o[k] = o2[k])
    return o
  }

  function boosh(s, r, els) {
    // string || node || nodelist || window
    if (typeof s == 'string' || s.nodeName || (s.length && 'item' in s) || s == window) {
      els = ender._select(s, r)
      els.selector = s
    } else els = isFinite(s.length) ? s : [s]
    return aug(els, boosh)
  }

  function ender(s, r) {
    return boosh(s, r)
  }

  aug(ender, {
      _VERSION: '0.3.6'
    , fn: boosh // for easy compat to jQuery plugins
    , ender: function (o, chain) {
        aug(chain ? boosh : ender, o)
      }
    , _select: function (s, r) {
        return (r || document).querySelectorAll(s)
      }
  })

  aug(boosh, {
    forEach: function (fn, scope, i) {
      // opt out of native forEach so we can intentionally call our own scope
      // defaulting to the current item and be able to return self
      for (i = 0, l = this.length; i < l; ++i) i in this && fn.call(scope || this[i], this[i], i, this)
      // return self for chaining
      return this
    },
    $: ender // handy reference to self
  })

  ender.noConflict = function () {
    context.$ = old
    return this
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = ender
  // use subscript notation as extern for Closure compilation
  context['ender'] = context['$'] = context['ender'] || ender

}(this);
// pakmanager:setimmediate
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  (function (global, undefined) {
        "use strict";
    
        var tasks = (function () {
            function Task(handler, args) {
                this.handler = handler;
                this.args = args;
            }
            Task.prototype.run = function () {
                // See steps in section 5 of the spec.
                if (typeof this.handler === "function") {
                    // Choice of `thisArg` is not in the setImmediate spec; `undefined` is in the setTimeout spec though:
                    // http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html
                    this.handler.apply(undefined, this.args);
                } else {
                    var scriptSource = "" + this.handler;
                    /*jshint evil: true */
                    eval(scriptSource);
                }
            };
    
            var nextHandle = 1; // Spec says greater than zero
            var tasksByHandle = {};
            var currentlyRunningATask = false;
    
            return {
                addFromSetImmediateArguments: function (args) {
                    var handler = args[0];
                    var argsToHandle = Array.prototype.slice.call(args, 1);
                    var task = new Task(handler, argsToHandle);
    
                    var thisHandle = nextHandle++;
                    tasksByHandle[thisHandle] = task;
                    return thisHandle;
                },
                runIfPresent: function (handle) {
                    // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
                    // So if we're currently running a task, we'll need to delay this invocation.
                    if (!currentlyRunningATask) {
                        var task = tasksByHandle[handle];
                        if (task) {
                            currentlyRunningATask = true;
                            try {
                                task.run();
                            } finally {
                                delete tasksByHandle[handle];
                                currentlyRunningATask = false;
                            }
                        }
                    } else {
                        // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
                        // "too much recursion" error.
                        global.setTimeout(function () {
                            tasks.runIfPresent(handle);
                        }, 0);
                    }
                },
                remove: function (handle) {
                    delete tasksByHandle[handle];
                }
            };
        }());
    
        function canUseNextTick() {
            // Don't get fooled by e.g. browserify environments.
            return typeof process === "object" &&
                   Object.prototype.toString.call(process) === "[object process]";
        }
    
        function canUseMessageChannel() {
            return !!global.MessageChannel;
        }
    
        function canUsePostMessage() {
            // The test against `importScripts` prevents this implementation from being installed inside a web worker,
            // where `global.postMessage` means something completely different and can't be used for this purpose.
    
            if (!global.postMessage || global.importScripts) {
                return false;
            }
    
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function () {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
    
            return postMessageIsAsynchronous;
        }
    
        function canUseReadyStateChange() {
            return "document" in global && "onreadystatechange" in global.document.createElement("script");
        }
    
        function installNextTickImplementation(attachTo) {
            attachTo.setImmediate = function () {
                var handle = tasks.addFromSetImmediateArguments(arguments);
    
                process.nextTick(function () {
                    tasks.runIfPresent(handle);
                });
    
                return handle;
            };
        }
    
        function installMessageChannelImplementation(attachTo) {
            var channel = new global.MessageChannel();
            channel.port1.onmessage = function (event) {
                var handle = event.data;
                tasks.runIfPresent(handle);
            };
            attachTo.setImmediate = function () {
                var handle = tasks.addFromSetImmediateArguments(arguments);
    
                channel.port2.postMessage(handle);
    
                return handle;
            };
        }
    
        function installPostMessageImplementation(attachTo) {
            // Installs an event handler on `global` for the `message` event: see
            // * https://developer.mozilla.org/en/DOM/window.postMessage
            // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages
    
            var MESSAGE_PREFIX = "com.bn.NobleJS.setImmediate" + Math.random();
    
            function isStringAndStartsWith(string, putativeStart) {
                return typeof string === "string" && string.substring(0, putativeStart.length) === putativeStart;
            }
    
            function onGlobalMessage(event) {
                // This will catch all incoming messages (even from other windows!), so we need to try reasonably hard to
                // avoid letting anyone else trick us into firing off. We test the origin is still this window, and that a
                // (randomly generated) unpredictable identifying prefix is present.
                if (event.source === global && isStringAndStartsWith(event.data, MESSAGE_PREFIX)) {
                    var handle = event.data.substring(MESSAGE_PREFIX.length);
                    tasks.runIfPresent(handle);
                }
            }
            if (global.addEventListener) {
                global.addEventListener("message", onGlobalMessage, false);
            } else {
                global.attachEvent("onmessage", onGlobalMessage);
            }
    
            attachTo.setImmediate = function () {
                var handle = tasks.addFromSetImmediateArguments(arguments);
    
                // Make `global` post a message to itself with the handle and identifying prefix, thus asynchronously
                // invoking our onGlobalMessage listener above.
                global.postMessage(MESSAGE_PREFIX + handle, "*");
    
                return handle;
            };
        }
    
        function installReadyStateChangeImplementation(attachTo) {
            attachTo.setImmediate = function () {
                var handle = tasks.addFromSetImmediateArguments(arguments);
    
                // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
                // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
                var scriptEl = global.document.createElement("script");
                scriptEl.onreadystatechange = function () {
                    tasks.runIfPresent(handle);
    
                    scriptEl.onreadystatechange = null;
                    scriptEl.parentNode.removeChild(scriptEl);
                    scriptEl = null;
                };
                global.document.documentElement.appendChild(scriptEl);
    
                return handle;
            };
        }
    
        function installSetTimeoutImplementation(attachTo) {
            attachTo.setImmediate = function () {
                var handle = tasks.addFromSetImmediateArguments(arguments);
    
                global.setTimeout(function () {
                    tasks.runIfPresent(handle);
                }, 0);
    
                return handle;
            };
        }
    
        if (!global.setImmediate) {
            // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
            var attachTo = typeof Object.getPrototypeOf === "function" && "setTimeout" in Object.getPrototypeOf(global) ?
                              Object.getPrototypeOf(global)
                            : global;
    
            if (canUseNextTick()) {
                // For Node.js before 0.9
                installNextTickImplementation(attachTo);
            } else if (canUsePostMessage()) {
                // For non-IE10 modern browsers
                installPostMessageImplementation(attachTo);
            } else if (canUseMessageChannel()) {
                // For web workers, where supported
                installMessageChannelImplementation(attachTo);
            } else if (canUseReadyStateChange()) {
                // For IE 6–8
                installReadyStateChangeImplementation(attachTo);
            } else {
                // For older browsers
                installSetTimeoutImplementation(attachTo);
            }
    
            attachTo.clearImmediate = tasks.remove;
        }
    }(typeof global === "object" && global ? global : this));
    
  provide("setimmediate", module.exports);
}(global));

// pakmanager:node-clone
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  //Universal js Clone function (we think...)
    //Works for any js object
    
    var FN=function(fn) {
    this.clone=fn;
    };
    
    exports.Clone=function(fn) {return new FN(fn).clone;};
  provide("node-clone", module.exports);
}(global));

// pakmanager:jqgram/lib/shiftregister.js
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  // # ShiftRegister 
    // Provides a wrapper around the arrays that aid the PQ-Gram algorithm
    
    module.exports = ShiftRegister;
    
    // ## ShiftRegister Constructor
    
    //    * size: the size of the register (size of the array).
    function ShiftRegister(size) {
        var self = this;
        if(!(self instanceof ShiftRegister)){ return new ShiftRegister(size); }
        self.register = [];
        for(var i=0; i<size; i++){
            self.register.push("*");
        }
    }
    
    // ### ShiftRegister.concatenate
    
    //    * reg: the ShiftRegister that should be concatenated with this ShiftRegister
    ShiftRegister.prototype.concatenate = function(reg){
        var self = this;
        var temp = self.register.slice(0);//self.list(self.register);
        var arr = temp.concat(reg.register);
        return arr;
    };
    
    // ### ShiftRegister.shift
    // shift removes an element from the front of the list and pushes the provided element to the back of the list.  So in essence, it does a shift() then a push() on the internal array that this ShiftRegister wraps.
    
    //    * el: the element to push.
    ShiftRegister.prototype.shift = function(el){
        var self = this;
        self.register.shift();
        self.register.push(el);
    };
    
    // ### ShiftRegister.len
    // len provides the length of this ShiftRegister (the internal array that this ShiftRegister represents), or the ShiftRegister itself.
    
    //    * reg: a ShiftRegister that if provided the length is desired, otherwise if not provided, the length of this ShiftRegister is returned. 
    ShiftRegister.prototype.len = function(reg) {
        var self = this;
        if(typeof reg === 'undefined'){
            return self.register.length;
        }else{
            return reg.register.length;
        }
    };
    
    
  provide("jqgram/lib/shiftregister.js", module.exports);
}(global));

// pakmanager:jqgram/lib/node.js
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  // # Node
    // Provides ability to create a raw node with no children, or a root node
    // of a hierarchy from which a tree will be derived provided the label 
    // and children callback functions, lfn and cfn respectively.
    // To create a simple Node with no children provide
    
    
    module.exports = Node;
    
    // ## Node Constructor
    //    * label: a string for simple Node with no children or an object from which the root node of the tree will be derived provided lfn and cfn label and callbacck functions provided.
    //    * lfn: the label callback function, which must return a string label.  Ignored if label is a string
    //    * cfn: the children callback function, which must return an array of children from which child nodes will be derived.  Ignored if label is a string. 
    function Node(label, lfn, cfn){
        var self = this;
        if(!(self instanceof Node)){ return new Node(label, lfn, cfn); }
    
        if(typeof label === 'string' && label.length > 0){
            self.tedlabel = label;
            self.tedchildren = [];
        }else if(typeof label === 'object' && !! lfn && !! cfn){
            self.tedlabel = lfn(label);
            self.tedchildren = [];
            if(typeof self.tedlabel === 'string'){
                var kids = cfn(label);
                if(!! kids){
                    for(var i=0; i<kids.length; i++){
                        var n = new Node(kids[i],lfn,cfn);
                        if(!! n && !! n.tedlabel){
                            self.addkid(n);
                        }
                    }
                }
            }
        }
    }
    
    // ### Node.addkid
    // Create a node and add it as a child to an existing node or to a basic node created with only a string label.
    
    //    * node: The parent Node.
    //    * before: boolean true indicates that the new node should be prepended to existing children of the parent node, false to append, default false.
    Node.prototype.addkid = function(node, before){
        var self = this;
        before = before || false;
        if(before){
            self.tedchildren.unshift(node);
        }else{
            if(!self.tedchildren){ try{ throw new Error('yo'); }catch(e){ console.log(e.stack); } }
            self.tedchildren.push(node);
        }
        return self;
    };
    
    
  provide("jqgram/lib/node.js", module.exports);
}(global));

// pakmanager:jqgram/lib/profile.js
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  // # Profile
    // Creates a PQ-Gram profile from a Node, using p and q values 
    
    var ShiftRegister =  require('jqgram/lib/shiftregister.js');
    
    module.exports = Profile;
    
    // ## Profile Constructor
    
    //    * root: the root Node 
    //    * p: the p value in the PQ-Gram algorithm
    //    * q: the q value in the PQ-Gram algorithm
    function Profile(root, p, q){
        var self = this;
        if(!(self instanceof Profile)){ return new Profile(root, p, q); }
        p = p || 2;
        q = q || 3;
        var ancestors = new ShiftRegister(p);
        self.list = [];
        self.profile(root, p, q, ancestors);
    }
    
    // ### Profile.profile 
    
    //    * root: the root Node
    //    * p: the p value in the PQ-Gram algorithm
    //    * q: the q value in the PQ-Gram algorithm
    //    * ancestors: the ancestors
    Profile.prototype.profile = function(root, p, q, ancestors){
        var self = this;
        ancestors.shift(root.tedlabel);
        var siblings = new ShiftRegister(q);
        if(root.tedchildren.length === 0){
            self.append(ancestors.concatenate(siblings));
        }else{
            var childs = root.tedchildren;
            for(var i=0; i<childs.length; i++){
                var child = childs[i];
                if(!! child.tedlabel){
                    siblings.shift(child.tedlabel);
                    self.append(ancestors.concatenate(siblings));
                    self.profile(child, p, q, clone(ancestors));
                }
            }
            for(var j=0; j<q-1; j++){
                siblings.shift("*");
                self.append(ancestors.concatenate(siblings));
            }
        }
    };
    
    // ### Profile.edit_distance
    // Determines the distance of this Profile to another
    // Profile.
    
    //    * other: a Profile object representing the other profile against which to compare
    //    * returns: the PQ-Gram edit_distance between this Profile and another Profile
    Profile.prototype.edit_distance = function(other){
        var self = this;
        var union = self.list.length + other.list.length;
        return 1.0 - 2.0 * (self.intersection(other) / union);
    };
    
    // ### Profile.intersection
    // Determine the intersection of this Profile with another profile
    
    //    * other: a Profile object representing the other profile against which to obtain the intersection
    //    * returns: the intersection between this profile and other profile
    Profile.prototype.intersection = function(other){
        var self = this;
        var intersect = 0.0;
        var i = 0;
        var j = 0;
        while(i < self.list.length && j < other.list.length){
            intersect += self.gram_edit_distance(self.list[i], other.list[j]);
            var listi = self.list[i].join();
            var listj = self.list[j].join();
            if(listi === listj){
                i += 1;
                j += 1;
            }else if(listi < listj){
                i += 1;
            }else{
                j += 1;
            }
        }
        return intersect;
    };
    
    // ### Profile.compare
    // Compare two arrays
    
    //    * a1: the first array
    //    * a2: the second array
    //    * returns: true of arrays are same, false otherwise
    Profile.prototype.compare = function(a1,a2) {
        if (a1.length !== a2.length){ return false; }
        for (var i = 0; i < a2.length; i++) {
            //if (!self.compare(a1[i],a2[i])) return false;
            if (a1[i] !== a2[i]){ return false; }
        }
        return true;
    };
    
    // ### Profile.gram_edit_distance
    // Get the gram edit distance between two grams by comparing them as arrays and returning one or zero
    
    //    * gram1: the first gram
    //    * gram2: the second gtam
    //    * returns: 1 if gram1 and gram2 are the same, 0 if they are different
    Profile.prototype.gram_edit_distance = function(gram1, gram2){
        var self = this;
        var distance = 0.0;
        if(self.compare(gram1,gram2)){
            distance = 1.0;
        }
        return distance;
    };
    
    // ### Profile.append
    // Appends a value to the Profile's list array.
    
    //    * value: the value to append
    Profile.prototype.append = function(value){
        var self = this;
        self.list.push(value);
    };
    
    // ### Profile.len
    // Provides the length of the Profile indicated by prof, or the length of this Profile if prof is not provided
    
    //    * prof: the profile for which to obtain list length.
    Profile.prototype.len = function(prof) {
        var self = this;
        if(typeof prof === 'undefined'){
            return self.list.length;
        }else{
            return prof.list.length;
        }
    };
    
    // ## node-clone provided by Paul Vorbach
    
    // Copyright © 2011-2013 Paul Vorbach
    
    // Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
    
    // The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
    
    function clone(parent, circular) {
        if(typeof circular === 'undefined'){
            circular = false;
        }
    
        var useBuffer = (typeof Buffer !== 'undefined');
    
        var circularParent = {};
        var circularResolved = {};
        var circularReplace = [];
    
        function _clone(parent, context, child, cIndex) {
            var i; // Use local context within this function
            // Deep clone all properties of parent into child
            if (typeof parent === 'object') {
                if (parent === null){ return parent; }
                // Check for circular references
                for(i in circularParent){
                    if (circularParent[i] === parent) {
                        // We found a circular reference
                        circularReplace.push({'resolveTo': i, 'child': child, 'i': cIndex});
                        return null; //Just return null for now...
                        // we will resolve circular references later
                    }
                }
    
                // Add to list of all parent objects
                circularParent[context] = parent;
                // Now continue cloning...
                if (util.isArray(parent)) {
                    child = [];
                    for(i in parent){
                        child[i] = _clone(parent[i], context + '[' + i + ']', child, i);
                    }
                }else if (util.isDate(parent)){
                    child = new Date(parent.getTime());
                }else if (util.isRegExp(parent)){
                    child = new RegExp(parent.source);
                }else if (useBuffer && Buffer.isBuffer(parent)) {
                    child = new Buffer(parent.length);
                    parent.copy(child);
                } else {
                    child = {};
                    // Also copy prototype over to new cloned object
                    // MLM: Not needed. 
                    //child.__proto__ = parent.__proto__;
                    for(i in parent){
                        // MLM: don't clone on exception:
                        try{
                            child[i] = _clone(parent[i], context + '[' + i + ']', child, i);
                        }catch(e){ }
                    }
                }
    
                // Add to list of all cloned objects
                circularResolved[context] = child;
            }else{
                child = parent; //Just a simple shallow copy will do
            }
            return child;
        }
    
        var i;
        if (circular) {
            var cloned = _clone(parent, '*');
    
            // Now this object has been cloned. Let's check to see if there are any
            // circular references for it
            for(i in circularReplace) {
                var c = circularReplace[i];
                if (c && c.child && c.i in c.child) {
                    c.child[c.i] = circularResolved[c.resolveTo];
                }
            }
            return cloned;
        } else {
            // Deep clone all properties of parent into child
            var child;
            if (typeof parent === 'object') {
                if (parent === null){
                    return parent;
                }
                if (parent.constructor.name === 'Array') {
                    child = [];
                    for(i in parent){
                        child[i] = clone(parent[i], circular);
                    }
                }else if (util.isDate(parent)){
                    child = new Date(parent.getTime() );
                }else if (util.isRegExp(parent)){
                    child = new RegExp(parent.source);
                }else {
                    child = {};
                    //MLM: Not needed:
                    //child.__proto__ = parent.__proto__;
                    for(i in parent){ 
                        child[i] = clone(parent[i], circular);
                    }
                }
            }else{ 
                child = parent; // Just a simple shallow clone will do
            }
            return child;
        }
    }
    
    var objectToString = function(o) {
        return Object.prototype.toString.call(o);
    };
    
    var util = {
        isArray: function (ar) {
            return Array.isArray(ar) || (typeof ar === 'object' && objectToString(ar) === '[object Array]');
        },
        isDate: function (d) {
            return typeof d === 'object' && objectToString(d) === '[object Date]';
        },
        isRegExp: function (re) {
            return typeof re === 'object' && objectToString(re) === '[object RegExp]';
        }
    };
    
  provide("jqgram/lib/profile.js", module.exports);
}(global));

// pakmanager:jqgram
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  // # JQGram
    
    // Utilizes setImmediate 
    require("setimmediate");
    // ## node.js
    // Defines a Node of a tree as containing a label and an array of children.
    var Node =  require('jqgram/lib/node.js');
    // ## profile.js 
    // The guts of the pq-gram algorithm
    var Profile =  require('jqgram/lib/profile.js');
    // ## shiftregister.js
    // Convenience for profile.js and differs slightly from the Python PyGram implementation from which jqgram was originally ported.
    var ShiftRegister =  require('jqgram/lib/shiftregister.js');
    
    (function(exports, undefined){
    
        var setImmediate = !!setImmediate ? setImmediate : function(fn){setTimeout(fn,0); };
    
        // ## jqgram
        // The jqgram object exposes one method and three constructors, however in typical usage, only the distance method is used.  Node, Profile, and ShiftRegister are however exposed for custom requirements.
    
        exports.jqgram = {
        // ### distance
        // Allows easy generation of two profiles defined by root nodes, and returns the resulting pq-gram edit distance approximation.
        // Please see the examples on github for more details on how to use the distance function to define the trees, the p and q options, and the callback (cb) function that is provided with the resulting pq-gram edit distance.
        
        // * roota: An object that contains the root of the first tree with the lfn (label callback function) and cfn (child callback function) defined.
        // * roota: An object that represents the root of the second tree with the lfn (label callback function) and cfn (child callback function) defined.
        // * opts (optional): An object that contains p and q values, default: "{p: 2, q: 3}"
        // * cb: the callback function that will be executed with one argument, an object with a property "distance" that contains a float value between 0.0 and 1.0 representing the pq-gram edit distance  approximation between the trees rooted at roota and rootb.
            distance: function(roota, rootb, opts, cb) {
                if(typeof opts === 'function') cb = opts, opts = {};
                opts.p = opts.p || 2;
                opts.q = opts.q || 3;
                setImmediate(function() {
                    var nodea = new Node(roota.root,roota.lfn,roota.cfn);
                    var nodeb = new Node(rootb.root,rootb.lfn,rootb.cfn);
                    var profa = new Profile(nodea, opts.p, opts.q);
                    var profb = new Profile(nodeb, opts.p, opts.q);
                    cb({ "distance": profa.edit_distance(profb) });
                });
            },
            //    * Node: allow creation of basic nodes with labels and children
            Node: Node,
            //    * Profile: allows edit_distances to be determined between manuallly created profiles 
            Profile: Profile,
            //    * ShiftRegister: mainly exposed for test cases, not typically used by developers
            ShiftRegister: ShiftRegister
        };
    
    
    // allow jqgram to be utilized in browser or node environments:
    })(typeof exports === 'undefined' ? this.jqgram = {} : exports);
    
    
    
  provide("jqgram", module.exports);
}(global));