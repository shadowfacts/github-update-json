# github-update-json
A Node.js application to generate [Forge Update JSONs](http://mcforge.readthedocs.io/en/latest/gettingstarted/autoupdate/) from the GitHub Releases API.

## Installation
1. Install [Node.js](https://nodejs.org/)
2. Clone this repository.
3. Run `npm install` in the repository directory.
4. Create the `cache` directory inside the repository directory.
5. Run `node index.js` to start the server.

## Configuration
```json
{
	"token": "token",
	"port": 8080,
	"projects": [
		{
			"owner": "shadowfacts",
			"repo": "shadowmc",
			"slug": "shadowmc",
			"homepage": "https://minecraft.curseforge.com/projects/shadowmc",
			"versionRegex": "(?<ver>.*?) for MC (?<mc>.*)",
			"cacheDuration": 120
		}
	]
}
```

- `token`: A GitHub personal access token ([create one](https://github.com/settings/tokens/new)).
- `port`: The port to run the server on.
- `projects`: An array of all the projects to use for this instance. Each element is an object with these properties:
	- `owner`: The GitHub repository owner's username.
	- `repo`: The name of the GitHub repository.
	- `slug`: The slug to serve the JSON from. e.g. if it's running on a server at `example.com` on port `8080` and the slug is `examplemod`, it will be accessible from `http://example.com:8080/examplemod`.
	- `homepage`: The URL for the homepage in the Forge Update JSON.
	- `versionRegex`: A [XRegExp](http://xregexp.com/) for extracting the file version and Minecraft version from the release name. The file version should be in an XRegExp named group called `ver` and the MC version should be in an XRegExp named group called `mc`.
	- `cacheDuration`: The length of time (in minutes) to cache the update JSON for.
