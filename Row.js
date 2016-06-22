import React from 'react';
import {
  View,
} from 'react-native';

var Row = React.createClass({
  shouldComponentUpdate: function(props) {
    if (props.hovering !== this.props.hovering) return true;
    if (props.active !== this.props.active) return true;
    if (props.rowData.data !== this.props.rowData.data) return true;
    return false;
  },
  handleLongPress: function(e) {
    this.refs.view.measure((frameX, frameY, frameWidth, frameHeight, pageX, pageY) => {
      let layout = {frameX, frameY, frameWidth, frameHeight, pageX, pageY};
       this.props.onRowActive({
        layout: layout,
        touch: e.nativeEvent,
        rowData: this.props.rowData
      });
    });
  },
  measure: function() {
    return this.refs.view.measure.apply(this, Array.from(arguments));
  },
  render: function() {
    let layout = this.props.list.layoutMap[this.props.rowData.index];
    let activeData = this.props.list.state.active;

    let activeIndex = activeData ? Number(activeData.rowData.index) : -5;
    let shouldDisplayHovering = activeIndex !== this.props.rowData.index;
    let Row = React.cloneElement(this.props.renderRow(this.props.rowData.data, this.props.rowData.section, this.props.rowData.index, null, this.props.active), {onLongPress: this.handleLongPress, onPressOut: this.props.list.cancel});
    return <View onLayout={this.props.onRowLayout} style={this.props.active && this.props.list.state.hovering ? {height: 0, opacity: 0} : null} ref="view">
          {this.props.hovering && shouldDisplayHovering ? this.props.activeDivider : null}
          {this.props.active && this.props.list.state.hovering && this.props._legacySupport ? null : Row}
        </View>
  }
});

module.exports = Row;
