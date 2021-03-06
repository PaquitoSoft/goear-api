# goear_api [![Build Status](https://travis-ci.org/PaquitoSoft/goear-api.png?branch=master)](https://travis-ci.org/PaquitoSoft/goear-api)

Simple API to goear service.
This is a humble attemp to create an easy to use API for consuming [GoEar](http://goear.com/) music info.

## Getting Started
Install the module with: `npm install goear_api`

```javascript
var api = require('goear_api');

api.search("The Police - Bring on the night", function(err, data) {
	console.log("Total songs available: " + data.totalCount);
	console.log("First title available: " + data.tracks[0].title);
});
```

## Documentation

There is only one methods in this API:

### search(searchTerm, options, callback)

This method sends a request to the service in order to search for provided terms.  
Provided callback is called when results are available.  
Due to the nature of the provider, chances are that the request can't be completed in a reasonable amount of time (example: You search for 100 songs of Michael Jackson with a minimum quality of 320kbps). In that case, the api will return the songs it had time to get.

**Arguments:**

- **searchTerm** {String} (required): The text we want to search
- **options** {Object} (optional): Search options
	- **<i>resultsCount</i>** (Number - default: 10): Number of results we want the function to return.
	- **<i>offset</i>** (Number - default: 1): Used when paginating to tell the function which pag we need.
	- **<i>minQuality</i>** (Number - default: 0): Used to filter songs with poor quality (Songs will have a quality equals or greater than this one).
	- **<i>timeout</i>** (Number - default: 15000): Milliseconds until api should stop searching.
- **callback** {Function} (required): Function to be called when results are available. The callback will have two params
	- **<i>error</i>** {Error}: If there is any error while searching
	- **<i>data</i>** {Object}: An object with the results. It has two params
		- **<i>totalCount</i>** {Number}: Total songs available for current search. This attribute will not exist if you filter your search by minQuality as the service provider is not able to return that info in a reasonable amount of time.
		- **<i>tracks</i>**: {Array}: Songs found. Each element is an object with these params:
			- **<i>id</i>** {String}: Song identifier
			- **<i>title</i>** {String}: Song title
			- **<i>quality</i>** {Number}: Quality (bitrate) of this song
			- **<i>duration</i>** {String}: Songs length with this format (MM:ss)
			- **<i>artist</i>** {String}: Song's artist name
			- **<i>link</i>** {String}: URL to the mp3 file for this song
				- **IMPORTANT**: Always include a **Referer** header when requesting this URLs
					- Example: `Referer: http://www.goear.com/`

**Examples:**

```javascript
var api = require('goear_api');

// Basic search
api.search("Vetusta Morla", function(error, data) {
	console.log("Total songs available: " + data.totalCount);
	console.log("Returned songs: " + data.tracks.length): // Should be 10
	console.log("First title available: " + data.tracks[0].title);
});

// Search for a song expecting 25 results with a quality equal or greater than 256kbs
api.search("The Police - Bring on the night", {
	resultsCount: 25,
	minQuality: 256
}, function(error, data) {
	console.log("First title available: " + data.tracks[0].title);
});
```

## License
Copyright (c) 2012 PaquitoSoft  
Licensed under the MIT license.
