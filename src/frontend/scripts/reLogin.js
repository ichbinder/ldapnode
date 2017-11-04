import React from 'react';
import Button from 'material-ui/Button';
import TextField from 'material-ui/TextField';


export class Login extends React.Component {
  static get propTypes() {
    return {
      onToken: React.PropTypes.func.isRequired
    };
  }

  constructor( props ) {
    super( props );
    this.state = {
      pw: ''
    };
    this._handlePWChange = this._handlePWChange.bind( this );
    this._handleGetToken = this._handleGetToken.bind( this );
  }

  _handlePWChange( event ) {
    this.setState( {
      pw: event.target.value
    } );
  }

  _handleGetToken() {
    this.props.onToken( this.state );
  }

  render() {
    return (
      <div className="addUser">
        <h2>Bitte geben Sie den Zugangscode ein:</h2>
        <div className="form">
          <TextField
            id="zugangscode"
            label="Zugangscode"
            type="password"
            value={this.state.pw}
            margin="normal"
            onChange={this._handlePWChange}
            className="zugangscode"
          />
          <Button
            raised
            color="primary"
            onClick={this._handleGetToken}
            className="zugangscodeButton"
          >
            <h3>Senden</h3>
          </Button>
        </div>
      </div>
    );
  }

  // render() {
  //   return (
  //     <div className="addUser">
  //       <h4>Login:</h4>
  //       <form className="form" onSubmit={this._handleGetToken}>
  //         <input
  //           className="btn"
  //           type="password"
  //           value={this.state.pw}
  //           placeholder="Passwort"
  //           onChange={this._handlePWChange}
  //         />
  //         <p></p>
  //         <button type="submit">Senden</button>
  //       </form>
  //     </div>
  //   );
  // }
}
