const ldap = require( 'ldapjs' );

// ldap.Attribute.settings.guid_format = ldap.GUID_FORMAT_B;

// const client = ldap.createClient( {
//   url: 'ldaps://login-dc-01.login.htw-berlin.de',
//   timeout: 5000,
//   connectTimeout: 10000
// } );
const clientcm = ldap.createClient( {
  url: 'ldap://141.45.187.90:389',
  timeout: 5000,
  connectTimeout: 10000
} );


// const opts = {
//   filter: '(sn=hsdf)',
//   scope: 'sub',
//   attributes: ['dn', 'sn', 'cn']
// };

// try {
//   client.bind(
//     'CN=s0531600,OU=idmusers,DC=login,DC=htw-berlin,DC=de', 'Hallo_23',
//     ( connError ) => {
//       if ( connError ) {
//         console.log( connError.message );
//         client.unbind( ( bindError ) => {
//           if ( bindError ) {
//             console.log( bindError.message );
//           } else {
//             console.log( 'client disconnected' );
//           }
//         } );
//       } else {
//         console.log( 'connected' );
//         client.search(
//           'ou=idmusers,dc=login,dc=htw-berlin,dc=de',
//           opts,
//           ( errSearch, ldapResult ) => {
//             console.log( 'Searching.....' );
//             ldapResult.on( 'end', ( result ) => {
//               console.log( `entry end: ${result}` );
//             } );
//
//             ldapResult.on( 'searchEntry', ( entry ) => {
//               if ( entry.object ) {
//                 console.log( `entry cn: ${entry.dn}` );
//                 console.log( `entry IDName: ${entry.object.cn}` );
//                 console.log( `entry Uid: ${entry.object.uid}` );
//                 console.log( `entry Vorname: ${entry.object.givenName}` );
//                 console.log( `entry Nachname: ${entry.object.sn}` );
//                 console.log( `entry E-Mail: ${entry.object.mail}` );
//                 console.log( `entry employeeType: ${entry.object.employeeType}` );
//                 // console.log( `entry: ${JSON.stringify( entry.object )}` );
//               }
//               client.unbind( ( unbindErrorsearch ) => {
//                 if ( unbindErrorsearch ) {
//                   console.log( unbindErrorsearch.message );
//                 } else {
//                   console.log( 'client disconnected' );
//                 }
//               } );
//             } );
//             ldapResult.on( 'error', ( error ) => {
//               console.error( `error: ${error.message}` );
//               client.unbind( ( bindError ) => {
//                 if ( bindError ) {
//                   console.log( bindError.message );
//                 } else {
//                   console.log( 'client disconnected' );
//                 }
//               } );
//             } );
//           } );
//       }
//     } );
// } catch ( error ) {
//   console.log( error );
//   client.unbind( ( unbindError ) => {
//     if ( unbindError ) {
//       console.log( unbindError.message );
//     } else {
//       console.log( 'client disconnected' );
//     }
//   } );
// }

clientcm.bind( 'cn=admin,dc=htw-berlin,dc=de', 'ichbin23', ( err ) => {
  if ( err != null )
    console.log( `Error bind cm: ${err}` );
  else {
    const opts2 = {
      filter: '(sn=selmanagic)',
      scope: 'sub',
      //attributes: ['dn', 'sn', 'cn']
    };
    clientcm.search( 'o=cm,dc=htw-berlin,dc=de', opts2, ( errSearch, ldapResult ) => {
      if ( errSearch != null ) {
        console.log( `cm search error: ${errSearch}` );
        throw errSearch;
      }
      ldapResult.on( 'searchEntry', ( entry ) => {
        console.log( `entry: ${JSON.stringify( entry.object )}` );
      } );
      ldapResult.on( 'error', ( error ) => {
        console.log( `Error: ${error}` );
      } );
      ldapResult.on( 'end', ( result ) => {
        console.log( `cm entry end: ${result}` );
      } );
    } );
    clientcm.unbind( ( unbindErr ) => {
      if ( unbindErr != null ) {
        console.log( `cm unbin error: ${unbindErr}` );
        throw unbindErr;
      }
    } );
  }
} );


//   res.on('searchEntry', function(entry) {
//     console.log('entry: ' + JSON.stringify(entry.object));
//   });
//   res.on('searchReference', function(referral) {
//     console.log('referral: ' + referral.uris.join());
//   });
//   res.on('error', function(err) {
//     console.error('error: ' + err.message);
//   });
//   res.on('end', function(result) {
//     console.log('status: ' + result.status);
//   });
// });

// client.bind('cn=admin,dc=htw-berlin,dc=de', 'ichbin23', function(err) {
// 	console.log(err);

// 	client.unbind(function(err) {
//     	assert.ifError(err);
// 	});

// 	if (err) {
//     	console.log('Error');
//     } else {
//     	console.log('OK');
// 	}
// });
