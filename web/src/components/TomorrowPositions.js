import React, { Component } from 'react';
import * as Icons from 'react-icons/lib/md'
import * as copy from 'copy-to-clipboard';

class TomorrowPositions extends Component {

  constructor(props) {
    super(props);
    this.makeList = this.makeList.bind(this)
    this.state = {}
  }

  componentWillMount () {
    const { data } = this.props;
    this.makeList(data);
  }

  componentWillReceiveProps(nextProps) {
    const { data } = nextProps;
    this.makeList(data);
  }

  makeList(data) {
    var down = []
    var up = []
    var clipboard = "";
    Object.values(data || {}).forEach(e => {
      if (e.direction === 1)
        up.push(e);
      else
        down.push(e);
    })

    down.forEach(e => clipboard + (e.symbol + ","))
    clipboard += '\n';
    up.forEach(e => clipboard + (e.symbol + ","))
    this.setState({up, down, clipboard});
  }

  render() {
    const {up, down} = this.state
    const {style} = this.props
    return (
      <div style={style}>
        <h1 style={{marginBottom:20}}>TOMORROW POSITIONS</h1>
        <div style={{display:'flex', flex:1 }}>
          <div style={{display:'flex', flexDirection:'column', flex: 1, marginRight:20}}>
            <div style={{display:'flex', flexDirection:'row', alignItems: 'center' }}> 
              
              <h2 style={{paddingRight: 5}}>LONGS</h2>
              <Icons.MdTrendingUp style={{fontSize:72}}/>

            </div>
            { up.map(e => <div key={e.symbol} style={{display:'flex', flexDirection:'row'}}><div className="icon far fa-circle"/><div style={{paddingLeft: 5}}>{Math.round(e.investmentRatio * 100) + "%    - " + e.symbol}</div></div>) }
          </div>
          <div style={{display:'flex', flexDirection:'column', flex: 1, marginRight:20}}>
            <div style={{display:'flex', flexDirection:'row', alignItems: 'center' }}>
              
              <h2 style={{paddingRight: 5}}>SHORTS</h2>
              <Icons.MdTrendingDown style={{fontSize:72}}/>
              
            </div>
            { down.map(e => <div key={e.symbol} style={{display:'flex', flexDirection:'row'}}><div className="icon far fa-circle"/><div style={{paddingLeft: 5}}>{Math.round(e.investmentRatio * 100) + "%    - " + e.symbol}</div></div>) }
          </div>
        </div>
        <button onClick={() =>{ alert("Sheres has been copied"); copy(this.state.clipboard);}}>
          Copy To Clipboard
        </button>
      </div>
    );
  }
}

export default TomorrowPositions;
