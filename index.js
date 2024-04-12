import * as cheerio from 'cheerio';

import {default as visualize} from "./visualizer.js";

const query = cheerio.load('https://vuejs.org/guide/introduction.html');
const htmlTree = query('main');
visualize(htmlTree, 
	(el) => el.prop('tagName'), 
	(el) => el.prop('textContent'));
