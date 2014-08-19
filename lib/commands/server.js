/*
 * SERVER mix-ins.
 */

exports.commands = function ( encode, error ) {

    return {

        bgrewriteaof : function () {
        }

        , bgsave : function () {
        }

        , client : {

            getname : function () {
            }

            , kill : function () {
            }

            , list : function () {
            }

            , pause : function () {
            }

            , setname : function () {
            }

        }

        // use COMMAND LIST instead of COMMAND 
        , command : {

            count : function () {
            }
            , getkeys : function () {
            }
            , info : function (  ) {
            }
            // custom, a placeholder for command
            , list : function () {
            }
        }

        , config : {

            get : function () {
            }

            , resetstat : function () {
            }

            , rewrite : function () {
            }

            , set : function () {
            }

        }

        , dbsize : function () {
        }

        , debug : {

            object : function () {
            }

            , segfault : function () {
            }

        }

        , flushall : function () {
        }

        , flushdb : function () {
        }

        , info : function () {
        }

        , lastsave : function () {
        }

        , monitor : function () {
        }

        , role : function () {
        }

        , save : function () {
        }

        , shutdown : function () {
        }

        , slaveof : function () {
        }

        , slowlog : {

            get : function () {
            }

            , len : function () {
            }

            , reset : function () {
            }

        }

        , sync : function () {
        }

        , time : function () {
        }

    };

};