'use strict';
var cheerio = require('cheerio'); 
 
function tableWrapper(source) {
    var $ = cheerio.load(source);
	$('table').wrap("<div class='table-content'></div>")
    return $.html();
}
hexo.extend.filter.register('after_render:html', tableWrapper);
