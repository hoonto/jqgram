
////////////////////////////////////////////////////
console.log('document keys!');
    self.docclone = new TED().clone(document,true);
    console.log('document.location == ' + self.docclone.location);
    console.log('document.location.href == ' + self.docclone.location.href);
    self.docclone.location.href = 'http://this.is.cool';
    console.log('document.location.href now == ' + self.docclone.location.href);
    //var divclone = docclone.createElement('div');
    console.log('typeof docclone == ' + typeof self.docclone);
    console.log('typeof docclone.getElementsByTagName == ' + typeof self.docclone.getElementsByTagName);
    var bodylist = self.docclone.getElementsByTagName('BODY');
    console.log('bodylist == ' + bodylist.length);




                        var seekroot2 = function(troot,iroots){
                            var t = TED();
                            var trootlen = troot.find('*').length;
                            //console.log('troot.length == ' + trootlen);

                            var bestedit = Number.MAX_VALUE;
                            if(iroots && iroots.length > 0){
                                var besti = iroots[0];
                                var bestited;
                                for(var i=0; i<iroots.length; i++){
                                    var iroot = iroots[i];
                                    var irootlen = $(iroot).find('*').length;
                                    //console.log(irootlen);
                                    //var rootr = trootlen / irootlen;
                                    //console.log('rootr == ' + rootr);
                                    //if(trootlen > 3 && irootlen > 3 && rootr == 1){ 
                                        var total = t.TEdit({
                                            root: troot[0],
                                            lfn: function(node){
                                                return node.name;
                                            },
                                            cfn: function(node){
                                                var retarr = [];
                                                if(!! node.attribs &&
                                                    !! node.attribs.class){
                                                    retarr = retarr.concat(node.attribs.class.split(' '));
                                                }
                                                if(!! node.attribs && 
                                                    !! node.attribs.id){
                                                    retarr.push(node.attribs.id);
                                                }
                                                retarr = retarr.concat(node.children);
                                                return retarr;
                                            }
                                        },{
                                            root: iroot,
                                            lfn: function(node) {
                                                return node.nodeName.toLowerCase();
                                            },
                                            cfn: function(node) {
                                                var retarr = [];
                                                if(!! node.attributes &&
                                                !! node.attributes.class &&
                                                !! node.attributes.class.nodeValue){
                                                    retarr = retarr.concat(node.attributes.class.nodeValue.split(' '));
                                                }
                                                if(!! node.attributes &&
                                                !! node.attributes.id &&
                                                !! node.attributes.id.nodeValue) {
                                                    retarr.push(node.attributes.id.nodeValue);
                                                }
                                                for(var i=0; i<node.children.length; i++){
                                                    retarr.push(node.children[i]);
                                                }
                                                return retarr;
                                            }
                                        },1,1,Number.MAX_VALUE);

                                        if(total < bestedit){
                                            //console.log('^^ chosen ^^');
                                            bestedit = total;
                                            besti = iroot;
                                        }
                                    //}
                                }
                                //console.log('--- final ited: ');
                                //console.log(appAPI.JSON.stringify(bestited));
                                
                                return $(besti);
                            }
                        }
/** Example usage 
 * var t = TED();
 * var a = new t.Node("html")
 * var al = new t.Node('head')
 * var a2 = new t.Node('body')
 * a.addkid(al, true)
 * a.addkid(a2, false)

 * var b = new t.Node('html')
 * var bl = new t.Node('head')
 * var b2 = new t.Node('body')
 * var b3 = new t.Node('another')
 * b.addkid(bl, true)
 * b.addkid(b2, false)
 * b.addkid(b3, false)

 * var c = new t.Node('html')
 * var c1 = new t.Node('head')
 * var c2 = new t.Node('style')
 * var c3 = new t.Node('script')
 * c.addkid(c1, true)
 * c1.addkid(c2, false)
 * c1.addkid(c3, false)

 * var d = new t.Node('html')
 * var dl = new t.Node('head')
 * var d2 = new t.Node('bodZ')
 * d.addkid(dl, true)
 * d.addkid(d2, false)

 * ap = t.Profile(a)
 * bp = t.Profile(b)
 * cp = t.Profile(c)
 * dp = t.Profile(d)

 * console.log(ap.edit_distance(bp));
 * console.log(ap.edit_distance(cp));
 * console.log(ap.edit_distance(dp));

 * console.log(bp.edit_distance(cp));
 * console.log(bp.edit_distance(dp));

 * console.log(cp.edit_distance(dp));
 */



