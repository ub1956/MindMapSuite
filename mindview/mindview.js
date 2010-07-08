///////////////////////////////////////////////////////////
// Some util functions
String.prototype.trim = function() {
  return this.replace(/^\s*(\b.*\b|)\s*$/, "$1");
}


///////////////////////////////////////////////////////////
// The only one instance for YTree
var g_YTree = null;


///////////////////////////////////////////////////////////
// Javascript Tree
YTree.prototype				= new Object();
YTree.prototype.constructor	= YTree;
YTree.superclass			= Object.prototype;

function YTree() {
	// the only one root node
	this.rootNode			= null;
	this.rootNodeID			= "r";
	// hold all node by hashmap
	this.nodes				= new Array;
	// hold the latest node id
	this.maxid				= 0;
	
	
	// assign this to the only one instance
	g_YTree = this;
	
	// YTree CONSTANT
	this.NODE_POS_ROOT		= 0;
	this.NODE_POS_LEFT		= 1;
	this.NODE_POS_RIGHT		= 2;
	
	this.NODE_SIB_PREV		= 0;
	this.NODE_SIB_NEXT		= 1;
	
	this.NODE_SWITCH_UP		= 0;
	this.NODE_SWITCH_DN		= 1;
}


YTree.prototype.initTree = function(text) {
	this.rootNode.removeChildren();
	
	this.rootNode.text	= text;
	this.maxid			= 0;
}

