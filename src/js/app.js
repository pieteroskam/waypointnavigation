/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var Vector2 = require('vector2');
var Settings = require('settings');
var Clay = require('clay');
var clayConfig = require('config');
var clay = new Clay(clayConfig);
var options = Settings.option();
//global variables
var position;

//var waypointNumber = 0;
var routeNumber = 0;

var waypoints = [];
var waypoint = {};

//create route if not exists
if (typeof Settings.data('route') == "undefined") {
	Settings.data('route', []);
	console.log("route created");
}
//Settings.data('route')
var addRoutePoint = false;

////////////SETTINGS///////////
//////////////////////////////
Pebble.addEventListener('showConfiguration', function(e) {
	var claySettings = JSON.parse(localStorage.getItem("clay-settings"));
	for (var key in claySettings) {
		if (claySettings.hasOwnProperty(key)) {
			if(key in options){
				//console.log(key + " -> " + options[key]);
				claySettings[key] = options[key];
		}
	}
}	
	localStorage["clay-settings"] = JSON.stringify(claySettings);
  Pebble.openURL(clay.generateUrl());
	console.log("configuration shown");
});

Pebble.addEventListener('webviewclosed', function(e) {
  if (e && !e.response) {
    return;
  }
  var dict = clay.getSettings(e.response);
		
  // Save the Clay settings to the Settings module. 
  Settings.option(dict);
	options = Settings.option();
	console.log(JSON.stringify(options));
	setSettings();
});

function setSettings(){
	waypoints = [];
	for(var i=1;i<=80;i++){
		var lat = parseFloat(options["waypoint"+i+"_lat"]);
		var lon = parseFloat(options["waypoint"+i+"_lon"]);
		var name = options["waypoint"+i+"_name"];
		if(name!=='')waypoints.push({		name:name,		lat:lat,		lon:lon	});
	}
	
	
	console.log("settings set");
	
}
setSettings();

//////WAypoint WINDOW/////////
////////////////////////////
var waypointMenu = new UI.Menu({
  sections: [{
		title: 'Waypoints',
    items: waypointMenuItems
  }]
});

function waypointMenuItems(){
	console.log("bulding waypoint menu");
	var WaypointListItems = [];
	for(var i=0;i<waypoints.length;i++){
		WaypointListItems.push({title:waypoints[i].name,id:i});
		console.log(waypoints[i].name);
	}
	waypointMenu.items(0, WaypointListItems);
}
waypointMenuItems();


waypointMenu.on('select', function(e) {
	if(addRoutePoint){
		Settings.data('route').splice(routeNumber+1,0, waypoints[e.item.id]);
		routeNumber++;
		if(routeNumber>=Settings.data('route').length)routeNumber = 0;
		
		addRoutePoint = false;
		waypointMenu.hide();	
		updateRouteWindow();
	}else{
		waypoint = waypoints[e.item.id];
		updateNavigationWindow();
	}
	
});



//////ROUTE WINDOW/////////
////////////////////////////
var routeWindow = new UI.Window({ status: false,backgroundColor:'white',  action: {    up: 'images/remove.png',    down: 'images/down.png',    select: 'images/plus.png'  }});

var previousRoutePoint = new UI.Text({
  position: new Vector2(0, 0),
  size: new Vector2(144, 56),
  text: "route",
  color:'black',
  font: 'gothic-24'
});
var currentRoutePoint = new UI.Text({
  position: new Vector2(0, 57),
  size: new Vector2(144, 56),
  text: "",
  color:'white',
	backgroundColor:"black",
  font: 'gothic-24'
});
var nextRoutePoint = new UI.Text({
  position: new Vector2(0, 113),
  size: new Vector2(144, 56),
  text: "",
  color:'black',
  font: 'gothic-24'
});


routeWindow.add(previousRoutePoint);
routeWindow.add(currentRoutePoint);
routeWindow.add(nextRoutePoint);

function updateRouteWindow(){
	
	//previous
	if(routeNumber==0)previousRoutePoint.text("...");
	else previousRoutePoint.text((routeNumber)+" "+Settings.data('route')[routeNumber-1].name);
	
	//current
	console.log(Settings.data('route'));
	if(Settings.data('route').length==0)currentRoutePoint.text("route empty");
	else currentRoutePoint.text((routeNumber+1)+" "+Settings.data('route')[routeNumber].name);
	
	//next
	if(routeNumber==Settings.data('route').length-1)nextRoutePoint.text("...");
	else nextRoutePoint.text((routeNumber+2)+" "+Settings.data('route')[routeNumber+1].name);
}

//REMOVE
routeWindow.on("click",'up',function(e){
	Settings.data('route').splice(routeNumber, 1);
	updateRouteWindow();
});
//ADD
routeWindow.on("click","select",function(e){
	addRoutePoint = true;
	waypointMenu.show();
});

//NEXT
routeWindow.on("click","down",function(e){
	routeNumber++;
	if(routeNumber>=Settings.data('route').length)routeNumber = 0;
	updateRouteWindow();
});

routeWindow.on("longClick","down",function(e){
	routeNumber--;
	if(routeNumber<=0)routeNumber = Settings.data('route').length-1;
	updateRouteWindow();
});



////////////navigation///////////
//////////////////////////////
var navigationWindow = new UI.Window({ status: false,backgroundColor:'white'});

var waypointTitle = new UI.Text({
  position: new Vector2(0, 0),
  size: new Vector2(144, 35),
  text: "1",
  color:'white',
	font: 'gothic-24',
	backgroundColor: "black",
	textAlign:'left',
});

