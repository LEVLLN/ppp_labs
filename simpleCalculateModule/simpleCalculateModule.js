var albumsCount = null;
var audiosCount = null;
var photosCount = null;
var friendsCount = null;
var followersCount = null;
var mutualFriendsCount = null;
var credibility = null;
var COEFFICIENT = 3;


module.exports = {getCredibility: function (counters) {
    albumsCount = counters.albums;
    audiosCount = counters.audios;
    photosCount = counters.photos;
    friendsCount = counters.friends;
    followersCount = counters.followers;
    videosCount = counters.videos;

    result = parseInt(albumsCount+audiosCount+friendsCount+photosCount+followersCount+videosCount);
    return parseInt(result);
}
}