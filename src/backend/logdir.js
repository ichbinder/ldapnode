import mkdirp from 'mkdirp';


exports.checkLogDir = () => {
  return new Promise( ( resolve, reject ) => {
    mkdirp( './logs', ( err ) => {
      if ( err ) {
        console.error( err );
        reject( err );
      } else {
        console.log( 'Log Ordner wurde erstellt.' );
        resolve( true );
      }
    } );
  } );
};