var waypointTitle = new UI.Text({
  position: new Vector2(0, 0),
  size: new Vector2(144, 35),
  text: "test",
  color:'white',
	font: 'gothic-28-bold',
	backgroundColor: "black",
	textAlign:'left',
});

var bearingText = new UI.Text({
  position: new Vector2(0, 35),
  size: new Vector2(144, 42),
  text: "",
  color:'black',
  font: 'bitham-42-bold'
	
});
var headingText = new UI.Text({
  position: new Vector2(0, 77),
  size: new Vector2(144, 42),
  text: "heading",
  color:'black',
  font: 'bitham-42-bold'
});
var distanceText = new UI.Text({
  position: new Vector2(0, 119),
  size: new Vector2(144, 42),
  text: "distance",
  color:'black',
  font: 'bitham-30-black'
});


navigationWindow.add(waypointTitle);
navigationWindow.add(bearingText);
navigationWindow.add(headingText);
navigationWindow.add(distanceText);

navigationWindow.on('click','up', function(e) {
  routeNumber--;	
	if(routeNumber<0)routeNumber=Settings.data('route').length-1;
	waypoint = Settings.data('route')[routeNumber];
	updateNavigationWindow();
});
navigationWindow.on('click','down', function(e) {
  routeNumber++;	
	if(routeNumber==Settings.data('route').length)routeNumber=0;
	waypoint = Settings.data('route')[routeNumber];
	updateNavigationWindow();
});

navigationWindow.on('click','select', function(e) {
	updateRouteWindow();
  routeWindow.show();
});

function updateNavigationWindow(){
	waypointTitle.text((routeNumber+1)+" "+waypoint.name);
	bearingText.text(calcBearing(position,waypoint)+"°");
		headingText.text(Math.round(position.coords.heading)+"°");
	distanceText.text(calcDistance(position,waypoint));
}




//////HOME WINDOW/////////
////////////////////////////
var homeWindow = new UI.Window({ status: false,backgroundColor:'white'});

homeWindow.on('click','up', function(e) {
  waypointMenu.show();
});
homeWindow.on('click','select', function(e) {
  routeWindow.show();
});
homeWindow.on('click','down', function(e) {
  navigationWindow.show();
});

//Timer options
var waypointsLink = new UI.Text({
  position: new Vector2(0, 0),
  size: new Vector2(144, 57),
  text: "Waypoints>",
	textAlign:"right",
  color:'black',
  font: 'gothic-28'
});

var routesLink = new UI.Text({
  position: new Vector2(0, 57),
  size: new Vector2(144, 57),
  text: "Route>",
	textAlign:"right",
  color:'black',
  font: 'gothic-28'
});

var navigationLink = new UI.Text({
  position: new Vector2(0, 115),
  size: new Vector2(144, 57),
  text: "Navigation>",
	textAlign:"right",
  color:'black',
  font: 'gothic-28'
});
var textAlignBug = new UI.Text({
  position: new Vector2(0, 0),
  size: new Vector2(0, 0),
	textAlign:"left",
});

homeWindow.add(routesLink);
homeWindow.add(navigationLink);
homeWindow.add(waypointsLink);
homeWindow.add(textAlignBug);


homeWindow.show();


//////GPS /////////
////////////////////////////
function newPosition(pos){
	position = pos;
	updateNavigationWindow();

}

//GETTING GPS INFO CONTINIOUSLY
var watchID;
var geoLoc;

function errorHandler(err) {  if(err.code == 1) {  homeWindow.body("Error: Access is denied!");  }
  else if( err.code == 2) {    homeWindow.body("Error: Position is unavailable!");  } 
  else{     homeWindow.body("Error: Position is unavailable!");}}


function getLocationUpdate(){
  if(navigator.geolocation){
    var options = {enableHighAccuracy: true,  timeout: 50000,  maximumAge: 2000};
    geoLoc = navigator.geolocation;
    watchID = geoLoc.watchPosition(newPosition, errorHandler, options);
    
  }  else{
    homeWindow.body("Sorry, browser does not support geolocation!");
  }
}
getLocationUpdate();

var intervalNumber = 0;
setInterval(function(){
	position = {
		coords:{
			latitude:51.9898785+intervalNumber,
			longitude:4.3511653+intervalNumber,
			heading:300.121214
		}
	};
	newPosition(position);
	intervalNumber = intervalNumber+0.0001;
}, 3000);

function calcBearing(position,waypoint){
		
		var positionLat = position.coords.latitude*0.0174532;
		var positionLon = position.coords.longitude*0.0174532;
		var waypointLat = waypoint.lat*0.0174532;
		var waypointLon = waypoint.lon*0.0174532;
		
		var dLong = waypointLon - positionLon;

		var dPhi = Math.log(Math.tan(waypointLat/2.0+Math.PI/4.0)/Math.tan(positionLat/2.0+Math.PI/4.0));
		if (Math.abs(dLong) > Math.PI){
			if 	(dLong > 0.0)dLong = -(2.0 * Math.PI - dLong);
			else dLong = (2.0 * Math.PI + dLong);
		}
		
		return Math.round(((Math.atan2(dLong, dPhi)/0.0174532) + 360) % 360);
}

function calcDistance() {
	var lat1=waypoint.lat;
	var lon1=waypoint.lon;
	var lat2=position.coords.latitude;
	var lon2=position.coords.longitude;
	
  var dLat = (lat2-lat1)*0.01745329251;  // deg2rad below
  var dLon = (lon2-lon1)*0.01745329251; 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos((lat1)*0.01745329251) * Math.cos((lat2)*0.01745329251) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = 6371000 * c; // Distance in m Radius of the earth in km


	 if(d>1000){
		 return (d/1000).toFixed(1)+"km";
	 }else{
		 return Math.round(d)+"m";
	 }
	
}