import ssha from 'ssha';
import ldap from 'ldapjs';
import simplelog from 'simple-node-logger';
import mail from './mail';
import LDAPConnecter from './LDAPConnecter';
import { getConf } from './config';
import { lmhash, nthash } from './lib/smbhash';
import logdir from './logdir';

const config = getConf();
let errLog = null;
let infoLog = null;

logdir.checkLogDir()
  .then( () => {
    errLog = simplelog.createLogManager( config.errLogOpts ).createLogger();
    infoLog = simplelog.createLogManager( config.infoLogOpts ).createLogger();
  } );

exports.getLDAPCMConnector = ( ( ) =>
  LDAPConnecter.create( config.cmLdapOptions )
  .catch( conerror => {
    const error = {
      message: `Es gab ein Problem mit dem Creative Media LDAP Server,
                ${config.errorMessage}`,
      error: conerror
    };
    throw error;
  } )
);

function searchAttr( filter, attri, connector ) {
  const searchOpts = {
    filter: `(${filter})`,
    scope: 'sub',
    // attributes: ['dn', 'sn', 'cn', 'uidNumber', 'gidNumber']
    attributes: [ attri ]
  };
  // HIER MUSS WEITER PROGRAMMIERT WERDEN!!!
  return connector.search( searchOpts )
    .then( ( results =>
      new Promise( ( resolve, reject ) => {
        if ( results.length === 0 ) {
          reject( { message: 'Es gab ein Problem mit der Datenbank.',
                    error: 'Es gibt kein sambaDomainName Objekt in der LDAP DB.' } );
        } else {
          resolve( results[0] );
        }
      } )
    ) )
    .catch( searchError => {
      const error = {
        message: 'Es gab ein Problem mit der Datenbank.',
        error: `Die Suchanfrage ist kaput: ${searchError}`
      };
      throw error;
    } );
}

function getSearchResults( uniConnector, cmConnector, searchOpts ) {
  const uniSearch = uniConnector.search( searchOpts );
  const cmSearch = cmConnector.search( searchOpts );

  return Promise.all( [uniSearch, cmSearch] )
    .then( ( [ uniResult, cmResult ] ) => ( {
      uniResult,
      cmResult
    } ) )
    .catch( resultsErrors => {
      const error = {
        message: `Es gab einen Fehler bei der Suche nach deiner Person
                  in den Datenbanken, ${config.errorMessage}`,
        error: resultsErrors
      };
      throw error;
    } );
}

function getMaxNumber( base, attribut, connector ) {
  const attributeSearch = {
    filter: `(${attribut}=*)`,
    scope: 'sub',
    attributes: [ attribut ]
  };
  const oldBase = connector.getBase();
  connector.setBase( base );
  return connector.search( attributeSearch )
    .then( ( searchResult =>
      new Promise( ( resolve, reject ) => {
        connector.setBase( oldBase );
        let maxUidNumber = null;
        for ( const item of searchResult ) {
          if ( parseInt( item[attribut], 10 ) > maxUidNumber )
            maxUidNumber = parseInt( item[attribut], 10 );
        }
        if ( maxUidNumber || maxUidNumber === 0 )
          resolve( maxUidNumber );
        else
          reject( `Es wurde keine Attribut ${attribut} gefunden oder
                  das Attribut ist nicht numerisch.` );
      } )
    ) )
    .catch( searchMaxNumErr => {
      const error = {
        message: `Es gab ein Probelem bei der maxNumber suche nach folgendem Attribut ${attribut}
                  ${config.errorMessage}`,
        error: searchMaxNumErr
      };
      throw error;
    } );
}

exports.checkUserPW = ( user ) => {
  const connOpts = {
    URI: config.uniLdapOptions.URI,
    DN: `CN=${user.uid},OU=idmusers,DC=login,DC=htw-berlin,DC=de`,
    secret: user.pw,
    base: config.uniLdapOptions.base
  };
  return LDAPConnecter.create( connOpts )
  .catch( connError => {
    const error = {
      message: 'Benutzername oder Passwort sind falsch. Bitte versuchen Sie es erneut.',
      error: connError
    };
    throw error;
  } );
};

function pwReset( pw, userDN, connector ) {
  let change = new ldap.Change( {
    operation: 'replace',
    modification: {
      userpassword: ssha.create( pw )
    }
  } );
  return connector.modify( userDN, change )
    .then( () => {
      change = new ldap.Change( {
        operation: 'replace',
        modification: {
          sambalmpassword: lmhash( pw )
        }
      } );
      return connector.modify( userDN, change );
    } )
    .then( () => {
      change = new ldap.Change( {
        operation: 'replace',
        modification: {
          sambantpassword: nthash( pw )
        }
      } );
      return connector.modify( userDN, change );
    } );
}

exports.searchUserUniCM = ( user, connectors ) => {
  const userSearch = {
    filter: `(uid=${user.uid})`,
    scope: 'sub',
    // attributes: ['dn', 'sn', 'cn', 'uidNumber', 'gidNumber']
    attributes: [ '*' ]
  };
  return getSearchResults( connectors.uni, connectors.cm, userSearch )
    .then( ( results =>
      new Promise( ( resolve, reject ) => {
        if ( results.uniResult.length === 0 ) {
          reject( { message: `Sie wurden nicht in der Uni Datenbank gefunden,
                  ${config.errorMessage}` } );
        } else if ( results.cmResult.length > 0 ) {
          if ( ssha.verify( user.pw, results.cmResult[0].userPassword ) ) {
            reject( { message: `Sie existieren schon in der Datenbank von Creative Media,
                    ${config.errorMessage}` } );
          } else {
            resolve( { searchResult: results, pwreset: true } );
          }
        } else {
          resolve( { searchResult: results, pwreset: false } );
        }
      } )
    ) );
};

