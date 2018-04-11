import React, { Component } from 'react';
import DatePicker from 'react-datepicker';
import AmCharts from "@amcharts/amcharts3-react";
import moment from 'moment';

class TomorrowPositions extends Component {

  constructor(props) {
    super(props);

    this.chartConfig = {
        "type": "serial",
        "theme": "black",
        "marginRight": 100,
        "marginLeft": 100,
        "autoMargins": true,
        "autoMarginOffset": 20,
        "mouseWheelZoomEnabled":true,
        "dataDateFormat": "YYYY-MM-DD",
        "legend": {
            "color" : "White",
            "equalWidths": false,
            "useGraphSettings": true,
            "valueAlign": "left",
            "valueWidth": 200
        },
        "valueAxes": [{
            "id": "v1",
            "axisColor" : "White",
            "gridColor" : "White",
            "color" : "White",
            "axisAlpha": 0,
            "position": "left",
            "ignoreAxisWidth":true
        }],
        "categoryField": "date",
        "categoryAxis": {
            "axisColor" : "White",
            "gridColor" : "White",
            "color" : "White",
            "axisAlpha": 0,
            "parseDates": true,
            "dashLength": 1,
            "minorGridEnabled": true
        },
        "balloon": {
            "borderThickness": 1,
            "shadowAlpha": 0
        },
        "graphs": [{
            "id": "real",
            "balloon":{
              "adjustBorderColor":false,
              "color":"#ffffff"
            },
            "bullet": "round",
            "bulletBorderAlpha":1,
            "bulletColor": "#FFFFFF",
            "bulletSize": 5,
            "hideBulletsCount": 50,
            "lineThickness": 2,
            "title": "RealBalance",
            "useLineColorForBulletBorder": true,
            "valueField": "real",
            "legendValueText": "[[real]]$",
            "balloonText": "<span style='font-size:18px;'>[[real]]</span>"
        }, {
            "id": "sim",
            "balloon":{
              "adjustBorderColor":false,
              "color":"#ffffff"
            },
            "bullet": "round",
            "bulletBorderAlpha":1,
            "bulletSize": 5,
            "hideBulletsCount": 50,
            "lineThickness": 2,
            "lineColor" : "red",
            "title": "Simulation",
            "useLineColorForBulletBorder": true,
            "valueField": "sim",
            "legendValueText": "[[sim]]$",
            "balloonText": "<span style='font-size:18px;'>[[sim]]</span>"
        }],
     
        "chartCursor": {
            "pan": true,
            "valueLineEnabled": true,
            "valueLineBalloonEnabled": true,
            "cursorAlpha":1,
            "cursorColor":"gray",
            "limitToGraph":"g1",
            "valueLineAlpha":0.2,
            "valueZoomable":true
        }
    };
  }
   
  
  componentWillReceiveProps(nextProps) {
    const { data } = nextProps;
    this.refs.amChart.state.chart.dataProvider = data;
    this.refs.amChart.state.chart.validateData();
  }

  render() {
    const {style} = this.props;
    return (
        <div style={{display: 'flex', flexDirection:'row'}}>
            <div style={{display: 'flex', width:1000, margin:10,  alignItems: 'center', justifyContent: 'center'}}> 
                <AmCharts.React ref="amChart" style={{width:1000}} options={this.chartConfig}/>
            </div> 
        </div>
    );
  }
}

export default TomorrowPositions;
