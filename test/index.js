var chai,
	expect,
	nanomemoize;
if(typeof(window)==="undefined") {
	chai = require("chai");
	expect = chai.expect;
	nHCX = require("../nano-hcx.js");
}

const target = document.getElementById("app"),
	simplesource =  (() => { const el = document.createElement("div");el.innerHTML="${message}";return el;})();

describe("Test",function() {
	it("simple replace#", async () => {
		target.innerHTML = "${message}";
		const result = await nHCX.render(target,{data:{message:"test"}}),
			node = result[0];
		expect(node).to.equal(target);
		expect(node.innerHTML).to.equal("test");
	});
	it("simple source replace#", async () => {
		const result = await nHCX.render(target,{data:{message:"test"},source:simplesource}),
			node = result[0];
		expect(node).to.equal(target);
		expect(node.innerHTML).to.equal("test");
	});
	it("template source replace#", async () => {
		const result = await nHCX.render(target,{data:{message:"test"},source:document.getElementById("templatesource")}),
			node = result[0];
		expect(node).to.equal(target);
		expect(node.innerHTML).to.equal("test");
	});
	it("text source replace#", async () => {
		const result = await nHCX.render(target,{data:{message:"test"},source:"${message}"}),
			node = result[0];
		expect(node).to.equal(target);
		expect(node.innerHTML).to.equal("test");
	});
});