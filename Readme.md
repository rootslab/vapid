### Vapid

[![CODECLIMATE](http://img.shields.io/codeclimate/github/rootslab/vapid.svg?style=flat)](https://codeclimate.com/github/rootslab/vapid)
[![CODECLIMATE-TEST-COVERAGE](http://img.shields.io/codeclimate/coverage/github/rootslab/vapid.svg?style=flat)](https://codeclimate.com/github/rootslab/vapid)

[![LICENSE](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/rootslab/vapid#mit-license)
[![GITTIP](http://img.shields.io/gittip/rootslab.svg?style=flat)](https://www.gittip.com/rootslab/)
[![NPM DOWNLOADS](http://img.shields.io/npm/dm/vapid.svg?style=flat)](http://npm-stat.com/charts.html?package=vapid)

[![NPM VERSION](http://img.shields.io/npm/v/vapid.svg?style=flat)](https://www.npmjs.org/package/vapid)
[![TRAVIS CI BUILD](http://img.shields.io/travis/rootslab/vapid.svg?style=flat)](http://travis-ci.org/rootslab/vapid)
[![BUILD STATUS](http://img.shields.io/david/rootslab/vapid.svg?style=flat)](https://david-dm.org/rootslab/vapid)
[![DEVDEPENDENCY STATUS](http://img.shields.io/david/dev/rootslab/vapid.svg?style=flat)](https://david-dm.org/rootslab/vapid#info=devDependencies)

[![NPM GRAPH1](https://nodei.co/npm-dl/vapid.png)](https://nodei.co/npm/vapid/)

[![NPM GRAPH2](https://nodei.co/npm/vapid.png?downloads=true&stars=true)](https://nodei.co/npm/vapid/)

> __Vapid__, a vacuous Redis implementation for connection tests.

###Install

```bash
$ npm install vapid [-g]
```

> __install and update devDependencies__:

```bash
 $ cd vapid/
 $ npm install --dev
 # update
 $ npm update --dev
```

> __require__:

```javascript
var Vapid  = require( 'vapid' );
```

###Run Tests

```bash
$ cd vapid/
$ npm test
```

###Constructor

```javascript
Vapid( [ Object opt ] )
// or
new Vapid( [ Object opt ] )
```

####Options

> Default options are listed.

```javascript
{
    secret : 'secret'
    , maxdb : 16
}
```

###Properties

> All properties from net.Server module are inherited : 'connections', 'maxConnections', ..

```javascript
 /*
  * A property that holds the initial config object.
  */
 Vapid.options : Object

 /*
  * Hash of connected clients/sockets.
  */
 Vapid.clients : Object

 /*
  * Command Queues for connected clients, every queue is an instance of Train.
  */
 Vapid.cqueues : Object

 /*
  * Parsers for connected clients.
  */
 Vapid.parsers : Object

 /*
  * An object containing implemented Redis commands.
  * For now, only the 5 connection commands are implemented.
  */
 Vapid.commands : Object

 /*
  *
  */
 Vapid.logger : Gerry

```

###Methods

> Arguments within [ ] are optional.

> All methods from net.Server module are inherited : 'listen', 'address', ..

```javascript
/*
 * Enable logging to console.
 */
Vapid#cli : function ( [ Boolean enable [, Function logger [, Boolean collect_events ] ] ] ) : undefined

/*
 * Send data to all connected clients ( optionally you can specify a reduced list ).
 */
Vapid#send : function ( Buffer data | String data [, Array client_id_list ] ) : Number

/*
 * Server voluntarily crashed after calling Vapid#crash. All socket connections
 * will be destroyed and the server will be closed.
 */
Vapid#crash : function () : Number
```

###Events

> All the events from net.Server module are inherited: 'listening', 'connection'. 'close', 'error', ..

> Vapid custom events:

```javascript
/*
 * A client has disconnected
 */
 'disconnection' : function ( String client_id )

 /*
  * Emitted when server crashes, it happens after the 'close' events.
  * See also Vapid#crash.
  */
 'crashed' : function ( Number trashed )
```

### MIT License

> Copyright (c) 2014 &lt; Guglielmo Ferri : 44gatti@gmail.com &gt;

> Permission is hereby granted, free of charge, to any person obtaining
> a copy of this software and associated documentation files (the
> 'Software'), to deal in the Software without restriction, including
> without limitation the rights to use, copy, modify, merge, publish,
> distribute, sublicense, and/or sell copies of the Software, and to
> permit persons to whom the Software is furnished to do so, subject to
> the following conditions:

> __The above copyright notice and this permission notice shall be
> included in all copies or substantial portions of the Software.__

> THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
> EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
> MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
> IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
> CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
> TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
> SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[![GA](https://ga-beacon.appspot.com/UA-53998692-1/syllabus/Readme?pixel)](https://github.com/igrigorik/ga-beacon)