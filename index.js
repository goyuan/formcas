import * as cheerio from 'cheerio';

import default as visualize from "visualizer";

const query = cheerio.load('https://vuejs.org/guide/introduction.html');
const htmlTree = query('main');
visualize(htmlTree, 
	(el) => el.prop('tagName'), 
	(el) => el.prop('textContent'));
