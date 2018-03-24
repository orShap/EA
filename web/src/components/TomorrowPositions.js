import React, { Component } from 'react';
import * as Icons from 'react-icons/lib/md'

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
    Object.values(data || {}).forEach(e => {
      if (e.direction == 1)
        up.push(e);
      else
        down.push(e);
    })

    this.setState({up, down});
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
      </div>
    );
  }
}

export default TomorrowPositions;
