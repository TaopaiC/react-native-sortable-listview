import React, { Component, PropTypes } from 'react';
import {
  View,
} from 'react-native';

export const rowDataPropType = PropTypes.shape({
  data: PropTypes.object,
  section: PropTypes.any,
  index: PropTypes.any,
});

class Row extends Component {
  static propTypes = {
    activeDivider: PropTypes.element,
    active: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired,
    list: PropTypes.object.isRequired,
    hovering: PropTypes.bool.isRequired,
    rowData: rowDataPropType.isRequired,
    onRowActive: PropTypes.func.isRequired,
    onRowLayout: PropTypes.func.isRequired,
    renderRow: PropTypes.func.isRequired,
  };

  shouldComponentUpdate(props) {
    if (props.hovering !== this.props.hovering) return true;
    if (props.active !== this.props.active) return true;
    if (props.rowData.data !== this.props.rowData.data) return true;
    return false;
  }

  handleLongPress = (e) => {
    this.refs.view.measure((frameX, frameY, frameWidth, frameHeight, pageX, pageY) => {
      const layout = { frameX, frameY, frameWidth, frameHeight, pageX, pageY };
      if (this.props.list) {
        this.props.list.moveY = e.nativeEvent.pageY;
      }
      this.props.onRowActive({
        layout: layout,
        touch: e.nativeEvent,
        rowData: this.props.rowData,
      });
    });
  }
  measure() {
    return this.refs.view.measure.apply(this, Array.from(arguments));
  }
  render() {
    const row = React.cloneElement(this.props.renderRow(this.props.rowData.data, this.props.rowData.section, this.props.rowData.index, null, this.props.active), { onLongPress: this.handleLongPress, onPressOut: this.props.list.cancel });
    return (
      <View onLayout={this.props.onRowLayout} ref="view">
        {this.props.activeDivider}
        <View style={this.props.active && styles.hidden}>
          {row}
        </View>
      </View>
    );
  }
}

const styles = {
  hidden: {
    overflow: 'hidden',
    height: 1,
    opacity: 0,
  },
};

export default Row;
