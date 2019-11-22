const express = require("express");
const cors = require("cors");
const request = require("request");
const puppeteer = require("puppeteer");
const absolutify = require("absolutify");
const imageDataURI = require("image-data-uri");

var router = express.Router();

function getHostName(url) {
	var nohttp = url.replace("http://", "").replace("https://", "");
	var http = url.replace(nohttp, "");
	var hostname = http + nohttp.split(/[/?#]/)[0];
	return hostname;
}

/**
 * Middleware
 */

//enable CORS
router.use(cors());
router.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	next();
});

router.use("/", (req, res, next) => {
	res.type("html");
	next();
});

router.use("/file", (req, res, next) => {
	res.type("text/plain");
	next();
});

/**
 * Paths
 */

// /cors/data/(url)
router.use("/data", async (req, res) => {
	var url = req.path.substr(1);
	console.log("URL:", url);
	if (!url) {
		res.send("No URL provided");
		return;
	}
	try {
		imageDataURI.encodeFromURL(url).then(data => {
			res.json({ url: data });
		});
	} catch (e) {
		console.log(e);

		res.send("Error: " + e);
		return;
	}
});

// /cors/file/(url)
router.use("/file", async (req, res) => {
	var url = req.path.substr(1);
	console.log("URL:", url);
	if (!url) {
		res.send("No URL provided");
		return;
	}
	var reqfile = () =>
		new Promise((resolve, reject) => {
			request(url, (err, res, body) => {
				if (err) {
					console.log(error);
					reject(error);
					return;
				}
				resolve(body);
			});
		});

	var filecont = await reqfile();
	res.send(filecont);
});

// /cors/(url)
router.use("/", async (req, res) => {
	var url = req.path.substr(1);
	console.log("URL:", url);
	if (!url) {
		res.send("No URL provided");
		return;
	}
	try {
		const browser = await puppeteer.launch({
			args: ["--no-sandbox", "--disable-setuid-sandbox"]
		});
		const page = await browser.newPage();

		await page.setRequestInterception(true);

		page.on("request", request => {
			if (
				request.isNavigationRequest() &&
				request.redirectChain().length !== 0
			) {
				request.abort();
			} else {
				request.continue();
			}
		});

		await page.goto(`${url}`);
		var document = await page.evaluate(
			() => document.documentElement.outerHTML
		);
		document = absolutify(document, `/cors/${getHostName(url)}`);

		res.send(document);
		request(url).pipe(res);
	} catch (e) {
		console.log(e);

		res.send("Error: " + e);
		return;
	}
});

module.exports = router;
