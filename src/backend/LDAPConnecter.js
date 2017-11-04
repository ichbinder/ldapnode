import ldap from 'ldapjs';

export default class LDAPConnecter {
  constructor( parameters ) {
    this.DN = String( parameters.DN );
    this.secret = String( parameters.secret );
    this.base = String( parameters.base );
    try {
      this.client = ldap.createClient( {
        url: parameters.URI,
        timeout: 5000,
        connectTimeout: 10000,
        idleTimeout: 5000
      } );
    } catch ( err ) {
      console.log( 'ldap Connection Error: ', err );
    }
  }

  static create( parameters ) {
    let ldapConnecter = null;
    let connError = null;
    try {
      ldapConnecter = new LDAPConnecter( parameters );
    } catch ( error ) {
      connError = error;
    }
    return ldapConnecter.bind()
      .then( () => ldapConnecter )
      .catch( bindError => {
        const error = {
          error: bindError, connError
        };
        throw error;
      } );
  }

  bind( ) {
    return new Promise( ( resolve, reject ) => {
      this.client.bind( this.DN, this.secret, ( connError ) => {
        if ( connError )
          reject( connError );
        else
          resolve( null );
      } );
    } );
  }

  unbind( ) {
    return new Promise( ( resolve, reject ) => {
      this.client.unbind( ( bindError ) => {
        if ( bindError )
          reject( bindError );
        else
          resolve( null );
      } );
    } );
  }

  search( searchOpt ) {
    const result = [];
    return new Promise( ( resolve, reject ) => {
      this.client.search( this.base, searchOpt, ( errSearch, ldapResult ) => {
        if ( errSearch ) {
          reject( errSearch );
        } else {
          ldapResult.on( 'searchEntry', ( entry ) => {
            if ( entry.object ) {
              result.push( entry.object );
            }
          } );
          ldapResult.on( 'error', reject );
          ldapResult.on( 'end', () => resolve( result ) );
        }
      } );
    } );
  }

  add( DN, toAddEntry ) {
    return new Promise( ( resolve, reject ) => {
      this.client.add( DN, toAddEntry, ( addError ) => {
        if ( addError )
          reject( addError );
        else
          resolve( DN );
      } );
    } );
  }

  del( DN ) {
    return new Promise( ( resolve, reject ) => {
      this.client.del( DN, ( delError ) => {
        if ( delError )
          reject( delError );
        else
          resolve( DN );
      } );
    } );
  }

  modify( DN, changes ) {
    return new Promise( ( resolve, reject ) => {
      this.client.modify( DN, changes, ( changesError ) => {
        if ( changesError )
          reject( changesError );
        else
          resolve( DN );
      } );
    } );
  }

  move( targetDN, destinationDN ) {
    return new Promise( ( resolve, reject ) => {
      this.client.modifyDN( targetDN, destinationDN, ( moveError ) => {
        if ( moveError )
          reject( moveError );
        else
          resolve( destinationDN );
      } );
    } );
  }

  getBase() {
    return this.base;
  }

  setBase( base ) {
    this.base = base;
  }
}
