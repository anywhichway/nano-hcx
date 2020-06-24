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
})

app.listen(port, () => console.log(`HCX example app listening at http://localhost:${port}`));