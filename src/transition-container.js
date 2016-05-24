var React = require('react');
var ReactDOM = require('react-dom');
var CSSPropertyOperations = require('react/lib/CSSPropertyOperations');
var merge = require('./utils/merge');

var TransitionContainer = React.createClass({
  displayName: 'TransitionContainer',

  propTypes: {
    children: React.PropTypes.node,
    childrenAppearStyle: React.PropTypes.object,
    childrenBaseStyle: React.PropTypes.object,
    childrenEnterStyle: React.PropTypes.object,
    childrenLeaveStyle: React.PropTypes.object,
    id: React.PropTypes.oneOfType(
      [React.PropTypes.string, React.PropTypes.number]
    ),
    onChildAppeared: React.PropTypes.func,
    onChildEntered: React.PropTypes.func,
    onChildLeft: React.PropTypes.func,
    onChildStartAppear: React.PropTypes.func,
    onChildStartEnter: React.PropTypes.func,
    onChildStartLeave: React.PropTypes.func,
  },

  componentWillMount: function () {
    this._dispatchTimeout = null;
    this._callbackTimeout = null;
    this._tick = 17;
  },

  componentWillUnmount: function () {
    clearTimeout(this._dispatchTimeout);
    clearTimeout(this._callbackTimeout);
  },

  componentWillAppear: function (callback) {
    this._transition(callback, 'appear');

    if (this.props.onChildStartAppear) {
      this.props.onChildStartAppear(this.props.id);
    }
  },

  componentDidAppear: function () {
    if (this.props.onChildAppeared) {
      this.props.onChildAppeared(this.props.id);
    }

    this._appeared = true;
  },

  componentWillEnter: function (callback) {
    this._transition(callback, 'enter');

    if (this.props.onChildStartEnter) {
      this.props.onChildStartEnter(this.props.id);
    }
  },

  componentDidEnter: function () {
    if (this.props.onChildEntered) {
      this.props.onChildEntered(this.props.id);
    }
  },

  componentWillLeave: function (callback) {
    this._transition(callback, 'leave');

    if (this.props.onChildStartLeave) {
      this.props.onChildStartLeave(this.props.id);
    }
  },

  componentDidLeave: function () {
    if (this.props.onChildLeft) this.props.onChildLeft(this.props.id);
  },

  _getTransitionProperties: function (computedStyle) {
    var properties = {};

    properties.transitionDuration = computedStyle.transitionDuration ||
      computedStyle.WebkitTransitionDuration ||
      computedStyle.MozTransitionDuration ||
      computedStyle.msTransitionDuration;

    properties.transitionDelay = computedStyle.transitionDelay ||
      computedStyle.WebkitTransitionDelay ||
      computedStyle.MozTransitionDelay ||
      computedStyle.msTransitionDelay;

    properties.transitionProperty = computedStyle.transitionProperty ||
      computedStyle.WebkitTransitionProperty ||
      computedStyle.msTransitionProperty ||
      computedStyle.MozTransitionProperty;

    return properties;
  },

  // Specs: https://www.w3.org/TR/css3-transitions/
  // A lot of assumptions could be made here, like that probably the duration
  // and delay lists are already truncated by the size of the property list
  // or that values will be returned by window.getComputedStyle in seconds,
  // but I prefer to make this function less vulnerable to changes.
  _getTransitionMaximumTime: function (property, duration, delay) {
    var durationArray = duration.split(',');
    var delayArray = delay.split(',');
    var propertyArray = property.split(',');
    var longestTime = 0;
    var re = /([0-9]*\.?[0-9]+)(m?s)/;
    var durationFactor;
    var delayFactor;
    var durationGroups;
    var delayGroups;

    for (var i = 0; i < propertyArray.length; i++) {
      durationGroups = durationArray[i].match(re);
      if (durationGroups[2] === 's') durationFactor = 1000;
      else durationFactor = 1;

      delayGroups = delayArray[i].match(re);
      if (delayGroups[2] === 's') delayFactor = 1000;
      else delayFactor = 1;

      longestTime = Math.max(
        parseFloat(
          (durationGroups[1] * durationFactor) + (delayGroups[1] * delayFactor)
        ),
        longestTime
      );
    }

    return longestTime;
  },

  _computeNewStyle: function (phase) {
    var currentStyle;
    if (phase === 'appear') currentStyle = this.props.childrenAppearStyle;
    else if (phase === 'enter') currentStyle = this.props.childrenEnterStyle;
    else currentStyle = this.props.childrenLeaveStyle;

    return merge(this.props.childrenBaseStyle, currentStyle);
  },

  _registerCallbackTimeout: function (callback, maxTransitionTime) {
    this._callbackTimeout = setTimeout(function () {
      callback();
    }, maxTransitionTime);
  },

  _transition: function (callback, phase) {
    if ((phase === 'appear' && !this.props.childrenAppearStyle) ||
        (phase === 'enter' && !this.props.childrenEnterStyle) ||
        (phase === 'leave' && !this.props.childrenLeaveStyle)) {
      callback();
    }
    else {
      this._dispatchTimeout = setTimeout(
        this._executeTransition.bind(this, callback, phase),
        this._tick
      );
    }
  },

  _executeTransition: function (callback, phase) {
    var node = ReactDOM.findDOMNode(this);

    if (!node) return;

    CSSPropertyOperations.setValueForStyles(
      node, this._computeNewStyle(phase), this
    );
    var properties = this._getTransitionProperties(getComputedStyle(node));

    var maxTransitionTime = this._getTransitionMaximumTime(
      properties.transitionProperty,
      properties.transitionDuration,
      properties.transitionDelay
    );

    this._registerCallbackTimeout(callback, maxTransitionTime);
  },

  render: function () {
    var props = {style: this.props.childrenBaseStyle};

    return (
      React.cloneElement(this.props.children, props)
    );
  },

});

module.exports = TransitionContainer;