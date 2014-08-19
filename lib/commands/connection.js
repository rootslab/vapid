/*
 * CONNECTION mix-ins.
 */

exports.commands = function () {
    var wmsg = function ( cmd ) {
            return '-ERR wrong number of arguments for \'' + cmd + '\' command\r\n';
        }
        ;
    return {
        auth : function ( cname, args, sock ) {
            var me = this
                , secret = me.options.secret
                ;
            if ( args.length > 1 ) return sock.write( wmsg( cname ) );
            if ( ! secret ) return sock.write( '-ERR Client sent AUTH, but no password is set\r\n' );
            if ( me.options.secret === args[ 0 ] && ( sock.auth = 1 ) ) return sock.write( '+OK\r\n' );
            sock.write( '-ERR invalid password\r\n' );
        }

        , echo : function ( cname, args, sock ) {
            var me = this
                ;
            if ( args.length > 1 ) return sock.write( wmsg( cname ) );
            sock.write( args[ 0 ] );
        }

        , ping : function ( cname, args, sock ) {
            var me = this
                ;
            if ( args.length > 1 ) return sock.write( wmsg( cname ) );
            return sock.write( '+PONG\r\n' );
        }

        , quit : function ( cname, args, sock ) {
            var me = this
                ;
            // end socket connection
            sock.end( '+OK\r\n' );
        }

        , select : function ( cname, args, sock ) {
            var me = this
                , maxdb = me.options.maxdb
                ;
            if ( args.length > 1 ) return sock.write( wmsg( cname ) );
            if ( args[ 0 ] > maxdb ) return sock.write( '-ERR invalid DB index\r\n' );
            sock.write( '+OK\r\n' );
        }

    };


};