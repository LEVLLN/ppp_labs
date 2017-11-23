"use strict";

let wf4node = require("workflow-4-node");
let WorkflowHost = wf4node.hosting.WorkflowHost;
let MemoryPersistence = wf4node.hosting.MemoryPersistence;
let Bluebird = require("bluebird");
let _ = require("lodash");
let ActivityExecutionEngine = require("workflow-4-node/lib/es6/activities/activityExecutionEngine.js")
let albumsCount = null;
let audiosCount = null;
let photosCount = null;
let friendsCount = null;
let followersCount = null;
let mutualFriendsCount = null;
let COEFFICIENT = 3;
let result = 0;
let resultString = '';
let s = 0;
let credibility = 0;

    module.exports = {
    getCredibility: async function (counters) {
// Run:
        let engine = new ActivityExecutionEngine({
            "@workflow": {
                a: "Wor",
                b: "rld",
                albumsCount: counters.albums,
                audiosCount: counters.audios,
                photosCount: counters.photos,
                friendsCount: counters.friends,
                followersCount: counters.followers,
                videosCount: counters.videos,
                mutualFriendsCount: counters.mutual_friends,
                result: 0,

                args: [{
                    "@if": {
                        condition: "= this.albumsCount != 0 || this.photosCount != 0 ",
                        then: {
                            "@func": {
                                code: function () {
                                    if (this.albumsCount >= this.photosCount) {
                                        parseInt(this.result += this.albumsCount / (this.photosCount + 1));
                                    }
                                    else {
                                        this.result += parseInt(this.photosCount / (this.albumsCount + 1));
                                    }

                                }
                            }
                        }
                    }
                }]
            }
        });


      credibility = await engine.invoke()
            .then(function (result) {
               return result;

            });
        return  credibility;


    }
};