const createGroup = ( ( groupName, connector ) =>
  getMaxNumber( config.cmBases.groups, 'gidNumber', connector )
    .then( resolveMaxGid => {
      const groupParam = {
        cn: groupName,
        gidNumber: resolveMaxGid + 1,
        objectClass: [ 'top', 'posixGroup' ]
      };
      const groupDN = `cn=${groupName},${config.cmBases.groups}`;
      return connector.add( groupDN, groupParam )
        .then( () => resolveMaxGid + 1 );
    } )
    .catch( createGroupError => {
      const error = {
        message: `Ihr Gruppe konnte nicht agelegt werden, ${config.errorMessage}`,
        error: createGroupError
      };
      throw error;
    } )
);

// exports.createPerson = ( userUni, connector, pw, gid ) => {
  // const attributeSearch = {
  //   filter: `(cn=${userUni.uid})`,
  //   scope: 'sub',
  //   attributes: [ 'gidNumber' ]
  // };
  // const findGroupId = connector.search( attributeSearch );
function createPerson( userUni, connector, pw, gid ) {
  let userParam = null;
  return getMaxNumber( config.cmBases.people, 'uidNumber', connector )
    .then( maxNumPeopleResult => {
      userParam = {
        uid: userUni.uid,
        uidNumber: maxNumPeopleResult + 1,
        gidNumber: gid,
        cn: userUni.cn,
        sn: userUni.sn,
        givenName: userUni.givenName,
        mail: userUni.mail,
        employeeType: userUni.employeeType,
        objectClass: [ 'top', 'person', 'organizationalPerson',
                        'posixAccount', 'inetOrgPerson', 'sambaSamAccount' ],
        loginShell: '/bin/bash',
        homeDirectory: `/home/${userUni.uid}`,
        userPassword: ssha.create( pw ),
        sambaLMPassword: lmhash( pw ),
        sambaNTPassword: nthash( pw ),
        sambaAcctFlags: '[U]',
        sambaPwdLastSet: 2147483647,
        gecos: userUni.gecos,
        carLicense: 'gitlab'
      };
    } )
    .then( () => searchAttr( 'objectClass=sambaUnixIdPool', 'sambaSID', connector ) )
    .then( searchResult => {
      userParam.sambaSID = `${searchResult.sambaSID}-${userParam.uidNumber}`;
      const userDN = `cn=${userUni.uid},${config.cmBases.people}`;
      return connector.add( userDN, userParam )
        .catch( createPersonError => {
          const error = {
            message: `Ihr Benutzer existiert schon in der Creative Media Datenbak,
                      ${config.errorMessage}`,
            error: createPersonError
          };
          throw error;
        } );
    } );
}

exports.createUserOrRenewPW = ( searchResult, data, user ) => {
  if ( ! searchResult.pwreset ) {
    return createGroup( searchResult.searchResult.uniResult[0].uid, data.cmLdapConnector )
      .then( gid => createPerson( searchResult.searchResult.uniResult[0],
                                            data.cmLdapConnector, user.pw, gid ) )
      .then( () => {
        mail.send( user.mail,
                  'CM Konto wurde erstellt',
                  `Hallo ${user.givenName} ${user.lastname},<br><br>
                  ${config.mailUserText.newaccount}<br><br>
                  <h4>Ihr Benutzername lautet: ${user.uid}</h4>` )
          .then( msgMail => {
            infoLog.info( 'Die Mail an den User wurde gesendet.', msgMail );
            console.log( 'MailUser:', msgMail );
          } )
          .catch( errorMail => {
            errLog.error( 'Die Mail an den User wurde NICHT gesendet.', errorMail );
            console.error( 'MailUser:', errorMail );
          } );
        return 'Ihr Benutzerkonto wurde erfolgreich in der Datenbank von Creative Media angelegt. Sie erhalten zeitnah Zugriff auf die vereinbarten Services.';
      } );
  }
  return pwReset( user.pw, searchResult.searchResult.cmResult[0].dn, data.cmLdapConnector )
    .then( () => {
      mail.send( user.mail, 'Passwort wurde geändert', `
                Hallo ${user.givenName} ${user.lastname},<br><br>
                ${config.mailUserText.pwreset}` )
        .then( msgMail => {
          infoLog.info( 'Die Mail an den User wurde gesendet.', msgMail );
          console.log( 'MailUser:', msgMail );
        } )
        .catch( errorMail => {
          errLog.error( 'Die Mail an den User wurde NICHT gesendet.', errorMail );
          console.error( 'MailUser:', errorMail );
        } );
      return 'Ihr Password wurde geändert.';
    } )
    .catch( changeError => {
      const error = { message: `Das Password konnte nicht geändert werden,
                                ${config.errorMessage}
                                Error: ${changeError}`,
                      error: changeError
                    };
      throw error;
    } );
};
