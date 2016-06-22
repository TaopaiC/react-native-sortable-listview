import React from 'react';
import {
  View,
  Animated,
} from 'react-native';

var SortRow = React.createClass({
  getInitialState: function() {
    let layout = this.props.list.state.active.layout;
    let wrapperLayout = this.props.list.wrapperLayout;

    return {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        opacity: .2,
        height: layout.frameHeight,
        overflow: 'hidden',
        backgroundColor: 'transparent',
        marginTop: layout.pageY - wrapperLayout.pageY //Account for top bar spacing
      }
    }
  },
  render: function() {
     let handlers = this.props.panResponder.panHandlers;
    return <Animated.View ref="view" style={[this.state.style, this.props.sortRowStyle, this.props.list.state.pan.getLayout()]}>
      <View style={{opacity: .85, flex: 1}}>
        {this.props.renderRow(this.props.rowData.data, this.props.rowData.section, this.props.rowData.index, true)}
      </View>
      </Animated.View>
  }
});

module.exports = SortRow;
