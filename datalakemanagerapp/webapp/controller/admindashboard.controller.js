sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("co.haina.datalakemanagerapp.controller.admindashboard", {
            onInit: function () {

            },
            onItemSelect: function (oEvent) {

                if (oEvent.getParameter("item").getProperty("key") === "rtHomeExpanded") {
                    var toolPageCurrent = this.byId("toolPage");
                    toolPageCurrent.setSideExpanded(!toolPageCurrent.getSideExpanded());
                }
    
                var router = this.getOwnerComponent().getRouter(),
                    sKey = oEvent.getParameter("item").getProperty("key"),
                    params = {},
                    aParams = {},
                    sParams,
                    sValue;
                //descomponer parametros para enviar
                if (sKey.toString().indexOf("?") > 0) {
                    sParams = sKey.toString().substring(sKey.toString().indexOf("?"), sKey.toString().length);
                    sKey = sKey.toString().replace(sParams, "");
                    aParams = sParams.split("=");
                    sValue = aParams[1];
                    sParams = aParams[0].toString().replace("?", "");
                    params[sParams] = sValue;
                }
    
                router.navTo("home"); //permite llamar varias veces el mismo routing
                if (sKey.toString() !== "")                         
                    router.navTo(sKey, params);
            },
            onCollapseExpandPress: function () {
                var oSideNavigation = this.byId("sideNavigation");
                var bExpanded = oSideNavigation.getExpanded();
    
                oSideNavigation.setExpanded(!bExpanded);
            },
    
            onHideShowSubItemPress: function () {
                var oNavListItem = this.byId("subItem3");
                oNavListItem.setVisible(!oNavListItem.getVisible());
            }
    
        });
    });
