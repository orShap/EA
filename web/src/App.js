import React, { Component } from 'react';
import AccountInfo from './components/AccountInfo';
import Balance from './components/Balance';
import TomorrowPositions from './components/TomorrowPositions';

import './App.css';
import './assets/css/noscript.css'
import './assets/css/main.css'

const firebase      = require("firebase");
const moment        = require("moment-timezone");

firebase.initializeApp({
  apiKey: "AIzaSyAPxVY9M579OhCfjHPTP834q7w4xPiLLns",
  authDomain: "shapira-pro.firebaseapp.com",
  databaseURL: "https://shapira-pro.firebaseio.com",
  projectId: "shapira-pro",
  storageBucket: "shapira-pro.appspot.com",
  messagingSenderId: "813284272810"
});

class App extends Component {

  constructor(props) {
    super(props);

    this.state = { };
    this.simulateDate = this.simulateDate.bind(this)
    this.addSimulationData = this.addSimulationData.bind(this)
    this.onFirebase = this.onFirebase.bind(this)
  }

  componentDidMount() {
    firebase.database().ref('eaWebInfo/').on('value', this.onFirebase);
  }
  async onFirebase(snapshot) {
      
    var webInfo = snapshot.val();
    var simulationVSbalance = await (this.addSimulationData(webInfo.accountBalanceHistory, webInfo.changesInBalance));
    var accountData = webInfo.accountData;
    var changesInBalance = webInfo.changesInBalance;
    var currentPositions = webInfo.currentPositions;
    var todoActions = webInfo.todoActions;

    this.setState({simulationVSbalance, accountData, changesInBalance, currentPositions, todoActions});

  }

  async addSimulationData (accountBalanceHistory, changesInBalance) {
    var ret = [];

    ////////////////////////////////////////////////////
    ////////////////////////////////////////////////////
    ////////////////////////////////////////////////////
    var prevSim = 50000;
    var prevReal = 50000;
    var bidAskSpread = 0.0025;
    var percentOfLossStoplossLimit = -5;
    var commissionPerShare = 0.01; 
    var commissionMinimum = 5;
    var commissionFixed = 0;
    ////////////////////////////////////////////////////
    ////////////////////////////////////////////////////
    ////////////////////////////////////////////////////
    
    var startDay = "2017-04-01";
    var currDay = (moment.tz(moment(startDay) + (86400000), "America/New_York")).substring(0,10);
    var tomorrow = (moment.tz(new Date().getTime() + (86400000), "America/New_York")).substring(0,10);

    while (currDay <= tomorrow) {

      let currSim = await (this.simulateDate(
        currDate, 
        prevSim, 
        changesInBalance,
        bidAskSpread, 
        percentOfLossStoplossLimit, 
        commissionPerShare, 
        commissionMinimum, 
        commissionFixed));

      let currReal = Boolean(accountBalanceHistory[currDay]) ? accountBalanceHistory[currDay] : prevReal;
      prevReal = currReal;
      prevSim = currSim;

      ret.push({
        date: currDate,
        sim: currSim,
        real: currReal
      });

      currDay = (moment.tz(moment(currDay) + (86400000), "America/New_York")).substring(0,10);
    }

    return ret;
  }

