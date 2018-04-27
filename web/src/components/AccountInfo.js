import React, { Component } from 'react';

class AccountInfo extends Component {

  render() {

    const { style, data } = this.props

    var keys = Object.keys(data || {});
    keys.sort();

    return (
      <div className="span-3" style={style}>
      <h1 style={{marginBottom:20, textAlign:'center'}}>ACCOUNT INFO</h1>
        <div className="table-wrapper">
          <table className="alt">
            <tbody>
              {keys.map(k => <tr key={k}><td>{k}</td><td>{data[k]}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default AccountInfo;
