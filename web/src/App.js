import React, { Component } from 'react';
import LazyLoad from 'react-lazyload';
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

    
    this.simulateDate = this.simulateDate.bind(this)
    this.runSimulation = this.runSimulation.bind(this)
    this.simulate = this.simulate.bind(this)
    this.onFirebase = this.onFirebase.bind(this)
    this.makeGallery = this.makeGallery.bind(this)
    this.getSpan = this.getSpan.bind(this)
    this.handleDateChange = this.handleDateChange.bind(this);

    this.state = {
      data: [],
      startDate: moment("2017-04-01").format("YYYY-MM-DD"),
      galleryCollection : []
    }
  }

  componentDidMount() {
    firebase.database().ref('eaWebInfo/').on('value', this.onFirebase);
  }

  handleDateChange() {
    const { startDate } = this.state;
    try { 
      var start = moment(startDate)
      if (!(start && start > moment("2017-04-01")))
        this.setState({err: "Start da te is not valid"});
      else {
        this.runSimulation(this.state.accountBalanceHistory, this.state.changesInBalance, startDate);
        this.setState({startDate});
      }
    }
    catch (err) {
      this.setState({err: "Start date is not valid"});
    }
  }

  async onFirebase(snapshot) {
      
    var webInfo = snapshot.val();
    var accountData = webInfo.accountData;
    var changesInBalance = webInfo.changesInBalance;
    var accountBalanceHistory = webInfo.accountBalanceHistory;
    var currentPositions = webInfo.currentPositions;
    var todoActions = webInfo.todoActions;
    var galleryCollection = this.makeGallery(webInfo.gallery);
    this.setState({simulationVSbalance, accountData, changesInBalance, accountBalanceHistory, currentPositions, todoActions, galleryCollection});
    var simulationVSbalance = await (this.runSimulation(accountBalanceHistory, changesInBalance, this.state.startDate));
  }

  async runSimulation(accountBalanceHistory, changesInBalance, startDate) {
    var simulationVSbalance = await (this.simulate(accountBalanceHistory, changesInBalance, startDate));
    this.setState({simulationVSbalance})
  }

  async simulate(accountBalanceHistory, changesInBalance, startDate) {
    const { simulationVSbalance } = this.state;
    var ret = [];
    
    try {

      ////////////////////////////////////////////////////
      ////////////////////////////////////////////////////
      ////////////////////////////////////////////////////
      var startDay = "2017-04-01";
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

      var tomorrow = (moment(new Date().getTime() + (60000 * 60 * 25)).format()).substring(0,10);
      if (simulationVSbalance && simulationVSbalance.length > 0) {
        let last = simulationVSbalance[simulationVSbalance.length - 1].date;
        if (last === tomorrow) 
          ret = simulationVSbalance.slice(0, simulationVSbalance.length - 1);
        else 
          ret = simulationVSbalance.slice(0, simulationVSbalance.length - 15);

        startDay = ret[ret.length - 1].date;
        prevSim = ret[ret.length - 1].sim;
        prevReal = ret[ret.length - 1].real;
      }

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

      while (currDay <= tomorrow && counter < 15) {

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
        await (this.delayPromise(50));
        currDay = (moment(moment(currDay) + (60000 * 60 * 25)).format()).substring(0,10);
      }
    }
    catch (err) {
      console.error(err);
    }

    return ret;
  }

  delayPromise(delay) {  

    //return a function that accepts a single variable

      //this function returns a promise.
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
      currDayReturns.forEach(item =>
      {
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
                {
                    change = percentOfLossStoplossLimit;
                }
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


  getSpan(count) {
    var threshold = count === 1 ? count : (count-1);
    var sum = 0;
    var arrToRet = [];
    
    while (sum < count) {
      let a = Math.ceil(Math.random() * threshold);
      sum += a;
      threshold = (count-sum);
      arrToRet.push("span-" + a);
    }

    return arrToRet;
  }

  makeGallery(gallery) {
    var galleryCollection = null;
    var collections = [];
    var positions = ['top','bottom', 'center', 'left', 'right']
    var count = 0;
    var filename = "";
    let offsetPicIndex = 0;
    for (var i=0; i<162; i=offsetPicIndex) {
      
      var items = [];
      count = Math.floor(Math.random() * 10);
      if (count == 0) {
        filename = gallery[offsetPicIndex];
        offsetPicIndex++;
        collections.push(React.createElement('a', { 'key':'a'+i, 'href': filename, 'className':"image filtered span-2-5", 'data-position':'center' }, [
                          React.createElement('LazyLoad', { 'key':'l'+i, 'height':'100%' }, 
                            React.createElement('img', { 'key':'i'+i, 'src': filename, 'alt':'' }, null))]))
      }
      else {
        let span1 = this.getSpan(count);
        let span2 = this.getSpan(count);

        [span1, span2].forEach(span => {
          for (var p=0; p<span.length; p++) {
            filename = gallery[offsetPicIndex];
            offsetPicIndex++;
            items.push(React.createElement('a', { 'key':'aa'+(offsetPicIndex), 'href': filename, 'className':"image filtered " + span[p], 'data-position':'center' }, [
              React.createElement('LazyLoad', { 'key':'ll'+(offsetPicIndex), 'height':'100%' }, 
                React.createElement('img', { 'key':'ii'+(offsetPicIndex), 'src': filename, 'alt':'' }, null))]))
          }
        });

        collections.push(React.createElement('div', { 'key':'d'+i, className: 'group span-' + count}, items));
      }
      
    }
    galleryCollection = React.createElement('div', { className: 'gallery' }, collections);

    return galleryCollection;
  }

  render() {
    
    const {simulationVSbalance, accountData, changesInBalance, currentPositions, todoActions, galleryCollection} = this.state;
    


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
                    <div style={{display: 'flex', flexDirection:'column', width:150, backgroundColor: '#da7620'}}>
                      <div className="field half" style={{display: 'flex', flexDirection:'column', alignItems: 'center', margin:10}}>
                        <label htmlFor="startDate">Start Date:</label>
                        <input type="text" value={this.state.startDate} onChange={(val) => this.setState({startDate : val})}/>
                      </div>
                      <div className="field half" style={{display: 'flex', flexDirection:'column', alignItems: 'center', margin:10}}>
                        <button onClick={this.handleDateChange}>Run!</button>
                      </div>
                    </div>           
                    <Balance  style={{width:1000, margin:20, marginRight:50}} data={simulationVSbalance}/>
                  </section>
                  </section>

 
            
                   
                  <section className="panel">
                    <div className="intro color2">
                      <h2 className="major">Gallery</h2>
                    </div>
        
                      
                        {galleryCollection}
    
                      
                      {Boolean(false) && 
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
                      </div>}

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
