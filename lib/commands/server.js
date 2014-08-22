/*
 * SERVER mix-ins.
 */

exports.commands = function ( encode, error ) {
    var wmsg = function ( cmd ) {
            return '-ERR wrong number of arguments for \'' + cmd + '\' command\r\n';
        }
        , crlf = '\r\n'
        , byteLength = Buffer.byteLength
        ;
    return {

        debug : {
            segfault : function ( cname, args, sock ) {
                var me = this
                    ;
                me.crash();
            }
        }

        , time : function ( cname, args, sock ) {
            var me = this
                , alen = args.length
                , msg = null
                , reply = ''
                ;
            if ( alen ) return sock.write( wmsg( cname ) );
            // microtime is rounded to 000
            msg = ( String( Date.now() / 1000 ) + '000' ).split( '.' );
            reply += '*2\r\n' + '$' + byteLength( msg[ 0 ] ) + crlf + msg[ 0 ] + crlf;
            reply += '$' + byteLength( msg[ 1 ] ) + crlf + msg[ 1 ] + crlf;
            return sock.write( reply );
        }

    };

};