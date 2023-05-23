/*global QUnit*/

sap.ui.define([
	"cohaina/datalakemanagerapp/controller/admindashboard.controller"
], function (Controller) {
	"use strict";

	QUnit.module("admindashboard Controller");

	QUnit.test("I should test the admindashboard controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
