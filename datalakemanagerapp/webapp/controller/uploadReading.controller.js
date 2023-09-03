sap.ui.define([
    "./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",	
	"sap/ui/core/message/Message",
    "sap/ui/core/date/UI5Date"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageToast, Message, UI5Date) {
        "use strict";
        var that = this;

        return Controller.extend("co.haina.datalakemanagerapp.controller.uploadReading", {
            onInit: function () {

                var oModel = new JSONModel({
                    busy: false,
                    title: this.getResourceBundle().getText("uploadreadings")                    
                });
                this.getOwnerComponent().setModel(oModel, "viewModel");
                    
                this.initMessageManager();
                var oMessageManager, oView;
                oView = this.getView();
    
                // set message model
                oMessageManager = sap.ui.getCore().getMessageManager();
                oView.setModel(oMessageManager.getMessageModel(), "message");
                oMessageManager.registerObject(oView, true);
    
            },
            onFileUpload: function(oEvent) {
                this.setViewBusy(true);
                
                var oFileUploader = oEvent.getSource();
                var file = oEvent.getParameter("files")[0];
                var form = new FormData();
                var selectedProcess = this.getView().byId('grpContingencia').getSelectedButton().getId();
                var oLoginModel = this.getLoginModel();                
                var arrSelectedProcess = selectedProcess.split('--');
                
                selectedProcess = arrSelectedProcess[arrSelectedProcess.length - 1];

                form.append("file", file);
                form.append("idFile", oFileUploader.getName() );
                form.append("User", oLoginModel.user );
                form.append("idProceso", selectedProcess );
       
                var oLoginModel = this.getLoginModel();		
                var url = oLoginModel.endpoint_backend+"uploadmanualreading";

                var settings = $.ajax({
                    context: this,
                    url: url,
                    async: false,
                    method: 'POST',
                    timeout: 0,
                    headers: { "Authorization": "Bearer "+oLoginModel.token },
                    processData: false,
                    contentType: false,
                    data: form,                       
                    success: function(result) { 
                        this.setViewBusy(false);
                        var resultJson = {"message": result["Mensaje"], "severity": result["Tipo_Mensaje"] }
                        this.showResponseMessages(resultJson);
                    }.bind(this),
                    error: function(e) { 
                        this.setViewBusy(false);
                        this.showResponseMessages(e)  
                    }.bind(this)
                });
    
            }
            
        });
    
    });