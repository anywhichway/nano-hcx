# Nano HCX

JavaScript Template Literals in HTML

Core Library:

	1) ES 2017 - 6.1K raw, 3.4K minify, 1.6k gzip
	
# Contents

1) What

2) Installation

3) Basic Examples

4) API

5) Special Attributes

6) Advanced Examples

7) Notes

8) Release History


# What

HTML Compiler eXtensions (HCX) flips JSX on its head. Rather than make JavaScript handle HTML with something like JSX, HCX makes 
[JavaScript template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) notation
i.e. `${ ... javascript }` available directly in HTML.

It's this simple:

```html
<div>${firstName} ${lastName}</div>
<div>${phone} ${email}</div>
```

Nano HCX will be the core of v1 of 'hcx'. The rest of 'hcx' BETA has yet to be fully re-written, but visit it if you want to see the type of capabability (not API) that is coming.

Nano HCX allows designers to express a UI as HTML and CSS at whatever micro, macro, or monolithic scale they wish and then hand-off to programmers to
layer in functionality. Designers can continue to adjust much of the HTML while programmers are at work. For designers that wish to code, `nano-hcx` 
makes the transition into bits and pieces of JavaScript easier than moving into a full build/code oriented environment.

HCX:

1) Eliminates the need for control flow attribute directives; however, they will be directly supported in `hcx-plus` and custom directives can be added.

2) Eliminates the need for content replacement directives like VUE's `v-text`. You just reference static or reactive data directly in 
your HTML, e.g. instead of `<div v-text="message"></div>` just use `<div>${message}</div>`. This also means that the VUE filter syntax 
is un-neccesary, e.g. instead of `<span v-text="message | capitalize"></span>` use `<span>${message.toUpperCase()}</span>` or even the 
new JavaScript pipe operator when it becomes available `<span>${message |> capitalize}</span>`.

3) Does not use a virtual DOM, it's reactive data dependency tracker laser targets just those DOM nodes that need updates, so diffing is 
not necessary.

4) Does not require a special interpolation function that complicates templates like most other template literal based approaches.

5) Does not require a build environment/pre-compilation process.

6) Allows direct use of the JavaScript debugger in templates.

7) Supports server side rendering via a pre-built Express rendering engine.

8) Sanitizes HTML using DOMPurify or a sanitizer of your choice.

9) Is far smaller, and we think simpler and more flexible, than many other options.

# Installation

`npm install nano-hcx`

The file `nano-hcx.js` is isomorphic and ready for the browser, Node.js or Nano.

## Browser

`<script src="<path>/nano-hcx.js"></script>`

## Node.js

HCX curently runs in the most recent versions of Chrome, Firefox, and Edge.

`npm install nano-hcx`

If you don't want to copy files out of `node_modules/nano-hcx` into your prefered JavaScripr directory and are using Express, try [modulastic](https://www.npmjs.com/package/modulastic) to expose the hcx files 
directly.


## Basic Examples

In the most simple case, a document body can be bound to a model and rendered as shown in ./examples/simple.html:

```html
<html>
<head>
	<script src="../nano-hcx.js" type="text/javascript"></script>
	<script>
		var data = nHCX.reactor({name:"joe",age:27,children:["mary","jane","jack"]});
	</script>
</head>
	<body onload="nHCX.render(document.body,{data})">
	${name} has these children: ${data.children.join(",")}
	</body>
</html>
```
If you are new to template literals, see ...

So long as the data and code between `${ ... }` delimiters does not contain any `&gt;` characters required to specify HTML
tags and the placement does not violate HTML layout rules (tables can be pretty finicky), you can put HCX templates just about
anywhere. If you need to insert HTML or if the un-interpreted content might violate HTML layout rules, you can use a standard `<script>`
tag with type `text/hcx` to wrap your code as shown in `./examples/table.html` below.

```html
<html>
<head>
	<script src="../nano-hcx.js" type="text/javascript"></script>
	<script>
		var data = {name:"joe",age:27,children:["mary","jane","jack"]};
	</script>
</head>
<body onload="nHCX.render(document.body,{data})">
	${name} has these children:
	<script type="text/hcx">
	<table>
	${
		children.reduce((accum,item) => accum +=`<tr><td>${item}</td></tr>`,"")
	}
	</table>
	</script>
</body>
</html>
```

Although it is possible to make individual elements reactive in `nano-hcx`, the default approach is to wrap data as a `reactor`. This way
any element in which the data appears will re-render if the data changes as shown in `./examples/reactor.html`. 

