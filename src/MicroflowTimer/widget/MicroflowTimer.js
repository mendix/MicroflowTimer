define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dojo/_base/lang",
    "dojo/_base/array"
], function(declare, _WidgetBase, lang, dojoArray) {
    "use strict";

    return declare("MicroflowTimer.widget.MicroflowTimer", [_WidgetBase], {

        // Parameters configured in the Modeler.
        interval: 30000,
        once: false,
        startatonce: true,
        callEvent: "", // "callMicroflow" | "callNanoflow"
        microflow: "",
        nanoflow: null,
        firstIntervalAttr: null,
        intervalAttr: null,
        timerStatusAttr: null,

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: null,
        _contextObj: null,
        _timer: null,
        _timeout: null,
        _timerStarted: false,

        postCreate: function() {
            this._handles = [];

            if(!(this.microflow && this.callEvent == "callMicroflow" || this.nanoflow.nanoflow && this.callEvent == "callNanoflow")) {
                mx.ui.error("No action specified for " + this.callEvent)
            }
        },

        update: function (obj, callback) {
            logger.debug(this.id + ".update");

            this._contextObj = obj;
            this._resetSubscriptions();

            //changes the interval to the attribute value, if set
            if (this._contextObj && this.intervalAttr) {
                this.interval = this._contextObj.get(this.intervalAttr);
            }

            if (!this._timerStarted) {
                this._runTimer();
            }

            this._executeCallback(callback, "update");
        },

        resize: function(box) {},

        uninitialize: function() {
            this._stopTimer();
        },

        _checkTimerStatus: function() {
            logger.debug(this.id + "._checkStatus");

            var running, newInterval;

            //both optional attributes are used
            if (this.intervalAttr && this.timerStatusAttr) {
                //get the running state
                running = this._contextObj.get(this.timerStatusAttr);
                //change the interval if it was set in the attribute
                newInterval = this._contextObj.get(this.intervalAttr);
                if (this.interval !== newInterval) {
                    this.interval = newInterval;
                    //stop and start the timer if it's running and will keep running
                    if (running && this._timerStarted) {
                        this._intervalChange(newInterval);
                    }
                }

                this._timerStatusChange(running);

                //just timer status is used
            } else if (this.timerStatusAttr) {
                running = this._contextObj.get(this.timerStatusAttr);
                this._timerStatusChange(running);

                //just interval is used
            } else if (this.intervalAttr) {
                newInterval = this._contextObj.get(this.intervalAttr);
                if (this.interval !== newInterval) {
                    this.interval = newInterval;
                    this._intervalChange(newInterval);
                }
            }

        },

        _timerStatusChange: function (running) {
            if (running !== this._timerStarted) {
                if (running) {
                    this._runTimer();
                } else {
                    this._stopTimer();
                }
            }
        },

        //Called when the optional timer interval attribute is changed
        _intervalChange: function (newInterval) {
            logger.debug(this.id + "._intervalChange");

            this.interval = newInterval;

            if (this._timerStarted) {
                this._stopTimer();
                this._runTimer();
            }
        },

        _runTimer: function() {
            logger.debug(this.id + "._runTimer", this.interval);
            if (this.callEvent !== "" && this._contextObj) {
                this._timerStarted = true;

                //if there's a first interval, get and use that first, then use the regular interval
                if (this.firstIntervalAttr) {
                    var firstInterval = this._contextObj.get(this.firstIntervalAttr);

                    if (this.once) {
                        this._timeout = setTimeout(lang.hitch(this, this._executeEvent), firstInterval);
                    } else {
                        if (this.startatonce) {
                            this._executeEvent();
                        }
                        this._timeout = setTimeout(lang.hitch(this, function() {
                            this._executeEvent();
                            this._timer = setInterval(lang.hitch(this, this._executeEvent), this.interval);
                        }), firstInterval);
                    }
                    //otherwise just use the regulat interval
                } else {
                    if (this.once) {
                        this._timeout = setTimeout(lang.hitch(this, this._executeEvent), this.interval);
                    } else {
                        if (this.startatonce) {
                            this._executeEvent();
                        }
                        this._timer = setInterval(lang.hitch(this, this._executeEvent), this.interval);
                    }
                }
            }
        },

        _stopTimer: function() {
            logger.debug(this.id + "._stopTimer");
            this._timerStarted = false;

            if (this._timer !== null) {
                logger.debug(this.id + "._stopTimer timer cleared");
                clearInterval(this._timer);
                this._timer = null;
            }
            if (this._timeout !== null) {
                logger.debug(this.id + "._stopTimer timeout cleared");
                clearTimeout(this._timeout);
                this._timeout = null;
            }
        },

        _executeEvent: function() {
            if(this.callEvent === "callMicroflow" && this.microflow) {
                this._execMf()
            } else if (this.callEvent === "callNanoflow" && this.nanoflow.nanoflow){
                this._executeNanoFlow()
            } else {
                return;
            }
        },

        _execMf: function() {
            logger.debug(this.id + "._execMf");
            if (!this._contextObj) {
                return;
            }

            if (this.microflow) {
                var mfObject = {
                    params: {
                        actionname: this.microflow,
                        origin: this.mxform,
                        applyto: "selection",
                        guids: [this._contextObj.getGuid()]
                    },
                    callback: lang.hitch(this, function(result) {
                        if (!result) {
                            logger.debug(this.id + "._execMf callback, stopping timer");
                            this._stopTimer();
                        }
                    }),
                    error: lang.hitch(this, function(error) {
                        logger.error(this.id + ": An error ocurred while executing microflow: ", error);
                        mx.ui.error("An error ocurred while executing microflow" + error.message);
                    })
                };
                mx.data.action(mfObject, this);
            }
        },

        _executeNanoFlow: function() {
            if (this.nanoflow.nanoflow && this.mxcontext) {
                mx.data.callNanoflow({
                    nanoflow: this.nanoflow,
                    origin: this.mxform,
                    context: this.mxcontext,
                    callback: lang.hitch(this, function(result) {
                        if (!result) {
                            logger.debug(this.id + "._executeNanoFlow callback, stopping timer");
                            this._stopTimer();
                        }
                    }),
                    error: lang.hitch(this, function(error) {
                        logger.error(this.id + ": An error ocurred while executing nanoflow: ", error);
                        mx.ui.error("An error ocurred while executing nanoflow" + error.message);
                    })
                });
            }
        },

        // Reset subscriptions.
        _resetSubscriptions: function() {
            // Release handles on previous object, if any.
            if (this._handles) {
                dojoArray.forEach(this._handles, function (handle) {
                    this.unsubscribe(handle);
                });

                this._handles = [];
            }

            // When a mendix object exists create subscribtions.
            if (this._contextObj && this.timerStatusAttr) {
                var _objectHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: lang.hitch(this, function(guid) {
                        this._checkTimerStatus();
                    })
                });

                var _attrHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.timerStatusAttr,
                    callback: lang.hitch(this, function(guid, attr, attrValue) {
                        this._checkTimerStatus();
                    })
                });

                var _attrHandle2 = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.intervalAttr,
                    callback: lang.hitch(this, function(guid, attr, attrValue) {
                        this._intervalChange();
                    })
                });

                this._handles = [_objectHandle, _attrHandle, _attrHandle2];
            }
        },

        _executeCallback: function (cb, from) {
            logger.debug(this.id + "._executeCallback" + (from ? " from " + from : ""));
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});

require(["MicroflowTimer/widget/MicroflowTimer"])
