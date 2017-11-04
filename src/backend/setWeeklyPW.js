import yaml from 'js-yaml';
import simplelog from 'simple-node-logger';
import path from 'path';
import fs from 'fs';
import pwg from 'generate-password';
import { getConf } from './config';
import mail from './mail';

const config = getConf();
const errLog = simplelog.createLogManager( config.errLogOpts ).createLogger();
const infoLog = simplelog.createLogManager( config.infoLogOpts ).createLogger();

export function setNewPW() {
  let configYaml = null;
  const configPath = path.join( __dirname, 'config.yaml' );
  configYaml = yaml.safeLoad( fs.readFileSync( configPath, 'utf8' ) );
  configYaml.loginPW = pwg.generate( {
    length: 8,
    numbers: true,
    uppercase: true,
    symbols: true
  } );
  console.log( 'PW:', configYaml.loginPW );
  mail.send( config.mailTo, 'PW Reset CMLOGIN', `Das neue PW: ${configYaml.loginPW}` )
    .then( msg => {
      infoLog.info( 'Login Passwort wurde zurück gesetzt.', msg );
      fs.writeFileSync( configPath, yaml.safeDump( configYaml ) );
    } )
    .catch( errorMail => {
      errLog.error(
        'Es gab ein Fahler bei der erstellung eines neuem Login Passworts. ErrorMsg: ',
        errorMail
      );
    } );

  infoLog.info( 'Login Passwort wurde zurück gesetzt.', configYaml.loginPW );

//  fs.writeFileSync( configPath, yaml.safeDump( configYaml ) );

//  mail.send( 'jakob.warnow@gmx.de', 'PW Reset CMLOGIN', 'test' );
//  console.log( 'PW:', configYaml.loginPW );

  // try {
  //   const configPath = path.join( __dirname, 'config.yaml' );
  //   configYaml = yaml.safeLoad( fs.readFileSync( configPath, 'utf8' ) );
  //
  //   configYaml.loginPW = pwg.generate( {
  //     length: 8,
  //     numbers: true,
  //     uppercase: true,
  //     symbols: true
  //   } );
  //   console.log( 'PW:', configYaml.loginPW );
  //   fs.writeFileSync( configPath, yaml.safeDump( configYaml ) );
  //   mail.send( config.newPWMail, 'PW Reset CMLOGIN', `Das neue PW: ${configYaml.loginPW}` );
  //     // .then( msg => {
  //     //   infoLog.info( 'Login Passwort wurde zurück gesetzt.', msg );
  //     // } )
  //     // .catch( errorMail => { throw ( errorMail ); } );
  // } catch ( e ) {
  //   errLog.error(
  //     'Es gab ein Fahler bei der erstellung eines neuem Login Passworts. ErrorMsg: ', e
  //   );
  // }
}