It is not really necessary in this small example, but you may notice the `removeAttribute` call in the on-load. If you are using a DOM 
node as its own replacement, the node will render in an unresolved state first. For large nodes, this may create an odd UI containing 
may `${ ... }` delimited expressions. By starting the node in a hidden state you can avoid this. You should also typically be more targetted
in your use of `render` than providing an entire document body.


```html
<html>
<head>
<script src="../nano-hcx.js" type="text/javascript"></script>
<script>
	var data = nHCX.reactor({name:"joe",age:27,children:["mary","jane","jack"]});
</script>
</head>
<body onload="nHCX.render(document.body,{data}).then(targets => targets[0].removeAttribute('hidden'))" hidden>
	${name} has these children:
	<ul>
	<script type="text/hcx">
	${
		children.reduce((accum,item) => accum +=`<li>${item}</li>`,"")
	}
	</script>
	</ul>
	<script>
		setTimeout(() => {
			alert("Ready for change?");
			data.children[0] = "jim";
		},1000);
	</script>
	</body>
</html>
```

# API

`render(target(s)[,{source,data,root,shadow,sanitize,scripts,...rest}])` returns a Promise for an array of `target(s)` in a resolved state.

Replaces any `${ ... }` delimited content the `source` and inserts the result into the `target(s)`. During processing, `this` is bound to the containing element.

* `target(s)` Any of a DOM node, and array of DOM nodes, or a CSS selector. If an array or CSS selector each target will have the options applied.

All options are exactly that, optional.

* `source` An optional DOM node or an HTML string containing `${ ... }`.  If no source is supplied, the initial content of the target is used.

* `data` An object to use for replacing values in `${ ... }` delimited areas. If it is a `reactor` (see below), then changes will automatically force the re-rendering of
the sections of the HTML that reference the properties of the data changed.

* `root` The root DOM node for initiating the CSS based selection of targets. By default, the current `document`.

* `shadow` If provided, the `source` is rendered into a shadow DOM rooted in the `target`. The value of `shadow` can be 'open' or 'closed'. By using styles and scripts nested
inside `<template>` tags as the `source`, the style and scripts can have their impact isolated to the shadow DOM. When scripts are processed by `hcx` in a
shadow scope, they have `shadowHost` available as a variable set to the `target` in which they are rendered. Also see the special attribute `:scoped`.

* `santize` The function to use to sanitize HTML to improve security. If `DOMPurfiy` is present in the scope of `render` invocation, it will automatically be used unless `sanitize` 
is set to something else. The default value for `sanitize` without `DOMPurify` is, `(html) => html`, essentially a no-op.

* `scripts` A boolean indicating if standard JavaScript blocks should be evaluated when processing the `source`. This can be very powerful; however, it brings with it
some security risks. If `DOMPurify` is used for `sanitize`, then scripts are completely removed unless `scripts` is set to `true`. If `DOMPurify` is not used,
scripts still won't be executed unless `scripts` is set to `true`.

* `...rest` Allows for the passing of custom options to support the larger `hcx` library.

There are also some undocumented options to provide felxibility when introducing the larger `hcx` library. These are documented with `hcx`.

`reactor(data)` - Takes `data` an `object` and returns a `Proxy` that tracks the impact of the data on the rendered HTML and responds to changes of the data to re-render the HTML.
If primitive data is passed in, just returns the primitive data.

# Special Attributes

`:assign=&gt;object>` - Uses `Object.assign` to augment the current `data` with the parsed value of `&gt;object>`. The new values apply at any time after the attribute has been evaluated. For a first
rendering, this will mean the duration of the document. For subsequent renderings, the augmentation will be available earlier in the document.

`:data=&gt;object>` - Sets the `data` for the scope of the element on which the attribute exists to the parsed value of &gt;object>. Make sure to put quotes around theobject properties, e.g.

```
<div :data='{"name":"joe","age":27}'>Name: ${name} Age: ${age}</div>
```

