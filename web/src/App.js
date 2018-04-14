import React, { Component } from 'react';
import LazyLoad from 'react-lazyload';
import LoadingIndicator from 'react-loading-indicator'
import AccountInfo from './components/AccountInfo';
import Balance from './components/Balance';
import Gallery from './components/Gallery';
import TomorrowPositions from './components/TomorrowPositions';

import './App.css';
import './assets/css/noscript.css'
import './assets/css/main.css'

const firebase      = require("firebase");
const moment        = require("moment-timezone");

firebase.initializeApp({
  apiKey:             "AIzaSyAPxVY9M579OhCfjHPTP834q7w4xPiLLns",
  authDomain:         "shapira-pro.firebaseapp.com",
  databaseURL:        "https://shapira-pro.firebaseio.com",
  projectId:          "shapira-pro",
  storageBucket:      "shapira-pro.appspot.com",
  messagingSenderId:  "813284272810"
});

class App extends Component {

  constructor(props) {
    super(props);

    this.simulateDate = this.simulateDate.bind(this)
    this.runSimulation = this.runSimulation.bind(this)
    this.simulate = this.simulate.bind(this)
    this.onFirebase = this.onFirebase.bind(this)
    this.handleDateChange = this.handleDateChange.bind(this);

    this.state = {
      data: [],
      simulationCounter: 0,
      startDate: "2017-04-01",
      startMoney: 50000,
      gallery : [],
      accountData : -999,
      changesInBalance : -999,
      accountBalanceHistory : -999,
      currentPositions : -999,
      todoActions : -999,
    }
  }

  componentDidMount() {
    firebase.database().ref('eaWebInfo/').on('value', this.onFirebase);
  }

  handleDateChange() {
    const { startDate, startMoney } = this.state;
  
    var start = new Date(startDate)
    var parsed = parseInt(startMoney);
    var ok = true;
    if (start == "Invalid Date") { ok = false; this.setState({startDate: "Invalid"}); }
    else if (startDate && startDate < "2017-04-01") { ok = false; this.setState({startDate: "Must be > 2017-04-01"}); }
    if (isNaN(parsed)) { ok = false; this.setState({startMoney: "Invalid"}); }
    else if (ok && this.state.accountBalanceHistory != -999 && this.state.changesInBalance != -999)
      this.runSimulation(this.state.accountBalanceHistory, this.state.changesInBalance, startDate, startMoney);
  }

  async onFirebase(snapshot) {
    var webInfo = snapshot.val();
    var accountData = webInfo.accountData;
    var changesInBalance = webInfo.changesInBalance;
    var accountBalanceHistory = webInfo.accountBalanceHistory;
    var currentPositions = webInfo.currentPositions;
    var todoActions = webInfo.todoActions;
    var gallery = webInfo.gallery;
    this.setState({accountData, changesInBalance, accountBalanceHistory, currentPositions, todoActions, gallery });
    await (this.runSimulation(accountBalanceHistory, changesInBalance, this.state.startDate, this.state.startMoney));
  }

  async runSimulation(accountBalanceHistory, changesInBalance, startDate, startMoney) {
    await (this.setState({simulationCounter:this.state.simulationCounter+1}))
    var simulationVSbalance = await (this.simulate(accountBalanceHistory, changesInBalance, startDate, startMoney));
    this.setState({simulationVSbalance})
  }

