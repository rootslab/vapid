/*
 * PUBSUB mix-ins.
 */

exports.commands = function () {

    var keys = Object.keys
        , Bolgia = require( 'bolgia' )
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

            channels : function ( command, args, sock ) {
                var me = this
                    , alen = args.length
                    , cmd = command[ 0 ]
                    ;
            }

            , numsub : function ( command, args, sock ) {
                var me = this
                    , alen = args.length
                    , cmd = command[ 0 ]
                    ;
            }

            , numpat : function ( command, args, sock ) {
                var me = this
                    , alen = args.length
                    , cmd = command[ 0 ]
                    ;
            }

        }

        , publish : function ( command, args, sock ) {
            var me = this
                , clients = me.clients
                , pubsub = me.pubsub
                , channels = pubsub.channels
                , patterns = pubsub.patterns
                , alen = args.length
                , cmd = command[ 0 ]
                , name = String( args[ 0 ] )
                , msg = String( args[ 1 ] )
                , chan = null
                , patt = null
                , c = 0
                , p = 0
                , clen = 0
                , plen = 0
                , sname = null
                , ecmd = '*3\r\n$7\r\nmessage\r\n'
                , reply = null
                , r = 0
                ;
            if ( ( name === '' ) || ( msg === '' ) ) return sock.write( wmsg( cmd ) );
            if ( ( chan = channels[ name ] ) && ( clen = chan.length ) ) {
                reply = ecmd + '$' + byteLength( name ) + crlf + name + crlf;
                reply += '$' + byteLength( msg ) + crlf + msg + crlf;
                for ( ; c < clen; ++c ) clients[ chan[ c ] ].write( reply ) & ++r;
            }
            if ( ( patt = patterns[ name ] ) && ( plen = patt.length ) ) {
                for ( ; p < plen; ++p ) {

                }
            }
            sock.write( ':' + r + '\r\n' );
        }

        , psubscribe : function ( command, args, sock ) {
            var me = this
                , alen = args.length
                // set lower case for command in message reply
                , cmd = command[ 0 ].toLowerCase()
                ;
            if ( ! alen ) return sock.write( wmsg( command[ 0 ] ) );
        }

        , punsubscribe : function ( command, args, sock ) {
            var me = this
                , alen = args.length
                // set lower case for command in message reply
                , cmd = command[ 0 ].toLowerCase()
                ;
        }

        , subscribe : function ( command, args, sock ) {
            var me = this
                , channels = me.pubsub.channels
                , schannels = null
                , alen = args.length
                , a = 0
                , chan = null
                , cname = null
                , reply = null
                // set lower case for command in message reply
                , cmd = command[ 0 ].toLowerCase()
                , csize = byteLength( cmd )
                , ecmd = '*3\r\n$' + csize + crlf + cmd + crlf
                ;
            if ( ! alen ) return sock.write( wmsg( command[ 0 ] ) );
            // set pubsub property for socket if it doesn't exist
            if ( ! sock.pubsub ) sock.pubsub = { channels : [], patterns : [], active : 0 };
            schannels = sock.pubsub.channels;
            // scan arguments
            for ( ; a < alen; ++a ) {
                cname = String( args[ a ] );
                chan = channels[ cname ];
                // NOTE: avoid '' ?
                // if ( doString( cname ) !== ostr ) continue;
                // create or update pubsub channels with a new subscriber
                if ( chan && chan.length ) {
                    // check if subscriber already exists
                    if ( ! ~ chan.indexOf( sock.name ) ) {
                        chan.push( sock.name );
                        schannels.push( cname );
                        ++sock.pubsub.active;
                    }
                } else {
                    // create new channel and add subscriber
                    channels[ cname ] = [ sock.name ];
                    // add also to socket.pubsub property
                    schannels.push( cname );
                    ++sock.pubsub.active;
                }
                reply = ecmd;
                reply += '$' + byteLength( cname ) + crlf + cname + crlf;
                reply += ':' + sock.pubsub.active + crlf;
                sock.write( reply );
            }
        }
        /*
         * NOTE: UNSUBSCRIBE returns always n messages when ( n = args.length ) > 0
         */
        , unsubscribe : function ( command, args, sock ) {
            var me = this
                , channels = me.pubsub.channels
                , alen = args.length
                , a = 0
                , chan = null
                , cname = null
                , offset = -1
                , soffset = -1
                , schannels = null
                , sclen = 0
                , reply = null
                // set lower case for command in message reply
                , cmd = command[ 0 ].toLowerCase()
                , spubsub = sock.pubsub
                , csize = byteLength( cmd )
                , ecmd = '*3\r\n$' + csize + crlf + cmd + crlf
                , sactive = null
                ;
            if ( ! ( spubsub && spubsub.channels.length ) ) {
                // client is not subscribed to any channel
                if ( ! alen ) return sock.write( ecmd + '$-1\r\n:0\r\n' );
                // send alen messages
                for ( ; a < alen; ++a ) {
                    cname = String( args[ a ] );
                    reply = ecmd;
                    reply += '$' + byteLength( cname ) + crlf + cname + crlf;
                    reply += ':' + ( spubsub ? spubsub.active : 0 ) + crlf;
                    sock.write( reply );
                }
                return;
            }
            schannels = spubsub.channels;
            if ( ! alen ) {
                // no arguments, unsubscribe client from all channels
                for ( ; a < schannels.length; ) {
                    // NOTE: schannels length could change on every iteration
                    cname = schannels[ a ];
                    chan = channels[ cname ];
                    // check if channel exists
                    if ( ! chan ) continue;
                    // remove from pubsub
                    offset = chan.indexOf( sock.name );
                    if ( ~ offset ) {
                        chan.splice( offset, 1 );
                        // delete array property if it is empty
                        if ( ! chan.length ) delete channels[ cname ];
                        soffset = schannels.indexOf( cname );
                        if ( ~ soffset ) schannels.splice( soffset, 1 );
                        else ++a;
                        --sock.pubsub.active;
                    }
                    reply = ecmd;
                    reply += '$' + byteLength( cname ) + crlf + cname + crlf;
                    reply += ':' + sock.pubsub.active + crlf;
                    sock.write( reply );
                }
                return;
            }
            // scan arguments
            for ( ; a < alen; ) {
                cname = String( args[ a ] );
                chan = channels[ cname ];
                // NOTE: avoid '' ?
                // if ( doString( chan ) !== ostr ) continue;
                // check if chan exists
                if ( chan && chan.length ) {
                    offset = chan.indexOf( sock.name );
                    if ( ~ offset ) {
                        chan.splice( offset, 1 );
                        soffset = schannels.indexOf( cname );
                        if ( ~ soffset ) schannels.splice( soffset, 1 );
                        --sock.pubsub.active;
                    }
                }
                reply = ecmd;
                reply += '$' + byteLength( cname ) + crlf + cname + crlf;
                reply += ':' + sock.pubsub.active + crlf;
                sock.write( reply );
            }
            return;
        }

    };

};