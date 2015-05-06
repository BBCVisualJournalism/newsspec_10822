var fs = require('fs');
var jf = require('jsonfile');
var util = require('util');
var basePath = './inputdata/';
var outPath = './source/js/data/';
var jsonRegexp = /\.json$/;

module.exports = function (grunt) {

    grunt.registerTask('data', 'Parse input json from /inputdata/ to source/js/data/mapData.js', function () {
        
        var files = fs.readdirSync(basePath);
        var outputJsonObj = {};

        /*
         * The following parties are the list of parties that we want to appear in the data
         * You can add or remove parties from here if you like
         * Con, Lab, Lib Dem, SNP, Grn, PC
        */
        var filteredPartyIdsLookup = {
            "CON":      1,
            "LAB":      1,
            "LD":       1,
            "GRN":      1,
            "SNP":      1,
            "PC":       1,
            "UKIP":     1
        };

        if (!files.length) {
            grunt.fail.warn("ERROR: Couldn't find any files in ./inputdata/. Please check that the json file is in there");
        }
        
        /*
         * ignore any dot files that might be in the input directory
         * ignore any file that doesn't have a .json file extension
        */
        var c = files.length - 1;
        for (c = files.length - 1; c >= 0; c--) {
            var filenameFirstChar = files[c].substr(0, 1);
            if (filenameFirstChar == ".") {
                files.splice(c, 1);
            }
            if (files[c].indexOf(".json") < 0 && files[c].indexOf(".JSON") < 0) {
                files.splice(c, 1);
            }
        }

        if (files.length > 1) {
            grunt.fail.warn("ERROR: There's more than one file in the ./inputdata/ directory. Please make sure that the only file in there is the input data source that you want this task to run off.");
        }

        files.forEach(function (file, i, files) {
            
            /*
             * Parse the json file into an array
            */
            var inputjsonArr = JSON.parse(fs.readFileSync(basePath + file, 'utf8'));

            /*
             * loop through the parsed array
            */
            var a, arrLength = inputjsonArr.length;
            for (a = 0; a < arrLength; a++) {


                /*
                 * The array is a list of objects with the following properties:
                 *      constituency : Object
                 *          region : Object
                 *              name : String
                 *              shortName : String
                 *              altName : String
                 *              gssId : String
                 *          partyCodeLast : String
                 *          electorate : uint
                 *      newPartyCode : String
                 *      resultBanner : String
                 *      majorityNow : int
                 *      majorityPctNow : int
                 *      turnout : Object
                 *          count : uint
                 *          percentage : uint
                 *          percentageChange : uint
                 *      results : Array of objects
                 *          {
                 *              candidate : Object
                 *                  candidateId : Object
                 *                  party : Object
                 *                      code : String
                 *                      name : String
                 *                      shortName : String
                 *                      altName : String
                 *                      altCode : String
                 *              votesNow : uint
                 *              shareNow : uint
                 *              shareChange : uint
                 *          }
                */
                var constituencyObj = inputjsonArr[a];
                if (validateConstituencyObj(constituencyObj)) {
                    var constituencyId = constituencyObj.constituency.region.gssId,
                    partiesArr = constituencyObj.results;

                    outputJsonObj[constituencyId] = {};
                    var outputConstituencyObj = outputJsonObj[constituencyId];

                    outputConstituencyObj.winningCode = constituencyObj.newPartyCode;
                    outputConstituencyObj.bannerMessage = constituencyObj.resultBanner;
                    outputConstituencyObj.parties = {};

                    var b, partiesArrLength = partiesArr.length;
                    for (b = 0; b < partiesArrLength; b++) {
                        var partyCode = partiesArr[b].candidate.party.code;

                        /*
                         * check for the speakers seat (he's a Tory but doesn't show up as one in the results)
                         * The speakers party code will show up as "SPE" ... change it to "CON"
                        */
                        if (partyCode == "SPE") {
                            partyCode = "CON";
                        }

                        if (filteredPartyIdsLookup[partyCode]) {
                            outputConstituencyObj.parties[partyCode] = {};

                            outputParty = outputConstituencyObj.parties[partyCode];
                            
                            outputParty.shareNow = partiesArr[b].shareNow;
                            outputParty.shareChange = partiesArr[b].shareChange;
                        }
                    }
                }
                else {
                    console.log("WARNING!: One of the constituencies was not recognised from the input json. index:", a);
                }

            }

        });

        function validateConstituencyObj(obj) {
            if (!obj) {
                return false;
            }
            if (!obj.constituency || !obj.results) {
                return false;
            }
            if (!obj.results.length) {
                return false;
            }
            return true;
        }

        //Write out the output json
        var outputStr = "define(" + JSON.stringify(outputJsonObj) + ");";
        fs.writeFileSync(outPath + "mapData.js", outputStr, {encoding:'utf8'});
        console.log("data task complete, data saved in: " + outPath + "mapData.js");

    });
};
