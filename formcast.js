/* global jQuery */
(function ($, global) {
	"use strict";
	var fields,
		getBEFields,
		convFields,
		fieldsPreview,
		util,
		render,
		getOrderTree,
		console = global.console;

	$(function () {
		var raw,
			order_tree;
		util.out ('formcast.js entered.');
		raw = getBEFields();
		fields = convFields (raw);
		order_tree = getOrderTree (fields);
		util.outEmbed (order_tree);
	});

	render = function (fieldObj, fieldRef, $parent) {
		var _replaceTmpltWithProp = (function () {
				var propArr = ['id', 'type', 'class', 'placeholder', 'options'],
					count = [],
					/* Here regExp is to match one of propArr which is preceded with ':' in subject string. The matched sub patterns include property name and optional radix when it's a array */
					matchReg = 'sdf',
					//matchReg = new RegExp('(?|(?:\:(' + propArr.join (')(\[\])?|(?:\:(') + ')))/g'),
					replaceCallback = function (pattern, subpattern_1, subpattern_2){
						var res;
						res = fieldObj.hasOwnProperty (subpattern_1) ? 
							fieldObj[subpattern_1] : '';
						if (subpattern_2 === '[]') {
							count[subpattern_1] = count[subpattern_1] === undefined ?
								0 : 1 + count[subpattern_1];
							res = res[count[subpattern_1]];
						}
						return res;
					};

				return function (tmplt, fieldObj) {
						count = [];
						return tmplt.replace (matchReg, replaceCallback);
					};
			} ()),
			replaceTmpltWithProp = function (tmplt, fieldObj, fieldRef, $parent) {
				fieldRef.container = $(replaceTmpltWithProp (tmplt, fieldObj));
				if ($parent.container !== null) {
					$parent.container.append(fieldRef.container);
				}
			},
			renderSelect = function (fieldObj, fieldRef, $parent) {
				var i,
					length,
					tmplt_select = '<select class="form-control">';

				fieldObj.options = fieldObj.init.options;
				for (i = 0, length = fieldObj.init.options.length; i < length; i++) {
					tmplt_select += '<optoin>:options[]</option>';
				}
				tmplt_select += '</select>';

				replaceTmpltWithProp(tmplt_select, fieldObj, fieldRef, $parent);
				delete fieldObj.options;
			},
			renderRoot = function (fieldObj, fieldRef, $parent) {
				fieldRef.container = $('<form></form>');
			},
			renderFieldset = function (fieldObj, fieldRef, $parent) {
				var tmplt_fieldset = '<div class="panel panel-info">' +
					'<div class="panel-heading">:label</div>' +
						'<div class="panel-body">' +
						'</div>' +
					'</div>';
				replaceTmpltWithProp(tmplt_fieldset, fieldObj, fieldRef, $parent);
				fieldRef.container = fieldRef.container.find('.panel-body');
			},
			renderNormal = function (fieldObj, fieldRef, $parent) {
				var tmplt_normal = '<div class="form-group">' +
							'<label for=":id">:label</label>' +
							'<input type=":type" class=":class" id=":id" placeholder=":placeholder">' +
						'</div>';
				replaceTmpltWithProp(tmplt_normal, fieldObj, fieldRef, $parent);
			},
			map_render = {
				'root': renderRoot,
				'text': renderNormal,
				'feldset': renderFieldset,
				'select': renderSelect
			};
		arguments.shift();
		map_render[fieldObj.type].apply (null, arguments);
		
	};

	fieldsPreview = function (tree) {
		var rootRef = {container: null},
			cb = function (stacks, depth, flag) {
				switch (flag) {
				case 'fwd':
					stacks[depth].client = depth ? {container: null} : rootRef;
					return render (stacks[depth].sub.ref, stacks[depth].client,
						depth ? stacks[depth - 1].client : null);
				default:
					break;
				}
			};
		util.dfsTree(tree, cb, {'fwd': 0, 'mid': 1, 'bck': 1});
	};
	
	/* revert pre-order traverse vector to tree structure */
	getOrderTree = function (fields) {
		var root = {ref: {id: 0}},
			trace = [],
			i = 0,
			depth = 0,
			node,
			field;
		
		trace.push(root);
		while (i < fields.length) {
			field = fields[i];
			while (depth >= 0 && trace[depth].ref.id !== field.parent) {
				depth--;
				if (depth < 0) {
					util.panic ('Error on input node without valid parent.');
				}
			}
			if (!trace[depth].sub) {
				trace[depth].sub = [];
			}
			node = {ref: field};
			trace[depth].sub.push (node);
			depth++;
			trace[depth] = node;
			i++;
		}
		return root;
	};
	
	// mockup of form fields fed from back end server
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
		raw.push(['my_form_fld_fs1', 'select', 'my_form_fld_2', [0, ['China', 'USA', 'India']]]);
		raw.push([0, 'radio', 'my_form_fld_3', [0, ['male', 'female']]]);
		return raw;
	};

	// permit reuse for backend array mapping to frontend associative object
	convFields = function (raw) {
		var map_backend,
			map_frontend,
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
					if (undefined === map_backend[schm]) {
						schm = depth;
					}
				}
			}
			if (!map_backend[schm] || !map_frontend[schm]) {
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

		util.dfsTree (raw, cb, {'fwd': 0, 'mid': 0, 'bck': 1});
		return fields;
	};

	util = (function () {
		var dfsTree,
			enumProp,
			isObject,
			isArray,
			out,
			panic,
			outEmbed,
			str_repeat;

		/* @method dfsTree: The fabric of depth first search on a tree implemented by js object or js array.
		Client may reuse it to abstract the customized logic from of tree traverse.
		Another, branch cut in middle of traverse is permitted and controlled by callback returned value;
		@param tree: the data structure of tree in array or in associative object.
		@param cb: the callback functions for client to manipulate node in tree search:
		@param cb_mask: callback mask.
		@callback_param stacks: stack emulated object array indexed by depth. Each element is consisted of:
					'client': client object life-cycle managed by utility and used by client. 
					'sub': sub-tree nodes by reference.
					'id': current array index or object property.
		@callback_param depth: search depth indexed from 0.
		@callback_param time: one of 3 search moments when callback occurs:
					'fwd': when depth has advanced and its stack context has been created.
					'bck': when depth is to decrease and context is to be cleared.
					'mid': when a leaf node is found. */
		dfsTree = function (tree, cb, cb_mask) {
			var trace = [],
				obj_ids = [],
				count = [],
				depth,
				node_cur,
				ctx_cur,
				i;

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
					// callback fires before stack pop
					if (!cb_mask.bck) {
						cb (trace, depth, 'bck');
					}
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
						count[depth] = 0;
						obj_ids[depth] = enumProp(node_cur);
						if (!cb_mask.fwd) {
							// callback exec after stack push
							// if got negative, cut branch
							i = cb (trace, depth, 'fwd');
							if (i < 0) {
								depth--;
								continue;
							}
							// otherwise, extend from returned index. undefined equal to 0
							// notice the nuance between index and mapped property in case of object
							if (undefined === i) {
								i = 0;
							}
							count[depth] = i;
						}
					} else {
						count[depth] += 1;
						if (!cb_mask.mid) {
							i = cb (trace, depth, 'mid');
							if (i > count[depth]) {	// protect from endless iteration
								count[depth] = i;
							}
						}
					}
				}
			}
			
		};

		enumProp = function (obj) {
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
		};
		
		isArray = function (obj) {
			return Object.prototype.toString.call (obj) === '[object Array]';
		};
		
		isObject = function (obj) {
			return Object.prototype.toString.call (obj) === '[object Object]';
		};
		
		panic = function (error_str) {
			error_str = 'A JS exception is thrown: ' + error_str;
			out (error_str);
			throw new Error ();
		};
		
		out = function (str) {
			$('<pre>' + str + '</pre>').appendTo ('body');
			console.log (str);
		};
		
		outEmbed = function (obj) {
			var str,
				tab = '\t',
				cb = function (stacks, depth, flag) {
					var i;

					if (flag === 'fwd' || flag === 'bck') {
						depth--;
					}
					str += str_repeat (tab, depth + 1);

					switch (flag) {
					case 'fwd':
						if (depth < 0) {
							str = 'Array (\n';
						} else {
							str += stacks[depth].id + ' => Array (\n';
						}
						break;
					case 'mid':
						i = stacks[depth];
						str += i.id + ' => ' + i.sub[i.id] + '\n';
						break;
					case 'bck':
						str += ')\n';
						break;
					default:
						break;
					}
				};
				
			dfsTree (obj, cb, {'fwd': 0, 'mid': 0, 'bck': 0});
			out (str);
		};
		
		str_repeat = function (str, times) {
			var res = '';
			while (times > 0) {
				if (times & 1) {	/* jslint bitwise: true */
					res += str;
				}
				str += str;
				times >>= 1;
			}
			return res;
		};

		return {
			dfsTree: dfsTree,
			isArray: isArray,
			isObject: isObject,
			out: out,
			panic: panic,
			outEmbed: outEmbed,
			str_repeat: str_repeat
		};
	}());
} (jQuery, this));
