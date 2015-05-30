/*jslint white:true, nomen: true, plusplus: true */
/*global mx, define, require, browser, devel, console */
/*mendix */
/*
    MicroflowTimer
    ========================

    @file      : MicroflowTimer.js
    @version   : 2.0
    @author    : Pauline Oudeman
    @date      : Mon, 23 Feb 2015 12:26:02 GMT
    @copyright : Mendix Technology BV
	@license   : Apache License, Version 2.0, January 2004

    Documentation
    ========================
    Describe your widget here.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
require([
    'dojo/_base/declare', 'mxui/widget/_WidgetBase',
    'mxui/dom', 'dojo/dom', 'dojo/query', 'dojo/dom-prop', 'dojo/dom-geometry', 'dojo/dom-class', 'dojo/dom-style', 'dojo/dom-construct', 'dojo/_base/array', 'dojo/_base/lang', 'dojo/text'
], function (declare, _WidgetBase, dom, dojoDom, domQuery, domProp, domGeom, domClass, domStyle, domConstruct, dojoArray, lang, text) {
    'use strict';

    // Declare widget's prototype.
    return declare('MicroflowTimer.widget.MicroflowTimer', [_WidgetBase], {


        // Parameters configured in the Modeler.
        interval: 30000,
        once: false,
        startatonce: true,
        microflow: "",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handle: null,
        _contextObj: null,
        _timer: null,
        _blocked : null,

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
            console.log(this.id + '.postCreate');
        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function (obj, callback) {
            console.log(this.id + '.update');

            this._contextObj = obj;
            this._runTimer();

            callback();
        },

        // mxui.widget._WidgetBase.enable is called when the widget should enable editing. Implement to enable editing if widget is input widget.
        enable: function () {

        },

        // mxui.widget._WidgetBase.enable is called when the widget should disable editing. Implement to disable editing if widget is input widget.
        disable: function () {

        },

        // mxui.widget._WidgetBase.resize is called when the page's layout is recalculated. Implement to do sizing calculations. Prefer using CSS instead.
        resize: function (box) {

        },

        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function () {
            // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
            this._stopTimer();
        },

        _runTimer: function () {
            console.log(this.id + '._runTimer', this.interval);
            if (this.microflow !== "" && this._contextObj) {
                if (this.once) {
                    setTimeout(lang.hitch(this, this._execMf), this.interval);
                } else {
                    if (this.startatonce) {
                        this._execMf([this._contextObj.getGuid()], this.microflow);
                    }
                    this._timer = setInterval(lang.hitch(this, this._execMf), this.interval);
                }
            }
        },

        _stopTimer: function () {
            console.log(this.id + '._stopTimer');
            if (this._timer !== null) {
                clearInterval(this._timer);
                this._timer = null;
            }
        },

        _execMf: function () { 
            console.log(this.id + '._execMf');
            
            var self = this,
                guids = [this._contextObj.getGuid()],
                mf = this.microflow;
                mx.data.action({
                    params: {
                        applyto: "selection",
                        actionname: mf,
                        guids: guids
                    },
                    callback: function (result) {
                        if (!result) {
                            console.log('stopping timer');
                            self._stopTimer();
                            //this._blocked = false;
                        }
                    },
                    error: function (error) {
                        console.warn('Error executing mf: ', error);
                    }
                });
        }
    });
});
