import React from 'react';
import 'whatwg-fetch';
import { InfoBox } from './reInfoBox';
import { UserAdd } from './reUserAdd';
import { Login } from './reLogin';

// const SERVER_URL = 'http://localhost:8006';
const SERVER_URL = 'https://ldap.cm.htw-berlin.de';


export class ReMain extends React.Component {
  constructor( props ) {
    super( props );
    this.state = { response: {} };
    this._handleUserAdd = this._handleUserAdd.bind( this );
    this._handleGetToken = this._handleGetToken.bind( this );
  }

  _handleUserAdd( newUser ) {
    if ( this.state.response.token ) {
      let resStr = `uid=${encodeURIComponent( newUser.username )}`;
      resStr += `&password=${encodeURIComponent( newUser.pw )}`;
      const tokenTmp = this.state.response.token;
      fetch( `${SERVER_URL}/checkuser`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.state.response.token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: resStr
      } )
      .then( responsee => responsee.json() )
      .then( jsonRes => {
        this.setState( { response: {
          message: jsonRes.message,
          error: jsonRes.error,
          token: tokenTmp
        } } );
      } )
      .catch( error => {
        const errRes = {
          message: 'Es gabe einen Server Fehler bitte kontaktieren sie CM.',
          error: true
        };
        this.setState( { response: errRes } );
        console.log( 'ERROR: ', error );
      } );
    } else {
      const errRes = {
        message: 'Du bist nicht angemeldet, bitte lade die Seite neu.',
        error: true
      };
      this.setState( { response: errRes } );
    }
  }

  _handleGetToken( newTokenPW ) {
    fetch( `${SERVER_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `pw=${encodeURIComponent( newTokenPW.pw )}`
    } )
    .then( responsee => responsee.json() )
    .then( jsonRes => {
      this.setState( { response: jsonRes } );
    } )
    .catch( error => {
      const errRes = {
        message: 'Es gabe einen Server Fehler bitte kontaktieren sie CM.',
        error: true
      };
      this.setState( { response: errRes } );
      console.log( 'ERROR: ', error );
    } );
  }

  render() {
    let msgInfo = '';
    let colorInfo = '';
    let login = false;
    if ( this.state.response.message && this.state.response.message !== 'Der Login war erfolgreich.' ) {
      if ( this.state.response.error ) {
        msgInfo = `Es gab einen Fehler: ${this.state.response.message}`;
        colorInfo = '#d55c46';
      } else {
        msgInfo = `Info: ${this.state.response.message}`;
        colorInfo = '#69af08';
      }
    }

    console.log( 'login: ', this.state.response.token );
    console.log( 'response: ', this.state.response );
    if ( this.state.response.token )
      login = true;
    return (
      <div className="content">
        <div className="head">
          <h1>CM Anmeldeformular</h1>
        </div>
        {
          login
          ? <UserAdd onUserAdd={this._handleUserAdd} />
          : <Login onToken={this._handleGetToken} />
        }
        {
          colorInfo
          ? <InfoBox color={colorInfo} msg={msgInfo} />
          : null
        }
      </div>
    );
  }
}
