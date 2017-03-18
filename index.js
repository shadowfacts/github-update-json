const fs = require("fs");
const path = require("path");
const Client = require("github");
const XRegExp = require("xregexp");
const express = require("express");
const app = express();

const cache = {};
const config = loadConfig();
const github = new Client({
	headers: {
		"user-agent": "github-update-json"
	}
});
github.authenticate({
	type: "token",
	token: config.token
});

config.projects.forEach(proj => {
	app.get(`/${proj.slug}`, (req, res) => {
			get(proj)
				.then(data => {
					res.status(200);
					res.set("Content-Type", "application/json");
					res.send(data);
					res.end();
				})
				.catch(e => {
					res.status(500);
					res.end();
					console.error(e);
				});
	});
});

app.listen(config.port, () => {
	console.log(`Listening on port ${config.port}`);
});

function loadConfig() {
	const data = fs.readFileSync(path.join(__dirname, "config.json"));
	const config = JSON.parse(data);
	for (const proj of config.projects) {
		proj.versionRegex = XRegExp(proj.versionRegex);
	}
	return config;
}

function get(proj) {
	const now = Date.now();
	if (now - cache[proj.slug] < proj.cacheDuration * 60 * 1000) {
		console.log(`loading cache for ${proj.slug}`);
		return new Promise((resolve, reject) => {
			fs.readFile(path.join(__dirname, "cache", `${proj.slug}.json`), (err, data) => {
				if (err) reject(err);
				else resolve(data);
			});
		});
	} else {
		console.log(`generating ${proj.slug}`);
		return generateAndCache(proj);
	}
}

function generateAndCache(proj) {
	return new Promise((resolve, reject) => {
		github.repos.getReleases({
			owner: proj.owner,
			repo: proj.repo
		}, (err, res) => {
			if (err) {
				reject(err);
				return;
			}
			const versions = [];
			for (const release of res.data) {
				const ver = {};

				const name = release.name;
				const match = XRegExp.exec(name, proj.versionRegex);
				ver.ver = match.ver;
				ver.mcVer = match.mc;

				ver.changelog = release.body;
				ver.prerelease = release.prerelease;

				versions.push(ver);
			}
			const json = generateJson(proj, versions);
			const s = JSON.stringify(json, null, "\t");
			fs.writeFile(path.join(__dirname, "cache", `${proj.slug}.json`));
			cache[proj.slug] = Date.now();
			resolve(s);
		});
	});
}

/*
versions is ordered newest first
{
	ver: "3.7.5",
	mcVer: "1.11.2",
	changelog: "...",
	prerelease: false
}
 */
function generateJson(proj, versions) {
	const o = {
		homepage: proj.homepage,
		promos: {}
	};
	for (const ver of versions) {
		// all versions
		if (!o.hasOwnProperty(ver.mcVer)) {
			o[ver.mcVer] = {};
		}
		o[ver.mcVer][ver.ver] = ver.changelog;

		// promos
		if (!o.promos.hasOwnProperty(`${ver.mcVer}-latest`)) {
			o.promos[`${ver.mcVer}-latest`] = ver.ver;
		}
		if (!o.promos.hasOwnProperty(`${ver.mcVer}-recommended`) && !ver.prerelease) {
			o.promos[`${ver.mcVer}-recommended`] = ver.ver;
		}
	}
	return o;
}
