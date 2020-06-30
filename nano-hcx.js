(function() {
	"use strict"
	let N, 
		_ps,
		_hA = (target,attributes,resolver,{data,...rest}) => {
			for(const attribute of attributes) {
				let value = resolver(attribute.value,{data,...rest});
				if(value!=null) {
					target.setAttribute(attribute.name,value);
					try {
						value = JSON.parse(value);
					} catch(e) {
						;
					}
					if(attribute.name===":data") {
						if(value && typeof(value)==="object") data = value;
						else data = {};
					} 
					else if(attribute.name===":assign" && value && typeof(value)==="object") data = data._rctr_ ? reactor(Object.assign({},data,value)) : Object.assign({},data,value);
					else if(attribute.name.startsWith("data-")) data[attribute.name.split("-")[1]] = value; // need to handle dotted attributes via nesting in enhanced handler
				}
			}
			return data;
		}, // replaceable with attributeHandler
		_rT = function(text,{data}) { return text.includes("${") ? Function("data","try { with(data) { return `" + text + "`} } catch(e) { ; }").call(this,data) : text }; // replaceable with resolver
	const _renderers = new WeakMap(),
		_rA = typeof(requestAnimationFrame)!=="undefined" ? (cb) => { return new Promise((resolve) => requestAnimationFrame(() => resolve(cb()))) } : cb => cb(),
		_p = (nodes) => {
			!nodes || _rA(() => {
						for(var node of nodes) node.isConnected ? _renderers.get(node)(node)  : nodes.delete(node);
					});
		},
		reactor = (data) => {
			if(!data || typeof(data)!=="object" || data._rctr_) return data;
			const map = new Map();
			return new Proxy(data, {
				deleteProperty(target,property) {
					delete target[property];
					_p(map.get(property));
				},
				get(target,property) {
					if(property==="_rctr_") return true;
					if(typeof(property)==="symbol") return target[property];
					const value = target[property];
					let nodes = map.get(property);
					nodes || map.set(property,nodes = new Set());
					!N || nodes.add(N);
					return value && typeof(value)==="object" && !value._rctr_ ? target[property] = reactor(value) : value;
				},
				set(target,property,value) {
					if(target[property]!==value) {
						target[property] = value;
						_p(map.get(property));
					}
					return true;
				}
			});
		},
		_r = (target,{data,shadowHost,scripts,sanitize,source,parent,...rest}={}) => {
			data || (data={});
			let arender;
			if(source && source.attributes && source.attributes.length) {//[].slice.call(source.attributes||[]).some(attribute => attribute.value.includes("${") || attribute.name.startsWith("${"))) {
				arender = () => {
					//if(source.attributes) {
						N = target;
						while(source!==target && target.attributes && target.attributes.length) target.attributes.removeNamedItem(target.attributes.item(0).name);
						data = _hA(target,source.attributes,_rT,{data,sanitize,...rest});
						if(source.hasAttribute(":reactive")) data = reactor(data);
						N = null;
					//}
				};
			}
			const opts = scripts ?  {FORCE_BODY:true,ADD_TAGS:["script"]} : undefined;
			if((source.tagName==="SCRIPT" && source.getAttribute("type")==="text/hcx") || (source.nodeType===3 && source.textContent.includes("$"))) {
				const f = (target) => {
					!arenderer || arenderer();
					N = parent || target.parentNode;
					if(N) {
						const sanitized = sanitize(_rT.call(N,source.textContent,{data,sanitize,...rest})||"",opts),
							fragment = _ps(sanitized,"text/html"),
							hb = sanitized.includes("<head>") || sanitized.includes("<body>") || !fragment.head || !fragment.body,
							nodes = hb ? [].slice.call(fragment.childNodes) : [].slice.call(fragment.head.childNodes).concat([].slice.call(fragment.body.childNodes)),
							oldid = target._hcxid_,
							id = Math.random();
						let child;
						for(child of nodes) {
							if(parent) N.appendChild(child);
							else N.insertBefore(child,target);
							child._hcxid_  = id;
						}
						if(!parent) N.removeChild(target);
						[].slice.call(N.childNodes).forEach(child => !child._hcxid_ || child._hcxid_!==oldid || child.remove());
						_renderers.set(N,() => f(child));
					}
					N = null;
				};
				const arenderer = _renderers.get(target.parentNode);
				f(target);
			} else if(source.tagName==="SCRIPT") {
				if(scripts && [null,"","text/javascript","application/javascript"].includes(source.getAttribute("type"))) {
					const f = (target) => {
						N = parent || target.parentNode;
						const scoped = source.hasAttribute(":scoped"),
							code = sanitize(source.textContent,opts);
						if(code && (scoped || shadowHost || source.textContent!==target.textContent)) {
							if(scoped) Function("data","shadowHost",code).call(N,data,shadowHost)
							else Function("shadowHost",code)(shadowHost)
						}
						_renderers.set(N,() => f(target));
						N = null;
					}
					f(target);
				}
			} else {
				if(arender) _renderers.set(target,arender),arender(target,{data});
				let i = 0;
				const max = source.childNodes.length;
				for(const child of source.childNodes) {
					if(target.childNodes[i]) _r(target.childNodes[i],{data,shadowHost,scripts,sanitize,source:child,...rest});
					else _r(child,{data,shadowHost,scripts,sanitize,source:child,parent:target,...rest});
					if(i>=max) break;
					i++;
				}
				if(parent) parent.appendChild(target);
			}
			return target;
		},
		render = async (targets,{root,source,shadow,scripts,data,parser,sanitize,attributeHandler,resolver,...rest}={}) => {
			// some minimixers will not work if handed this many defaults as part of function signature
			root || (root=typeof(document)!=="undefined"?document:targets);
			parser || (parser=new DOMParser());
			sanitize || (sanitize=typeof(DOMPurify)!=="undefined" ? DOMPurify.sanitize : h=>h);
			_ps = parser.parseFromString.bind(parser);
			if(attributeHandler) _hA = attributeHandler;
			if(resolver) _rT = resolver;
			targets = (typeof(targets)==="string" ? [].slice.call(root.querySelectorAll(targets)) : Array.isArray(targets) ? targets : [targets]);
			if(!source && targets.length==1 && targets[0].cloneNode) source = targets[0];
			//if(source.tagName==="TEMPLATE") source = document.createTextNode(source.innerHTML);
			if(typeof(source)==="string") source = _ps(source,"text/xml"); //"text/xml"
			else source = source.cloneNode(true);
			const promises = [];
			for(let target of targets) {
				let shadowHost = shadow ? target : undefined;
				!shadow || (target = target.shadowRoot || target.attachShadow({mode:shadow}));
				_renderers.delete(target);
				promises.push(_rA(() => _r(target,{data,shadowHost,scripts,sanitize,source,...rest})))
			}
			return Promise.all(promises);
		};
	typeof(window)==="undefined" || (window.nHCX = {reactor,render});
	typeof(module)==="undefined" || (module.exports = {reactor,render});
})();



