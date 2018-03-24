import React, { Component } from 'react';
import AmCharts from "@amcharts/amcharts3-react";

class TomorrowPositions extends Component {

  constructor(props) {
    super(props);
    this.makeChartConfig = this.makeChartConfig.bind(this)
    this.state = {}
  }

  componentWillMount () {
    const { data } = this.props;
    this.makeChartConfig(data);
  }

  componentWillReceiveProps(nextProps) {
    const { data } = nextProps;
    this.makeChartConfig(data);
  }

  makeChartConfig(data) {


    var config = {
        "type": "serial",
        "theme": "black",
        "marginRight": 40,
        "marginLeft": 40,
        "autoMarginOffset": 20,
        "mouseWheelZoomEnabled":true,
        "dataDateFormat": "YYYY-MM-DD",
        "legend": {
            "equalWidths": false,
            "useGraphSettings": true,
            "valueAlign": "left",
            "valueWidth": 200
        },
        "valueAxes": [{
            "id": "v1",
            "axisAlpha": 0,
            "position": "left",
            "ignoreAxisWidth":true
        }],
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
        },
       
        "categoryField": "date",
        "categoryAxis": {
            "parseDates": true,
            "dashLength": 1,
            "minorGridEnabled": true
        },
        "dataProvider": data
    };
    

    this.setState({ config });
  }

  render() {
    const { config } = this.state
    const { style } = this.props
    
    return (
        <AmCharts.React style={style} options={config} />
    );
  }
}

export default TomorrowPositions;
