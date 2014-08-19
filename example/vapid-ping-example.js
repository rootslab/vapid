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

    client.connect();

    client.commands.ping();
    client.commands.ping( 'hey ema' );

    setTimeout( function () {

        client.disconnect( function () {
            vapid.close();
        } );

    }, 1000 );

} );
