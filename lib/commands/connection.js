/*
 * CONNECTION mix-ins.
 */

exports.commands = function () {
    var wmsg = function ( cmd ) {
            return '-ERR wrong number of arguments for \'' + cmd + '\' command\r\n';
        }
        , crlf = '\r\n'
        ;
    return {

        auth : function ( cname, args, sock ) {
            var me = this
                , secret = me.options.secret
                ;
            if ( args.length > 1 ) return sock.write( wmsg( cname ) );
            if ( ! secret ) return sock.write( '-ERR Client sent AUTH, but no password is set\r\n' );
            if ( me.options.secret === args[ 0 ] && ( sock.auth = 1 ) ) return sock.write( '+OK\r\n' );
            return sock.write( '-ERR invalid password\r\n' );
        }

        , echo : function ( cname, args, sock ) {
            var me = this
                ;
            if ( args.length > 1 ) return sock.write( wmsg( cname ) );
            return sock.write( args[ 0 ] );
        }

        , ping : function ( cname, args, sock ) {
            var me = this
                , alen = args.length
                , msg = null
                , reply = null
                ;
            if ( alen > 1 ) return sock.write( wmsg( cname ) );
            if ( alen === 1 ) {
                msg = args[ 0 ];
                reply = '$' + Buffer.byteLength( msg ) + crlf + msg + crlf;
                return sock.write( ( sock.pubsub ? '*2\r\n$4\r\nPONG\r\n' : '' ) + reply );
            }
            return sock.write( '+PONG\r\n' );
        }

        , quit : function ( cname, args, sock ) {
            var me = this
                ;
            // end socket connection
            return sock.end( '+OK\r\n' );
        }

        , select : function ( cname, args, sock ) {
            var me = this
                , maxdb = me.options.maxdb
                ;
            if ( args.length > 1 ) return sock.write( wmsg( cname ) );
            if ( args[ 0 ] > maxdb ) return sock.write( '-ERR invalid DB index\r\n' );
            return sock.write( '+OK\r\n' );
        }

    };


};