  async simulateDate(currDate, prevSim, changesInBalance, bidAskSpread, percentOfLossStoplossLimit, commissionPerShare, commissionMinimum, commissionFixed) {

    try {
      var arrReturns = await (fetch('https://us-central1-shapira-pro.cloudfunctions.net/getDailyReturns', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'mode':'no-cors',
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({"date": "2017-04-04"})}));

        var money = prevSim;
        arrReturns = await (arrReturns.json());
        if (arrReturns.length > 0) {

          var dSum = 0;
          arrReturns.forEach(item =>
          {
              var dRatio = item.investmentRatio;
              var dPositionsStartValue = money * dRatio;
              var nCountOfShares = Math.round(dPositionsStartValue / item.data.open) + 1;

              var dAvragePrice = (item.data.close + item.data.open) / 2;
              var dBidAskSpread = bidAskSpread * dAvragePrice * item.direction;
              var change = (((item.data.close - dBidAskSpread) / (item.data.open + dBidAskSpread)) * 100 - 100) * item.direction;

              if (percentOfLossStoplossLimit !== 0)
              {
                  // dBidAskSpread is signed accoarding the direction!!!
                  var dLongPosition_OpenToLow = (((item.data.low - dBidAskSpread) / (item.data.open + dBidAskSpread)) * 100 - 100) * 1;
                  var dShortPosition_OpenToHigh = (((item.data.high - dBidAskSpread) / (item.data.open + dBidAskSpread)) * 100 - 100) * -1;
                  if (((item.direction === 1) && (dLongPosition_OpenToLow <= percentOfLossStoplossLimit)) ||
                      ((item.direction === -1) && (dShortPosition_OpenToHigh <= percentOfLossStoplossLimit)))
                  {
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
      }
      catch (err) {
        console.error(err);
      }
    return prevSim;
  }


  render() {
    
    const {simulationVSbalance, accountData, changesInBalance, currentPositions, todoActions} = this.state;

    return (

        <body>
          
          <div id="page-wrapper">

              <div id="wrapper">

                  <section className="panel color1">

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



                  <section id="AccountInfo" className="panel color1"> 
                  <section id="AccountInfo" className="panel">
                    <AccountInfo style={{width:1000, margin:20, marginRight:50}} data={accountData}/>
                  </section>
                  <section id="TomorrowPositions" className="panel">
                    <TomorrowPositions style={{width:750, margin:20, marginRight:0}} data={todoActions}/>
                  </section>
                  <section id="Balance" className="panel">
                    <Balance  style={{width:1000, margin:20, marginRight:50}} data={simulationVSbalance}/>
                  </section>
                  </section>

 
            
                   
                  <section className="panel">
                    <div className="intro color2">
                      <h2 className="major">Gallery</h2>
                      <p>Sed vel nibh liberetiam.</p>
                    </div>
                    <div className="gallery">
                      <div className="group span-3">
                        <a href="./gallery/fulls/01.jpg" className="image filtered span-3" data-position="bottom"><img src="./gallery/thumbs/01.jpg" alt="" /></a>
                        <a href="./gallery/fulls/02.jpg" className="image filtered span-1-5" data-position="center"><img src="./gallery/thumbs/02.jpg" alt="" /></a>
                        <a href="./gallery/fulls/03.jpg" className="image filtered span-1-5" data-position="bottom"><img src="./gallery/thumbs/03.jpg" alt="" /></a>
                      </div>
                      <a href="./gallery/fulls/04.jpg" className="image filtered span-2-5" data-position="top"><img src="./gallery/thumbs/04.jpg" alt="" /></a>
                      <div className="group span-4-5">
                        <a href="./gallery/fulls/05.jpg" className="image filtered span-3" data-position="top"><img src="./gallery/thumbs/05.jpg" alt="" /></a>
                        <a href="./gallery/fulls/06.jpg" className="image filtered span-1-5" data-position="center"><img src="./gallery/thumbs/06.jpg" alt="" /></a>
                        <a href="./gallery/fulls/07.jpg" className="image filtered span-1-5" data-position="bottom"><img src="./gallery/thumbs/07.jpg" alt="" /></a>
                        <a href="./gallery/fulls/08.jpg" className="image filtered span-3" data-position="top"><img src="./gallery/thumbs/08.jpg" alt="" /></a>
                      </div>
                      <a href="./gallery/fulls/09.jpg" className="image filtered span-2-5" data-position="right"><img src="./gallery/thumbs/09.jpg" alt="" /></a>
                    </div>
                  </section>

                   





                  <section className="panel color4-alt">
                    <div className="inner columns divided">
                      <div className="span-3-25">
                        <form method="post" action="#">
                          <div className="field half">
                            <label htmlFor="name">Name</label>
                            <input type="text" name="name" id="name" />
                          </div>
                          <div className="field half">
                            <label htmlFor="email">Email</label>
                            <input type="email" name="email" id="email" />
                          </div>
                          <div className="field">
                            <label htmlFor="message">Message</label>
                            <textarea name="message" id="message" rows="4"></textarea>
                          </div>
                          <ul className="actions">
                            <li><input type="submit" value="Send Message" className="button special" /></li>
                          </ul>
                        </form>
                      </div>
                      <div className="span-1-5">
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
