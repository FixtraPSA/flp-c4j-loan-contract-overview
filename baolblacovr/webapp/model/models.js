sap.ui.define(
  ["sap/ui/model/json/JSONModel", "sap/ui/Device"],
  function (JSONModel, Device) {
    "use strict";

    return {
      createDeviceModel: function () {
        const oModel = new JSONModel(Device);
        oModel.setDefaultBindingMode("OneWay");
        return oModel;
      },

      createFLPModel: function () {
        // @ts-ignore
        const fnGetuser = jQuery.sap.getObject("sap.ushell.Container.getUser"),
          bIsShareInJamActive = fnGetuser ? fnGetuser().isJamActive() : false,
          oModel = new JSONModel({
            isShareInJamActive: bIsShareInJamActive,
          });
        oModel.setDefaultBindingMode("OneWay");
        return oModel;
      },
    };
  },
);
