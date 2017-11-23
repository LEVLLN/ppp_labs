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
   

    mutualFriendsCount = counters.mutual_friends;
    result = 0;
    resultString = '';


    if (albumsCount != 0 || photosCount != 0) {
        if (albumsCount >= photosCount){ parseInt(result += albumsCount / (photosCount + 1)); }
        else { 
            result += parseInt(photosCount / (albumsCount + 1));
          }

    } 
    if (audiosCount != 0){
        audiosCount *= COEFFICIENT;
        result += parseInt(audiosCount);
    }

    if (videosCount != 0){
        videosCount *= COEFFICIENT;
        result += parseInt(videosCount);
    }

    if (friendsCount>=followersCount){
        followersCount /= COEFFICIENT;
        result += parseInt(followersCount + friendsCount);
    }
    else {
        friendsCount /= COEFFICIENT;
        result += parseInt(followersCount + friendsCount);
    }
    if (mutualFriendsCount!=0){

        result += parseInt(mutualFriendsCount * COEFFICIENT);
    }

    return parseInt(result);
}
}