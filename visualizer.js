
const getTreeNode = (embedded, parentNode = null) => {
	const hasChildren = typeof embedded.children === 'object',
		hasMultiChildren = hasChildren && embedded.children instanceof Array,
		treeNode = {
			parent: parentNode, 
			ref: embedded,
			children: null,
		};

	if (hasChildren) {
		treeNode.children = hasMultiChildren ? 
			embedded.children.map((child, i) => getTreeNode(child, treeNode))
			: new Array(getTreeNode(embedded.children, treeNode));
	}

	return treeNode;
}

const visitTree = (treeNode, preVisitor = undefined, postVisitor = undefined, router = {}) => {
	const {children, visitId} = treeNode;
	preVisitor && preVisitor(treeNode);
	if (children) {
		if (visitId instanceof Number && visitId < children.length) {
			visitTree(children[visitId], preVisitor, postVisitor);
		} else {
			for (let child of children) {
				visitTree(child, preVisitor, postVisitor)
			}
		}
	}
	postVisitor && postVisitor(treeNode);
}

const depthFirstVisitTree = visitTree;
const createObjectsTree = (embedded) => getTreeNode(embedded);

const visulizeTree = (embedded, displayNonLeaf, displayLeaf) => {
	// environment parameters.
	const boxBorderWidth = 1,
		maxTextBoxWidth = [6, 20],	// array index: 0 for noneLeafNode; 1 for leafNode;
		graphBox = {
			topLeft: '+', topRight: '+', bottomLeft: '+', bottomRight: '+',
			top: '-', bottom: '-', left: '|', right: '|',
		},
		graphArrow = {lead: '-', tail: '-', cross: '+'},
		graphBlank = ' ';

	// helper methods
	const centerOf = a => (a / 2 + 1),
		max = (a, b) => a > b ? a : b;

	// tree wrapper for target embedded object.
	const helperTree = createObjectsTree(embedded);

	// a first and complete tree traverse building context properties for drawing.
	depthFirstVisitTree(helperTree, null, provisions);
	var provisions = (node) => {
		const {children} = node;

		const iLeafOrNot = Boolean(!children),
			maxVirtual = maxTextBoxWidth[iLeafOrNot],
			bMultiLineText = nodeText.length > maxVirtual;

		const nodeText = children ? displayNonLeafNode(ref) : displayLeafNode(ref);

		return Object.assign(node, {
			visitId: iLeafOrNot ? null : 0,
			scopeBoxHight: iLeafOrNot 
				? nodeText.length / innerTextBoxWid + boxBorderWidth * 2
				: max(nodeText.length / innerTextBoxWid + boxBorderWidth * 2,
				children.reduce((x, y) => (x.scopeBoxHight + y))),
			nodeText: (bMultiLineText
				? nodeText.concat(new Array(graphBlank, maxVirtual - nodeText.length % maxVirtual))
				: nodeText),
			textAreaWidth: (bMultiLineText ? maxVirtual : nodeText.length),
			textBoxHight: (bMultiLineText ? nodeText.length / maxVirtual : 1) + boxBorderWidth * 2,
		});
	};

	// act drawing line by line.
	while (helperTree.children && helperTree.visitId < helperTree.children.length) {
		depthFirstVisitTree(helperTree, null, drawOneLine)
	}
	const drawOneLine = (node) => {
		const drawTokens = (str) => console.log(str);
		const fillBlanks = (size) => drawTokens(new Array(graphBlank, size));

		// cntLine for line count in scope.
		const {cntLine = 0, parent, visitId, scopeBoxHight, textBoxHight} = node;

		// advance interator for line counts in node scope and tree visiting router
		if (++node.cntLine >= scopeBoxHight && parent) {
			parent.visitId++;
		}

		// drawing model: 
		// * scope-box is a recursive rectangle box accommondate all its children's scope-boxes. 
		// * text-box is bordered rectangle box surrounding node text. 
		// * text-box is verically center-aligned, horizontally left-aligned against its scope-box.
		const inCenter = cntLine === centerOf(scopeBoxHight),
			lineOnBoxTop = centerOf(scopeBoxHight) - centerOf(textBoxHight) + 1,
			delta = cntLine - lineOnBoxTop;

		// inline draw, going through the section where text-box exists.
		if (delta === 0) {
			drawTokens(graphBox.topLeft
				+ new Array(graphBox.top, textAreaWidth)
				+ graphBox.topRight
			);
		} else if (delta === textBoxHight - 1) {
			drawTokens(graphBox.bottomLeft
				+ new Array(graphBox.bottom, textAreaWidth)
				+ graphBox.bottomRight
			);
		} else if (delta > 0 && delta < textBoxHight - 1) {
			drawTokens(graphBox.left
				+ nodeText.substring(
					(delta - 1) * textAreaWidth,
					delta * textAreaWidth + 1,
				)
				+ graphBox.right
			);
		} else {
			fillBlanks(textAreaWidth + boxBorderWidth * 2);
		}

		// inline draw, going through the section where inter-box arrow exists.
		if (children) {
			if (inCenter) {
				drawTokens(graphArrow.lead);
			} else {
				fillBlanks(graphArrow.lead.length);
			}
			
			const trailArrowLineNos = children.map(v => centerOf(v.scopeBoxHight));
			if (trailArrowLineNos.includes(cntLine)) {
				drawTokens(graphArrow.cross + graphArrow.tail);
			} else {
				const findId = trailArrowLineNos.findIndex(v => cntLine <= v);
				if (findId === 0 || !findId) {
					fillBlanks(String(graphArrow.tail + graphArrow.tail).length);
				} else {
					drawTokens(inCenter ? graphArrow.cross : graphBox.left);
					fillBlanks(graphArrow.tail.length);
				}
			}
		}
	}
}

export default visulizeTree;
