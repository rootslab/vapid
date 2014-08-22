/*
 * PUBSUB mix-ins.
 */

exports.commands = function ( encode, error ) {
    var Bolgia = require( 'bolgia' )
        , doString = Bolgia.doString
        , ooo = Bolgia.circles
        , ostr = ooo.str
        , oobj = ooo.obj
        , wmsg = function ( cmd ) {
            return '-ERR wrong number of arguments for \'' + cmd + '\' command\r\n';
        }
        , crlf = '\r\n'
        , byteLength = Buffer.byteLength
        ;

    return {

        pubsub : {

            channels : function ( cname, args, sock ) {
                var me = this
                    , alen = args.length
                    ;
            }

            , numsub : function ( cname, args, sock ) {
                var me = this
                    , alen = args.length
                    ;
            }

            , numpat : function ( cname, args, sock ) {
                var me = this
                    , alen = args.length
                    ;
            }

        }

        , publish : function ( cname, args, sock ) {
            var me = this
                , alen = args.length
                ;
            if ( ! alen ) return sock.write( wmsg( cname ) );
        }

        , psubscribe : function ( cname, args, sock ) {
            var me = this
                , alen = args.length
                ;
            if ( ! alen ) return sock.write( wmsg( cname ) );
        }

        , punsubscribe : function ( cname, args, sock ) {
            var me = this
                , alen = args.length
                ;
        }

        , subscribe : function ( cname, args, sock ) {
            var me = this
                , channels = me.pubsub.channels
                , schannels = null
                , alen = args.length
                , a = 0
                , chan = null
                , reply = null
                , cmd = cname[ 0 ]
                ;
            if ( ! alen ) return sock.write( wmsg( cname ) );
            // set pubsub property for socket if it doesn't exist
            if ( ! sock.pubsub ) sock.pubsub = { channels : [], patterns : [], active : 0 };
            schannels = sock.pubsub.channels;
            // scan arguments
            for ( ; a < alen; ++a ) {
                chan = String( args[ a ] );
                // avoid '' ?
                // if ( doString( chan ) !== ostr ) continue;
                // create or update pubsub channels with a new subscriber
                if ( channels[ chan ] && channels[ chan ].length ) {
                    // check if subscriber already exists
                    if ( ! ~ channels[ chan ].indexOf( sock.name ) ) {
                        channels[ chan ].push( sock.name );
                        schannels.push( chan );
                        ++sock.pubsub.active;
                    }
                } else {
                    // create new channel and add subscriber
                    channels[ chan ] = [ sock.name ];
                    // add also to socket.pubsub property
                    schannels.push( chan );
                    ++sock.pubsub.active;
                }
                reply = '*3\r\n$' + byteLength( cmd ) + crlf + cmd + crlf;
                reply += '$' + byteLength( chan ) + crlf + chan + crlf;
                reply += ':' + sock.pubsub.active + crlf;
                sock.write( reply );
            }
        }

        , unsubscribe : function ( cname, args, sock ) {
            var me = this
                , alen = args.length
                ;
            // no arguments, unsubscribe client from all channels
            if ( ! alen ) me.reset( { pubsub : true } );
            else {
                // TODO
                
            }
        }

    };

};