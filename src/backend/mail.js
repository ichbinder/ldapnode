import nodemailer from 'nodemailer';
import { getConf } from './config';
import simplelog from 'simple-node-logger';

const config = getConf();

exports.send = ( to, subjectToSend, textToSend ) => {
  const transporter = nodemailer.createTransport( config.smtpConfig );
  const errLog = simplelog.createLogManager( config.errLogOpts ).createLogger();
// function mail( to, subjectToSend, textToSend ) {
  const mailOptions = {
    from: config.mailFrom, // sender address
    to: `${to}`, // list of receivers
    subject: subjectToSend, // Subject line
    html: textToSend, // plaintext body
  };
  return new Promise( ( resolve, reject ) => {
    transporter.sendMail( mailOptions, ( error, info ) => {
      if ( error ) {
        errLog.error( 'Mail Send Error', error );
        reject( error );
      } else
        resolve( `Message sent: , ${info.response}` );
    } );
  } );
};

// mail( 'ichbinder23@googlemail.com', 'Hallo', 'Wir Sind Toll!' )
//   .then( send => console.log( 'Send: ', send ) )
//   .catch( error => console.log( 'Error: ', error ) );
