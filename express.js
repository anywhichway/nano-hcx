const fs = require("fs"),
	JSDOM = require("jsdom").JSDOM,
	render = require("./nano-hcx.js").render;

class DOMParser {
	parseFromString(string) {
		return JSDOM.fragment(string);
	}
}

const parser = new DOMParser();

module.exports = (filePath,options,callback) => {
	fs.readFile(filePath, function (err, content) {
	    if (err) return callback(err)
		const text = content.toString(),
			dom = new JSDOM(text,"text/xml"),
			document = dom.window.document,
	    	head = parser.parseFromString(""),
			body = parser.parseFromString("");
		render(head,Object.assign(options,{source:document.head,root:head,parser}));
		render(body,Object.assign(options,{source:document.body,root:body,parser}));
		
		const html = `<head>${[].slice.call(head.childNodes|[]).reduce((accum,child) => accum+=child.innerHTML||child.textContent,"")}</head>
		<body>${[].slice.call(body.childNodes||[]).reduce((accum,child) => accum+=child.innerHTML||child.textContent,"")}</body>`;
	    return callback(null,html);
	  })
}

