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
        }
    } )
    ;
vapid.cli();
client.cli();

vapid.on( 'crashed', client.disconnect.bind( client ) );

vapid.listen( 6380, function () {
    setTimeout( function () {
        vapid.crash();
    }, 2000 );
} );

client.connect();