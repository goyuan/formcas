
"use strict"
(function ($) {
	var fields = [];
	fields = getFledgedElem ();
	
	function getFledgedElem() {
		var fields = [],
			ajax_resp = [],
			i;
			
		// mockup form elements fed by server
		ajax_resp = (function () {
			var raw = [],
				schm;
			schm = {
				'*': ['parent', 'type', 'id', 'init'],
				'*-init(text)': ['default'],
				'*-init(select)': ['default', 'options', 'multiple']
			};
			raw.push (schm);
			raw.push ([0, 'text', 'my_form_fld_1', ['input your name...']]);
			raw.push ([0, 'select', 'my_form_fld_2', [0, ['China', 'USA', 'India']]);
			raw.push ([0, 'radio', 'my_form_fld_3', [0, ['male', 'female']]);
			
			return raw;
		} ());
		
		fields = (function (raw) {
			return init (raw);
			function Field () {
			};
			function init (raw) {
				var map,
					fields = [],
					col_schm;
				// Decouple php table with mapped js obj hierarchy to free php from aligning with js obj property names and initializer order
				// The syntax of map naming: a sequence of match markers separated with dash '-', while each marker is represented by target 
				// object property which is given an array in source, which is followed a parenthesized value of that object's property 'type'.
				map = {	'*': {
							'parent': 'parent',	// schema column name as map property, Field property name as map value
							'type': 'type',
							'id': 'id',
							'init': 'init'
						},
						'*-init(text)': {
							'default': 'default'
						},
						'*-init(select)': {
							'default': 'default',
							'options': 'options',
							'multiple':	'multiple'
						}
					};
					
				schm = raw.shift();
				cb = function (ctx, depth, flag) {
					var cur,
						next;
					cur = ctx[depth];
					if (flag === 'fwd' && depth) {
						cur.vistor = {};
						last = ctx[depth - 1];
					} else if (flag === 'bck' && depth) {
						last = ctx[depth - 1];
						last.vistor[last.node] = cur.vistor;
					} else if (flag === 'mid') {
						cur.vistor[cur.node] = 1;
					}
				}
				utility.visitTree(raw, cb, ret);
				console.log (ret);
				this.tableMap = function (orig, schm, map) {
					orig.foreach ( function (elm) {
						var obj = new Field();
						elm.foreach (function (val, id) {
							this[map[col_schm[id]]] = val;
						}, obj);
						fields.push (obj);
					});
					return fields;
				};
				utility.tableMap(raw, map);
				);
			}
		} (ajax_resp));
		
		;
	}
				function convArrayObj (ctx, stage) {
					var vst = ctx[depth].vst;
					
					switch (stage) {
					case 'fwd':
						if (map[depth]) {
							vst.schm = map[depth];
						} else {
							node = ctx[depth - 1].node;
							obj = ctx[depth - 1].vst.obj;
							
							if (node.ctx[depth - 1].id + '(' + node')'){
							
						}
						ctx[depth].vst = {};
						break;
					case 'mid':
						ctx[depth].vst. = 
					}
				}		
	utility = (function () {
		// Protocol for interoperation between tree engine and visitor:
		// 		Stage 'fwd': depth has increased and new ctx has been created.
		//		stage 'bck': depth has NOT been decreased and ctx pending to exit is available. 
		this.visitTree = function (tree, cb, ret) {
			var trace = [],
				depth,
				node_temp,
				ctx;

			depth = 1;
			trace.push ({
				vistor: ret, // visitor in each stack context 
				node: tree, 	// tree node in each stack context
				id: 0		// current index in each stack context
			});
			while (depth >= 0) {
				// trace[depth].id++;
				if (trace[depth].id >= trace[depth].node.length) {
					trace.pop();
					cb.backtrace.call (ctx, depth, 'bck');
					depth--;
					if (depth >= 0) {
						trace[depth].id++;
					}
				} else {
					ctx = trace[depth];
					node_temp = ctx.node[ctx.id];
					if (Array.isArray(node_temp)) {
						trace.push ({vistor: undefined, node: node_temp, id: 0});
						depth++;
						cb.visit&extend.call (ctx, depth, 'fwd');
					} else {
						cb.visit.call (ctx, depth, 'mid');
						ctx.id++;
					}
				}
			}
		}
	}
	function fieldsShow (fields) {
		var field,
			i, len,
			tree, Tree;

		// create a tree structure representing embedding and sequencial relationship of fields
		tree = new Tree (fields);
		fields.foreach (function (elem) {
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
	
	$(function () {
		console.log ('formcast.js entered.');
	});
} (jQuery));



