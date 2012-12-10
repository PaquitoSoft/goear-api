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
exports.search_original = function(searchTerm, options, callback) {
	"use strict";

	var defaultOptions = {
		extendedInfo: false,
		offset: 1,
		resultsCount: 10,
		minQuality: 128
	};

	if (typeof options === 'function') {
		callback = options;
		options = defaultOptions;
	} else {
		options = _.extend(defaultOptions, options) || defaultOptions;
	}

	// We begin looking for the first results
	service.searchTracks(searchTerm, options.offset, function(err, data) {

		if (err) {
			callback(err);
		} else if (data.totalCount === 0) {
			callback(null, data);
		} else {

			// Service always returns results in groups of 10 tracks
			
			// Filter by quality
			data.tracks = filterTracks(data.tracks, options.minQuality);
			
			// Check if we have enough results
			if (options.resultsCount > data.tracks.length) {
				// util.log("There are no enough tracks in first query. We need to get " + (options.resultsCount - data.tracks.length) + " more tracks.");

				// Get more tracks to satisfy client request
				// We need to calculate the maximun request we can make
				var maxRequests = data.totalCount / 10; // Service always returns results in groups of 10 tracks
				var counter = options.offset + 1;
				async.until(
					function() {
						return (options.resultsCount <= data.tracks.length) || counter > maxRequests;
					},
					function(innerCallback) {
						service.searchTracks(searchTerm, counter++, function(err, innerData) {
							data.tracks = data.tracks.concat(filterTracks(innerData.tracks, options.minQuality));
							// util.log("New tracks quantity: " + data.tracks.length);
							innerCallback();
						});
					},
					function(innerErr) {
						// util.log("Now we have all requestes tracks...");
						if (innerErr) {
							callback(innerErr);
						} else {

							// Maybe we got more tracks than requested
							if (data.tracks.length > options.resultsCount) {
								data.tracks.splice(options.resultsCount);
							}
							
							// Check for results info requested
							if (options.extendedInfo) {
								service.lookupTracks(data.tracks, function(error, tracks) {
									data.tracks = tracks;
									callback(error, data);
								});
							} else {
								callback(null, data);
							}
						}
					}
				);

			} else {

				if (options.extendedInfo) {
					service.lookupTracks(data.tracks, function(error, tracks) {
						data.tracks = tracks;
						callback(error, data);
					});
				} else {
					callback(null, data);
				}
			}

		}


	});

};


exports.search = function(searchTerm, options, callback) {
	"use strict";

	var defaultOptions = {
		extendedInfo: false,
		offset: 1,
		resultsCount: 10,
		minQuality: 128
	};

	if (typeof options === 'function') {
		callback = options;
		options = defaultOptions;
	} else {
		options = _.extend(defaultOptions, options) || defaultOptions;
	}

	// We issue a first request to test if there are any result and
	// to get the total number
	service.searchTracks(searchTerm, 1, function(err, data) {

		if (err) {
			callback(err);
		} else {

			if (data.totalCount < 1) {
				callback(null, data);
			} else {


				// How many tracks do we need to satisfy client's needs
				var requestedTracksCount = options.offset * options.resultsCount, // limit requests
					totalCount = -1,
					tracks = filterTracks(data.tracks, options.minQuality),
					counter = 2;

				async.until(
					function() {
						return tracks.length >= requestedTracksCount;
					},
					function(innerCallback) {
						service.searchTracks(searchTerm, counter++, function(err, innerData) {
							totalCount = innerData.totalCount;
							tracks = tracks.concat(filterTracks(innerData.tracks, options.minQuality));
							// util.log("New tracks quantity: " + data.tracks.length);
							innerCallback(err);
						});
					},
					function(innerErr) {
						if (innerErr) {
							callback(innerErr);
						} else {
							// Now we have all needed tracks to compose client response

							// Get the tracks we're looking for
							tracks = tracks.slice((options.offset - 1) * options.resultsCount, requestedTracksCount);


							// Check for results info requested
							if (options.extendedInfo) {
								service.lookupTracks(tracks, function(error, completedTracks) {
									callback(error, {
										totalCount: totalCount,
										tracks: completedTracks
									});
								});
							} else {
								callback(null, {
									totalCount: totalCount,
									tracks: tracks
								});
							}
						}
					}
				);

			}

		}

	});


};
