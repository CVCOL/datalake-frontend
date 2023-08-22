sap.ui.define([
    "./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",	
	"sap/ui/core/message/Message"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Message) {
        "use strict";
        var that = this;

        return Controller.extend("co.haina.datalakemanagerapp.controller.uploadData", {
            onInit: function () {

                var oModelV = new JSONModel({
                    busy: false,
                    title: "",
                    versionStatus: this.getResourceBundle().getText("status0")
                });
                this.setModel(oModelV, "modelView");
    
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
                
                if ( ( oFileUploader.getName() == "Derechoconexionunitario" || 
                       oFileUploader.getName() == "Derechoconexionunitario" ||
                       oFileUploader.getName() == "Derechoconexionunitario" ) 
                    && ( this.byId("FilePeriod").getValue() == "" ) ) {
                    this.byId("FilePeriod").setValueState("Error");
                    return;
                }else{ this.byId("FilePeriod").setValueState("None"); }

                form.append("file", file);
                form.append("idFile", oFileUploader.getName() );
                form.append("User", 'polarissrv' );
                form.append("FilePeriod", this.byId("FilePeriod").getValue() );

                var oLoginModel = this.getLoginModel();
                var url = oLoginModel.endpoint_backend+"uploadfile";

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
                        var resultJson = {"message": result["Mensaje"], "severity": "info" }
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