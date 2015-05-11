
(function ($, global) {
	"use strict";
	var fields,
		getBEFields,
		convFields,
		utility,
		getOrderTree,
		console = global.console;

	$(function () {
		var raw;
		utility.out ('formcast.js entered.');
		raw = getBEFields();
		fields = convFields (raw);
		order_tree = getOrderTree (fields);
		outEmbed (order_tree);
	});

	/* revert pre-order traverse vector to tree structure */
	getOrderTree = function (fields) {
		var root = {ref: 0},
			trace = [root],
			i = 0,
			depth = 0,
			node,
			field;
		
		while (i < fields.length) {
			field = fields[i];
			while (depth >= 0 && trace[depth].id !== field.id) {
				depth--;
			}
			if (!trace[depth].sub) {
				trace[depth].sub = [];
			}
			node = {ref: field};
			trace[depth].sub.push (node);
			depth++;
			trace[depth] = node;
		}
		return root;
	};
	
	// mockup of form fields fed by server
	getBEFields = function () {
		var raw = [],
			schm = {
				'1': ['parent', 'type', 'id', 'init'],
				'text.init': ['default'],
				'select.init': ['default', 'options', 'multiple'],
				'radio.init': ['default', 'options', 'multiple']
			};

		raw.push(schm);
		raw.push([0, 'text', 'my_form_fld_1', ['input your name...']]);
		raw.push([0, 'fieldset', 'my_form_fld_fs1']);
		raw.push([1, 'select', 'my_form_fld_2', [0, ['China', 'USA', 'India']]]);
		raw.push([0, 'radio', 'my_form_fld_3', [0, ['male', 'female']]]);
		return raw;
	};

	// permit reuse for backend array mapping to frontend associative object
	convFields = function (raw) {
		var map_backend,
			map_frontend,
			util = utility,
			cb,
			getScheme,
			fields;	// frontend array of field objects
			
		// callback invoked in DFS search of backend field array
		cb = function (stacks, depth, flag) {
			var cur,
				last,
				sub,
				id;
			cur = stacks[depth].client;
			switch (flag) {
			case 'fwd':
				cur.schm = getScheme(stacks, depth);
				if (cur.schm) {
					sub = {};
					if (!depth) {
						fields = {};
					}
				} else {
					sub = [];
					if (!depth) {
						fields = [];
					}
				}
				
				cur.sub = depth ? sub : fields;
				if (depth) {
					last = stacks[depth - 1].client;
					id = stacks[depth - 1].id;
					last.sub[last.schm ? last.schm[id] : id] = cur.sub;
				}
				break;
			case 'mid':
				// fill backend array value into frontend mapped property if scheme exists, or
				// into increased array element otherwise.
				id = stacks[depth].id;
				cur.sub[cur.schm ? cur.schm[id] : id] = stacks[depth].sub[id];
				break;
			default:
				break;
			}
		};
		
		getScheme = function (stacks, depth) {
			var schm = depth,	// use depth rule in bottom line
				last_schm,
				last,
				map = [];
			// preceded with rule of 'object.property' if possible
			if (depth) {
				last = stacks[depth - 1];
				last_schm = last.client.schm;
				if (last_schm && last.client.sub.type) {
					schm = last.client.sub.type + '.' + last_schm[last.id];
					// restore if unspecified 
					if ('undefined' === map_backend[schm]) {
						schm = depth;
					}
				}
			}
			if (!map_backend[schm] || !map_frontend[schm]) {
if (depth === 2) {
	depth = 2;
}
			util.out ('No scheme to map on level '+depth+' backend frontend struct.');
				map = false;
			} else {
				map_backend[schm].forEach(function (v, i) {
					map[i] = map_frontend[schm][v];
				});
			}
			return map;
		};
		
		/* The mapping mechanism here is proposed to:
			1. allow array to be json transfered which is superior to object in size;
			2. decouple array with mapped js object hierarchy in terms of array order and property naming.
		The syntax of map id: 
			1. [digital]: the level of array;
			2. [alpha_A].[alpha_B]: mimic 'stacks.property' style. alpha_A is the value of property 'type' 
			in object of last level. alpha_B is name of current traced property in object of last level. 
		The negotiated interface between front and back ends are only: 
			1. property names in each frontend sub-map.
			2. value of type like 'text', 'select'. */
		map_frontend = {
			'1': {
				'parent': 'parent',	// schema column name as map property, Field property name as map value
				'type': 'type',
				'id': 'id',
				'init': 'init'
			},
			'text.init': {
				'default': 'default'
			},
			'select.init': {
				'default': 'default',
				'options': 'options',
				'multiple':	'multiple'
			},
			'radio.init': {
				'default': 'default',
				'options': 'options',
				'multiple':	'multiple'
			}
		};
		map_backend = raw.shift ();

		util.dfsTree (raw, cb);
		return fields;
	};

	utility = (function () {
		/* @method dfsTree: The fabric of depth first search on a tree implemented by js object or js array.
			Client may reuse it to abstract the customized logic from of tree traverse.
		@param tree: the data structure of tree in array or in associative object.
		@param cb: the callback functions for client to manipulate node in tree search:
		@callback_param stacks: stack emulated object array indexed by depth. Each element is consisted of:
					'client': client object life-cycle managed by utility and used by client. 
					'sub': sub-tree nodes by reference.
					'id': current array index or object property.
		@callback_param depth: search depth indexed from 0.
		@callback_param time: one of 3 search moments when callback occurs:
					'fwd': when depth has advanced and its stack context has been created.
					'bck': when depth is to decrease and context is to be cleared.
					'mid': when a leaf node is found. */
		function dfsTree (tree, cb) {
			var trace = [],
				obj_ids = [],
				count = [],
				depth,
				node_cur,
				ctx_cur;

			// initialize search
			obj_ids[0] = enumProp (tree);	// array of subtree properties in case it is an object.
			count[0] = 0;	// used only in case of object subtree
			trace[0] = {
				client: {},
				sub: tree,
				id: obj_ids[0] ? obj_ids[0][0] : 0
			};
			depth = 0;
			cb (trace, 0, 'fwd');
			// recursive process in iterative way
			while (depth >= 0) {
				if ((!obj_ids[depth] && count[depth] >= trace[depth].sub.length) || 
					(obj_ids[depth] && count[depth] >= obj_ids[depth].length)) {
					// mark it for it seems only alternative to 'fwd'
					// callback fires before stack pop
					//cb (trace, depth, 'bck');
					trace.pop();
					depth -= 1;
					if (depth >= 0) {
						count[depth] += 1;
					}
				} else {
					ctx_cur = trace[depth];
					ctx_cur.id = obj_ids[depth] ? obj_ids[depth][count[depth]] : count[depth];
					node_cur = ctx_cur.sub[ctx_cur.id];
					if (isArray(node_cur) || isObject(node_cur)) {
						depth += 1;
						trace[depth] = {client: {}, sub: node_cur, id: -1};
						// callback exec after stack push
						count[depth] = cb (trace, depth, 'fwd');
						// if got -1, trim branch
						if (-1 === count[depth]) {
							depth--;
							continue;
						}
						// otherwise, extend from returned index. undefined equal to 0
						if (undefined === count[depth]) {
							count[depth] = 0;
						}
						obj_ids[depth] = enumProp(node_cur);
					} else {
						cb (trace, depth, 'mid');
						count[depth] += 1;
					}
				}
			}
		}

		function enumProp (obj) {
			var prop,
				ret;
			if (Object.prototype.toString(obj) === 'array object') {
				ret = false;
			} else {
				ret = [];
				for (prop in obj) {
					if (obj.hasOwnProperty(prop)) {
						ret.push (prop);
					}
				}
			}
			return ret;
		}
		
		function isArray (obj) {
			return Object.prototype.toString.call (obj) === '[object Array]';
		}
		
		function isObject (obj) {
			return Object.prototype.toString.call (obj) === '[object Object]';
		}
		
		function panic (error_str) {
			error_str = 'A JS exception is thrown: ' + error_str;
			out (error_str);
			throw new Error ();
		}
		
		function out (str) {
			$('<pre>' + str + '</pre>').appendTo ('body');
			console.log (str);
		}
		
		function outEmbed (obj) {
			var str = '',
				tab = '\t',
				cb;
			cb = function (stacks, depth, flag) {
				var i
					temp;
				i = depth;
				while (i-- > 0) {
					str += tab;
				}
				switch (flag) {
				case 'fwd':
					temp = stacks[depth - 1];
					str += temp.id + ' => Array (\n';
					break;
				case 'mid':
					temp = stacks[depth];
					str += temp.id + ' => ' + temp.sub[temp.id] + '\n';
					break;
				default:
					break;
				}
			};
			dfsTree (obj, cb);
			out (str);
		}

		return {
			dfsTree: dfsTree,
			isArray: isArray,
			isObject: isObject,
			out: out,
			panic: panic
		};
	} ());
/* 	function fieldsShow (fields) {
		var field,
			i, len,
			tree, Tree;

		// create a tree structure representing embedding and sequencial relationship of fields
		tree = new Tree (fields);
		fields.forEach (function (elem) {
			tree.insert (elem.parent);
		});
		
		function render (elm) {
			var type,
				;
			this.text = function (elm) {
				var html;
				html = 'div class="form-group">
						<label for="' + elm.id + '">' + elm.init + '</label>
						<input type="text" class="form-control" id="' + elm.id + '" placeholder="">
						</div>';
			}
		}
		function (elm) {
			var container = $('.container');
			
			container.append (render (elm));
		}
		// render the elements traversing the tree
		tree.traverse ({pre_cb: function (elm) {
			
		}, post_cb: function (order) {
		}, 0});
		
		Tree = function (elms) {
			var order = 0,
				Node;
			this.elements = elms;
			this.vect = [new Node ()];	// virtual root node
			
			Node = function () {
				this.next = undefined;
				this.childs = [];
				this.order = order++;
				// sort none cuz it assumes node nodes be given in sorted order
				this.addChild = function (node) {
					var orig_len = this.childs.length;
					this.childs[orig_len - 1].next = node;
					this.childs.push (node);
				}
			};
			
			this.traverse = function (pre_cb, post_cb, order) {
				var node;
				
				pre_cb.apply (this.elements[order]);
				node = this.vect[order].childs;
				if (node.length) {
					node = node[0];
					while (node) {
						this.traverse(pre_cb, post_cb, node.order);
						node = node.next;
					}
				}
				post_cb.apply (this.elements[order]);
			};
			

			// assume elements are added into tree in same order as vertically positioned in its CSS block formatting context. This is reflected in Tree by the index of array vect. Index 0 is preserved to be tree root and the real elements are ordered starting from 1.
			this.insert = function (parent) {
				var node,
					vect = this.vect;
				node = new Node (order, parent);
				vect[parent].addChild (node);
				vect.push (node);
			};
			
		}
	}

	function field_markup (field) {
		var map_tmplt = {
			'bootstrap': ['text', 'textarea', 'select', 'checkbox', 'radio'],
			'custom': ['fieldset'],
		};
	}
*/
} (jQuery, this));
