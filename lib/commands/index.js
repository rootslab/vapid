/*
 * Exports all files containing commands mixins.
 */

module.exports = ( function () {
    var util = require( 'util' )
        , Bolgia = require( 'bolgia' )
        , mix = Bolgia.mix
        , slice = Array.prototype.slice
        , files = [
            'connection'
        ]
        , f = 0
        , flen = files.length
        , file = files[ 0 ]
        // object to store commands mix-ins
        , commands = {}
        ;
    for ( ; f < flen; file = files[ ++f ] ) mix( commands, require( './' + file ).commands() );
    return commands;

} )();