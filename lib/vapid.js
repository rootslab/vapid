/*
 * Vapid, a vacuous Redis implementation for connection tests,
 * with a fully functional PubSub system for multiple clients.
 *
 * Copyright(c) 2014 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.version = require( '../package' ).version;
exports.Vapid = ( function () {
    var log = console.log
        , net = require( 'net' )
        , util = require( 'util' )
        , Bolgia = require( 'bolgia' )
        , Train = require( 'train' )
        , Gerry = require( 'gerry' )
        , VapidParser = require( './parser/vapid_parser' ).VapidParser
        , mixins = require( './commands/' )
        , isArray = Array.isArray
        , inspect = util.inspect
        , clone = Bolgia.clone
        , improve = Bolgia.improve
        , doString = Bolgia.doString
        , ooo = Bolgia.circles
        , oobj = ooo.obj
        , iopt = {
            showHidden : false
            , depth : 3
            , colors : true
            , customInspect : true 
        }
        , format = function ( ename, args ) {
            switch ( ename ) {
                case 'listening':
                    return inspect( args, iopt );
                case 'connection':
                    return inspect( args[ 0 ].name, iopt );
                case 'close':
                    return inspect( args, iopt );
                case 'error':
                    return inspect( args, iopt );
                case 'disconnection':
                    return inspect( args, iopt );
                case 'crashed' :
                    return inspect( args[ 0 ], iopt );
                default:
                    return inspect( args, iopt );
            }
        }
        , setEnv = function ( obj, scope ) {
            var hash = doString( obj ) === oobj ? obj : null
                , env = scope ? scope : null
                , h = null
                , fn = function ( f ) {
                    return function () {
                        f.apply( env, arguments );
                    };
                }
                ;
            if ( ! hash ) return false;
            for ( h in hash ) {
                if ( doString( hash[ h ] ) === oobj ) {
                    setEnv( hash[ h ], env );
                    continue;
                }
                hash[ h ] = fn( hash[ h ] );
            }
        }
        , resetSubscriptions = function ( sock, pubsub ) {
            var pchannels = pubsub.channels
                , ppatterns = pubsub.patterns
                , schannels = sock.pubsub.channels
                , spatterns = sock.pubsub.patterns
                , sactive = sock.pubsub.active
                , sclen = schannels.length
                , splen = spatterns.length
                , offset = -1
                , s = 0
                , tot = 0
                , cname = null
                , pname = null
                , channel = null
                , pattern = null
                ;
            if ( ! sactive ) return;
            for ( ; s < sclen; ++s ) {
                cname = schannels[ s ];
                channel = pchannels[ cname ];
                // check if channel exists
                if ( ! channel ) continue;
                // remove from pubsub
                offset = channel.indexOf( sock.name );
                if ( ~ offset ) {
                    channel.splice( offset, 1 );
                    // delete array property if it is empty
                    if ( ! channel.length ) delete pchannels[ cname ];
                    ++tot;
                }
            }
            for ( s = 0; s < splen; ++s ) {
                pname = spatterns[ s ];
                pattern = ppatterns[ pname ];
                // check if pattern exists
                if ( ! pattern ) continue;
                // remove from pubsub
                offset = pattern.indexOf( sock.name );
                if ( ~ offset ) {
                    pattern.splice( offset, 1 );
                    // delete array property if it is empty
                    if ( ! pattern.length ) delete ppatterns[ pname ];
                    ++tot;
                }
            }
            return tot;
        }
        // Vapid events
        , events = [
            'listening'
            , 'close'
            , 'error'
            , 'connection'
            // custom
            , 'disconnection'
            , 'crashed'
        ]
        // vapid default opt
        , vapid_opt = {
            secret : 'secret'
            , maxdb : 16
        }
        , Vapid = function ( opt ) {
            var me = this
                , is = me instanceof Vapid
                ;
            if ( ! is ) return new Vapid( opt );

            var cfg = improve( clone( opt ), vapid_opt )
                , onConnection = function ( sock ) {
                    var me = this
                        , clients = me.clients
                        , cqueues = me.cqueues
                        , parsers = me.parsers
                        , vp = null
                        , onParserMatch = function ( e, d, reveal ) {
                            var cmd = d[ 0 ].toLowerCase()
                                , sub = null
                                , ocmd = me.commands[ cmd ]
                                , osub = null
                                , s = 0
                                , spubsub = sock.pubsub
                                ;
                            if ( ! ocmd ) return sock.write( '-ERR unknown command \'' + cmd + '\'\r\n' );
                            if ( sock.auth === 0 && cmd !== 'auth' )
                                return sock.write( '-NOAUTH Authentication required.\r\n' );
                            while ( s < d.length - 1 ) {
                                // sub commands
                                if ( typeof ocmd === 'object' ) {
                                    sub = d[ ++s ].toLowerCase();
                                    osub = ocmd[ sub ];
                                    if ( osub ) ocmd = osub;
                                    else break;
                                } else break;
                            }
                            if ( me.silent || sock.silent ) return;
                            // check if socket is in pubsub mode,, restrict commands
                            if ( spubsub && spubsub.active ) {
                                switch ( cmd ) {
                                    case 'subscribe':
                                    case 'psubscribe':
                                    case 'unsubscribe':
                                    case 'punsubscribe':
                                    case 'ping':
                                    case 'quit':
                                        ocmd( d.slice( 0, s + 1 ), d.slice( s + 1 ), sock );
                                    break;
                                    default:
                                        sock.write( '-ERR only (P)SUBSCRIBE / (P)UNSUBSCRIBE / PING / QUIT allowed in this context\r\n' );
                                    break;
                                }
                            } else ocmd( d.slice( 0, s + 1 ), d.slice( s + 1 ), sock );
                        }
                        , onParserError = function ( err ) {
                            me.emit( 'error', err );
                        }
                        // socket
                        , onSocketReadable = function () {
                            var data = sock.read()
                                ;
                            if ( data ) parsers[ sock.name ].parse( data );
                        }
                        , onSocketEnd = function () {
                            removeSocket( sock.name );
                            me.emit( 'disconnection', sock.name );
                        }
                        , onSocketError = function ( err ) {
                            sock.destroy();
                            // reset all client subscriptions
                            removeSocket( sock.name );
                            me.emit( 'error', err );
                        }
                        , removeSocket = function ( sname ) {
                            if ( sock.pubsub ) resetSubscriptions( sock, me.pubsub );
                            // remove client from list when it leaves
                            delete clients[ sname ];
                            cqueues[ sname ].flush();
                            delete cqueues[ sname ];
                            parsers[ sname ].reset();
                            delete parsers[ sname ];
                        }
                        ;

                    // set the socket name as id
                    sock.name = sock.remoteAddress + ":" + sock.remotePort;
                    // socket auth, 0 = need auth, -1 no auth, 1 auth ok
                    sock.auth = me.options.secret ? 0 : -1;

                    // collect socket, command queue and parser
                    clients[ sock.name ] = sock;
                    cqueues[ sock.name ] = Train();
                    parsers[ sock.name ] = vp = VapidParser( { return_buffers : false } );
                    // add listeners for parser
                    vp.on( 'match', onParserMatch );
                    vp.on( 'error', onParserError );
                    // add listeners for socket
                    sock.on( 'readable', onSocketReadable );
                    sock.on( 'end', onSocketEnd );
                    sock.on( 'error', onSocketError );
                }
                ;

            // call the net.Server / super constructor
            me.constructor.super_.call( me, {} );

            me.options = cfg;

            me.on( 'connection', onConnection );

            me.clients = {};
            me.cqueues = {};
            me.parsers = {};

            setEnv( mixins, me );
            me.commands = mixins;

            // set logger
            me.logger = Gerry( me, events );

            // mute switch for server 
            me.silent = 0;

            // pubsub property to collect subscribers
            me.pubsub = {
                channels : {}
                , patterns : {}
            };

        }
        , mproto = null
        ;

    util.inherits( Vapid, net.Server );

    mproto = Vapid.prototype;

    mproto.cli = function ( enable, fn, collect ) {
         var me = this
            , mfn = enable === undefined || enable === null ? 'enable' : !! enable ? 'enable' : 'disable'
            , lfn = typeof lfn === 'function' ? lfn : function ( ename, args ) {
                log( 'Vapid!%s %s', ename, format( ename, args || [] ) );
            }
            ;
        me.logger[ mfn ]( collect, lfn );
        return me;
    };

    mproto.send = function ( data, id_list ) {
         var me = this
            , clients = me.clients
            , list = isArray( id_list ) ? id_list : []
            , llen = list.length
            , l = 0
            , sock = null
            , sent = 0
            ;
        if ( llen ) {
             for ( ; l < llen; ++l ) {
                sock = clients[ list[ l ] ];
                if ( sock && ++sent ) sock.write( data );
            }
            return sent;
        }
        for ( l in clients ) {
            sock = clients[ l ];
            if ( sock && ++sent ) sock.write( data );
        }
        return sent;
    };

    mproto.crash = function () {
        var me = this
            , clients = me.clients
            , cqueues = me.cqueues
            , parsers = me.parsers
            , sock = null
            , sname = null
            , s = 0
            , c = null
            ;
        for ( c in clients ) {
            sock = clients[ c ];
            sname = sock.name;
            if ( ! sock ) continue;
            // trash connection
            sock.destroy();
            // remove client from list when it leaves
            delete clients[ sname ];
            cqueues[ sname ].flush();
            delete cqueues[ sname ];
            parsers[ sname ].reset();
            delete parsers[ sname ];
            // reset pubsub properties
            me.pubsub.channels = {};
            me.pubsub.patterns = {};
            // reset silent property
            me.silent = false;
            ++s;
        }
        me.once( 'close', me.emit.bind( me, 'crashed', s ) );
        me.close();
        return s;
    };

    mproto.mute = function ( silent, sock_list ) {
        var me = this
            , shh = silent === undefined ? 1 : + silent % 2
            , slist = isArray( sock_list ) ? sock_list : []
            , slen = slist.length
            , clients = me.clients
            , sock = null
            , s = null
            , m = 0
            ;
        // mute sockets
        if ( ! slen ) return me.silent = shh;
        for ( s in slist )
            if ( slist[ s ] ) ( sock = clients[ slist[ s ] ] ) & ( sock.silent = shh ) & ++m;
        return m;
    };

    mproto.reset = function ( sname, opt ) {
        var me = this
            , cfg = improve( { pubsub : true }, opt )
            , sock = me.clients[ sname ]
            ;
        if ( ! sock ) return 0;
        if ( cfg.pubsub ) return resetSubscriptions( sname, me.pubsub );
    };


    return Vapid;

} )();