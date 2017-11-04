import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import expressJWT from 'express-jwt';
import rIndex from '../routes/rIndex';
import { getConf } from '../config';
import { setNewPW } from '../setWeeklyPW';
import schedule from 'node-schedule';

// import server from './server';

const config = getConf();
const app = express();

app.set( 'port', process.env.PORT || 8006 );

// laden den bodyParser
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );

app.use( expressJWT( { secret: config.loginSecret } )
  .unless( { path: [ '/',
                     '/login',
                     /^\/styles\/.*/,
                     /^\/scripts\/.*/,
                     /^\/images\/.*/,
                     '/favicon.ico',
                    '/ldapadmin'
                    ] } ) );

app.use( ( err, req, res, next ) => {
  if ( err.name === 'UnauthorizedError' ) {
    res.status( 401 ).send( 'invalid token...' );
  }
} );

// View engine
app.set( 'views', `${path.resolve( __dirname, '../views' )}` );
app.set( 'view engine', 'pug' );

// Lade die Statischen Datein in die Middleware
app.use( express.static( `${path.resolve( __dirname, '../../frontend' )}` ) );

// Meine eigenen Routes werden hier bekoant gemacht
app.use( '/', rIndex );

// Error Handling
app.use( ( req, res ) => {
  res.type( 'text/plain' );
  res.status( 404 );
  res.send( '404 - Not Found' );
} );

app.use( ( err, req, res ) => {
  console.error( err.stack );
  res.type( 'text/plain' );
  res.status( 500 );
  res.send( '500 - Internal error' );
} );

app.listen( app.get( 'port' ), () => {
  console.log( `Express ready on localhost:${app.get( 'port' )}` );
} );

const rule = new schedule.RecurrenceRule();
rule.dayOfWeek = 1;
rule.hour = 6;
rule.minute = 0;

schedule.scheduleJob( { hour: 6, minute: 1, dayOfWeek: 1 }, () => {
  setNewPW();
} );
