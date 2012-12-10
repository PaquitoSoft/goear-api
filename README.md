# goear_api

Simple API to goear service.
This is a humble attemp to create an easy to use API for consuming GoEar music info.

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

There are only two methods in this API:

### search(searchTerm, options, callback)

This method sends a request to the service in order to search for provided terms
Provided callback is called when results are available. 

**Arguments:**

- **searchTerm** {String} (required): The text we want to search
- **options** {Object} (optional): Search options
	- **<i>extendedInfo</i>** (Boolean - default: false): Service basic searchs does not return song's artist and link. Set this to true if you want it to. Makes request slower as it has to perform more requests under the hood.
	- **<i>resultsCount</i>** (Number - default: 10): Number of results we want the function to return
	- **<i>offset</i>** (Number - default: 1): Used when paginating to tell the function which pag we need
	- **<i>minQuality</i>** (Number - default: 128): Used to filter songs with poor quality (Songs will have a quality equals or greater than this one)
- **callback** {Function} (required): Function to be called when results are available. The callback will have two params
	- **<i>error</i>** {Error}: If there is any error while searching
	- **<i>data</i>** {Object}: An object with the results. It has two params
		- **<i>totalCount</i>** {Number}: Total songs available for current search
		- **<i>tracks</i>**: {Array}: Songs found. Each element is an object with these params:
			- **<i>id</i>** {String}: Song identifier
			- **<i>title</i>** {String}: Song title
			- **<i>quality</i>** {Number}: Quality (bitrate) of this song
			- **<i>duration</i>** {String}: Songs length with this format (MM:ss)
			- **<i>artist</i>** {String} (if extendedInfo param is set to true): Song's artist name
			- **<i>link</i>** {String} (if extendedInfo param is set to true): URL to the mp3 file for this song

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
	console.log("Total songs available: " + data.totalCount);
	console.log("First title available: " + data.tracks[0].title);
});
```

### lookup(trackId, callback)

If you performed a search using <i>extendedInfo</i> param set to false, you can get the title and link for your search results using this function.

**Arguments:**

- trackId {String | Object | Array} (required): Here is where you say which tracks you want extended info for. You can provide a song identifier, an array of them, a track object or an array of them.
- callback {Function} (required): Function to be called when results are available. It will be passed two params:
	- error {Error}: If there was an error trying to get the info
	- data {Object | Array}: If you provided a single identifier or track object, this will be a single object. If you used an array, this will be another array


**Examples:**

```javascript
var api = require('goear_api');

// If we want extended info for a song (artist and link)
var trackId = 'acd6d6d';
api.lookup(trackId, function(err, track) {
	console.log("Track title: " + track.title);
	console.log("Track artist: " + track.artist);
	console.log("Track link: " + track.link);
});

api.search("Genesis", function(error, data) {
	api.lookup(data.tracks, function(err, results) {
		// Results are the tracks with all its info
	});
});

```

## License
Copyright (c) 2012 PaquitoSoft  
Licensed under the MIT license.
