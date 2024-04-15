const depthFirstVisitTree = visitTree;
const createObjectsTree = getTreeNode;

const visualizeTree = (embedded, displayNonLeaf, displayLeaf) => {
	// environment parameters.
	const boxBorderWidth = 1,
		maxTextAreaWidth = [6, 6],	// array index: 0 for noneLeafNode; 1 for leafNode;
		glyphBox = {
			topLeft: '+', topRight: '+', bottomLeft: '+', bottomRight: '+',
			top: '-', bottom: '-', left: '|', right: '|',
		},
		glyphArrow = {lead: '-', tail: '-', cross: '+'},
		glyphBlank = ' ';

	// tree wrapper for target embedded object.
	const helperTree = createObjectsTree(embedded);

	// a first and complete tree traverse building context properties for drawing.
	depthFirstVisitTree(helperTree, null, provisions);
	function provisions (node) {
		const {children, ref} = node;

		const bLeafOrNot = Boolean(!children),
			nodeText = bLeafOrNot ? displayLeaf(ref) : displayNonLeaf(ref),
			maxVirtual = maxTextAreaWidth[+bLeafOrNot],
			residue = nodeText.length % maxVirtual,
			bMultiLineText = nodeText.length > maxVirtual,
			textBoxHight = parseInt(nodeText.length / maxVirtual) + Boolean(residue) + boxBorderWidth * 2;

		Object.assign(node, {
			cntLine: 0,
			visitId: bLeafOrNot ? null : 0,
			nodeText,
			textBoxHight,
			scopeBoxHight: bLeafOrNot 
				? textBoxHight
				: MAX(textBoxHight, children.reduce((last, {scopeBoxHight}) => (scopeBoxHight + last), 0)),
			textAreaWidth: (bMultiLineText ? maxVirtual : nodeText.length),
		});
		// console.log(maxVirtual);
		// console.log(node);
	};
// console.log(helperTree);

	const lineBuffer = getLineBuffer(),
		glyphsFlushGenerator = getGlyphFlushGenerator(),
		fillBlanks = (size) => lineBuffer.append(glyphsFlushGenerator(glyphBlank, size));

	// act drawing line by line.
	while (helperTree.cntLine < helperTree.scopeBoxHight) {
		depthFirstVisitTree(helperTree, drawOneLine, null);
		// depthFirstVisitTree(helperTree, testdrawOneLine, (node) => {node.visitId; node.cntLine++});
		// function testdrawOneLine (node) {console.log(node.nodeText);}
	}
	// console.log('end mark.')
	function drawOneLine (node) {
		// cntLine for line count in scope.
		let {cntLine, children, parent, visitId, nodeText, scopeBoxHight, textAreaWidth, textBoxHight} = node;

		// advance interator for line counts in node scope and tree visiting router
		node.cntLine = ++cntLine;
		if (cntLine >= scopeBoxHight && parent) {
			parent.visitId++;
		}

		// Drawing Model: 
		// * scope-box is a recursive rectangle box accommondate all its children's scope-boxes. 
		// * text-box is bordered rectangle box surrounding node text. 
		// * text-box is verically center-aligned, horizontally left-aligned against its scope-box.
		const inCenter = cntLine === centerOf(scopeBoxHight),
			origLineOfTextBox = centerOf(scopeBoxHight) - centerOf(textBoxHight),
			delta = cntLine - origLineOfTextBox;

		// inline draw, going through the section where text-box exists.
		if (delta === boxBorderWidth) {
			lineBuffer.append(glyphBox.topLeft
				+ glyphsFlushGenerator(glyphBox.top, textAreaWidth)
				+ glyphBox.topRight
			);
		} else if (delta === textBoxHight) {
			lineBuffer.append(glyphBox.bottomLeft
				+ glyphsFlushGenerator(glyphBox.bottom, textAreaWidth)
				+ glyphBox.bottomRight
			);
		} else if (delta > boxBorderWidth && delta < textBoxHight) {
			const cntTextLine = delta - boxBorderWidth,
				textTo = MIN(cntTextLine * textAreaWidth, nodeText.length);
			lineBuffer.append(glyphBox.left
				+ nodeText.substring(
					(cntTextLine - 1) * textAreaWidth,
					textTo,
				)
				+ glyphsFlushGenerator(glyphBlank, cntTextLine * textAreaWidth - textTo)
				+ glyphBox.right
			);
		} else {
			fillBlanks(textAreaWidth + boxBorderWidth * 2);
		}

		// inline draw, going through the section where inter-box arrow exists.
		if (children) {
			if (inCenter) {
				lineBuffer.append(glyphArrow.lead);
			} else {
				fillBlanks(glyphArrow.lead.length);
			}
			
			const trailArrowLineNos = (() => {
					let sum = 0;
					return children.map(({scopeBoxHight}) => {
						sum += scopeBoxHight;
						return (sum - scopeBoxHight + centerOf(scopeBoxHight));
					});
				})();
			if (trailArrowLineNos.includes(cntLine)) {
				lineBuffer.append(glyphArrow.cross + glyphArrow.tail);
			} else {
				const findId = trailArrowLineNos.findIndex(v => cntLine <= v);
				if (findId === 0 || findId === -1) {
					fillBlanks(String(glyphArrow.tail + glyphArrow.tail).length);
				} else {
					lineBuffer.append(inCenter ? glyphArrow.cross : glyphBox.left);
					fillBlanks(glyphArrow.tail.length);
				}
			}
		}

		// dump buffered line
		if (visitId === null || visitId >= children.length) {
			// lineBuffer.append(nodeText);
			lineBuffer.dump();
		}
	}
}

/* Below are helper functions to be hoisted. */ 

// helper methods
function centerOf (a) {return (parseInt(a / 2) + (a % 2));}
function MAX (a, b) {return (a >= b ? a : b);}
function MIN (a, b) {return (a >= b ? b : a);}

function getLineBuffer () {
	let buffer = '';
	return {
		append: (str) => {buffer += str},
		dump: () => {
			console.log(buffer);
			buffer = '';
		}
	}
}

function getGlyphFlushGenerator () {
	let cache = {};
	return (glyph, size) => {
		let tmplt = cache[glyph] ? cache[glyph] : String(glyph);
		if (tmplt.length < size) {
			let	len = tmplt.length;
			while (len < size) {
				tmplt += tmplt;
				len *= 2;
			}
			cache[glyph] = tmplt;
		}
		return tmplt.substring(0, size);
	}
}

function getTreeNode (embedded, parentNode = null) {
	const treeNode = {
			parent: parentNode, 
			ref: embedded,
			children: null,
		};

	embedded.children instanceof Array
		? treeNode.children = embedded.children.map((child, i) => getTreeNode(child, treeNode))
		: null;

	return treeNode;
}

function visitTree (treeNode, preVisitor = null, postVisitor = null) {
	const {children, visitId} = treeNode;
	preVisitor && preVisitor(treeNode);
	if (children instanceof Array) {
		if (visitId != undefined) {
			if (visitId < children.length) {
				visitTree(children[visitId], preVisitor, postVisitor);
			}
		} 
		else {
			for (let child of children) {
				visitTree(child, preVisitor, postVisitor)
			}
		}
	}
	postVisitor && postVisitor(treeNode);
}

export {visualizeTree, visitTree};
