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

        _flowRunning: false,

        postCreate: function() {
            this._handles = [];

            if(!(this.microflow && this.callEvent === "callMicroflow" || this.nanoflow.nanoflow && this.callEvent === "callNanoflow")) {
                mx.ui.error("No action specified for " + this.callEvent);
            }
        },

        update: function (obj, callback) {
            console.debug(this.id + ".update");

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
            console.debug(this.id + "._checkStatus");

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
            console.debug(this.id + "._intervalChange");

            this.interval = newInterval;

            if (this._timerStarted) {
                this._stopTimer();
                this._runTimer();
            }
        },

        _runTimer: function() {
            console.debug(this.id + "._runTimer", this.interval);
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
            console.debug(this.id + "._stopTimer");
            this._timerStarted = false;

            if (this._timer !== null) {
                console.debug(this.id + "._stopTimer timer cleared");
                clearInterval(this._timer);
                this._timer = null;
            }
            if (this._timeout !== null) {
                console.debug(this.id + "._stopTimer timeout cleared");
                clearTimeout(this._timeout);
                this._timeout = null;
            }
        },

        _executeEvent: function() {
            if (this._flowRunning === true) {
                return;
              }

              this._flowRunning = true;

            if(this.callEvent === "callMicroflow" && this.microflow) {
                this._execMf();
            } else if (this.callEvent === "callNanoflow" && this.nanoflow.nanoflow){
                this._executeNanoFlow();
            } else {
                return;
            }
        },

        _execMf: function() {
            console.debug(this.id + "._execMf");
            if (!this._contextObj) {
                return;
            }

            if (this.microflow) {
                var mfObject = {
                    params: {
                        actionname: this.microflow,
                        applyto: "selection",
                        guids: [this._contextObj.getGuid()]
                    },
                    callback: lang.hitch(this, function(result) {
                        if (!result) {
                            console.debug(this.id + "._execMf callback, stopping timer");
                            this._stopTimer();
                        }
                        this._flowRunning = false;
                    }),
                    error: lang.hitch(this, function(error) {
                        console.error(this.id + ": An error ocurred while executing microflow: ", error);
                        this._flowRunning = false;
                    })
                };

                if (!mx.version || mx.version && parseInt(mx.version.split(".")[0]) < 6) {
                    mfObject.store = {
                        caller: this.mxform
                    };
                } else {
                    mfObject.origin = this.mxform;
                }

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
                            console.debug(this.id + "._executeNanoFlow callback, stopping timer");
                            this._stopTimer();
                        }
                        this._flowRunning = false;
                    }),
                    error: lang.hitch(this, function(error) {
                        console.error(this.id + ": An error ocurred while executing nanoflow: ", error);
                        this._flowRunning = false;
                    })
                });
            }
        },

        // Reset subscriptions.
        _resetSubscriptions: function() {
            this.unsubscribeAll();

            // When a mendix object exists create subscribtions.
            if (this._contextObj && this.timerStatusAttr) {
                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: lang.hitch(this, function(guid) {
                        this._checkTimerStatus();
                    })
                });

                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.timerStatusAttr,
                    callback: lang.hitch(this, function(guid, attr, attrValue) {
                        this._checkTimerStatus();
                    })
                });

                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.intervalAttr,
                    callback: lang.hitch(this, function(guid, attr, attrValue) {
                        this._intervalChange();
                    })
                });
            }
        },

        _executeCallback: function (cb, from) {
            console.debug(this.id + "._executeCallback" + (from ? " from " + from : ""));
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});

require(["MicroflowTimer/widget/MicroflowTimer"]);
