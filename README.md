# MicroflowTimer [![Support](https://img.shields.io/badge/Mendix%20Support%3A-Platform-green.svg)](https://docs.mendix.com/community/app-store/app-store-content-support)

This widget can be used to time and execute a Microflow as long as a certain form is open. The microflow can be executed once or repeatedly, in which case it will not stop until it returns false or until the form is closed.

## Contributing

For more information on contributing to this repository visit [Contributing to a GitHub repository](https://world.mendix.com/display/howto50/Contributing+to+a+GitHub+repository)!

## Typical usage scenario

* Update a grid or object after a certain amount of time, for example a message inbox
* Close a form with a message automatically after 10 seconds
* Automatically make backup copies while the user is still editing an object.
* Open a form and directly trigger validation errors. (to achieve this, use interval: 0, execute once: true, start at once: true) (new in 1.2)

## Features and limitations

* Adds timed behavior to your applications.
* Nanoflow support starts from Mendix 7.13.1.

## Configuration

* The widget requires a dataview or template grid context. This object will be send as argument to the invoked microflow.

## Properties

* Interval (in ms): Defines how often the microflow or nanoflow is called. Note that the inteval is in milliseconds, so the default, 30000, equals 30 seconds. Note that, unless Execute Once is set to true, the microflow is invoked immediately after loading the form for the first time.
* Execute once: If true, the microflow will be invoked only once, and interval defines after how many seconds.

* Microflow: The microflow to be executed. If the microflow returns false, it will not be executed any longer until the context changes.
* Nanoflow: The nanoflow to be executed. If the nanoflow returns false, it will not be executed any longer until the context changes.
* Start at once: If true (and execute once is true), the microflow or nanoflow will be invoked the first time if the widget has loaded. If false, the microflow or nanoflow will be invoked the first time after interval has passed.
