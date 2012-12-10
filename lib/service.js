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
	util = require('util');

var serviceConfig = {
	searchBaseUrl: "http://www.goear.com/search/{searchTerm}/{pageIndex}",
	lookupBaseUrl: "http://www.goear.com/tracker758.php?f={trackId}"
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
		offset = 1;
	}

	var searchUrl = encodeURI(substitute(serviceConfig.searchBaseUrl, {
		searchTerm: searchTerm,
		pageIndex: offset || 1
	}));
	// util.log("--> Search URL: " + searchUrl);
	
	request(searchUrl, function(error, response, body) {
		if (error) {
			callback(error);
		} else if (response.statusCode !== 200) {
			callback(new Error('HTTP error code: ' + response.statusCode));
		} else {
			// util.log("<-- Response reveived!");
			var $ = cheerio.load(body),
				result = {
					tracks: [],
					totalCount: parseInt($('.main_box > h2').text().split(' ')[0], 10)
				},
				searchResult,
				comment,
				link;

			if (result.totalCount > 0) {
				$('#results li').each(function() {
					searchResult = $(this);
					comment = searchResult.find('.comment').text();
					result.tracks.push({
						id: searchResult.find('a').eq(0).attr('href').split('/')[1],
						title: searchResult.find('.song').text(),
						quality: parseInt(comment.substring(0, comment.indexOf('kbps')).trim(), 10),
						duration: searchResult.find('.length').text()/*,
						comment: comment*/
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
						trackData = $('song');

					if (trackData.attr('title') && trackData.attr('artist')) {
						if (isIdentifier) {
							callback(null, {
								id: trackId,
								title: trackData.attr('title'),
								artist: trackData.attr('artist'),
								link: trackData.attr('path')
							});
						} else {
							callback(null, _.extend(track, {
								title: trackData.attr('title'),
								artist: trackData.attr('artist'),
								link: trackData.attr('path')
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
