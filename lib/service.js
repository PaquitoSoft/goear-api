/*
 * goear_api service
 * https://github.com/PaquitoSoft/goear_api
 *
 * Copyright (c) 2012 PaquitoSoft
 * Licensed under the MIT license.
 */

var request = require('request'),
	cheerio = require('cheerio'),
	async = require('async'),
	_ = require('underscore'),
	fs = require('fs'),
	util = require('util');

var serviceConfig = {
	searchBaseUrl: "http://www.goear.com/search/{searchTerm}/{pageIndex}",
	lookupBaseUrl: "http://www.goear.com/playersong/{trackId}",
	trackLinkBaseUrl: "http://www.goear.com/action/sound/get/{trackId}"
};

/*
	Parses a string in order to substitue placeholders
	with provided params object.

	@param {String} originalString
	@param {Object} params
	@return {String} substituted string
*/
function substitute(originalString, params) {
	"use strict";

	var result = originalString;
	if (params) {
		Object.keys(params).forEach(function(key) {
			result = result.replace(new RegExp('{' + key + '}', 'g'), params[key]);
		});
	}
	return result;
}

/*
	Change config data (service urls).

	@param {Object} options (searchBaseUrl, lookupBaseUrl)
*/
exports.config = function(options) {
	"use strict";
	_.extend(serviceConfig, options);
};

/*
	Search for tracks on the service.

	@param {String} searchTerm
	@param {Number} offset
	@param {Function} callback
*/
exports.searchTracks = function(searchTerm, offset, callback) {
	"use strict";

	if (typeof offset === 'function') {
		callback = offset;
		offset = '';
	}

	var searchUrl = encodeURI(substitute(serviceConfig.searchBaseUrl, {
		searchTerm: searchTerm,
		pageIndex: offset || ''
	}));
	// util.log("--> Search URL: " + searchUrl);

	request(searchUrl, function(error, response, body) {
		if (error) {
			callback(error);
		} else if (response.statusCode !== 200) {
			if (response.statusCode === 404) { // Issue #2 (provider began returning 404 when search does not return any result)
				callback(null, {tracks:[],totalCount:0});
			} else {
				callback(new Error('HTTP error code: ' + response.statusCode));
			}
		} else {
			// util.log("<-- Response reveived!");
			
			var $ = cheerio.load(body),
				result = {
					tracks: [],
					totalCount: $('.results_list > li').length * $('.pagination > li').length
					
				},
				searchResult,
				trackId;
			if (result.totalCount > 0) {
				$('.results_list > li').each(function(index, item) {
					searchResult = $(this);
					trackId = searchResult.find('.title a').attr('href').match(/listen\/(.*)\//)[1];
					result.tracks.push({
						id: trackId,
						title: searchResult.find('.title').text(),
						artist: searchResult.find('.band').text(),
						quality: parseInt(searchResult.find('.kbps').text().trim(), 10),
						duration: searchResult.find('.length').text().trim(),
						link: serviceConfig.trackLinkBaseUrl.replace('{trackId}', trackId)
					});
				});
			}

			callback(null, result);
		}
	});

};

/*
	Get extended info for provided tracks.

	@param {Array} tracks
	@param {Function} onComplete
*/
exports.lookupTracks = function(tracks, onComplete) {
	"use strict";

	var requests = [];

	tracks.forEach(function(track) {
		requests.push(function(callback) {
			var isIdentifier = (typeof track === 'string'),
				trackId = isIdentifier ? track : track.id,
				searchUrl = substitute(serviceConfig.lookupBaseUrl, {
					trackId: trackId
				});
			// util.log("Let's look for extended info fo track: " + trackId);
			request(searchUrl, function(error, response, body) {
				if (error) {
					callback(error);
				} else if (response.statusCode !== 200) {
					callback(new Error('HTTP error code: ' + response.statusCode));
				} else {
					// util.log("Extended info received for track: " + trackId);
					var responseText = body.replace(/&/g, '&amp;'),
						$ = cheerio.load(responseText),
						trackData = $('track');

					if (trackData.attr('title') && trackData.attr('href')) {
						if (isIdentifier) {
							callback(null, {
								id: trackId,
								title: trackData.attr('title'),
								link: trackData.attr('href')
							});
						} else {
							callback(null, _.extend(track, {
								title: trackData.attr('title'),
								link: trackData.attr('href')
							}));
						}
					} else {
						callback(new Error("No extended info found for trackId: " + trackId));
					}
				}
			});
		});
	});

	async.parallel(requests, function(err, results) {
		// util.log("Extended info received for all requested tracks!");
		onComplete(err, results);
	});

};
