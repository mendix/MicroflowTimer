require([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
     "dojo/_base/lang"
], function (declare, _WidgetBase, lang) {
    "use strict";

    // Declare widget"s prototype.
    return declare("MicroflowTimer.widget.MicroflowTimer", [_WidgetBase], {

        // Parameters configured in the Modeler.
        interval: 30000,
        once: false,
        startatonce: true,
        microflow: "",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handle: null,
        _contextObj: null,
        _timer: null,
        _timeout: null,
        _timerStarted: false,

        update: function (obj, callback) {
            logger.debug(this.id + ".update");

            this._contextObj = obj;
            if (!this._timerStarted) {
                this._runTimer();
            }

            callback();
        },

        resize: function (box) {},

        uninitialize: function () {
            this._stopTimer();
        },

        _runTimer: function () {
            logger.debug(this.id + "._runTimer", this.interval);
            if (this.microflow !== "" && this._contextObj) {
                this._timerStarted = true;
                if (this.once) {
                    this._timeout = setTimeout(lang.hitch(this, this._execMf), this.interval);
                } else {
                    if (this.startatonce) {
                        this._execMf();
                    }
                    this._timer = setInterval(lang.hitch(this, this._execMf), this.interval);
                }
            }
        },

        _stopTimer: function () {
            logger.debug(this.id + "._stopTimer");
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

        _execMf: function () {
            logger.debug(this.id + "._execMf");

            if (this._contextObj && this.microflow !== "") {
              mx.data.action({
                  params: {
                      applyto: "selection",
                      actionname: this.microflow,
                      guids: [this._contextObj.getGuid()]
                  },
                  store: {
                      caller: this.mxform
                  },
                  callback: lang.hitch(this, function (result) {
                      if (!result) {
                          logger.debug(this.id + "._execMf callback, stopping timer");
                          this._stopTimer();
                      }
                  }),
                  error: function (error) {
                      console.warn("Error executing mf: ", error);
                  }
              });
            }
        }
    });
});
