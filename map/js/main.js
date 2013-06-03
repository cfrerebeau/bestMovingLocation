var map;
var geocoder;
var placesService;
var directionService;
var maxIteration = 5;
var iteration = 0;
var subwayStations = [];
var businessLocationText = ["Pertrac", "Imperial College", "University College London"];
var businessLocations = [];
var qualifiedStations = [];

function initialize() {
    geocoder = new google.maps.Geocoder();
    directionService = new google.maps.DirectionsService();
    geocoder.geocode({address: "London, UK"}, createMap);


}

function createMap(results, status) {
    if (status != google.maps.GeocoderStatus.OK) {
        console.log('Geocode was not successful for the following reason: ' + status);
        return;
    }

    var mapOptions = {
        zoom: 13,
        center: results[0].geometry.location,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);

    for (var i = 0; i < businessLocationText.length; i++) {
        geocoder.geocode({address: businessLocationText[i] + " ,London, UK"}, function (r) {
            businessLocations.push(r[0]);
            createMarker(r[0]);
        });
    }
    setTimeout( function(){
        console.log(businessLocations.length + " business locations found", businessLocations);
        searchTrainStation(results[0].geometry.location);
    }, 500);



}

function nextBusinessDay() {
    var now = new Date();
    var day = now.getDay();
    var date = now.getDate();
    date = day > 4 ? date + 2 : date + 1; //get a business day in the future
    var newDate = new Date(now.setUTCDate(date));
    newDate = new Date(newDate.setUTCHours(8));
    newDate = new Date(newDate.setUTCMinutes(0));
    console.log("A future business day ", newDate);
    return newDate;

}

function calculateRouteDuration(route) {
    var duration = 0;
    for (var i = 0; i < route.legs.length; i++) {
        duration = duration + route.legs[i].duration.value;
    }

    return duration / 60.0; //in minutes
}


function searchTrainStation(location) {

    placesService = new google.maps.places.PlacesService(map);
    placesService.radarSearch(
        {
            location: location,
            radius: 10000,
            types: ["subway_station", "train_station", "transit_station"]
        }, addTrainStations);

}
function addTrainStations(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            subwayStations.push(results[i]);
        }
    }
    console.log(subwayStations.length + " stations found", subwayStations);

    detectQualifyingStation();
}


function createMarker(place) {
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });
}


function detectQualifyingStation() {

    var departureTime = nextBusinessDay();

    //for (var i = 0; i < subwayStations.length; i++) {
    for (var i = 0; i < 20; i++) {
        setTimeout( function(k){
            var station =   subwayStations[k];
            computeRoute(departureTime, station, businessLocations[0]);
        }, i * 5000, i);
    }

}

function computeRoute(departureTime, subwayStation, businessLocation){
    directionService.route({
                travelMode: google.maps.TravelMode.TRANSIT,
                origin: subwayStation.geometry.location,
                destination: businessLocation.geometry.location,
                transitOptions: {
                    departureTime: departureTime
                }
            }, function (result) {
                if (result && result.status == google.maps.DirectionsStatus.OK) {
                    var route = result.routes[0];
                    if (route != undefined) {
                        var duration = calculateRouteDuration(route);
                        console.log("duration is " + duration, route);
                        var station = route.legs[0].start_location;
                        qualifiedStations.push({location: station, duration: duration});
                        var marker = new google.maps.Marker({
                            map: map,
                            position: station
                        });
                    }
                }
            });
}


google.maps.event.addDomListener(window, 'load', initialize);