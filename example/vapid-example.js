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

vapid.listen( 6380 )

client.connect();

// client.commands.config.get( 'ciao' )
//client.commands.ping()
// client.commands.auth( 'secret' )
//client.commands.ping()
//client.commands.quit()

