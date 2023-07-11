/*global history */

sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/Dialog",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/core/Core",
	"sap/m/MessageBox",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV",
	"sap/ui/core/message/Message",
	"sap/ui/core/MessageType",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, History, Dialog, JSONModel, MessageToast, Core, MessageBox, Export, ExportTypeCSV, Message, MessageType, Filter,
	FilterOperator) {
	"use strict";

	const cNumberDecimal = 5,
		  cDefaultNumValue = "0.00000",
		  cBaseurl = "http://localhost:8002/"; //"https://dev-polaris-api.egehaina.com/"; 

	return Controller.extend("co.haina.datalakemanagerapp.controller.BaseController", {
		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		},

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		registerMessageManager: function(){
			this._oMessageManager = Core.getMessageManager();
			// Clear the old messages
			this._oMessageManager.removeAllMessages();
		},
		openApiLogin: function (){
			// create dialog lazily
			if (!this.oMPDialog) {
				this.oMPDialog = this.loadFragment({
					name: "co.haina.datalakemanagerapp.view.loginDataLake"
				});
			}
			this.oMPDialog.then(function (oDialog) {
				this.oDialog = oDialog;
				this.oDialog.open();
				this._oMessageManager.registerObject(this.oView.byId("formContainer"), true);
				
			}.bind(this));
		},
		apiLogin: function(){
			var loginInfo = {
				user: this.getView().byId("user").getValue(),
				password: this.getView().byId("password").getValue()
			};
			var oLoginModel = new JSONModel(loginInfo);
			this.setModel(oLoginModel, "LoginModel");
			this.getToke("");
			this.closeApiLogin();
			MessageToast.show(this.getResourceBundle().getText("userLogin"));
		},
		closeApiLogin: function () {
			this.oDialog.close();
		},
		getToke: function(iBaseurl) {
                
			if( iBaseurl === "" ){
				iBaseurl = cBaseurl;
			}
			var url = cBaseurl + 'token';			
			var oLoginModel = this.getModel("LoginModel").getData();

			var token = $.ajax({
				context: this,
				url: url,
				async: false,
				method: 'POST',
				timeout: 0,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				data: {
					"grant_type": "password",
					"username": oLoginModel.user,
					"password": oLoginModel.password,
					"token": ""
				},
				success: function(result) { this.showResponseMessages(result) },
				error: function(e) { this.showResponseMessages(e) }
			});						
			if ( typeof token.responseJSON !== 'undefined' ) {
				oLoginModel.token = token.responseJSON.access_token;
				this.setModel(oLoginModel, "LoginModel");				
			}else{
				oLoginModel.token = ""
			}

			return oLoginModel.token;
		},
		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash();
			//	oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			//if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("master", {}, true);
			}
		},

		/**
		@public
		Esta función es usada para abrir un diálogo cuando el usuario lo requiere
		*/
		crearFragment: function (data) {
			if (!this._Dialog) {
				this._Dialog = sap.ui.xmlfragment(data, this);
				this.getView().addDependent(this._Dialog);
			}
			// open value help dialog
			this._valueHelpDialog.open();
		},
		/**
		 * Abrir Fragment.
		 * @public
		 * @param {string} pFragment es Ruta.NombreFragment a abrir
		 */
		fnOpenDialog: function (pFragment) {
			this.oFragment = new Object();
			this.oFragment.view = null;

			this.fnLoadDialog(pFragment, this.oFragment);
			this.oFragment.view.open();
		},

		/**
		 * Cerrar el fragment
		 * @public
		 */
		fnCloseFragment: function () {
			this.fnCloseDialog(this.oFragment);
			delete this.oFragment;
		},

		/**
		 * Instanciar Fragment.
		 * @public
		 * @param {string} sRutaFragment es Ruta.NombreFragment a instanciar
		 * @param {object} objFragment Objeto global contenedor del fragment
		 * @returns {object}
		 */
		fnLoadDialog: function (sRutaFragment, objFragment) {
			if (objFragment.view) {
				return;
			}
			// associate controller with the fragment
			objFragment.view = sap.ui.xmlfragment(sRutaFragment, this);
			this.getView().addDependent(objFragment.view);
		},

		/**
		 * Cerrar Fragment.
		 * @public
		 * @param {object} objFragment Objeto global contenedor del fragment
		 */
		fnCloseDialog: function (objFragment) {
			objFragment.view.destroy();
		},
		formatDate: function (v) {
			jQuery.sap.require("sap.ui.core.format.DateFormat");
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "dd-MM-YYYY"
			});
			return oDateFormat.format(new Date(v));
		},		
		showResponseMessages: function (oResponse, pMessageTitleError = this.getResourceBundle().getText("errorTitleMessageBox"),
			pMessageTitleOk = this.getResourceBundle().getText("SuccessTitle")) {

			var msgType = MessageType.Error,
				MessageTitle,
				oResponseJson;

			if (oResponse === undefined) {
				return false;
			}
			
			if (typeof oResponse.headers == 'undefined' && typeof oResponse.statusText != 'undefined'){
				oResponseJson = JSON.parse('{"severity": "error", "message": "'+oResponse.statusText+'" }');
			}else{
				oResponseJson = JSON.parse(oResponse.headers["sap-message"]);
			}

			if (typeof oResponseJson != 'undefined' ) {
				
				if (oResponseJson.severity === "info") {
					msgType = MessageType.Success;
					MessageTitle = pMessageTitleOk;
				} else {
					MessageTitle = pMessageTitleError;
				}

				MessageBox.show(
					oResponseJson.message, {
						icon: oResponseJson.severity === "info" ? MessageBox.Icon.SUCCESS : MessageBox.Icon.ERROR,
						title: MessageTitle
					});

				this.addMessage(new Message({
					message: oResponseJson.message,
					type: msgType
				}));
				
				if ( typeof oResponseJson.details !== "undefined" ){
					for (var j = 0; j < oResponseJson.details.length; j++) {
						this.addMessage(new Message({
							message: oResponseJson.details[j].message,
							type: MessageType.Error
						}));
					}
				}

				return true;
			}

		},
		/**
		 * Exportar a CSV
		 * @public
		 * @param {object} JSON oModel Modelo de la tabla
		 * @param {object} oColumns Estructura de la tabla
		 * @param {string} pPath Path del modelo
		 */
		cvsDataExport: function (oModel, oColumns, pPath = "/") {

			var oExport = new Export({

				exportType: new ExportTypeCSV({
					separatorChar: "	"
				}),

				models: oModel,

				rows: {
					path: pPath
				},
				columns: oColumns
			});

			oExport.saveFile().catch(function (oError) {
				this.showGeneralError({
					oDataError: oError
				});
			}).then(function () {
				oExport.destroy();
			});
		},
		isInitialNum: function (pNumber, pDecSeparator = ".") {
			if (pNumber !== undefined) {
				pNumber = pNumber.replace(pDecSeparator, "").replace(new RegExp("0", "g"), "").trim();
			}

			return pNumber;
		},
		csv_to_Json: function (pCsv, pSeparator, pWithHeaderName = false) {
			var lines = pCsv.split("\n");
			var result = [];
			var headers = lines[0].split(pSeparator);

			if (headers.length <= 1) {
				pSeparator = ",";
				headers = lines[0].split(pSeparator);
			}

			if (headers.length <= 1) {
				pSeparator = "	";
				headers = lines[0].split(pSeparator);
			}

			if (headers.length <= 1) {
				this.addMessage(new Message({
					message: this.getResourceBundle().getText("IncorrectFileFormat"),
					type: MessageType.Error
				}));
			} else {
				for (var i = 1; i < lines.length; i++) {
					var obj = {};
					var currentline = lines[i].split(pSeparator);
					for (var j = 0; j < headers.length; j++) {
						if (pWithHeaderName === false) {
							obj[j] = currentline[j];
						} else {
							obj[headers[j]] = currentline[j];
						}
					}
					result.push(obj);
				}
				var oStringResult = JSON.stringify(result);
				var oFinalResult = JSON.parse(oStringResult.replace(/\\r/g, "")); //OBJETO JSON para guardar
			}
			return oFinalResult;
		},
		//################ Private APIs ###################
		initMessageManager() {
			sap.ui.getCore().getMessageManager().removeAllMessages();

			this.oMessageManager = sap.ui.getCore().getMessageManager();
			this.setModel(this.oMessageManager.getMessageModel(), "message");
			this.oMessageManager.registerObject(this.getView(), true);
		},
		addMessage(oMessage) {

			oMessage.target = "/Dummy";
			oMessage.processor = this.getView().getModel();
			sap.ui.getCore().getMessageManager().addMessages(oMessage);
		},
		
		formatNumberOut: function (pNumber) {
			return pNumber !== undefined ? Number(pNumber.toString().replace(".", ".")).toFixed(cNumberDecimal) : "";
		},
		formatNumberIn: function (pNumber) {
			var numberData = pNumber;
			//ajustar numero cuando se carga desde archivo CSV
			if (numberData !== undefined && numberData.toString().split(".").length > 2) {
				numberData = numberData.toString().split(".").join("");
				if (numberData.length > 5) {
					numberData = numberData.toString().replace(".", "");
					numberData = numberData.toString().substring(0, (numberData.length - 5)) + "." + numberData.toString().substring((numberData.length -
						5), numberData.length);
				}
			}

			numberData = numberData !== undefined ? Number(numberData).toFixed(cNumberDecimal) : cDefaultNumValue;
			numberData = isNaN(numberData) ? cDefaultNumValue : numberData.toString().replace(",", ".");
			return numberData;
		},
		checkNumericValue: function (pValue, pMaterial, pPlant) {
			var description = "";

			if (isNaN(Number(pValue))) {

				if (pMaterial !== undefined) {
					description = "Material: " + pMaterial + " " + this.getResourceBundle().getText("Plant") + ": " + pPlant;
				}
				this.addMessage(new Message({
					message: this.getResourceBundle().getText("ErrorNoNum") + ": " + pValue,
					description: description,
					type: MessageType.Error
				}));
				return false;
			}

			return true;
		}
	});

});