YTree.prototype.getYNodeTextFromXNode = function(xnode) {
	var text = xnode.getAttribute("TEXT");
	if ( text == undefined || text == null || text.length == 0 ) {
		return "untitled";
	}
	
	var toks = text.split(/&#x/g);
	var str = "";
	for ( var i=0; i<toks.length; i++ ) {
		tok = toks[i];
		if ( tok == undefined || tok == null || tok.length == 0 ) {
			continue;
		}

		if ( tok.length == 5 && tok.charAt(4) == ';' ) {
			str += String.fromCharCode(
					(parseInt(tok.charAt(0) + tok.charAt(1), 16)<<8) +
					(parseInt(tok.charAt(2) + tok.charAt(3), 16))
				);
		} else {
			var tmpStr = tok.replace(/&amp;/g, '&');
			tmpStr = tmpStr.replace(/&quot;/g, '"');
			tmpStr = tmpStr.replace(/&lt;/g, '<');
			tmpStr = tmpStr.replace(/&gt;/g, '>');
			str += tmpStr;
		}
	}

	return str;
}


YTree.prototype.getXNodeTextFromYNode = function(ynode) {
	string = ynode.text.replace(/\r\n/g,"\n");
	var utftext = "";

	for (var n = 0; n < string.length; n++) {
		var c = string.charCodeAt(n);

		/*
		if (c < 128) {
			utftext += String.fromCharCode(c);
		} else if ( (c > 127) && (c < 2048) ) {
			utftext += String.fromCharCode((c >> 6) | 192);
			utftext += String.fromCharCode((c & 63) | 128);
		} else {
			utftext += String.fromCharCode((c >> 12) | 224);
			utftext += String.fromCharCode(((c >> 6) & 63) | 128);
			utftext += String.fromCharCode((c & 63) | 128);
		}
		*/
		if (c < 256) {
			var aChar = String.fromCharCode(c);
			
			if ( aChar == '&' ) {
				utftext += '&amp;';
			} else if ( aChar == '"' ) {
				utftext += '&quot;';
			} else if ( aChar == '<' ) {
				utftext += '&lt;';
			} else if ( aChar == '>' ) {
				utftext += '&gt;';
			} else {
				utftext += aChar;
			}

		} else {
			utftext += "&#x" + c.toString(16) + ";";
		}
	}

	return utftext;
}

YTree.prototype.buildYNodes = function(xnode, ynode) {
	ynode.text = this.getYNodeTextFromXNode(xnode);

	for ( var i=0; i<xnode.childNodes.length; i++ ) {
		var tmpXNode = xnode.childNodes[i];
		if ( tmpXNode.tagName == "node" ) {
			var pos = tmpXNode.getAttribute("POSITION");
			if ( pos == "right" ) {
				pos = this.NODE_POS_RIGHT;
			} else {
				pos = this.NODE_POS_LEFT;
			}
			
			var folded = tmpXNode.getAttribute("FOLDED");
			if ( folded == "true" ) {
				ynode.collapsed = true;
			}

			var tmpYNode = ynode.appendChild("", pos);
			this.buildYNodes(tmpXNode, tmpYNode);
			
		} else if ( tmpXNode.tagName == "font" ) {
			var bold = tmpXNode.getAttribute("BOLD");
			if ( bold == "true" ) {
				ynode.bold = true;
			}
			
			var italic = tmpXNode.getAttribute("ITALIC");
			if ( italic == "true" ) {
				ynode.italic = true;
			}
		}
	}
}

YTree.prototype.loadFromXML = function(XMLString) {
	var doc, x;

	if ( window.ActiveXObject ) {
		var doc=new ActiveXObject("Microsoft.XMLDOM");
		doc.async="false";
		doc.loadXML(XMLString);
	} else {
		var parser = new DOMParser();
		doc = parser.parseFromString(XMLString,"text/xml");
	}
	
	x = doc.documentElement; // map

	for ( var i=0; i<x.childNodes.length; i++ ) {
		var xnode = x.childNodes[i];
		if ( xnode.tagName == "node" ) {
			this.buildYNodes(xnode, this.rootNode);
			break;
		}
	}
	
}

YTree.prototype.buildText = function(ynode, bWithIndent) {
	var str = "";
	if ( bWithIndent ) {
		for ( var i=0; i<ynode.indent; i++ ) {
			str += "\t";
		}
	}
	str += ynode.text + "\n";

	if ( ynode.indent == 0 ) {
		var tmpNode = null;
		for ( var i=0; i<ynode.childNodes.length; i++ ) {
			var cNode = this.getNodeById(ynode.childNodes[i]);
			if ( cNode && cNode.pos == this.NODE_POS_RIGHT ) {
				tmpNode = cNode.getSiblingHead();
				break;
			}
		}
		
		while ( tmpNode ) {
			str += this.buildText(tmpNode, bWithIndent);
			tmpNode = tmpNode.nextNode;
		}
		
		tmpNode = null;
		for ( var i=0; i<ynode.childNodes.length; i++ ) {
			var cNode = this.getNodeById(ynode.childNodes[i]);
			if ( cNode && cNode.pos == this.NODE_POS_LEFT ) {
				tmpNode = cNode.getSiblingHead();
				break;
			}
		}
		
		while ( tmpNode ) {
			str += this.buildText(tmpNode, bWithIndent);
			tmpNode = tmpNode.nextNode;
		}

	} else {
		var tmpNode = null;
		if ( ynode.childNodes.length > 0 ) {
			var cNode = this.getNodeById(ynode.childNodes[0]);
			if ( cNode ) {
				tmpNode = cNode.getSiblingHead();
			}
		}
		
		while ( tmpNode ) {
			str += this.buildText(tmpNode, bWithIndent);
			tmpNode = tmpNode.nextNode;
		}
	}
	
	return str;
}

YTree.prototype.exportToText = function(bWithIndent) {
	return this.buildText(this.rootNode, bWithIndent);
}

YTree.prototype.createRootNode = function(text) {
	this.rootNode = new YNode(null, this.NODE_POS_ROOT, text);

	return this.rootNode;
}

YTree.prototype.addNode = function(node) {
	this.nodes[node.id] = node;
}

YTree.prototype.deleteNodeById = function(id) {
	// What's this?
	// hashmap is just fine for deleting it's key:value pair.
	delete this.nodes[id];
}

YTree.prototype.removeNode = function(node) {
	if ( node.parentNode == null ) {
		return false;
	}

	node.removeChildren();
	
	for ( var i=0; i<node.parentNode.childNodes.length; i++ ) {
		var tmpNode = g_YTree.getNodeById(node.parentNode.childNodes[i]);
		if ( node.id == tmpNode.id ) {
			node.parentNode.childNodes.splice(i,1);

			if ( node.prevNode ) {
				node.prevNode.nextNode = node.nextNode;
			}
			if ( node.nextNode ) {
				node.nextNode.prevNode = node.prevNode;
			}
			
			this.deleteNodeById(node.id);
			return true;
		}
	}

	return false;
}

YTree.prototype.getNodeById = function(id) {
	return this.nodes[id];
}

YTree.prototype.getNextMaxId = function() {
	this.maxid++;
	return this.maxid;
}


YNode.prototype				= new Object();
YNode.prototype.constructor	= YNode;
YNode.superclass			= Object.prototype;

function YNode(parent, pos, text) {
	if ( parent ) {
		if ( this.indent == 1 ) {
		}
		this.id = "_" + g_YTree.getNextMaxId();
		this.indent = parent.indent + 1;
	} else {
		// this node is root node
		this.indent = 0;
		this.id = g_YTree.rootNodeID;
	}
	this.pos = pos;
	this.text = text.trim();
	this.collapsed = false;

	// hold all children's id string
	this.childNodes = new Array;

	this.parentNode = parent;
	// need for sequencial order for each sibling nodes
	this.prevNode = null;	
	this.nextNode = null;
	
	this.lastSelectedChildID = "";
	
	this.bold = false;
	this.italic = false;

	// append node itself
	g_YTree.addNode(this);
}

YNode.prototype.toString = function () {
	return this.id;
}

YNode.prototype.appendChild = function (text, pos) {
	var newPos;
	
	// Make this tree ballanced
	if ( this.pos == g_YTree.NODE_POS_ROOT ) {
		if ( pos == undefined || pos == null ) {
			var leftNodeCnt = 0;
			var rightNodeCnt = 0;
			var childNodeCnt = this.childNodes.length;
			
			for ( var i=0; i<childNodeCnt; i++ ) {
				var tmpNode = g_YTree.getNodeById(this.childNodes[i]);
				if ( tmpNode.pos == g_YTree.NODE_POS_LEFT ) {
					leftNodeCnt++;
				} else {
					rightNodeCnt++;
				}
			}
	
			if ( leftNodeCnt >= rightNodeCnt ) {
				newPos = g_YTree.NODE_POS_RIGHT;
			} else {
				newPos = g_YTree.NODE_POS_LEFT;
			}
		} else {
			newPos = pos;
			if ( newPos != g_YTree.NODE_POS_RIGHT && newPos != g_YTree.NODE_POS_LEFT ) {
				newPos = g_YTree.NODE_POS_RIGHT;
			}
		}
		
	} else {
		newPos = this.pos;
	}
	
	var node = new YNode(this, newPos, text);
	
	var pnode = null;
	
	// Child node will be the last node in this node
	if ( this.pos == g_YTree.NODE_POS_ROOT ) {
		for ( var i=0; i<this.childNodes.length; i++ ) {
			var tmpNode = g_YTree.getNodeById(this.childNodes[i]);
			if ( tmpNode.pos == newPos ) {
				pnode = tmpNode;
				break;
			}
		}
	} else {
		if ( this.childNodes.length > 0 ) {
			pnode =  g_YTree.getNodeById(this.childNodes[0]);
		}
	}
		
	if ( pnode != null ) {
		while(pnode.nextNode != null) {
			pnode = pnode.nextNode;
		}
		pnode.nextNode = node;
		node.prevNode = pnode;
	}


	// hold all child nodes' id
	this.childNodes.push(node.id);

	return node;
}

YNode.prototype.getSiblingHead = function () {
	var tmpNode = this.prevNode;
	if ( tmpNode ) {
		while ( tmpNode.prevNode != null ) {
			tmpNode = tmpNode.prevNode;
		}
	} else {
		tmpNode = this;
	}
	return tmpNode;
}

YNode.prototype.getChildHead = function () {
	if ( this.childNodes.length == 0 ) {
		return null;
	}
	return g_YTree.getNodeById(this.childNodes[0]).getSiblingHead();
}

YNode.prototype.getSiblingTail = function () {
	var tmpNode = this.nextNode;
	if ( tmpNode ) {
		while ( tmpNode.nextNode != null ) {
			tmpNode = tmpNode.nextNode;
		}
	} else {
		tmpNode = this;
	}
	return tmpNode;
}

YNode.prototype.getChildTail = function () {
	if ( this.childNodes.length == 0 ) {
		return null;
	}
	return g_YTree.getNodeById(this.childNodes[0]).getSiblingTail();
}

YNode.prototype.getLastSelectedChild = function (pos) {
	var tmpNode = null;
	var childCnt = this.childNodes.length;
	
	if ( childCnt == 0 ) {
		return null;
	}
	
	if ( this.lastSelectedChildID != "" )
		tmpNode = g_YTree.getNodeById(this.lastSelectedChildID);

	if (
		(tmpNode == undefined || tmpNode == null) ||
		(tmpNode.parentNode.id != this.id || (this.indent == 0 && tmpNode.pos != pos))
	) {
		tmpNode = null;
		if ( this.indent == 0 ) {
			for ( var i=0; i<childCnt; i++ ) {
				var cNode = g_YTree.getNodeById(this.childNodes[i]);
				if ( cNode.pos == pos ) {
					tmpNode = cNode;
					break;
				}
			}
		} else {
			tmpNode = g_YTree.getNodeById(this.childNodes[0]);
		}

		return (tmpNode != null)? tmpNode.getSiblingHead():null;
	}

	return tmpNode;	
}

YNode.prototype.switchNode = function (dir) {
	if ( dir != g_YTree.NODE_SWITCH_UP && dir != g_YTree.NODE_SWITCH_DN ) {
		return null;
	}
	
	var pnode = this.prevNode;
	var nnode = this.nextNode;
	
	if ( dir == g_YTree.NODE_SWITCH_UP ) {
		if ( pnode == null ) {
			return null;
		}

		if ( pnode.prevNode ) {
			this.prevNode = pnode.prevNode;
			pnode.prevNode.nextNode = this;
		} else {
			this.prevNode = null;
		}
		
		if ( nnode ) {
			pnode.nextNode = nnode;
			nnode.prevNode = pnode;
		} else {
			pnode.nextNode = null;
		}
		
		this.nextNode = pnode;
		pnode.prevNode = this;
		
		return pnode;

	} else {
		if ( nnode == null ) {
			return null;
		}
		
		if ( pnode ) {
			nnode.prevNode = pnode;
			pnode.nextNode = nnode;
		} else {
			nnode.prevNode = null;
		}
		
		if ( nnode.nextNode ) {
			this.nextNode = nnode.nextNode;
			nnode.prevNode = this;
		} else {
			this.nextNode = null;
		}
		
		this.prevNode = nnode;
		nnode.nextNode = this;
		
		return nnode;
	}
	
	return null;
}

YNode.prototype.appendSibling = function (text, dir) {
	if ( this.parentNode == null ) {
		return null;
	}

	var node = new YNode(this.parentNode, this.pos, text);
	
	// adjust the order for this newly inserted node
	if ( dir == g_YTree.NODE_SIB_PREV ) {	// set it previous node
		if ( this.prevNode ) {
			this.prevNode.nextNode = node;
		}
		node.prevNode = this.prevNode;
		node.nextNode = this;
		this.prevNode = node;
	} else {	// set it next node
		if ( this.nextNode ) {
			this.nextNode.prevNode = node;
		}
		node.prevNode = this;
		node.nextNode = this.nextNode;
		this.nextNode = node;
	}
	
	this.parentNode.childNodes.push(node.id);

	return node;
}

YNode.prototype.changePos = function(pos) {
	for ( var i=0; i<this.childNodes.length; i++ ) {
		node = g_YTree.getNodeById(this.childNodes[i]);
		node.changePos(pos);
	}
	this.pos = pos;
}

YNode.prototype.changeIndent = function(indent) {
	for ( var i=0; i<this.childNodes.length; i++ ) {
		node = g_YTree.getNodeById(this.childNodes[i]);
		node.changeIndent(indent+1);
	}
	this.indent = indent;
}

YNode.prototype.detachChild = function (node) {
	// javascript does not remove array element by deleting
	// Splice is the only one method that I know which really elimintes
	// array element
	for ( var i=0; i<this.childNodes.length; i++ ) {
		if ( this.childNodes[i] == node.id ) {
			var pnode = node.prevNode;
			var nnode = node.nextNode;
			node.parentNode = null;
			node.prevNode = null;
			node.nextNode = null;
			if ( pnode ) {
				pnode.nextNode = nnode;
			}
			
			if ( nnode ) {
				nnode.prevNode = pnode;
			}

			this.childNodes.splice(i,1);
			
			return true;
		}
	}
	
	return false;
}

// remove all child nodes.
// if bSelf is true remove itself.
YNode.prototype.removeChildren = function ( pos ) {
	for ( var i=this.childNodes.length-1; i >= 0; i-- ) {
		var node = g_YTree.nodes[this.childNodes[i]];
		if ( pos != undefined && node.pos != pos ) {
			continue;
		}
		this.childNodes.splice(i,1);

		node.removeChildren( pos );

		g_YTree.deleteNodeById(node.id);
	}
}

YNode.prototype.isChildren = function (id) {
	for ( var i=0; i<this.childNodes.length; i++ ) {
		node = g_YTree.getNodeById(this.childNodes[i]);
		if ( node.id == id || node.isChildren(id) == true ) {
			return true;
		}
	}
	return false;
}

YNode.prototype.attachToNode = function (tnode, pos) {
	// ignore root node
	if ( this.parentNode == null ) {
		return false;
	}
	
	var pnode = null;

	if ( tnode.indent == 0 ) {
		// swap pos when tnode is root
		if ( this.indent == 1 && this.pos == pos ) {
			return false;
		}

		var len = tnode.childNodes.length;

		for ( var i=0; i<len; i++ ) {
			var tmpNode = g_YTree.getNodeById(tnode.childNodes[i]);
			if ( tmpNode.pos == pos ) {
				pnode = tmpNode;
				break;
			}
		}
		
	} else {
	
		// ignore self attaching, parent attaching, children attaching
		if ( this.id == tnode.id || this.parentNode.id == tnode.id || this.isChildren(tnode.id) ) {
			return false;
		}
		
		if ( tnode.childNodes.length > 0 ) {
			pnode = g_YTree.getNodeById(tnode.childNodes[0]);
		}
	}
	
	// find tail node
	if ( pnode != null ) {
		while(pnode.nextNode != null) {
			pnode = pnode.nextNode;
		}
	}
	
	// remove from previous parent
	// after detachChild call parentNode will be null
	if ( !this.parentNode.detachChild(this) ) {
		return false;
	}
	
	// append this to tnode
	tnode.childNodes.push(this.id);
	if ( pnode ) {
		pnode.nextNode = this;
	}
	this.parentNode = tnode;
	this.prevNode = pnode;
	this.nextNode = null;

	// set pos if pos is different from previous pos
	if ( this.pos != pos ) {
		this.changePos(pos);
	}
	
	// set indent if indent is diffrent from previous indent
	if ( this.indent != (tnode.indent+1) ) {
		this.changeIndent(tnode.indent+1);
	}
	
	return true;
}

YNode.prototype.toggleBold = function (val) {
	if ( val != undefined ) {
		this.bold = val;
	}
	this.bold = !this.bold;
}

YNode.prototype.toggleItalic = function (val) {
	if ( val != undefined ) {
		this.italic = val;
	}
	this.italic = !this.italic;
}

var g_YView = null;
YView.prototype				= new Object();
YView.prototype.constructor	= YView;
YView.superclass			= Object.prototype;


function YView(tree, panelD, panelV) {
	this.tree					= tree;
	
	this.panelD					= panelD;
	this.panelV					= panelV;
	
	this.rootPosX				= panelD.offsetWidth/2;
	this.rootPosY				= 300;
	
	// hold all selected nodes' id
	this.selectedNodes			= new Array;
	this.lastSelectedNodeID		= "";
	
	// hold custom attributes
	this.attributes				= new Array;
	
	// Set as true when a node's text is edited.
	this.bNodeEditing			= false;

	this.CARET_ORG_START		= 0;
	this.CARET_ORG_END			= 1;
	
	this.NODE_NAV_PAGEUP		= 33;
	this.NODE_NAV_PAGEDN		= 34;
	this.NODE_NAV_LEFT			= 37;
	this.NODE_NAV_UP			= 38;
	this.NODE_NAV_RIGHT			= 39;
	this.NODE_NAV_DOWN			= 40;
	
	this.NODE_DIV_PREFIX		= "DIV";
	this.NODE_DIV_HGAP			= 20;
	this.NODE_DIV_VGAP			= 3;
	this.NODE_DIV_SELCOLOR		= "#D0D0D0";
	
	this.NODE_STYLE_BOLD		= 0;
	this.NODE_STYLE_ITALIC		= 1;

	this.NODE_LINK_PREFIX		= "LNK";
	this.NODE_LNK_WIDTH			= 1;
	this.NODE_LNK_COLOR			= "gray";
	
	this.ROOT_SHAPE_ID			= "V_ROOT";
	this.ROOT_SHAPE_HEIGHT		= 60;
	this.ROOT_SHAPE_STCOLOR		= "gray";
	this.ROOT_SHAPE_COLOR		= "white";
	this.ROOT_SHAPE_SELCOLOR	= "#D0D0D0";

	this.SVG_NAMESPACE			= "http://www.w3.org/2000/svg";
	this.SVG_RIGHTGRADIENT_ID	= "V_RGRA_ID";
	this.SVG_LEFTGRADIENT_ID	= "V_LGRA_ID";
	this.SVG_NUTRALGRADIENT_ID	= "V_NGRA_ID";
	
	this.ICON_PATH				= "icons";
	this.UIIMG_PATH				= "ui";

	this.TOOLBAR_BAND_HEIGHT	= 28;
	this.TOOLBAR_MAIN_ID		= "toolbarMain";
	this.TOOLBAR_TITLE_ID		= "toolbarTitle";
	this.TOOLBAR_ICON_ID		= "toolbarIcon";
	
	this.CONTENT_VIEW_ID		= "contentView";
	this.CONTENT_FORM_ID		= "contentForm";
	this.CONTENT_TEXT_ID		= "contentText";

	this.dragObject				= null;
	this.dragPos				= 0;
	this.dragOldLeft			= 0;
	this.dragOldTop				= 0;
	this.mouseOffset			= null;
	
	if ( window.HTMLElement ) {
		this.createSVGElement();
	}


	this.bEditingLock			= false;
	this.bPermanentLock			= false;
	
	g_YView = this;
	this.centerPanelView();

	if ( document.all ) {
		panelD.onselectstart = function() { return (g_YView.bNodeEditing) ?true:false; }
	}
	panelD.onclick = function() { if ( !g_YView.bNodeEditing ) makeDraggable(panelD);}
}

YView.prototype.setAttribute = function(key, val) {
	this.attributes[key] = val;
}

YView.prototype.getAttribute = function(key) {
	if ( this.attributes[key] == undefined || this.attributes[key] == null ) {
		return null;
	}
	
	return this.attributes[key];
}

YView.prototype.removeAttribute = function(key) {
	if ( this.attributes[key] == undefined || this.attributes[key] == null ) {
		return null;
	}
	
	val = this.attributes[key];
	delete this.attributes[key];
	
	return val;
}

YView.prototype.isLockEditing = function() {
	return this.bEditingLock;
}

YView.prototype.lockEditing = function() {
	this.bEditingLock = true;
}

YView.prototype.unLockEditing = function() {
	if ( this.bPermanentLock ) return;
	this.bEditingLock = false;
}

YView.prototype.isPermanentLocked = function() {
	return this.bPermanentLock;
}

YView.prototype.setPermanentLock = function(val) {
	this.bPermanentLock = val;
	
	if ( val ) {
		var oInput = document.getElementById(this.TOOLBAR_TITLE_ID);
		if ( oInput ) {
			oInput.readOnly = true;
		}
	} else {
		var oInput = document.getElementById(this.TOOLBAR_TITLE_ID);
		if ( oInput ) {
			oInput.readOnly = false;
		}
	}
}

YView.prototype.toggleContentView = function() {
	var oPanel = document.getElementById(this.CONTENT_VIEW_ID);
	
	if ( oPanel == null ) return false;
	
	if ( oPanel.style.display == "none" ) {
		oPanel.style.display = "";
	} else {
		oPanel.style.display = "none";
	}
}


YView.prototype.importMap = function() {
	var xmlString = '<?xml version="1.0" encoding="UTF-8"?>' + this.getContentViewText();
	this.initMap("New MindWeb");
	this.tree.loadFromXML(xmlString);
	this.redrawTree();
}

YView.prototype.setContentTitle = function(str) {
	var oInput = document.getElementById(this.TOOLBAR_TITLE_ID);

	if ( oInput == null ) return;
	
	oInput.value = str;
}

YView.prototype.getContentTitle = function() {
	var oInput = document.getElementById(this.TOOLBAR_TITLE_ID);

	if ( oInput == null ) return "";
	
	return oInput.value;
}

YView.prototype.setContentViewText = function(str) {
	var oForm = document.getElementById(this.CONTENT_FORM_ID);
	
	if ( oForm == null ) return;
	
	oForm.childNodes[0].value = str;
}

YView.prototype.getContentViewText = function() {
	var oForm = document.getElementById(this.CONTENT_FORM_ID);

	if ( oForm == null ) return "";

	return oForm.childNodes[0].value;
}

YView.prototype.centerPanelView = function() {
	if ( document.all ) {
		var w = 2048;
		var h = 4096;
	
		this.panelD.style.width = w + "px";
		this.panelD.style.height = h + "px";
		
		this.panelD.style.left = parseInt((document.body.clientWidth - w)/2, 10) + "px";
		this.panelD.style.top = 0 - (h/2) + 300 + "px";
	}
}


YView.prototype.createSVGElement = function() {
	// Node collapsed end marker
	var oMarker = document.createElementNS(this.SVG_NAMESPACE, "marker");
	
	oMarker.setAttribute("id", "EndMarker");
	oMarker.setAttribute("markerUnits", "userSpaceOnUse");

	//if 
	oMarker.setAttribute("viewBox", "0 0 16 16");

	oMarker.setAttribute("refX", "0");
	oMarker.setAttribute("refY", "8");
	oMarker.setAttribute("fill", this.NODE_LNK_COLOR);

	if ( this.NODE_LNK_WIDTH == 1 ) {
		oMarker.setAttribute("markerWidth", this.NODE_LNK_WIDTH*8);
	} else {
		oMarker.setAttribute("markerWidth", this.NODE_LNK_WIDTH*4);
	}

	oMarker.setAttribute("markerHeight", this.NODE_LNK_WIDTH*8);
	oMarker.setAttribute("orient", "auto");

	this.panelV.appendChild(oMarker);
	
	var oCircle = document.createElementNS(this.SVG_NAMESPACE, "circle");
	
	oCircle.setAttribute("cx", "8");
	oCircle.setAttribute("cy", "8");
	oCircle.setAttribute("r", "8");
	oCircle.setAttribute("r", "8");
	
	oMarker.appendChild(oCircle);
	
	// Root node left|right|nutral gradient
	var oGra = new Array(3);
	var oGraIds = new Array(
		this.SVG_RIGHTGRADIENT_ID,
		this.SVG_LEFTGRADIENT_ID,
		this.SVG_NUTRALGRADIENT_ID);
	var oStop = new Array(6);
	
	for ( var i=0; i<oGra.length; i++ ) {
		oGra[i] = document.createElementNS(this.SVG_NAMESPACE, "linearGradient");
		oGra[i].setAttribute("id", oGraIds[i]);
		
		oStop[i*2] = document.createElementNS(this.SVG_NAMESPACE, "stop");
		oStop[i*2+1] = document.createElementNS(this.SVG_NAMESPACE, "stop");

		oStop[i*2].setAttribute("offset", "0%");
		oStop[i*2+1].setAttribute("offset", "100%");

		oGra[i].appendChild(oStop[i*2]);
		oGra[i].appendChild(oStop[i*2+1]);
		
		this.panelV.appendChild(oGra[i]);
	}
	
	oStop[0].setAttribute("stop-color", this.ROOT_SHAPE_COLOR);
	oStop[1].setAttribute("stop-color", this.ROOT_SHAPE_SELCOLOR);
	
	oStop[2].setAttribute("stop-color", this.ROOT_SHAPE_SELCOLOR);
	oStop[3].setAttribute("stop-color", this.ROOT_SHAPE_COLOR);
	
	oStop[4].setAttribute("stop-color", this.ROOT_SHAPE_SELCOLOR);
	oStop[5].setAttribute("stop-color", this.ROOT_SHAPE_SELCOLOR);
}

YView.prototype.initMap = function(text) {
	this.deleteNodeView(this.tree.rootNode);
	this.tree.initTree(text);
	
	delete this.selectedNodes;
	this.selectedNodes = new Array;
	
	this.lastSelectedNodeID		= "";
	this.bNodeEditing			= false;
	
	
	this.redrawTree();
	
	this.selectNode(this.tree.rootNode, false);
}

YView.prototype.getSelectedNodeCount = function() {
	return this.selectedNodes.length;
}

YView.prototype.getLastSelectedNode = function() {
	return (this.lastSelectedNodeID == "")? null:this.tree.getNodeById(this.lastSelectedNodeID);
}

YView.prototype.isSelectedNode = function(node) {
	for ( var i=this.selectedNodes.length-1; i>=0; i-- ) {
		if ( this.selectedNodes[i] == node.id ) {
			return true;
		}
	}
	return false;
}

YView.prototype.deSelectNodes = function(node) {
	for ( var i=this.selectedNodes.length-1; i>=0; i-- ) {
		nodeID = this.selectedNodes[i];
		
		if ( node != undefined && node != null && nodeID != node.id ) {
			continue;
		}
		
		this.selectedNodes.splice(i,1);

		if ( nodeID == this.tree.rootNodeID ) {
			var oOval = document.getElementById(this.ROOT_SHAPE_ID);
			if ( oOval == null ) {
				continue;
			}
		
			if ( document.all ) {
				oOval.setAttribute("filled", "f");
			} else {
				oOval.setAttribute("fill", "none");
			}
		} else {
			var oDiv = document.getElementById(this.NODE_DIV_PREFIX + nodeID);
			if ( oDiv == null ) {
				continue;
			}

			oDiv.style.backgroundColor = "";
		}
		
		if ( node != undefined && node != null && nodeID == node.id ) {
			if ( this.lastSelectedNodeID == nodeID ) {
				if ( this.selectedNodes.length > 0 ) {
					this.lastSelectedNodeID = this.selectedNodes[this.selectedNodes.length-1];
				} else {
					this.lastSelectedNodeID = "";
				}
			}

			return;
		}
	}
}

YView.prototype.selectNode = function( nodeID, bAppend, pos ) {
	var node = this.tree.getNodeById(nodeID);
	if ( node == undefined || node == null ) {
		return;
	}
	
	if ( this.lastSelectedNodeID == nodeID && nodeID != this.tree.rootNodeID) {
		return;
	}

	if ( !bAppend ) {
		this.deSelectNodes();
	}

	if ( nodeID == this.tree.rootNodeID ) {
		var oOval = document.getElementById(this.ROOT_SHAPE_ID);
		if ( oOval == null ) {
			return;
		}

		if ( document.all ) {
			oOval.setAttribute("filled", "t");
			if ( oOval.childNodes.length > 0 ) {
				var oFill = oOval.childNodes[0];
				if ( pos == undefined || pos == this.tree.NODE_POS_ROOT ) {
					oFill.setAttribute("color", this.ROOT_SHAPE_SELCOLOR);
					oFill.setAttribute("color2", this.ROOT_SHAPE_SELCOLOR);
				} else if ( pos == this.tree.NODE_POS_RIGHT ) {
					oFill.setAttribute("color", this.ROOT_SHAPE_SELCOLOR);
					oFill.setAttribute("color2", this.ROOT_SHAPE_COLOR);
				} else {
					oFill.setAttribute("color", this.ROOT_SHAPE_COLOR);
					oFill.setAttribute("color2", this.ROOT_SHAPE_SELCOLOR);
				}
			} else {
				oOval.setAttribute("fillcolor", this.NODE_DIV_SELCOLOR);
			}
		} else {
			if ( pos == undefined || pos == this.tree.NODE_POS_ROOT ) {
				oOval.setAttribute("fill", "url(#" + this.SVG_NUTRALGRADIENT_ID + ")");
			} else if ( pos == this.tree.NODE_POS_RIGHT ) {
				oOval.setAttribute("fill", "url(#" + this.SVG_RIGHTGRADIENT_ID + ")");
			} else {
				oOval.setAttribute("fill", "url(#" + this.SVG_LEFTGRADIENT_ID + ")");
			}
		}
	} else {
		var oDiv = this.getNodeDiv(node);
		if ( oDiv == null ) {
			return;
		}
	
		oDiv.style.backgroundColor = this.NODE_DIV_SELCOLOR;
	}

	for ( var i=0; i<this.selectedNodes.length; i++ ) {
		if ( this.selectedNodes[i] == nodeID ) {
			return;
		}
	}	
	this.selectedNodes.push(nodeID);
	this.lastSelectedNodeID = nodeID;
	if ( node.parentNode ) {
		node.parentNode.lastSelectedChildID = nodeID;
	}
}

YView.prototype.setNodeDivContent = function( node, oDiv ) {
	for ( var i=oDiv.childNodes.length-1; i>=0; i-- ) {
		oDiv.removeChild(oDiv.childNodes[i]);
	}

	var oSpan = document.createElement("span");
	if ( oSpan == null ) {
		return;
	}

	var displayText = (node.text.length==0)? "_":node.text;
	if ( document.all ) {
		oSpan.innerText = displayText;
	} else {
		oSpan.textContent = displayText;
	}
	
	if ( node.bold ) {
		oSpan.style.fontWeight = "bold";
	} else {
		oSpan.style.fontWeight = "normal";
	}
	
	if ( node.italic ) {
		oSpan.style.fontStyle = "italic";
	} else {
		oSpan.style.fontStyle = "normal";
	}
	
	oSpan.style.height = "18px";
	
	oDiv.appendChild(oSpan);
	
	if ( node.pos == this.tree.NODE_POS_LEFT ) {
		var pDiv = this.getNodeDiv(node.parentNode);
		oDiv.style.left = pDiv.offsetLeft - oDiv.offsetWidth - this.NODE_DIV_HGAP + "px";
	}
	
}

YView.prototype.redrawNodeDivStyle = function( node ) {
	var oDiv = this.getNodeDiv(node)
	if ( oDiv == null ) {
		return;
	}
	var oTextSpan = oDiv.lastChild;
	
	if ( node.bold ) {
		oTextSpan.style.fontWeight = "bold";
	} else {
		oTextSpan.style.fontWeight = "normal";
	}
	
	if ( node.italic ) {
		oTextSpan.style.fontStyle = "italic";
	} else {
		oTextSpan.style.fontStyle = "normal";
	}
}

YView.prototype.getNodeDiv = function( node ) {
	if ( node == null ) return null;

	var oDiv = document.getElementById(this.NODE_DIV_PREFIX+node.id);
	if ( oDiv ) return oDiv;

	oDiv = document.createElement("div");
	if ( oDiv == null ) return null;
	
	var onClick		= "NodeClick(event,'" + node.id + "')";
	var onDblClick	= "NodeDblClick(event,'" + node.id + "')";

	var onContextMenu = "NodeContextMenu(event,'" + node.id + "')";

	if ( document.all ) {
		// IE disallows append evnets handler by setAttribute function
		// Also I don't want to call addEventListener for event handling
		// because that I must remove event listner for this element
		// when I remove this element
		str = "<div id=\"" + this.NODE_DIV_PREFIX+node.id
			+ "\" nodeID=\"" + node.id
			+ "\" onclick=\"" + onClick
			+ "\" ondblclick=\"" + onDblClick
			+ "\" oncontextmenu=\"" + onContextMenu
			+ "\" onselectstart=\"" + "return true;"
			+ "\"></div>";
		
		this.panelD.appendChild(oDiv);
		oDiv.outerHTML = str;

		oDiv = document.getElementById(this.NODE_DIV_PREFIX+node.id);
	} else {
		// Firefox allow to add event handler by setAttribute function
		oDiv.setAttribute("id", this.NODE_DIV_PREFIX+node.id);
		oDiv.setAttribute("nodeID",node.id);
		//oDiv.setAttribute("onclick",onClick);
		oDiv.setAttribute("ondblclick",onDblClick);
		oDiv.setAttribute("oncontextmenu",onContextMenu);
		oDiv.setAttribute("nodeid", node.id);
		
		//oDiv.style.MozUserSelect = "none";f
		
		this.panelD.appendChild(oDiv);
	}
	
	oDiv.className = "nodeDiv";
	this.setNodeDivContent(node, oDiv);
	
	//oDiv.style.display = "";
	return oDiv;
}

YView.prototype.drawRootShape = function( oDiv ) {
	if ( document.all ) {
		var oOval = document.getElementById(this.ROOT_SHAPE_ID);
		if ( oOval == null ) {
			oOval = document.createElement("v:oval");
			if ( oOval == null ) {
				return;
			}
			oOval.setAttribute("id", this.ROOT_SHAPE_ID);
			oOval.style.position = "absolute";
			oOval.setAttribute("stroked", "true");
			
			oFill = document.createElement("v:fill");
			if ( oFill != null ) {
				oFill.setAttribute("type", "gradient");
				oFill.setAttribute("angle", 90);
				oFill.setAttribute("color", this.ROOT_SHAPE_COLOR);
				oFill.setAttribute("color2", this.ROOT_SHAPE_COLOR);
				oOval.appendChild(oFill);
			}
			
			this.panelV.appendChild(oOval);
		}

		oOval.style.left = oDiv.offsetLeft;
		oOval.style.top = oDiv.offsetTop - parseInt((this.ROOT_SHAPE_HEIGHT - oDiv.offsetHeight)/2,10);
		oOval.style.pixelWidth = oDiv.offsetWidth;
		oOval.style.pixelHeight = this.ROOT_SHAPE_HEIGHT;
		oOval.setAttribute("strokecolor", this.ROOT_SHAPE_STCOLOR);
		oOval.setAttribute("strokeweight", this.NODE_LNK_WIDTH);
		
	} else {
		var oOval = document.getElementById(this.ROOT_SHAPE_ID);
		if ( oOval == null ) {
			// Watch out the function name! (not createElement)
			oOval = document.createElementNS(this.SVG_NAMESPACE, "ellipse");
			if ( oOval == null ) {
				return;
			}
	
			oOval.setAttribute("id", this.ROOT_SHAPE_ID);
			oOval.setAttribute("fill", "none");

			this.panelV.appendChild(oOval);
		}
		
		oOval.setAttribute("cx", (oDiv.offsetLeft + parseInt(oDiv.offsetWidth/2,10)) );
		oOval.setAttribute("cy", (oDiv.offsetTop + parseInt(oDiv.offsetHeight/2,10)) );
		oOval.setAttribute("rx", parseInt(oDiv.offsetWidth/2,10) );
		oOval.setAttribute("ry", parseInt(this.ROOT_SHAPE_HEIGHT/2,10) );
		oOval.setAttribute("stroke", this.ROOT_SHAPE_STCOLOR);
		oOval.setAttribute("stroke-width", this.NODE_LNK_WIDTH);
	}
}

YView.prototype.drawNodeLinker = function( node ) {
	if ( node.parentNode == null ) return;
	
	var oDiv = this.getNodeDiv(node);
	var pDiv = this.getNodeDiv(node.parentNode);
	if ( oDiv == null || pDiv == null ) return;
	
	var oLink = null;
	var pos1X, pos1Y, pos2X, pos2Y;
	var toX, toY;
	var control1X, control1Y, control2X, control2Y;
	var tipLen = 0;

	if ( node.pos == this.tree.NODE_POS_RIGHT ) {
		pos1X = pDiv.offsetLeft + pDiv.offsetWidth;
	} else {
		pos1X = pDiv.offsetLeft;
	}
	var pos1Y = pDiv.offsetTop + ((node.parentNode.indent == 0)? parseInt(pDiv.offsetHeight/2,10):pDiv.offsetHeight) - 1;
	
	pos2Y = oDiv.offsetTop + oDiv.offsetHeight - 1;

	toX = this.NODE_DIV_HGAP;
	
	if ( node.childNodes.length > 0 && node.collapsed ) {
		tipLen = 8;	// need dot
	}
	
	if ( document.all ) {
		oLink = document.getElementById(this.NODE_LINK_PREFIX+node.id);
		if ( oLink == null ) {
			oLink = document.createElement("v:shape");
			
			if ( oLink == null ) {
				return null;
			}
			
			oLink.setAttribute("id", this.NODE_LINK_PREFIX+node.id);
			oLink.setAttribute("coordorigin", "0 0");
			oLink.setAttribute("coordsize", "100 100");
			oLink.setAttribute("filled", "f");
			oLink.className = "linker";

			// the only one child element in this shape
			var oStroke = document.createElement("v:stroke");
			if ( oStroke ) {
				oLink.appendChild(oStroke);
			}
			
			this.panelV.appendChild(oLink);
		}
		
		pos2X = oDiv.offsetLeft;
		
		control1X = 10;
		control2X = 0;
		if ( pos1Y > pos2Y ) {
			toY = pos2Y - pos1Y;
		} else {
			toY = pos2Y - pos1Y;
		}
		control1Y = parseInt(toY/5,10);
		control2Y = toY;

		oLink.style.left = pos1X + "px";
		oLink.style.top = pos1Y + "px";
		oLink.style.pixelWidth = (node.pos == this.tree.NODE_POS_RIGHT)?100:-100;
		oLink.style.pixelHeight = 100;

		oLink.setAttribute("strokecolor", this.NODE_LNK_COLOR);
		oLink.setAttribute("strokeweight", this.NODE_LNK_WIDTH);
		
		if ( oLink.children.length > 0 ) {
			if ( tipLen > 0 ) {
				oLink.children[0].setAttribute("endarrow", "oval");
			} else {
				oLink.children[0].setAttribute("endarrow", "none");
			}
		}
		
		var path = "m 0,0 c ";
		path += control1X + "," + control1Y + "," + control2X + "," + control2Y + ",";
		path += toX + "," + toY + " r ";
		path += (oDiv.offsetWidth + tipLen) + ",0 e";
		oLink.setAttribute("path", path);
		
		return oLink;

	} else {

		oLink = document.getElementById(this.NODE_LINK_PREFIX+node.id);
		if ( oLink == null ) {
			// Watch out the function name! (not createElement)
			oLink = document.createElementNS(this.SVG_NAMESPACE, "path");
			
			if ( oLink == null ) {
				return;
			}
	
			oLink.setAttribute("id", this.NODE_LINK_PREFIX+node.id);
			oLink.setAttribute("fill", "none");

			this.panelV.appendChild(oLink);
		}
		
		if ( node.pos == this.tree.NODE_POS_RIGHT ) {
			pos2X = oDiv.offsetLeft;
			control1X = pos1X +  10;
		} else {
			pos2X = oDiv.offsetLeft + oDiv.offsetWidth;
			control1X = pos1X -  10;
		}

		control1Y = pos1Y;
		control2X = pos1X;
		control2Y = pos2Y;
	
		if ( tipLen > 0 ) {
			oLink.setAttribute("marker-end", "url(#EndMarker)");
		} else {
			oLink.setAttribute("marker-end", "none");
		}
		
		oLink.setAttribute("stroke", this.NODE_LNK_COLOR);
		oLink.setAttribute("stroke-width", this.NODE_LNK_WIDTH);

		var d =
			"M" + pos1X + "," + pos1Y + " " +
			"C" + control1X + "," + control1Y + " " +
				  control2X + "," + control2Y + " " +
				  pos2X + "," + pos2Y + " " +
			"L";
		if ( node.pos == this.tree.NODE_POS_RIGHT ) {
			d+= (pos2X + oDiv.offsetWidth + tipLen );
		} else {
			d+= (pos2X - oDiv.offsetWidth - tipLen );
		}
			d+= "," + pos2Y;

		oLink.setAttribute("d", d);

		return oLink
	}
	
	return null;
}

YView.prototype.getNodeHeight = function( node, pos ) {
	if ( node.childNodes.length == 0 || node.collapsed ) {
		oDiv = this.getNodeDiv(node);
		if ( oDiv ) {
			return oDiv.offsetHeight;
		} else {
			return 0;
		}
	}
	
	// accumulate all children's height
	var height = 0;
	var sibCnt = 0;
	for ( var i=0; i < node.childNodes.length; i++ ) {
		cnode = this.tree.getNodeById(node.childNodes[i]);
		if ( cnode.pos != pos ) continue;
		sibCnt++;
		height += this.getNodeHeight(cnode, pos);
	}
	
	
	height += (sibCnt - 1)*this.NODE_DIV_VGAP;
	return height;
}

YView.prototype.drawChildNodes = function( node ) {
	
	var oDiv = this.getNodeDiv(node);
	if ( oDiv == null ) {
		return;
	}
	
	var left;
	var top;
	
	if ( node.childNodes.length == 0 || node.collapsed ) {
		return;
	} else {
		
		var snodes = new Array(null, null);
	
		if ( node.pos == this.tree.NODE_POS_ROOT ) {
			for ( var i=0; i<node.childNodes.length; i++ ) {
				var tmpNode = this.tree.getNodeById(node.childNodes[i]);
				if ( tmpNode.pos == this.tree.NODE_POS_RIGHT ) {
					snodes[1] = tmpNode;
					break;
				}
			}
			
			for ( var i=0; i<node.childNodes.length; i++ ) {
				var tmpNode = this.tree.getNodeById(node.childNodes[i]);
				if ( tmpNode.pos == this.tree.NODE_POS_LEFT ) {
					snodes[0] = tmpNode;
					break;
				}
			}
		} else if ( node.pos == this.tree.NODE_POS_RIGHT ) {
			snodes[1] = this.tree.getNodeById(node.childNodes[0]);
		} else if ( node.pos == this.tree.NODE_POS_LEFT ) {
			snodes[0] = this.tree.getNodeById(node.childNodes[0]);
		}
		
		for ( var i=0; i<2; i++ ) {
			var rnode = snodes[i];
			
			if ( rnode == null ) continue;
			
			var rpos = (i==0)?this.tree.NODE_POS_LEFT:this.tree.NODE_POS_RIGHT;

			while(rnode.prevNode != null) {
				rnode = rnode.prevNode;
			}
	
			left = oDiv.offsetLeft + oDiv.offsetWidth + this.NODE_DIV_HGAP;
			top = oDiv.offsetTop -  parseInt((this.getNodeHeight(node,rpos) - oDiv.offsetHeight)/2,10) - ((node.indent==0)?parseInt(oDiv.offsetHeight/2,10):0);
			var topOffset;
			while ( rnode != null ) {
				var tmpDiv = this.getNodeDiv(rnode);
				if ( tmpDiv == null ) return;
				
				this.setNodeDivContent( rnode, tmpDiv);
				
				topOffset = parseInt((this.getNodeHeight(rnode,rpos) - tmpDiv.offsetHeight)/2,10);
				if ( i == 0 ) {
					left = oDiv.offsetLeft - tmpDiv.offsetWidth - this.NODE_DIV_HGAP;
				}

				tmpDiv.style.left = left + "px";
				tmpDiv.style.top = top + topOffset + "px";
					
				top += (topOffset*2) + tmpDiv.offsetHeight + this.NODE_DIV_VGAP;
				
				this.drawNodeLinker(rnode);
				
				if ( !rnode.collapsed ) {
					this.drawChildNodes(rnode);
				}
				
				rnode = rnode.nextNode;
			}
		}

	}
}

YView.prototype.drawNode = function( node, bDrawChildren ) {
	var oDiv = this.getNodeDiv(node);
	if ( oDiv == null ) {
		return;
	}

	if ( node.parentNode == null ) {
		//var left = this.rootPosX;
		var left = this.panelD.offsetWidth/2
		//var top = this.rootPosY;
		var top = this.panelD.offsetHeight/2;
		// add unit string for xhtml
		oDiv.style.left = (left - parseInt(oDiv.offsetWidth/2, 10)) + "px";
		oDiv.style.top = top + "px";
		oDiv.style.paddingLeft = 10 + "px";
		oDiv.style.paddingRight = 10 + "px";
		oDiv.style.backgroundColor = "";
		oDiv.style.border = "none";
		this.setNodeDivContent(node, oDiv);
	} else {
		this.setNodeDivContent(node, oDiv);
		this.drawNodeLinker(node);
	}

	if ( bDrawChildren ) {
		this.drawChildNodes( node );
	}

	// draw node specific appearence	
	if ( node.parentNode == null ) {
		//oDiv.style.top = (oDiv.offsetTop + parseInt(oDiv.offsetHeight/2)) + "px";
		this.drawRootShape(oDiv);
	} else {

	}
}

YView.prototype.setCaretPos = function( oField, iCaretPos ) {
	if (document.selection) { 
		// Set focus on the element
		oField.focus();
  
		// Create empty selection range
		var oSel = document.selection.createRange ();
  
		// Move selection start and end to 0 position
		oSel.moveStart ('character', -oField.value.length);
  
		// Move selection start and end to desired position
		oSel.moveStart ('character', iCaretPos);
		oSel.moveEnd ('character', 0);
		oSel.select ();
	} else if (oField.selectionStart || oField.selectionStart == '0') {
		oField.selectionStart = iCaretPos;
		oField.selectionEnd = iCaretPos;
		oField.focus();
	}
}

YView.prototype.startNodeEdit = function( node, org ) {
	var oDiv = this.getNodeDiv(node)
	if ( oDiv == null ) {
		return;
	}
	var oTextSpan = oDiv.lastChild;

	var width = oTextSpan.offsetWidth + 20;
	var height = oTextSpan.offsetHeight + 4;
	var txt = node.text;
	
	oDiv.removeChild(oDiv.lastChild);

	var oInput = document.createElement("input");

	var className = "nodeEdit";
	var onblur = "NodeEditEnd(this,\'" + node.id + "\')";
	var onkeypress = "if (keyCheck(event,[13,27])) NodeEditEnd(this,\'" + node.id + "\');";
	if ( document.all ) {
		// append input to this div element
		var str  = "<input type='text' "
			+ "class='" + className + "' "
			+ "value='" + txt + "' "
			+ "style='width:" + width + ";height:" + height + ";' "
			+ "onblur=\"" + onblur + "\" "
			+ "onkeypress=\"" + onkeypress + "\">";

		oDiv.appendChild(oInput);
		oInput.outerHTML = str;
		
		oInput = oDiv.lastChild;
	} else {
		oInput.setAttribute("type", "text");
		oInput.setAttribute("value", txt);
		oInput.setAttribute("onblur", onblur);
		oInput.setAttribute("onkeypress", onkeypress);
		oInput.className = className;
		oInput.style.width = width + "px";
		oInput.style.height = height + "px";

		//oDiv.style.MozUserSelect = "";
		oDiv.appendChild(oInput);
	}
	
	oInput.focus();
	if ( org != undefined && org == this.CARET_ORG_START ) {
		this.setCaretPos(oInput, 0);
	} else if ( org != undefined && org == this.CARET_ORG_END ) {
		this.setCaretPos(oInput, txt.length);
	} else {
		oInput.select();
	}
	
	this.panelD.onmousedown = null;
	
	this.bNodeEditing = true;
}

YView.prototype.stopNodeEdit = function( node ) {
	var oDiv = this.getNodeDiv(node);
	
	var oInput = oDiv.lastChild;
	node.text = oInput.value.trim();
	
	this.setNodeDivContent(node, oDiv);
	
	this.drawNode(node, true);

	this.bNodeEditing = false;
	
	/*
	if ( oDiv == null ) {
		this.bNodeEditing = false;
		return;
	}
	var oInput = oDiv.childNodes[oDiv.childNodes.length-1];
	node.text = oInput.value.trim();
	
	oDiv.removeChild(oInput);

	var oSpan = document.createElement("span");
	if ( oSpan == null ) {
		this.bNodeEditing = false;
		return;
	}

	if ( document.all ) {
		oSpan.innerText = node.text;
	} else {
		oSpan.textContent = node.text;
	}
	oDiv.appendChild(oSpan);
	
	this.drawNode(node, true);

	this.bNodeEditing = false;
	*/
}

YView.prototype.redrawTree = function() {
	this.drawNode(this.tree.rootNode, true);
}

YView.prototype.appendChildNode = function( node ) {
	var tmpNode = node.appendChild("");
	if ( tmpNode != null ) {
		if ( node.collapsed ) {
			this.toggleNode(node);
		}
		this.redrawTree();
		this.selectNode(tmpNode.id, false);
	}
	return tmpNode;
}

YView.prototype.appendSiblingNode = function( node, dir ) {
	if ( node.indent == 0 ) {
		return null;
	}
	var tmpNode = node.appendSibling("", dir);
	if ( tmpNode == null ) {
		return null;
	}
	this.redrawTree();
	
	this.selectNode(tmpNode.id, false);
	
	return tmpNode;
}

YView.prototype.deleteNodeView = function( node ) {
	for ( var i=node.childNodes.length-1; i>=0; i-- ) {
		var tmpNode = this.tree.getNodeById(node.childNodes[i]);
		if ( tmpNode == undefined || tmpNode == null ) {
			continue;
		}
		this.deleteNodeView(tmpNode);
	}

	var oDiv = document.getElementById(this.NODE_DIV_PREFIX+node.id);
	var oLnk = document.getElementById(this.NODE_LINK_PREFIX+node.id);
	
	if ( oDiv != null ) {
		if ( document.all ) {
			oDiv.removeNode(true);
		} else {
			this.panelD.removeChild(oDiv);
		}
	}
	
	if ( oLnk != null ) {
		if ( document.all ) {
			oLnk.removeNode(true);
		} else {
			this.panelV.removeChild(oLnk);
		}
	}
}

YView.prototype.deleteNode= function( node ) {
	if ( node.indent == 0 ) {
		return false;
	}

	this.deleteNodeView(node);
	this.tree.removeNode(node);
	
	return true;
}

YView.prototype.isSelectedNode= function(node) {
	if ( node == null )  return false;
	
	for ( var i=0; i<this.selectedNodes.length; i++ ) {
		if ( this.selectedNodes[i] == node.id ) return true;
	}
	
	return false;
}

YView.prototype.getNearestUnSelectedNode= function(node) {
	if ( node == null ) {
		return this.tree.rootNode;
	}
	
	var parentNode = node.parentNode;
	var prevNode = node.prevNode;
	var nextNode = node.nextNode;
	
	while ( parentNode && parentNode.indent != 0 ) {
		if ( !this.isSelectedNode(parentNode) ) {
			parentNode = parentNode.parentNode;
			continue;
		}
		return this.getNearestUnSelectedNode(parentNode);
	}
	
	while ( nextNode ) {
		if ( this.isSelectedNode(nextNode) ) {
			nextNode = nextNode.nextNode;
			continue;
		}
		return nextNode;
	}
	
	while ( prevNode ) {
		if ( this.isSelectedNode(prevNode) ) {
			prevNode = prevNode.prevNode;
			continue;
		}
		return prevNode;
	}
	
	return node.parentNode;
}

YView.prototype.deleteSelectedNodes= function() {
	var delCnt = 0;

	var tmpNode = this.getLastSelectedNode();
	
	if ( tmpNode == null ) return;
	
	var selNode = this.getNearestUnSelectedNode(tmpNode);
	
	for ( var i=this.selectedNodes.length-1; i>=0; i-- ) {
		var node = this.tree.getNodeById(this.selectedNodes[i]);
		this.selectedNodes.splice(i,1);

		if ( node == undefined || node == null ) {
			continue;
		}
		
		if ( this.deleteNode(node) ) {
			delCnt++;
		}
	}
	this.lastSelectedNodeID = "";

	if ( delCnt > 0 ) {
		this.redrawTree();
		this.selectNode(selNode, false);
	}
}

YView.prototype.swapSibNode = function( dir ) {
	if ( this.lastSelectedNodeID == "" ) {
		return;
	}
	var snode = this.tree.getNodeById(this.lastSelectedNodeID);
	if ( snode == undefined || snode == null || snode.indent == 0 ) {
		return;
	}
	
	var tnode = null;
	
	if ( dir == this.NODE_NAV_UP ) {
		tnode = snode.prevNode;
		if ( tnode == null ) {
			return;
		}
		
		if ( snode.nextNode ) {
			tnode.nextNode = snode.nextNode;
			snode.nextNode.prevNode = tnode;
		} else {
			tnode.nextNode = null;
		}
		
		if ( tnode.prevNode ) {
			tnode.prevNode.nextNode = snode;
			snode.prevNode = tnode.prevNode;
		} else {
			snode.prevNode = null;
		}
		
		snode.nextNode = tnode;
		tnode.prevNode = snode;
	} else if ( dir == this.NODE_NAV_DOWN ) {
		tnode = snode.nextNode;
		if ( tnode == null ) {
			return;
		}
		
		if ( snode.prevNode ) {
			tnode.prevNode = snode.prevNode;
			snode.prevNode.nextNode = tnode;
		} else {
			tnode.prevNode = null;
		}
		
		if ( tnode.nextNode ) {
			tnode.nextNode.prevNode = snode;
			snode.nextNode = tnode.nextNode;
		} else {
			snode.nextNode = null;
		}

		snode.prevNode = tnode;
		tnode.nextNode = snode;
	} else {
		return;
	}
	
	this.drawNode( snode.parentNode, true);
}

YView.prototype.navigateNode = function( dir, bSelExpansion ) {
	if ( this.lastSelectedNodeID == "" ) {
		return;
	}
	
	var node = this.tree.getNodeById(this.lastSelectedNodeID);
	if ( node == undefined || node == null ) {
		return;
	}
	
	if ( dir == this.NODE_NAV_PAGEUP ) {
		this.selectNode(node.getSiblingHead(), bSelExpansion);
	} else if ( dir == this.NODE_NAV_PAGEDN ) {
		this.selectNode(node.getSiblingTail(), bSelExpansion);
	} else if ( dir == this.NODE_NAV_UP ) {
		if ( node.prevNode == null ) {
			if ( node.parentNode != null && node.parentNode.prevNode != null ) {
				if ( node.parentNode.prevNode.collapsed ) {
					this.selectNode(node.parentNode.prevNode.id, bSelExpansion);
					return;
				}
				var tmpNode = node.parentNode.prevNode.getChildTail();
				if ( tmpNode != null ) {
					this.selectNode(tmpNode.id, bSelExpansion);
					if ( tmpNode.parentNode.collapsed ) {
						this.toggleNode( tmpNode.parentNode );
					}
				}
			}
			return;
		}
		this.selectNode(node.prevNode.id, bSelExpansion);
		
	} else if ( dir == this.NODE_NAV_DOWN ) {
		if ( node.nextNode == null ) {
			if ( node.parentNode != null && node.parentNode.nextNode != null ) {
				if ( node.parentNode.nextNode.collapsed ) {
					this.selectNode(node.parentNode.nextNode.id, bSelExpansion);
					return;
				}
				var tmpNode = node.parentNode.nextNode.getChildHead();
				if ( tmpNode != null ) {
					this.selectNode(tmpNode.id, bSelExpansion);
					if ( tmpNode.parentNode.collapsed ) {
						this.toggleNode( tmpNode.parentNode );
					}
				}
			}
			return;
		}
		this.selectNode(node.nextNode.id, bSelExpansion);

	} else if ( dir == this.NODE_NAV_RIGHT ) {
		if ( node.pos == this.tree.NODE_POS_LEFT ) {
			this.selectNode(node.parentNode.id, bSelExpansion);
		} else {
			if ( node.collapsed ) {
				this.toggleNode( node );
				return;
			}

			var tmpNode = node.getLastSelectedChild(this.tree.NODE_POS_RIGHT);
			if ( tmpNode == null ) {
				return;
			}

			this.selectNode(tmpNode.id, bSelExpansion);
		}
	} else if ( dir == this.NODE_NAV_LEFT ) {
		if ( node.pos == this.tree.NODE_POS_RIGHT ) {
			this.selectNode(node.parentNode.id, bSelExpansion);
		} else {
			if ( node.collapsed ) {
				this.toggleNode( node );
				return;
			}

			var tmpNode = node.getLastSelectedChild(this.tree.NODE_POS_LEFT);
			if ( tmpNode == null ) {
				return;
			}

			this.selectNode(tmpNode.id, bSelExpansion);
		}
	} else {
		return;
	}
}

YView.prototype.toggleChild = function( node, bShow ) {
	var oDiv, oLnk;
	for ( var i=0; i<node.childNodes.length; i++ ) {
		var cnode = g_YTree.getNodeById(node.childNodes[i]);
		if ( cnode == null ) {
			continue;
		}
		oDiv = document.getElementById(this.NODE_DIV_PREFIX+cnode.id);
		oLnk = document.getElementById(this.NODE_LINK_PREFIX+cnode.id);

		if ( oDiv == null || oLnk == null ) continue;
		
		if ( bShow ) {
			oDiv.style.display = "";
			oLnk.style.display = "";
		} else {
			oDiv.style.display = "none";
			oLnk.style.display = "none";
		}
		
		if ( !cnode.collapsed ) {
			this.toggleChild(cnode, bShow);
		}
	}
}

YView.prototype.toggleNode = function( node ) {
	node.collapsed = (node.collapsed)? false:true;
	this.toggleChild(node, !node.collapsed);
	this.redrawTree();
}

YView.prototype.toggleNodeStyle = function(what) {
	var tmpNode = this.getLastSelectedNode();
	if ( tmpNode == null ) {
		return;
	}
	
	var bBool;

	if ( what == this.NODE_STYLE_BOLD ) {
		bBool = !tmpNode.bold;
	} else if ( what == this.NODE_STYLE_ITALIC ) {
		bBool = !tmpNode.italic;
	} else {
		return;
	}

	for ( var i=this.selectedNodes.length-1; i>=0; i-- ) {
		var node = this.tree.getNodeById(this.selectedNodes[i]);

		if ( node == undefined || node == null ) {
			continue;
		}
		
		if ( what == this.NODE_STYLE_BOLD ) {
			node.bold = bBool;
		} else if ( what == this.NODE_STYLE_ITALIC ) {
			node.italic = bBool;
		}

		this.redrawNodeDivStyle(node);
	}
}






function keyCheck(evt, codes) {
	evt = (evt) ? evt:window.event;
	code = (evt.keyCode)? evt.keyCode:evt.charCode;
	
	for ( var i=0; i<codes.length; i++ ) {
		if ( codes[i] == code ) {
			return true;
		}
	}
	return false;
}

function getMouseOffset(target, evt){
    evt = evt || window.event;

    var docPos    = getPosition(target);
    var mousePos  = mouseCoords(evt);
    return {x:mousePos.x - docPos.x, y:mousePos.y - docPos.y};
}

function mouseCoords(evt){
    if(evt.pageX || evt.pageY){
        return {x:evt.pageX, y:evt.pageY};
    }
    return {
        x:evt.clientX + document.body.scrollLeft - document.body.clientLeft,
        y:evt.clientY + document.body.scrollTop  - document.body.clientTop
    };
}

function getPosition(e){
    var left = 0;
    var top  = 0;

    while (e.offsetParent){
        left += e.offsetLeft;
        top  += e.offsetTop;
        e     = e.offsetParent;
    }

    left += e.offsetLeft;
    top  += e.offsetTop;

    return {x:left, y:top};
}

function mouseMove(evt){
    evt           = evt || window.event;
    var mousePos = mouseCoords(evt);

    if(g_YView.dragObject && !g_YView.bNodeEditing && 
    		(g_YView.getSelectedNodeCount() == 1 || g_YView.dragObject.getAttribute("nodeID") == null) ) {
    		var yOff = 0;
    		var xOff = 0;
    		if ( g_YView.dragObject.getAttribute("nodeID") != null ) {
    			yOff = 0 - g_YView.panelD.offsetTop + 25;
    			xOff = 0 - g_YView.panelD.offsetLeft;
    		}
        g_YView.dragObject.style.position = 'absolute';
   	    g_YView.dragObject.style.top      = (mousePos.y - g_YView.mouseOffset.y + yOff)+"px";
       	g_YView.dragObject.style.left     = (mousePos.x - g_YView.mouseOffset.x + xOff)+"px";
       	
    }
    
    if ( g_YView.dragObject ) {
    	g_YView.panelD.style.cursor = "move";
    }
    
}

function mouseUp(evt){
	evt           = evt || window.event;
	
	if ( g_YView.dragObject != null && g_YView.getSelectedNodeCount() == 1 ) {
		var snode = g_YView.tree.getNodeById(g_YView.dragObject.getAttribute("nodeID"));
		if ( snode != null && snode.id == g_YView.lastSelectedNodeID ) {
			g_YView.dragObject.style.left = g_YView.dragOldLeft + "px";
			g_YView.dragObject.style.top = g_YView.dragOldTop + "px";
			
			g_YView.dragObject = null;
			g_YView.panelD.style.cursor = "default";
			return false;
		}
		var tnode = g_YView.getLastSelectedNode();
		if ( snode != null && tnode != null && snode.id != tnode.id ) {
			var bAttached = false;
			
			mousePos = mouseCoords(evt);
			oDiv = g_YView.getNodeDiv(tnode);
			divPos = getPosition(oDiv);
			if (
				(mousePos.x > divPos.x && mousePos.x < divPos.x + oDiv.offsetWidth) &&
				(mousePos.y > divPos.y && mousePos.y < divPos.y + oDiv.offsetHeight) ) {
				if ( tnode.indent == 0 ) {
					bAttached = snode.attachToNode(tnode, g_YView.dragPos);
				} else {
					bAttached = snode.attachToNode(tnode, tnode.pos);
				}
			}
			
			if ( bAttached ) {
				if ( tnode.collapsed ) {
					g_YView.toggleNode(tnode);
				} else {
					g_YView.redrawTree();
				}
			} else {
				g_YView.dragObject.style.left = g_YView.dragOldLeft + "px";
				g_YView.dragObject.style.top = g_YView.dragOldTop + "px";
			}
		}
	}
	
	g_YView.dragObject = null;
	g_YView.panelD.style.cursor = "default";
    
	return false;
}

function makeDraggable(item){
    if(!item) return false;

    item.onmousedown = function(evt){
        g_YView.dragObject  = this;
        g_YView.dragOldLeft = item.offsetLeft;
        g_YView.dragOldTop	= item.offsetTop;
        g_YView.mouseOffset = getMouseOffset(this, evt);
        
        evt = evt || window.event;
        
        if ( document.all ) {
        	evt.cancelBubble = true;
        } else {
        	evt.stopPropagation();
        }
        
        return false;
    }
    return true;
}

function getRelPath(src) {
	var toks = src.split("/");
	return toks[toks.length-1];
}

document.onmousemove	= mouseMove;
document.onmouseup		= mouseUp;

if ( document.all ) {
} else {
	var element = HTMLElement.prototype;

    var capture = ["click","mousedown", "mouseup","mousemove", "mouseover", "mouseout" ];

    element.setCapture = function(){
        var self = this;
        var flag = false;
        this._capture = function(e){
            if (flag) {return}
            flag = true;
            var event = document.createEvent("MouseEvents");
            event.initMouseEvent(e.type,
                e.bubbles, e.cancelable, e.view, e.detail,
                e.screenX, e.screenY, e.clientX, e.clientY,
                e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
                e.button, e.relatedTarget);
            self.dispatchEvent(event);
            flag = false;
        };
        for (var i=0; i<capture.length; i++) {
            window.addEventListener(capture[i], this._capture, true);
        }
    };

    element.releaseCapture = function(){
        for (var i=0; i<capture.length; i++) {
            window.removeEventListener(capture[i], this._capture, true);
        }
        this._capture = null;
    };
}
