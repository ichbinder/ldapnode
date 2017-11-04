import express from 'express';
import simplelog from 'simple-node-logger';
import jwt from 'jsonwebtoken';
import controller from '../controller';
import mail from '../mail';
import { getConf } from '../config';
import logdir from '../logdir';

const config = getConf();
const router = new express.Router();

let errLog = null;
let infoLog = null;

logdir.checkLogDir()
  .then( () => {
    errLog = simplelog.createLogManager( config.errLogOpts ).createLogger();
    infoLog = simplelog.createLogManager( config.infoLogOpts ).createLogger();
  } );

router.post( '/checkuser', ( req, res ) => {
  const user = {
    uid: req.body.uid,
    pw: req.body.password,
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    mail: '',
    name: ''
  };
  if ( ! user.uid ) {
    res.json( {
      message: 'Bitte geben Sie einen Benutzernamen ein.',
      error: true
    } );
  } else if ( ! user.pw ) {
    res.json( {
      message: 'Bitte geben Sie das Password ein.',
      error: true
    } );
  } else {
    const data = {};

    controller.checkUserPW( user )
      .then( uniLdapConnector => { data.uniLdapConnector = uniLdapConnector; } )
      .then( () => controller.getLDAPCMConnector() )
      .then( cmLdapConnector => { data.cmLdapConnector = cmLdapConnector; } )
      .then( () => controller.searchUserUniCM( user, { uni: data.uniLdapConnector,
                                                       cm: data.cmLdapConnector } ) )
      .then( searchResult => {
        user.mail = searchResult.searchResult.uniResult[0].mail;
        user.givenName = searchResult.searchResult.uniResult[0].givenName;
        user.lastname = searchResult.searchResult.uniResult[0].sn;
        return controller.createUserOrRenewPW( searchResult, data, user );
      } )
      .then( messageFinish => {
        mail.send( config.mailTo,
        `CM Kontoerstellung: ${user.givenName} ${user.lastname} (${user.uid})`,
        `Ein Konto wurde erstellt oder ein PW wurde geändert.<br>
        Folgender Benutzer hat daten im LDAP gändert:<br><br>
        Name: ${user.givenName} ${user.lastname},<br>
        IP: ${user.ip},<br>
        uid: ${user.uid}<br>
        Message: ${messageFinish}` )
          .then( msgMail => {
            infoLog.info( 'Die System erstellungs Mail wurde gesendet.', msgMail );
            console.log( 'MailUser:', msgMail );
          } )
          .catch( errorMail => {
            errLog.error( 'Die System erstellungs Mail wurde NICHT gesendet.', errorMail );
            console.error( 'MailUser error:', errorMail );
          } );
        infoLog.info( `Name: ${user.givenName} ${user.lastname}, `,
                      `uid: ${user.uid}, IP: ${user.ip}, `,
                      `Message: ${messageFinish}` );
        res.json( {
          message: messageFinish,
          error: false
        } );
      } )
      .catch( error => {
        let msg = error.message.split( '\t' ).join( '' );
        msg = msg.split( '\n' ).join( '' );
        msg = msg.split( '\r' ).join( '' );
        msg = msg.split( '  ' ).join( '' );
        console.log( msg );
        errLog.error( `Name: ${user.givenName} ${user.lastname}, `,
                      `uid: ${user.uid}, IP: ${user.ip}, `,
                      `Error Message: ${msg}, `,
                      `Error: ${JSON.stringify( error.error )}` );
        res.json( {
          message: error.message,
          error: true
        } );
      } );
  }
} );

router.get( '/', ( req, res ) => {
  res.render( 'pIndex' );
} );

router.get( '/ldapadmin', ( req, res ) => {
  res.redirect( 'https://ldap.cm.htw-berlin.de:8010' );
} );

router.post( '/login', ( req, res ) => {
  if ( !req.body.pw ) {
    res.status( 400 ).json( {
      message: 'Bitte geben sie den Zugangscode ein.',
      error: true
    } );
  } else {
    if ( config.loginPW !== req.body.pw ) {
      res.status( 401 ).json( {
        message: 'Der Zugangscode war falsch.',
        error: true
      } );
    } else {
      const tokenJwt = jwt.sign( { pw: req.body.pw }, config.loginSecret );
      res.status( 200 ).json( {
        message: 'Der Login war erfolgreich.',
        error: false,
        token: tokenJwt
      } );
    }
  }
} );

module.exports = router;