  async simulate(accountBalanceHistory, changesInBalance, startDate, startMoney) {
    const { simulationVSbalance, simulationCounter } = this.state;
    var ret = [];

    try {

      ////////////////////////////////////////////////////
      ////////////////////////////////////////////////////
      ////////////////////////////////////////////////////
      var startDay = startDate;
      var prevSim = startMoney;
      var prevReal = startMoney;
      var bidAskSpread = 0.0025;
      var percentOfLossStoplossLimit = -5;
      var commissionPerShare = 0.01; 
      var commissionMinimum = 5;
      var commissionFixed = 0;
      ////////////////////////////////////////////////////
      ////////////////////////////////////////////////////
      ////////////////////////////////////////////////////

      var tomorrow = (moment(new Date().getTime() + (60000 * 60 * 25)).format()).substring(0,10);
      if (simulationVSbalance && simulationVSbalance.length > 0) {
        let first = simulationVSbalance[0].date
        let last = simulationVSbalance[simulationVSbalance.length - 1].date;
        if (first != startDate)      ret = [];
        else if (last === tomorrow)  ret = simulationVSbalance.slice(0, simulationVSbalance.length - 1);
        else                         ret = simulationVSbalance.slice(0, simulationVSbalance.length - 15);
        if (ret.length > 0) {
          startDay = ret[ret.length - 1].date;
          prevSim = ret[ret.length - 1].sim;
          prevReal = ret[ret.length - 1].real;
        }
      }

      await (this.setState({loading:true}))
      var currDay = (moment(moment(startDay) + (60000 * 60 * 25)).format()).substring(0,10);    
      var counter = 0;
      let objRangeReturns = await (fetch('https://us-central1-shapira-pro.cloudfunctions.net/getRangeReturns', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'mode':'no-cors',
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({start: currDay, end: tomorrow})}));
      objRangeReturns = await (objRangeReturns.json());
      await (this.setState({loading:false}))

      while (currDay <= tomorrow && counter < 15 && this.state.simulationCounter == simulationCounter) {

        let currSim = await (this.simulateDate(
          objRangeReturns[currDay],
          prevSim, 
          changesInBalance,
          bidAskSpread, 
          percentOfLossStoplossLimit, 
          commissionPerShare, 
          commissionMinimum, 
          commissionFixed));

        
        let currReal = Boolean(accountBalanceHistory && accountBalanceHistory[currDay]) ? accountBalanceHistory[currDay] : prevReal;
        currSim = Math.round(currSim);
        currReal = Math.round(currReal);
        prevReal = currReal;
        if (currSim === prevSim)
          counter++;
        else 
          counter = 0;
        prevSim = currSim;

        ret.push(Object.assign({}, {
          date: currDay,
          sim: currSim,
          real: currReal
        }));

        this.setState({simulationVSbalance: ret});
        await (this.threadSleep(25));
        currDay = (moment(moment(currDay) + (60000 * 60 * 25)).format()).substring(0,10);
      }
    }
    catch (err) {
      console.error(err);
    }

