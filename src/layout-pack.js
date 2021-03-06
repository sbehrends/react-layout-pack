'use strict';

var React = require('react');

var PropTypes = React.PropTypes;

var PackLayout = React.createClass({
    displayName: 'PackLayout',

    propTypes: {
        tag: PropTypes.string,
        columnWidth: PropTypes.number,
        itemMargin: PropTypes.number,
        repositionOnResize: PropTypes.bool,
        resizeThrottleTimeout: PropTypes.number,
        verticalOpticalTolerance: PropTypes.number,
        onReposition: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            tag: 'ul',
            itemMargin: 10,
            repositionOnResize: true,
            resizeThrottleTimeout: 250,
            verticalOpticalTolerance: 0
        };
    },

    getColumnArray: function() {
        var layoutWidth = this.el.offsetWidth;
        var columnWidth = this.getColumnWidth();
        var columnCount = Math.floor(layoutWidth / (columnWidth + this.props.itemMargin));
        var columns = [];

        for (var i = 0; i < columnCount; i++) {
            columns.push(this.props.itemMargin);
        }

        return columns;
    },

    reposition: function() {
        var columns = this.getColumnArray(),
            children = this.el.childNodes,
            margin = this.props.itemMargin,
            colWidth = this.getColumnWidth();

        for (var i = 0; i < children.length; i++) {
            var min = +Infinity, minIndex = 0;
            for (var c = 0; c < columns.length; c++) {
                if (columns[c] < min - this.props.verticalOpticalTolerance) {
                    min = columns[c];
                    minIndex = c;
                }
            }

            var leftPos = margin + (minIndex * (colWidth + margin * 2));
            children[i].style.left = leftPos + 'px';
            children[i].style.top = min + 'px';

            columns[minIndex] = min + children[i].offsetHeight + margin;

            var max = 0;
            for (var d = 0; d < columns.length; d++) {
                if (columns[d] > max) {
                    max = columns[d];
                }
            }
        }

        this.el = this.refs.container;
        // Old versions of React doesn't return the raw DOM node
        if (!(this.el instanceof window.Node)) {
            this.el = this.el.getDOMNode();
        }

        var calcTotalHeight = max + 'px';
        this.el.style.height = calcTotalHeight;

        if (typeof this.props.onReposition === 'function') {
            this.props.onReposition();
        }
    },

    getColumnWidth: function() {
        return this.props.columnWidth || this.el.childNodes[0].offsetWidth;
    },

    componentDidMount: function() {
        this.el = this.refs.container;

        // Old versions of React doesn't return the raw DOM node
        if (!(this.el instanceof window.Node)) {
            this.el = this.el.getDOMNode();
        }

        this.onWindowResize = throttle(this.reposition, this.props.resizeThrottleTimeout, this);

        if (this.props.repositionOnResize) {
            window.addEventListener('resize', this.onWindowResize, false);
        }

        this.reposition();
    },

    componentDidUpdate: function() {
        // When image finish loading run reposition
        this.image = this.el.querySelectorAll('img');
        for (var i = this.image.length - 1; i >= 0; i--) {
            this.image[i].onload = this.reposition;
        }

        this.reposition();
    },

    componentWillUnmount: function() {
        if (this.props.repositionOnResize) {
            window.removeEventListener('resize', this.onWindowResize, false);
        }
    },

    render: function() {
        var root = React.DOM[this.props.tag];
        var props = {
            ref: 'container',
            className: this.props.className
        };

        return root(props, this.props.children);
    }
});

function throttle(fn, threshold, context) {
    var last, deferTimer;
    return function() {
        var now = Date.now(), args = arguments;
        if (last && now < last + threshold) {
            clearTimeout(deferTimer);
            deferTimer = setTimeout(function() {
                last = now;
                fn.apply(context, args);
            }, threshold);
        } else {
            last = now;
            fn.apply(context, args);
        }
    };
}

module.exports = PackLayout;
