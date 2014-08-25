/*
 * CONNECTION mix-ins.
 */

exports.commands = function () {

    var wmsg = function ( cmd ) {
            return '-ERR wrong number of arguments for \'' + cmd + '\' command\r\n';
        }
        , crlf = '\r\n'
        , byteLength = Buffer.byteLength
        ;
    return {

        auth : function ( command, args, sock ) {
            var me = this
                , secret = me.options.secret
                , cname = command[ 0 ]
                ;
            if ( args.length > 1 ) return sock.write( wmsg( cname ) );
            if ( ! secret )
                return sock.write( '-ERR Client sent AUTH, but no password is set\r\n' );
            if ( me.options.secret === args[ 0 ] && ( sock.auth = 1 ) )
                return sock.write( '+OK\r\n' );
            return sock.write( '-ERR invalid password\r\n' );
        }

        , echo : function ( command, args, sock ) {
            var msg = String( args[ 0 ] )
                , alen = args.length
                , cname = command[ 0 ]
                ;
            if ( alen === 1 ) return sock.write( '$' + byteLength( msg ) + crlf + msg + crlf );
            return sock.write( wmsg( cname ) );
        }

        , ping : function ( command, args, sock ) {
            var alen = args.length
                , msg = null
                , reply = null
                , cname = command[ 0 ]
                ;
            if ( alen > 1 ) return sock.write( wmsg( cname ) );
            if ( alen === 1 ) {
                msg = String( args[ 0 ] );
                reply = '$' + byteLength( msg ) + crlf + msg + crlf;
                return sock.write( ( sock.pubsub ? '*2\r\n$4\r\nPONG\r\n' : '' ) + reply );
            }
            return sock.write( '+PONG\r\n' );
        }

        , quit : function ( command, args, sock ) {
            // end socket connection
            return sock.end( '+OK\r\n' );
        }

        , select : function ( command, args, sock ) {
            var me = this
                , maxdb = me.options.maxdb
                , cname = command[ 0 ]
                ;
            if ( args.length > 1 ) return sock.write( wmsg( cname ) );
            if ( args[ 0 ] > maxdb ) return sock.write( '-ERR invalid DB index\r\n' );
            return sock.write( '+OK\r\n' );
        }

    };


};