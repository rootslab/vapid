/*
 * PUBSUB mix-ins.
 */

exports.commands = function () {

    var keys = Object.keys
        , Bolgia = require( 'bolgia' )
        , minimatch = require( 'minimatch' )
        , doString = Bolgia.doString
        , ooo = Bolgia.circles
        , ostr = ooo.str
        , oobj = ooo.obj
        , wmsg = function ( cmd ) {
            return '-ERR wrong number of arguments for \'' + cmd + '\' command\r\n';
        }
        , umsg = function ( cmd ) {
            return '-ERR Unknown PUBSUB subcommand or wrong number of arguments for \'' + cmd + '\'\r\n'
        }
        , crlf = '\r\n'
        , byteLength = Buffer.byteLength
        ;

    return {

        pubsub : {

            channels : function ( command, args, sock ) {
                var me = this
                    , channels = me.pubsub.channels
                    , alen = args.length
                    , cmd = command[ 1 ]
                    , chan = null
                    , a = 0
                    , cnames = null
                    , cname = null
                    , clen = 0
                    // placeholder for multibulk
                    , reply = [ '*0\r\n' ]
                    , r = 0
                    , regexp = null
                    ;
                if ( alen > 1 ) return sock.write( umsg( cmd ) );
                cnames = keys( channels );
                clen = cnames.length;
                if ( ! clen ) return sock.write( reply[ 0 ] );
                // get all channels
                if ( alen === 0 ) {
                    for ( ; a < clen; ++a ) {
                        cname = cnames[ a ];
                        chan = channels[ cname ];
                        if ( chan && chan.length ) reply.push( '$' + byteLength( cname ) + crlf + cname + crlf ) & ++r;
                    }
                    reply[ 0 ] = '*' + r + crlf;
                    return sock.write( reply.join( '' ) );
                }
                // match channels with pattern through minimatch
                try {
                    regexp = minimatch.makeRe( args[ 0 ] );
                } catch ( e ) {
                    regexp = new RegExp( args[ 0 ] );
                }
                for ( ; a < clen; ++a ) {
                    cname = cnames[ a ];
                    if ( ! regexp.test( cname ) ) continue;
                    chan = channels[ cname ];
                    if ( chan && chan.length ) reply.push( '$' + byteLength( cname ) + crlf + cname + crlf ) & ++r;
                }
                reply[ 0 ] = '*' + r + crlf;
                return sock.write( reply.join( '' ) );
            }

            , numsub : function ( command, args, sock ) {
                var me = this
                    , channels = me.pubsub.channels
                    , alen = args.length
                    , chan = null
                    , cname = null
                    , clen = 0
                    , a = 0
                    , estr = null
                    // placeholder for multibulk
                    , reply = [ '*0\r\n' ]
                    , r = 0
                    ;
                if ( ! alen ) return sock.write( reply[ 0 ] );
                for ( ; a < alen; ++a ) {
                    cname = args[ a ];
                    chan = channels[ cname ];
                    // push also non existent channels name (0 subscribers). like Redis does.
                    clen = chan ? chan.length : 0;
                    reply.push( '$' + byteLength( cname ) + crlf + cname + crlf + ':' + clen + crlf );
                    r += 2;
                }
                reply[ 0 ] = '*' + r + crlf;
                sock.write( reply.join( '' ) );
            }

            , numpat : function ( command, args, sock ) {
                var me = this
                    , alen = args.length
                    , cmd = command[ 0 ]
                    , clients = me.clients
                    , c = null
                    , pubsub = me.pubsub
                    , patterns = pubsub.patterns
                    , patt = null
                    , p = 0
                    , result = 0
                    ;
                if ( args.length ) return sock.write( umsg( cmd ) );
                for ( p in patterns ) {
                    patt = patterns[ p ];
                    result += patt ? patt.length : 0;
                }
                sock.write( ':' + result + crlf );
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
                , clen = 0
                , plen = 0
                , sname = null
                , ecmsg = '*3\r\n$7\r\nmessage\r\n'
                , epmsg = '*4\r\n$8\r\npmessage\r\n'
                , reply = null
                , r = 0
                ;
            if ( ( name === '' ) || ( msg === '' ) ) return sock.write( wmsg( cmd ) );
            if ( ( chan = channels[ name ] ) && ( clen = chan.length ) ) {
                reply = ecmsg + '$' + byteLength( name ) + crlf + name + crlf;
                reply += '$' + byteLength( msg ) + crlf + msg + crlf;
                for ( ; c < clen; ++c ) clients[ chan[ c ] ].write( reply ) & ++r;
            }
            for ( p in patterns ) {
                patt = patterns[ p ];
                if ( ! patt.regexp.test( name ) ) continue;
                reply = epmsg + '$' + byteLength( p ) + crlf + p + crlf;
                reply += '$' + byteLength( name ) + crlf + name + crlf;
                reply += '$' + byteLength( msg ) + crlf + msg + crlf;
                plen = patt.length;
                c = 0;
                for ( ; c < plen; ++c ) clients[ patt[ c ] ].write( reply ) & ++r;
            }
            sock.write( ':' + r + '\r\n' );
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

        , psubscribe : function ( command, args, sock ) {
            var me = this
                , patterns = me.pubsub.patterns
                , spatterns = null
                , alen = args.length
                , a = 0
                , patt = null
                , pname = null
                , reply = null
                // set lower case for command in message reply
                , cmd = command[ 0 ].toLowerCase()
                , csize = byteLength( cmd )
                , ecmd = '*3\r\n$' + csize + crlf + cmd + crlf
                ;
            if ( ! alen ) return sock.write( wmsg( command[ 0 ] ) );
            // set pubsub property for socket if it doesn't exist
            if ( ! sock.pubsub ) sock.pubsub = { channels : [], patterns : [], active : 0 };
            spatterns = sock.pubsub.patterns;
            // scan arguments
            for ( ; a < alen; ++a ) {
                pname = String( args[ a ] );
                patt = patterns[ pname ];
                // NOTE: avoid '' ?
                // if ( doString( pname ) !== ostr ) continue;
                // create or update pubsub channels with a new subscriber
                if ( patt && patt.length ) {
                    // check if subscriber already exists
                    if ( ! ~ patt.indexOf( sock.name ) ) {
                        patt.push( sock.name );
                        spatterns.push( pname );
                        ++sock.pubsub.active;
                    }
                } else {
                    // create new channel and add subscriber
                    patterns[ pname ] = [ sock.name ];
                    // set Regular Expression for this pattern
                    try {
                        patterns[ pname ].regexp = minimatch.makeRe( pname );
                    } catch ( e ) {
                        patterns[ pname ].regexp = new RegExp( pname );
                    }
                    // add also to socket.pubsub property
                    spatterns.push( pname );
                    ++sock.pubsub.active;
                }
                reply = ecmd;
                reply += '$' + byteLength( pname ) + crlf + pname + crlf;
                reply += ':' + sock.pubsub.active + crlf;
                sock.write( reply );
            }
        }

        /*
         * NOTE: (P)UNSUBSCRIBE returns always n messages when ( n = args.length ) > 0
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
                for ( ; a < schannels.length; ++a ) {
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
                        if ( ~ soffset ) schannels.splice( soffset, 1 ) & --a;
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
            for ( ; a < alen; ++a ) {
                cname = String( args[ a ] );
                chan = channels[ cname ];
                // NOTE: avoid '' ?
                // if ( doString( chan ) !== ostr ) continue;
                // check if chan exists
                if ( chan && chan.length ) {
                    offset = chan.indexOf( sock.name );
                    if ( ~ offset ) {
                        chan.splice( offset, 1 );
                        // delete array property if it is empty
                        if ( ! chan.length ) delete channels[ cname ];
                        soffset = schannels.indexOf( cname );
                        if ( ~ soffset ) schannels.splice( soffset, 1 ) & --a;
                        --sock.pubsub.active;
                    }
                }
                reply = ecmd;
                reply += '$' + byteLength( cname ) + crlf + cname + crlf;
                reply += ':' + sock.pubsub.active + crlf;
                sock.write( reply );
            }
        }

        , punsubscribe : function ( command, args, sock ) {
           var me = this
                , patterns = me.pubsub.patterns
                , alen = args.length
                , a = 0
                , patt = null
                , pname = null
                , offset = -1
                , soffset = -1
                , spatterns = null
                , sclen = 0
                , reply = null
                // set lower case for command in message reply
                , cmd = command[ 0 ].toLowerCase()
                , spubsub = sock.pubsub
                , csize = byteLength( cmd )
                , ecmd = '*3\r\n$' + csize + crlf + cmd + crlf
                , sactive = null
                ;
            if ( ! ( spubsub && spubsub.patterns.length ) ) {
                // client is not subscribed to any pattern
                if ( ! alen ) return sock.write( ecmd + '$-1\r\n:0\r\n' );
                // send alen messages
                for ( ; a < alen; ++a ) {
                    pname = String( args[ a ] );
                    reply = ecmd;
                    reply += '$' + byteLength( pname ) + crlf + pname + crlf;
                    reply += ':' + ( spubsub ? spubsub.active : 0 ) + crlf;
                    sock.write( reply );
                }
                return;
            }
            spatterns = spubsub.patterns;
            if ( ! alen ) {
                // no arguments, unsubscribe client from all patterns
                for ( ; a < spatterns.length; ++a ) {
                    // NOTE: spatterns length could change on every iteration
                    pname = spatterns[ a ];
                    patt = patterns[ pname ];
                    // check if pattern exists
                    if ( ! patt ) continue;
                    // remove from pubsub
                    offset = patt.indexOf( sock.name );
                    if ( ~ offset ) {
                        patt.splice( offset, 1 );
                        // delete array property if it is empty
                        if ( ! patt.length ) delete patterns[ pname ];
                        soffset = spatterns.indexOf( pname );
                        if ( ~ soffset ) spatterns.splice( soffset, 1 ) & --a;
                        --sock.pubsub.active;
                    }
                    reply = ecmd;
                    reply += '$' + byteLength( pname ) + crlf + pname + crlf;
                    reply += ':' + sock.pubsub.active + crlf;
                    sock.write( reply );
                }
                return;
            }
            // scan arguments
            for ( ; a < alen; ++a ) {
                pname = String( args[ a ] );
                patt = patterns[ pname ];
                // NOTE: avoid '' ?
                // if ( doString( patt ) !== ostr ) continue;
                // check if patt exists
                if ( patt && patt.length ) {
                    offset = patt.indexOf( sock.name );
                    if ( ~ offset ) {
                        patt.splice( offset, 1 );
                        // delete array property if it is empty
                        if ( ! patt.length ) delete patterns[ pname ];
                        soffset = spatterns.indexOf( pname );
                        if ( ~ soffset ) spatterns.splice( soffset, 1 );
                        --sock.pubsub.active;
                    }
                }
                reply = ecmd;
                reply += '$' + byteLength( pname ) + crlf + pname + crlf;
                reply += ':' + sock.pubsub.active + crlf;
                sock.write( reply );
            }
        }

    };

};