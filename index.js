import React, { PropTypes } from 'react';
import TimerMixin from 'react-timer-mixin';
import {
  ListView,
  LayoutAnimation,
  View,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';

import Row from './Row';
import SortRow from './SortRow';

const HEIGHT = Dimensions.get('window').height;

const SortableListView = React.createClass({
  mixins: [TimerMixin],

  getInitialState: function() {
    this.state = {
      active: false,
      hovering: false,
      firstTime: false,
    };
    return this.state;
  },

  componentWillMount: function() {
    this.setOrder(this.props);
    this._ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => {
        return r1.data !== r2.data ||
          r1.active !== r2.active ||
          r1.hovering !== r2.hovering;
      },
    });

    const currentPanValue = { x: 0, y: 0 };
    this._pan = new Animated.ValueXY(currentPanValue);
    const onPanResponderMoveCb = Animated.event([null, {
      dx: this._pan.x, // x,y are Animated.Value
      dy: this._pan.y,
    }]);

    this._panResponder = PanResponder.create({
      onMoveShouldSetPanResponderCapture: (e, a) => {
        // Only capture when moving vertically, this helps for child swiper rows.
        const vy = Math.abs(a.vy);
        const vx = Math.abs(a.vx);

        return (vy) > vx  && !!this.state.active;
      },
      onPanResponderMove: (evt, gestureState) => {
        gestureState.dx = 0;
        this.moveY = gestureState.moveY;
        onPanResponderMoveCb(evt, gestureState);
      },

      onPanResponderGrant: (e, gestureState) => {
        this.moved = true;
        if (this.props.onMoveStart) this.props.onMoveStart();
        this._pan.setOffset(currentPanValue);
        this._pan.setValue(currentPanValue);
      },
      onPanResponderRelease: (e) => {
        this.moved = false;
        this.props.onMoveEnd && this.props.onMoveEnd();
        if (!this.state.active) {
          if (this.state.hovering) this.setState({ hovering: false, firstTime: false });
          return;
        }
        const itemHeight = this.state.active.layout.frameHeight;
        const fromIndex = this.order.indexOf(this.state.active.rowData.index);
        let toIndex = this.state.hovering === false ?  fromIndex : Number(this.state.hovering);
        const up = toIndex > fromIndex;
        if (up) {
          toIndex--;
        }
        if (toIndex === fromIndex) return this.setState({ active: false, hovering: false, firstTime: false });
        const args = {
          row: this.state.active.rowData,
          from: fromIndex,
          to: toIndex
        };

        if (this.props._legacySupport) {
          this.state.active = false;
          this.state.hovering = false;
        } else {
          this.setState({
            active: false,
            hovering: false,
            firstTime: false,
          });
        }
        this.props.onRowMoved && this.props.onRowMoved(args);

        const MAX_HEIGHT = Math.max(0, this.scrollContainerHeight - HEIGHT);
        if (this.scrollValue > MAX_HEIGHT) {
          this.scrollResponder.scrollTo({ y: MAX_HEIGHT });
        }
      }
    });
  },
  cancel: function() {
    if (!this.moved) {
      this.setState({
        active: false,
        hovering: false,
        firstTime: false,
      });
    }
  },
  componentDidMount: function() {
    setTimeout(() => {
      this.scrollResponder = this.refs.list.getScrollResponder();
      this.refs.wrapper.measure((frameX, frameY, frameWidth, frameHeight, pageX, pageY) => {
        const layout = { frameX, frameY, frameWidth, frameHeight, pageX, pageY };
        this.wrapperLayout = layout;
      });
    }, 1);
  },
  scrollValue: 0,
  scrollContainerHeight: HEIGHT * 1.2, // Gets calculated on scroll, but if you havent scrolled needs an initial value
  scrollAnimation: function() {
    if (this.isMounted() && this.state.active) {
      if (this.moveY === undefined) return this.requestAnimationFrame(this.scrollAnimation);

      const SCROLL_OFFSET = this.wrapperLayout.pageY;
      const moveY = this.moveY - SCROLL_OFFSET;
      const SCROLL_LOWER_BOUND = 80 + SCROLL_OFFSET;
      const SCROLL_HIGHER_BOUND = this.listLayout.height - SCROLL_LOWER_BOUND;

      const MAX_SCROLL_VALUE = this.scrollContainerHeight - HEIGHT + (this.state.active.layout.frameHeight * 2);
      const currentScrollValue = this.scrollValue;
      let newScrollValue = null;
      const SCROLL_MAX_CHANGE = 20;

      if (moveY < SCROLL_LOWER_BOUND && currentScrollValue > 0) {
        const PERCENTAGE_CHANGE = 1 - (moveY / SCROLL_LOWER_BOUND);
        newScrollValue = currentScrollValue - (PERCENTAGE_CHANGE * SCROLL_MAX_CHANGE);
        if (newScrollValue < 0) newScrollValue = 0;
      }
      if (moveY > SCROLL_HIGHER_BOUND && currentScrollValue < MAX_SCROLL_VALUE) {
        const PERCENTAGE_CHANGE = 1 - ((this.listLayout.height - moveY) / SCROLL_LOWER_BOUND);
        newScrollValue = currentScrollValue + (PERCENTAGE_CHANGE * SCROLL_MAX_CHANGE);
        if (newScrollValue > MAX_SCROLL_VALUE) newScrollValue = MAX_SCROLL_VALUE;
      }
      if (newScrollValue !== null) {
        this.scrollValue = newScrollValue;
         // this.scrollResponder.scrollWithoutAnimationTo(this.scrollValue, 0);
         this.scrollResponder.scrollTo({ y: this.scrollValue, x: 0, animated: false });
      }
      this.checkTargetElement();
      this.requestAnimationFrame(this.scrollAnimation);
    }
  },
  calculateDestinationY: function(index) {
    let i = 0;
    let x = 0;
    let row;
    const order = this.order;

    for (x = 0; x < order.length; x++) {
      const key = order[x];
      row = this.layoutMap[key];
      if (x === index) return i;
      i += row.height;
    }
    return 0;
  },
  checkTargetElement() {
    const scrollValue = this.scrollValue;
    const moveY = this.moveY;
    const targetPixel = scrollValue + moveY - this.wrapperLayout.pageY;
    let i = 0;
    let x = 0;
    let row;
    const order = this.order;
    let isLast = false;
    while (i < targetPixel) {
      const key = order[x];
      row = this.layoutMap[key];
      if (!row) {
        isLast = true;
        break;
      }
      i += row.height;
      x++;
    }
    if (!isLast) x--;
    if (this.state.firstTime || x !== this.state.hovering) {
      LayoutAnimation.easeInEaseOut();
      this.setState({
        hovering: x,
        firstTime: false,
      });
    }
  },
  handleRowActive: function(row) {
    this._pan.setValue({ x: 0, y: 0 });
    LayoutAnimation.easeInEaseOut();
    const hovering = this.order.findIndex(o => o === row.rowData.index);
    this.moved = true;
    this.setState({
      active: row,
      hovering: hovering,
      firstTime: true,
    },  this.scrollAnimation);
  },
  renderActiveDivider: function() {
    if (this.props.activeDivider) return this.props.activeDivider();
    return <View style={{ height: this.state.active ? this.state.active.layout.frameHeight : null }} />
  },
  renderRow: function({ data, active, hovering, isSortRow }, section, index, highlightfn) {

    if (isSortRow) {
      const layout = this.state.active.layout;
      const wrapperLayout = this.wrapperLayout;

      return (
        <SortRow
          key={index}
          ref={view => { this._rowRefs['ghost'] = view; }}
          renderRow={this.props.renderRow}
          sortRowStyle={this.props.sortRowStyle}
          rowData={{ data, section, index }}
          pan={this._pan}
          layout={layout}
          wrapperLayout={wrapperLayout}
        />
      );
    } else {
      return (
        <Row
          key={index}
          ref={view => { this._rowRefs[index] = view; }}
          renderRow={this.props.renderRow}
          activeDivider={hovering ? this.renderActiveDivider() : null}
          active={active}
          hovering={hovering}
          rowData={{ data, section, index }}
          onRowActive={this.handleRowActive}
          onRowLayout={layout => this.layoutMap[index] = layout.nativeEvent.layout}
          list={this}
        />
      );
    }
  },
  renderActive: function() {
    const rowData = this.state.active && this.state.active.rowData;
    if (!rowData) return;

    const index = rowData.index;
    return this.renderRow({
      ...rowData,
      isSortRow: true,
    }, 's1', index, () => {});
  },
  componentWillReceiveProps: function(props) {
    this.setOrder(props);
  },
  setOrder: function(props) {
    this.order = props.order || Object.keys(props.data) || [];
  },
  getScrollResponder: function() {
    return this.scrollResponder;
  },
  layoutMap: {},
  _rowRefs: {},

  render: function() {
    const dataKeys = Object.keys(this.props.data);
    const hoveringKey = (this.state.hovering !== false) ? this.order[this.state.hovering] : undefined;

    const newData = dataKeys.reduce((prev, dataKey) => {
      const data = this.props.data[dataKey];
      prev[dataKey] = {
        data,
        active: dataKey === (this.state.active && this.state.active.rowData.index),
        hovering: dataKey === hoveringKey,
      };
      return prev;
    }, {});
    this._ds = this._ds.cloneWithRows(newData, this.order);

    return (
      <View ref="wrapper" style={{ flex: 1 }} onLayout={()=>{}}>
        <ListView
          enableEmptySections={true}
          {...this.props}
          {...this._panResponder.panHandlers}
          ref="list"
          dataSource={this._ds}
          onScroll={e => {
            this.scrollValue = e.nativeEvent.contentOffset.y;
            if (!this._scrolling) {
              // Only cache the scroll container height at the beginning of the scroll.
              this._scrolling = true;
              this.scrollContainerHeight = e.nativeEvent.contentSize.height;
            }

            if (this.props.onScroll) this.props.onScroll(e);
          }}
          onScrollAnimationEnd={() => this._scrolling = false}
          onLayout={(e) => this.listLayout = e.nativeEvent.layout}
          scrollEnabled={!this.state.active}
          renderRow={this.renderRow}
        />
        {this.renderActive()}
      </View>
    );
  }
});

SortableListView.propTypes = {
  data: PropTypes.object,
  _legacySupport: PropTypes.bool,
  sortRowStyle: View.propTypes.style,
  activeDivider: PropTypes.func,
  renderRow: PropTypes.func,
  onMoveStart: PropTypes.func,
  onMoveEnd: PropTypes.func,
  onRowMoved: PropTypes.func,
  onScroll: PropTypes.func,
};

module.exports = SortableListView;
