/*
 * goear_api
 * https://github.com/PaquitoSoft/goear_api
 *
 * Copyright (c) 2012 PaquitoSoft
 * Licensed under the MIT license.
 */

/*global require:true, exports:true */
var util = require('util'),
	request = require('request'),
	_ = require('underscore'),
	async = require('async'),
	service = require('./service');

var SEARCH_TIMEOUT = 15000; // 15 seconds

/*
	Filter provided tracks by quality, returning only those
	which have quality greater than or equal to provided quality.

	@param tracks {Array}
	@param quality {Number}
	@return {Array} filtered tracks
*/
function filterTracks(tracks, quality) {
	"use strict";

	return tracks.filter(function(t) {
		return quality <= t.quality;
	});
}

/*
	Search for song on GoEar.

	@param searchTerm {String} -> Text you want to search for
	@param options {Object} (optional) -> search options (extendedInfo, offset, resultsCount, minQuality)
	@param callback {Function} -> function to be called once results have been collected (params: err, data)
*/
exports.search = function(searchTerm, options, callback) {
	"use strict";

	var defaultOptions = {
		extendedInfo: false,
		offset: 1,
		resultsCount: 10,
		minQuality: 0,
		timeout: SEARCH_TIMEOUT
	};

	if (typeof options === 'function') {
		callback = options;
		options = defaultOptions;
	} else {
		options = _.extend(defaultOptions, options) || defaultOptions;
	}

	// We issue a first request to test if there are any result and
	// to get the total number
	service.searchTracks(searchTerm, 0, function(err, data) {

		if (err) {
			callback(err);
		} else {

			if (data.totalCount < 1) {
				callback(null, data);
			} else {


				// How many tracks do we need to satisfy client's needs
				var requestedTracksCount = options.offset * options.resultsCount,
					// totalCount = -1,
					totalCount = data.totalCount,
					tracks = filterTracks(data.tracks, options.minQuality),
					counter = 2,
					requestStartTime = Date.now();

				async.until(
					function() {
						// We wait until we have all songs requested by the user.
						// As the user can request more results than available and we can't know that
						// before we start the process, there's also a timeout. If we don't get all requested
						// songs in a set of time, we stop the process and return what we have in that moment.
						return (tracks.length >= requestedTracksCount) || ((Date.now() - requestStartTime) > options.timeout);
					},
					function(innerCallback) {
						service.searchTracks(searchTerm, counter++, function(err, innerData) {
							totalCount = innerData.totalCount;
							tracks = tracks.concat(filterTracks(innerData.tracks, options.minQuality));
							// util.log("New tracks quantity: " + filterTracks(innerData.tracks, options.minQuality).length);
							innerCallback(err);
						});
					},
					function(innerErr) {
						var result = {};

						if (innerErr) {
							callback(innerErr);
						} else {
							// Now we have all needed tracks to compose client response
							if (options.minQuality < 1) {
								result.totalCount = totalCount;
							}

							// Get the tracks we're looking for
							result.tracks = tracks.slice((options.offset - 1) * options.resultsCount, requestedTracksCount);

							// We're done!
							callback(null, result);
						}
					}
				);

			}

		}

	});

};

/*
	Lookup for extended info for a track/s.

	@param {String|Object|Array} trackId -> It can be a song identifier (or an array of them)
											or a song object (or an array of them)
	@param {Function} callback -> function to be called upon lookup completion. It gets two parameters:
									'err' if there has been an error and 'results' which can be a single
									song object if the user only requested one or an array otherwise.
*/
exports.lookup = function(trackId, callback) {
	"use strict";

	var tracks = (_.isArray(trackId)) ? trackId : [trackId];
	service.lookupTracks(tracks, function(err, results) {
		if (err) {
			callback(err);
		} else {
			if (results.length < 1) {
				callback(new Error("No extended info found."));
			} else if (results.length === 1) {
				callback(null, results[0]);
			} else {
				callback(null, results);
			}
		}
	});
};