`data-&gt;property>=&gt;value> - Sets the `property` on the current data to the `value`.

`:reactive` - Makes the data associated with the element reactive to changes so that the element will be automatically re-rendered for changes. Since the `Proxy` generated by `:reactive` is not
externally accessable, its use only makes sense in the context of child `<script>` contents within the scope of the element.

`:remove` - If `true`, unlike the attribute `hidden` or the style `display:none`, the node and its children are not fully processed and the node is actually removed from the DOM. 
This is typically facilitated via template resolution, e.g. `<div :remove="${new Date().getHours()<12}">Afternoon message</div>`. It is primarilly useful in lightening the payload
when doing server side rendering, or lightening the processing for large nested DOM nodes.

`:scoped` - When `hcx` evaluates JavaScript scripts (not `text/hcx` scripts) the `this` value for the script will be set to the parent element of the script and the `data` variable will be 
available. Also see `shadow` above where the script automatically gets a `shadowHost` variable, even if not scoped. The example `./examples/scopesandshadows.html` illustrates how this works.

```
<html>
<head>
	<script src="../nano-hcx.js" type="text/javascript"></script>
	<script>
		var data = {name:"joe",age:27,children:["mary","jane","jack"]};
		var children = [];
	</script>
	<template id="example">
		<style>
			p { font-size: 150% }
		</style>
		<p>Larger font</p>
		<script :scoped>
			children = data.children;
			var shadowVar = "secret";
			console.log(shadowHost);
			console.log(this);
			console.log(shadowVar);
		</script>
	</template>
</head>
<body onload="nHCX.render('#app',{data,scripts:true,shadow:'open',source:document.getElementById('example')})">
	<div id="app"></div>
	<p>Normal font. Open debugger to see output.</p>
	<script>
		setTimeout(() => { console.log(children);console.log('shadowVar type:',typeof(shadowVar))},1000)
	</script>
</body>
</html>
```

# Advanced Examples

You can insert `debugger` statements in your templates as shown in `./examples/debugger.html`.

```html
<html>
<head>
<script src="../nano-hcx.js" type="text/javascript"></script>
<script>
	var data = nHCX.reactor({name:"joe",age:27,children:["mary","jane","jack"]});
</script>
</head>
<body onload="nHCX.render(document.body,{data,scripts:true})">
	${name} has these children:
	<ul>
	<script type="text/hcx">
	${
		children.reduce((accum,item) => {debugger; return accum +=`<li>${item}</li>`;},"")
	}
	</script>
	</ul>
	<div id="app">
	<script :scoped>
		alert(`My id is ${this.id}. The first child is ${data.children[0]}`);
	</script>
	</div>
	<script>
		setTimeout(() => {
			alert("Ready for change?");
			data.children[0] = "jim";
		},1000);
	</script>
	</body>
</html>
```

There is a pre-built Express rendering engine available in the file `express.js`. This can be added to Express as shown in `./examples/express/index.js`.

```javascript
const express = require("express")
const app = express()
const port = 3000

app.engine("html",require("../../express.js"));
app.set("views", "./views");
app.set("view engine", "html");
app.get("/*", (req, res) => {
	if(req.url==="/favicon.ico") {
		res.status = 404;
		res.end();
		return;
	}
	res.render(req.url.substring(1), {data:{message: "Hello there!" }}) 
 	// replace 'data' with any data you want, you can also pass additional HCX options as part of this object
	// if you do not pass data, it can still be added using element attributes in the browser
})

app.listen(port, () => console.log(`HCX example app listening at http://localhost:${port}`));
```

Per the API description, scripts can be scoped to their containing element and executed as shown in `./examples/script.html`

```html
<html>
<head>
<script src="../nano-hcx.js" type="text/javascript"></script>
<script>
	var data = nHCX.reactor({name:"joe",age:27,children:["mary","jane","jack"]});
</script>
</head>
<body onload="nHCX.render(document.body,{data,scripts:true})">
	${name} has these children:
	<ul>
	<script type="text/hcx">
	${
		children.reduce((accum,item) => accum +=`<li>${item}</li>`,"")
	}
	</script>
	</ul>
	<div id="app">
	<script :scoped>
		alert(`My id is ${this.id}. The first child is ${data.children[0]}`);
	</script>
	</div>
	<script>
		setTimeout(() => {
			alert("Ready for change?");
			data.children[0] = "jim";
		},1000);
	</script>
	</body>
</html>
```

# Notes

`nano-hcx` was developed while `hcx` was in BETA and will serve as the core of the production release of `hcx`.

# Release History (Reverse Chronological Order)

2020-06-28 v0.0.3 - Added unit tests. Enhanced docs. Made `render` asynchronous.

2020-06-24 v0.0.2 - Fixed issue with undefined `source'. Enhanced documentation and examples.

2020-06-23 v0.0.1 - First public release.
