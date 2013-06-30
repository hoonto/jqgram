// # Node
//
// Provides ability to create a raw node with no children, or a root node
// of a hierarchy from which a tree will be derived provided the label 
// and children callback functions, lfn and cfn respectively.
//
// To create a simple Node with no children provide
// * label: a string label 


module.exports = Node;

// * label: a string for simple Node with no children, an object from which the root node of the tree will be derived provided lfn and cfn label and callbacck functions provided.
// * lfn: the label callback function, which must return a string label.  Ignored if label is a string
// * cfn: the children callback function, which must return an array of children from which child nodes will be derived.  Ignored if label is a string. 
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
// Node.addkid
// Create a node and add it as a child to an existing node or to a basic node created with only a string label.
//
// node: The parent Node.
// before: boolean true indicates that the new node should be prepended to existing children of the parent node, false to append.
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

