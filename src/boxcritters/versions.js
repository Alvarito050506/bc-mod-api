const BoxCritters = require("./bc-site");
const moment = require("moment");
const EventHandler = require("#src/util/events");

/*
Version Format
{
    date: "yyyy-mm-dd",
    name: "",
    items: ""
}
*/
var versions = [];
var versionEvents = new EventHandler();

function GetDate() {
	return moment().format("DD-MM-YYYY");
}

function CreateVersion(name,items) {
    return { date: GetDate(), name, items };
}

function GetLatest() {
    if(versions.length==0) return;
    return versions[versions.length - 1];
}

function GetVersion(name) {
    if(versions.length==0) return;
    return versions.filter(v=>v.name==name);
}

async function CheckForNewVersion() {
	var n = await BoxCritters.GetVersion();
	var i = await BoxCritters.GetItemsFolder();
    var l = GetLatest();

    if(l != undefined){
        if(l.name == n && l.items == i) return;
        
        var newClient = l.name != n;
        var newItems = l.items != i;
        if (newClient) versionEvents.dispatchEvent("newClient", n);
        if (newItems) versionEvents.dispatchEvent("newItems", i);
    }
    
	var v = CreateVersion(n, i);
	versions.push(v);
}

module.exports = {
    versionEvents,
    CheckForNewVersion,
    GetLatest,
    GetVersion
}