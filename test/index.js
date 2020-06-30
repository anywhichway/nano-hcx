var chai,
	expect;
if(typeof(window)==="undefined") {
	chai = require("chai");
	expect = chai.expect;
	nHCX = require("../nano-hcx.js");
}

const target = document.getElementById("app"),
	simplesource =  (() => { const el = document.createElement("div");el.innerHTML="${message}";return el;})(),
	data = nHCX.reactor({name:"joe"});

describe("Test",function() {
	it("simple replace#", async () => {
		const target = document.getElementById("app");
		target.innerHTML = "${message}";
		const result = await nHCX.render(target,{data:{message:"test"}}),
			node = result[0];
		expect(node).to.equal(target);
		expect(node.innerHTML).to.equal("test");
	});
	it("simple source replace#", async () => {
		const target = document.getElementById("app"),
			result = await nHCX.render(target,{data:{message:"test"},source:simplesource}),
			node = result[0];
		expect(node).to.equal(target);
		expect(node.innerHTML).to.equal("test");
	});
	it("template source replace#", async () => {
		const target = document.getElementById("app"),
			result = await nHCX.render(target,{data:{message:"test"},source:document.getElementById("templatesource")}),
			node = result[0];
		expect(node).to.equal(target);
		expect(node.innerHTML).to.equal("test");
	});
	it("text source replace#", async () => {
		const target = document.getElementById("app"),
			result = await nHCX.render(target,{data:{message:"test"},source:"${message}"}),
			node = result[0];
		expect(node).to.equal(target);
		expect(node.innerHTML).to.equal("test");
	});
	it("simple reactor", (done) => {
		const target = document.getElementById("app");
		target.innerHTML = "${name}";
		nHCX.render(target,{data}).then(result => {
			const node = result[0];
			expect(node).to.equal(target);
			expect(node.innerHTML).to.equal("joe");
			data.name = "mary";
			setTimeout(() => {
				expect(node.innerHTML).to.equal("mary");
				done();
			},100);
		});
	});
	it("assigned reactor", (done) => {
		const target = document.getElementById("app"),
			source = document.getElementById("nestedsource");
		nHCX.render(target,{data,source}).then(result => {
			const node = result[0];
			expect(node).to.equal(target);
			expect(document.getElementById("inner").innerText).to.equal("27");
			expect(document.getElementById("after").innerText).to.not.equal("27");
			data.age = "26";
			setTimeout(() => {
				expect(document.getElementById("before").innerText).to.equal("26");
				expect(document.getElementById("inner").innerText).to.equal("27");
				expect(document.getElementById("after").innerText).to.equal("26");
				done();
			},100);
		});
	});
});