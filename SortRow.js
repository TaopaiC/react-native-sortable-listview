import React, { Component, PropTypes } from 'react';
import {
  View,
  Animated,
} from 'react-native';
import { rowDataPropType } from './Row';

class SortRow extends Component {
  static propTypes = {
    sortRowStyle: Animated.View.propTypes.style,
    rowData: rowDataPropType.isRequired,
    pan: PropTypes.object.isRequired,
    layout: PropTypes.object.isRequired,
    wrapperLayout: PropTypes.object.isRequired,
    renderRow: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        opacity: 0.2,
        height: props.layout.frameHeight,
        overflow: 'hidden',
        backgroundColor: 'transparent',
        marginTop: props.layout.pageY - props.wrapperLayout.pageY // Account for top bar spacing
      },
    };
  }

  render() {
    return (
      <Animated.View ref="view" style={[this.state.style, this.props.sortRowStyle, this.props.pan.getLayout()]}>
        <View style={{ opacity: 0.85, flex: 1 }}>
          {this.props.renderRow(this.props.rowData.data, this.props.rowData.section, this.props.rowData.index, true)}
        </View>
      </Animated.View>
    );
  }
}

export default SortRow;
