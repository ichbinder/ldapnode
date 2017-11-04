import React from 'react';
import Button from 'material-ui/Button';
import TextField from 'material-ui/TextField';

export class UserAdd extends React.Component {
  static get propTypes() {
    return {
      onUserAdd: React.PropTypes.func.isRequired
    };
  }

  constructor( props ) {
    super( props );
    this.state = {
      username: '',
      pw: ''
    };

    this._handleUsernameChange = this._handleUsernameChange.bind( this );
    this._handlePWChange = this._handlePWChange.bind( this );
    this._handleUserAdd = this._handleUserAdd.bind( this );
  }

  _handleUsernameChange( event ) {
    this.setState( {
      username: event.target.value
    } );
  }

  _handlePWChange( event ) {
    this.setState( {
      pw: event.target.value
    } );
  }

  _handleUserAdd() {
    this.props.onUserAdd( this.state );
    // this.state.username = '';
    this.state.pw = '';
    this.setState( this.state );
  }

  render() {
    return (
      <div className="addUser">
        <h2>Geben Sie bitte Ihre HTW Zugangsdaten ein:</h2>
        <div className="form-adduser">
          <div className="adduser-input">
            <TextField
              id="zugangscode"
              label="Benutzername"
              type="text"
              value={this.state.username}
              margin="normal"
              onChange={this._handleUsernameChange}
              className="userPass-input"
            />
            <TextField
              id="zugangscode"
              label="Passwort"
              type="password"
              value={this.state.pw}
              margin="normal"
              onChange={this._handlePWChange}
              className="userPass-input"
            />
          </div>
          <Button
            raised
            color="primary"
            onClick={this._handleUserAdd}
            className="zugangscodeButton"
          >
            <h3>Senden</h3>
          </Button>
        </div>
      </div>
    );
  }
}
