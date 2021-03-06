var log = console.log
    , Vapid = require( '../' )
    , Spade = require( 'spade' )
    , vapid = Vapid( {
        secret : 'secret'
        , maxdb : 16
    } )
    , client = Spade( {
        security : {
            '127.0.0.1:6380' : {
                requirepass : 'secret'
                , db : 1
            }
        }
        , socket : {
            address : {
                port : 6380
            }
            , reconnection : {
                trials : 0
            }
        }
    } )
    ;

vapid.cli();
client.cli();

vapid.listen( 6380, function () {
    setTimeout( function () {
        client.disconnect( function () {
            vapid.close();
        } );
    }, 2000 );
} );

client.connect();