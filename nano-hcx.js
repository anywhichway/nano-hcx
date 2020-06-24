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
					else if(attribute.name===":assign" && value && typeof(value)==="object") Object.assign(data,value);
					else if(attribute.name.startsWith("data-")) data[attribute.name.split("-")[1]] = value; // need to handle dotted attributes via nesting in enhanced handler
				}
			}
			return data;
		}, // replaceable with attributeHandler
		_rT = function(text,{data}) { return text.includes("${") ? Function("_","try { with(_) { return `" + text + "`} } catch(e) { ; }").call(this,data) : text }; // replaceable with resolver
	const _renderers = new WeakMap(),
		_rA = typeof(requestAnimationFrame)!=="undefined" ? requestAnimationFrame : cb => cb(),
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
		_r = (target,{data,scripts,sanitize,source,parent,...rest}={}) => {
			data || (data={});
			source || (source=target.cloneNode(true));
			let arender;
			if([].slice.call(source.attributes||[]).some(attribute => attribute.value.includes("${"))) {
				arender = (target) => {
					if(source.attributes) {
						N = target;
						while(target.attributes && target.attributes.length) target.attributes.removeNamedItem(target.attributes.item(0).name);
						data = _hA(target,source.attributes,_rT,{data,sanitize,...rest});
						if(source.hasAttribute(":reactive")) data = reactor(data);
						N = null;
					}
				};
			}
			const opts = scripts ?  {FORCE_BODY:true,ADD_TAGS:["script"]} : undefined;
			if((source.tagName==="SCRIPT" && source.getAttribute("type")==="text/hcx") || (source.nodeType===3 && source.textContent.includes("$"))) {
				const f = (target) => {
					!arenderer || arenderer(target.parentNode);
					N = parent || target.parentNode;
					const sanitized = sanitize(_rT.call(N,source.textContent,{data,sanitize,...rest})||"",opts),
						fragment = _ps(sanitized,"text/html"),
						hb = sanitized.includes("<head>") || sanitized.includes("<body>") || !fragment.head || !fragment.body;
					fragment.normalize();
					const nodes = hb ? [].slice.call(fragment.childNodes) : [].slice.call(fragment.head.childNodes).concat([].slice.call(fragment.body.childNodes)),
						oldid = target._hcxid_,
						id = Math.random();
					let child;
					for(child of nodes) {
						if(parent) N.appendChild(child);
						else N.insertBefore(child,target);
						child._hcxid_  = id;
					}
					[].slice.call(N.childNodes).forEach(child => child._hcxid_!==oldid || child.remove());
					_renderers.set(N,() => f(child));
					N = null;
				};
				const arenderer = _renderers.get(target.parentNode);
				f(target);
			} else if(source.tagName==="SCRIPT") {
				const type = source.getAttribute("type");
				if(scripts && [null,"","text/javascript","application/javascript"].includes(type)) {
					const f = (target) => {
						N = parent || target.parentNode;
						const scoped = source.hasAttribute(":scoped"),
							code = sanitize(source.textContent,opts);
						if(code && (scoped || source.textContent!==target.textContent)) {
							if(scoped) Function("data","with(data) { " + code + "}").call(N,data)
							else Function("data","with(data) { " + code + "}")(data)
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
					if(target.childNodes[i]) _r(target.childNodes[i],{data,scripts,sanitize,source:child,...rest});
					else _r(child,{data,scripts,sanitize,source:child,parent:target,...rest});
					if(i>=max) break;
					i++;
				}
				if(parent) parent.appendChild(target);
			}
			return target;
		},
		render = (targets,{root,source,shadow,scripts,data,parser,sanitize,attributeHandler,resolver,...rest}={}) => {
			root || (root=typeof(document)!=="undefined"?document:targets);
			parser || (parser=new DOMParser());
			sanitize || (sanitize=typeof(DOMPurify)!=="undefined" ? DOMPurify.sanitize : h=>h);
			_ps = parser.parseFromString.bind(parser);
			if(attributeHandler) _hA = attributeHandler;
			if(resolver) _rT = resolver;
			if(!source && targets && targets.cloneNode) source = targets;
			targets = (typeof(targets)==="string" ? root.querySelectorAll(targets) : Array.isArray(targets) ? targets : [targets]);
			if(typeof(source)==="string") {
				if(!source.includes("${")) return source;
				source = _ps(source,"text/xml");
			} else source = source.cloneNode(true);
			for(const target of targets) _rA(() => _r(shadow ? target.attachShadow({mode:shadow}) : target,{data,scripts,sanitize,source,...rest}))
			return targets;
		};
	typeof(window)==="undefined" || (window.nHCX = {reactor,render});
	typeof(module)==="undefined" || (module.exports = {reactor,render});
})();


