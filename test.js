import {visualizeTree, visitTree} from "./visualizer.js";

console.log('Time to emerge.');

const test = (() => {
	const maxDepth = 10,
		maxChildren = 3,
		probExtend = 0.5;
	let roundDepth = 0;
	const treeHead = {depth: 1};
	while (roundDepth < maxDepth) {
		roundDepth = 1;
		visitTree(treeHead, extend);
		function extend (node) {
			if (!node.children) {
				if (node.depth >= roundDepth) {
					roundDepth = node.depth;
				}
				if (roundDepth < maxDepth && Math.random() > probExtend) {
					node.children = Array(1 + parseInt(maxChildren * Math.random())).fill({depth: node.depth + 1});
				}
			}
		}
	}
	console.log(treeHead);
	visualizeTree(treeHead, displayPseudo, displayPseudo);
	function displayPseudo () {
		const maxTextLen = 20,
			pseudoText = "This is a psudo sentence meaningful only in test.";
		return pseudoText.substring(0, 1 + parseInt(maxTextLen * Math.random()))
	}
})();

// const display = obj => obj.text;
// const objTest = {
// 	children: [{
// 			children: [{
// 				text: 'a3 text',
// 			}],
// 			text: 'a2-1 text',
// 		},
// 		{text: 'a2-2 text'},
// 	],
// 	text: 'a1 text',
// };
// visualizeTree(objTest, display, display);