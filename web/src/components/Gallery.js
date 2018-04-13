import React, { Component } from 'react';
import DatePicker from 'react-datepicker';
import AmCharts from "@amcharts/amcharts3-react";
import moment from 'moment';

class Gallery extends Component {

  constructor(props) {
    super(props);

    this.getSpan = this.getSpan.bind(this)
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

  shouldComponentUpdate(nextProps, nextState) {
    return (this.props.gallery != nextProps.gallery)
  }
  
  render() {
    const {gallery} = this.props;

    var galleryCollection = null;
    var collections = [];
    var positions = ['top','bottom', 'center', 'left', 'right']
    var count = 0;
    var filename = "";
    let offsetPicIndex = 0;
    for (var i=0; i<gallery.length; i=offsetPicIndex) {
      
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


    return (galleryCollection);
  }
}

export default Gallery;
