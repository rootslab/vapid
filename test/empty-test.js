exports.test= function () {
    var log = console.log
        , Vapid = require( '../' )
        , vapid = Vapid( {
            secret : 'secret'
            , maxdb : 16
        } )
        ;
};