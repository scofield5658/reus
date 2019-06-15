#!/usr/bin/env node
require( "babel-register" )
require('babel-polyfill')
require( "babel-core" )
	.transform( "code", {
		presets: [ [ require( 'babel-preset-latest-node' ), {
			target: 'current'
		} ] ]
	} )
require( './src/command' )