    return ret;
  }

  threadSleep(delay) {  
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve(true);
      }, delay);
    });
  }

  async simulateDate(currDayReturns, prevSim, changesInBalance, bidAskSpread, percentOfLossStoplossLimit, commissionPerShare, commissionMinimum, commissionFixed) {

    var money = prevSim;
    if (currDayReturns.length > 0) {
      
      var dSum = 0;
      currDayReturns.forEach(item => {

        let change = 0;
        let dRatio = item.investmentRatio;
        let dPositionsStartValue = money * dRatio;
        let nCountOfShares = 0;

        if (item.data) {
            
          let dAvragePrice = (item.data.close + item.data.open) / 2;
          let dBidAskSpread = bidAskSpread * dAvragePrice * item.direction;
          nCountOfShares = Math.round(dPositionsStartValue / item.data.open) + 1;
          change = (((item.data.close - dBidAskSpread) / (item.data.open + dBidAskSpread)) * 100 - 100) * item.direction;
          if (percentOfLossStoplossLimit !== 0)
          {
            // dBidAskSpread is signed accoarding the direction!!!
            let dLongPosition_OpenToLow = (((item.data.low - dBidAskSpread) / (item.data.open + dBidAskSpread)) * 100 - 100) * 1;
            let dShortPosition_OpenToHigh = (((item.data.high - dBidAskSpread) / (item.data.open + dBidAskSpread)) * 100 - 100) * -1;
            if (((item.direction === 1) && (dLongPosition_OpenToLow <= percentOfLossStoplossLimit)) ||
                ((item.direction === -1) && (dShortPosition_OpenToHigh <= percentOfLossStoplossLimit)))
                
                change = percentOfLossStoplossLimit;
          }
        }

        change = (100 + change) / 100;
        var dTotalCommition = nCountOfShares * commissionPerShare;
        dTotalCommition = dTotalCommition < commissionMinimum ? commissionMinimum : dTotalCommition;
        dTotalCommition = commissionFixed !== 0 ? commissionFixed : dTotalCommition;
        var dPL = ((dPositionsStartValue - dTotalCommition) * change) - dTotalCommition;
        dSum += dPL;
      });
      
      money = dSum;
    }
      
    return money;
  }

  render() {
    const {simulationVSbalance, accountData, changesInBalance, currentPositions, todoActions, gallery, loading } = this.state;
    
    return (
        <body>   
          <div id="page-wrapper">
            <div id="wrapper">

              <section className="panel color1"> 

                <section className="panel">
                  <div className="inner">
                    <ul className="grid-icons three connected">
                      <li><a href="#AccountInfo" className="actions special icon fas fa-info"><span className="label">Lorem</span></a></li>
                      <li><a href="#TomorrowPositions" className="actions special icon fas fa-list"><span className="label">Ipsum</span></a></li>
                      <li><a href="#TodayPositions" className="actions special icon fas fa-pie-chart"><span className="label">Dolor</span></a></li>
                      <li><a href="#Balance" className="actions special icon fas fa-line-chart"><span className="label">Sit</span></a></li>
                      <li><a href="#Gallery" className="actions special icon far fa-image"><span className="label">Amet</span></a></li>
                      <li><a href="https://console.firebase.google.com/project/shapira-pro/database" target="_blank" className="actions special icon fa-google"><span className="label">Nullam</span></a></li>
                    </ul>
                  </div>
                </section>

                <section id="AccountInfo" className="panel">
                  <AccountInfo style={{width:500, margin:25, marginRight:75}} data={accountData}/>
                </section>

                <section id="TomorrowPositions" className="panel">
                  <TomorrowPositions style={{width:750, margin:25, marginRight:0}} data={todoActions}/>
                </section>

                <section id="Balance" className="panel">
                  <div style={{display: 'flex', flexDirection:'column', width:150, backgroundColor: '#da7620'}}>
                    <div className="field half" style={{display: 'flex', flexDirection:'column', alignItems: 'center', margin:10}}>
                      <label htmlFor="startDate">Start Date:</label>
                      <input type="text" value={this.state.startDate} onChange={e => this.setState({startDate: e.target.value})}/>
                      <label htmlFor="startDate">Start Amount:</label>
                      <input type="text" value={this.state.startMoney} onChange={e => this.setState({startMoney: e.target.value})}/>
                    </div>
                    <div className="field half" style={{display: 'flex', flexDirection:'column', alignItems: 'center', margin:10}}>
                      <button onClick={this.handleDateChange}>Run!</button>
                    </div>
                    <div className="field half" style={{display: 'flex', flexDirection:'column', alignItems: 'center', margin:10}}>
                      {Boolean(loading) && <LoadingIndicator segmentWidth={10} segmentLength={20} spacing={10}/>}
                    </div>
                  </div>           
                  <Balance  style={{width:1000, margin:20, marginRight:50}} data={simulationVSbalance}/>
                </section>

              </section>

              <section id="Gallery" className="panel">
                <Gallery gallery={gallery}/>
              </section>
                 
                <section className="panel color4-alt">
                  <div className="inner columns divided">
                    <div className="span-2">
                      <ul className="contact-icons color1">
                        <li className="icon fa-twitter"><a >@untitled-tld</a></li>
                        <li className="icon fa-facebook"><a >facebook.com/untitled</a></li>
                        <li className="icon fa-snapchat-ghost"><a >@untitled-tld</a></li>
                        <li className="icon fa-instagram"><a >@untitled-tld</a></li>
                        <li className="icon fa-medium"><a >medium.com/untitled</a></li>
                      </ul>
                    </div>
                  </div>
                </section>
                 
                <section  className="panel color2-alt">
                  <div className="inner columns aligned">
                    <div className="span-2-25">
                      <h3 className="major">Buttons</h3>
                      <ul className="actions">
                        <li><a  className="button special color2">Special</a></li>
                        <li><a  className="button">Default</a></li>
                      </ul>
                      <ul className="actions">
                        <li><a  className="button">Default</a></li>
                        <li><a  className="button large">Large</a></li>
                        <li><a  className="button small">Small</a></li>
                      </ul>
                      <ul className="actions">
                        <li><a  className="button special color2 icon fa-cog">Icon</a></li>
                        <li><a  className="button icon fa-diamond">Icon</a></li>
                      </ul>
                      <ul className="actions">
                        <li><span className="button special color2 disabled">Disabled</span></li>
                        <li><span className="button disabled">Disabled</span></li>
                      </ul>
                      <ul className="actions">
                        <li><a  className="button special color2 circle icon fa-cog">Icon</a></li>
                        <li><a  className="button circle icon fa-diamond">Icon</a></li>
                      </ul>
                    </div>
                  </div>
                </section>
    
            </div>
          </div>
        </body>
    );
  }
}

export default App;
