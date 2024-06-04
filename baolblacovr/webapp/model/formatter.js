sap.ui.define([], function () {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue: function (sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},
		formatDate: function (oDate) {
			if (oDate && oDate !== "00000000") {
				var oYear = oDate.substring(0, 4);
				if (oYear === "9999") {
					oYear = "9998";
				}				
				// var oMonth = oDate.substring(4, 6) - 1;
				var oMonth = oDate.substring(4, 6);				
				var oDay = oDate.substring(6, 8);
				var oDate1 = new Date(oYear, oMonth, oDay);
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd/MM/YYYY"
				});
			//	return dateFormat.format(oDate1);				
				var date_temp = oDay + "/" + oMonth + "/" + oYear;
				return date_temp;
			} else if(oDate === "00000000"){
				return null;
			} else {
				return oDate;
			}
		},
		formatDateObject: function (oDate) {
			if (oDate) {
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd/MM/YYYY"
				});
                return dateFormat.format(oDate, true);	
			}
            return oDate;
		},
		concatenatNotes: function (oObject) {
			if (oObject) {
				var oConcatenatedTx;
				var i;
				for (i = 0; i < oObject.length; i++) {
					oConcatenatedTx += oObject[i] + " ";
				}
				return oConcatenatedTx;
			} else {
				return "";
			}
		},
		formatStatus: function (oStatus) {
			if(oStatus) {
				if (oStatus === "3") {
					return "Error";
				} else {
					if (oStatus === "2") {
						return "Warning";
					} else {
						if (oStatus === "1") {
							return "Success";
						}
					}
				}
			}
			return "None";
		},

		formatBoolean: function (bool, lblYes, lblNo) {
			return (bool === true) ? lblYes : lblNo;
		}
	};

});