/*
 * Exports all files containing commands mixins.
 */

module.exports = ( function () {
    var Bolgia = require( 'bolgia' )
        , mix = Bolgia.mix
        , files = [
            'pubsub'
            , 'server'
            , 'connection'
        ]
        , f = 0
        , flen = files.length
        , file = files[ 0 ]
        // object to store commands mix-ins
        , commands = {}
        ;
    for ( ; f < flen; file = files[ ++f ] )
        mix( commands, require( './' + file ).commands() );
    return commands;

} )();