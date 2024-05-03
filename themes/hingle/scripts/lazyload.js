'use strict';
var cheerio = require('cheerio'); 
  
function lazyloadImg(source) {
    var LZ = cheerio.load(source, {
        decodeEntities: false
    });
	// 不渲染非文章页面
	if(LZ('article.page-content').length != 0) {
		return;
	}
    //遍历所有 img 标签，添加data-original属性
    LZ('img').each(function(index, element) {
		var lazyload = LZ(element).attr('lazyload');
		if (lazyload === 'false') {
			return;
		}
        var oldsrc = LZ(element).attr('src');
        if (oldsrc) {
            LZ(element).removeAttr('src');
            LZ(element).attr({
                 'data-original': oldsrc
            });
            
        }
    });
    return LZ.html();
}
//在渲染之前，更改 img 标签
hexo.extend.filter.register('after_render:html', lazyloadImg);
