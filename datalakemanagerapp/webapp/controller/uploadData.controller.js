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
                var oFileUploader = oEvent.getSource();
                var file = oEvent.getParameter("files")[0];
                var token = "";                
                var form = new FormData();
          
                form.append("file", file);
                form.append("idFile", oFileUploader.getName() );
                form.append("User", 'polarissrv' );
                form.append("FilePeriod", this.byId("FilePeriod").getValue() );

                token = this.getToke();			
                
                var settings = {
                                "url": this.baseurl+"uploadfile",
                                "method": "POST",
                                "timeout": 0,
                                "headers": {								
                                    "Authorization": "Bearer "+token
                                },
                                "processData": false,
                                "contentType": false,
                                "data": form,
                                success: function(result) { },
                                error: function(e) { console.log(e.message); }
                                };
        
                $.ajax(settings);
    
            }
        });
    
    });